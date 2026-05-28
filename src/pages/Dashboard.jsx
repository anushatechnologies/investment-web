import { Banknote, BriefcaseBusiness, Share2, TrendingUp, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, Cell, Pie, PieChart, PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { getInvestorDashboard, getNotifications, getOwnInvestments, getOwnWithdrawals, getReferralCommissions, getReferralTree, getWalletTransactions } from '../services/api';
import { getRuntimeUserProfile } from '../utils/runtimeUserProfile';
import { formatCurrency, formatShortTick } from '../utils/formatters';

function toArray(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (key && Array.isArray(payload?.[key])) return payload[key];
  return [];
}

function Dashboard() {
  const userProfile = getRuntimeUserProfile();
  const [dashboard, setDashboard] = useState({});
  const [investments, setInvestments] = useState([]);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [referralTree, setReferralTree] = useState([]);
  const [referralCommissions, setReferralCommissions] = useState([]);

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
        setNotifications(
          toArray(notificationsRes, 'notifications').map((item, index) => ({
            id: item.id || item.notificationId || `NTF${index + 1}`,
            title: item.title || item.subject || 'Notification',
            message: item.message || item.description || '-',
            category: item.category || item.type || 'General',
            status: (item.read || item.isRead) ? 'Read' : 'Unread',
            time: item.time || item.createdAt || '-',
          }))
        );
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

  const dashboardStats = [
    { title: 'Total Investment', value: totalInvestment, change: null, note: 'across active plans', icon: BriefcaseBusiness, tone: 'blue' },
    { title: 'Wallet Balance', value: walletBalance, change: null, note: 'available in wallet', icon: Wallet, tone: 'emerald' },
    { title: 'Monthly Interest', value: monthlyInterest, change: null, note: 'latest monthly credit', icon: TrendingUp, tone: 'violet' },
    { title: 'Referral Earnings', value: referralEarnings, change: null, note: 'network commissions', icon: Share2, tone: 'amber' },
  ];

  const activeAmount = investments.filter((item) => String(item.status || '').toLowerCase() === 'active').reduce((sum, item) => sum + Number(item.investmentAmount ?? item.amount ?? 0), 0);
  const maturedAmount = investments.filter((item) => String(item.status || '').toLowerCase().includes('mature')).reduce((sum, item) => sum + Number(item.investmentAmount ?? item.amount ?? 0), 0);
  const progressPct = totalInvestment > 0 ? Math.min(100, Math.round((maturedAmount / totalInvestment) * 100)) : 0;
  const progressData = [{ name: 'Completion', value: progressPct, fill: '#2563eb' }];

  const monthlyInterestData = useMemo(() => {
    const source = toArray(dashboard.monthlyInterestData, null);
    if (source.length) return source;
    return referralCommissions.slice(0, 6).map((item, index) => ({
      month: item.month || item.commissionMonth || `M${index + 1}`,
      interest: Number(item.commissionAmount ?? item.amount ?? 0),
    }));
  }, [dashboard.monthlyInterestData, referralCommissions]);

  const donutData = [
    { name: 'Available', value: Number(dashboard.wallet?.availableBalance ?? dashboard.availableBalance ?? walletBalance), fill: '#2563eb' },
    { name: 'Pending', value: Number(dashboard.wallet?.pendingBalance ?? dashboard.pendingBalance ?? 0), fill: '#93c5fd' },
    { name: 'Locked', value: Number(dashboard.wallet?.lockedBalance ?? dashboard.lockedBalance ?? 0), fill: '#1d4ed8' },
  ];

  const recentTransactions = walletTransactions.slice(0, 3);
  const recentWithdrawals = withdrawals.slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Hello, <span className="font-semibold text-slate-900">{userProfile.name}</span>
          </p>
          <h2 className="section-title mt-2">Welcome back to your investor dashboard</h2>
        </div>
        <div className="glass-card px-5 py-4 text-sm text-slate-600">
          Referral code: <span className="font-semibold text-blue-600">{userProfile.referralCode}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} change={stat.change} note={stat.note} icon={stat.icon} tone={stat.tone} valueType="currency" />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)_360px]">
        <SectionCard title="Investment Status" subtitle="Your primary plan completion and payout readiness.">
          <div className="relative mx-auto h-[240px] w-full max-w-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart data={progressData} startAngle={90} endAngle={-270} innerRadius="72%" outerRadius="100%" barSize={16}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background clockWise dataKey="value" cornerRadius={999} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-heading text-4xl font-semibold text-slate-900">{progressPct}%</span>
              <span className="text-sm text-slate-500">Cycle progress</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3"><p className="text-sm text-slate-500">Active amount</p><p className="mt-1 font-semibold text-slate-900">{formatCurrency(activeAmount)}</p></div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3"><p className="text-sm text-slate-500">Matured amount</p><p className="mt-1 font-semibold text-slate-900">{formatCurrency(maturedAmount)}</p></div>
          </div>
        </SectionCard>

        <SectionCard title="Monthly Interest Overview" subtitle="Your recent monthly interest trend.">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyInterestData}>
                <XAxis dataKey="month" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} tickFormatter={formatShortTick} />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Interest']} />
                <Bar dataKey="interest" radius={[16, 16, 0, 0]}>
                  {monthlyInterestData.map((item, index) => (
                    <Cell key={item.month || index} fill={index === monthlyInterestData.length - 1 ? '#2563eb' : '#93c5fd'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Wallet Summary" subtitle="Current wallet composition and pending amounts.">
          <div className="relative mx-auto h-[240px] w-full max-w-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} dataKey="value" innerRadius={72} outerRadius={108} paddingAngle={4} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-heading text-3xl font-semibold text-slate-900">{formatCurrency(walletBalance)}</span>
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_380px]">
        <SectionCard title="Recent Transactions" subtitle="Latest investment, referral, and wallet movements.">
          <div className="space-y-3">
            {recentTransactions.map((transaction, index) => (
              <div key={transaction.id || index} className="flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3"><div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600"><Banknote className="h-5 w-5" /></div><div><p className="font-semibold text-slate-900">{transaction.title || transaction.type || 'Transaction'}</p><p className="mt-1 text-sm text-slate-500">{transaction.date || transaction.createdAt || '-'}</p></div></div>
                <div className="flex items-center justify-between gap-4 sm:block sm:text-right"><p className="font-semibold text-slate-900">{formatCurrency(Number(transaction.amount ?? 0))}</p><div className="mt-2"><StatusBadge label={transaction.status || 'Completed'} /></div></div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Referral Tree" subtitle="Snapshot of your network by depth level.">
          <div className="space-y-4">
            {referralTree.slice(0, 3).map((level, index) => (
              <div key={level.level || index} className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between"><span className="rounded-full px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700">{level.level || `Level ${index + 1}`}</span><span className="text-sm text-slate-500">{level.members || level.count || 0} members</span></div>
                <p className="mt-4 font-heading text-2xl font-semibold text-slate-900">{formatCurrency(Number(level.income ?? level.commission ?? 0))}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionCard title="Recent Withdrawals" subtitle="Most recent payout requests from your wallet.">
          <div className="space-y-3">
            {recentWithdrawals.map((withdrawal, index) => (
              <div key={withdrawal.id || index} className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between"><p className="font-semibold text-slate-900">{formatCurrency(Number(withdrawal.requestedAmount ?? withdrawal.amount ?? 0))}</p><StatusBadge label={withdrawal.status || 'Pending'} /></div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Notifications" subtitle="Important updates from your account activity.">
          <div className="space-y-3">
            {notifications.slice(0, 3).map((item, index) => (
              <div key={item.id || index} className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex items-center justify-between gap-3"><p className="font-semibold text-slate-900">{item.title}</p><StatusBadge label={item.status} /></div>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.message}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export default Dashboard;
