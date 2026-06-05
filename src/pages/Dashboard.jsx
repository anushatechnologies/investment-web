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
import { formatCurrency, formatShortTick } from '../utils/formatters';

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
    <div className="space-y-6">
      {/* ── Welcome Header ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600 dark:text-blue-400">
            {greeting}, <span className="font-extrabold">{userProfile.name}</span>
          </p>
          <h2 className="section-title mt-1 font-heading text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Welcome back to your portal
          </h2>
          <p className="section-copy mt-1 max-w-xl text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
            Monitor plan cycles, payout milestones, and your passive interest payouts in real time.
          </p>
        </div>

        {/* Premium Referral Pill */}
        <div className="inline-flex items-center gap-2.5 self-start rounded-2xl border border-slate-200 bg-white/70 px-4 py-2.5 backdrop-blur-md shadow-sm dark:border-white/[0.06] dark:bg-slate-900/60">
          <Share2 className="h-4 w-4 text-blue-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">Referral Code</p>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{referralCode || '-'}</p>
          </div>
          <button
            onClick={copyReferralCode}
            className="ml-2 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 active:scale-95 transition dark:bg-white/[0.04] dark:text-slate-400"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Hero section + Onboarding row ── */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_0.8fr]">
        
        {/* Industry-Grade Portfolio Card */}
        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-[#0c182e] via-[#091124] to-[#040812] p-6 text-white shadow-[0_30px_70px_rgba(2,8,22,0.4)] sm:p-8">
          {/* Glowing Ambient Backgrounds */}
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-600/20 blur-[50px] pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-emerald-600/15 blur-[50px] pointer-events-none" />
          
          <div className="relative flex flex-col justify-between h-full min-h-[220px]">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-sky-400">
                  Total Wealth
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-extrabold tracking-wider text-slate-200">
                  INVESTOR LEVEL
                </span>
              </div>
              <h3 className="mt-3 font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
                {formatCurrency(totalInvestment + walletBalance)}
              </h3>
              <p className="mt-1 text-[11px] text-slate-400">
                Sum of active investments & available wallet balance
              </p>
            </div>

            {/* Split Metrics */}
            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Active Plans</p>
                <p className="mt-1 text-lg font-bold text-white">{formatCurrency(totalInvestment)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Wallet Cash</p>
                <p className="mt-1 text-lg font-bold text-white">{formatCurrency(walletBalance)}</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/investments"
                className="flex items-center gap-1.5 rounded-2xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 active:scale-95 transition"
              >
                <Plus className="h-4 w-4" /> Invest Now
              </Link>
              <Link
                to="/wallet"
                className="flex items-center gap-1.5 rounded-2xl bg-white/10 border border-white/10 px-5 py-3 text-xs font-bold text-slate-100 hover:bg-white/15 active:scale-95 transition"
              >
                <Wallet className="h-4 w-4" /> Add Cash
              </Link>
            </div>
          </div>
        </div>

        {/* Onboarding Timeline Progress Stepper */}
        <div className="relative overflow-hidden flex flex-col justify-between rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-white/90 to-slate-50/50 p-6 backdrop-blur-md shadow-lg dark:border-white/[0.08] dark:from-slate-900/80 dark:to-slate-950/40 sm:p-7">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-500/10 blur-[30px] pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">
                  Setup Progress
                </span>
                <h3 className="font-heading text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">Onboarding Flow</h3>
              </div>
              <span className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1 text-[10px] font-extrabold tracking-wider ${
                onboardingCompleted 
                  ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-blue-500/12 text-blue-600 dark:text-blue-400 animate-pulse'
              }`}>
                {onboardingCompleted ? 'COMPLETED' : 'IN PROGRESS'}
              </span>
            </div>
            <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Complete your verification and account configuration steps below to unlock all trading actions.
            </p>
          </div>

          <div className="mt-6 space-y-3.5">
            {onboardingSteps.map((step, idx) => {
              const Icon = step.icon;
              const isDone = step.status === 'complete';
              const isActive = step.status === 'active';
              return (
                <Link
                  key={step.id}
                  to={step.status !== 'idle' ? step.path : '#'}
                  className={`flex items-center justify-between gap-3 p-3.5 rounded-[20px] border transition-all duration-300 ${
                    isActive
                      ? 'border-blue-500 bg-gradient-to-r from-blue-500/8 to-transparent shadow-[0_4px_20px_rgba(59,130,246,0.06)] dark:from-blue-500/15'
                      : isDone
                        ? 'border-emerald-500/15 bg-gradient-to-r from-emerald-500/5 to-transparent dark:from-emerald-500/8'
                        : 'border-slate-100 dark:border-white/[0.03] bg-transparent opacity-50 pointer-events-none'
                  }`}
                  style={{ textDecoration: 'none' }}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-2xl transition-all duration-300 ${
                        isDone
                          ? 'bg-emerald-500/15 text-emerald-500 shadow-inner'
                          : isActive
                            ? 'bg-blue-500/20 text-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.25)] animate-pulse'
                            : 'bg-slate-100 text-slate-400 dark:bg-white/[0.04]'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className={`text-xs font-bold transition-colors ${
                        isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'
                      }`}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{step.subtitle}</p>
                    </div>
                  </div>
                  {step.status !== 'idle' && (
                    <div className={`flex h-6 w-6 items-center justify-center rounded-xl bg-slate-50 dark:bg-white/[0.03] transition-transform ${
                      isActive ? 'translate-x-1 border border-blue-500/30' : ''
                    }`}>
                      <ChevronRight className={`h-3.5 w-3.5 ${isDone ? 'text-emerald-500' : 'text-blue-500'}`} />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Metric Stats Cards Grid ── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {dashboardStats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            note={stat.note}
            icon={stat.icon}
            tone={stat.tone}
            valueType="currency"
          />
        ))}
      </div>
      {/* ── My Active Investments Portfolio ── */}
      <SectionCard 
        title="My Active Portfolios" 
        subtitle="Track the cycles, returns, and maturity timelines of your running investments."
      >
        {activeInvestments.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeInvestments.map((inv) => (
              <div 
                key={inv.id}
                className="relative overflow-hidden rounded-[24px] border border-slate-100 bg-slate-50/40 p-5 dark:border-white/[0.05] dark:bg-white/[0.01] hover:border-blue-500/30 transition shadow-sm"
              >
                {/* Plan Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="rounded-full bg-blue-100/60 px-2 py-0.5 text-[9px] font-extrabold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                      {inv.id}
                    </span>
                    <h4 className="mt-1.5 font-heading text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                      {inv.planName}
                    </h4>
                  </div>
                  <StatusBadge label={inv.status} />
                </div>

                {/* Amount and Return */}
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {formatCurrency(inv.amount)}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    +{inv.monthlyReturn}%/mo
                  </span>
                </div>

                {/* Progress bar (cycle) */}
                <div className="mt-5">
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold mb-1">
                    <span>CYCLE PROGRESS</span>
                    <span>{inv.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/[0.05] overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-sky-400"
                      style={{ width: `${inv.progress}%` }}
                    />
                  </div>
                </div>

                {/* Dates footer */}
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-white/[0.04] pt-3 text-[10px] text-slate-400 font-medium">
                  <div>
                    <span>Start: </span>
                    <span className="font-bold text-slate-600 dark:text-slate-300">{inv.startDate}</span>
                  </div>
                  <div className="text-right">
                    <span>Maturity: </span>
                    <span className="font-bold text-slate-600 dark:text-slate-300">{inv.maturityDate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8 rounded-[24px] border border-dashed border-slate-200 dark:border-white/[0.08]">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No active investments found.</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">Choose from our top-performing plans and start earning monthly interest payouts.</p>
            <Link to="/investments" className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-blue-500 transition">
              <Plus className="h-3.5 w-3.5" /> Start First Investment
            </Link>
          </div>
        )}
      </SectionCard>

      {/* ── Core Charts Panel ── */}
      <div className="grid gap-5 lg:grid-cols-[1fr_1.8fr_1fr]">
        
        {/* Plan Status Radial Progress */}
        <SectionCard title="Active Progress" subtitle="Plan cycle completion.">
          <div className="relative mx-auto h-[200px] w-full max-w-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart data={progressData} startAngle={90} endAngle={-270} innerRadius="72%" outerRadius="100%" barSize={12}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background clockWise dataKey="value" cornerRadius={999} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-heading text-3xl font-extrabold text-slate-900 dark:text-white">{progressPct}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cycle done</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-[18px] bg-slate-50 dark:bg-white/[0.03] p-3 text-center border border-slate-100 dark:border-white/[0.04]">
              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Active Amount</p>
              <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">{formatCurrency(activeAmount)}</p>
            </div>
            <div className="rounded-[18px] bg-slate-50 dark:bg-white/[0.03] p-3 text-center border border-slate-100 dark:border-white/[0.04]">
              <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Matured Amount</p>
              <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-200">{formatCurrency(maturedAmount)}</p>
            </div>
          </div>
        </SectionCard>

        {/* Monthly Interest overview */}
        <SectionCard title="Interest Earnings" subtitle="Monthly payout credits trend.">
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyInterestData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.4} />
                  </linearGradient>
                  <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0284c7" stopOpacity={0.8} />
                    <stop offset="100%" stopColor="#0369a1" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" tickLine={false} axisLine={false} tick={{ fontSize: 10, fontWeight: 600 }} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} tickFormatter={formatShortTick} tick={{ fontSize: 10, fontWeight: 600 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.06)' }}
                  contentStyle={{
                    backgroundColor: isDark ? '#0b1329' : '#ffffff',
                    border: '1px solid ' + (isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'),
                    borderRadius: '16px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                  }}
                  labelStyle={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}
                  itemStyle={{ fontSize: 12, fontWeight: 700, color: '#2563eb' }}
                  formatter={(value) => [formatCurrency(value), 'Payout']}
                />
                <Bar dataKey="interest" radius={[8, 8, 0, 0]}>
                  {monthlyInterestData.map((item, index) => (
                    <Cell key={item.month || index} fill={index === monthlyInterestData.length - 1 ? 'url(#blueGrad)' : 'url(#skyGrad)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Wallet allocation composition */}
        <SectionCard title="Wallet Split" subtitle="Cash balance status.">
          <div className="relative mx-auto h-[200px] w-full max-w-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} dataKey="value" innerRadius={64} outerRadius={90} paddingAngle={4} stroke="transparent" />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-heading text-xl font-extrabold text-slate-900 dark:text-white">{formatCurrency(walletBalance)}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Available</span>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1.5">
            {donutData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-slate-500 dark:text-slate-400 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* ── Subtables / Feeds Row ── */}
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        
        {/* Recent Transactions list */}
        <SectionCard title="Wallet Activity" subtitle="Recent financial and interest records.">
          <div className="space-y-3">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction, index) => (
                <div
                  key={transaction.id || index}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition hover:border-blue-100 hover:bg-blue-50/10 dark:border-white/[0.04] dark:bg-white/[0.01] dark:hover:border-white/[0.08]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                      <Banknote className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-800 dark:text-slate-200">
                        {transaction.title || transaction.type || 'Transaction'}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{transaction.date || transaction.createdAt || '-'}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(Number(transaction.amount ?? 0))}
                    </p>
                    <div className="mt-1">
                      <StatusBadge label={transaction.status || 'Completed'} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-xs text-slate-400 py-6">No recent transactions found.</p>
            )}
          </div>
        </SectionCard>

        {/* Referral Network tree snapshot */}
        <SectionCard title="Referral Network" subtitle="Your investor level team depth and active earnings.">
          <div className="space-y-4">
            {referralTree.length > 0 ? (
              (() => {
                const totalMembers = referralTree.reduce((sum, lvl) => sum + Number(lvl.members ?? lvl.count ?? 0), 0);
                const maxMembers = Math.max(...referralTree.map(lvl => Number(lvl.members ?? lvl.count ?? 0)), 1);

                return referralTree.slice(0, 3).map((level, index) => {
                  const membersCount = Number(level.members ?? level.count ?? 0);
                  const income = Number(level.income ?? level.commission ?? 0);
                  const pct = Math.round((membersCount / maxMembers) * 100);

                  // HSL color gradients for visual elegance
                  const gradients = [
                    'from-blue-500 to-sky-400',
                    'from-emerald-500 to-teal-400',
                    'from-violet-500 to-purple-400',
                  ];
                  const activeGrad = gradients[index % gradients.length];

                  return (
                    <div
                      key={level.level || index}
                      className="relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-50/40 p-4 transition-all duration-300 hover:border-blue-500/20 dark:border-white/[0.04] dark:bg-white/[0.01]"
                    >
                      <div className="flex items-center justify-between gap-3 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                            {level.level || `Level ${index + 1}`}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            {membersCount} member{membersCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">INCOME EARNED</p>
                          <p className="mt-0.5 text-sm font-extrabold text-slate-900 dark:text-white">
                            {formatCurrency(income)}
                          </p>
                        </div>
                      </div>

                      {/* Visual progress distribution */}
                      <div className="flex items-center gap-3">
                        <div className="h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-white/[0.05] overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${activeGrad} transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-extrabold text-slate-400 w-6 text-right">{pct}%</span>
                      </div>
                    </div>
                  );
                });
              })()
            ) : (
              <p className="text-center text-xs text-slate-400 py-6">No referral levels linked yet.</p>
            )}
          </div>
        </SectionCard>
      </div>

      {/* ── Bottom Row: Withdrawals + Notifications ── */}
      <div className="grid gap-5 lg:grid-cols-2">
        
        {/* Withdraw requests list */}
        <SectionCard title="Payout Requests" subtitle="Statuses of request cashouts.">
          <div className="space-y-3">
            {recentWithdrawals.length > 0 ? (
              recentWithdrawals.map((withdrawal, index) => (
                <div
                  key={withdrawal.id || index}
                  className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-white/[0.04] dark:bg-white/[0.01]"
                >
                  <div>
                    <p className="text-[9px] font-extrabold text-slate-400 uppercase">AMOUNT</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {formatCurrency(Number(withdrawal.requestedAmount ?? withdrawal.amount ?? 0))}
                    </p>
                  </div>
                  <StatusBadge label={withdrawal.status || 'Pending'} />
                </div>
              ))
            ) : (
              <p className="text-center text-xs text-slate-400 py-6">No recent payout requests.</p>
            )}
          </div>
        </SectionCard>

        {/* Notifications and system announcements */}
        <SectionCard title="Activity Log" subtitle="Security and wallet update logs.">
          <div className="space-y-3">
            {notifications.slice(0, 3).map((item, index) => (
              <div
                key={item.id || index}
                className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-white/[0.04] dark:bg-white/[0.01]"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.title}</p>
                  <StatusBadge label={item.status} />
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{item.message}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export default Dashboard;
