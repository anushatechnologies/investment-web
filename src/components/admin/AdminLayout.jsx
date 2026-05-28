import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

function AdminLayout({ onLogout }) {
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
      className="admin-theme"
      sx={{
        minHeight: '100vh',
        backgroundColor: '#050b16',
        backgroundImage: `
          linear-gradient(135deg, rgba(37,99,235,0.12) 0%, transparent 28%),
          linear-gradient(180deg, #050b16 0%, #071426 48%, #08111f 100%)
        `,
      }}
    >
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <Box sx={{ minHeight: '100vh', pl: { lg: '304px' } }}>
        <AdminHeader onOpenSidebar={() => setSidebarOpen(true)} />
        <Box component="main" sx={{ px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 2.5, lg: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default AdminLayout;
