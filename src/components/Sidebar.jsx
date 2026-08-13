import {
  Bell,
  BriefcaseBusiness,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Receipt,
  FileText,
  Settings,
  Shield,
  Share2,
  User,
  Wallet,
  TrendingUp,
  UserCheck,
  Building,
  KeyRound,
  CheckCircle2,
  ChevronRight,
  Landmark,
  Target,
  Sparkles,
  Zap
} from 'lucide-react';
import { Drawer } from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { BRAND_LOGO_FALLBACK, BRAND_LOGO_PRIMARY } from '../constants/branding';
import { getRuntimeUserProfile } from '../utils/runtimeUserProfile';
import { getStoredOnboardingStatus, getInvestorDashboard, getReferralCommissions } from '../services/api';
import { isOnboardingComplete } from '../utils/onboardingRouter';
import { formatCurrency } from '../utils/formatters';
import { useEffect, useState, useMemo } from 'react';

function normalizeStatus(value) {
  return String(value || '').trim().toUpperCase();
}

const navigationItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, color: 'from-blue-400 to-indigo-500' },
  { label: 'Investments', path: '/investments', icon: BriefcaseBusiness, color: 'from-emerald-400 to-teal-500' },
  { label: 'Wallet', path: '/wallet', icon: Wallet, color: 'from-purple-400 to-fuchsia-500' },
  { label: 'Referrals', path: '/referral-network', icon: Share2, color: 'from-pink-400 to-rose-500' },
  { label: 'Withdraw', path: '/withdraw', icon: Landmark, color: 'from-amber-400 to-orange-500' },
  { label: 'Receipts', path: '/payment-receipts', icon: Receipt, color: 'from-cyan-400 to-blue-500' },
  { label: 'Statements', path: '/statements', icon: FileText, color: 'from-indigo-400 to-purple-500' },
  { label: 'KYC Center', path: '/kyc', icon: UserCheck, color: 'from-teal-400 to-emerald-500' },
  { label: 'Notifications', path: '/notifications', icon: Bell, color: 'from-orange-400 to-red-500' },
  { label: 'Status', path: '/investment-status', icon: Shield, color: 'from-blue-400 to-indigo-500' },
  { label: 'Security', path: '/security', icon: KeyRound, color: 'from-rose-400 to-pink-500' },
  { label: 'Watchlist', path: '/watchlist', icon: Target, color: 'from-fuchsia-400 to-purple-500' },
  { label: 'Tax', path: '/tax-center', icon: FileText, color: 'from-emerald-400 to-cyan-500' },
  { label: 'Support', path: '/support', icon: LifeBuoy, color: 'from-indigo-400 to-blue-500' },
  { label: 'Settings', path: '/settings', icon: Settings, color: 'from-slate-400 to-slate-500' },
];

function RichWalletCard({ availableBalance, pendingBalance, referralIncome }) {
  return (
    <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-5 mb-6 shadow-2xl shadow-indigo-900/20 group">
      {/* Animated glowing orbs inside card */}
      <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-500/40 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
      <div className="absolute -left-8 -bottom-8 w-24 h-24 bg-fuchsia-500/40 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-white/10 backdrop-blur-md rounded-lg">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-indigo-200">Total Wealth</span>
        </div>
        
        <h3 className="text-3xl font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)] mb-4">
          {formatCurrency(availableBalance)}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-2.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300 block mb-1">Pending</span>
            <span className="text-sm font-black text-white">{formatCurrency(pendingBalance)}</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-2.5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300 block mb-1 relative z-10">Earnings</span>
            <span className="text-sm font-black text-white relative z-10">{formatCurrency(referralIncome)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RichOnboardingCard({ onboardingStatus, onClose }) {
  const navigate = useNavigate();

  const kycState = onboardingStatus?.kycStatus || 'NOT_SUBMITTED';
  const bankState = onboardingStatus?.bankVerified;
  const accountState = onboardingStatus?.accountStatus || 'PENDING';
  const mpinState = onboardingStatus?.mpinCreated;
  const normalizedKyc = normalizeStatus(kycState);

  const steps = useMemo(() => [
    { id: 'kyc', label: 'KYC Document', status: normalizedKyc === 'APPROVED' ? 'complete' : 'active', path: '/kyc', icon: UserCheck },
    { id: 'bank', label: 'Bank Detail', status: bankState ? 'complete' : normalizedKyc === 'APPROVED' ? 'active' : 'idle', path: '/bank/link', icon: Building },
    { id: 'account', label: 'Activation', status: accountState === 'ACTIVE' ? 'complete' : bankState ? 'active' : 'idle', path: '/profile', icon: Zap },
    { id: 'mpin', label: 'Secure PIN', status: mpinState ? 'complete' : accountState === 'ACTIVE' ? 'active' : 'idle', path: '/setup-mpin', icon: KeyRound },
  ], [normalizedKyc, bankState, accountState, mpinState]);

  const completedCount = steps.filter((s) => s.status === 'complete').length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const isAllComplete = completedCount === steps.length;

  if (isAllComplete) return null;

  return (
    <div className="rounded-[1.5rem] bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 p-4 mb-6 shadow-xl relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Setup</h4>
            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{progressPercent}% Done</p>
          </div>
        </div>
      </div>
      
      {/* Animated Glowing Progress Bar */}
      <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full mb-4 overflow-hidden relative shadow-inner">
        <div 
          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 relative" 
          style={{ width: `${progressPercent}%` }} 
        >
          <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.3)_50%,transparent_75%)] bg-[length:1rem_1rem] animate-[progress_1s_linear_infinite]" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {steps.map((step) => {
          const StepIcon = step.icon;
          const isDone = step.status === 'complete';
          const isActive = step.status === 'active';

          return (
            <button
              key={step.id}
              onClick={() => { if (step.status !== 'idle') { onClose(); navigate(step.path); } }}
              disabled={step.status === 'idle'}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-300 ${ isDone ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : isActive ? 'bg-white dark:bg-slate-800 border-indigo-400 dark:border-indigo-500 shadow-md shadow-indigo-500/10 scale-105 relative z-10' : 'bg-slate-50 dark:bg-slate-900/50 border-transparent opacity-50 grayscale' }`}
            >
              <StepIcon className={`w-5 h-5 mb-1.5 ${isDone ? 'text-emerald-500' : isActive ? 'text-indigo-500' : 'text-slate-400'}`} />
              <span className={`text-[9px] font-bold uppercase tracking-wider text-center ${isDone ? 'text-emerald-700 dark:text-emerald-400' : isActive ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-500'}`}>
                {step.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SidebarContent({ onLogout, onClose }) {
  const userProfile = getRuntimeUserProfile();
  const location = useLocation();
  const onboardingStatus = getStoredOnboardingStatus() || {};
  const isComplete = isOnboardingComplete(onboardingStatus);
  const visibleNavItems = isComplete
    ? navigationItems
    : navigationItems.filter((item) => [
      '/kyc',
      '/kyc/status',
      '/bank/link',
      '/account/activate',
      '/setup-mpin',
      '/profile',
      '/support',
    ].includes(item.path));

  const [availableBalance, setAvailableBalance] = useState(0);
  const [pendingBalance, setPendingBalance] = useState(0);
  const [referralIncome, setReferralIncome] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([getInvestorDashboard(), getReferralCommissions()]).then(([dashboardRes, commissionsRes]) => {
      if (!active) return;
      const d = dashboardRes?.data || dashboardRes || {};
      setAvailableBalance(Number(d.wallet?.availableBalance ?? d.availableBalance ?? d.walletBalance ?? 0));
      setPendingBalance(Number(d.wallet?.pendingBalance ?? d.pendingBalance ?? 0));
      const commissions = Array.isArray(commissionsRes) ? commissionsRes : Array.isArray(commissionsRes?.data) ? commissionsRes.data : Array.isArray(commissionsRes?.commissions) ? commissionsRes.commissions : [];
      setReferralIncome(commissions.reduce((sum, c) => sum + Number(c.commissionAmount ?? c.amount ?? 0), 0));
    });
    return () => { active = false; };
  }, []);

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-[#060B19] border-r border-slate-200/60 dark:border-white/5 overflow-y-auto relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {/* Huge animated glowing background blobs */}
      <div className="absolute top-[-10%] left-[-20%] w-[150%] h-[500px] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="p-5 flex-1 relative z-10 flex flex-col">
        
        {/* Ultra-Premium Logo */}
        <Link to="/" onClick={onClose} className="flex items-center gap-4 mb-8 outline-none group">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-[18px] blur-md opacity-40 group-hover:opacity-70 group-hover:scale-110 transition-all duration-500" />
            <div className="relative bg-white dark:bg-slate-900 p-1.5 rounded-[18px] border-2 border-white dark:border-slate-700 shadow-xl">
              <img
                src={BRAND_LOGO_PRIMARY}
                alt="Logo"
                onError={(e) => { e.currentTarget.src = BRAND_LOGO_FALLBACK; }}
                className="w-10 h-10 object-contain rounded-xl"
              />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-1">
              Anusha <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-500">Trade</span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-200 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md inline-block">
              Premium Portal
            </p>
          </div>
        </Link>

        {/* User Profile Bento */}
        <Link to="/profile" onClick={onClose} className="rounded-[1.5rem] bg-white dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 p-3 flex items-center gap-4 shadow-lg hover:shadow-xl hover:-translate-y-1 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all duration-300 group mb-6 outline-none">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-white font-black text-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
              {userProfile.avatar}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">{userProfile.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-200 uppercase tracking-widest truncate">{userProfile.membership}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors mr-1" />
        </Link>

        {/* Vibrant Dashboard Widgets */}
        <RichWalletCard availableBalance={availableBalance} pendingBalance={pendingBalance} referralIncome={referralIncome} />
        <RichOnboardingCard onboardingStatus={onboardingStatus} onClose={onClose} />

        {/* Vibrant Navigation Menu */}
        <div className="flex-1">
          <h4 className="text-[11px] font-black tracking-[0.2em] text-slate-500 dark:text-slate-200 uppercase px-3 mb-3">Main Menu</h4>
          <nav className="space-y-1 px-1">
            {visibleNavItems.map(({ icon: Icon, label, path, color }) => {
              const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={onClose}
                  className={`flex items-center gap-4 px-3 py-1.5 rounded-2xl transition-all duration-300 outline-none group relative overflow-hidden ${ isActive ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 shadow-lg shadow-indigo-500/10' : 'border border-transparent hover:bg-white dark:hover:bg-slate-800/50 hover:border-slate-200 dark:hover:border-white/5 hover:shadow-md' }`}
                >
                  {/* Vibrant Icon Box */}
                  <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center transition-all duration-300 relative z-10 ${
                    isActive 
                      ? `bg-gradient-to-br ${color} text-white shadow-lg` 
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                  }`}>
                    {isActive && <div className="absolute inset-0 bg-white/20 rounded-[14px]" />}
                    <Icon className="w-5 h-5 relative z-10" strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  
                  <span className={`text-[13px] font-black tracking-tight relative z-10 ${ isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white' }`}>
                    {label}
                  </span>

                  {/* Active Indicator Line */}
                  {isActive && (
                    <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-l-full bg-gradient-to-b ${color}`} />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

      </div>

      {/* Premium Logout Footer */}
      <div className="p-5 mt-auto relative z-10">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-black text-sm tracking-widest uppercase hover:bg-rose-500 hover:text-white hover:border-rose-500 dark:hover:bg-rose-600 dark:hover:text-white dark:hover:border-rose-600 hover:shadow-lg hover:shadow-rose-500/20 transition-all duration-300 group outline-none"
        >
          <LogOut className="w-5 h-5 shrink-0 group-hover:scale-110 group-hover:-translate-x-1 transition-transform duration-300" strokeWidth={2.5} />
          <span>Secure Logout</span>
        </button>
      </div>

    </div>
  );
}

function Sidebar({ isOpen, onClose, onLogout }) {
  return (
    <>
      <Drawer
        open={isOpen}
        onClose={onClose}
        anchor="left"
        variant="temporary"
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': { width: 320, border: 'none', background: 'transparent' },
          '& .MuiBackdrop-root': { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.6)' }
        }}
      >
        <SidebarContent onLogout={onLogout} onClose={onClose} />
      </Drawer>

      <div className="hidden lg:block fixed top-0 left-0 bottom-0 w-[320px] z-40">
        <SidebarContent onLogout={onLogout} onClose={onClose} />
      </div>
    </>
  );
}

export default Sidebar;
