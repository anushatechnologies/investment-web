import { AlertTriangle, Eye, ShieldCheck, Users, Wallet, XCircle } from 'lucide-react';
import { useState } from 'react';
import DataTable from '../components/DataTable';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { fraudStats, suspiciousActivities } from '../data/adminData';

const statIcons = [Users, Wallet, ShieldCheck, Eye];
const statTones = ['rose', 'amber', 'rose', 'blue'];

function FraudMonitoringPage() {
  const [activities, setActivities] = useState(suspiciousActivities);
  const [message, setMessage] = useState('');
  const [viewedActivity, setViewedActivity] = useState(null);

  const handleAction = (action, row) => {
    if (action === 'Cleared') {
      setActivities(activities.map(act => act.id === row.id ? { ...act, status: 'Cleared' } : act));
      setMessage(`Cleared fraud alert ${row.id} for ${row.userName}.`);
    } else if (action === 'Blocked') {
      setActivities(activities.map(act => act.id === row.id ? { ...act, status: 'Blocked' } : act));
      setMessage(`Blocked user ${row.userName} (Incident ${row.id}).`);
    } else if (action === 'Viewed') {
      setViewedActivity(row);
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
        <div className="flex items-center gap-2">
          {['Open', 'Under Review', 'Escalated'].includes(row.status) && (
            <>
              <button
                type="button"
                onClick={() => handleAction('Cleared', row)}
                className="rounded-xl border border-emerald-500/20 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleAction('Blocked', row)}
                className="rounded-xl border border-rose-500/20 bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-200"
              >
                Block
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => handleAction('Viewed', row)}
            className="rounded-xl border border-blue-500/20 bg-blue-500/15 px-3 py-2 text-xs font-semibold text-blue-100"
          >
            View
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">
          Risk and fraud defense
        </p>
        <h1 className="section-title mt-3">Fraud Monitoring</h1>
        <p className="section-copy mt-3 max-w-3xl">
          Investigate suspicious withdrawals, document mismatches, duplicate accounts, and referral
          abuse before they impact investors.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {fraudStats.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            note={stat.note}
            icon={statIcons[index]}
            tone={statTones[index]}
            valueType="number"
          />
        ))}
      </div>

      <DataTable
        title="Suspicious Activities"
        description="Fraud monitoring stays active to protect wallet withdrawals, KYC, and referral payouts."
        data={activities}
        columns={columns}
        searchableKeys={['id', 'userName', 'activityType', 'reason']}
        searchPlaceholder="Search by user, reason, or activity type..."
        filterKey="riskLevel"
        filterOptions={['High', 'Medium']}
        actions={[{ label: 'Review Policy', icon: AlertTriangle, variant: 'secondary', onClick: () => setMessage('Fraud review policy opened for admin review.') }]}
        itemsPerPage={20}
      />
      
      {message && <p className="text-sm text-slate-400">{message}</p>}

      {viewedActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md overflow-hidden border border-white/10 bg-[#08152f]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h3 className="font-heading text-lg font-semibold text-white">Incident Details</h3>
              <button onClick={() => setViewedActivity(null)} className="text-slate-400 hover:text-white">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-400">User Name</p>
                <p className="text-white font-medium">{viewedActivity.userName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Activity Type</p>
                <p className="text-white font-medium">{viewedActivity.activityType}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Reason</p>
                <p className="text-white font-medium">{viewedActivity.reason}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Risk Level</p>
                  <div className="mt-1">
                    <StatusBadge label={viewedActivity.riskLevel} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <div className="mt-1">
                    <StatusBadge label={viewedActivity.status} />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400">Date Detected</p>
                <p className="text-white font-medium">{viewedActivity.date}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FraudMonitoringPage;
