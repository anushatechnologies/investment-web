import { Box, Fab } from '@mui/material';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import MobileInvestorNav from './MobileInvestorNav';
import Sidebar from './Sidebar';
import { useAppTheme } from '../theme/ThemeContext';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';

function Layout({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, toggleTheme } = useAppTheme();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    onLogout();
    navigate('/login', { replace: true });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: (theme) =>
          theme.palette.mode === 'light'
            ? 'radial-gradient(circle at top left, rgba(37,99,235,0.06), transparent 24%), linear-gradient(180deg, #f8fafc 0%, #f3f7fb 50%, #eef3f9 100%)'
            : 'radial-gradient(circle at top left, rgba(59, 130, 246, 0.12), transparent 25%), linear-gradient(180deg, #070c17 0%, #0c1527 50%, #030712 100%)',
      }}
    >
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <Box sx={{ minHeight: '100vh', pl: { lg: '290px' } }}>
        <Header onOpenSidebar={() => setSidebarOpen(true)} />
        <Box
          component="main"
          sx={{
            px: { xs: 1.25, sm: 2.5, lg: 4 },
            pt: { xs: 2, sm: 3, lg: 4 },
            pb: { xs: 'calc(88px + env(safe-area-inset-bottom, 0px))', lg: 4 },
          }}
        >
          <Outlet />
        </Box>
      </Box>
      <MobileInvestorNav />

      {/* Mobile-only floating theme toggle FAB */}
      <Fab
        size="small"
        onClick={toggleTheme}
        sx={{
          display: { xs: 'flex', sm: 'none' },
          position: 'fixed',
          right: 16,
          bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
          zIndex: 1260,
          width: 40,
          height: 40,
          bgcolor: (theme) =>
            theme.palette.mode === 'light' ? 'rgba(255,255,255,0.95)' : 'rgba(30,40,65,0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid',
          borderColor: (theme) =>
            theme.palette.mode === 'light' ? 'rgba(226,232,240,0.9)' : 'rgba(255,255,255,0.1)',
          color: (theme) =>
            theme.palette.mode === 'light' ? '#ea580c' : '#fbbf24',
          boxShadow: (theme) =>
            theme.palette.mode === 'light'
              ? '0 4px 20px rgba(15,23,42,0.12)'
              : '0 4px 20px rgba(0,0,0,0.4)',
          transition: 'all 0.3s ease',
          '&:hover': { transform: 'scale(1.1) rotate(15deg)' },
          minHeight: 40,
        }}
      >
        {mode === 'light' ? <WbSunnyRoundedIcon sx={{ fontSize: 18 }} /> : <DarkModeRoundedIcon sx={{ fontSize: 18 }} />}
      </Fab>
    </Box>
  );
}

export default Layout;
