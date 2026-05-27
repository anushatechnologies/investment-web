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
    <div className="admin-theme min-h-screen bg-midnight bg-hero-grid bg-[size:72px_72px]">
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className="min-h-screen lg:pl-[290px]">
        <AdminHeader onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
