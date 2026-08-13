import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Landmark,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  firebaseSendOtp,
  firebaseVerifyOtp,
  getFirebaseIdToken,
  getFirebaseOtpPreflightError,
  getReadableFirebaseOtpError,
  resetRecaptcha,
  setupRecaptcha,
} from '../firebase';
import {
  getAccessToken,
  linkBank,
  loginWithEmail,
  registerUser,
  saveAuthData,
  sendOtp,
  setMpin,
  submitKyc,
  verifyOtp,
} from '../services/api';

/* â”€â”€â”€ Step Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const STEPS = {
  MOBILE:   1,
  OTP:      2,
  PROFILE:  3,
  PASSWORD: 4,
  LEGAL:    5,
  KYC:      6,
  BANK:     7,
  MPIN:     8,
};
const TOTAL_STEPS = 8;

/* â”€â”€â”€ IFSC â†’ Bank Name Map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const BANK_IFSC_MAP = {
  SBIN: 'State Bank of India',
  HDFC: 'HDFC Bank',
  ICIC: 'ICICI Bank',
  UTIB: 'Axis Bank',
  PUNB: 'Punjab National Bank',
  BARB: 'Bank of Baroda',
  CNRB: 'Canara Bank',
  KKBK: 'Kotak Mahindra Bank',
  INDB: 'IndusInd Bank',
  YESB: 'Yes Bank',
  IDFB: 'IDFC FIRST Bank',
  UBIN: 'Union Bank of India',
  MAHB: 'Bank of Maharashtra',
  IOBA: 'Indian Overseas Bank',
  CBIN: 'Central Bank of India',
};

/* â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function getReadableAuthError(err, fallback) {
  const fb = getReadableFirebaseOtpError(err);
  if (fb) return fb;
  return err?.message || fallback;
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

/* â”€â”€â”€ OTP Digit Boxes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function OtpBoxes({ value, onChange }) {
  const digits = Array.from({ length: 6 }).map((_, i) => value[i] || '');
  return (
    <div className="relative flex justify-center py-2">
      <div className="flex gap-2 sm:gap-3">
        {digits.map((digit, i) => {
          const isActive = value.length === i;
          const isFilled = value.length > i;
          return (
            <div
              key={i}
              className={`flex h-12 w-10 sm:h-14 sm:w-12 items-center justify-center rounded-2xl border-2 text-xl font-black transition-all duration-200 ${
                isActive
                  ? 'border-blue-600 bg-blue-50/60 text-blue-600 shadow-[0_0_16px_rgba(37,99,235,0.25)]'
                  : isFilled
                  ? 'border-blue-600/80 bg-blue-50/20 text-slate-900'
                  : 'border-slate-200 bg-slate-50/50 text-slate-400'
              }`}
            >
              {digit ||
                (isActive ? (
                  <span className="h-4 w-0.5 animate-pulse bg-blue-600" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                ))}
            </div>
          );
        })}
      </div>
      <input
        type="tel"
        inputMode="numeric"
        maxLength={6}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        autoFocus
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}

/* â”€â”€â”€ MPIN Boxes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function MpinBoxes({ value, onChange, length = 4 }) {
  const digits = Array.from({ length }).map((_, i) => value[i] || '');
  return (
    <div className="relative flex justify-center py-2">
      <div className="flex gap-3 sm:gap-4">
        {digits.map((_, i) => {
          const isActive = value.length === i;
          const isFilled = value.length > i;
          return (
            <div
              key={i}
              className={`flex h-14 w-12 sm:h-16 sm:w-14 items-center justify-center rounded-2xl border-2 text-2xl font-black transition-all duration-200 ${
                isActive
                  ? 'border-blue-600 bg-blue-50/60 text-blue-600 shadow-[0_0_16px_rgba(37,99,235,0.25)]'
                  : isFilled
                  ? 'border-blue-600 bg-blue-500/10 text-blue-600'
                  : 'border-slate-200 bg-slate-50/50 text-slate-400'
              }`}
            >
              {isFilled ? (
                <span className="h-3 w-3 rounded-full bg-blue-600" />
              ) : isActive ? (
                <span className="h-5 w-0.5 animate-pulse bg-blue-600" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-slate-300" />
              )}
            </div>
          );
        })}
      </div>
      <input
        type="tel"
        inputMode="numeric"
        maxLength={length}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, length))}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}

/* â”€â”€â”€ File Upload Field â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function FileField({ label, accept = '.pdf,.jpg,.jpeg,.png', value, onChange }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 px-4 py-3 transition hover:border-blue-400 hover:bg-blue-50/30">
        <CreditCard className="h-5 w-5 flex-shrink-0 text-slate-400" />
        <span className={`text-sm ${value ? 'font-medium text-emerald-600' : 'text-slate-500'}`}>
          {value ? `âœ“ ${value.name}` : 'Click to upload'}
        </span>
        <input
          type="file"
          accept={accept}
          onChange={(e) => onChange(e.target.files?.[0] || null)}
          className="hidden"
        />
      </label>
    </div>
  );
}

/* â”€â”€â”€ Main Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function SignupPage({ onLogin }) {
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const [step, setStep] = useState(STEPS.MOBILE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [signupMode, setSignupMode] = useState('email');
  const [mobile, setMobile] = useState('');
  const [emailForOtp, setEmailForOtp] = useState('');

  // Step 2
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [firebaseIdToken, setFirebaseIdToken] = useState('');
  const [signupVerificationToken, setSignupVerificationToken] = useState('');

  // Step 3
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');

  // Step 4
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  // Step 5
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [kycConsent, setKycConsent] = useState(false);

  // Step 6 - KYC
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panProofFile, setPanProofFile] = useState(null);
  const [aadhaarProofFile, setAadhaarProofFile] = useState(null);
  const [aadhaarBackFile, setAadhaarBackFile] = useState(null);
  const [selfieProofFile, setSelfieProofFile] = useState(null);
  const [bankPassbookFile, setBankPassbookFile] = useState(null);
  const [selfieDone, setSelfieDone] = useState(false);

  // Step 7 - Bank
  const [bankHolderName, setBankHolderName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [bankIfscCode, setBankIfscCode] = useState('');
  const [bankName, setBankName] = useState('');

  // Step 8 - MPIN
  const [mpin, setMpinValue] = useState('');
  const [mpinConfirm, setMpinConfirm] = useState('');

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startOtpTimer = () => {
    setOtpTimer(30);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleIfscChange = (val) => {
    const clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setBankIfscCode(clean);
    const prefix = clean.substring(0, 4);
    if (BANK_IFSC_MAP[prefix]) setBankName(BANK_IFSC_MAP[prefix]);
  };

  const handlePrevStep = () => {
    setError('');
    setStep((s) => Math.max(STEPS.MOBILE, s - 1));
  };

  /* â”€â”€ Step 1: Send OTP â”€â”€ */
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (signupMode === 'mobile') {
      if (mobile.length !== 10) { setError('Please enter a valid 10-digit mobile number.'); return; }
      setLoading(true); setError('');
      try {
        await sendOtp(mobile);
        const preflightError = getFirebaseOtpPreflightError();
        if (!preflightError) { resetRecaptcha(); await setupRecaptcha(); await firebaseSendOtp(`+91${mobile}`); }
        startOtpTimer();
        setStep(STEPS.OTP);
      } catch (err) {
        resetRecaptcha();
        setError(getReadableAuthError(err, 'Failed to send OTP. Please try again.'));
      } finally { setLoading(false); }
    } else {
      if (!emailForOtp || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForOtp)) { setError('Please enter a valid email address.'); return; }
      setLoading(true); setError('');
      try {
        const res = await import('../services/api').then((api) => api.sendEmailOtp(emailForOtp));
        if (res?.otp && res.emailSent === false) setError(`Email service inactive. Your OTP is: ${res.otp}`);
        startOtpTimer();
        setStep(STEPS.OTP);
      } catch (err) {
        setError(err.message || 'Failed to send OTP. Please try again.');
      } finally { setLoading(false); }
    }
  };

  /* â”€â”€ Step 1: Resend OTP â”€â”€ */
  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    setLoading(true); setError('');
    if (signupMode === 'mobile') {
      const preflightError = getFirebaseOtpPreflightError();
      if (preflightError) { setError(preflightError); setLoading(false); return; }
      try { resetRecaptcha(); await setupRecaptcha(); await firebaseSendOtp(`+91${mobile}`); startOtpTimer(); }
      catch (err) { resetRecaptcha(); setError(getReadableAuthError(err, 'Failed to resend OTP.')); }
      finally { setLoading(false); }
    } else {
      try {
        const res = await import('../services/api').then((api) => api.sendEmailOtp(emailForOtp));
        if (res?.otp && res.emailSent === false) setError(`Email service inactive. OTP: ${res.otp}`);
        startOtpTimer();
      } catch (err) { setError(err.message || 'Failed to resend OTP.'); }
      finally { setLoading(false); }
    }
  };

  /* â”€â”€ Step 2: Verify OTP â”€â”€ */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) { setError('Please enter the 6-digit OTP.'); return; }
    setLoading(true); setError('');
    try {
      let result;
      if (signupMode === 'mobile') {
        await firebaseVerifyOtp(otp);
        const idToken = await getFirebaseIdToken();
        setFirebaseIdToken(idToken);
        result = await verifyOtp(idToken);
      } else {
        const { verifyEmailOtp } = await import('../services/api');
        result = await verifyEmailOtp(emailForOtp, otp);
      }

      if (result.userExists) {
        saveAuthData({
          accessToken: result.accessToken, refreshToken: result.refreshToken,
          role: result.role, userId: result.userId,
          onboardingStatus: result.onboardingStatus, kycStatus: result.kycStatus,
          bankVerified: result.bankVerified, mpinCreated: result.mpinCreated,
          accountStatus: result.accountStatus,
          name: result.fullName || result.name,
          email: result.email || emailForOtp,
          mobileNumber: mobile || result.mobileNumber,
          user: result.user,
        });
        const role = result.role?.toLowerCase() === 'admin' || result.role?.toLowerCase() === 'super_admin' ? 'admin' : 'user';
        if (onLogin) onLogin(role);
        navigate(role === 'admin' ? '/admin' : '/', { replace: true });
      } else {
        setSignupVerificationToken(result.signupVerificationToken || result.verificationToken || result.token || '');
        if (signupMode === 'email') setEmail(emailForOtp);
        setStep(STEPS.PROFILE);
      }
    } catch (err) {
      setError(getReadableAuthError(err, 'Invalid OTP. Please try again.'));
    } finally { setLoading(false); }
  };

  /* â”€â”€ Step 3: Profile â”€â”€ */
  const handleProfileStep = (e) => {
    e.preventDefault();
    if (!fullName.trim()) { setError('Please enter your full name.'); return; }
    if (!dateOfBirth) { setError('Please enter your Date of Birth.'); return; }
    if (!address.trim()) { setError('Please enter your residential address.'); return; }
    setError('');
    setStep(STEPS.PASSWORD);
  };

  /* â”€â”€ Step 4: Password â”€â”€ */
  const handlePasswordStep = (e) => {
    e.preventDefault();
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(password)) {
      setError('Password must be 8+ chars with uppercase, lowercase, number, and special character.'); return;
    }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setError('');
    setStep(STEPS.LEGAL);
  };

  /* â”€â”€ Step 5: Legal + Register â”€â”€ */
  const handleLegalAndRegister = async (e) => {
    e.preventDefault();
    if (!termsAccepted || !privacyAccepted || !kycConsent) { setError('Please accept all required agreements.'); return; }
    setLoading(true); setError('');
    try {
      let idToken = firebaseIdToken;
      try { idToken = await getFirebaseIdToken(); setFirebaseIdToken(idToken); } catch (_) {}

      await registerUser({
        idToken, signupVerificationToken, fullName, address, dateOfBirth,
        email: signupMode === 'email' ? emailForOtp : (email || '').trim(),
        mobileNumber: mobile, password,
        referredByCode: referralCode || null,
        termsAccepted, privacyPolicyAccepted: privacyAccepted,
        kycConsentAccepted: kycConsent,
        riskDisclosureAccepted: true, investorAgreementAccepted: true,
      });

      let loginResult;
      try {
        loginResult = await loginWithEmail(signupMode === 'email' ? emailForOtp : (email || '').trim() || mobile, password);
      } catch (_) {
        try { loginResult = await loginWithEmail(mobile, password); }
        catch (fe) { throw new Error('Account created but auto-login failed. Please log in manually.'); }
      }

      saveAuthData({
        accessToken: loginResult.accessToken, refreshToken: loginResult.refreshToken,
        role: loginResult.role, userId: loginResult.userId,
        onboardingStatus: loginResult.onboardingStatus, kycStatus: loginResult.kycStatus,
        bankVerified: loginResult.bankVerified, mpinCreated: loginResult.mpinCreated,
        accountStatus: loginResult.accountStatus,
        name: loginResult.fullName || loginResult.name || fullName,
        email: loginResult.email || email || emailForOtp,
        mobileNumber: mobile, user: loginResult.user,
      });

      if (fullName) setBankHolderName(fullName);
      setStep(STEPS.KYC);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  /* â”€â”€ Step 6: KYC â”€â”€ */
  const handleKycStep = async (e) => {
    e.preventDefault();
    const pan = panNumber.trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) { setError('Please enter valid PAN (e.g. ABCDE1234F).'); return; }
    if (!/^\d{12}$/.test(aadhaarNumber)) { setError('Please enter a valid 12-digit Aadhaar number.'); return; }
    if (!panProofFile) { setError('Please upload your PAN card image.'); return; }
    if (!aadhaarProofFile) { setError('Please upload Aadhaar front image.'); return; }
    if (!aadhaarBackFile) { setError('Please upload Aadhaar back image.'); return; }
    if (!selfieProofFile) { setError('Please upload your selfie photo.'); return; }
    if (!bankPassbookFile) { setError('Please upload bank passbook or statement.'); return; }
    if (!selfieDone) { setError('Please confirm your selfie/liveness step.'); return; }

    setLoading(true); setError('');
    try {
      await submitKyc({
        panCardImage: panProofFile, aadhaarFrontImage: aadhaarProofFile,
        aadhaarBackImage: aadhaarBackFile, selfiePhoto: selfieProofFile,
        bankPassbookOrStatement: bankPassbookFile,
        panNumber: pan, aadhaarLast4: aadhaarNumber.slice(-4),
        dateOfBirth, address,
      });
      saveAuthData({ kycStatus: 'PENDING' });
      setStep(STEPS.BANK);
    } catch (err) {
      setError(err.message || 'Failed to submit KYC. Please try again.');
    } finally { setLoading(false); }
  };

  /* â”€â”€ Step 7: Bank â”€â”€ */
  const handleBankStep = async (e) => {
    e.preventDefault();
    if (!bankHolderName.trim()) { setError('Please enter account holder name.'); return; }
    if (!bankAccountNumber || bankAccountNumber.length < 9) { setError('Please enter a valid bank account number.'); return; }
    if (bankAccountNumber !== confirmAccountNumber) { setError('Account numbers do not match.'); return; }
    if (!bankIfscCode || bankIfscCode.length < 11) { setError('Please enter a valid 11-character IFSC code.'); return; }
    if (!bankName.trim()) { setError('Please enter bank name.'); return; }

    setLoading(true); setError('');
    try {
      await linkBank({ accountHolderName: bankHolderName, bankAccountNumber, confirmBankAccountNumber: confirmAccountNumber, bankIfscCode, bankName });
      saveAuthData({ bankVerified: true });
      setStep(STEPS.MPIN);
    } catch (err) {
      setError(err.message || 'Failed to link bank account. Please try again.');
    } finally { setLoading(false); }
  };

  /* â”€â”€ Step 8: MPIN â”€â”€ */
  const handleSetMpin = async (e) => {
    e.preventDefault();
    if (mpin.length < 4 || mpin.length > 6) { setError('MPIN must be 4-6 digits.'); return; }
    if (mpin !== mpinConfirm) { setError('MPINs do not match.'); return; }
    const simple = ['1111','2222','3333','4444','5555','6666','7777','8888','9999','0000','1234','4321','123456','654321'];
    if (simple.includes(mpin)) { setError('Please choose a stronger MPIN. Avoid simple patterns.'); return; }

    setLoading(true); setError('');
    try {
      const response = await setMpin(mpin);
      saveAuthData({
        accessToken: getAccessToken(), name: fullName,
        email: email || emailForOtp, mobileNumber: mobile,
        bankName, bankAccountNumber,
        onboardingStatus: response.onboardingStatus || 'ACTIVE',
        kycStatus: response.kycStatus || 'PENDING',
        bankVerified: response.bankVerified ?? true,
        mpinCreated: response.mpinCreated ?? true,
        accountStatus: response.accountStatus || 'ACTIVE',
      });
      if (onLogin) onLogin('user');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to set MPIN. Please try again.');
    } finally { setLoading(false); }
  };

  /* â”€â”€ Step UI Config â”€â”€ */
  const stepConfig = {
    [STEPS.MOBILE]:   { icon: signupMode === 'email' ? <Mail className="h-6 w-6 text-blue-600" /> : <Phone className="h-6 w-6 text-blue-600" />, title: 'Create Account', subtitle: 'Enter your mobile or email to get started.' },
    [STEPS.OTP]:      { icon: <KeyRound className="h-6 w-6 text-blue-600" />, title: 'Verify OTP', subtitle: `Enter the 6-digit OTP sent to ${signupMode === 'email' ? emailForOtp : `+91 ${mobile}`}` },
    [STEPS.PROFILE]:  { icon: <UserPlus className="h-6 w-6 text-blue-600" />, title: 'Personal Details', subtitle: 'Tell us your name, date of birth, and address.' },
    [STEPS.PASSWORD]: { icon: <KeyRound className="h-6 w-6 text-blue-600" />, title: 'Create Password', subtitle: 'Set a strong password for your account.' },
    [STEPS.LEGAL]:    { icon: <Fingerprint className="h-6 w-6 text-blue-600" />, title: 'Terms & Consent', subtitle: 'Review and accept terms to create your account.' },
    [STEPS.KYC]:      { icon: <BadgeCheck className="h-6 w-6 text-blue-600" />, title: 'KYC Verification', subtitle: 'Upload PAN, Aadhaar, and selfie documents.' },
    [STEPS.BANK]:     { icon: <Landmark className="h-6 w-6 text-blue-600" />, title: 'Bank Account', subtitle: 'Link your bank account for withdrawals.' },
    [STEPS.MPIN]:     { icon: <ShieldCheck className="h-6 w-6 text-blue-600" />, title: 'Set MPIN', subtitle: 'Secure your account with a 4-digit MPIN.' },
  };

  const current = stepConfig[step];
  const passwordStrength = getPasswordStrength(password);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:px-6">
      <div className="w-full max-w-md overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)]">

        {/* â”€â”€ Header â”€â”€ */}
        <div className="relative overflow-hidden bg-slate-900 px-8 pb-6 pt-8 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.3),transparent_40%)]" />
          <div className="relative flex items-center justify-between">
            {step > STEPS.MOBILE ? (
              <button onClick={handlePrevStep} className="rounded-full p-2 transition hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : <div className="h-9 w-9" />}
            <div className="text-sm font-medium uppercase tracking-widest text-blue-400">Step {step} of {TOTAL_STEPS}</div>
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

        {/* â”€â”€ Body â”€â”€ */}
        <div className="px-8 py-8">
          {error && <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          {/* Step 1 */}
          {step === STEPS.MOBILE && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
                <button type="button" onClick={() => { setSignupMode('email'); setError(''); }} className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${signupMode === 'email' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Email</button>
                <button type="button" onClick={() => { setSignupMode('mobile'); setError(''); }} className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${signupMode === 'mobile' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Mobile Number</button>
              </div>
              {signupMode === 'mobile' ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Mobile Number</label>
                  <div className="flex gap-2">
                    <div className="input-shell flex w-16 items-center justify-center bg-slate-50 font-medium text-slate-500">+91</div>
                    <input type="tel" required maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} className="input-shell flex-1" placeholder="Enter 10-digit number" autoFocus />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Email Address</label>
                  <input type="email" required value={emailForOtp} onChange={(e) => setEmailForOtp(e.target.value)} className="input-shell" placeholder="you@example.com" autoFocus />
                </div>
              )}
              <button id="send-otp-btn" type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Send OTP</span><ArrowRight className="h-4 w-4" /></>}
              </button>
              <div className="mt-4 text-center text-sm text-slate-600">Already have an account? <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">Log in</Link></div>
            </form>
          )}

          {/* Step 2 */}
          {step === STEPS.OTP && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="mb-2 block text-center text-sm font-medium text-slate-700">Enter 6-Digit OTP</label>
                <OtpBoxes value={otp} onChange={setOtp} />
              </div>
              <div className="text-center">
                {otpTimer > 0 ? <span className="text-sm text-slate-400">Resend OTP in {otpTimer}s</span>
                  : <button id="resend-otp-btn" type="button" onClick={handleResendOtp} disabled={loading} className="text-sm font-semibold text-blue-600 hover:underline disabled:opacity-50">Resend OTP</button>}
              </div>
              <button type="submit" disabled={loading || otp.length !== 6} className="btn-primary w-full disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Verify OTP</span><ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          )}

          {/* Step 3 */}
          {step === STEPS.PROFILE && (
            <form onSubmit={handleProfileStep} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Full Name</label>
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-shell" placeholder="Enter your full name" autoFocus />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Date of Birth</label>
                <input type="date" required value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="input-shell" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Residential Address</label>
                <input type="text" required value={address} onChange={(e) => setAddress(e.target.value)} className="input-shell" placeholder="House No., Street, City, State" />
              </div>
              <button type="submit" className="btn-primary w-full"><span>Continue</span><ArrowRight className="h-4 w-4" /></button>
            </form>
          )}

          {/* Step 4 */}
          {step === STEPS.PASSWORD && (
            <form onSubmit={handlePasswordStep} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="input-shell pr-11" placeholder="Min 8 chars, uppercase, number, special" autoFocus />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="Toggle password">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full rounded-full bg-slate-200">
                      <div className={`h-1.5 rounded-full transition-all ${passwordStrength.label === 'Weak' ? 'bg-rose-500' : passwordStrength.label === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${(passwordStrength.score / 5) * 100}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">Strength: {passwordStrength.label}</p>
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirmPassword ? 'text' : 'password'} required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-shell pr-11" placeholder="Re-enter password" />
                  <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="Toggle confirm password">
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && <p className={`mt-1 text-xs ${passwordsMatch ? 'text-emerald-600' : 'text-rose-600'}`}>{passwordsMatch ? 'Passwords match âœ“' : 'Passwords do not match'}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Referral Code <span className="font-normal text-slate-400">(optional)</span></label>
                <input type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} className="input-shell" placeholder="Enter referral code" />
              </div>
              <button type="submit" className="btn-primary w-full"><span>Continue</span><ArrowRight className="h-4 w-4" /></button>
            </form>
          )}

          {/* Step 5 */}
          {step === STEPS.LEGAL && (
            <form onSubmit={handleLegalAndRegister} className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Review the terms below before creating your account.</div>
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-slate-50"><tr><th className="px-4 py-2.5 font-semibold text-slate-700">Feature</th><th className="px-4 py-2.5 font-semibold text-slate-700">Details</th></tr></thead>
                  <tbody>
                    {[['Minimum Investment','â‚¹10,000'],['Monthly Interest','10%'],['Lock-in Period','6 Months'],['Interest Credit','Wallet'],['Min. Withdrawal','â‚¹1,000'],['Withdrawal Approval','Admin Approval'],['Completion Return','90%'],['Early Withdrawal','70%']].map(([k,v]) => (
                      <tr key={k} className="border-t border-slate-200"><td className="px-4 py-2.5 text-slate-600">{k}</td><td className="px-4 py-2.5 font-semibold text-slate-800">{v}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 px-3 py-3">
                <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600" />
                <span className="text-sm text-slate-700">I accept <Link to="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Terms &amp; Conditions</Link> <span className="text-rose-600">*</span></span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 px-3 py-3">
                <input type="checkbox" checked={privacyAccepted} onChange={(e) => setPrivacyAccepted(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600" />
                <span className="text-sm text-slate-700">I accept <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Privacy Policy</Link> <span className="text-rose-600">*</span></span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 px-3 py-3">
                <input type="checkbox" checked={kycConsent} onChange={(e) => setKycConsent(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600" />
                <span className="text-sm text-slate-700">I consent to KYC verification and SMS/WhatsApp communication <span className="text-rose-600">*</span></span>
              </label>
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Accept &amp; Create Account</span><ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          )}

          {/* Step 6 â€” KYC */}
          {step === STEPS.KYC && (
            <form onSubmit={handleKycStep} className="space-y-4">
              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">Upload clear, readable photos. Blurry images will delay approval.</div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">PAN Number</label>
                <input type="text" value={panNumber} onChange={(e) => setPanNumber(e.target.value.toUpperCase())} className="input-shell font-mono" placeholder="ABCDE1234F" required maxLength={10} />
              </div>
              <FileField label="PAN Card (Front)" value={panProofFile} onChange={setPanProofFile} />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Aadhaar Number</label>
                <input type="text" maxLength={12} value={aadhaarNumber} onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))} className="input-shell" placeholder="12-digit Aadhaar" required />
              </div>
              <FileField label="Aadhaar Card (Front)" value={aadhaarProofFile} onChange={setAadhaarProofFile} />
              <FileField label="Aadhaar Card (Back)" value={aadhaarBackFile} onChange={setAadhaarBackFile} />
              <FileField label="Selfie Photo" accept=".jpg,.jpeg,.png" value={selfieProofFile} onChange={setSelfieProofFile} />
              <FileField label="Bank Passbook / Statement" value={bankPassbookFile} onChange={setBankPassbookFile} />
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <input type="checkbox" checked={selfieDone} onChange={(e) => setSelfieDone(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600" />
                <span className="text-sm text-slate-600">I confirm my selfie/liveness capture is complete</span>
              </label>
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Submit KYC Documents</span><ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          )}

          {/* Step 7 â€” Bank Account */}
          {step === STEPS.BANK && (
            <form onSubmit={handleBankStep} className="space-y-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 className="mr-1 inline-block h-4 w-4" />
                KYC submitted! Now link your bank account for withdrawals.
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Account Holder Name</label>
                <input type="text" required value={bankHolderName} onChange={(e) => setBankHolderName(e.target.value)} className="input-shell" placeholder="As per bank records" autoFocus />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Bank Account Number</label>
                <input type="text" required value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ''))} className="input-shell" placeholder="Account number" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Confirm Account Number</label>
                <input type="password" required value={confirmAccountNumber} onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, ''))} className="input-shell" placeholder="Re-enter account number" />
                {confirmAccountNumber.length > 0 && <p className={`mt-1 text-xs ${bankAccountNumber === confirmAccountNumber ? 'text-emerald-600' : 'text-rose-600'}`}>{bankAccountNumber === confirmAccountNumber ? 'Numbers match âœ“' : 'Numbers do not match'}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">IFSC Code</label>
                <input type="text" required maxLength={11} value={bankIfscCode} onChange={(e) => handleIfscChange(e.target.value)} className="input-shell font-mono" placeholder="SBIN0001234" />
                {bankName && <p className="mt-1 text-xs font-medium text-blue-600">ðŸ¦ {bankName}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Bank Name</label>
                <input type="text" required value={bankName} onChange={(e) => setBankName(e.target.value)} className="input-shell" placeholder="e.g. HDFC Bank" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Link Bank Account</span><ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          )}

          {/* Step 8 â€” MPIN */}
          {step === STEPS.MPIN && (
            <form onSubmit={handleSetMpin} className="space-y-5">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 className="mr-1 inline-block h-4 w-4" />
                Bank linked! Set your MPIN to complete setup.
              </div>
              <div>
                <label className="mb-1 block text-center text-sm font-semibold text-slate-800">Set 4-Digit MPIN</label>
                <p className="mb-2 text-center text-xs text-slate-500">Used for secure login and withdrawals.</p>
                <MpinBoxes value={mpin} onChange={setMpinValue} length={4} />
              </div>
              {mpin.length === 4 && (
                <div>
                  <label className="mb-1 block text-center text-sm font-semibold text-slate-800">Confirm MPIN</label>
                  <MpinBoxes value={mpinConfirm} onChange={setMpinConfirm} length={4} />
                </div>
              )}
              <p className="text-center text-xs text-slate-500">Avoid simple patterns like 1234 or 1111.</p>
              <button type="submit" disabled={loading || mpin.length !== 4 || mpinConfirm.length !== 4} className="btn-primary w-full disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Set MPIN &amp; Go to Dashboard</span><ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          )}
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-slate-100">
          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>
      </div>
      <div id="recaptcha-container" />
    </div>
  );
}

export default SignupPage;
