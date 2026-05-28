import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

function Layout({ onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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
        background: 'radial-gradient(circle at top left, rgba(37,99,235,0.06), transparent 24%), linear-gradient(180deg, #f8fafc 0%, #f3f7fb 50%, #eef3f9 100%)',
      }}
    >
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <Box sx={{ minHeight: '100vh', pl: { lg: '290px' } }}>
        <Header onOpenSidebar={() => setSidebarOpen(true)} />
        <Box component="main" sx={{ px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 3, lg: 4 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default Layout;
