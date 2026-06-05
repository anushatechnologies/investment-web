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
        backgroundColor: (theme) => (theme.palette.mode === 'light' ? '#eef4fb' : '#050b16'),
        backgroundImage: (theme) =>
          theme.palette.mode === 'light'
            ? `
              radial-gradient(circle at 12% 12%, rgba(37,99,235,0.10), transparent 28%),
              radial-gradient(circle at 92% 8%, rgba(14,165,233,0.10), transparent 24%),
              linear-gradient(180deg, #f8fbff 0%, #eef4fb 52%, #e7eef8 100%)
            `
            : `
              linear-gradient(135deg, rgba(37,99,235,0.12) 0%, transparent 28%),
              linear-gradient(180deg, #050b16 0%, #071426 48%, #08111f 100%)
            `,
        transition: 'background-color 0.3s ease, background-image 0.3s ease',
      }}
    >
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <Box sx={{ minHeight: '100vh', pl: { lg: '292px' } }}>
        <AdminHeader onOpenSidebar={() => setSidebarOpen(true)} />
        <Box
          component="main"
          sx={{
            px: { xs: 1.5, sm: 2.5, lg: 3 },
            pt: { xs: 1.5, lg: 2 },
            pb: { xs: 3, lg: 4 },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default AdminLayout;
