/**
 * Standardized Indian Currency Formatter (INR)
 * Formats numbers into Indian Numbering System: ₹10,000, ₹1,00,000, ₹10,00,000, ₹1,00,00,000
 */
export function formatINR(amount) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '₹0';
  }
  const numericAmount = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(numericAmount);
}

/**
 * Standardized Financial Status Color & Label Mapper
 */
export const STATUS_CONFIG = {
  ACTIVE: { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', label: 'ACTIVE' },
  APPROVED: { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', label: 'APPROVED' },
  COMPLETED: { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', label: 'COMPLETED' },
  SUCCESS: { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', label: 'SUCCESS' },
  VERIFIED: { bg: 'bg-emerald-500/15', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/30', label: 'VERIFIED' },

  PENDING: { bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30', label: 'PENDING' },
  PENDING_APPROVAL: { bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30', label: 'PENDING APPROVAL' },
  UNDER_REVIEW: { bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30', label: 'UNDER REVIEW' },
  PAUSED: { bg: 'bg-amber-500/15', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/30', label: 'PAUSED' },
  MATURED: { bg: 'bg-indigo-500/15', text: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-500/30', label: 'MATURED' },

  PROCESSING: { bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30', label: 'PROCESSING' },
  INITIATED: { bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30', label: 'INITIATED' },
  IN_PROGRESS: { bg: 'bg-blue-500/15', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/30', label: 'IN PROGRESS' },

  FAILED: { bg: 'bg-rose-500/15', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/30', label: 'FAILED' },
  REJECTED: { bg: 'bg-rose-500/15', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/30', label: 'REJECTED' },
  CANCELLED: { bg: 'bg-rose-500/15', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/30', label: 'CANCELLED' },
  SUSPENDED: { bg: 'bg-rose-500/15', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/30', label: 'SUSPENDED' },
  BLOCKED: { bg: 'bg-rose-500/15', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-500/30', label: 'BLOCKED' },

  DRAFT: { bg: 'bg-slate-500/15', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-500/30', label: 'DRAFT' },
  CLOSED: { bg: 'bg-slate-500/15', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-500/30', label: 'CLOSED' },
  INACTIVE: { bg: 'bg-slate-500/15', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-500/30', label: 'INACTIVE' }
};

export function getStatusStyle(status) {
  const normalized = String(status || '').toUpperCase();
  return STATUS_CONFIG[normalized] || {
    bg: 'bg-slate-500/15',
    text: 'text-slate-600 dark:text-slate-400',
    border: 'border-slate-500/30',
    label: normalized || 'UNKNOWN'
  };
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
}

export function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return dateString;
  }
}
