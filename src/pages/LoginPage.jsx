import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Divider,
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
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import AuthShell from '../components/auth/AuthShell';
import { hydrateInvestorSessionState, loginWithEmail, saveAuthData, verifyMpinLogin } from '../services/api';
import { resolveInvestorRoute } from '../utils/onboardingRouter';

const highlights = [
  {
    title: 'Investor-ready dashboard',
    copy: 'Track investments, interest payouts, receipts, referrals, and onboarding status in one place.',
    icon: <BriefcaseBusiness size={18} />,
  },
  {
    title: 'Secure admin controls',
    copy: 'Admin users can review KYC, verify payments, process withdrawals, and manage accounts.',
    icon: <ShieldCheck size={18} />,
  },
  {
    title: 'Fast access options',
    copy: 'Sign in using email & password or use MPIN with your mobile number for repeat access.',
    icon: <Smartphone size={18} />,
  },
];

/* ── Mode toggle pill ─────────────────────── */
function ModePill({ value, onChange }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const options = [
    { value: 'password', label: 'Password' },
    { value: 'mpin', label: 'MPIN' },
  ];
  return (
    <Box
      sx={{
        display: 'inline-flex',
        p: 0.5,
        borderRadius: '14px',
        bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(241,245,249,1)',
        border: '1px solid',
        borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(226,232,240,0.8)',
        width: '100%',
      }}
    >
      {options.map((opt) => (
        <Box
          key={opt.value}
          component="button"
          type="button"
          onClick={() => onChange(opt.value)}
          sx={{
            flex: 1,
            border: 'none',
            cursor: 'pointer',
            py: 1,
            px: 1.5,
            borderRadius: '11px',
            fontSize: 13,
            fontWeight: 700,
            fontFamily: '"Manrope", sans-serif',
            transition: 'all 0.2s ease',
            bgcolor: value === opt.value
              ? isDark ? 'rgba(37,99,235,0.9)' : 'white'
              : 'transparent',
            color: value === opt.value
              ? isDark ? 'white' : 'primary.main'
              : 'text.secondary',
            boxShadow: value === opt.value
              ? isDark
                ? '0 4px 14px rgba(37,99,235,0.35)'
                : '0 2px 10px rgba(15,23,42,0.1)'
              : 'none',
          }}
        >
          {opt.label}
        </Box>
      ))}
    </Box>
  );
}

function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const routeState = location.state || {};

  const [identifier, setIdentifier] = useState(routeState.prefillIdentifier || '');
  const [password, setPassword] = useState('');
  const [mpin, setMpin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [credentialMode, setCredentialMode] = useState(routeState.prefillMode || 'password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState(routeState.infoMessage || '');

  useEffect(() => {
    if (!routeState.prefillIdentifier && !routeState.prefillMode && !routeState.infoMessage) return;
    setIdentifier(routeState.prefillIdentifier || '');
    setCredentialMode(routeState.prefillMode || 'password');
    setInfoMessage(routeState.infoMessage || '');
  }, [routeState.infoMessage, routeState.prefillIdentifier, routeState.prefillMode]);

  const handleModeChange = (mode) => {
    setCredentialMode(mode);
    setError('');
    if (mode === 'mpin') {
      if (identifier.includes('@')) {
        setIdentifier('');
      } else {
        setIdentifier(identifier.replace(/\D/g, '').slice(0, 10));
      }
    } else {
      if (/^\d+$/.test(identifier)) {
        setIdentifier('');
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const normalizedIdentifier = credentialMode === 'mpin'
        ? identifier.replace(/\D/g, '').slice(0, 10)
        : identifier.trim();

      if (credentialMode === 'password' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier)) {
        throw new Error('Use your registered email address with password login.');
      }
      if (credentialMode === 'mpin' && normalizedIdentifier.length !== 10) {
        throw new Error('Use your 10-digit mobile number with MPIN login.');
      }

      const result = credentialMode === 'mpin'
        ? await verifyMpinLogin(normalizedIdentifier, mpin)
        : await loginWithEmail(normalizedIdentifier, password);

      let sessionState = { ...result };

      saveAuthData({
        ...sessionState,
        email: result.email || (normalizedIdentifier.includes('@') ? normalizedIdentifier : ''),
        mobileNumber: result.mobileNumber || result.phoneNumber || (!normalizedIdentifier.includes('@') ? normalizedIdentifier : ''),
      });

      const needsHydration = !sessionState.kycStatus
        || sessionState.bankVerified === undefined
        || sessionState.mpinCreated === undefined
        || !sessionState.accountStatus
        || !sessionState.onboardingStatus;

      if (!['admin', 'super_admin'].includes(String(result.role || '').toLowerCase()) && needsHydration) {
        try {
          const hydratedState = await hydrateInvestorSessionState();
          sessionState = { ...sessionState, ...hydratedState };
          saveAuthData(sessionState);
        } catch (_) {
          // Fall back to whatever was returned during login.
        }
      }

      const role = ['admin', 'super_admin'].includes(String(result.role || '').toLowerCase())
        ? 'admin'
        : 'user';
      onLogin(role);
      navigate(role === 'admin' ? '/admin' : resolveInvestorRoute(sessionState), { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Investor Portal"
      title="Sign in to your account"
      subtitle="Use email and password, or use mobile number with MPIN."
      sideLabel="Secure Access"
      sideTitle="A cleaner investor login with clear paths for users and admins."
      sideDescription="Sign in, finish pending onboarding, and continue directly into your portfolio or review actions."
      sideHighlights={highlights}
      error={error}
      footer={
        <>
          New investor?{' '}
          <Link to="/signup" style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}>
            Create your account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <Stack spacing={2.5}>
          {infoMessage ? (
            <Box
              sx={{
                borderRadius: '14px',
                px: 2,
                py: 1.5,
                bgcolor: isDark ? 'rgba(37,99,235,0.12)' : alpha(theme.palette.primary.main, 0.08),
                color: 'primary.main',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {infoMessage}
            </Box>
          ) : null}

          {/* Identifier */}
          <TextField
            label={credentialMode === 'mpin' ? 'Mobile number' : 'Email address'}
            placeholder={credentialMode === 'mpin' ? '10-digit mobile number' : 'Registered email address'}
            value={identifier}
            onChange={(e) => setIdentifier(credentialMode === 'mpin' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value)}
            required
            fullWidth
            inputProps={{
              inputMode: credentialMode === 'mpin' ? 'numeric' : 'email',
              maxLength: credentialMode === 'mpin' ? 10 : undefined,
              autoComplete: 'username',
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
          />

          {/* Mode toggle */}
          <ModePill value={credentialMode} onChange={handleModeChange} />

          {/* Credential field */}
          {credentialMode === 'password' ? (
            <TextField
              label="Password"
              placeholder="Enter your password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <KeyRound size={16} style={{ color: theme.palette.text.secondary }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px' } }}
            />
          ) : (
            <Box sx={{ position: 'relative', width: '100%', py: 1 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.secondary', mb: 1.5, textAlign: 'center' }}>
                Enter 4-digit MPIN
              </Typography>
              <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ py: 1 }}>
                  {Array.from({ length: 4 }).map((_, i) => {
                    const isActive = mpin.length === i;
                    return (
                      <Box
                        key={i}
                        sx={{
                          width: 48,
                          height: 54,
                          borderRadius: '14px',
                          border: '2px solid',
                          borderColor: isActive
                            ? 'primary.main'
                            : mpin.length > i
                              ? 'primary.main'
                              : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(148,163,184,0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: mpin.length > i
                            ? isDark ? alpha('#2563eb', 0.15) : alpha('#2563eb', 0.06)
                            : 'transparent',
                          transition: 'all 0.15s ease',
                          boxShadow: isActive ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}` : 'none',
                        }}
                      >
                        {mpin[i] ? (
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main' }} />
                        ) : null}
                      </Box>
                    );
                  })}
                </Stack>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={4}
                  value={mpin}
                  onChange={(e) => setMpin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  autoFocus
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    zIndex: 10,
                    cursor: 'pointer',
                    border: 'none',
                    outline: 'none',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                />
              </Box>
            </Box>
          )}

          {/* Forgot links */}
          <Stack direction="row" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Typography
              component={Link}
              to="/forgot-password"
              sx={{ fontSize: 13, color: 'primary.main', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Forgot password?
            </Typography>
            <Typography
              component={Link}
              to="/forgot-mpin"
              sx={{ fontSize: 13, color: 'primary.main', fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              Forgot MPIN?
            </Typography>
          </Stack>

          {/* Submit */}
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading}
            endIcon={loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            sx={{
              borderRadius: '14px',
              py: 1.5,
              fontSize: 15,
              fontWeight: 700,
              boxShadow: '0 8px 24px rgba(37,99,235,0.28)',
              '&:hover': { boxShadow: '0 12px 30px rgba(37,99,235,0.35)', transform: 'translateY(-1px)' },
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? 'Signing in...' : 'Continue to account'}
          </Button>

        </Stack>
      </form>
    </AuthShell>
  );
}

export default LoginPage;
