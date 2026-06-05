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

function renderPinSlots(value) {
  return Array.from({ length: 4 }).map((_, index) => {
    const digit = value[index] ?? '';
    return (
      <div
        key={index}
        className={`flex h-14 w-12 items-center justify-center rounded-2xl border text-xl font-semibold transition-all md:h-16 md:w-14 ${
          digit
            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-[0_10px_24px_-18px_rgba(37,99,235,0.8)]'
            : 'border-slate-200 bg-slate-50 text-slate-300'
        }`}
      >
        {digit || '0'}
      </div>
    );
  });
}

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
      await sendOtp(mobile, '+91', 'FORGOT_PASSWORD', { useFirebase: true });
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
      const result = await verifyOtp({ idToken, type: 'FORGOT_PASSWORD' });

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
    if (mpin.length !== 4) {
      setError('MPIN must be exactly 4 digits.');
      return;
    }
    if (mpin !== mpinConfirm) {
      setError('MPINs do not match.');
      return;
    }
    const simplePatterns = ['1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '0000', '1234', '4321'];
    if (simplePatterns.includes(mpin)) {
      setError('Please choose a stronger MPIN. Avoid simple patterns like 1234 or 1111.');
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
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.14),_transparent_30%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_48%,_#f8fafc_100%)] px-4 py-10 sm:px-6">
      <div className="w-full max-w-md overflow-hidden rounded-[34px] border border-slate-200/80 bg-white/95 shadow-[0_36px_100px_-30px_rgba(15,23,42,0.25)] backdrop-blur">
        <div className="relative overflow-hidden bg-[linear-gradient(145deg,_#0d172d_0%,_#15284b_65%,_#21498d_100%)] px-8 pb-8 pt-8 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(96,165,250,0.35),transparent_38%)]" />
          <div className="relative text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-xl shadow-blue-950/20">{current.icon}</div>
            <h2 className="mt-6 font-heading text-[2rem] font-bold tracking-tight">{current.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{current.subtitle}</p>
          </div>
        </div>

        <div className="px-8 py-8">
          {error && <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm">{error}</div>}

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
            <form onSubmit={handleResetMpin} className="space-y-6">
              <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,_#fbfdff_0%,_#f3f7ff_100%)] p-5 shadow-[0_24px_48px_-34px_rgba(15,23,42,0.3)]">
                <div className="mb-5 flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Secure MPIN Reset</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Enter a fresh 4-digit MPIN and confirm it below. Typing now uses real inputs, so focus and entry should work normally.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <label className="mb-3 block text-center text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                      New 4-Digit MPIN
                    </label>
                    <div className="flex justify-center gap-2.5">{renderPinSlots(mpin)}</div>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={mpin}
                      onChange={(e) => setMpinValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      autoFocus
                      placeholder="Enter 4 digits"
                      className="mt-4 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-center text-lg font-semibold tracking-[0.32em] text-slate-900 outline-none transition placeholder:tracking-normal placeholder:text-sm placeholder:font-medium placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <label className="mb-3 block text-center text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                      Confirm New MPIN
                    </label>
                    <div className="flex justify-center gap-2.5">{renderPinSlots(mpinConfirm)}</div>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={mpinConfirm}
                      onChange={(e) => setMpinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="Re-enter 4 digits"
                      className="mt-4 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-center text-lg font-semibold tracking-[0.32em] text-slate-900 outline-none transition placeholder:tracking-normal placeholder:text-sm placeholder:font-medium placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || mpin.length !== 4 || mpinConfirm.length !== 4}
                className="btn-primary mt-4 flex w-full items-center justify-center gap-2 py-3.5 shadow-[0_22px_44px_-22px_rgba(37,99,235,0.9)] disabled:opacity-60"
              >
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
