import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  Gift,
  KeyRound,
  Loader2,
  Lock,
  Phone,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User,
} from 'lucide-react';
import AuthShell from '../components/auth/AuthShell';
import {
  firebaseSendOtp,
  firebaseVerifyOtp,
  getReadableFirebaseOtpError,
  resetRecaptcha,
} from '../firebase';
import {
  hydrateInvestorSessionState,
  registerUser,
  saveAuthData,
  sendOtp,
  setMpin as apiSetMpin,
  validateReferralCode,
  verifyOtp,
} from '../services/api';
import { resolveInvestorRoute } from '../utils/onboardingRouter';

const highlights = [
  {
    title: '100% Mobile-Native & Secure',
    copy: 'Instant signup with verified mobile number and 6-digit MPIN authorization. No complicated email passwords.',
    icon: <Smartphone size={18} />,
  },
  {
    title: 'Automated 10% - 12% Monthly Returns',
    copy: 'Select your preferred investment plan and receive daily accrual and monthly payouts to your wallet.',
    icon: <BadgeCheck size={18} />,
  },
  {
    title: '5-Level Referral Network',
    copy: 'Earn up to 5% instant cash bonus plus recurring monthly commissions on your network investments.',
    icon: <Gift size={18} />,
  },
];

export default function SignupPage({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Multi-step signup: 1 = Mobile & Details, 2 = OTP & MPIN Setup
  const [step, setStep] = useState(1);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [referralValid, setReferralValid] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(true);

  // Step 2 Fields
  const [otpCode, setOtpCode] = useState('');
  const [mpin, setMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [timer, setTimer] = useState(0);

  // UI state
  const [loading, setLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-detect referral code from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref') || params.get('referral');
    if (ref) {
      setReferralCode(ref.toUpperCase().trim());
      validateReferralCode(ref).then((res) => {
        if (res?.valid) setReferralValid(true);
      }).catch(() => {});
    }
  }, [location.search]);

  // Resend Timer
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!fullName.trim()) {
      setError('Please enter your full name as per your PAN/ID document.');
      return;
    }
    if (!mobileNumber || mobileNumber.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!termsAccepted) {
      setError('Please accept the Terms & Conditions and Risk Disclosure.');
      return;
    }

    setIsSendingOtp(true);
    try {
      const fullPhoneNumber = `+91${mobileNumber}`;
      let firebaseTriggered = false;

      // 1. Trigger Firebase Phone Auth for real SMS delivery
      try {
        await firebaseSendOtp(fullPhoneNumber);
        firebaseTriggered = true;
      } catch (fbErr) {
        console.warn('[Firebase Phone Auth] Real SMS delivery notice:', fbErr);
        const readable = getReadableFirebaseOtpError(fbErr);
        if (readable) {
          setError(readable);
        }
      }

      // 2. Also notify backend
      const backendResp = await sendOtp(mobileNumber, '+91', 'REGISTRATION', { useFirebase: firebaseTriggered }).catch(() => null);

      setStep(2);
      setTimer(30);

      if (backendResp?.otp) {
        setSuccessMsg(`OTP sent to +91 ${mobileNumber}. (Dev Preview: ${backendResp.otp})`);
      } else {
        setSuccessMsg(`OTP sent to +91 ${mobileNumber}`);
      }
    } catch (err) {
      setError(err?.message || 'Failed to send OTP. Please check the mobile number.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 2: Complete Registration & Set MPIN
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!otpCode || otpCode.length < 4) {
      setError('Please enter the 6-digit OTP received on your mobile.');
      return;
    }
    if (!mpin || mpin.length !== 6) {
      setError('Please create a 6-digit Security MPIN.');
      return;
    }
    if (mpin !== confirmMpin) {
      setError('Security MPIN and Confirm MPIN do not match.');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify OTP with Firebase if active
      let firebaseIdToken = otpCode;
      try {
        const confirmation = await firebaseVerifyOtp(otpCode);
        if (confirmation?.user) {
          firebaseIdToken = await confirmation.user.getIdToken(true);
        }
      } catch (fbVerifyErr) {
        console.warn('[Firebase Verify] Using backend OTP verification fallback:', fbVerifyErr);
      }

      // 2. Submit registration
      const regResponse = await registerUser({
        fullName: fullName.trim(),
        mobileNumber: mobileNumber,
        password: `Anusha@${mpin}`, // internal secure fallback
        mpin: mpin,
        referredByCode: referralCode.trim() ? referralCode.trim().toUpperCase() : null,
        signupVerificationToken: firebaseIdToken,
        idToken: firebaseIdToken,
        termsAccepted: true,
        privacyPolicyAccepted: true,
        riskDisclosureAccepted: true,
        investorAgreementAccepted: true,
        kycConsentAccepted: true,
      });

      if (!regResponse || (!regResponse.accessToken && !regResponse.token)) {
        throw new Error(regResponse?.message || 'Registration failed.');
      }

      const token = regResponse.accessToken || regResponse.token;
      saveAuthData({
        accessToken: token,
        refreshToken: regResponse.refreshToken,
        role: 'user',
        userId: regResponse.user?.id || regResponse.userId,
        name: fullName.trim(),
        mobileNumber: mobileNumber,
        user: regResponse.user || regResponse,
      });

      // Also set the MPIN on backend if endpoint required
      try {
        await apiSetMpin(mpin);
      } catch (_) {}

      if (onLogin) onLogin('user');

      // Hydrate state and forward to KYC onboarding
      const hydrated = await hydrateInvestorSessionState().catch(() => null);
      const targetRoute = resolveInvestorRoute(hydrated || {});
      navigate(targetRoute || '/kyc', { replace: true });
    } catch (err) {
      setError(err?.message || 'Registration error. Please check the OTP or try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={step === 1 ? 'Create Investor Account' : 'Verify Mobile & Set MPIN'}
      subtitle={
        step === 1
          ? 'Join India’s premier investment platform with your mobile number'
          : `We sent a 6-digit verification code to +91 ${mobileNumber}`
      }
      highlights={highlights}
    >
      <div className="space-y-5">
        {/* Step indicator */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                step === 1
                  ? 'bg-blue-600 text-white ring-4 ring-blue-500/20'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {step > 1 ? <Check size={14} /> : '1'}
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Mobile Details</span>
          </div>
          <div className="h-[2px] w-12 bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                step === 2
                  ? 'bg-blue-600 text-white ring-4 ring-blue-500/20'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
              }`}
            >
              2
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">OTP & 6-Digit MPIN</span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-semibold">
            {error}
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
            {successMsg}
          </div>
        )}

        {/* ── STEP 1: MOBILE & DETAILS ── */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Full Name (As on PAN/ID)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Mobile Number
              </label>
              <div className="relative flex">
                <div className="inline-flex items-center gap-1 px-3 py-3 rounded-l-xl border-y border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm">
                  <Phone size={15} />
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full pl-3 pr-4 py-3 rounded-r-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold tracking-wider focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>

            {/* Referral / Sponsor Code (Optional) */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Sponsor / Referral Code (Optional)
                </label>
                {referralValid && (
                  <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Valid Code
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Gift size={18} />
                </div>
                <input
                  type="text"
                  placeholder="e.g. AT-9824"
                  value={referralCode}
                  onChange={(e) => {
                    const code = e.target.value.toUpperCase();
                    setReferralCode(code);
                    if (code.length >= 4) {
                      validateReferralCode(code)
                        .then((res) => setReferralValid(Boolean(res?.valid)))
                        .catch(() => setReferralValid(false));
                    } else {
                      setReferralValid(null);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono uppercase tracking-wider focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  I certify that I am 18+ years of age and agree to the{' '}
                  <Link to="/terms-and-conditions" target="_blank" className="text-blue-500 font-bold hover:underline">
                    Terms of Service
                  </Link>
                  ,{' '}
                  <Link to="/privacy-policy" target="_blank" className="text-blue-500 font-bold hover:underline">
                    Privacy Policy
                  </Link>
                  , and Risk Disclosures.
                </span>
              </label>
            </div>

            {/* Next Button */}
            <button
              type="submit"
              disabled={isSendingOtp || !fullName.trim() || mobileNumber.length !== 10 || !termsAccepted}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isSendingOtp ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Sending SMS OTP...</span>
                </>
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {/* ── STEP 2: OTP & MPIN SETUP ── */}
        {step === 2 && (
          <form onSubmit={handleRegister} className="space-y-4">
            {/* OTP Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  SMS Verification Code (OTP)
                </label>
                {timer > 0 ? (
                  <span className="text-xs font-semibold text-slate-400">Resend in {timer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isSendingOtp}
                    className="text-xs font-bold text-blue-500 hover:underline"
                  >
                    Resend Code
                  </button>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound size={18} />
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold tracking-[0.3em] text-center text-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>

            {/* Create 6-Digit MPIN */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Create 6-Digit Security MPIN
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  maxLength={6}
                  placeholder="••••••"
                  value={mpin}
                  onChange={(e) => setMpin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold tracking-[0.3em] text-center text-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Used for instant login and withdrawal authorizations.
              </p>
            </div>

            {/* Confirm MPIN */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Confirm 6-Digit MPIN
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <ShieldCheck size={18} />
                </div>
                <input
                  type="password"
                  required
                  maxLength={6}
                  placeholder="••••••"
                  value={confirmMpin}
                  onChange={(e) => setConfirmMpin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold tracking-[0.3em] text-center text-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center gap-1.5 transition"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button
                type="submit"
                disabled={loading || otpCode.length < 4 || mpin.length !== 6 || confirmMpin !== mpin}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account & Enter</span>
                    <Sparkles size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Existing User Login Link */}
        <div className="text-center pt-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Already have an investor account?{' '}
            <Link to="/login" className="font-bold text-blue-500 hover:text-blue-600 transition ml-1">
              Login with Mobile / MPIN
            </Link>
          </p>
        </div>

        {/* Invisible Firebase reCAPTCHA Container */}
        <div id="recaptcha-container" style={{ display: 'none' }} />
      </div>
    </AuthShell>
  );
}
