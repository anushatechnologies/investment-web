import { AlertTriangle, Download, FileText, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, CircularProgress, Stack } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  CartesianGrid,
  Line,
  LineChart,
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
import {
  asNumber,
  buildMonthlySeries,
  formatDateTime,
  prettifyEnum,
  toArray,
} from '../utils/adminTransforms';
import { formatCompactCurrency, formatCurrency, formatShortTick } from '../utils/formatters';

const statIcons = [FileText, Download, AlertTriangle, TrendingUp];
const statTones = ['blue', 'emerald', 'violet', 'amber'];

function ReportsPage() {
  const [report, setReport] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadReports = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const [reportRes, auditRes, investmentsRes] = await Promise.all([
        adminGetMonthlyReport(),
        adminGetAuditLogs().catch(() => []),
        adminGetAllInvestments().catch(() => []),
      ]);

      setReport(reportRes || {});
      setAuditLogs(toArray(auditRes));
      setInvestments(toArray(investmentsRes));
    } catch (err) {
      console.error('Failed to load reports page data', err);
      setError(err.message || 'Failed to load reports data.');
      setReport(null);
      setAuditLogs([]);
      setInvestments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const performanceData = useMemo(() => {
    const investmentSeries = buildMonthlySeries(investments, (item) => item.investmentAmount, (item) => item.appliedAt);
    return investmentSeries.map((item) => ({
      month: item.label,
      investments: item.value,
      revenue: item.value,
    }));
  }, [investments]);

  const reportStats = useMemo(() => ([
    {
      title: 'Monthly Reports',
      value: report?.month ? 1 : 0,
      note: report?.month ? `backend report available for ${report.month}` : 'monthly report unavailable',
      valueType: 'number',
    },
    {
      title: 'Audit Events',
      value: auditLogs.length,
      note: 'events returned from admin audit logs',
      valueType: 'number',
    },
    {
      title: 'Processed Withdrawals',
      value: asNumber(report?.processedWithdrawals),
      note: 'included in current monthly report',
      valueType: 'number',
    },
    {
      title: 'Interest Paid',
      value: asNumber(report?.totalInterestPaid),
      note: 'current monthly report payout total',
      valueType: 'currency',
      compact: true,
    },
  ]), [auditLogs.length, report]);

  const auditRows = useMemo(
    () => auditLogs.slice(0, 50).map((item) => ({
      id: item.id,
      event: prettifyEnum(item.action),
      owner: item.actorUserId || 'System',
      date: formatDateTime(item.occurredAt),
      channel: item.entityType || 'N/A',
      status: item.newValue || 'COMPLETED',
    })),
    [auditLogs],
  );

  const handleExportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Month', report?.month || 'N/A'],
      ['Interest Records', asNumber(report?.interestRecords)],
      ['Total Interest Paid', asNumber(report?.totalInterestPaid)],
      ['Total Referral Commissions', asNumber(report?.totalReferralCommissions)],
      ['New Investments', asNumber(report?.newInvestments)],
      ['Processed Withdrawals', asNumber(report?.processedWithdrawals)],
    ];
    const csvContent = `data:text/csv;charset=utf-8,${rows.map((row) => row.join(',')).join('\n')}`;
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `monthly_report_${report?.month || 'snapshot'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setMessage('Exported the live monthly report snapshot as CSV.');
  };

  const handleGeneratePDF = () => {
    window.print();
    setMessage('Opened the browser print dialog for PDF export.');
  };

  const auditColumns = [
    { key: 'event', label: 'Event' },
    { key: 'owner', label: 'Owner' },
    { key: 'date', label: 'Date' },
    { key: 'channel', label: 'Channel' },
    {
      key: 'status',
      label: 'Status',
      exportValue: (row) => row.status,
      render: (row) => <StatusBadge label={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">
            Reporting and audit exports
          </p>
          <h1 className="section-title mt-3">Reports</h1>
          <p className="section-copy mt-3 max-w-3xl">
            Live monthly reporting plus audit evidence from backend operations. Export actions are
            browser-side, but the underlying values come from the admin APIs.
          </p>
        </div>

        <Button
          type="button"
          variant="outlined"
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon fontSize="small" />}
          onClick={loadReports}
          disabled={loading}
          sx={{ alignSelf: { xs: 'flex-start', xl: 'center' }, borderRadius: '16px' }}
        >
          {loading ? 'Refreshing...' : 'Refresh Reports'}
        </Button>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {reportStats.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            note={stat.note}
            icon={statIcons[index]}
            tone={statTones[index]}
            valueType={stat.valueType}
            compact={stat.compact}
          />
        ))}
      </div>

      <SectionCard
        title="Performance Snapshot"
        subtitle="Recent monthly capital trend, paired with live monthly report export actions."
        action={(
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={handleExportCSV} className="btn-secondary">
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button type="button" onClick={handleGeneratePDF} className="btn-primary">
              <FileText className="h-4 w-4" />
              Generate PDF
            </button>
          </div>
        )}
      >
        <div className="h-[340px]">
          {loading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
              <CircularProgress />
            </Stack>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatShortTick}
                />
                <Tooltip
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(value) : formatCompactCurrency(value),
                    name === 'revenue' ? 'Capital trend' : 'Invested amount',
                  ]}
                  contentStyle={{
                    background: 'rgba(7, 17, 38, 0.95)',
                    border: '1px solid rgba(148, 163, 184, 0.18)',
                    borderRadius: '18px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#3b82f6' }}
                />
                <Line
                  type="monotone"
                  dataKey="investments"
                  stroke="#f7b500"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#f7b500' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </SectionCard>

      {message && <p className="text-sm font-medium text-emerald-400">{message}</p>}

      <SectionCard
        title="Current Monthly Report"
        subtitle="Raw values returned by the backend report endpoint."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Month</p>
            <p className="mt-3 font-heading text-xl font-semibold text-white">{report?.month || 'N/A'}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Interest Records</p>
            <p className="mt-3 font-heading text-xl font-semibold text-white">{asNumber(report?.interestRecords)}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Referral Commissions</p>
            <p className="mt-3 font-heading text-xl font-semibold text-white">
              {formatCurrency(asNumber(report?.totalReferralCommissions))}
            </p>
          </div>
        </div>
      </SectionCard>

      <DataTable
        title="Audit Trail"
        description="Recent backend audit events across admin workflows."
        data={auditRows}
        columns={auditColumns}
        searchableKeys={['event', 'owner', 'channel']}
        searchPlaceholder="Search audit events..."
        filterKey="status"
        filterOptions={Array.from(new Set(auditRows.map((row) => row.status))).sort()}
        emptyMessage={loading ? 'Loading audit trail...' : 'No audit events found.'}
        itemsPerPage={20}
        enableCsvExport
        exportFileName="audit-trail"
      />
    </div>
  );
}

export default ReportsPage;
