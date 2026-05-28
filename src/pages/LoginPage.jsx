import { ArrowRight, BriefcaseBusiness, Loader2, ShieldCheck, Share2 } from 'lucide-react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginWithEmail, verifyMpinLogin, saveAuthData } from '../services/api';
import { BRAND_LOGO_FALLBACK, BRAND_LOGO_PRIMARY } from '../constants/branding';
import { resolveInvestorRoute } from '../utils/onboardingRouter';

const highlights = [
  {
    title: 'Investor dashboard',
    copy: 'Track investments, wallet balance, monthly interest, receipts, and referral activity.',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Admin control center',
    copy: 'Manage investors, payments, withdrawals, fraud checks, reports, and platform settings.',
    icon: ShieldCheck,
  },
  {
    title: 'Referral and wallet flows',
    copy: 'Both user and admin roles can monitor referral activity and wallet-related operations.',
    icon: Share2,
  },
];

function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [mpin, setMpin] = useState('');
  const [credentialMode, setCredentialMode] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (credentialMode === 'mpin') {
        if (mpin.length < 4 || mpin.length > 6) {
          setError('MPIN must be 4-6 digits.');
          setLoading(false);
          return;
        }
        result = await verifyMpinLogin(identifier, mpin);
      } else {
        result = await loginWithEmail(identifier, password);
      }

      saveAuthData({
        ...result,
        email: result.email || (identifier.includes('@') ? identifier : ''),
        mobileNumber: result.mobileNumber || result.phoneNumber || (!identifier.includes('@') ? identifier : ''),
      });

      const role = (result.role?.toLowerCase() === 'admin' || result.role?.toLowerCase() === 'super_admin') ? 'admin' : 'user';
      onLogin(role);
      const investorRoute = resolveInvestorRoute(result);
      navigate(role === 'admin' ? '/admin' : investorRoute, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2, py: 4 }}>
      <Card sx={{ width: '100%', maxWidth: 1240, overflow: 'hidden', borderRadius: '32px' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 460px' } }}>
          <Box
            sx={{
              position: 'relative',
              px: { xs: 3, sm: 5 },
              py: { xs: 4, sm: 5 },
              color: 'white',
              background: 'linear-gradient(160deg, #07172d 0%, #102447 48%, #0a1831 100%)',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at top left, rgba(59,130,246,0.24), transparent 28%), radial-gradient(circle at bottom right, rgba(14,165,233,0.18), transparent 24%)',
              }}
            />
            <Box sx={{ position: 'relative' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  component="img"
                  src={BRAND_LOGO_PRIMARY}
                  alt="Anusha Trade"
                  onError={(e) => { e.currentTarget.src = BRAND_LOGO_FALLBACK; }}
                  sx={{ width: 64, height: 64, borderRadius: '20px', bgcolor: 'white', p: 0.5, objectFit: 'contain' }}
                />
                <div>
                  <Typography variant="h4" sx={{ fontSize: 30, color: 'white' }}>Anusha Trade</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Investor + Admin Portal</Typography>
                </div>
              </Stack>

              <Chip
                label="User & Admin Access"
                color="primary"
                sx={{ mt: 8, borderRadius: '999px', fontWeight: 800, letterSpacing: '0.18em' }}
              />
              <Typography variant="h1" sx={{ mt: 3, fontSize: { xs: 40, sm: 52 }, color: 'white', maxWidth: 760 }}>
                One portal for investor onboarding, portfolio tracking, and admin operations.
              </Typography>
              <Typography sx={{ mt: 3, maxWidth: 640, color: 'rgba(255,255,255,0.76)', lineHeight: 1.8 }}>
                Sign in with email, mobile, password, or MPIN. The onboarding flow, KYC flow,
                bank linking flow, and admin review pipeline are now connected to the live backend.
              </Typography>

              <Stack spacing={2} sx={{ mt: 5 }}>
                {highlights.map(({ title, copy, icon: Icon }) => (
                  <Card
                    key={title}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.05)',
                      borderColor: 'rgba(255,255,255,0.08)',
                      boxShadow: 'none',
                    }}
                  >
                    <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: '18px',
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: 'rgba(37,99,235,0.18)',
                          color: '#dbeafe',
                          flexShrink: 0,
                        }}
                      >
                        <Icon className="h-5 w-5" />
                      </Box>
                      <div>
                        <Typography variant="h6" sx={{ color: 'white', fontSize: 18 }}>{title}</Typography>
                        <Typography variant="body2" sx={{ mt: 0.75, color: 'rgba(255,255,255,0.72)', lineHeight: 1.8 }}>
                          {copy}
                        </Typography>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          </Box>

          <CardContent sx={{ p: { xs: 3, sm: 4.5 } }}>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: '0.22em' }}>
              Welcome back
            </Typography>
            <Typography variant="h3" sx={{ mt: 1.5, fontSize: { xs: 30, sm: 36 } }}>
              Sign In
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, mb: 3.5, lineHeight: 1.8 }}>
              Enter your credentials to access your investor or admin account.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2.5 }}>{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  label="Mobile Number or Email"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="Enter mobile number or email"
                  required
                  fullWidth
                />

                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.25 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                      {credentialMode === 'password' ? 'Password' : 'MPIN'}
                    </Typography>
                    <ToggleButtonGroup
                      exclusive
                      size="small"
                      value={credentialMode}
                      onChange={(_, value) => {
                        if (value) {
                          setCredentialMode(value);
                          setError('');
                        }
                      }}
                    >
                      <ToggleButton value="password">Password</ToggleButton>
                      <ToggleButton value="mpin">MPIN</ToggleButton>
                    </ToggleButtonGroup>
                  </Stack>

                  {credentialMode === 'password' ? (
                    <TextField
                      type="password"
                      required
                      fullWidth
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter password"
                    />
                  ) : (
                    <TextField
                      type="password"
                      required
                      fullWidth
                      inputProps={{ maxLength: 6, inputMode: 'numeric' }}
                      value={mpin}
                      onChange={(event) => setMpin(event.target.value.replace(/\D/g, ''))}
                      placeholder="Enter MPIN"
                    />
                  )}
                </Box>

                <Stack direction="row" justifyContent="space-between" sx={{ fontSize: 14 }}>
                  <Link to="/forgot-password" className="font-medium text-blue-600 hover:underline">
                    Forgot Password?
                  </Link>
                  <Link to="/forgot-mpin" className="font-medium text-blue-600 hover:underline">
                    Forgot MPIN?
                  </Link>
                </Stack>

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  endIcon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>

                <Divider>or</Divider>

                <Button
                  component={Link}
                  to="/signup"
                  variant="outlined"
                  size="large"
                  endIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Sign up with Mobile OTP
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Box>
      </Card>
    </Box>
  );
}

export default LoginPage;
