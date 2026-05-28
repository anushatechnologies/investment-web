import { Banknote, CircleDollarSign, Percent, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, CircularProgress, Stack } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import {
  adminGetAllInvestments,
  adminGetAuditLogs,
  adminGetMonthlyReport,
} from '../services/api';
import { asNumber, buildMonthlySeries, formatDateTime, prettifyEnum, toArray } from '../utils/adminTransforms';
import { formatCompactCurrency, formatCurrency, formatShortTick } from '../utils/formatters';

const statIcons = [Banknote, Percent, CircleDollarSign, TrendingUp];
const statTones = ['blue', 'emerald', 'violet', 'amber'];

function RevenuePage() {
  const [report, setReport] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRevenue = async () => {
    setLoading(true);
    setError('');
    try {
      const [reportRes, investmentsRes, auditRes] = await Promise.all([
        adminGetMonthlyReport(),
        adminGetAllInvestments().catch(() => []),
        adminGetAuditLogs().catch(() => []),
      ]);

      setReport(reportRes || {});
      setInvestments(toArray(investmentsRes));
      setAuditLogs(toArray(auditRes));
    } catch (err) {
      console.error('Failed to load revenue data', err);
      setError(err.message || 'Failed to load revenue data.');
      setReport(null);
      setInvestments([]);
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRevenue();
  }, []);

  const capitalSeries = useMemo(
    () => buildMonthlySeries(investments, (item) => item.investmentAmount, (item) => item.appliedAt),
    [investments],
  );

  const revenueBarData = useMemo(
    () => capitalSeries.map((item) => ({ label: item.label, amount: item.value })),
    [capitalSeries],
  );

  const revenueSourceData = useMemo(() => {
    const sources = [
      {
        name: 'Interest Paid',
        value: asNumber(report?.totalInterestPaid),
        fill: '#2563eb',
      },
      {
        name: 'Referral Commissions',
        value: asNumber(report?.totalReferralCommissions),
        fill: '#14b8a6',
      },
      {
        name: 'Processed Withdrawals',
        value: asNumber(report?.processedWithdrawals),
        fill: '#f59e0b',
      },
      {
        name: 'New Investments',
        value: asNumber(report?.newInvestments),
        fill: '#7c3aed',
      },
    ];

    return sources.filter((item) => item.value > 0);
  }, [report]);

  const totalRevenue = revenueSourceData.reduce((sum, item) => sum + item.value, 0);

  const stats = useMemo(() => ([
    {
      title: 'Interest Paid',
      value: asNumber(report?.totalInterestPaid),
      note: report?.month ? `reported in ${report.month}` : 'monthly report endpoint',
      compact: true,
    },
    {
      title: 'Referral Commissions',
      value: asNumber(report?.totalReferralCommissions),
      note: 'current month commission payout',
      compact: true,
    },
    {
      title: 'Committed Capital',
      value: investments.reduce((sum, item) => sum + asNumber(item.investmentAmount), 0),
      note: 'sum of all investment amounts',
      compact: true,
    },
    {
      title: 'New Investments',
      value: asNumber(report?.newInvestments),
      note: 'investment records added this month',
      compact: false,
    },
  ]), [investments, report]);

  const transactionRows = useMemo(() => {
    const financeActions = new Set([
      'INVESTMENT_ACTIVATED',
      'INVESTMENT_RECEIPT_VERIFIED',
      'WITHDRAWAL_APPROVED',
      'WITHDRAWAL_PROCESSED',
      'INTEREST_TRIGGERED',
    ]);

    return auditLogs
      .filter((item) => financeActions.has(item.action))
      .slice(0, 25)
      .map((item) => ({
        id: item.id,
        date: formatDateTime(item.occurredAt),
        type: prettifyEnum(item.action),
        description: `${item.entityType || 'Entity'} ${item.entityId || ''}`.trim(),
        amount: 0,
        status: item.newValue || 'COMPLETED',
      }));
  }, [auditLogs]);

  const transactionColumns = [
    { key: 'date', label: 'Date' },
    { key: 'type', label: 'Type' },
    { key: 'description', label: 'Description' },
    {
      key: 'amount',
      label: 'Amount',
      render: () => 'Operational event',
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge label={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">
            Revenue intelligence
          </p>
          <h1 className="section-title mt-3">Revenue</h1>
          <p className="section-copy mt-3 max-w-3xl">
            Live cashflow and payout visibility built from the monthly report, investment book, and
            finance-related audit events.
          </p>
        </div>

        <Button
          type="button"
          variant="outlined"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon fontSize="small" />}
          onClick={loadRevenue}
          disabled={loading}
          sx={{ alignSelf: { xs: 'flex-start', xl: 'center' }, borderRadius: '16px' }}
        >
          {loading ? 'Refreshing...' : 'Refresh Revenue'}
        </Button>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            note={stat.note}
            icon={statIcons[index]}
            tone={statTones[index]}
            valueType={index === 3 ? 'number' : 'currency'}
            compact={stat.compact}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <SectionCard title="Capital Trend" subtitle="Recent monthly investment application volume across the platform.">
          <div className="h-[320px]">
            {loading ? (
              <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                <CircularProgress />
              </Stack>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueBarData}>
                  <XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#64748b"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatShortTick}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), 'Committed capital']}
                    contentStyle={{
                      background: 'rgba(7, 17, 38, 0.95)',
                      border: '1px solid rgba(148, 163, 184, 0.18)',
                      borderRadius: '18px',
                    }}
                  />
                  <Bar dataKey="amount" radius={[14, 14, 0, 0]}>
                    {revenueBarData.map((entry, index) => (
                      <Cell
                        key={entry.label}
                        fill={index % 2 === 0 ? 'rgba(59,130,246,0.95)' : 'rgba(37,99,235,0.72)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </SectionCard>

        <SectionCard title="Monthly Flow Mix" subtitle="Current report contributions across payouts and activity counts.">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_180px] xl:grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_180px]">
            <div className="relative mx-auto h-[280px] w-full max-w-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueSourceData}
                    dataKey="value"
                    innerRadius={78}
                    outerRadius={112}
                    paddingAngle={3}
                  >
                    {revenueSourceData.map((item) => (
                      <Cell key={item.name} fill={item.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [formatCompactCurrency(value), name]}
                    contentStyle={{
                      background: 'rgba(7, 17, 38, 0.95)',
                      border: '1px solid rgba(148, 163, 184, 0.18)',
                      borderRadius: '18px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading text-3xl font-semibold text-white">
                  {formatCompactCurrency(totalRevenue)}
                </span>
                <span className="text-sm text-slate-400">Monthly mix total</span>
              </div>
            </div>

            <div className="space-y-3">
              {revenueSourceData.length > 0 ? revenueSourceData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-sm font-medium text-slate-200">{item.name}</span>
                  </div>
                  <span className="text-sm text-slate-400">
                    {totalRevenue > 0 ? `${Math.round((item.value / totalRevenue) * 100)}%` : '0%'}
                  </span>
                </div>
              )) : (
                <Alert severity="info">Monthly report values are currently zero, so the mix chart is empty.</Alert>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      <DataTable
        title="Finance Audit Events"
        description="Recent backend audit entries related to investment activation, interest runs, and withdrawals."
        data={transactionRows}
        columns={transactionColumns}
        searchableKeys={['type', 'description', 'date']}
        searchPlaceholder="Search by event type, description, or date..."
        filterKey="status"
        filterOptions={Array.from(new Set(transactionRows.map((row) => row.status))).sort()}
        emptyMessage={loading ? 'Loading finance events...' : 'No finance-related audit events found.'}
      />
    </div>
  );
}

export default RevenuePage;
