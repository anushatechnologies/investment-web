import {
  Bell,
  BriefcaseBusiness,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Receipt,
  Settings,
  Shield,
  Share2,
  User,
  Wallet,
} from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import { BRAND_LOGO_FALLBACK, BRAND_LOGO_PRIMARY } from '../constants/branding';
import { getRuntimeUserProfile } from '../utils/runtimeUserProfile';
import { getStoredOnboardingStatus } from '../services/api';
import { isOnboardingComplete } from '../utils/onboardingRouter';

const navigationItems = [
  { label: 'User Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'My Investments', path: '/investments', icon: BriefcaseBusiness },
  { label: 'Wallet', path: '/wallet', icon: Wallet },
  { label: 'Referral Network', path: '/referral-network', icon: Share2 },
  { label: 'Withdraw', path: '/withdraw', icon: Wallet },
  { label: 'Payment Receipts', path: '/payment-receipts', icon: Receipt },
  { label: 'Notifications', path: '/notifications', icon: Bell },
  { label: 'Investment Status', path: '/investment-status', icon: Shield },
  { label: 'Support', path: '/support', icon: LifeBuoy },
  { label: 'Profile', path: '/profile', icon: User },
  { label: 'Settings', path: '/settings', icon: Settings },
];

function Sidebar({ isOpen, onClose, onLogout }) {
  const userProfile = getRuntimeUserProfile();
  const onboardingStatus = getStoredOnboardingStatus() || {};
  const isComplete = isOnboardingComplete(onboardingStatus);
  
  const visibleNavItems = isComplete 
    ? navigationItems 
    : navigationItems.filter(item => item.path === '/profile' || item.path === '/support');

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm transition lg:hidden ${
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[290px] flex-col border-r border-slate-800 bg-[#07172d] px-5 py-6 transition duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Link to="/" className="mb-8 flex items-center gap-3 transition hover:opacity-80">
          <div className="flex h-14 w-14 overflow-hidden items-center justify-center rounded-full bg-white shadow-sm">
            <img
              src={BRAND_LOGO_PRIMARY}
              alt="Anusha Trade"
              className="h-full w-full object-contain p-0.5"
              onError={(e) => { e.currentTarget.src = BRAND_LOGO_FALLBACK; }}
            />
          </div>
          <div>
            <p className="font-heading text-lg font-semibold text-white whitespace-nowrap">Anusha Trade</p>
          </div>
        </Link>



        <nav className="flex-1 space-y-2 overflow-y-auto pr-1">
          {visibleNavItems.map(({ icon: Icon, label, path }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                `${isActive ? 'sidebar-link sidebar-link-active' : 'sidebar-link'}`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-6 rounded-[26px] border border-white/10 bg-white/5 p-4">
          <button
            type="button"
            onClick={onLogout}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
