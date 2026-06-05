import { Loader2, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveOnboardingStatus, setMpin } from '../services/api';
import { Box, Stack, Typography, Alert, Button } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { resolveInvestorRoute } from '../utils/onboardingRouter';

function SetupMpinPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [mpin, setMpinValue] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    if (mpin.length !== 4) {
      setError('Please choose a 4-digit MPIN.');
      return;
    }
    if (mpin !== confirmMpin) {
      setError('MPINs do not match. Please verify your entries.');
      return;
    }
    
    // Check simple patterns
    const simplePatterns = ['1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999', '0000', '1234', '4321'];
    if (simplePatterns.includes(mpin)) {
      setError('Choose a stronger PIN. Avoid simple patterns like 1234 or 1111.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const response = await setMpin(mpin);
      saveOnboardingStatus(response);
      navigate(resolveInvestorRoute(response), { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to set MPIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        mx: 'auto',
        maxWidth: 450,
        borderRadius: '28px',
        p: { xs: 3, sm: 4 },
        background: isDark
          ? 'linear-gradient(135deg, rgba(11,29,57,0.85) 0%, rgba(7,20,38,0.95) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(243,247,251,0.95) 100%)',
        border: '1px solid',
        borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(37,99,235,0.1)',
        boxShadow: isDark ? '0 24px 60px rgba(0,0,0,0.5)' : '0 24px 60px rgba(15,23,42,0.08)',
        backdropFilter: 'blur(16px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow Ambient Effect */}
      <Box
        sx={{
          position: 'absolute',
          top: -40,
          right: -40,
          width: 140,
          height: 140,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          filter: 'blur(70px)',
          opacity: 0.15,
          pointerEvents: 'none',
        }}
      />

      <Stack spacing={1} alignItems="center" sx={{ textAlign: 'center', mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: '16px',
            bgcolor: isDark ? 'rgba(37,99,235,0.15)' : 'rgba(37,99,235,0.08)',
            color: 'primary.main',
            mb: 1.5,
            boxShadow: 'inset 0 0 12px rgba(37,99,235,0.1)',
          }}
        >
          <ShieldCheck size={22} />
        </Box>
        <Typography variant="h4" sx={{ fontSize: { xs: 20, sm: 24 }, fontWeight: 800, color: isDark ? 'white' : '#0f172a' }}>
          Setup Security PIN
        </Typography>
        <Typography variant="body2" sx={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#475569', maxW: 360, fontSize: 12.5 }}>
          Configure a secure 4-digit PIN (MPIN) for quick account login and financial operations.
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: '14px', fontSize: 12.5 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        
        {/* Row 1: Choose MPIN */}
        <Box sx={{ position: 'relative' }}>
          <Typography sx={{ fontSize: 11, fontWeight: 800, color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', mb: 1, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center' }}>
            Choose 4-Digit PIN
          </Typography>
          <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ py: 0.5 }}>
              {Array.from({ length: 4 }).map((_, i) => {
                const isActive = mpin.length === i;
                return (
                  <Box
                    key={i}
                    sx={{
                      width: 52,
                      height: 56,
                      borderRadius: '14px',
                      border: '2px solid',
                      borderColor: isActive
                        ? 'primary.main'
                        : mpin.length > i
                          ? 'primary.main'
                          : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(148,163,184,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: mpin.length > i
                        ? (isDark ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.primary.main, 0.05))
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
              onChange={(e) => setMpinValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
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

        {/* Row 2: Confirm MPIN */}
        <Box sx={{ position: 'relative', mt: 1 }}>
          <Typography sx={{ fontSize: 11, fontWeight: 800, color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', mb: 1, letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center' }}>
            Confirm 4-Digit PIN
          </Typography>
          <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ py: 0.5 }}>
              {Array.from({ length: 4 }).map((_, i) => {
                const isActive = confirmMpin.length === i;
                return (
                  <Box
                    key={i}
                    sx={{
                      width: 52,
                      height: 56,
                      borderRadius: '14px',
                      border: '2px solid',
                      borderColor: isActive
                        ? 'primary.main'
                        : confirmMpin.length > i
                          ? 'primary.main'
                          : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(148,163,184,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: confirmMpin.length > i
                        ? (isDark ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.primary.main, 0.05))
                        : 'transparent',
                      transition: 'all 0.15s ease',
                      boxShadow: isActive ? `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}` : 'none',
                    }}
                  >
                    {confirmMpin[i] ? (
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
              value={confirmMpin}
              onChange={(e) => setConfirmMpin(e.target.value.replace(/\D/g, '').slice(0, 4))}
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

        <Button
          fullWidth
          size="large"
          type="submit"
          disabled={loading || mpin.length !== 4 || confirmMpin.length !== 4}
          sx={{
            py: 1.5,
            mt: 2,
            borderRadius: '14px',
            fontSize: '14px',
            fontWeight: 800,
            textTransform: 'none',
            bgcolor: 'primary.main',
            color: 'white',
            boxShadow: '0 10px 20px rgba(37,99,235,0.18)',
            '&:hover': {
              bgcolor: 'primary.dark',
              boxShadow: '0 12px 24px rgba(37,99,235,0.28)',
            },
            '&:disabled': {
              bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
              color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.3)',
              boxShadow: 'none',
            }
          }}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm & Save PIN'}
        </Button>
      </Box>
    </Box>
  );
}

export default SetupMpinPage;
