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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.06),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#f3f7fb_50%,#eef3f9_100%)]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      <div className="min-h-screen lg:pl-[290px]">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
