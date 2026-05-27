import { Bell, ChevronDown, Menu } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getRuntimeUserProfile } from '../utils/runtimeUserProfile';
import { useEffect, useState } from 'react';
import { getNotifications } from '../services/api';

const pageMeta = {
  '/': {
    title: 'User Dashboard',
    summary: 'Track your investments, wallet balance, interest credits, and referral performance.',
  },
  '/investments': {
    title: 'My Investments',
    summary: 'Review active plans, maturities, monthly returns, and portfolio allocation.',
  },
  '/wallet': {
    title: 'Wallet',
    summary: 'Monitor credits, referral earnings, pending amounts, and wallet movement.',
  },
  '/referral-network': {
    title: 'Referral Network',
    summary: 'See your referral tree, referral list, earnings growth, and payout activity.',
  },
  '/withdraw': {
    title: 'Withdraw',
    summary: 'Submit wallet withdrawals and review recent payout requests.',
  },
  '/payment-receipts': {
    title: 'Payment Receipts',
    summary: 'Access uploaded receipts and status updates for recent investment payments.',
  },
  '/notifications': {
    title: 'Notifications',
    summary: 'Stay updated on credited interest, approvals, referral activity, and reminders.',
  },
  '/investment-status': {
    title: 'Investment Status',
    summary: 'Check plan health, payout cycles, and maturity progress for each investment.',
  },
  '/support': {
    title: 'Support',
    summary: 'Raise support tickets, track responses, and connect with the help desk.',
  },
  '/profile': {
    title: 'Profile',
    summary: 'Manage your personal details, KYC identity, and bank information.',
  },
  '/settings': {
    title: 'Settings',
    summary: 'Adjust dashboard alerts, security preferences, and investment notifications.',
  },
};

function Header({ onOpenSidebar }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const meta = pageMeta[pathname] ?? pageMeta['/'];
  const userProfile = getRuntimeUserProfile();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;

    const fetchNotifications = () => {
      getNotifications()
        .then((response) => {
          if (!active) return;
          const list = Array.isArray(response) ? response 
                       : Array.isArray(response?.data) ? response.data 
                       : Array.isArray(response?.items) ? response.items 
                       : Array.isArray(response?.notifications) ? response.notifications 
                       : [];
          const unread = list.filter((item) => !(item.read || item.isRead)).length;
          setUnreadCount(unread);
        })
        .catch(() => {
          if (!active) return;
          setUnreadCount(0);
        });
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // poll every 10 seconds

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-2xl">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenSidebar}
              className="btn-secondary h-12 w-12 rounded-2xl p-0 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="inline-flex rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white">
                Web Dashboard
              </p>
              <h1 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-slate-900">
                {meta.title}
              </h1>
              <p className="mt-1 hidden text-sm text-slate-500 sm:block">{meta.summary}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="glass-panel flex items-center gap-3 rounded-2xl px-3 py-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 font-heading text-sm font-bold text-white">
                {userProfile.avatar}
              </div>
              <div className="hidden sm:block">
                <p className="font-semibold text-slate-900">{userProfile.name}</p>
                <p className="text-sm text-slate-500">{userProfile.membership}</p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
