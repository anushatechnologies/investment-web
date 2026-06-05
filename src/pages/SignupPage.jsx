import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  FileCheck2,
  Loader2,
  Phone,
  ShieldCheck,
  UserRoundPlus,
} from 'lucide-react';
import AuthShell from '../components/auth/AuthShell';
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
  registerUser,
  saveAuthData,
  sendOtp,
  validateReferralCode,
  verifyOtp,
} from '../services/api';
import { saveOnboardingDraft } from '../utils/onboardingDraftStore';
import { resolveInvestorRoute } from '../utils/onboardingRouter';

const STEPS = {
  CONTACT: 'contact',
  OTP: 'otp',
  PROFILE: 'profile',
  PASSWORD: 'password',
  LEGAL: 'legal',
  RESULT: 'result',
};

const sideHighlights = [
  {
    title: 'Backend-aware signup',
    copy: 'Signup now creates the investor account first, and then the app moves to KYC, bank linking, activation, and MPIN in the right order.',
    icon: <FileCheck2 size={20} />,
  },
  {
    title: 'Mobile-first verification',
    copy: 'Signup now verifies investors only through mobile OTP, while still collecting email and password for account access.',
    icon: <Phone size={20} />,
  },
  {
    title: 'Cleaner investor handoff',
    copy: 'After signup, investors are guided to the exact next step: KYC, bank link, activation, MPIN, or dashboard.',
    icon: <ShieldCheck size={20} />,
  },
];

const stepMeta = {
  [STEPS.CONTACT]: {
    title: 'Verify mobile number',
    subtitle: 'Start with mobile OTP verification before collecting email and password.',
    label: 'Verify Mobile',
  },
  [STEPS.OTP]: {
    title: 'Verify your OTP',
    subtitle: 'Enter the six-digit code sent to your selected contact channel.',
    label: 'Verify OTP',
  },
  [STEPS.PROFILE]: {
    title: 'Create account',
    subtitle: 'Enter the core registration fields required before the backend can create the investor account.',
    label: 'Create Account',
  },
  [STEPS.PASSWORD]: {
    title: 'Set account password',
    subtitle: 'Create a strong password and attach an optional referral code before registration.',
    label: 'Set Password',
  },
  [STEPS.LEGAL]: {
    title: 'Review and accept investor consents',
    subtitle: 'Confirm the required legal agreements, then create your investor account.',
    label: 'Review & Consent',
  },
  [STEPS.RESULT]: {
    title: 'Signup complete',
    subtitle: 'Continue with the next onboarding step based on your registration path.',
    label: 'Next Step',
  },
};

function getPasswordStrength(password) {
  if (!password) return { label: 'Empty', score: 0, color: 'transparent' };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z\d]/.test(password)) score += 1;
  if (score <= 2) return { label: 'Weak', score, color: '#ef4444' };
  if (score <= 4) return { label: 'Medium', score, color: '#f59e0b' };
  return { label: 'Strong', score, color: '#10b981' };
}

function getReadableAuthError(error, fallback) {
  return getReadableFirebaseOtpError(error) || error?.message || fallback;
}

/* Compact labelled input section wrapper */
function FieldGroup({ label, children }) {
  return (
    <Box
      sx={{
        borderRadius: '18px',
        border: '1px solid',
        borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(226,232,240,0.9)',
        p: 2.5,
        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(248,250,252,0.8)',
      }}
    >
      {label && (
        <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary', mb: 2 }}>
          {label}
        </Typography>
      )}
      <Stack spacing={2}>{children}</Stack>
    </Box>
  );
}

function SignupPage({ onLogin }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const timerRef = useRef(null);

  const [step, setStep] = useState(STEPS.CONTACT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultState, setResultState] = useState(null);

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [firebaseIdToken, setFirebaseIdToken] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralStatus, setReferralStatus] = useState(null);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [kycConsent, setKycConsent] = useState(false);

  const passwordStrength = getPasswordStrength(password);

  const stepSequence = useMemo(
    () => [STEPS.CONTACT, STEPS.OTP, STEPS.PROFILE, STEPS.PASSWORD, STEPS.LEGAL, STEPS.RESULT],
    [],
  );

  const stepIndex = Math.max(0, stepSequence.indexOf(step));
  const progress = ((stepIndex + 1) / stepSequence.length) * 100;
  const currentStepMeta = stepMeta[step];

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    const inviteCode = searchParams.get('ref') || searchParams.get('referralCode') || searchParams.get('referredByCode');
    if (inviteCode) {
      setReferralCode(inviteCode.trim().toUpperCase());
    }
  }, [searchParams]);

  const goToStep = (nextStep) => {
    setError('');
    setStep(nextStep);
  };

  const goBack = () => {
    const index = stepSequence.indexOf(step);
    if (index > 0) {
      setError('');
      setStep(stepSequence[index - 1]);
    }
  };

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

  const handleSendOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mobile.length !== 10) {
        throw new Error('Please enter a valid 10-digit mobile number.');
      }
      const preflightError = getFirebaseOtpPreflightError();
      if (preflightError) {
        throw new Error(preflightError);
      }

      const otpResponse = await sendOtp(mobile, '+91', 'REGISTRATION', { useFirebase: true });
      if (otpResponse?.userExists) {
        navigate('/login', {
          replace: true,
          state: {
            prefillIdentifier: mobile,
            prefillMode: 'mpin',
            infoMessage: 'This mobile number is already registered. Sign in to continue.',
          },
        });
        return;
      }
      resetRecaptcha();
      await setupRecaptcha();
      await firebaseSendOtp(`+91${mobile}`);

      startOtpTimer();
      goToStep(STEPS.OTP);
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
      const preflightError = getFirebaseOtpPreflightError();
      if (preflightError) {
        throw new Error(preflightError);
      }
      resetRecaptcha();
      await setupRecaptcha();
      await sendOtp(mobile, '+91', 'REGISTRATION', { useFirebase: true });
      await firebaseSendOtp(`+91${mobile}`);
      startOtpTimer();
    } catch (err) {
      resetRecaptcha();
      setError(getReadableAuthError(err, 'Failed to resend OTP. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (otp.length !== 6) {
        throw new Error('Please enter the 6-digit OTP.');
      }

      await firebaseVerifyOtp(otp);
      const idToken = await getFirebaseIdToken();
      setFirebaseIdToken(idToken);
      const result = await verifyOtp(idToken);

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
          email: result.email || email.trim(),
          mobileNumber: result.mobileNumber || mobile,
          user: result.user,
        });
        const role = ['admin', 'super_admin'].includes(String(result.role || '').toLowerCase()) ? 'admin' : 'user';
        onLogin?.(role);
        navigate(role === 'admin' ? '/admin' : resolveInvestorRoute(result), { replace: true });
        return;
      }

      goToStep(STEPS.PROFILE);
    } catch (err) {
      setError(getReadableAuthError(err, 'Invalid OTP. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleProfileStep = (event) => {
    event.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    goToStep(STEPS.PASSWORD);
  };

  const checkReferralCode = async () => {
    const normalizedCode = referralCode.trim().toUpperCase();
    setReferralCode(normalizedCode);
    if (!normalizedCode) {
      setReferralStatus(null);
      return true;
    }

    setReferralStatus({ state: 'checking', message: 'Checking referral code...' });
    try {
      const result = await validateReferralCode(normalizedCode);
      if (!result?.valid) {
        setReferralStatus({ state: 'invalid', message: result?.message || 'Referral code not found.' });
        return false;
      }
      setReferralStatus({
        state: 'valid',
        message: result.referrerName ? `Referral linked to ${result.referrerName}` : 'Referral code is valid.',
      });
      return true;
    } catch (err) {
      setReferralStatus({ state: 'invalid', message: err?.message || 'Unable to validate referral code.' });
      return false;
    }
  };

  const handlePasswordStep = async (event) => {
    event.preventDefault();
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
    if (!strongPassword.test(password)) {
      setError('Password must include 8+ characters with uppercase, lowercase, number, and special character.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password and confirm password do not match.');
      return;
    }
    if (referralCode.trim()) {
      await checkReferralCode();
    }
    goToStep(STEPS.LEGAL);
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    if (!termsAccepted || !privacyAccepted || !kycConsent) {
      setError('Please accept all required agreements before continuing.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        idToken: firebaseIdToken,
        fullName: fullName.trim(),
        email: email.trim(),
        mobileNumber: mobile,
        password,
        referredByCode: referralStatus?.state === 'valid' ? referralCode : null,
        termsAccepted,
        privacyPolicyAccepted: privacyAccepted,
        kycConsentAccepted: kycConsent,
        riskDisclosureAccepted: true,
        investorAgreementAccepted: true,
      };

      const result = await registerUser(payload);

      saveOnboardingDraft({
        fullName: fullName.trim(),
        email: email.trim(),
        mobileNumber: mobile,
        accountHolderName: fullName.trim(),
      });
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
        name: fullName.trim(),
        email: email.trim(),
        mobileNumber: mobile,
      });
      onLogin?.('user');
      setResultState({
        title: 'Investor account created',
        description: 'Your account is ready. Continue to KYC to submit PAN, Aadhaar, date of birth, address, selfie, and bank proof documents.',
        ctaLabel: 'Continue to KYC',
        ctaAction: () => navigate(resolveInvestorRoute({
          kycStatus: result.kycStatus || 'NOT_SUBMITTED',
          bankVerified: result.bankVerified,
          accountStatus: result.accountStatus,
          onboardingStatus: result.onboardingStatus,
          mpinCreated: result.mpinCreated,
        }), { replace: true }),
      });

      goToStep(STEPS.RESULT);
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: '14px' } };

  const renderContactStep = () => (
    <form onSubmit={handleSendOtp}>
      <Stack spacing={2.5}>
        <Chip
          icon={<Phone size={14} />}
          label="Mobile OTP signup only"
          sx={{
            alignSelf: 'flex-start',
            borderRadius: '999px',
            bgcolor: (theme) => theme.palette.mode === 'dark' ? alpha('#2563eb', 0.16) : alpha('#2563eb', 0.08),
            color: 'primary.main',
            fontWeight: 700,
          }}
        />

        <TextField
          label="Mobile number"
          placeholder="10-digit mobile number"
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
          inputProps={{ inputMode: 'numeric', maxLength: 10 }}
          helperText="We verify signup only through mobile OTP. Email and password are collected in the next steps."
          required
          fullWidth
          sx={inputSx}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Typography sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 14 }}>+91</Typography>
              </InputAdornment>
            ),
          }}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading}
          endIcon={loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
          sx={{ borderRadius: '14px', py: 1.5, fontWeight: 700, boxShadow: '0 8px 24px rgba(37,99,235,0.28)' }}
        >
          {loading ? 'Sending OTP...' : 'Send verification code'}
        </Button>
      </Stack>
    </form>
  );

  const renderOtpStep = () => (
    <form onSubmit={handleVerifyOtp}>
      <Stack spacing={2.5}>
        {/* Destination badge */}
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            px: 2,
            py: 1,
            borderRadius: '12px',
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(241,245,249,1)',
            border: '1px solid',
            borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(226,232,240,0.9)',
            alignSelf: 'flex-start',
          }}
        >
          <Phone size={14} />
          <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
            {`+91 ${mobile}`}
          </Typography>
        </Box>

        {/* OTP digit boxes */}
        <Box>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.secondary', mb: 1.5 }}>Enter 6-digit OTP</Typography>
          <Stack direction="row" spacing={1} justifyContent="space-between">
            {Array.from({ length: 6 }).map((_, i) => (
              <Box
                key={i}
                sx={{
                  flex: 1,
                  aspectRatio: '1',
                  maxWidth: 52,
                  borderRadius: '14px',
                  border: '2px solid',
                  borderColor: otp.length > i
                    ? 'primary.main'
                    : (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(148,163,184,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: otp.length > i
                    ? (theme) => theme.palette.mode === 'dark' ? alpha('#2563eb', 0.15) : alpha('#2563eb', 0.06)
                    : 'transparent',
                  fontSize: 20,
                  fontWeight: 800,
                  color: 'primary.main',
                  transition: 'all 0.15s ease',
                }}
              >
                {otp[i] || ''}
              </Box>
            ))}
          </Stack>
          <TextField
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputProps={{ inputMode: 'numeric', maxLength: 6 }}
            required
            fullWidth
            autoFocus
            sx={{
              mt: 1.5,
              '& .MuiOutlinedInput-root': { borderRadius: '14px' },
              '& input': { textAlign: 'center', letterSpacing: '0.5em', fontSize: 22, fontWeight: 800, py: 1.5 },
            }}
          />
        </Box>

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Button type="button" variant="text" size="small" onClick={goBack} startIcon={<ArrowLeft size={14} />}
            sx={{ fontSize: 12, color: 'text.secondary' }}>
            Change mobile
          </Button>
          <Button type="button" variant="text" size="small" disabled={loading || otpTimer > 0} onClick={handleResendOtp}
            sx={{ fontSize: 12, fontWeight: 700 }}>
            {otpTimer > 0 ? `Resend in ${otpTimer}s` : 'Resend OTP'}
          </Button>
        </Stack>

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading}
          endIcon={loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
          sx={{ borderRadius: '14px', py: 1.5, fontWeight: 700, boxShadow: '0 8px 24px rgba(37,99,235,0.28)' }}
        >
          {loading ? 'Verifying...' : 'Verify and continue'}
        </Button>
      </Stack>
    </form>
  );

  const renderProfileStep = () => (
    <form onSubmit={handleProfileStep}>
      <Stack spacing={2.5}>
        <FieldGroup label="Account details">
          <TextField
            label="Full name"
            placeholder="Your full legal name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            fullWidth
            sx={inputSx}
          />
          <TextField
            label="Email address"
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            sx={inputSx}
          />
          <TextField
            label="Mobile number"
            placeholder="10-digit mobile number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
            inputProps={{ inputMode: 'numeric', maxLength: 10 }}
            disabled
            required
            fullWidth
            sx={inputSx}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 14 }}>+91</Typography>
                </InputAdornment>
              ),
            }}
          />
        </FieldGroup>

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          endIcon={<ArrowRight size={16} />}
          sx={{ borderRadius: '14px', py: 1.5, fontWeight: 700, boxShadow: '0 8px 24px rgba(37,99,235,0.28)' }}
        >
          Continue
        </Button>
      </Stack>
    </form>
  );

  const renderPasswordStep = () => (
      <form onSubmit={handlePasswordStep}>
        <Stack spacing={2.5}>
          <FieldGroup label="Set password">
            <TextField
              label="Password"
              placeholder="Min 8 chars, uppercase, number, symbol"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              sx={inputSx}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPassword((prev) => !prev)} tabIndex={-1}>
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Strength bar */}
            {password && (
              <Box>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.75 }}>
                  <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>Password strength</Typography>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={0.75}>
                  {[1, 2, 3, 4, 5].map((seg) => (
                    <Box key={seg} sx={{
                      flex: 1,
                      height: 5,
                      borderRadius: 99,
                      bgcolor: passwordStrength.score >= seg ? passwordStrength.color : (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.2)',
                      transition: 'background-color 0.3s ease',
                    }} />
                  ))}
                </Stack>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 1, lineHeight: 1.6 }}>
                  Use 8+ characters with uppercase, lowercase, number, and special character.
                </Typography>
              </Box>
            )}

            <TextField
              label="Confirm password"
              placeholder="Re-enter your password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              fullWidth
              sx={inputSx}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowConfirmPassword((prev) => !prev)} tabIndex={-1}>
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </FieldGroup>

          <FieldGroup label="Referral (optional)">
            <TextField
              label="Referral code"
              placeholder="e.g. AT-ABC123"
              value={referralCode}
              onChange={(e) => { setReferralCode(e.target.value.toUpperCase()); setReferralStatus(null); }}
              onBlur={checkReferralCode}
              fullWidth
              sx={inputSx}
            />
            {referralStatus?.message && (
              <Box
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: '10px',
                  bgcolor: referralStatus.state === 'valid'
                    ? (theme) => theme.palette.mode === 'dark' ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.08)'
                    : referralStatus.state === 'checking'
                      ? 'transparent'
                      : (theme) => theme.palette.mode === 'dark' ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)',
                }}
              >
                <Typography sx={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: referralStatus.state === 'valid' ? '#10b981' : referralStatus.state === 'checking' ? 'text.secondary' : '#ef4444',
                }}>
                  {referralStatus.state === 'checking' ? '⏳ ' : referralStatus.state === 'valid' ? '✓ ' : '✗ '}
                  {referralStatus.message}
                </Typography>
              </Box>
            )}
          </FieldGroup>

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            endIcon={<ArrowRight size={16} />}
            sx={{ borderRadius: '14px', py: 1.5, fontWeight: 700, boxShadow: '0 8px 24px rgba(37,99,235,0.28)' }}
          >
            Continue
          </Button>
        </Stack>
      </form>
  );

  const renderLegalStep = () => (
    <form onSubmit={handleRegister}>
      <Stack spacing={2.5}>
        {/* Onboarding journey */}
        <Box
          sx={{
            borderRadius: '18px',
            border: '1px solid',
            borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(226,232,240,0.9)',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'inherit' }}>
            <Typography sx={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary' }}>Onboarding journey</Typography>
          </Box>
          {[
            'Register investor account',
            'Submit KYC profile and documents',
            'Wait for admin approval',
            'Link and verify bank account',
            'Activate account',
            'Create MPIN and access dashboard',
          ].map((step, i) => (
            <Stack key={step} direction="row" spacing={1.5} alignItems="center"
              sx={{ px: 2.5, py: 1.25, borderBottom: i < 5 ? '1px solid' : 'none', borderColor: 'inherit' }}
            >
              <Box sx={{
                width: 22, height: 22, borderRadius: '50%', display: 'grid', placeItems: 'center',
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(37,99,235,0.25)' : 'rgba(37,99,235,0.1)',
                color: 'primary.main', fontSize: 10, fontWeight: 800, flexShrink: 0,
              }}>{i + 1}</Box>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{step}</Typography>
            </Stack>
          ))}
        </Box>

        {/* Consent checkboxes */}
        <Stack spacing={1}>
          {[
            { state: termsAccepted, setState: setTermsAccepted, label: 'I accept the', link: '/terms-and-conditions', linkLabel: 'Terms and Conditions' },
            { state: privacyAccepted, setState: setPrivacyAccepted, label: 'I accept the', link: '/privacy-policy', linkLabel: 'Privacy Policy' },
          ].map((item) => (
            <Box key={item.linkLabel}
              sx={{
                px: 2, py: 1.5, borderRadius: '14px', border: '1px solid',
                borderColor: item.state ? 'primary.main' : (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(226,232,240,0.9)',
                bgcolor: item.state ? (theme) => theme.palette.mode === 'dark' ? alpha('#2563eb', 0.1) : alpha('#2563eb', 0.04) : 'transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <FormControlLabel
                control={<Checkbox checked={item.state} onChange={(e) => item.setState(e.target.checked)} size="small" />}
                label={
                  <Typography sx={{ fontSize: 13 }}>
                    {item.label}{' '}
                    <Link to={item.link} target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>{item.linkLabel}</Link>
                  </Typography>
                }
                sx={{ m: 0 }}
              />
            </Box>
          ))}
          <Box
            sx={{
              px: 2, py: 1.5, borderRadius: '14px', border: '1px solid',
              borderColor: kycConsent ? 'primary.main' : (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(226,232,240,0.9)',
              bgcolor: kycConsent ? (theme) => theme.palette.mode === 'dark' ? alpha('#2563eb', 0.1) : alpha('#2563eb', 0.04) : 'transparent',
              transition: 'all 0.2s ease',
            }}
          >
            <FormControlLabel
              control={<Checkbox checked={kycConsent} onChange={(e) => setKycConsent(e.target.checked)} size="small" />}
              label={<Typography sx={{ fontSize: 13 }}>I consent to KYC verification and investor communication.</Typography>}
              sx={{ m: 0 }}
            />
          </Box>
        </Stack>

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={loading}
          endIcon={loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
          sx={{ borderRadius: '14px', py: 1.5, fontWeight: 700, boxShadow: '0 8px 24px rgba(37,99,235,0.28)' }}
        >
          {loading ? 'Creating account...' : 'Create investor account'}
        </Button>
      </Stack>
    </form>
  );

  const renderResultStep = () => (
    <Stack spacing={3} alignItems="flex-start">
      {/* Success icon */}
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: '24px',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'rgba(16,185,129,0.12)',
          color: '#10b981',
        }}
      >
        <CheckCircle2 size={38} strokeWidth={2} />
      </Box>

      <Box sx={{ width: '100%' }}>
        <Typography variant="h5" sx={{ fontWeight: 800, fontSize: { xs: 22, sm: 26 } }}>
          {resultState?.title || 'Registration complete'}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1.25, lineHeight: 1.8, fontSize: 14 }}>
          {resultState?.description || 'Your signup has been completed.'}
        </Typography>

        {/* Next steps */}
        <Box
          sx={{
            mt: 2.5,
            borderRadius: '18px',
            border: '1px solid',
            borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(226,232,240,0.9)',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'inherit' }}>
            <Typography sx={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary' }}>What happens next</Typography>
          </Box>
          {[
            'Submit KYC profile details and documents',
            'Wait for admin review and KYC approval',
            'Link bank account after approval',
            'Activate account and create MPIN',
            'Access your full investor dashboard',
          ].map((step, i) => (
            <Stack key={step} direction="row" spacing={1.5} alignItems="center"
              sx={{ px: 2.5, py: 1.25, borderBottom: i < 4 ? '1px solid' : 'none', borderColor: 'inherit' }}
            >
              <Box sx={{
                width: 20, height: 20, borderRadius: '50%', display: 'grid', placeItems: 'center',
                bgcolor: 'rgba(16,185,129,0.12)', color: '#10b981', fontSize: 9, fontWeight: 800, flexShrink: 0,
              }}>{i + 1}</Box>
              <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{step}</Typography>
            </Stack>
          ))}
        </Box>

        {resultState?.note && (
          <Alert severity="info" sx={{ mt: 2, borderRadius: '14px' }}>
            {resultState.note}
          </Alert>
        )}
      </Box>

      <Button
        variant="contained"
        size="large"
        fullWidth
        endIcon={<ArrowRight size={16} />}
        onClick={resultState?.ctaAction}
        sx={{ borderRadius: '14px', py: 1.5, fontWeight: 700, boxShadow: '0 8px 24px rgba(37,99,235,0.28)' }}
      >
        {resultState?.ctaLabel || 'Continue'}
      </Button>
    </Stack>
  );

  const stepRenderer = {
    [STEPS.CONTACT]: renderContactStep,
    [STEPS.OTP]: renderOtpStep,
    [STEPS.PROFILE]: renderProfileStep,
    [STEPS.PASSWORD]: renderPasswordStep,
    [STEPS.LEGAL]: renderLegalStep,
    [STEPS.RESULT]: renderResultStep,
  };

  const stepLabels = stepSequence.map((s) => stepMeta[s].label);

  return (
    <>
      <AuthShell
        eyebrow="Investor Signup"
        title={currentStepMeta.title}
        subtitle={currentStepMeta.subtitle}
        sideLabel="Guided Onboarding"
        sideTitle="A streamlined signup flow that matches the backend investor onboarding contract."
        sideDescription="Registration is lightweight — KYC, bank verification, activation, and MPIN happen as separate guided onboarding steps after account creation."
        sideHighlights={sideHighlights}
        progress={progress}
        currentStepLabel={currentStepMeta.label}
        totalStepLabel={`Step ${stepIndex + 1} of ${stepSequence.length}`}
        stepLabels={stepLabels}
        error={error}
        footer={
          <>
            Already registered?{' '}
            <Link to="/login" style={{ fontWeight: 700, textDecoration: 'underline' }}>Sign in here</Link>
          </>
        }
      >
        <Stack spacing={2.5}>
          {step !== STEPS.CONTACT && step !== STEPS.RESULT ? (
            <Button
              variant="text"
              onClick={goBack}
              startIcon={<ArrowLeft size={15} />}
              sx={{ alignSelf: 'flex-start', fontSize: 13, color: 'text.secondary', px: 0 }}
            >
              Back
            </Button>
          ) : null}
          {stepRenderer[step]()}
        </Stack>
      </AuthShell>

      <div id="recaptcha-container" />
    </>
  );
}

export default SignupPage;
