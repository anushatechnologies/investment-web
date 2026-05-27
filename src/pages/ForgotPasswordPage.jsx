import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Phone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { firebaseSendOtp, firebaseVerifyOtp, getFirebaseIdToken, getFirebaseOtpPreflightError, getReadableFirebaseOtpError, resetRecaptcha, setupRecaptcha } from '../firebase';
import { resetPassword, sendOtp, verifyOtp, saveAuthData } from '../services/api';

const STEPS = {
  MOBILE: 1,
  OTP: 2,
  PASSWORD: 3,
  SUCCESS: 4,
};

function getReadableAuthError(err, fallbackMessage) {
  const firebaseMessage = getReadableFirebaseOtpError(err);
  if (firebaseMessage) return firebaseMessage;
  return err?.message || fallbackMessage;
}

function getPasswordStrength(password) {
  if (!password) return { label: 'Empty', score: 0 };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z\d]/.test(password)) score += 1;
  if (score <= 2) return { label: 'Weak', score };
  if (score <= 4) return { label: 'Medium', score };
  return { label: 'Strong', score };
}

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const [step, setStep] = useState(STEPS.MOBILE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [firebaseIdToken, setFirebaseIdToken] = useState('');

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const startOtpTimer = () => {
    setOtpTimer(30);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    const preflightError = getFirebaseOtpPreflightError();
    if (preflightError) {
      setError(preflightError);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendOtp(mobile, '+91', 'FORGOT_PASSWORD');
      resetRecaptcha();
      await setupRecaptcha();
      await firebaseSendOtp(`+91${mobile}`);
      startOtpTimer();
      setStep(STEPS.OTP);
    } catch (err) {
      resetRecaptcha();
      setError(getReadableAuthError(err, 'Failed to send OTP. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    setLoading(true);
    setError('');
    try {
      resetRecaptcha();
      await setupRecaptcha();
      await firebaseSendOtp(`+91${mobile}`);
      startOtpTimer();
    } catch (err) {
      resetRecaptcha();
      setError(getReadableAuthError(err, 'Failed to resend OTP.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await firebaseVerifyOtp(otp);
      const idToken = await getFirebaseIdToken();
      setFirebaseIdToken(idToken);
      const result = await verifyOtp(idToken);
      if (!result.userExists) {
        setError('No account found for this mobile number. Please sign up first.');
        return;
      }
      saveAuthData({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        role: result.role,
        userId: result.userId,
        name: result.fullName || result.name,
        email: result.email,
        user: result.user,
      });
      setStep(STEPS.PASSWORD);
    } catch (err) {
      setError(getReadableAuthError(err, 'OTP verification failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!strongPassword.test(password)) {
      setError('Password must have 8+ chars with uppercase, lowercase, number, and special character.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let idToken = firebaseIdToken;
      try {
        idToken = await getFirebaseIdToken();
        setFirebaseIdToken(idToken);
      } catch (_) { /* no-op */ }
      await resetPassword(idToken, password);
      setStep(STEPS.SUCCESS);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stepConfig = {
    [STEPS.MOBILE]: { icon: <Phone className="h-6 w-6 text-blue-600" />, title: 'Forgot Password', subtitle: 'Enter mobile number to receive OTP.' },
    [STEPS.OTP]: { icon: <KeyRound className="h-6 w-6 text-blue-600" />, title: 'Verify OTP', subtitle: `Enter OTP sent to +91 ${mobile}` },
    [STEPS.PASSWORD]: { icon: <KeyRound className="h-6 w-6 text-blue-600" />, title: 'Create New Password', subtitle: 'Set a new strong password for your account.' },
    [STEPS.SUCCESS]: { icon: <CheckCircle2 className="h-6 w-6 text-emerald-600" />, title: 'Password Reset', subtitle: 'Your password was updated successfully.' },
  };

  const current = stepConfig[step];
  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:px-6">
      <div className="w-full max-w-md overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
        <div className="relative overflow-hidden bg-slate-900 px-8 pb-6 pt-8 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.3),transparent_40%)]" />
          <div className="relative flex items-center justify-between">
            {step > STEPS.MOBILE && step < STEPS.SUCCESS ? (
              <button onClick={() => { setError(''); setStep((s) => s - 1); }} className="rounded-full p-2 transition hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : <div className="h-9 w-9" />}
            <div className="h-9 w-9" />
          </div>
          <div className="mt-6 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xl">{current.icon}</div>
          </div>
          <div className="mt-6 text-center">
            <h2 className="font-heading text-2xl font-bold">{current.title}</h2>
            <p className="mt-2 text-sm text-slate-300">{current.subtitle}</p>
          </div>
        </div>

        <div className="px-8 py-8">
          {error && <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          {step === STEPS.MOBILE && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Mobile Number</label>
                <div className="flex gap-2">
                  <div className="input-shell flex w-16 items-center justify-center bg-slate-50 font-medium text-slate-500">+91</div>
                  <input type="tel" required maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} className="input-shell flex-1" placeholder="Enter 10-digit number" autoFocus />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Send OTP</span><ArrowRight className="h-4 w-4" /></>}
              </button>
              <div className="text-center text-sm text-slate-600"><Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">Back to login</Link></div>
            </form>
          )}

          {step === STEPS.OTP && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">6-Digit OTP</label>
                <input type="text" required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className="input-shell text-center text-xl tracking-[0.5em]" placeholder="* * * * * *" autoFocus />
              </div>
              <div className="text-center">
                {otpTimer > 0 ? <span className="text-sm text-slate-400">Resend OTP in {otpTimer}s</span> : <button type="button" onClick={handleResendOtp} disabled={loading} className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50">Resend OTP</button>}
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Verify OTP</span><ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          )}

          {step === STEPS.PASSWORD && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-shell pr-11"
                    placeholder="Min 8 chars, uppercase, number, special"
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full rounded-full bg-slate-200">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          passwordStrength.label === 'Weak' ? 'bg-rose-500' : passwordStrength.label === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Strength: {passwordStrength.label}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-shell pr-11"
                    placeholder="Re-enter password"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <p className={`mt-1 text-xs ${passwordsMatch ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Reset Password</span><ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          )}

          {step === STEPS.SUCCESS && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-10 w-10" /></div>
              <h3 className="font-heading text-xl font-bold text-slate-900">Password Reset Complete</h3>
              <p className="mt-2 text-sm text-slate-500">Use your new password to sign in.</p>
              <div className="pt-6">
                <button type="button" onClick={() => navigate('/login', { replace: true })} className="btn-primary w-full">
                  <span>Go to Login</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div id="recaptcha-container" />
    </div>
  );
}

export default ForgotPasswordPage;
