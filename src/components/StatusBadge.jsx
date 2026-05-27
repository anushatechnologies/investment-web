const badgeStyles = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  verified: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  rejected: 'border-rose-200 bg-rose-50 text-rose-700',
  inactive: 'border-slate-200 bg-slate-100 text-slate-600',
  blocked: 'border-rose-200 bg-rose-50 text-rose-700',
  'under review': 'border-sky-200 bg-sky-50 text-sky-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  scheduled: 'border-blue-200 bg-blue-50 text-blue-700',
  open: 'border-amber-200 bg-amber-50 text-amber-700',
  escalated: 'border-rose-200 bg-rose-50 text-rose-700',
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  matured: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  processing: 'border-violet-200 bg-violet-50 text-violet-700',
  credited: 'border-blue-200 bg-blue-50 text-blue-700',
  unread: 'border-blue-200 bg-blue-50 text-blue-700',
  read: 'border-slate-200 bg-slate-100 text-slate-600',
  'high': 'border-rose-200 bg-rose-50 text-rose-700',
  'medium': 'border-amber-200 bg-amber-50 text-amber-700',
  'low': 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

function StatusBadge({ label }) {
  const key = String(label).toLowerCase();

  return (
    <span
      className={`status-badge ${badgeStyles[key] ?? 'border-slate-200 bg-slate-100 text-slate-600'}`}
    >
      {label}
    </span>
  );
}

export default StatusBadge;
