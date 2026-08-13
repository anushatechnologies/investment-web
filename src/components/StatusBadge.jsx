import { Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';

const badgeStyles = {
  active: { color: '#047857', bg: '#d1fae5' },
  pending: { color: '#b45309', bg: '#fef3c7' },
  verified: { color: '#047857', bg: '#d1fae5' },
  rejected: { color: '#be123c', bg: '#ffe4e6' },
  inactive: { color: '#475569', bg: '#e2e8f0' },
  blocked: { color: '#be123c', bg: '#ffe4e6' },
  'under review': { color: '#0369a1', bg: '#e0f2fe' },
  success: { color: '#047857', bg: '#d1fae5' },
  scheduled: { color: '#1d4ed8', bg: '#dbeafe' },
  open: { color: '#b45309', bg: '#fef3c7' },
  false_positive: { color: '#475569', bg: '#e2e8f0' },
  escalated: { color: '#be123c', bg: '#ffe4e6' },
  completed: { color: '#047857', bg: '#d1fae5' },
  matured: { color: '#0f766e', bg: '#ccfbf1' },
  cancelled: { color: '#be123c', bg: '#ffe4e6' },
  pending_receipt: { color: '#b45309', bg: '#fef3c7' },
  early_withdrawal: { color: '#7c2d12', bg: '#ffedd5' },
  processing: { color: '#6d28d9', bg: '#ede9fe' },
  credited: { color: '#1d4ed8', bg: '#dbeafe' },
  unread: { color: '#1d4ed8', bg: '#dbeafe' },
  read: { color: '#475569', bg: '#e2e8f0' },
  high: { color: '#be123c', bg: '#ffe4e6' },
  critical: { color: '#991b1b', bg: '#fee2e2' },
  medium: { color: '#b45309', bg: '#fef3c7' },
  low: { color: '#047857', bg: '#d1fae5' },
  approved: { color: '#047857', bg: '#d1fae5' },
  receipt_uploaded: { color: '#7c3aed', bg: '#ede9fe' },
  reupload_required: { color: '#b45309', bg: '#fef3c7' },
  suspended: { color: '#be123c', bg: '#ffe4e6' },
  deactivated: { color: '#475569', bg: '#e2e8f0' },
  not_submitted: { color: '#475569', bg: '#e2e8f0' },
};

function StatusBadge({ label }) {
  const key = String(label).toLowerCase().replace(/\s+/g, '_');
  const style = badgeStyles[key] ?? { color: '#475569', bg: '#e2e8f0' };

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        bgcolor: alpha(style.bg, 0.95),
        color: style.color,
        border: `1px solid ${alpha(style.color, 0.12)}`,
        fontWeight: 800,
        letterSpacing: '0.02em',
      }}
    />
  );
}

export default StatusBadge;
