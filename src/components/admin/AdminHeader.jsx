import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
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
import { alpha } from '@mui/material/styles';
import { useLocation } from 'react-router-dom';
import { adminProfile } from '../../data/adminData';
import { useEffect, useState } from 'react';
import { getNotifications } from '../../services/api';

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

  useEffect(() => {
    let active = true;

    const fetchNotifications = () => {
      getNotifications()
        .then((response) => {
          if (!active) return;
          const list = Array.isArray(response) ? response
            : Array.isArray(response?.data) ? response.data
              : Array.isArray(response?.items) ? response.items
                : Array.isArray(response?.notifications) ? response.notifications
                  : [];
          const unread = list.filter((item) => !(item.read || item.isRead)).length;
          setUnreadCount(unread);
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
        backdropFilter: 'blur(22px)',
        backgroundColor: 'rgba(5, 13, 29, 0.82)',
        borderBottom: '1px solid rgba(148,163,184,0.14)',
        boxShadow: '0 18px 40px rgba(2,8,23,0.18)',
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 72, lg: 84 }, px: { xs: 2, sm: 3, lg: 4 }, py: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2.5} sx={{ width: '100%' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton
              onClick={onOpenSidebar}
              sx={{
                display: { lg: 'none' },
                width: 42,
                height: 42,
                bgcolor: 'rgba(255,255,255,0.07)',
                color: 'white',
                border: '1px solid rgba(148,163,184,0.18)',
              }}
            >
              <MenuRoundedIcon />
            </IconButton>
            <div>
              <Stack direction="row" alignItems="center" spacing={1.25}>
                <Typography sx={{ color: '#fbbf24', fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 800 }}>
                  {meta.eyebrow}
                </Typography>
                <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.75, color: '#86efac', fontSize: 12, fontWeight: 700 }}>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                  Live
                </Box>
              </Stack>
              <Stack direction="row" alignItems="baseline" spacing={1.5} sx={{ mt: 0.55 }}>
                <Typography variant="h5" sx={{ color: 'white', fontFamily: 'Sora, sans-serif', fontWeight: 700, letterSpacing: 0, fontSize: { xs: 20, lg: 24 } }}>
                  {meta.title}
                </Typography>
                <Typography sx={{ color: alpha('#fff', 0.38), display: { xs: 'none', xl: 'block' }, fontSize: 13 }}>
                  Admin Console
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ mt: 0.55, color: alpha('#fff', 0.62), display: { xs: 'none', md: 'block' }, maxWidth: 660 }}>
                {meta.summary}
              </Typography>
            </div>
          </Stack>

          <Stack direction="row" spacing={1.25} alignItems="center">
            <Paper
              elevation={0}
              sx={{
                display: { xs: 'none', xl: 'flex' },
                alignItems: 'center',
                gap: 1.25,
                width: 280,
                px: 1.5,
                py: 1.1,
                borderRadius: '16px',
                color: alpha('#fff', 0.58),
                border: '1px solid rgba(148,163,184,0.16)',
                bgcolor: 'rgba(15,23,42,0.58)',
              }}
            >
              <SearchRoundedIcon sx={{ fontSize: 20, color: alpha('#fff', 0.46) }} />
              <Typography sx={{ fontSize: 13 }}>Search records...</Typography>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                display: { xs: 'none', lg: 'flex' },
                alignItems: 'center',
                gap: 1,
                px: 1.4,
                py: 1.05,
                borderRadius: '16px',
                color: '#dbeafe',
                border: '1px solid rgba(59,130,246,0.20)',
                bgcolor: 'rgba(37,99,235,0.10)',
              }}
            >
              <ShieldRoundedIcon sx={{ fontSize: 18, color: '#93c5fd' }} />
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Secure</Typography>
            </Paper>

            <IconButton
              sx={{
                width: 44,
                height: 44,
                bgcolor: 'rgba(15,23,42,0.62)',
                color: 'white',
                border: '1px solid rgba(148,163,184,0.16)',
                '&:hover': { bgcolor: 'rgba(30,41,59,0.78)' },
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
                px: 1,
                py: 0.75,
                borderRadius: '18px',
                border: '1px solid rgba(148,163,184,0.16)',
                bgcolor: 'rgba(15,23,42,0.62)',
                minWidth: { sm: 178 },
              }}
            >
              <Avatar sx={{ bgcolor: '#fbbf24', color: '#111827', width: 40, height: 40, fontWeight: 800 }}>
                A
              </Avatar>
              <div className="hidden sm:block">
                <Typography sx={{ fontWeight: 800, color: 'white', lineHeight: 1.15, fontSize: 14 }}>{adminProfile.name}</Typography>
                <Typography variant="body2" sx={{ color: alpha('#fff', 0.56), fontSize: 12 }}>{adminProfile.role}</Typography>
              </div>
              <KeyboardArrowDownRoundedIcon sx={{ color: alpha('#fff', 0.52), display: { xs: 'none', sm: 'block' } }} />
            </Paper>
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

export default AdminHeader;
