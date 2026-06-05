import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  IconButton,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useLocation } from 'react-router-dom';
import { adminProfile } from '../../data/adminData';
import { useEffect, useState } from 'react';
import { getNotificationSummary } from '../../services/api';
import { useAppTheme } from '../../theme/ThemeContext';

const pageMeta = {
  '/admin': {
    title: 'Dashboard',
    eyebrow: 'Executive Overview',
    summary: 'Monitor investors, receipts, withdrawals, and platform health from one command center.',
  },
  '/admin/investors': {
    title: 'Investors',
    eyebrow: 'Investor Operations',
    summary: 'Track onboarding, KYC progress, and account readiness across the pipeline.',
  },
  '/admin/investments': {
    title: 'Investments',
    eyebrow: 'Portfolio Book',
    summary: 'Follow allocations, activation status, and lifecycle movement.',
  },
  '/admin/revenue': {
    title: 'Revenue',
    eyebrow: 'Finance Desk',
    summary: 'Measure income, performance, and referral-driven business flow.',
  },
  '/admin/withdrawals': {
    title: 'Withdrawals',
    eyebrow: 'Payout Review',
    summary: 'Approve and process withdrawals with clean operational visibility.',
  },
  '/admin/referrals': {
    title: 'Referral Statistics',
    eyebrow: 'Growth Partnerships',
    summary: 'Track referral expansion and contribution to platform growth.',
  },
  '/admin/fraud-monitoring': {
    title: 'Fraud Monitoring',
    eyebrow: 'Risk Control',
    summary: 'Investigate risky behavior, alerts, and escalations quickly.',
  },
  '/admin/payment-verification': {
    title: 'Payment Verification',
    eyebrow: 'Receipt Verification',
    summary: 'Review uploaded payment evidence before activating investments.',
  },
  '/admin/user-management': {
    title: 'User Management',
    eyebrow: 'Access Management',
    summary: 'Control account activation, suspension, and operational review.',
  },
  '/admin/reports': {
    title: 'Reports',
    eyebrow: 'Reporting Suite',
    summary: 'Export and inspect the latest operational metrics.',
  },
  '/admin/settings': {
    title: 'Settings',
    eyebrow: 'Platform Settings',
    summary: 'Configure rules, thresholds, and admin preferences.',
  },
};

function AdminHeader({ onOpenSidebar }) {
  const { pathname } = useLocation();
  const meta = pageMeta[pathname] ?? pageMeta['/admin'];
  const [unreadCount, setUnreadCount] = useState(0);
  const theme = useTheme();
  const { mode, toggleTheme } = useAppTheme();
  const isDark = theme.palette.mode === 'dark';
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const textMuted = alpha(isDark ? '#ffffff' : '#0f172a', isDark ? 0.62 : 0.58);
  const panelBg = isDark ? 'rgba(15,23,42,0.68)' : 'rgba(255,255,255,0.88)';
  const panelBorder = isDark ? 'rgba(148,163,184,0.16)' : 'rgba(148,163,184,0.24)';
  const commandBg = isDark
    ? 'linear-gradient(135deg, rgba(8,17,37,0.92), rgba(11,26,57,0.86))'
    : 'linear-gradient(135deg, rgba(255,255,255,0.96), rgba(239,246,255,0.9))';

  useEffect(() => {
    let active = true;

    const fetchNotifications = () => {
      getNotificationSummary()
        .then((response) => {
          if (!active) return;
          setUnreadCount(Number(response?.unreadNotifications ?? response?.unreadCount ?? 0));
        })
        .catch(() => {
          if (!active) return;
          setUnreadCount(0);
        });
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <AppBar
      position="sticky"
      color="transparent"
      elevation={0}
      sx={{
        px: { xs: 1.25, sm: 2, lg: 3 },
        pt: { xs: 1, lg: 1.5 },
        pb: { xs: 0.75, lg: 1 },
        backdropFilter: 'none',
        backgroundColor: 'transparent',
        borderBottom: 'none',
        boxShadow: 'none',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: { xs: '22px', lg: '28px' },
          border: `1px solid ${panelBorder}`,
          background: commandBg,
          boxShadow: isDark
            ? '0 24px 60px rgba(2,8,23,0.36)'
            : '0 22px 55px rgba(37,99,235,0.10)',
          backdropFilter: 'blur(22px)',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: isDark
              ? 'radial-gradient(circle at 12% 0%, rgba(59,130,246,0.18), transparent 34%)'
              : 'radial-gradient(circle at 14% 0%, rgba(37,99,235,0.14), transparent 34%)',
          },
        }}
      >
        <Toolbar sx={{ position: 'relative', minHeight: { xs: 74, lg: 92 }, px: { xs: 1.5, sm: 2.25, lg: 3 }, py: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ width: '100%', minWidth: 0 }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
            <IconButton
              onClick={onOpenSidebar}
              sx={{
                display: { lg: 'none' },
                width: 42,
                height: 42,
                bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.04)',
                color: textPrimary,
                border: `1px solid ${panelBorder}`,
                boxShadow: isDark ? 'none' : '0 10px 24px rgba(15,23,42,0.06)',
              }}
            >
              <MenuRoundedIcon />
            </IconButton>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.7, flexWrap: 'wrap' }}>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1.1,
                    py: 0.45,
                    borderRadius: '999px',
                    color: isDark ? '#fde68a' : '#1d4ed8',
                    bgcolor: isDark ? 'rgba(251,191,36,0.10)' : 'rgba(37,99,235,0.08)',
                    border: `1px solid ${isDark ? 'rgba(251,191,36,0.18)' : 'rgba(37,99,235,0.14)'}`,
                    fontSize: 10,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    fontWeight: 900,
                  }}
                >
                  {meta.eyebrow}
                </Box>
                <Box
                  sx={{
                    display: { xs: 'none', sm: 'inline-flex' },
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1,
                    py: 0.45,
                    borderRadius: '999px',
                    color: isDark ? '#86efac' : '#047857',
                    bgcolor: isDark ? 'rgba(34,197,94,0.10)' : 'rgba(209,250,229,0.78)',
                    border: `1px solid ${isDark ? 'rgba(34,197,94,0.16)' : 'rgba(16,185,129,0.18)'}`,
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Live APIs
                </Box>
              </Stack>
              <Stack direction="row" alignItems="baseline" spacing={1.25} sx={{ minWidth: 0 }}>
                <Typography variant="h5" sx={{ color: textPrimary, fontFamily: 'Sora, sans-serif', fontWeight: 700, letterSpacing: 0, fontSize: { xs: 20, lg: 24 } }}>
                  {meta.title}
                </Typography>
                <Typography sx={{ color: alpha(isDark ? '#fff' : '#0f172a', 0.42), display: { xs: 'none', xl: 'block' }, fontSize: 13 }}>
                  Admin Console
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ mt: 0.55, color: textMuted, display: { xs: 'none', md: 'block' }, maxWidth: 660 }}>
                {meta.summary}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
            <Paper
              elevation={0}
              sx={{
                display: { xs: 'none', xl: 'flex' },
                alignItems: 'center',
                gap: 1.25,
                width: 330,
                height: 52,
                px: 1.6,
                borderRadius: '18px',
                color: alpha(isDark ? '#fff' : '#0f172a', 0.58),
                border: `1px solid ${panelBorder}`,
                bgcolor: panelBg,
                boxShadow: isDark ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
              }}
            >
              <SearchRoundedIcon sx={{ fontSize: 20, color: alpha(isDark ? '#fff' : '#0f172a', 0.46) }} />
              <Typography sx={{ fontSize: 13, flex: 1 }}>Search records...</Typography>
              <Box
                sx={{
                  px: 0.9,
                  py: 0.35,
                  borderRadius: '10px',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.22)'}`,
                  color: alpha(isDark ? '#fff' : '#0f172a', 0.48),
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                Ctrl K
              </Box>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                display: { xs: 'none', lg: 'flex' },
                alignItems: 'center',
                gap: 1,
                height: 52,
                px: 1.3,
                borderRadius: '16px',
                color: isDark ? '#dbeafe' : '#1d4ed8',
                border: `1px solid ${isDark ? 'rgba(59,130,246,0.20)' : 'rgba(37,99,235,0.18)'}`,
                bgcolor: isDark ? 'rgba(37,99,235,0.10)' : 'rgba(239,246,255,0.92)',
              }}
            >
              <ShieldRoundedIcon sx={{ fontSize: 18, color: isDark ? '#93c5fd' : '#2563eb' }} />
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Secure</Typography>
            </Paper>

            <IconButton
              aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
              onClick={toggleTheme}
              sx={{
                width: 44,
                height: 44,
                bgcolor: panelBg,
                color: mode === 'light' ? '#2563eb' : '#fbbf24',
                border: `1px solid ${panelBorder}`,
                '&:hover': {
                  bgcolor: isDark ? 'rgba(30,41,59,0.78)' : 'rgba(239,246,255,0.96)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.2s ease',
              }}
            >
              {mode === 'light' ? <DarkModeRoundedIcon /> : <WbSunnyRoundedIcon />}
            </IconButton>

            <IconButton
              sx={{
                width: 44,
                height: 44,
                bgcolor: panelBg,
                color: textPrimary,
                border: `1px solid ${panelBorder}`,
                '&:hover': { bgcolor: isDark ? 'rgba(30,41,59,0.78)' : 'rgba(239,246,255,0.96)' },
              }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsRoundedIcon />
              </Badge>
            </IconButton>

            <Paper
              elevation={0}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                height: 52,
                px: 1,
                borderRadius: '18px',
                border: `1px solid ${panelBorder}`,
                bgcolor: panelBg,
                minWidth: { sm: 178 },
              }}
            >
              <Avatar sx={{ bgcolor: '#fbbf24', color: '#111827', width: 40, height: 40, fontWeight: 800 }}>
                A
              </Avatar>
              <div className="hidden sm:block">
                <Typography sx={{ fontWeight: 800, color: textPrimary, lineHeight: 1.15, fontSize: 14 }}>{adminProfile.name}</Typography>
                <Typography variant="body2" sx={{ color: textMuted, fontSize: 12 }}>{adminProfile.role}</Typography>
              </div>
              <KeyboardArrowDownRoundedIcon sx={{ color: alpha(isDark ? '#fff' : '#0f172a', 0.52), display: { xs: 'none', sm: 'block' } }} />
            </Paper>
          </Stack>
        </Stack>
      </Toolbar>
      </Paper>
    </AppBar>
  );
}

export default AdminHeader;
