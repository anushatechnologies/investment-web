import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  BriefcaseBusiness,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Receipt,
  Settings,
  ShieldCheck,
  TrendingUp,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react';
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
import { BRAND_LOGO_FALLBACK, BRAND_LOGO_PRIMARY } from '../../constants/branding';

const navigationItems = [
  {
    group: 'Command',
    items: [
      { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { label: 'Investors', path: '/admin/investors', icon: Users },
      { label: 'Investments', path: '/admin/investments', icon: BriefcaseBusiness },
      { label: 'Revenue', path: '/admin/revenue', icon: TrendingUp },
    ],
  },
  {
    group: 'Operations',
    items: [
      { label: 'Withdrawals', path: '/admin/withdrawals', icon: Wallet },
      { label: 'Payment Verification', path: '/admin/payment-verification', icon: Receipt },
      { label: 'Referral Statistics', path: '/admin/referrals', icon: ArrowRightLeft },
      { label: 'Fraud Monitoring', path: '/admin/fraud-monitoring', icon: AlertTriangle },
    ],
  },
  {
    group: 'Control',
    items: [
      { label: 'User Management', path: '/admin/user-management', icon: UserCog },
      { label: 'Reports', path: '/admin/reports', icon: ShieldCheck },
      { label: 'Settings', path: '/admin/settings', icon: Settings },
    ],
  },
];

function AdminSidebarContent({ onLogout, onClose }) {
  return (
    <Box
      sx={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        px: 2,
        py: 2,
        color: 'white',
        background: 'linear-gradient(180deg, #030a17 0%, #061427 48%, #07111f 100%)',
        borderRight: '1px solid rgba(148,163,184,0.12)',
        overflow: 'hidden',
      }}
    >
      <Link to="/admin" onClick={onClose} className="mb-5 flex items-center gap-3 rounded-2xl px-1 transition hover:opacity-85">
        <Avatar
          variant="rounded"
          src={BRAND_LOGO_PRIMARY}
          alt="Anusha Trade"
          imgProps={{ onError: (e) => { e.currentTarget.src = BRAND_LOGO_FALLBACK; } }}
          sx={{ width: 52, height: 52, bgcolor: 'white', borderRadius: '16px', p: 0.45 }}
        />
        <div>
          <Typography sx={{ color: '#fbbf24', fontWeight: 800, fontSize: 21, lineHeight: 1.15 }}>Anusha Trade</Typography>
          <Typography variant="body2" sx={{ color: alpha('#fff', 0.62), mt: 0.25 }}>Admin Command</Typography>
        </div>
      </Link>

      <Box
        sx={{
          borderRadius: '18px',
          p: 1.5,
          mb: 1.75,
          background: 'linear-gradient(135deg, rgba(15,23,42,0.82), rgba(30,64,175,0.30))',
          border: '1px solid rgba(148,163,184,0.14)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: '12px', bgcolor: 'rgba(34,197,94,0.12)', color: '#86efac' }}>
            <Activity className="h-4 w-4" />
          </Box>
          <div>
            <Typography sx={{ color: '#fde68a', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 10 }}>
              Live Operations
            </Typography>
            <Typography sx={{ mt: 0.25, color: 'white', fontSize: 13, fontWeight: 700 }}>APIs connected</Typography>
          </div>
        </Stack>
      </Box>

      <List
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          px: 0,
          pr: 0.5,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(96,165,250,0.76) rgba(15,23,42,0.48)',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { background: 'rgba(15,23,42,0.48)', borderRadius: 99 },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(96,165,250,0.76)', borderRadius: 99 },
        }}
      >
        {navigationItems.map((section) => (
          <Box key={section.group} sx={{ mb: 1.25 }}>
            <Typography sx={{ px: 1.5, py: 1, color: alpha('#fff', 0.38), fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              {section.group}
            </Typography>
            {section.items.map(({ icon: Icon, label, path }) => (
              <NavLink key={path} to={path} end={path === '/admin'} onClick={onClose} style={{ textDecoration: 'none' }}>
                {({ isActive }) => (
                  <ListItemButton
                    sx={{
                      position: 'relative',
                      borderRadius: '14px',
                      mb: 0.35,
                      minHeight: 46,
                      px: 1.4,
                      color: isActive ? 'white' : alpha('#fff', 0.70),
                      bgcolor: isActive ? 'rgba(37,99,235,0.98)' : 'transparent',
                      boxShadow: isActive ? '0 16px 30px rgba(37,99,235,0.25)' : 'none',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: 0,
                        top: 9,
                        bottom: 9,
                        width: 3,
                        borderRadius: 99,
                        bgcolor: isActive ? '#fbbf24' : 'transparent',
                      },
                      '&:hover': {
                        bgcolor: isActive ? 'rgba(37,99,235,0.98)' : 'rgba(148,163,184,0.08)',
                        color: 'white',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                      <Icon className="h-5 w-5" />
                    </ListItemIcon>
                    <ListItemText primary={label} primaryTypographyProps={{ fontSize: 14, fontWeight: isActive ? 800 : 650 }} />
                    {isActive && <ChevronRight className="h-4 w-4 opacity-80" />}
                  </ListItemButton>
                )}
              </NavLink>
            ))}
          </Box>
        ))}
      </List>

      <Divider sx={{ borderColor: 'rgba(148,163,184,0.12)', my: 1.75 }} />
      <Button
        fullWidth
        variant="outlined"
        startIcon={<LogOut className="h-4 w-4" />}
        onClick={onLogout}
        sx={{
          color: 'white',
          minHeight: 48,
          borderRadius: '16px',
          borderColor: 'rgba(148,163,184,0.18)',
          backgroundColor: 'rgba(15,23,42,0.42)',
          textTransform: 'none',
          fontWeight: 800,
          '&:hover': { borderColor: 'rgba(248,113,113,0.46)', backgroundColor: 'rgba(248,113,113,0.10)' },
        }}
      >
        Logout
      </Button>
    </Box>
  );
}

function AdminSidebar({ isOpen, onClose, onLogout }) {
  return (
    <>
      <Drawer
        open={isOpen}
        onClose={onClose}
        variant="temporary"
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': { width: 304, height: '100dvh', border: 'none', background: 'transparent' },
        }}
      >
        <AdminSidebarContent onLogout={onLogout} onClose={onClose} />
      </Drawer>

      <Box
        sx={{
          display: { xs: 'none', lg: 'block' },
          position: 'fixed',
          insetY: 0,
          left: 0,
          width: 304,
          height: '100dvh',
          zIndex: 1200,
        }}
      >
        <AdminSidebarContent onLogout={onLogout} onClose={onClose} />
      </Box>
    </>
  );
}

export default AdminSidebar;
