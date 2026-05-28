import { AlertTriangle, BriefcaseBusiness, ShieldCheck, Users, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import RefreshIcon from '@mui/icons-material/Refresh';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import {
  adminGetAllInvestments,
  adminGetDashboard,
  adminGetMonthlyReport,
} from '../services/api';
import { buildMonthlySeries, prettifyEnum, toArray, asNumber } from '../utils/adminTransforms';
import { formatCompactCurrency, formatCurrency, formatNumber, formatShortTick } from '../utils/formatters';

const investmentPalette = ['#2563eb', '#14b8a6', '#f59e0b', '#7c3aed', '#e11d48', '#64748b'];

function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboardRes, reportRes, investmentsRes] = await Promise.all([
        adminGetDashboard(),
        adminGetMonthlyReport().catch(() => ({})),
        adminGetAllInvestments().catch(() => []),
      ]);

      setDashboard(dashboardRes || {});
      setMonthlyReport(reportRes || {});
      setInvestments(toArray(investmentsRes));
    } catch (err) {
      console.error('Failed to load admin dashboard', err);
      setError(err.message || 'Failed to load admin dashboard.');
      setDashboard(null);
      setMonthlyReport(null);
      setInvestments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const primaryStats = useMemo(() => ([
    {
      title: 'Total Investors',
      value: asNumber(dashboard?.totalInvestors),
      note: 'live investor accounts from admin dashboard',
      icon: Users,
      tone: 'blue',
      valueType: 'number',
    },
    {
      title: 'Total AUM',
      value: asNumber(dashboard?.totalAum),
      note: 'active capital currently under management',
      icon: Wallet,
      tone: 'emerald',
      valueType: 'currency',
      compact: true,
    },
    {
      title: 'Active Investments',
      value: asNumber(dashboard?.activeInvestments),
      note: 'portfolios currently earning',
      icon: BriefcaseBusiness,
      tone: 'violet',
      valueType: 'number',
    },
    {
      title: 'Pending Withdrawals',
      value: asNumber(dashboard?.pendingWithdrawals),
      note: 'requests waiting for admin action',
      icon: ShieldCheck,
      tone: 'amber',
      valueType: 'number',
    },
  ]), [dashboard]);

  const secondaryStats = useMemo(() => ([
    {
      title: 'Pending KYC',
      value: asNumber(dashboard?.pendingKycQueue),
      note: 'kyc submissions in review queue',
      icon: ShieldCheck,
      tone: 'cyan',
      valueType: 'number',
    },
    {
      title: 'Pending Receipts',
      value: asNumber(dashboard?.pendingReceipts),
      note: 'investment receipts awaiting verification',
      icon: BriefcaseBusiness,
      tone: 'amber',
      valueType: 'number',
    },
    {
      title: 'Open Fraud Alerts',
      value: asNumber(dashboard?.openFraudAlerts),
      note: 'risk incidents still unresolved',
      icon: AlertTriangle,
      tone: 'rose',
      valueType: 'number',
    },
    {
      title: 'Interest Paid This Month',
      value: asNumber(monthlyReport?.totalInterestPaid),
      note: monthlyReport?.month ? `current cycle ${monthlyReport.month}` : 'current monthly report',
      icon: Wallet,
      tone: 'blue',
      valueType: 'currency',
      compact: true,
    },
  ]), [dashboard, monthlyReport]);

  const monthlyInvestmentData = useMemo(
    () => buildMonthlySeries(investments, (item) => item.investmentAmount, (item) => item.appliedAt),
    [investments],
  );

  const investmentStatusData = useMemo(() => {
    const counts = investments.reduce((acc, item) => {
      const key = item.status || 'UNKNOWN';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts).map(([name, value], index) => ({
      name: prettifyEnum(name),
      value,
      fill: investmentPalette[index % investmentPalette.length],
    }));
  }, [investments]);

  const totalInvestmentRecords = investmentStatusData.reduce((sum, item) => sum + item.value, 0);

  const operationalCards = useMemo(() => ([
    {
      title: 'New Investments',
      value: asNumber(monthlyReport?.newInvestments),
      note: 'applications raised in the current month',
    },
    {
      title: 'Interest Records',
      value: asNumber(monthlyReport?.interestRecords),
      note: 'interest calculations completed this month',
    },
    {
      title: 'Referral Commissions',
      value: asNumber(monthlyReport?.totalReferralCommissions),
      note: 'monthly commission payout generated',
      currency: true,
    },
    {
      title: 'Processed Withdrawals',
      value: asNumber(monthlyReport?.processedWithdrawals),
      note: 'withdrawals completed platform-wide',
    },
  ]), [monthlyReport]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">
            Anusha Trade
          </p>
          <h1 className="section-title mt-3">Main Dashboard</h1>
          <p className="section-copy mt-3 max-w-3xl">
            Live operating view across onboarding, investment activation, withdrawal queues, and
            fraud exposure using the backend admin APIs.
          </p>
        </div>

        <Button
          type="button"
          variant="outlined"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon fontSize="small" />}
          onClick={loadDashboard}
          disabled={loading}
          sx={{ alignSelf: { xs: 'flex-start', xl: 'center' }, borderRadius: '16px' }}
        >
          {loading ? 'Refreshing...' : 'Refresh Dashboard'}
        </Button>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {primaryStats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.8fr)]">
        <SectionCard
          title="Investment Flow"
          subtitle="Month-by-month investment applications based on live applied dates."
        >
          <div className="h-[340px]">
            {loading ? (
              <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                <CircularProgress />
              </Stack>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyInvestmentData}>
                  <defs>
                    <linearGradient id="dashboardInvestments" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.48} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                  <XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#64748b"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatShortTick}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), 'Applied amount']}
                    contentStyle={{
                      background: 'rgba(7, 17, 38, 0.95)',
                      border: '1px solid rgba(148, 163, 184, 0.18)',
                      borderRadius: '18px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#dashboardInvestments)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Investment Status Mix"
          subtitle="Current portfolio distribution by backend investment status."
        >
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_180px] xl:grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_180px]">
            <div className="relative mx-auto h-[280px] w-full max-w-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={investmentStatusData}
                    innerRadius={78}
                    outerRadius={112}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {investmentStatusData.map((item) => (
                      <Cell key={item.name} fill={item.fill} />
                    ))}
                  </Pie>
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
                  {formatNumber(totalInvestmentRecords)}
                </span>
                <span className="text-sm text-slate-400">Total records</span>
              </div>
            </div>

            <div className="space-y-3">
              {investmentStatusData.length > 0 ? investmentStatusData.map((item) => (
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
              )) : (
                <Typography variant="body2" color="text.secondary">
                  No investment records are available yet.
                </Typography>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {secondaryStats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <SectionCard
        title="Current Month Snapshot"
        subtitle="Operational output from the live monthly report endpoint."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {operationalCards.map((card) => (
            <div key={card.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-slate-400">{card.title}</p>
              <p className="mt-3 font-heading text-2xl font-semibold text-white">
                {card.currency ? formatCompactCurrency(card.value) : formatNumber(card.value)}
              </p>
              <p className="mt-2 text-sm text-slate-400">{card.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5 text-sm leading-7 text-blue-100">
          {monthlyReport?.month
            ? `Current reporting month: ${monthlyReport.month}. This panel is sourced from /api/admin/reports/monthly and updates as backend operations are processed.`
            : 'Monthly report data is unavailable right now, but the rest of the dashboard remains live.'}
        </div>
      </SectionCard>
    </div>
  );
}

export default DashboardPage;
