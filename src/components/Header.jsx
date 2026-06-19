import {
  Bell,
  Menu,
  Moon,
  Sun,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getRuntimeUserProfile } from '../utils/runtimeUserProfile';
import { useEffect, useState } from 'react';
import { getNotificationSummary } from '../services/api';
import { useAppTheme } from '../theme/ThemeContext';

const pageMeta = {
  '/': { title: 'Investor Dashboard', summary: 'Track capital, returns, payouts, and onboarding progress.' },
  '/dashboard': { title: 'Investor Dashboard', summary: 'Track capital, returns, payouts, and onboarding progress.' },
  '/investments': { title: 'My Investments', summary: 'Review plan status, maturities, and the current application pipeline.' },
  '/wallet': { title: 'Wallet', summary: 'Monitor available balance, credits, pending amounts, and transaction movement.' },
  '/referral-network': { title: 'Referral Network', summary: 'See your referral graph, network depth, and commission visibility.' },
  '/withdraw': { title: 'Withdrawals', summary: 'Submit payout requests and track where each withdrawal stands.' },
  '/payment-receipts': { title: 'Payment Receipts', summary: 'Follow uploaded payment proofs and their investment verification status.' },
  '/notifications': { title: 'Notifications', summary: 'Stay updated on KYC, payouts, receipts, and referral events.' },
  '/investment-status': { title: 'Investment Status', summary: 'Understand where each investment sits in the lifecycle.' },
  '/support': { title: 'Support Desk', summary: 'Raise issues and keep communication with the operations team organized.' },
  '/profile': { title: 'Profile & Verification', summary: 'Manage identity details, KYC submission, and payout banking data.' },
  '/security': { title: 'Security Center', summary: 'Monitor credential health, account protection status, and recent audit events.' },
  '/settings': { title: 'Settings', summary: 'Tune alerts, security preferences, and account behavior.' },
  '/nominees': { title: 'Family Nominees', summary: 'Manage nominee declarations, split allocations, and verification state.' },
  '/statements': { title: 'Account Statements', summary: 'Download ledger transaction summaries and monthly statement logs.' },
  '/tax-center': { title: 'Tax Center', summary: 'Access annual TDS statement certificates and tax calculation logs.' },
  '/watchlist': { title: 'Plan Watchlist', summary: 'Track interest targets, savings velocity, and shortlist plans.' },
  '/kyc': { title: 'KYC Documentation', summary: 'Submit government credentials and identity photos for verifications.' },
  '/kyc/status': { title: 'KYC Status Review', summary: 'Track operations team review progress on submitted identity files.' },
  '/bank/link': { title: 'Link Payout Account', summary: 'Add bank credentials to receive automatic returns and payouts.' },
  '/account/activate': { title: 'Activate Account', summary: 'Confirm primary setup triggers to fully unlock workspace limits.' },
  '/setup-mpin': { title: 'Secure MPIN Lock', summary: 'Configure a security pin for high-speed login and payout confirmations.' },
};

function Header({ onOpenSidebar }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const meta = pageMeta[pathname] ?? pageMeta['/'];
  const userProfile = getRuntimeUserProfile();
  const [unreadCount, setUnreadCount] = useState(0);
  const { mode, toggleTheme } = useAppTheme();

  useEffect(() => {
    let active = true;

    const fetchNotifications = () => {
      getNotificationSummary()
        .then((response) => {
          if (!active) return;
          setUnreadCount(Number(response?.unreadNotifications ?? response?.unreadCount ?? 0));
        })
        .catch(() => {
          if (!active) return;
          setUnreadCount(0);
        });
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full relative">
      {/* Decorative top gradient border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 z-40" />

      {/* Main Glass Header */}
      <div className="bg-white/70 dark:bg-[#060B19]/70 backdrop-blur-2xl border-b border-slate-200/50 dark:border-white/5 transition-colors duration-300 relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
        
        {/* Subtle background glow blobs */}
        <div className="absolute top-0 right-1/4 w-96 h-32 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-96 h-32 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between px-3 sm:px-4 lg:px-10 h-[80px] sm:h-[96px] relative z-10">
          
          {/* Left Section: Mobile Menu + Page Title Group */}
          <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
            <button
              onClick={onOpenSidebar}
              className="lg:hidden flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 text-indigo-600 dark:text-indigo-400 shadow-lg shadow-indigo-500/10 border border-white dark:border-white/10 hover:scale-105 transition-all focus:outline-none shrink-0"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 mb-0.5 sm:mb-1.5">
                <h2 className="text-lg sm:text-xl lg:text-[26px] font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-indigo-900 dark:from-white dark:to-indigo-200 tracking-tight leading-none truncate drop-shadow-sm">
                  {meta.title}
                </h2>
                <div className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md shadow-indigo-500/20 text-white transform hover:scale-105 transition-transform cursor-default shrink-0">
                  <Sparkles className="w-3 h-3 text-blue-200" />
                  <span className="text-[9px] font-black uppercase tracking-widest">
                    Workspace
                  </span>
                </div>
              </div>
              <p className="hidden md:block text-xs sm:text-[14px] font-semibold text-slate-500 dark:text-slate-300 truncate max-w-xl tracking-wide">
                {meta.summary}
              </p>
            </div>
          </div>

          {/* Right Section: Actions + Profile */}
          <div className="flex items-center gap-2 sm:gap-5 shrink-0 pl-2 sm:pl-4">
            
            {/* Quick Actions Pill */}
            <div className="flex items-center gap-1 sm:gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl p-1 sm:p-1.5 rounded-full sm:rounded-[24px] border border-white dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-black/20">
              <button
                onClick={toggleTheme}
                className="hidden sm:flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full sm:rounded-[18px] text-slate-500 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md transition-all duration-300 focus:outline-none"
              >
                {mode === 'light' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 transition-transform hover:rotate-90" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 transition-transform hover:-rotate-12" />}
              </button>

              <div className="hidden sm:block w-px h-5 sm:h-6 bg-slate-200 dark:bg-slate-700/50 mx-0.5 sm:mx-1" />

              <button
                onClick={() => navigate('/notifications')}
                className="relative flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full sm:rounded-[18px] text-slate-500 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 hover:shadow-md transition-all duration-300 focus:outline-none"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 flex items-center justify-center min-w-[16px] sm:min-w-[18px] h-[16px] sm:h-[18px] px-1 rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-[8px] sm:text-[9px] font-black text-white shadow-md shadow-rose-500/40 border border-white/20">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* Profile Premium Button */}
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 sm:gap-3 p-1 sm:p-1.5 pr-1 md:pr-5 rounded-full md:rounded-[28px] bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-black/20 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all duration-300 focus:outline-none group relative overflow-hidden"
            >
              {/* Subtle hover gleam */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 dark:from-white/0 dark:via-white/5 dark:to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
              <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full md:rounded-[22px] bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-600 flex items-center justify-center text-white font-black text-sm sm:text-base shadow-inner group-hover:scale-105 transition-transform relative z-10">
                <div className="absolute inset-0 rounded-full md:rounded-[22px] bg-black/10 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]" />
                <span className="relative z-10 drop-shadow-md">{userProfile.avatar}</span>
              </div>
              <div className="hidden md:flex flex-col items-start justify-center min-w-0 relative z-10">
                <h4 className="text-[15px] font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 truncate leading-none mb-1.5">
                  {userProfile.name}
                </h4>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest truncate leading-none">View Profile</p>
                </div>
              </div>
              <ChevronDown className="hidden md:block w-4 h-4 text-slate-500 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ml-2 relative z-10" />
            </button>

          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
