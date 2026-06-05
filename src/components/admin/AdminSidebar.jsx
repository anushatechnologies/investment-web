import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  BriefcaseBusiness,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Receipt,
  LifeBuoy,
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
import { alpha, useTheme } from '@mui/material/styles';
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
      { label: 'Support Tickets', path: '/admin/support', icon: LifeBuoy },
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
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const textMuted = alpha(isDark ? '#ffffff' : '#0f172a', isDark ? 0.62 : 0.58);
  const borderColor = isDark ? 'rgba(148,163,184,0.12)' : 'rgba(148,163,184,0.24)';

  return (
    <Box
      sx={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        px: 1.5,
        py: 1.5,
        color: textPrimary,
        background: isDark
          ? 'radial-gradient(circle at 0% 0%, rgba(37,99,235,0.20), transparent 32%), linear-gradient(180deg, #030a17 0%, #061427 48%, #07111f 100%)'
          : 'radial-gradient(circle at 0% 0%, rgba(37,99,235,0.12), transparent 34%), linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,251,255,0.96) 50%, rgba(238,244,251,0.96) 100%)',
        borderRight: `1px solid ${borderColor}`,
        overflow: 'hidden',
      }}
    >
      <Link to="/admin" onClick={onClose} className="mb-4 block rounded-[22px] no-underline transition hover:opacity-90">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.3,
            p: 1.15,
            borderRadius: '22px',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.20)'}`,
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.70)',
            boxShadow: isDark ? 'none' : '0 18px 40px rgba(15,23,42,0.06)',
          }}
        >
          <Avatar
            variant="rounded"
            src={BRAND_LOGO_PRIMARY}
            alt="Anusha Trade"
            imgProps={{ onError: (e) => { e.currentTarget.src = BRAND_LOGO_FALLBACK; } }}
            sx={{ width: 54, height: 54, bgcolor: 'white', borderRadius: '18px', p: 0.45, boxShadow: '0 12px 24px rgba(15,23,42,0.12)' }}
          />
          <div>
            <Typography sx={{ color: isDark ? '#fbbf24' : '#1d4ed8', fontWeight: 900, fontSize: 20, lineHeight: 1.1 }}>Anusha Trade</Typography>
            <Typography variant="body2" sx={{ color: textMuted, mt: 0.35, fontSize: 12.5, fontWeight: 700 }}>Admin Command</Typography>
          </div>
        </Box>
      </Link>

      <Box
        sx={{
          borderRadius: '22px',
          p: 1.5,
          mb: 1,
          background: isDark
            ? 'linear-gradient(135deg, rgba(15,23,42,0.82), rgba(30,64,175,0.30))'
            : 'linear-gradient(135deg, rgba(239,246,255,0.98), rgba(219,234,254,0.78))',
          border: `1px solid ${isDark ? 'rgba(148,163,184,0.14)' : 'rgba(37,99,235,0.16)'}`,
          boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.05)' : '0 14px 28px rgba(37,99,235,0.08)',
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box sx={{ display: 'grid', placeItems: 'center', width: 34, height: 34, borderRadius: '12px', bgcolor: 'rgba(34,197,94,0.12)', color: '#86efac' }}>
            <Activity className="h-4 w-4" />
          </Box>
          <div>
            <Typography sx={{ color: isDark ? '#fde68a' : '#1d4ed8', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 10 }}>
              Live Operations
            </Typography>
            <Typography sx={{ mt: 0.25, color: textPrimary, fontSize: 13, fontWeight: 700 }}>APIs connected</Typography>
          </div>
        </Stack>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 1.4 }}>
        {[
          ['Mode', 'Prod'],
          ['Region', 'EU N1'],
        ].map(([label, value]) => (
          <Box
            key={label}
            sx={{
              borderRadius: '16px',
              px: 1.2,
              py: 1,
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.18)'}`,
              bgcolor: isDark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.62)',
            }}
          >
            <Typography sx={{ color: alpha(isDark ? '#fff' : '#0f172a', 0.46), fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {label}
            </Typography>
            <Typography sx={{ mt: 0.35, color: textPrimary, fontSize: 13, fontWeight: 900 }}>
              {value}
            </Typography>
          </Box>
        ))}
      </Box>

      <List
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          px: 0,
          pr: 0.5,
          scrollbarWidth: 'thin',
          scrollbarColor: isDark ? 'rgba(96,165,250,0.76) rgba(15,23,42,0.48)' : 'rgba(59,130,246,0.58) rgba(226,232,240,0.74)',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { background: isDark ? 'rgba(15,23,42,0.48)' : 'rgba(226,232,240,0.74)', borderRadius: 99 },
          '&::-webkit-scrollbar-thumb': { background: isDark ? 'rgba(96,165,250,0.76)' : 'rgba(59,130,246,0.58)', borderRadius: 99 },
        }}
      >
        {navigationItems.map((section) => (
          <Box key={section.group} sx={{ mb: 1 }}>
            <Typography sx={{ px: 1.5, py: 1, color: alpha(isDark ? '#fff' : '#0f172a', isDark ? 0.38 : 0.46), fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              {section.group}
            </Typography>
            {section.items.map(({ icon: Icon, label, path }) => (
              <NavLink key={path} to={path} end={path === '/admin'} onClick={onClose} style={{ textDecoration: 'none' }}>
                {({ isActive }) => (
                  <ListItemButton
                    sx={{
                      position: 'relative',
                      borderRadius: '16px',
                      mb: 0.45,
                      minHeight: 48,
                      px: 1.1,
                      color: isActive ? 'white' : alpha(isDark ? '#fff' : '#0f172a', isDark ? 0.70 : 0.68),
                      bgcolor: isActive
                        ? 'rgba(37,99,235,0.98)'
                        : isDark ? 'rgba(255,255,255,0.015)' : 'rgba(255,255,255,0.38)',
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
                        bgcolor: isActive ? 'rgba(37,99,235,0.98)' : alpha(isDark ? '#94a3b8' : '#2563eb', isDark ? 0.08 : 0.09),
                        color: isActive ? 'white' : textPrimary,
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 38,
                        color: 'inherit',
                        '& svg': {
                          borderRadius: '12px',
                        },
                      }}
                    >
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

      <Divider sx={{ borderColor, my: 1.75 }} />
      <Button
        fullWidth
        variant="outlined"
        startIcon={<LogOut className="h-4 w-4" />}
        onClick={onLogout}
        sx={{
          color: textPrimary,
          minHeight: 48,
          borderRadius: '16px',
          borderColor: isDark ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.28)',
          backgroundColor: isDark ? 'rgba(15,23,42,0.42)' : 'rgba(255,255,255,0.72)',
          textTransform: 'none',
          fontWeight: 800,
          '&:hover': {
            color: isDark ? 'white' : '#b91c1c',
            borderColor: 'rgba(248,113,113,0.46)',
            backgroundColor: 'rgba(248,113,113,0.10)',
          },
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
          '& .MuiDrawer-paper': { width: 292, height: '100dvh', border: 'none', background: 'transparent' },
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
          width: 292,
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
