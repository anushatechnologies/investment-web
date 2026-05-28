import {
  Bell,
  BriefcaseBusiness,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Receipt,
  Settings,
  Shield,
  Share2,
  User,
  Wallet,
} from 'lucide-react';
import DashboardCustomizeRoundedIcon from '@mui/icons-material/DashboardCustomizeRounded';
import {
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { NavLink, Link } from 'react-router-dom';
import { BRAND_LOGO_FALLBACK, BRAND_LOGO_PRIMARY } from '../constants/branding';
import { getRuntimeUserProfile } from '../utils/runtimeUserProfile';
import { getStoredOnboardingStatus } from '../services/api';
import { isOnboardingComplete } from '../utils/onboardingRouter';

const navigationItems = [
  { label: 'User Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'My Investments', path: '/investments', icon: BriefcaseBusiness },
  { label: 'Wallet', path: '/wallet', icon: Wallet },
  { label: 'Referral Network', path: '/referral-network', icon: Share2 },
  { label: 'Withdraw', path: '/withdraw', icon: Wallet },
  { label: 'Payment Receipts', path: '/payment-receipts', icon: Receipt },
  { label: 'Notifications', path: '/notifications', icon: Bell },
  { label: 'Investment Status', path: '/investment-status', icon: Shield },
  { label: 'Support', path: '/support', icon: LifeBuoy },
  { label: 'Profile', path: '/profile', icon: User },
  { label: 'Settings', path: '/settings', icon: Settings },
];

function SidebarContent({ onLogout, onClose }) {
  const userProfile = getRuntimeUserProfile();
  const onboardingStatus = getStoredOnboardingStatus() || {};
  const isComplete = isOnboardingComplete(onboardingStatus);
  const visibleNavItems = isComplete
    ? navigationItems
    : navigationItems.filter((item) => item.path === '/profile' || item.path === '/support');

  return (
    <Box
      sx={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        px: 2.25,
        py: 2.5,
        background: 'linear-gradient(180deg, #07172d 0%, #0b1d39 55%, #0a1930 100%)',
        color: 'white',
        overflow: 'hidden',
      }}
    >
      <Link to="/" onClick={onClose} className="mb-6 flex items-center gap-3 transition hover:opacity-80">
        <Avatar
          variant="rounded"
          src={BRAND_LOGO_PRIMARY}
          alt="Anusha Trade"
          imgProps={{ onError: (e) => { e.currentTarget.src = BRAND_LOGO_FALLBACK; } }}
          sx={{ width: 56, height: 56, bgcolor: 'white', borderRadius: '18px', p: 0.5 }}
        />
        <div>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>Anusha Trade</Typography>
          <Typography variant="body2" sx={{ color: alpha('#fff', 0.68) }}>Investor Portal</Typography>
        </div>
      </Link>

      <Box
        sx={{
          borderRadius: '24px',
          p: 2,
          mb: 2.5,
          background: 'linear-gradient(135deg, rgba(37,99,235,0.32), rgba(14,165,233,0.12))',
          border: '1px solid rgba(255,255,255,0.09)',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.16)', width: 46, height: 46, fontWeight: 800 }}>
            {userProfile.avatar}
          </Avatar>
          <div>
            <Typography sx={{ fontWeight: 700 }}>{userProfile.name}</Typography>
            <Typography variant="body2" sx={{ color: alpha('#fff', 0.72) }}>{userProfile.membership}</Typography>
          </div>
        </Stack>
      </Box>

      <List sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 0, pr: 0.5 }}>
        {visibleNavItems.map(({ icon: Icon, label, path }) => (
          <NavLink key={path} to={path} end={path === '/'} onClick={onClose} style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <ListItemButton
                sx={{
                  borderRadius: '18px',
                  mb: 0.75,
                  color: isActive ? 'white' : alpha('#fff', 0.72),
                  bgcolor: isActive ? 'rgba(37,99,235,0.92)' : 'transparent',
                  boxShadow: isActive ? '0 18px 28px rgba(37,99,235,0.24)' : 'none',
                  '&:hover': {
                    bgcolor: isActive ? 'rgba(37,99,235,0.92)' : 'rgba(255,255,255,0.06)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>
                  <Icon className="h-5 w-5" />
                </ListItemIcon>
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }}
                />
              </ListItemButton>
            )}
          </NavLink>
        ))}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 2 }} />
      <Box
        sx={{
          p: 2,
          borderRadius: '22px',
          backgroundColor: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
          <DashboardCustomizeRoundedIcon sx={{ color: '#93c5fd' }} />
          <Typography sx={{ fontWeight: 700 }}>Secure access</Typography>
        </Stack>
        <Typography variant="body2" sx={{ color: alpha('#fff', 0.66), mb: 2 }}>
          Your onboarding and payout actions are now connected to live backend APIs.
        </Typography>
        <Button
          fullWidth
          onClick={onLogout}
          variant="outlined"
          startIcon={<LogOut className="h-4 w-4" />}
          sx={{
            color: 'white',
            borderColor: 'rgba(255,255,255,0.14)',
            '&:hover': { borderColor: 'rgba(255,255,255,0.28)', backgroundColor: 'rgba(255,255,255,0.06)' },
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
}

function Sidebar({ isOpen, onClose, onLogout }) {
  return (
    <>
      <Drawer
        open={isOpen}
        onClose={onClose}
        variant="temporary"
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': { width: 290, height: '100dvh', border: 'none', background: 'transparent' },
        }}
      >
        <SidebarContent onLogout={onLogout} onClose={onClose} />
      </Drawer>

      <Box
        sx={{
          display: { xs: 'none', lg: 'block' },
          position: 'fixed',
          insetY: 0,
          left: 0,
          width: 290,
          height: '100dvh',
          zIndex: 1200,
        }}
      >
        <SidebarContent onLogout={onLogout} onClose={onClose} />
      </Box>
    </>
  );
}

export default Sidebar;
