import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  ArrowRight,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Phone,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
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
  saveAuthData,
  sendOtp,
  verifyMpinLogin,
  verifyOtp,
} from '../services/api';
import { resolveInvestorRoute } from '../utils/onboardingRouter';

const highlights = [
  {
    title: '10.0% - 12.0% Monthly Yields',
    copy: 'Automated 30-day payout calculation credited directly to your verified wallet balance.',
    icon: <BriefcaseBusiness size={18} />,
  },
  {
    title: 'Bank-Grade Security & MPIN Gate',
    copy: 'Protected by 256-bit encryption, SMS OTP verification, and 6-digit MPIN authorization.',
    icon: <ShieldCheck size={18} />,
  },
  {
    title: 'Instant Bank Withdrawals',
    copy: 'Direct NEFT/IMPS withdrawals directly to your linked bank account with live IFSC tracking.',
    icon: <Smartphone size={18} />,
  },
];

export default function LoginPage({ onLogin }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const location = useLocation();
  const navigate = useNavigate();

  // Mode: 'mpin' (Mobile + 6-digit MPIN) or 'otp' (Mobile + OTP)
  const [loginMode, setLoginMode] = useState('mpin');
  const [mobileNumber, setMobileNumber] = useState('');
  const [mpin, setMpin] = useState('');
  const [showMpin, setShowMpin] = useState(false);

  // OTP Flow state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [timer, setTimer] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval = null;
    if (timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleMobileChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobileNumber(val);
    setError('');
  };

  const handleMpinChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setMpin(val);
    setError('');
  };

  const handleOtpChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(val);
    setError('');
  };

  // Send OTP handler
  const handleSendOtp = async () => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSendingOtp(true);
    setError('');
    setSuccessMsg('');

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
      const backendResp = await sendOtp(mobileNumber, '+91', 'LOGIN', { useFirebase: firebaseTriggered }).catch(() => null);

      setOtpSent(true);
      setTimer(30);

      if (backendResp?.otp) {
        setSuccessMsg(`OTP sent to +91 ${mobileNumber}. (Dev Preview: ${backendResp.otp})`);
      } else {
        setSuccessMsg(`OTP sent successfully to +91 ${mobileNumber}`);
      }
    } catch (err) {
      setError(err?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Login handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!mobileNumber || mobileNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (loginMode === 'mpin') {
      if (!mpin || mpin.length < 4) {
        setError('Please enter your 4 or 6-digit MPIN.');
        return;
      }
    } else {
      if (!otpSent) {
        handleSendOtp();
        return;
      }
      if (!otpCode || otpCode.length < 4) {
        setError('Please enter the 6-digit OTP sent to your phone.');
        return;
      }
    }

    setLoading(true);
    try {
      let response;
      if (loginMode === 'mpin') {
        response = await verifyMpinLogin(mobileNumber, mpin);
      } else {
        // Attempt Firebase verify first if active
        let firebaseIdToken = null;
        try {
          const confirmation = await firebaseVerifyOtp(otpCode);
          if (confirmation?.user) {
            firebaseIdToken = await confirmation.user.getIdToken(true);
          }
        } catch (fbVerifyErr) {
          console.warn('[Firebase Verify] Using backend OTP verification fallback:', fbVerifyErr);
        }

        const verifyPayload = {
          mobileNumber,
          phoneNumber: `+91${mobileNumber}`,
          otp: otpCode,
          type: 'LOGIN',
        };
        if (firebaseIdToken) {
          verifyPayload.idToken = firebaseIdToken;
        }

        response = await verifyOtp(verifyPayload);
      }

      if (!response || (!response.accessToken && !response.token)) {
        throw new Error(response?.message || 'Login verification failed.');
      }

      const token = response.accessToken || response.token;
      saveAuthData({
        accessToken: token,
        refreshToken: response.refreshToken,
        role: 'user',
        userId: response.user?.id || response.userId,
        name: response.user?.fullName || response.user?.name || response.name,
        mobileNumber: mobileNumber,
        user: response.user || response,
      });

      if (onLogin) onLogin('user');

      // Hydrate state and route to appropriate step
      const hydrated = await hydrateInvestorSessionState().catch(() => null);
      const targetRoute = resolveInvestorRoute(hydrated || {});
      const redirectState = location.state?.from?.pathname;
      navigate(redirectState || targetRoute || '/dashboard', { replace: true });
    } catch (err) {
      setError(err?.message || 'Invalid credentials. Please verify your Mobile and MPIN/OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Investor Login"
      subtitle="Access your smart wealth portfolio, daily earnings, and withdrawal desk"
      highlights={highlights}
    >
      <Stack spacing={3} component="form" onSubmit={handleSubmit}>
        {/* Mode Selector */}
        <Box
          sx={{
            display: 'flex',
            p: 0.5,
            borderRadius: '16px',
            bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(241,245,249,1)',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(226,232,240,0.8)',
          }}
        >
          <Box
            component="button"
            type="button"
            onClick={() => {
              setLoginMode('mpin');
              setError('');
            }}
            sx={{
              flex: 1,
              py: 1.2,
              px: 2,
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              transition: 'all 0.2s ease',
              bgcolor: loginMode === 'mpin' ? (isDark ? '#2563eb' : '#ffffff') : 'transparent',
              color: loginMode === 'mpin' ? (isDark ? '#ffffff' : '#1e293b') : 'text.secondary',
              boxShadow:
                loginMode === 'mpin'
                  ? isDark
                    ? '0 4px 14px rgba(37,99,235,0.4)'
                    : '0 2px 8px rgba(0,0,0,0.08)'
                  : 'none',
            }}
          >
            <KeyRound size={16} />
            6-Digit MPIN
          </Box>
          <Box
            component="button"
            type="button"
            onClick={() => {
              setLoginMode('otp');
              setError('');
            }}
            sx={{
              flex: 1,
              py: 1.2,
              px: 2,
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              transition: 'all 0.2s ease',
              bgcolor: loginMode === 'otp' ? (isDark ? '#2563eb' : '#ffffff') : 'transparent',
              color: loginMode === 'otp' ? (isDark ? '#ffffff' : '#1e293b') : 'text.secondary',
              boxShadow:
                loginMode === 'otp'
                  ? isDark
                    ? '0 4px 14px rgba(37,99,235,0.4)'
                    : '0 2px 8px rgba(0,0,0,0.08)'
                  : 'none',
            }}
          >
            <Smartphone size={16} />
            Mobile OTP
          </Box>
        </Box>

        {/* Feedback Alerts */}
        {error && (
          <Box
            sx={{
              p: 1.8,
              borderRadius: '12px',
              bgcolor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            {error}
          </Box>
        )}

        {successMsg && (
          <Box
            sx={{
              p: 1.8,
              borderRadius: '12px',
              bgcolor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            {successMsg}
          </Box>
        )}

        {/* Mobile Input */}
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.8, display: 'block' }}>
            REGISTERED MOBILE NUMBER
          </Typography>
          <TextField
            fullWidth
            placeholder="10-digit mobile number"
            value={mobileNumber}
            onChange={handleMobileChange}
            disabled={loading || (loginMode === 'otp' && otpSent)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1, borderRight: '1px solid rgba(148, 163, 184, 0.3)' }}>
                    <Phone size={16} className="text-slate-400" />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      +91
                    </Typography>
                  </Box>
                </InputAdornment>
              ),
              sx: { borderRadius: '14px' },
            }}
          />
        </Box>

        {/* MPIN Input Mode */}
        {loginMode === 'mpin' && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                SECURITY MPIN (6-DIGIT)
              </Typography>
              <Link
                to="/forgot-mpin"
                className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors"
              >
                Forgot MPIN?
              </Link>
            </Box>
            <TextField
              fullWidth
              type={showMpin ? 'text' : 'password'}
              placeholder="••••••"
              value={mpin}
              onChange={handleMpinChange}
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock size={18} className="text-slate-400" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowMpin(!showMpin)} edge="end" size="small">
                      {showMpin ? <EyeOff size={18} /> : <Eye size={18} />}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: { borderRadius: '14px', letterSpacing: showMpin ? 'normal' : '0.3em', fontSize: '1.1rem' },
              }}
            />
          </Box>
        )}

        {/* OTP Input Mode */}
        {loginMode === 'otp' && (
          <Box>
            {!otpSent ? (
              <Button
                fullWidth
                variant="outlined"
                onClick={handleSendOtp}
                disabled={isSendingOtp || mobileNumber.length !== 10}
                sx={{
                  py: 1.6,
                  borderRadius: '14px',
                  fontWeight: 700,
                  textTransform: 'none',
                  borderColor: isDark ? 'rgba(59, 130, 246, 0.4)' : 'primary.main',
                }}
              >
                {isSendingOtp ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Loader2 size={18} className="animate-spin" />
                    <span>Sending SMS OTP...</span>
                  </Stack>
                ) : (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Smartphone size={18} />
                    <span>Send Verification OTP</span>
                  </Stack>
                )}
              </Button>
            ) : (
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>
                    ENTER 6-DIGIT OTP
                  </Typography>
                  {timer > 0 ? (
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      Resend in {timer}s
                    </Typography>
                  ) : (
                    <Button
                      variant="text"
                      size="small"
                      onClick={handleSendOtp}
                      disabled={isSendingOtp}
                      sx={{ p: 0, minWidth: 'auto', textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}
                    >
                      Resend OTP
                    </Button>
                  )}
                </Box>
                <TextField
                  fullWidth
                  placeholder="Enter 6-digit OTP"
                  value={otpCode}
                  onChange={handleOtpChange}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <KeyRound size={18} className="text-slate-400" />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: '14px', letterSpacing: '0.25em', fontSize: '1.1rem' },
                  }}
                />
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    setOtpSent(false);
                    setOtpCode('');
                  }}
                  sx={{ alignSelf: 'flex-start', textTransform: 'none', fontSize: '0.75rem', fontWeight: 600 }}
                >
                  Change Mobile Number
                </Button>
              </Stack>
            )}
          </Box>
        )}

        {/* Submit Button */}
        <Button
          fullWidth
          type="submit"
          variant="contained"
          disabled={
            loading ||
            mobileNumber.length !== 10 ||
            (loginMode === 'mpin' && mpin.length < 4) ||
            (loginMode === 'otp' && (!otpSent || otpCode.length < 4))
          }
          sx={{
            py: 1.8,
            borderRadius: '14px',
            fontWeight: 800,
            fontSize: '1rem',
            textTransform: 'none',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
            },
          }}
        >
          {loading ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <Loader2 size={20} className="animate-spin" />
              <span>Verifying & Logging in...</span>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              <span>Enter Wealth Portal</span>
              <ArrowRight size={18} />
            </Stack>
          )}
        </Button>

        {/* Registration Prompt */}
        <Box sx={{ textAlign: 'center', pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an investor account yet?{' '}
            <Link
              to="/signup"
              className="font-bold text-blue-500 hover:text-blue-600 transition-colors ml-1"
            >
              Register with Mobile
            </Link>
          </Typography>
        </Box>
        {/* Invisible Firebase reCAPTCHA Container */}
        <div id="recaptcha-container" style={{ display: 'none' }} />
      </Stack>
    </AuthShell>
  );
}
