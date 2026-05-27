import { ArrowRight, CheckCircle2, KeyRound, Loader2, Phone, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { firebaseSendOtp, firebaseVerifyOtp, getFirebaseIdToken, getFirebaseOtpPreflightError, getReadableFirebaseOtpError, resetRecaptcha, setupRecaptcha } from '../firebase';
import { saveAuthData, sendOtp, setMpin, verifyOtp } from '../services/api';

const STEPS = {
  MOBILE: 1,
  OTP: 2,
  MPIN: 3,
  SUCCESS: 4,
};

function getReadableAuthError(err, fallbackMessage) {
  const firebaseMessage = getReadableFirebaseOtpError(err);
  if (firebaseMessage) return firebaseMessage;
  return err?.message || fallbackMessage;
}

function ForgotMpinPage() {
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const [step, setStep] = useState(STEPS.MOBILE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [mpin, setMpinValue] = useState('');
  const [mpinConfirm, setMpinConfirm] = useState('');

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
      await sendOtp(mobile);
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
      setStep(STEPS.MPIN);
    } catch (err) {
      setError(getReadableAuthError(err, 'OTP verification failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetMpin = async (e) => {
    e.preventDefault();
    if (mpin.length < 4 || mpin.length > 6) {
      setError('MPIN must be 4-6 digits.');
      return;
    }
    if (mpin !== mpinConfirm) {
      setError('MPINs do not match.');
      return;
    }
    const simplePatterns = ['1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '0000', '1234', '4321', '123456', '654321'];
    if (simplePatterns.includes(mpin)) {
      setError('Please choose a stronger MPIN. Avoid simple patterns.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await setMpin(mpin);
      setStep(STEPS.SUCCESS);
    } catch (err) {
      setError(err.message || 'Failed to reset MPIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const stepConfig = {
    [STEPS.MOBILE]: { icon: <Phone className="h-6 w-6 text-blue-600" />, title: 'Forgot MPIN', subtitle: 'Enter mobile number to receive OTP.' },
    [STEPS.OTP]: { icon: <KeyRound className="h-6 w-6 text-blue-600" />, title: 'Verify OTP', subtitle: `Enter OTP sent to +91 ${mobile}` },
    [STEPS.MPIN]: { icon: <ShieldCheck className="h-6 w-6 text-blue-600" />, title: 'Set New MPIN', subtitle: 'Create and confirm your new MPIN.' },
    [STEPS.SUCCESS]: { icon: <CheckCircle2 className="h-6 w-6 text-emerald-600" />, title: 'MPIN Updated', subtitle: 'Your MPIN was updated successfully.' },
  };

  const current = stepConfig[step];

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:px-6">
      <div className="w-full max-w-md overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)]">
        <div className="relative overflow-hidden bg-slate-900 px-8 pb-6 pt-8 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.3),transparent_40%)]" />
          <div className="relative text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xl">{current.icon}</div>
            <h2 className="mt-6 font-heading text-2xl font-bold">{current.title}</h2>
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

          {step === STEPS.MPIN && (
            <form onSubmit={handleResetMpin} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">New MPIN</label>
                <input type="password" required maxLength={6} minLength={4} value={mpin} onChange={(e) => setMpinValue(e.target.value.replace(/\D/g, ''))} className="input-shell text-center text-2xl tracking-[0.5em]" placeholder="* * * *" autoFocus />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Confirm New MPIN</label>
                <input type="password" required maxLength={6} minLength={4} value={mpinConfirm} onChange={(e) => setMpinConfirm(e.target.value.replace(/\D/g, ''))} className="input-shell text-center text-2xl tracking-[0.5em]" placeholder="* * * *" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Update MPIN</span><ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          )}

          {step === STEPS.SUCCESS && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-10 w-10" /></div>
              <h3 className="font-heading text-xl font-bold text-slate-900">MPIN Reset Complete</h3>
              <p className="mt-2 text-sm text-slate-500">Use your new MPIN for secure actions.</p>
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

export default ForgotMpinPage;
