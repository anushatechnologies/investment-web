import {
  Alert,
  Box,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import { CheckCircle2 } from 'lucide-react';
import { BRAND_LOGO_FALLBACK, BRAND_LOGO_PRIMARY } from '../../constants/branding';

/* ─────────────────────────────────────────────
   Step indicator row (mobile pill-style)
───────────────────────────────────────────── */
function StepPills({ steps, currentLabel }) {
  const activeIdx = steps.indexOf(currentLabel);
  return (
    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexWrap: 'nowrap', overflowX: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
      {steps.map((label, i) => {
        const done = i < activeIdx;
        const active = i === activeIdx;
        return (
          <Stack key={label} direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: active ? 26 : 22,
                height: active ? 26 : 22,
                borderRadius: '50%',
                bgcolor: done ? 'success.main' : active ? 'primary.main' : 'action.disabledBackground',
                color: done || active ? 'common.white' : 'text.disabled',
                fontSize: 10,
                fontWeight: 800,
                transition: 'all 0.25s ease',
                flexShrink: 0,
              }}
            >
              {done ? <CheckCircle2 size={12} /> : i + 1}
            </Box>
            {active && (
              <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'primary.main', whiteSpace: 'nowrap' }}>
                {label}
              </Typography>
            )}
            {i < steps.length - 1 && (
              <Box sx={{ width: 14, height: 1.5, bgcolor: done ? 'success.main' : 'action.disabledBackground', borderRadius: 1, flexShrink: 0 }} />
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}

/* ─────────────────────────────────────────────
   Main AuthShell
───────────────────────────────────────────── */
function AuthShell({
  eyebrow,
  title,
  subtitle,
  sideLabel,
  sideTitle,
  sideDescription,
  sideHighlights = [],
  progress,
  currentStepLabel,
  totalStepLabel,
  stepLabels = [],
  error,
  children,
  footer,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isDark ? '#070c17' : '#f8fafc',
      }}
    >
      {/* ── Mobile sticky top bar ─────────────────── */}
      <Box
        sx={{
          display: { xs: 'flex', lg: 'none' },
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          px: 2,
          py: 1.5,
          backdropFilter: 'blur(18px)',
          bgcolor: isDark ? 'rgba(7,12,23,0.9)' : 'rgba(248,250,252,0.9)',
          borderBottom: '1px solid',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(148,163,184,0.15)',
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            component="img"
            src={BRAND_LOGO_PRIMARY}
            alt="Anusha Trade"
            onError={(e) => { e.currentTarget.src = BRAND_LOGO_FALLBACK; }}
            sx={{
              width: 34,
              height: 34,
              borderRadius: '10px',
              bgcolor: 'common.white',
              p: 0.4,
              objectFit: 'contain',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          />
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 13, lineHeight: 1.1 }}>Anusha Trade</Typography>
            <Typography sx={{ fontSize: 10, color: 'text.secondary', lineHeight: 1 }}>Investor Portal</Typography>
          </Box>
        </Stack>

        {/* Step pills */}
        {stepLabels.length > 0 && (
          <StepPills steps={stepLabels} currentLabel={currentStepLabel} />
        )}
      </Box>

      {/* ── Main content area ─────────────────────── */}
      <Box
        sx={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: sideHighlights.length === 0 ? '1fr' : '1.1fr 0.9fr' },
          maxWidth: { xs: '100%', sm: 520, lg: sideHighlights.length === 0 ? 480 : 1180 },
          mx: 'auto',
          width: '100%',
          my: { xs: 0, sm: 3, lg: 5 },
          overflow: 'hidden',
          borderRadius: { xs: 0, sm: '28px', lg: '32px' },
          border: { xs: 'none', sm: '1px solid' },
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(148,163,184,0.15)',
          boxShadow: { xs: 'none', sm: isDark ? '0 40px 80px rgba(0,0,0,0.4)' : '0 40px 80px rgba(15,23,42,0.1)' },
          bgcolor: isDark ? '#0b1527' : 'common.white',
          alignSelf: { xs: 'stretch', sm: 'center' },
        }}
      >
        {/* ── Left: Feature panel (only if sideHighlights provided) ── */}
        {sideHighlights.length > 0 && (
          <Box
            sx={{
              display: { xs: 'none', lg: 'flex' },
              flexDirection: 'column',
              position: 'relative',
              overflow: 'hidden',
              px: 6,
              py: 6,
              background: 'linear-gradient(155deg, #050b18 0%, #0d1b3e 50%, #060e24 100%)',
            }}
          >
            {/* Decorative ambient glowing orbs */}
            <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 15% 20%, rgba(37,99,235,0.35), transparent 40%), radial-gradient(circle at 85% 75%, rgba(16,185,129,0.22), transparent 35%)', pointerEvents: 'none' }} />

            <Stack sx={{ position: 'relative', height: '100%', gap: 4 }}>
              {/* Brand */}
              <Stack direction="row" spacing={2} alignItems="center">
                <Box component="img" src={BRAND_LOGO_PRIMARY} alt="Anusha Trade"
                  onError={(e) => { e.currentTarget.src = BRAND_LOGO_FALLBACK; }}
                  sx={{ width: 60, height: 60, borderRadius: '18px', bgcolor: 'white', p: 0.6, objectFit: 'contain', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
                />
                <Box>
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, lineHeight: 1.1, fontFamily: '"Sora", sans-serif' }}>Anusha Trade</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600 }}>Executive Wealth Management</Typography>
                </Box>
              </Stack>

              {/* Side content */}
              <Box sx={{ flex: 1 }}>
                {sideLabel && (
                  <Box sx={{ display: 'inline-flex', px: 2, py: 0.75, borderRadius: '99px', bgcolor: 'rgba(37,99,235,0.25)', border: '1px solid rgba(59,130,246,0.3)', mb: 2.5 }}>
                    <Typography sx={{ color: '#93c5fd', fontWeight: 800, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{sideLabel}</Typography>
                  </Box>
                )}
                <Typography variant="h2" sx={{ fontSize: { lg: 38, xl: 44 }, color: 'white', lineHeight: 1.18, fontWeight: 800, maxWidth: 500, fontFamily: '"Sora", sans-serif' }}>
                  {sideTitle}
                </Typography>
                <Typography sx={{ mt: 2.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.85, fontSize: 14.5, maxWidth: 480 }}>
                  {sideDescription}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}

        {/* ── Right: Form panel ─────────────────── */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            px: { xs: 2.5, sm: 4, lg: 5 },
            pt: { xs: 3, sm: 4, lg: 5 },
            pb: { xs: 4, sm: 4, lg: 5 },
            gap: 3,
          }}
        >
          {/* Desktop brand header (when sidebar is hidden or omitted) */}
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ display: { xs: 'none', sm: 'flex', lg: sideHighlights.length === 0 ? 'flex' : 'none' } }}
          >
            <Box component="img" src={BRAND_LOGO_PRIMARY} alt="Anusha Trade"
              onError={(e) => { e.currentTarget.src = BRAND_LOGO_FALLBACK; }}
              sx={{ width: 44, height: 44, borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9', p: 0.5, objectFit: 'contain' }}
            />
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 16, lineHeight: 1.1, fontFamily: '"Sora", sans-serif' }}>Anusha Trade</Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Executive Wealth Portal</Typography>
            </Box>
          </Stack>

          {/* Eyebrow + Title */}
          <Box>
            {eyebrow && (
              <Typography
                sx={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  color: 'primary.main',
                  mb: 1,
                }}
              >
                {eyebrow}
              </Typography>
            )}
            <Typography
              variant="h4"
              sx={{
                fontSize: { xs: 24, sm: 30 },
                fontWeight: 800,
                lineHeight: 1.2,
                fontFamily: '"Sora", sans-serif',
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography
                color="text.secondary"
                sx={{ mt: 1, fontSize: { xs: 13.5, sm: 14.5 }, lineHeight: 1.75 }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          {/* Progress bar */}
          {typeof progress === 'number' && (
            <Box>
              <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: 'text.primary' }}>
                  {currentStepLabel}
                </Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                  {totalStepLabel}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.max(0, Math.min(100, progress))}
                sx={{
                  height: 6,
                  borderRadius: 99,
                  bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.18)',
                  '& .MuiLinearProgress-bar': { borderRadius: 99 },
                }}
              />
            </Box>
          )}

          {/* Error */}
          {error && (
            <Alert
              severity="error"
              sx={{
                borderRadius: '14px',
                fontSize: 13,
                py: 1,
              }}
            >
              {error}
            </Alert>
          )}

          {/* Form content */}
          <Box>{children}</Box>

          {/* Footer */}
          {footer && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: 13, textAlign: 'center', pt: 1 }}
            >
              {footer}
            </Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default AuthShell;
