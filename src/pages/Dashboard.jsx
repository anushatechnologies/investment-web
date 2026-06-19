import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Banknote,
  BriefcaseBusiness,
  Share2,
  TrendingUp,
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Plus,
  ArrowUpRight,
  Copy,
  Check,
  Building,
  KeyRound,
  UserCheck
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { useTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import {
  getInvestorDashboard,
  getNotifications,
  getOwnInvestments,
  getOwnWithdrawals,
  getReferralCommissions,
  getReferralTree,
  getStoredOnboardingStatus,
  getWalletTransactions
} from '../services/api';
import { getRuntimeUserProfile } from '../utils/runtimeUserProfile';
import { formatCurrency, formatShortTick, formatDate } from '../utils/formatters';

function toArray(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (key && Array.isArray(payload?.[key])) return payload[key];
  return [];
}

function mapNotification(item, index) {
  return {
    id: item.id || item.notificationId || `NTF${index + 1}`,
    title: item.title || item.subject || 'Notification',
    message: item.message || item.description || '-',
    category: item.category || item.type || 'General',
    status: (item.readFlag ?? item.read ?? item.isRead) ? 'Read' : 'Unread',
    time: item.sentAt || item.createdAt || item.time || '-',
  };
}

function normalizeStatus(value) {
  return String(value || '').trim().toUpperCase();
}

function referralTypeLabel(item) {
  const value = String(item.commissionType || '').toUpperCase();
  if (value.includes('INSTANT')) return 'Instant Cashback';
  if (value.includes('MONTHLY')) return 'Monthly Income';
  return 'Referral Income';
}

function Dashboard() {
  const userProfile = getRuntimeUserProfile();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [dashboard, setDashboard] = useState({});
  const [investments, setInvestments] = useState([]);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [referralTree, setReferralTree] = useState([]);
  const [referralCommissions, setReferralCommissions] = useState([]);
  const [copied, setCopied] = useState(false);
  const onboarding = getStoredOnboardingStatus() || {};
  const referralCode = dashboard?.profile?.referralCode || userProfile.referralCode || '';

  useEffect(() => {
    let active = true;
    Promise.all([
      getInvestorDashboard(),
      getOwnInvestments(),
      getWalletTransactions(),
      getOwnWithdrawals(),
      getNotifications(),
      getReferralTree(),
      getReferralCommissions(),
    ])
      .then(([dashboardRes, investmentsRes, walletTxRes, withdrawalsRes, notificationsRes, referralTreeRes, referralCommissionsRes]) => {
        if (!active) return;
        setDashboard(dashboardRes?.data || dashboardRes || {});
        setInvestments(toArray(investmentsRes, 'investments'));
        setWalletTransactions(toArray(walletTxRes, 'transactions'));
        setWithdrawals(toArray(withdrawalsRes, 'withdrawals'));
        setNotifications(toArray(notificationsRes, 'notifications').map(mapNotification));
        setReferralTree(toArray(referralTreeRes, 'levels'));
        setReferralCommissions(toArray(referralCommissionsRes, 'commissions'));
      })
      .catch(() => {
        if (!active) return;
      });

    return () => {
      active = false;
    };
  }, []);

  const totalInvestment = Number(dashboard.totalInvested ?? dashboard.totalInvestment ?? 0);
  const walletBalance = Number(
    dashboard.wallet?.availableBalance ??
    dashboard.availableBalance ??
    dashboard.walletBalance ??
    0,
  );
  const monthlyInterest = Number(dashboard.totalInterestEarned ?? dashboard.monthlyInterest ?? 0);
  const referralEarnings = Number(
    referralCommissions.reduce((sum, item) => sum + Number(item.commissionAmount ?? item.amount ?? 0), 0),
  );
  const referralInstantCashback = referralCommissions
    .filter((item) => referralTypeLabel(item) === 'Instant Cashback')
    .reduce((sum, item) => sum + Number(item.commissionAmount ?? item.amount ?? 0), 0);
  const referralMonthlyIncome = referralCommissions
    .filter((item) => referralTypeLabel(item) === 'Monthly Income')
    .reduce((sum, item) => sum + Number(item.commissionAmount ?? item.amount ?? 0), 0);

  const dashboardStats = [
    { title: 'Total Investment', value: totalInvestment, change: null, note: 'across active plans', icon: BriefcaseBusiness, tone: 'blue' },
    { title: 'Wallet Balance', value: walletBalance, change: null, note: 'available in wallet', icon: Wallet, tone: 'emerald' },
    { title: 'Monthly Interest', value: monthlyInterest, change: null, note: 'latest monthly credit', icon: TrendingUp, tone: 'violet' },
    { title: 'Referral Earnings', value: referralEarnings, change: null, note: `Instant ${formatCurrency(referralInstantCashback)} + Monthly ${formatCurrency(referralMonthlyIncome)}`, icon: Share2, tone: 'amber' },
  ];

  const activeAmount = investments.filter((item) => String(item.status || '').toLowerCase() === 'active').reduce((sum, item) => sum + Number(item.investmentAmount ?? item.amount ?? 0), 0);
  const maturedAmount = investments.filter((item) => String(item.status || '').toLowerCase().includes('mature')).reduce((sum, item) => sum + Number(item.investmentAmount ?? item.amount ?? 0), 0);
  const progressPct = totalInvestment > 0 ? Math.min(100, Math.round((maturedAmount / totalInvestment) * 100)) : 0;
  const progressData = [{ name: 'Completion', value: progressPct, fill: '#2563eb' }];

  const monthlyInterestData = useMemo(() => {
    const source = toArray(dashboard.monthlyInterestData, null);
    if (source.length) return source;
    return referralCommissions.filter((item) => referralTypeLabel(item) === 'Monthly Income').slice(0, 6).map((item, index) => ({
      month: item.month || item.commissionMonth || `M${index + 1}`,
      interest: Number(item.commissionAmount ?? item.amount ?? 0),
    }));
  }, [dashboard.monthlyInterestData, referralCommissions]);

  const donutData = [
    { name: 'Available', value: Number(dashboard.wallet?.availableBalance ?? dashboard.availableBalance ?? walletBalance), fill: '#2563eb' },
    { name: 'Pending', value: Number(dashboard.wallet?.pendingBalance ?? dashboard.pendingBalance ?? 0), fill: '#38bdf8' },
    { name: 'Locked', value: Number(dashboard.wallet?.lockedBalance ?? dashboard.lockedBalance ?? 0), fill: '#1e40af' },
  ];

  const mappedInvestments = useMemo(() => {
    return investments.map((item, index) => {
      const amount = Number(item.investmentAmount ?? item.amount ?? 0);
      const status = item.status || 'Active';
      const startDateStr = item.startDate || item.createdAt || '';
      const maturityDateStr = item.maturityDate || '';

      let progress = 0;
      if (startDateStr && maturityDateStr && startDateStr !== '-' && maturityDateStr !== '-') {
        const start = new Date(startDateStr).getTime();
        const maturity = new Date(maturityDateStr).getTime();
        const now = Date.now();
        if (!isNaN(start) && !isNaN(maturity) && maturity > start) {
          progress = Math.min(100, Math.max(0, Math.round(((now - start) / (maturity - start)) * 100)));
        }
      } else {
        progress = status.toLowerCase() === 'active' ? 35 : 0;
      }

      return {
        id: item.id || item.investmentId || `INV${index + 1}`,
        planName: item.planName || item.plan || item.investmentPlanName || 'Standard Growth Plan',
        amount,
        startDate: startDateStr || '-',
        maturityDate: maturityDateStr || '-',
        monthlyReturn: item.monthlyReturn || item.monthlyInterestRate || item.interestRate || '8.5',
        status,
        progress,
      };
    });
  }, [investments]);

  const activeInvestments = useMemo(() => {
    return mappedInvestments.filter((inv) => inv.status.toLowerCase() === 'active' || inv.status.toLowerCase() === 'processing');
  }, [mappedInvestments]);

  const recentTransactions = walletTransactions.slice(0, 3);
  const recentWithdrawals = withdrawals.slice(0, 3);

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Compute status steps
  const onboardingSteps = useMemo(() => {
    const kycState = onboarding.kycStatus || 'NOT_SUBMITTED';
    const normalizedKyc = normalizeStatus(kycState);
    const kycActionable = normalizedKyc === 'REUPLOAD_REQUIRED' || normalizedKyc === 'REJECTED';
    const bankState = onboarding.bankVerified;
    const accountState = onboarding.accountStatus || 'PENDING';
    const mpinState = onboarding.mpinCreated;

    return [
      {
        id: 'kyc',
        label: 'KYC Document',
        subtitle: normalizedKyc === 'APPROVED' ? 'Approved' : normalizedKyc === 'PENDING' ? 'In Review' : kycActionable ? 'Reupload Requested' : 'Pending Upload',
        status: normalizedKyc === 'APPROVED' ? 'complete' : 'active',
        icon: UserCheck,
        path: '/kyc'
      },
      {
        id: 'bank',
        label: 'Bank Verification',
        subtitle: bankState ? 'Verified' : 'Pending Details',
        status: bankState ? 'complete' : normalizedKyc === 'APPROVED' ? 'active' : 'idle',
        icon: Building,
        path: '/bank/link'
      },
      {
        id: 'account',
        label: 'Account Activation',
        subtitle: accountState === 'ACTIVE' ? 'Activated' : 'Awaiting Review',
        status: accountState === 'ACTIVE' ? 'complete' : bankState ? 'active' : 'idle',
        icon: CheckCircle2,
        path: '/profile'
      },
      {
        id: 'mpin',
        label: 'Security Pin (MPIN)',
        subtitle: mpinState ? 'Configured' : 'Setup MPIN',
        status: mpinState ? 'complete' : accountState === 'ACTIVE' ? 'active' : 'idle',
        icon: KeyRound,
        path: '/setup-mpin'
      }
    ];
  }, [onboarding]);

  const onboardingCompleted = onboardingSteps.every(step => step.status === 'complete');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1121] pb-12 pt-4 px-4 sm:px-6 lg:px-8 space-y-8 font-sans transition-colors duration-300">
      {/* Dynamic Background Blurs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
      </div>

      <div className="relative z-10 space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200 dark:border-white/10">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-bold tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              {greeting}
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {userProfile.name}<span className="text-blue-600">.</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-300 max-w-2xl text-sm md:text-base font-medium">
              Your financial command center. Monitor investments, track growth, and explore new opportunities.
            </p>
          </div>

          <div className="flex flex-col gap-3 shrink-0">
            <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-4 shadow-sm hover:shadow-md transition-all">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-between gap-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest mb-1">Referral Code</p>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-200 font-mono tracking-wider">{referralCode || '-'}</p>
                </div>
                <button
                  onClick={copyReferralCode}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500 transition-all active:scale-95 group-hover:rotate-3"
                >
                  {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* Main Portfolio Card (Spans 8 columns) */}
          <div className="col-span-1 xl:col-span-8 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 dark:from-slate-950 dark:to-indigo-950 p-6 md:p-8 shadow-2xl border border-white/10 group">
            <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
              <Building className="w-64 h-64 text-white" />
            </div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="space-y-2 max-w-full">
                <span className="inline-flex px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-bold tracking-widest uppercase border border-white/20 backdrop-blur-md">
                  Total Net Worth
                </span>
                <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight drop-shadow-lg truncate">
                  {formatCurrency(totalInvestment + walletBalance)}
                </h2>
                <p className="text-indigo-200 text-xs sm:text-sm font-medium">Includes active investments & available balance</p>
              </div>

              <div className="mt-8 md:mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <p className="text-[9px] sm:text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1 truncate">Active Plans</p>
                  <p className="text-lg sm:text-xl font-bold text-white truncate">{formatCurrency(totalInvestment)}</p>
                </div>
                <div className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <p className="text-[9px] sm:text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1 truncate">Wallet Cash</p>
                  <p className="text-lg sm:text-xl font-bold text-white truncate">{formatCurrency(walletBalance)}</p>
                </div>
                <div className="col-span-2 flex flex-col sm:flex-row gap-3">
                  <Link to="/investments" className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-0 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-blue-500/25">
                    <Plus className="w-4 h-4" /> Invest
                  </Link>
                  <Link to="/wallet" className="flex-1 flex items-center justify-center gap-2 py-3 sm:py-0 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all active:scale-95 backdrop-blur-md border border-white/10">
                    <Wallet className="w-4 h-4" /> Deposit
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Onboarding Flow (Spans 4 columns) */}
          <div className="col-span-1 xl:col-span-4 rounded-3xl bg-white dark:bg-slate-800/50 p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Account Setup</h3>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${onboardingCompleted ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'}`}>
                {onboardingCompleted ? 'Ready' : 'Pending'}
              </div>
            </div>
            
            <div className="flex-1 space-y-4">
              {onboardingSteps.map((step, idx) => {
                const Icon = step.icon;
                const isDone = step.status === 'complete';
                const isActive = step.status === 'active';
                return (
                  <Link
                    key={step.id}
                    to={step.status !== 'idle' ? step.path : '#'}
                    className={`group relative flex items-center gap-4 p-3 rounded-2xl border transition-all ${ isActive ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-500/10' : isDone ? 'border-slate-100 dark:border-white/5 hover:border-emerald-200' : 'border-transparent opacity-50 grayscale pointer-events-none' }`}
                  >
                    <div className={`p-2.5 rounded-xl shrink-0 ${ isDone ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : isActive ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-100 text-slate-400 dark:bg-slate-800' }`}>
                      {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-300 truncate">{step.subtitle}</p>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-5 h-5 text-blue-500 transform group-hover:translate-x-1 transition-transform" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Quick Stats Grid */}
          {dashboardStats.map((stat, idx) => {
            const toneColors = {
              blue: 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400',
              emerald: 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
              violet: 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400',
              amber: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
            };
            const colorClass = toneColors[stat.tone] || toneColors.blue;
            
            return (
              <div key={idx} className="col-span-1 md:col-span-2 xl:col-span-3 rounded-3xl bg-white dark:bg-slate-800/80 p-6 shadow-sm border border-slate-200 dark:border-white/5 hover:-translate-y-1 transition-transform duration-300">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${colorClass}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider mb-1">{stat.title}</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">{formatCurrency(stat.value)}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-300">{stat.note}</p>
              </div>
            );
          })}

          {/* Active Investments (Spans full width) */}
          <div className="col-span-1 xl:col-span-12 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Active Portfolios</h3>
                <p className="text-sm text-slate-500 dark:text-slate-300 mt-1">Track the performance and maturity of your investments.</p>
              </div>
            </div>
            
            {activeInvestments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {activeInvestments.map(inv => (
                  <div key={inv.id} className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-800/80 p-6 shadow-sm border border-slate-200 dark:border-white/5 hover:shadow-xl hover:border-blue-500/30 transition-all duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div>
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                          {inv.id}
                        </span>
                        <h4 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">{inv.planName}</h4>
                      </div>
                      <StatusBadge label={inv.status} />
                    </div>

                    <div className="flex items-baseline gap-2 mb-6 relative z-10">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(inv.amount)}</span>
                      <span className="text-xs font-bold text-emerald-500">+{inv.monthlyReturn}%/mo</span>
                    </div>

                    <div className="space-y-2 relative z-10">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-500 dark:text-slate-300">Progress</span>
                        <span className="text-blue-600 dark:text-blue-400">{inv.progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${inv.progress}%` }} />
                      </div>
                      <div className="flex justify-between text-[10px] font-medium text-slate-500 dark:text-slate-300 pt-2">
                        <span>Started: {inv.startDate}</span>
                        <span>Matures: {inv.maturityDate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4 text-slate-500 dark:text-slate-300">
                  <BriefcaseBusiness className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Active Investments</h4>
                <p className="text-sm text-slate-500 mb-6 max-w-sm dark:text-slate-300">Start your wealth-building journey by exploring our tailored investment plans.</p>
                <Link to="/investments" className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-500/30">
                  Explore Plans
                </Link>
              </div>
            )}
          </div>

          {/* Charts Row */}
          <div className="col-span-1 xl:col-span-8 rounded-3xl bg-white dark:bg-slate-800/80 p-6 shadow-sm border border-slate-200 dark:border-white/5">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Interest Earnings History</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyInterestData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} axisLine={false} tick={{ fontSize: 12, fontWeight: 500 }} dy={10} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={formatShortTick} tick={{ fontSize: 12, fontWeight: 500 }} />
                  <Tooltip
                    cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', background: isDark ? '#1e293b' : '#fff' }}
                  />
                  <Bar dataKey="interest" fill="url(#barGrad)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-span-1 xl:col-span-4 rounded-3xl bg-white dark:bg-slate-800/80 p-6 shadow-sm border border-slate-200 dark:border-white/5 flex flex-col">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Wallet Distribution</h3>
            <div className="relative flex-1 flex flex-col items-center justify-center">
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} dataKey="value" innerRadius={70} outerRadius={90} paddingAngle={5} stroke="none">
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(walletBalance)}</span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase">Available</span>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {donutData.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(item.value)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Data Grids */}
          <div className="col-span-1 xl:col-span-6 rounded-3xl bg-white dark:bg-slate-800/80 p-6 shadow-sm border border-slate-200 dark:border-white/5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
              <Link to="/wallet" className="text-sm font-bold text-blue-600 hover:text-blue-700">View All</Link>
            </div>
            <div className="space-y-4">
              {recentTransactions.length > 0 ? recentTransactions.map((tx, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <Banknote className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{tx.title || tx.description || tx.transactionType || tx.type || 'Transaction'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">{formatDate(tx.date || tx.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(Number(tx.amount || 0))}</p>
                    <StatusBadge label={tx.status} />
                  </div>
                </div>
              )) : (
                <p className="text-center text-sm text-slate-500 py-8 dark:text-slate-300">No recent activity.</p>
              )}
            </div>
          </div>

          <div className="col-span-1 xl:col-span-6 rounded-3xl bg-white dark:bg-slate-800/80 p-6 shadow-sm border border-slate-200 dark:border-white/5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Notifications</h3>
              <Link to="/notifications" className="text-sm font-bold text-blue-600 hover:text-blue-700">View All</Link>
            </div>
            <div className="space-y-4">
              {notifications.slice(0, 3).map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.title}</h4>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300">{formatDate(item.time)}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-300 line-clamp-2">{item.message}</p>
                </div>
              ))}
              {notifications.length === 0 && (
                <p className="text-center text-sm text-slate-500 py-8 dark:text-slate-300">You're all caught up!</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Dashboard;
