import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Chip,
  IconButton,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { getRuntimeUserProfile } from '../utils/runtimeUserProfile';
import { useEffect, useState } from 'react';
import { getNotificationSummary } from '../services/api';
import { useAppTheme } from '../theme/ThemeContext';

const pageMeta = {
  '/': {
    title: 'Investor Dashboard',
    summary: 'Track capital, returns, payouts, and onboarding progress from one workspace.',
  },
  '/dashboard': {
    title: 'Investor Dashboard',
    summary: 'Track capital, returns, payouts, and onboarding progress from one workspace.',
  },
  '/investments': {
    title: 'My Investments',
    summary: 'Review plan status, maturities, and the current application pipeline.',
  },
  '/wallet': {
    title: 'Wallet',
    summary: 'Monitor available balance, credits, pending amounts, and transaction movement.',
  },
  '/referral-network': {
    title: 'Referral Network',
    summary: 'See your referral graph, network depth, and commission visibility.',
  },
  '/withdraw': {
    title: 'Withdrawals',
    summary: 'Submit payout requests and track where each withdrawal stands.',
  },
  '/payment-receipts': {
    title: 'Payment Receipts',
    summary: 'Follow uploaded payment proofs and their investment verification status.',
  },
  '/notifications': {
    title: 'Notifications',
    summary: 'Stay updated on KYC, payouts, receipts, and referral events.',
  },
  '/investment-status': {
    title: 'Investment Status',
    summary: 'Understand where each investment sits in the lifecycle.',
  },
  '/support': {
    title: 'Support',
    summary: 'Raise issues and keep communication with the operations team organized.',
  },
  '/profile': {
    title: 'Profile & Verification',
    summary: 'Manage identity details, KYC submission, and payout banking data.',
  },
  '/settings': {
    title: 'Settings',
    summary: 'Tune alerts, security preferences, and account behavior.',
  },
};

function Header({ onOpenSidebar }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const meta = pageMeta[pathname] ?? pageMeta['/'];
  const userProfile = getRuntimeUserProfile();
  const [unreadCount, setUnreadCount] = useState(0);
  const { mode, toggleTheme } = useAppTheme();

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
        backdropFilter: 'blur(20px)',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light' ? 'rgba(255,255,255,0.72)' : 'rgba(7, 12, 23, 0.75)',
        borderBottom: '1px solid',
        borderBottomColor: (theme) =>
          theme.palette.mode === 'light' ? 'rgba(226, 232, 240, 0.9)' : 'rgba(255, 255, 255, 0.08)',
      }}
    >
      <Toolbar sx={{ px: { xs: 1.5, sm: 3, lg: 4 }, py: { xs: 0.5, sm: 1 }, minHeight: { xs: 60, sm: 72 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={{ xs: 0.75, sm: 2 }} sx={{ width: '100%', minWidth: 0 }}>
          <Stack direction="row" spacing={{ xs: 0.75, sm: 2 }} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
            <IconButton
              onClick={onOpenSidebar}
              size="small"
              sx={{
                display: { lg: 'none' },
                width: { xs: 36, sm: 42 },
                height: { xs: 36, sm: 42 },
                bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.06)',
                border: '1px solid',
                borderColor: (theme) => theme.palette.mode === 'light' ? 'rgba(226,232,240,0.9)' : 'rgba(255,255,255,0.08)',
                color: 'text.primary',
                flexShrink: 0,
              }}
            >
              <MenuRoundedIcon sx={{ fontSize: 20 }} />
            </IconButton>
            <Box sx={{ minWidth: 0 }}>
              <Chip label="Investor Workspace" color="primary" size="small" sx={{ display: { xs: 'none', sm: 'inline-flex' }, borderRadius: '999px', fontWeight: 800, letterSpacing: '0.12em' }} />
              <Typography
                variant="h4"
                sx={{
                  mt: { xs: 0, sm: 0.75 },
                  fontSize: { xs: 16, sm: 24 },
                  fontWeight: 700,
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: { xs: 180, sm: 420 },
                }}
              >
                {meta.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' }, mt: 0.4, maxWidth: 680, fontSize: 13 }}>
                {meta.summary}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={{ xs: 0.5, sm: 1.5 }} alignItems="center" sx={{ flexShrink: 0 }}>
            {/* Theme toggle - hidden on xs to save space, shown on sm+ */}
            <IconButton
              onClick={toggleTheme}
              sx={{
                display: { xs: 'none', sm: 'flex' },
                width: 40,
                height: 40,
                bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.06)',
                border: '1px solid',
                borderColor: (theme) => theme.palette.mode === 'light' ? 'rgba(226,232,240,0.9)' : 'rgba(255,255,255,0.08)',
                color: (theme) => theme.palette.mode === 'light' ? '#ea580c' : '#fbbf24',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': { transform: 'rotate(20deg) scale(1.08)' },
              }}
            >
              {mode === 'light' ? <WbSunnyRoundedIcon sx={{ fontSize: 19 }} /> : <DarkModeRoundedIcon sx={{ fontSize: 19 }} />}
            </IconButton>

            <IconButton
              onClick={() => navigate('/notifications')}
              sx={{
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
                bgcolor: (theme) => theme.palette.mode === 'light' ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.06)',
                border: '1px solid',
                borderColor: (theme) => theme.palette.mode === 'light' ? 'rgba(226,232,240,0.9)' : 'rgba(255,255,255,0.08)',
                color: 'text.primary',
              }}
            >
              <Badge badgeContent={unreadCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: 9, minWidth: 16, height: 16 } }}>
                <NotificationsRoundedIcon sx={{ fontSize: { xs: 19, sm: 22 } }} />
              </Badge>
            </IconButton>

            {/* Avatar button - shows name on sm+, just avatar on xs */}
            <Box
              onClick={() => navigate('/profile')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0, sm: 1.25 },
                px: { xs: 0.5, sm: 1.25 },
                py: { xs: 0.5, sm: 0.75 },
                borderRadius: { xs: '50%', sm: '18px' },
                border: { xs: 'none', sm: '1px solid' },
                borderColor: (theme) => theme.palette.mode === 'light' ? 'rgba(226,232,240,0.9)' : 'rgba(255,255,255,0.08)',
                bgcolor: { xs: 'transparent', sm: (theme) => theme.palette.mode === 'light' ? 'rgba(255,255,255,0.82)' : 'rgba(255,255,255,0.06)' },
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                '&:hover': { opacity: 0.8 },
              }}
            >
              <Avatar sx={{ bgcolor: 'primary.main', width: { xs: 32, sm: 36 }, height: { xs: 32, sm: 36 }, fontWeight: 800, fontSize: { xs: 13, sm: 15 } }}>
                {userProfile.avatar}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography sx={{ fontWeight: 700, lineHeight: 1.2, fontSize: 14 }}>{userProfile.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>{userProfile.membership}</Typography>
              </Box>
              <KeyboardArrowDownRoundedIcon sx={{ color: 'text.secondary', fontSize: 18, display: { xs: 'none', sm: 'block' } }} />
            </Box>
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
