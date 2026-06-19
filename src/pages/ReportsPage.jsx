import { AlertTriangle, Download, FileText, TrendingUp, RefreshCw, CheckCircle, CalendarClock, DollarSign, Wallet, PlusCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, CircularProgress, Stack, useTheme } from '@mui/material';
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
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
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
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 mb-4">
            <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-400">
              System Exports
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white font-heading">
            Reports <span className="text-indigo-600 dark:text-indigo-400">Center</span>
          </h1>
          <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-2xl text-lg">
            Live monthly reporting plus audit evidence from backend operations. Export actions are browser-side.
          </p>
        </div>

        <button
          type="button"
          onClick={loadReports}
          disabled={loading}
          className="group relative flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-white px-6 py-3.5 font-bold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-slate-50 hover:shadow-md disabled:opacity-60 dark:bg-[#121b2f] dark:text-slate-200 dark:ring-white/10 dark:hover:bg-[#162138]"
        >
          {loading ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            <RefreshCw className="h-5 w-5 text-indigo-600 transition-transform duration-500 group-hover:rotate-180 dark:text-indigo-400" />
          )}
          <span className="relative z-10">{loading ? 'Refreshing Data...' : 'Refresh Reports'}</span>
        </button>
      </div>

      {error && (
        <div className="animate-in fade-in slide-in-from-top-4 flex items-start gap-3 rounded-2xl border p-4 shadow-lg border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-200">
          <div className="mt-0.5 rounded-full p-1 bg-rose-500/20">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-sm font-medium leading-relaxed">{error}</p>
        </div>
      )}
      
      {message && (
        <div className="animate-in fade-in slide-in-from-top-4 flex items-start gap-3 rounded-2xl border p-4 shadow-lg border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">
          <div className="mt-0.5 rounded-full p-1 bg-emerald-500/20">
            <CheckCircle className="w-4 h-4" />
          </div>
          <p className="text-sm font-medium leading-relaxed">{message}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
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
          <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
            <button type="button" onClick={handleExportCSV} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-slate-700 bg-white ring-1 ring-inset ring-slate-200 hover:bg-slate-50 hover:shadow-md transition-all dark:bg-[#121b2f] dark:text-slate-200 dark:ring-white/10 dark:hover:bg-[#162138]">
              <Download className="h-4 w-4 text-indigo-500" />
              Export CSV
            </button>
            <button type="button" onClick={handleGeneratePDF} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all hover:-translate-y-0.5">
              <FileText className="h-4 w-4" />
              Generate PDF
            </button>
          </div>
        )}
      >
        <div className="h-[340px] rounded-2xl bg-slate-50/50 dark:bg-[#0b1120]/50 border border-slate-100 dark:border-white/5 p-4">
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
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                />
                <Line
                  type="monotone"
                  dataKey="investments"
                  stroke="#f7b500"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#f7b500', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#f7b500', strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Current Monthly Report"
        subtitle="Raw values returned by the backend report endpoint."
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Card 1: Month */}
          <div className="group rounded-3xl bg-slate-50/50 p-6 border border-slate-200/60 dark:border-white/5 transition-all hover:bg-white dark:hover:bg-[#162138]/80 hover:shadow-lg dark:hover:ring-1 dark:hover:ring-indigo-500/30">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Reporting Month</p>
              <div className="bg-blue-100 dark:bg-blue-500/20 p-2.5 rounded-xl text-blue-600 dark:text-blue-400">
                <CalendarClock className="h-5 w-5" />
              </div>
            </div>
            <p className="font-heading text-3xl font-black text-slate-900 dark:text-white">{report?.month || 'N/A'}</p>
          </div>
          
          {/* Card 2: Interest Records */}
          <div className="group rounded-3xl bg-slate-50/50 p-6 border border-slate-200/60 dark:border-white/5 transition-all hover:bg-white dark:hover:bg-[#162138]/80 hover:shadow-lg dark:hover:ring-1 dark:hover:ring-indigo-500/30">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Interest Calculations</p>
              <div className="bg-amber-100 dark:bg-amber-500/20 p-2.5 rounded-xl text-amber-600 dark:amber-400">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <p className="font-heading text-3xl font-black text-slate-900 dark:text-white">{asNumber(report?.interestRecords)}</p>
          </div>

          {/* Card 3: Total Interest Paid */}
          <div className="group rounded-3xl bg-slate-50/50 p-6 border border-slate-200/60 dark:border-white/5 transition-all hover:bg-white dark:hover:bg-[#162138]/80 hover:shadow-lg dark:hover:ring-1 dark:hover:ring-indigo-500/30">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Interest Paid</p>
              <div className="bg-emerald-100 dark:bg-emerald-500/20 p-2.5 rounded-xl text-emerald-600 dark:text-emerald-400">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <p className="font-heading text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(asNumber(report?.totalInterestPaid))}
            </p>
          </div>

          {/* Card 4: Referral Commissions */}
          <div className="group rounded-3xl bg-slate-50/50 p-6 border border-slate-200/60 dark:border-white/5 transition-all hover:bg-white dark:hover:bg-[#162138]/80 hover:shadow-lg dark:hover:ring-1 dark:hover:ring-indigo-500/30">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Referral Commissions</p>
              <div className="bg-violet-100 dark:bg-violet-500/20 p-2.5 rounded-xl text-violet-600 dark:text-violet-400">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="font-heading text-3xl font-black text-violet-600 dark:text-violet-400">
              {formatCurrency(asNumber(report?.totalReferralCommissions))}
            </p>
          </div>

          {/* Card 5: New Investments */}
          <div className="group rounded-3xl bg-slate-50/50 p-6 border border-slate-200/60 dark:border-white/5 transition-all hover:bg-white dark:hover:bg-[#162138]/80 hover:shadow-lg dark:hover:ring-1 dark:hover:ring-indigo-500/30">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">New Investments</p>
              <div className="bg-sky-100 dark:bg-sky-500/20 p-2.5 rounded-xl text-sky-600 dark:text-sky-400">
                <PlusCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="font-heading text-3xl font-black text-slate-900 dark:text-white">{asNumber(report?.newInvestments)}</p>
          </div>

          {/* Card 6: Processed Withdrawals */}
          <div className="group rounded-3xl bg-slate-50/50 p-6 border border-slate-200/60 dark:border-white/5 transition-all hover:bg-white dark:hover:bg-[#162138]/80 hover:shadow-lg dark:hover:ring-1 dark:hover:ring-indigo-500/30">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Processed Withdrawals</p>
              <div className="bg-rose-100 dark:bg-rose-500/20 p-2.5 rounded-xl text-rose-600 dark:text-rose-400">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <p className="font-heading text-3xl font-black text-slate-900 dark:text-white">{asNumber(report?.processedWithdrawals)}</p>
          </div>
        </div>
      </SectionCard>

      <div className="mt-8 rounded-3xl overflow-hidden shadow-sm border border-slate-200/60 dark:border-white/5 bg-white dark:bg-[#121b2f]">
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
    </div>
  );
}

export default ReportsPage;
