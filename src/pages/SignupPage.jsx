import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Fingerprint, KeyRound, Loader2, Mail, Phone, ShieldCheck, UserPlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { firebaseSendOtp, firebaseVerifyOtp, getFirebaseIdToken, getFirebaseOtpPreflightError, getReadableFirebaseOtpError, resetRecaptcha, setupRecaptcha } from '../firebase';
import { registerUser, saveAuthData, sendOtp, setMpin, verifyOtp, linkBank, submitKyc, loginWithEmail, getAccessToken } from '../services/api';

const STEPS = {
  MOBILE: 1,
  OTP: 2,
  PROFILE: 3,
  EMAIL: 4,
  PASSWORD: 5,
  LEGAL: 6,
  KYC: 7,
  ACTIVATION: 8,
  MPIN: 9,
};

const TOTAL_STEPS = 9;

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

function SignupPage({ onLogin }) {
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const [step, setStep] = useState(STEPS.MOBILE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [mobile, setMobile] = useState('');
  const [emailForOtp, setEmailForOtp] = useState('');
  const [signupMode, setSignupMode] = useState('email'); // default to email to bypass broken mobile
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [firebaseIdToken, setFirebaseIdToken] = useState('');
  const [signupVerificationToken, setSignupVerificationToken] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [kycConsent, setKycConsent] = useState(false);

  const [mpin, setMpinValue] = useState('');
  const [mpinConfirm, setMpinConfirm] = useState('');

  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [selfieDone, setSelfieDone] = useState(false);
  const [panProofFile, setPanProofFile] = useState(null);
  const [aadhaarProofFile, setAadhaarProofFile] = useState(null);
  const [aadhaarBackFile, setAadhaarBackFile] = useState(null);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [selfieProofFile, setSelfieProofFile] = useState(null);
  const [bankHolderName, setBankHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [cancelledChequeFile, setCancelledChequeFile] = useState(null);
  const [bankPassbookFile, setBankPassbookFile] = useState(null);

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
    if (signupMode === 'mobile') {
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
    } else {
      if (!emailForOtp || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailForOtp)) {
        setError('Please enter a valid email address.');
        return;
      }
      setLoading(true);
      setError('');
      try {
        await import('../services/api').then(api => api.sendEmailOtp(emailForOtp));
        startOtpTimer();
        setStep(STEPS.OTP);
      } catch (err) {
        setError(err.message || 'Failed to send OTP to email. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    
    setLoading(true);
    setError('');
    
    if (signupMode === 'mobile') {
      const preflightError = getFirebaseOtpPreflightError();
      if (preflightError) {
        setError(preflightError);
        setLoading(false);
        return;
      }
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
    } else {
      try {
        await import('../services/api').then(api => api.sendEmailOtp(emailForOtp));
        startOtpTimer();
      } catch (err) {
        setError(err.message || 'Failed to resend OTP.');
      } finally {
        setLoading(false);
      }
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
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          role: result.role,
          userId: result.userId,
          onboardingStatus: result.onboardingStatus,
          kycStatus: result.kycStatus,
          bankVerified: result.bankVerified,
          mpinCreated: result.mpinCreated,
          accountStatus: result.accountStatus,
          name: result.fullName || result.name,
          email: result.email || emailForOtp,
          mobileNumber: mobile || result.mobileNumber,
          user: result.user,
        });
        const role = (result.role?.toLowerCase() === 'admin' || result.role?.toLowerCase() === 'super_admin') ? 'admin' : 'user';
        if (onLogin) onLogin(role);
        navigate(role === 'admin' ? '/admin' : '/', { replace: true });
      } else {
        setSignupVerificationToken(
          result.signupVerificationToken ||
          result.verificationToken ||
          result.token ||
          '',
        );
        if (signupMode === 'email') {
          setEmail(emailForOtp); // Pre-fill email in later steps
        }
        setStep(STEPS.PROFILE);
      }
    } catch (err) {
      setError(getReadableAuthError(err, 'Invalid OTP. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleProfileStep = (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!dateOfBirth) {
      setError('Please enter your Date of Birth.');
      return;
    }
    setError('');
    setStep(STEPS.EMAIL);
  };

  const handleEmailStep = (e) => {
    e.preventDefault();
    const normalizedEmail = (email || '').trim();
    if (!normalizedEmail) {
      setError('Email is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    setEmail(normalizedEmail);
    setError('');
    setStep(STEPS.PASSWORD);
  };

  const handlePasswordStep = (e) => {
    e.preventDefault();
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!strongPassword.test(password)) {
      setError('Password must have 8+ chars with uppercase, lowercase, number, and special character.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password and confirm password do not match.');
      return;
    }
    setError('');
    setStep(STEPS.LEGAL);
  };

  const handleLegalAndRegister = async (e) => {
    e.preventDefault();
    if (!termsAccepted || !privacyAccepted || !kycConsent) {
      setError('Please accept all required agreements.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let idToken = firebaseIdToken;
      try {
        idToken = await getFirebaseIdToken();
        setFirebaseIdToken(idToken);
      } catch (_) {
        // no-op
      }
      const result = await registerUser({
        idToken,
        signupVerificationToken,
        fullName,
        email: signupMode === 'email' ? emailForOtp : (email || '').trim(),
        mobileNumber: mobile,
        password,
        dateOfBirth,
        referredByCode: referralCode || null,
        termsAccepted,
        privacyPolicyAccepted: privacyAccepted,
        kycConsentAccepted: kycConsent,
        riskDisclosureAccepted: true,
        investorAgreementAccepted: true,
      });

      // Automatically log the user in to retrieve the accessToken for subsequent authenticated calls (KYC / Bank)
      let loginResult;
      try {
        loginResult = await loginWithEmail(signupMode === 'email' ? emailForOtp : (email || '').trim() || mobile, password);
      } catch (loginErr) {
        try {
          loginResult = await loginWithEmail(mobile, password);
        } catch (fallbackErr) {
          console.error('Auto-login failed after registration:', fallbackErr);
          throw new Error('Registration successful, but failed to automatically log in. Please login manually.');
        }
      }

      saveAuthData({
        accessToken: loginResult.accessToken,
        refreshToken: loginResult.refreshToken,
        role: loginResult.role,
        userId: loginResult.userId,
        onboardingStatus: loginResult.onboardingStatus,
        kycStatus: loginResult.kycStatus,
        bankVerified: loginResult.bankVerified,
        mpinCreated: loginResult.mpinCreated,
        accountStatus: loginResult.accountStatus,
        name: loginResult.fullName || loginResult.name || fullName,
        email: loginResult.email || email,
        mobileNumber: mobile,
        user: loginResult.user,
      });
      setStep(STEPS.KYC);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetMpin = async (e) => {
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
      const response = await setMpin(mpin);
      saveAuthData({
        accessToken: getAccessToken(),
        name: fullName,
        email,
        mobileNumber: mobile,
        city: address,
        bankName: bankName,
        bankAccountNumber,
        onboardingStatus: response.onboardingStatus || 'ACTIVE',
        kycStatus: response.kycStatus || 'APPROVED',
        bankVerified: response.bankVerified ?? true,
        mpinCreated: response.mpinCreated ?? true,
        accountStatus: response.accountStatus || 'ACTIVE',
      });
      if (onLogin) onLogin('user');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to set MPIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKycStep = async (e) => {
    e.preventDefault();
    const pan = panNumber.trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
      setError('Please enter valid PAN (e.g. ABCDE1234F).');
      return;
    }
    if (!/^\d{12}$/.test(aadhaarNumber)) {
      setError('Please enter a valid 12-digit Aadhaar number.');
      return;
    }
    if (!dateOfBirth) {
      setError('Please enter your Date of Birth.');
      return;
    }
    if (!address.trim()) {
      setError('Please enter your Address.');
      return;
    }
    if (!panProofFile) {
      setError('Please upload PAN proof document.');
      return;
    }
    if (!aadhaarProofFile) {
      setError('Please upload Aadhaar Front proof document.');
      return;
    }
    if (!aadhaarBackFile) {
      setError('Please upload Aadhaar Back proof document.');
      return;
    }
    if (!bankPassbookFile) {
      setError('Please upload Bank Passbook / Statement proof.');
      return;
    }
    if (!selfieProofFile) {
      setError('Please upload selfie/liveness proof.');
      return;
    }
    if (!selfieDone) {
      setError('Please confirm selfie/liveness step.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await submitKyc({
        panCardImage: panProofFile,
        aadhaarFrontImage: aadhaarProofFile,
        aadhaarBackImage: aadhaarBackFile,
        selfiePhoto: selfieProofFile,
        bankPassbookOrStatement: bankPassbookFile,
        panNumber: pan,
        aadhaarLast4: aadhaarNumber.slice(-4),
        dateOfBirth,
        address,
      });
      saveAuthData({
        kycStatus: 'PENDING'
      });
      setStep(STEPS.ACTIVATION);
    } catch (err) {
      setError(err.message || 'Failed to submit KYC details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    saveAuthData({
      name: fullName,
      email,
      mobileNumber: mobile,
      city: '',
      bankName: bankName,
      bankAccountNumber,
      upiId: '',
    });
    if (onLogin) onLogin('user');
    navigate('/', { replace: true });
  };

  const stepConfig = {
    [STEPS.MOBILE]: { icon: signupMode === 'email' ? <Mail className="h-6 w-6 text-blue-600" /> : <Phone className="h-6 w-6 text-blue-600" />, title: 'Create Account', subtitle: 'We will send a 6-digit OTP to verify your identity.' },
    [STEPS.OTP]: { icon: <KeyRound className="h-6 w-6 text-blue-600" />, title: 'Verify OTP', subtitle: `Enter the OTP sent to ${signupMode === 'email' ? emailForOtp : `+91 ${mobile}`}` },
    [STEPS.PROFILE]: { icon: <UserPlus className="h-6 w-6 text-blue-600" />, title: 'Your Details', subtitle: 'Enter your personal information to continue.' },
    [STEPS.EMAIL]: { icon: <Mail className="h-6 w-6 text-blue-600" />, title: 'Email Address', subtitle: 'Optionally add your email address.' },
    [STEPS.PASSWORD]: { icon: <KeyRound className="h-6 w-6 text-blue-600" />, title: 'Create Password', subtitle: 'Use a strong password for your account.' },
    [STEPS.LEGAL]: { icon: <Fingerprint className="h-6 w-6 text-blue-600" />, title: 'Accept Terms', subtitle: 'Accept terms, privacy policy, and KYC consent.' },
    [STEPS.KYC]: { icon: <UserPlus className="h-6 w-6 text-blue-600" />, title: 'Complete KYC', subtitle: 'Provide PAN, Aadhaar, and selfie/liveness.' },
    [STEPS.ACTIVATION]: { icon: <CheckCircle2 className="h-6 w-6 text-emerald-600" />, title: 'Account Activated', subtitle: 'Your account has been created successfully.' },
    [STEPS.MPIN]: { icon: <ShieldCheck className="h-6 w-6 text-blue-600" />, title: 'Create MPIN', subtitle: 'Set a 4-6 digit MPIN for secure actions.' },
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

        <div className="px-8 py-8">
          {error && <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          {step === STEPS.MOBILE && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-4">
                <button
                  type="button"
                  onClick={() => { setSignupMode('email'); setError(''); }}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${signupMode === 'email' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => { setSignupMode('mobile'); setError(''); }}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${signupMode === 'mobile' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Mobile Number
                </button>
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
              
              <button id="send-otp-btn" type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Send OTP</span><ArrowRight className="h-4 w-4" /></>}</button>
              <div className="mt-4 text-center text-sm text-slate-600">Already have an account? <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500">Log in</Link></div>
            </form>
          )}

          {step === STEPS.OTP && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">6-Digit OTP</label>
                <input type="text" required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className="input-shell text-center text-xl tracking-[0.5em]" placeholder="* * * * * *" autoFocus />
              </div>
              <div className="text-center">{otpTimer > 0 ? <span className="text-sm text-slate-400">Resend OTP in {otpTimer}s</span> : <button id="resend-otp-btn" type="button" onClick={handleResendOtp} disabled={loading} className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50">Resend OTP</button>}</div>
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Verify OTP</span><ArrowRight className="h-4 w-4" /></>}</button>
            </form>
          )}

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
              <button type="submit" className="btn-primary w-full"><span>Continue</span><ArrowRight className="h-4 w-4" /></button>
            </form>
          )}

          {step === STEPS.EMAIL && (
            <form onSubmit={handleEmailStep} className="space-y-4">
              <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Email Address <span className="text-slate-400 font-normal">(optional)</span></label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-shell" placeholder="you@example.com" autoFocus /></div>
              <button type="submit" className="btn-primary w-full"><span>Continue</span><ArrowRight className="h-4 w-4" /></button>
              <button type="button" onClick={() => { setEmail(''); setError(''); setStep(STEPS.PASSWORD); }} className="btn-secondary w-full"><span>Skip</span></button>
            </form>
          )}

          {step === STEPS.PASSWORD && (
            <form onSubmit={handlePasswordStep} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
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
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full rounded-full bg-slate-200">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          passwordStrength.label === 'Weak'
                            ? 'bg-rose-500'
                            : passwordStrength.label === 'Medium'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
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
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <p className={`mt-1 text-xs ${passwordsMatch ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </p>
                )}
              </div>
              <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Referral Code <span className="text-slate-400 font-normal">(optional)</span></label><input type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} className="input-shell" placeholder="Enter referral code" /></div>
              <button type="submit" className="btn-primary w-full"><span>Continue</span><ArrowRight className="h-4 w-4" /></button>
            </form>
          )}

          {step === STEPS.LEGAL && (
            <form onSubmit={handleLegalAndRegister} className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                This is the final step. Review the Terms and Conditions before activating your account.
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-sm font-semibold text-slate-800">Feature</th>
                      <th className="px-4 py-3 text-sm font-semibold text-slate-800">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-slate-200"><td className="px-4 py-3 text-sm text-slate-600">Minimum Investment</td><td className="px-4 py-3 text-sm font-semibold text-slate-800">Rs10,000</td></tr>
                    <tr className="border-t border-slate-200"><td className="px-4 py-3 text-sm text-slate-600">Maximum Investment</td><td className="px-4 py-3 text-sm font-semibold text-slate-800">Rs10,00,000</td></tr>
                    <tr className="border-t border-slate-200"><td className="px-4 py-3 text-sm text-slate-600">Lock-in Period</td><td className="px-4 py-3 text-sm font-semibold text-slate-800">6 Months</td></tr>
                    <tr className="border-t border-slate-200"><td className="px-4 py-3 text-sm text-slate-600">Monthly Interest</td><td className="px-4 py-3 text-sm font-semibold text-slate-800">10%</td></tr>
                    <tr className="border-t border-slate-200"><td className="px-4 py-3 text-sm text-slate-600">Interest Credit</td><td className="px-4 py-3 text-sm font-semibold text-slate-800">Wallet</td></tr>
                    <tr className="border-t border-slate-200"><td className="px-4 py-3 text-sm text-slate-600">Wallet Withdrawal Minimum</td><td className="px-4 py-3 text-sm font-semibold text-slate-800">Rs1,000</td></tr>
                    <tr className="border-t border-slate-200"><td className="px-4 py-3 text-sm text-slate-600">Withdrawal Approval</td><td className="px-4 py-3 text-sm font-semibold text-slate-800">Admin Approval</td></tr>
                    <tr className="border-t border-slate-200"><td className="px-4 py-3 text-sm text-slate-600">Investment Completion Return</td><td className="px-4 py-3 text-sm font-semibold text-slate-800">90%</td></tr>
                    <tr className="border-t border-slate-200"><td className="px-4 py-3 text-sm text-slate-600">Early Withdrawal Return</td><td className="px-4 py-3 text-sm font-semibold text-slate-800">70%</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <p>All returns and payout timelines are subject to verification and platform policy updates.</p>
                <p>Any fraud, policy abuse, or invalid KYC or payment information may result in account suspension.</p>
                <p>By continuing, you acknowledge that these terms may be revised from time to time.</p>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 px-3 py-3">
                <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600" />
                <span className="text-sm text-slate-700">I accept Terms and Conditions <span className="text-rose-600">*</span> (<Link to="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">read full page</Link>)</span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 px-3 py-3">
                <input type="checkbox" checked={privacyAccepted} onChange={(e) => setPrivacyAccepted(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600" />
                <span className="text-sm text-slate-700">I accept Privacy Policy <span className="text-rose-600">*</span> (<Link to="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">read full page</Link>)</span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 px-3 py-3">
                <input type="checkbox" checked={kycConsent} onChange={(e) => setKycConsent(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600" />
                <span className="text-sm text-slate-700">I consent to KYC verification and SMS/WhatsApp communication <span className="text-rose-600">*</span></span>
              </label>

              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Accept & Create Account</span><ArrowRight className="h-4 w-4" /></>}</button>
            </form>
          )}

          {step === STEPS.MPIN && (
            <form onSubmit={handleSetMpin} className="space-y-5">
              <div><label className="mb-2 block text-sm font-medium text-slate-700">Set MPIN</label><input type="password" required maxLength={6} minLength={4} value={mpin} onChange={(e) => setMpinValue(e.target.value.replace(/\D/g, ''))} className="input-shell text-center text-2xl tracking-[0.5em]" placeholder="* * * *" autoFocus /></div>
              <div><label className="mb-2 block text-sm font-medium text-slate-700">Confirm MPIN</label><input type="password" required maxLength={6} minLength={4} value={mpinConfirm} onChange={(e) => setMpinConfirm(e.target.value.replace(/\D/g, ''))} className="input-shell text-center text-2xl tracking-[0.5em]" placeholder="* * * *" /></div>
              <p className="text-center text-xs text-slate-500">Do not use simple patterns like 1234 or 1111.</p>
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Set MPIN</span><ArrowRight className="h-4 w-4" /></>}</button>
            </form>
          )}


          {step === STEPS.KYC && (
            <form onSubmit={handleKycStep} className="space-y-4">
              <div><label className="mb-1.5 block text-sm font-medium text-slate-700">PAN Number</label><input type="text" value={panNumber} onChange={(e) => setPanNumber(e.target.value.toUpperCase())} className="input-shell" placeholder="ABCDE1234F" required /></div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Upload PAN Proof</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setPanProofFile(e.target.files?.[0] || null)}
                  className="input-shell"
                  required
                />
                {panProofFile && <p className="mt-1 text-xs text-emerald-600">Selected: {panProofFile.name}</p>}
              </div>
              <div><label className="mb-1.5 block text-sm font-medium text-slate-700">Aadhaar Number</label><input type="text" maxLength={12} value={aadhaarNumber} onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))} className="input-shell" placeholder="12-digit Aadhaar number" required /></div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Upload Aadhaar Front Proof</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setAadhaarProofFile(e.target.files?.[0] || null)}
                  className="input-shell"
                  required
                />
                {aadhaarProofFile && <p className="mt-1 text-xs text-emerald-600">Selected: {aadhaarProofFile.name}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Upload Aadhaar Back Proof</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setAadhaarBackFile(e.target.files?.[0] || null)}
                  className="input-shell"
                  required
                />
                {aadhaarBackFile && <p className="mt-1 text-xs text-emerald-600">Selected: {aadhaarBackFile.name}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="input-shell"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input-shell"
                  placeholder="Enter your full address"
                  required
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Upload Bank Passbook / Statement Proof</label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setBankPassbookFile(e.target.files?.[0] || null)}
                  className="input-shell"
                  required
                />
                {bankPassbookFile && <p className="mt-1 text-xs text-emerald-600">Selected: {bankPassbookFile.name}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Upload Selfie / Liveness Proof</label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => setSelfieProofFile(e.target.files?.[0] || null)}
                  className="input-shell"
                  required
                />
                {selfieProofFile && <p className="mt-1 text-xs text-emerald-600">Selected: {selfieProofFile.name}</p>}
              </div>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><input type="checkbox" checked={selfieDone} onChange={(e) => setSelfieDone(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600" /><span className="text-sm text-slate-600">Selfie / liveness capture completed</span></label>
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Submit KYC Documents</span><ArrowRight className="h-4 w-4" /></>}</button>
            </form>
          )}



          {step === STEPS.ACTIVATION && (
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-10 w-10" /></div>
              <h3 className="font-heading text-xl font-bold text-slate-900">Account Created Successfully</h3>
              <p className="mt-2 text-sm text-slate-500">Your account has been created. Set up your MPIN to secure your account.</p>
              <div className="pt-6"><button type="button" onClick={() => { setError(''); setStep(STEPS.MPIN); }} className="btn-primary w-full"><span>Continue to MPIN Setup</span><ArrowRight className="h-4 w-4" /></button></div>
            </div>
          )}
        </div>

        <div className="h-1.5 w-full bg-slate-100">
          <div className="h-full bg-blue-600 transition-all duration-500 ease-out" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>
      </div>
      <div id="recaptcha-container" />
    </div>
  );
}

export default SignupPage;
