import { AlertTriangle, BriefcaseBusiness, ShieldCheck, Users, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
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
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
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
    <div className="admin-dashboard-page space-y-6">
      <div className="admin-dashboard-hero flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">
            Live operations cockpit
          </p>
          <h1 className="section-title mt-3">Command Dashboard</h1>
          <p className="section-copy mt-3 max-w-3xl">
            Live operating view across onboarding, investment activation, withdrawal queues, and
            fraud exposure using the backend admin APIs.
          </p>
        </div>

        <div className="admin-dashboard-hero-panel">
          <div>
            <span className="admin-dashboard-hero-label">Capital under watch</span>
            <strong>{formatCompactCurrency(asNumber(dashboard?.totalAum))}</strong>
          </div>
          <Button
            type="button"
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon fontSize="small" />}
            onClick={loadDashboard}
            disabled={loading}
            sx={{ borderRadius: '16px', whiteSpace: 'nowrap' }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
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
                      <stop offset="0%" stopColor={isDark ? '#818cf8' : '#4f46e5'} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={isDark ? '#818cf8' : '#4f46e5'} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(148, 163, 184, 0.12)'} vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    stroke={isDark ? '#94a3b8' : '#64748b'} 
                    tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis
                    stroke={isDark ? '#94a3b8' : '#64748b'}
                    tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatShortTick}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), 'Applied amount']}
                    contentStyle={{
                      background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
                      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(148, 163, 184, 0.18)'}`,
                      borderRadius: '16px',
                      boxShadow: isDark ? '0 12px 30px rgba(0,0,0,0.3)' : '0 12px 30px rgba(37,99,235,0.06)',
                    }}
                    itemStyle={{
                      color: isDark ? '#f8fafc' : '#0f172a',
                    }}
                    labelStyle={{
                      color: isDark ? '#94a3b8' : '#64748b',
                      fontWeight: 600,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={isDark ? '#818cf8' : '#4f46e5'}
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
                      background: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
                      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(148, 163, 184, 0.18)'}`,
                      borderRadius: '16px',
                      boxShadow: isDark ? '0 12px 30px rgba(0,0,0,0.3)' : '0 12px 30px rgba(37,99,235,0.06)',
                    }}
                    itemStyle={{
                      color: isDark ? '#f8fafc' : '#0f172a',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading text-4xl font-semibold text-slate-900 dark:text-white">
                  {formatNumber(totalInvestmentRecords)}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">Total records</span>
              </div>
            </div>

            <div className="space-y-3">
              {investmentStatusData.length > 0 ? investmentStatusData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-2xl border border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.name}</span>
                  </div>
                  <span className="text-sm text-slate-600 dark:text-slate-400">{formatNumber(item.value)}</span>
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
            <div key={card.title} className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] p-5 hover:translate-y-[-2px] transition-all duration-200">
              <p className="text-sm text-slate-500 dark:text-slate-400">{card.title}</p>
              <p className="mt-3 font-heading text-2xl font-semibold text-slate-900 dark:text-white">
                {card.currency ? formatCompactCurrency(card.value) : formatNumber(card.value)}
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{card.note}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-blue-500/10 dark:border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 p-5 text-sm leading-7 text-blue-700 dark:text-blue-100">
          {monthlyReport?.month
            ? `Current reporting month: ${monthlyReport.month}. This panel is sourced from /api/admin/reports/monthly and updates as backend operations are processed.`
            : 'Monthly report data is unavailable right now, but the rest of the dashboard remains live.'}
        </div>
      </SectionCard>
    </div>
  );
}

export default DashboardPage;
