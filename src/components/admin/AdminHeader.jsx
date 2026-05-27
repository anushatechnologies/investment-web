import { Bell, ChevronDown, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { adminProfile } from '../../data/adminData';
import { useEffect, useState } from 'react';
import { getNotifications } from '../../services/api';

const pageMeta = {
  '/admin': {
    eyebrow: 'Executive Overview',
    summary: 'Monitor investors, revenue, withdrawals, referrals, and risk controls in one place.',
  },
  '/admin/investors': {
    eyebrow: 'Investor Operations',
    summary: 'Track onboarding, KYC progress, and investor growth across regions.',
  },
  '/admin/investments': {
    eyebrow: 'Portfolio Book',
    summary: 'Review active allocations, return expectations, and maturity schedules.',
  },
  '/admin/revenue': {
    eyebrow: 'Finance Desk',
    summary: 'Break down interest income, referral revenue, and recent collections.',
  },
  '/admin/withdrawals': {
    eyebrow: 'Payout Review',
    summary: 'Approve withdrawal requests and keep pending wallet cash flow under control.',
  },
  '/admin/referrals': {
    eyebrow: 'Growth Partnerships',
    summary: 'Measure direct commission performance and monthly passive referral earnings.',
  },
  '/admin/fraud-monitoring': {
    eyebrow: 'Risk Control',
    summary: 'Investigate suspicious activity, chargebacks, and high-risk investor behavior.',
  },
  '/admin/payment-verification': {
    eyebrow: 'Receipt Verification',
    summary: 'Validate uploaded payment receipts before investment credits are released.',
  },
  '/admin/user-management': {
    eyebrow: 'Access Management',
    summary: 'Control internal and investor-facing user access across roles.',
  },
  '/admin/reports': {
    eyebrow: 'Reporting Suite',
    summary: 'Export operational summaries, fraud digests, and compliance snapshots.',
  },
  '/admin/settings': {
    eyebrow: 'Platform Settings',
    summary: 'Configure business rules, approval policies, and security preferences.',
  },
};

function AdminHeader({ onOpenSidebar }) {
  const { pathname } = useLocation();
  const meta = pageMeta[pathname] ?? pageMeta['/admin'];
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
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050c1b]/80 backdrop-blur-2xl">
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
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold-soft">
                {meta.eyebrow}
              </p>
              <p className="mt-1 hidden text-sm text-slate-400 sm:block">{meta.summary}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-200 transition hover:bg-white/[0.08]"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-2 top-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="glass-panel flex items-center gap-3 rounded-2xl px-3 py-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/90 via-gold-soft to-amber-200 font-heading text-sm font-bold text-slate-950">
                A
              </div>
              <div className="hidden sm:block">
                <p className="font-semibold text-white">{adminProfile.name}</p>
                <p className="text-sm text-slate-400">{adminProfile.role}</p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
