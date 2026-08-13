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
          gridTemplateColumns: { xs: '1fr', lg: '1.1fr 0.9fr' },
          maxWidth: { xs: '100%', sm: 520, lg: 1180 },
          mx: 'auto',
          width: '100%',
          my: { xs: 0, sm: 3, lg: 4 },
          overflow: 'hidden',
          borderRadius: { xs: 0, sm: '28px', lg: '32px' },
          border: { xs: 'none', sm: '1px solid' },
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(148,163,184,0.15)',
          boxShadow: { xs: 'none', sm: isDark ? '0 40px 80px rgba(0,0,0,0.4)' : '0 40px 80px rgba(15,23,42,0.1)' },
          bgcolor: isDark ? '#0b1527' : 'common.white',
          alignSelf: { xs: 'stretch', sm: 'start' },
        }}
      >
        {/* ── Left: Feature panel (desktop only) ── */}
        <Box
          sx={{
            display: { xs: 'none', lg: 'flex' },
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden',
            px: 6,
            py: 6,
            background: 'linear-gradient(155deg, #071a31 0%, #0d274b 50%, #0a1e3b 100%)',
          }}
        >
          {/* Decorative glows */}
          <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 10% 20%, rgba(56,189,248,0.18), transparent 35%), radial-gradient(circle at 85% 80%, rgba(37,99,235,0.22), transparent 30%)', pointerEvents: 'none' }} />

          <Stack sx={{ position: 'relative', height: '100%', gap: 4 }}>
            {/* Brand */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Box component="img" src={BRAND_LOGO_PRIMARY} alt="Anusha Trade"
                onError={(e) => { e.currentTarget.src = BRAND_LOGO_FALLBACK; }}
                sx={{ width: 60, height: 60, borderRadius: '18px', bgcolor: 'white', p: 0.6, objectFit: 'contain' }}
              />
              <Box>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, lineHeight: 1.1 }}>Anusha Trade</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Investor account workspace</Typography>
              </Box>
            </Stack>

            {/* Side content */}
            <Box sx={{ flex: 1 }}>
              {sideLabel && (
                <Box sx={{ display: 'inline-flex', px: 2, py: 0.75, borderRadius: '99px', bgcolor: 'rgba(255,255,255,0.1)', mb: 2.5 }}>
                  <Typography sx={{ color: 'white', fontWeight: 800, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase' }}>{sideLabel}</Typography>
                </Box>
              )}
              <Typography variant="h2" sx={{ fontSize: { lg: 40, xl: 48 }, color: 'white', lineHeight: 1.18, fontWeight: 700, maxWidth: 500 }}>
                {sideTitle}
              </Typography>
              <Typography sx={{ mt: 2.5, color: 'rgba(255,255,255,0.72)', lineHeight: 1.85, fontSize: 15, maxWidth: 480 }}>
                {sideDescription}
              </Typography>
            </Box>

            {/* Highlights */}
            {sideHighlights.length > 0 && (
              <Stack spacing={1.5}>
                {sideHighlights.map((item) => (
                  <Box key={item.title} sx={{ p: 2, borderRadius: '18px', bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ width: 38, height: 38, display: 'grid', placeItems: 'center', borderRadius: '12px', bgcolor: 'rgba(59,130,246,0.2)', color: '#93c5fd', flexShrink: 0 }}>
                        {item.icon}
                      </Box>
                      <Box>
                        <Typography sx={{ color: 'white', fontWeight: 700, fontSize: 14 }}>{item.title}</Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: 12.5, mt: 0.25, lineHeight: 1.6 }}>{item.copy}</Typography>
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Stack>
        </Box>

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
          {/* Desktop brand (no sidebar) */}
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ display: { xs: 'none', sm: 'flex', lg: 'none' } }}
          >
            <Box component="img" src={BRAND_LOGO_PRIMARY} alt="Anusha Trade"
              onError={(e) => { e.currentTarget.src = BRAND_LOGO_FALLBACK; }}
              sx={{ width: 40, height: 40, borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9', p: 0.5, objectFit: 'contain' }}
            />
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: 15, lineHeight: 1.1 }}>Anusha Trade</Typography>
              <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>Investor Portal</Typography>
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
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
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
