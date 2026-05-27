import {
  ArrowRightLeft,
  Banknote,
  BriefcaseBusiness,
  Percent,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useState } from 'react';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import {
  dashboardInvestmentSplit,
  dashboardRevenueData,
  dashboardSecondaryMetrics,
  platformRules,
} from '../data/adminData';
import { formatCompactCurrency, formatCurrency, formatNumber, formatShortTick } from '../utils/formatters';

const primaryStats = [
  {
    title: 'Total Investors',
    value: 1245,
    change: 13.5,
    note: 'vs last month',
    icon: Users,
    tone: 'blue',
    valueType: 'number',
  },
  {
    title: 'Total Revenue',
    value: 12500000,
    change: 18.7,
    note: 'vs last month',
    icon: Banknote,
    tone: 'emerald',
    valueType: 'currency',
  },
  {
    title: 'Active Investments',
    value: 856,
    change: 10.3,
    note: 'vs last month',
    icon: BriefcaseBusiness,
    tone: 'violet',
    valueType: 'number',
  },
  {
    title: 'Pending Withdrawals',
    value: 32,
    change: -5.2,
    note: 'vs last month',
    icon: Wallet,
    tone: 'amber',
    valueType: 'number',
  },
];

const secondaryIcons = [ArrowRightLeft, Percent, Wallet, ShieldCheck];
const secondaryTones = ['blue', 'violet', 'emerald', 'rose'];

function DashboardPage() {
  const [period, setPeriod] = useState('This Month');
  const totalInvestments = dashboardInvestmentSplit.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">
            Anusha Trade
          </p>
          <h1 className="section-title mt-3">Main Dashboard</h1>
          <p className="section-copy mt-3 max-w-3xl">
            Premium control center for investor onboarding, revenue performance, referral
            commissions, wallet payouts, payment verification, and fraud prevention workflows.
          </p>
        </div>

        <div className="glass-panel rounded-3xl px-5 py-4 text-sm text-slate-300">
          Minimum investment {formatCurrency(platformRules.minInvestment)} and maximum investment{' '}
          {formatCurrency(platformRules.maxInvestment)} are enforced across active plans.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {primaryStats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.8fr)]">
        <SectionCard
          title="Revenue Overview"
          subtitle="Daily realized revenue performance across investor interest collections and referral income."
          action={
            <button
              type="button"
              onClick={() => setPeriod((current) => (current === 'This Month' ? 'Last Month' : 'This Month'))}
              className="btn-secondary"
            >
              {period}
            </button>
          }
        >
          <div className="h-[340px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardRevenueData}>
                <defs>
                  <linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.48} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatShortTick}
                />
                <Tooltip
                  cursor={{ stroke: 'rgba(59,130,246,0.3)', strokeWidth: 1 }}
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                  contentStyle={{
                    background: 'rgba(7, 17, 38, 0.95)',
                    border: '1px solid rgba(148, 163, 184, 0.18)',
                    borderRadius: '18px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  fill="url(#dashboardRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard
          title="Investment Overview"
          subtitle="Live snapshot of active, matured, pending, and under-review allocations."
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_180px] xl:grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_180px]">
            <div className="relative mx-auto h-[280px] w-full max-w-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardInvestmentSplit}
                    innerRadius={78}
                    outerRadius={112}
                    paddingAngle={4}
                    dataKey="value"
                  />
                  <Tooltip
                    formatter={(value, name) => [formatNumber(value), name]}
                    contentStyle={{
                      background: 'rgba(7, 17, 38, 0.95)',
                      border: '1px solid rgba(148, 163, 184, 0.18)',
                      borderRadius: '18px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading text-4xl font-semibold text-white">
                  {formatNumber(totalInvestments)}
                </span>
                <span className="text-sm text-slate-400">Total portfolios</span>
              </div>
            </div>

            <div className="space-y-3">
              {dashboardInvestmentSplit.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-sm font-medium text-slate-200">{item.name}</span>
                  </div>
                  <span className="text-sm text-slate-400">{formatNumber(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardSecondaryMetrics.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            note={stat.note}
            icon={secondaryIcons[index]}
            tone={secondaryTones[index]}
            valueType="currency"
          />
        ))}
      </div>

      <SectionCard
        title="Platform Guardrails"
        subtitle="Core business rules reflected across investments, referrals, payment verification, and withdrawals."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Minimum investment</p>
            <p className="mt-3 font-heading text-2xl font-semibold text-white">
              {formatCurrency(platformRules.minInvestment)}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Maximum investment</p>
            <p className="mt-3 font-heading text-2xl font-semibold text-white">
              {formatCurrency(platformRules.maxInvestment)}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Monthly interest</p>
            <p className="mt-3 font-heading text-2xl font-semibold text-white">
              {platformRules.monthlyInterest}%
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Direct referral commission</p>
            <p className="mt-3 font-heading text-2xl font-semibold text-white">
              {platformRules.directReferralCommission}%
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Monthly passive referral income</p>
            <p className="mt-3 font-heading text-2xl font-semibold text-white">
              {platformRules.passiveReferralIncome}%
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Minimum wallet withdrawal</p>
            <p className="mt-3 font-heading text-2xl font-semibold text-white">
              {formatCurrency(platformRules.minWithdrawal)}
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5 text-sm leading-7 text-blue-100">
          All withdrawals require admin approval, investment receipts must be verified by admin
          before crediting, and fraud monitoring plus user management remain enabled for every
          account lifecycle stage.
        </div>
      </SectionCard>
    </div>
  );
}

export default DashboardPage;
