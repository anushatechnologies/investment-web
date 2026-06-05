import { Fingerprint, KeyRound, MailCheck, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { getSecuritySummary } from '../services/api';

function SecurityCenter() {
  const [summary, setSummary] = useState({});

  useEffect(() => {
    getSecuritySummary().then(setSummary).catch(() => setSummary({}));
  }, []);

  const stats = [
    { title: 'Email', value: summary.emailVerified ? 'Verified' : 'Pending', icon: MailCheck, tone: summary.emailVerified ? 'emerald' : 'amber', valueType: 'text', note: 'email verification' },
    { title: 'Bank', value: summary.bankVerified ? 'Verified' : 'Pending', icon: ShieldCheck, tone: summary.bankVerified ? 'emerald' : 'amber', valueType: 'text', note: 'bank account status' },
    { title: 'MPIN', value: summary.mpinCreated ? 'Enabled' : 'Not Set', icon: KeyRound, tone: summary.mpinCreated ? 'blue' : 'rose', valueType: 'text', note: 'mobile login security' },
    { title: 'Biometric', value: summary.biometricEnabled ? 'Enabled' : 'Disabled', icon: Fingerprint, tone: summary.biometricEnabled ? 'violet' : 'amber', valueType: 'text', note: 'device preference' },
  ];

  const events = Array.isArray(summary.recentEvents)
    ? summary.recentEvents.map((event) => ({
        id: event.id,
        action: event.action,
        entityType: event.entityType,
        ipAddress: event.ipAddress || '-',
        userAgent: event.userAgent || '-',
        occurredAt: event.occurredAt ? new Date(event.occurredAt).toLocaleString() : '-',
      }))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Security Center</h2>
        <p className="section-copy mt-3 max-w-3xl">Review account protection status and recent security activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => <StatCard key={stat.title} {...stat} />)}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        Last login: <span className="font-semibold text-slate-900">{summary.lastLoginAt ? new Date(summary.lastLoginAt).toLocaleString() : '-'}</span>
        <span className="mx-2">|</span>
        IP: <span className="font-semibold text-slate-900">{summary.lastLoginIp || '-'}</span>
      </div>

      <DataTable
        title="Recent Security Events"
        description="Login, password, MPIN, and account actions captured by audit logs."
        data={events}
        columns={[
          { key: 'action', label: 'Action', render: (row) => <StatusBadge label={row.action} /> },
          { key: 'entityType', label: 'Entity' },
          { key: 'ipAddress', label: 'IP' },
          { key: 'occurredAt', label: 'Time' },
        ]}
        searchableKeys={['action', 'entityType', 'ipAddress', 'userAgent', 'occurredAt']}
      />
    </div>
  );
}

export default SecurityCenter;
