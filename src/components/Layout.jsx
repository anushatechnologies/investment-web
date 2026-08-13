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
    <div className="min-h-screen flex flex-col relative">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-h-screen lg:pl-[320px] transition-[padding] duration-300">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />
        <main
          key={location.pathname}
          className="animate-fade-in-up flex-1 w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-[calc(88px+env(safe-area-inset-bottom,0px))] lg:pb-8"
        >
          <Outlet />
        </main>
      </div>
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
    </div>
  );
}

export default Layout;
