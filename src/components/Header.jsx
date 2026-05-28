import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
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
import { getNotifications } from '../services/api';

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
        backdropFilter: 'blur(20px)',
        backgroundColor: 'rgba(255,255,255,0.72)',
        borderBottom: '1px solid rgba(226, 232, 240, 0.9)',
      }}
    >
      <Toolbar sx={{ px: { xs: 2, sm: 3, lg: 4 }, py: 1 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ width: '100%' }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton
              onClick={onOpenSidebar}
              sx={{
                display: { lg: 'none' },
                bgcolor: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(226,232,240,0.9)',
              }}
            >
              <MenuRoundedIcon />
            </IconButton>
            <div>
              <Chip label="Investor Workspace" color="primary" size="small" sx={{ borderRadius: '999px', fontWeight: 800, letterSpacing: '0.12em' }} />
              <Typography variant="h4" sx={{ mt: 1, fontSize: { xs: 22, sm: 26 }, lineHeight: 1.15 }}>
                {meta.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' }, mt: 0.5, maxWidth: 680 }}>
                {meta.summary}
              </Typography>
            </div>
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconButton
              onClick={() => navigate('/notifications')}
              sx={{
                width: 44,
                height: 44,
                bgcolor: 'rgba(255,255,255,0.82)',
                border: '1px solid rgba(226,232,240,0.9)',
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
                gap: 1.5,
                px: 1.25,
                py: 1,
                borderRadius: '18px',
                border: '1px solid rgba(226,232,240,0.9)',
                bgcolor: 'rgba(255,255,255,0.82)',
              }}
            >
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40, fontWeight: 800 }}>
                {userProfile.avatar}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography sx={{ fontWeight: 700, lineHeight: 1.2 }}>{userProfile.name}</Typography>
                <Typography variant="body2" color="text.secondary">{userProfile.membership}</Typography>
              </Box>
              <KeyboardArrowDownRoundedIcon sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }} />
            </Paper>
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
