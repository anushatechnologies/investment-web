import {
  AlertTriangle,
  ArrowRightLeft,
  BriefcaseBusiness,
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
import { NavLink, Link } from 'react-router-dom';
import { BRAND_LOGO_FALLBACK, BRAND_LOGO_PRIMARY } from '../../constants/branding';

const navigationItems = [
  { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { label: 'Investors', path: '/admin/investors', icon: Users },
  { label: 'Investments', path: '/admin/investments', icon: BriefcaseBusiness },
  { label: 'Revenue', path: '/admin/revenue', icon: TrendingUp },
  { label: 'Withdrawals', path: '/admin/withdrawals', icon: Wallet },
  { label: 'Referral Statistics', path: '/admin/referrals', icon: ArrowRightLeft },
  { label: 'Fraud Monitoring', path: '/admin/fraud-monitoring', icon: AlertTriangle },
  { label: 'Payment Verification', path: '/admin/payment-verification', icon: Receipt },
  { label: 'User Management', path: '/admin/user-management', icon: UserCog },
  { label: 'Reports', path: '/admin/reports', icon: ShieldCheck },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];

function AdminSidebar({ isOpen, onClose, onLogout }) {
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm transition lg:hidden ${
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[290px] flex-col border-r border-white/10 bg-[#050d1d]/95 px-5 py-6 backdrop-blur-2xl transition duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Link to="/admin" className="mb-8 flex items-center gap-3 transition hover:opacity-80">
          <div className="flex h-14 w-14 overflow-hidden items-center justify-center rounded-full bg-white shadow-sm">
            <img
              src={BRAND_LOGO_PRIMARY}
              alt="Anusha Trade"
              className="h-full w-full object-contain p-0.5"
              onError={(e) => { e.currentTarget.src = BRAND_LOGO_FALLBACK; }}
            />
          </div>
          <div>
            <p className="font-heading text-lg font-semibold text-gold-soft whitespace-nowrap">Anusha Trade</p>
          </div>
        </Link>



        <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
          {navigationItems.map(({ icon: Icon, label, path }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/admin'}
              className={({ isActive }) =>
                `${isActive ? 'sidebar-link sidebar-link-active' : 'sidebar-link'}`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button type="button" onClick={onLogout} className="sidebar-link mt-6 w-full justify-start">
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </aside>
    </>
  );
}

export default AdminSidebar;
