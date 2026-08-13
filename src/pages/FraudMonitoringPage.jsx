import { AlertTriangle, Eye, ShieldCheck, Users, Wallet, XCircle, RefreshCw, Shield, FileWarning, CheckCircle2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import {
  adminGetFraudAlerts,
  adminGetFraudRules,
  adminGetUsers,
  adminResolveFraudAlert,
  adminSuspendUser,
} from '../services/api';
import { formatDateTime, prettifyEnum, toArray } from '../utils/adminTransforms';

const statIcons = [Users, Wallet, ShieldCheck, Eye];
const statTones = ['rose', 'amber', 'cyan', 'blue'];

function FraudMonitoringPage() {
  const [activities, setActivities] = useState([]);
  const [ruleSignals, setRuleSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [viewedActivity, setViewedActivity] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const loadFraudData = async () => {
    setLoading(true);
    setError('');
    try {
      const [alertsRes, usersRes, rulesRes] = await Promise.all([
        adminGetFraudAlerts(),
        adminGetUsers().catch(() => []),
        adminGetFraudRules().catch(() => ({})),
      ]);

      const alerts = toArray(alertsRes);
      const users = toArray(usersRes);
      const userMap = new Map(users.map((user) => [user.id, user]));

      const mapped = alerts.map((alert) => {
        const user = userMap.get(alert.userId);
        return {
          id: alert.id,
          userId: alert.userId,
          userName: user?.fullName || user?.name || 'Unknown User',
          userEmail: user?.email || 'N/A',
          activityType: prettifyEnum(alert.ruleTriggered),
          reason: alert.description || 'N/A',
          riskLevel: alert.alertLevel || 'UNKNOWN',
          status: alert.status || 'OPEN',
          date: formatDateTime(alert.createdAt),
          reviewedAt: formatDateTime(alert.reviewedAt),
          reviewedBy: alert.reviewedBy || 'N/A',
          resolutionNotes: alert.resolutionNotes || '',
        };
      });

      setActivities(mapped);
      setRuleSignals([
        ...toArray(rulesRes.duplicatePan),
        ...toArray(rulesRes.duplicateAadhaarLast4),
        ...toArray(rulesRes.duplicateBankAccounts),
        ...toArray(rulesRes.highVelocityReferrers),
      ].map((item, index) => ({
        id: `${item.rule || 'signal'}-${index}`,
        rule: item.rule,
        severity: item.severity,
        count: item.count,
        value: item.value || item.name || '-',
      })));
    } catch (err) {
      console.error('Failed to load fraud alerts', err);
      setError(err.message || 'Failed to load fraud alerts.');
      setActivities([]);
      setRuleSignals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFraudData();
  }, []);

  const fraudStats = useMemo(() => {
    const open = activities.filter((item) => item.status === 'OPEN').length;
    const high = activities.filter((item) => item.riskLevel === 'HIGH').length;
    const resolved = activities.filter((item) => item.status === 'RESOLVED').length;
    const reviewed = activities.filter((item) => item.reviewedBy !== 'N/A').length;

    return [
      { title: 'Open Alerts', value: open, note: 'alerts currently needing action' },
      { title: 'High Risk', value: high, note: 'high-severity rules triggered' },
      { title: 'Resolved Alerts', value: resolved, note: 'alerts closed by admin review' },
      { title: 'Reviewed Cases', value: reviewed, note: 'alerts already touched by admin' },
    ];
  }, [activities]);

  const handleResolve = async (row, status) => {
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      await adminResolveFraudAlert(row.id, resolutionNotes || `Marked as ${status.toLowerCase()} by admin`, status);
      setMessage(`Updated fraud alert ${row.id} to ${status}.`);
      setResolutionNotes('');
      setViewedActivity(null);
      await loadFraudData();
    } catch (err) {
      console.error('Failed to resolve fraud alert', err);
      setError(err.message || 'Failed to resolve fraud alert.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (row) => {
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      await adminSuspendUser(row.userId, resolutionNotes || `Suspended during review of alert ${row.id}`);
      if (row.status === 'OPEN') {
        await adminResolveFraudAlert(row.id, resolutionNotes || 'User suspended by admin', 'UNDER_REVIEW');
      }
      setMessage(`Suspended user ${row.userName} and moved alert ${row.id} into review.`);
      setResolutionNotes('');
      setViewedActivity(null);
      await loadFraudData();
    } catch (err) {
      console.error('Failed to suspend user from fraud screen', err);
      setError(err.message || 'Failed to suspend user.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'userName', label: 'User Name' },
    { key: 'activityType', label: 'Activity Type' },
    { key: 'reason', label: 'Reason' },
    {
      key: 'riskLevel',
      label: 'Risk Level',
      render: (row) => <StatusBadge label={row.riskLevel} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge label={row.status} />,
    },
    { key: 'date', label: 'Date' },
    {
      key: 'action',
      label: 'Action',
      render: (row) => (
        <button
          type="button"
          onClick={() => setViewedActivity(row)}
          className={`rounded-xl px-4 py-2 text-xs font-bold tracking-wide transition-all duration-200 ${
            viewedActivity?.id === row.id
              ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/30 ring-2 ring-rose-400/30'
              : 'bg-gradient-to-r from-slate-600 to-slate-700 dark:from-white/[0.06] dark:to-white/[0.04] text-white dark:text-slate-200 border border-slate-500/20 dark:border-white/10 hover:from-blue-500 hover:to-indigo-600 hover:border-transparent hover:shadow-md hover:shadow-blue-500/20'
          }`}
        >
          {viewedActivity?.id === row.id ? '● Active' : 'View'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">
            Risk and fraud defense
          </p>
          <h1 className="section-title mt-3">Fraud Monitoring</h1>
          <p className="section-copy mt-3 max-w-3xl">
            Live fraud-alert queue covering suspicious withdrawals, receipt mismatches, and account
            lifecycle incidents detected by backend rules.
          </p>
        </div>

        <button
          type="button"
          onClick={loadFraudData}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start xl:self-center rounded-xl border border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-rose-500/30 hover:bg-rose-500/5 hover:text-rose-600 dark:hover:text-rose-400 transition-all duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh Alerts'}
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start justify-between gap-4 rounded-2xl border border-rose-500/30 bg-rose-500/[0.08] px-5 py-4 shadow-lg shadow-rose-500/5">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-rose-500/20 mt-0.5">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-700 dark:text-rose-300">Error</p>
              <p className="text-sm text-rose-600/80 dark:text-rose-400/80 mt-0.5">{error}</p>
            </div>
          </div>
          <button onClick={() => setError('')} className="rounded-lg p-1.5 text-rose-500 transition hover:bg-rose-500/20 flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Success Alert */}
      {message && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.08] px-5 py-3.5 shadow-lg shadow-emerald-500/5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="rounded-lg p-1.5 text-emerald-500 transition hover:bg-emerald-500/20 flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {fraudStats.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            note={stat.note}
            icon={statIcons[index]}
            tone={statTones[index]}
            valueType="number"
          />
        ))}
      </div>

      {/* Suspicious Activities Table */}
      <DataTable
        title="Suspicious Activities"
        description="Backend fraud alerts with live resolve and suspend actions."
        data={activities}
        columns={columns}
        searchableKeys={['id', 'userName', 'activityType', 'reason']}
        searchPlaceholder="Search by user, reason, or activity type..."
        filterKey="riskLevel"
        filterOptions={Array.from(new Set(activities.map((item) => item.riskLevel))).sort()}
        itemsPerPage={20}
        emptyMessage={loading ? 'Loading fraud alerts...' : 'No fraud alerts found.'}
      />

      {/* Fraud Rule Signals Table */}
      <DataTable
        title="Automated Fraud Rule Signals"
        description="Duplicate PAN, Aadhaar last 4, bank account, and high referral velocity checks."
        data={ruleSignals}
        columns={[
          { key: 'rule', label: 'Rule' },
          { key: 'severity', label: 'Severity', render: (row) => <StatusBadge label={row.severity} /> },
          { key: 'count', label: 'Count' },
          { key: 'value', label: 'Masked Value / User' },
        ]}
        searchableKeys={['rule', 'severity', 'value']}
        filterKey="severity"
        filterOptions={['MEDIUM', 'HIGH']}
        emptyMessage={loading ? 'Loading rule signals...' : 'No automated fraud rule signals found.'}
      />

      {/* Incident Detail Modal — replaces MUI Dialog */}
      {Boolean(viewedActivity) && (
        <div className="fixed inset-0 z-[1600] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200/60 dark:border-white/[0.08] bg-white dark:bg-[#071226] shadow-[0_32px_90px_rgba(0,0,0,0.2)] dark:shadow-[0_32px_90px_rgba(0,0,0,0.6)]">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.08] bg-gradient-to-r from-rose-500/5 to-transparent px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <Shield className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Incident Details</h3>
                  <p className="text-[11px] text-slate-400">Alert #{viewedActivity.id}</p>
                </div>
              </div>
              <button
                onClick={() => setViewedActivity(null)}
                className="rounded-xl border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-white/[0.04] p-2 text-slate-400 transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {viewedActivity && (
                <>
                  {/* User Info */}
                  <div className="rounded-2xl border border-slate-200/60 dark:border-white/[0.07] bg-slate-50/60 dark:bg-white/[0.025] p-4 space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Investor</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{viewedActivity.userName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{viewedActivity.userEmail}</p>
                  </div>

                  {/* Activity + Reason */}
                  <div className="grid grid-cols-1 gap-3">
                    <div className="rounded-xl border border-slate-200/60 dark:border-white/[0.07] bg-slate-50/40 dark:bg-white/[0.02] p-3.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Activity Type</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{viewedActivity.activityType}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200/60 dark:border-white/[0.07] bg-slate-50/40 dark:bg-white/[0.02] p-3.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Reason</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{viewedActivity.reason}</p>
                    </div>
                  </div>

                  {/* Meta grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Risk Level', content: <StatusBadge label={viewedActivity.riskLevel} /> },
                      { label: 'Status', content: <StatusBadge label={viewedActivity.status} /> },
                      { label: 'Created At', content: <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{viewedActivity.date}</span> },
                      { label: 'Reviewed At', content: <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{viewedActivity.reviewedAt}</span> },
                    ].map(({ label, content }) => (
                      <div key={label} className="rounded-xl border border-slate-200/60 dark:border-white/[0.07] bg-slate-50/40 dark:bg-white/[0.02] p-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">{label}</p>
                        {content}
                      </div>
                    ))}
                  </div>

                  {/* Existing resolution notes */}
                  {viewedActivity.resolutionNotes && (
                    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1">Previous Resolution</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{viewedActivity.resolutionNotes}</p>
                    </div>
                  )}

                  {/* Resolution Notes textarea */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                      Resolution Notes
                    </label>
                    <textarea
                      value={resolutionNotes}
                      onChange={(event) => setResolutionNotes(event.target.value)}
                      placeholder="Add internal notes for resolve or suspend actions"
                      rows={3}
                      className="w-full resize-none rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] p-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition duration-200 focus:outline-none focus:ring-2 focus:ring-rose-500/25 focus:border-rose-500/40"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-200/60 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.02] px-6 py-4">
              <button
                onClick={() => setViewedActivity(null)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white dark:bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.07] transition"
              >
                <XCircle className="h-4 w-4" />
                Close
              </button>
              {viewedActivity && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleResolve(viewedActivity, 'RESOLVED')}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-200 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {actionLoading ? 'Processing...' : 'Resolve'}
                  </button>
                  <button
                    onClick={() => handleSuspend(viewedActivity)}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/35 transition-all duration-200 disabled:opacity-50"
                  >
                    <FileWarning className="h-4 w-4" />
                    {actionLoading ? 'Processing...' : 'Suspend User'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FraudMonitoringPage;
