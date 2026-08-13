export const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

export const formatNumber = (value) =>
  new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(value);

export const formatPercent = (value) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

export const formatCompactCurrency = (value) => {
  if (value >= 10000000) {
    return `\u20B9${(value / 10000000).toFixed(2)} Cr`;
  }

  if (value >= 100000) {
    return `\u20B9${(value / 100000).toFixed(1)} L`;
  }

  if (value >= 1000) {
    return `\u20B9${(value / 1000).toFixed(1)} K`;
  }

  return formatCurrency(value);
};

export const formatShortTick = (value) => {
  if (value >= 10000000) {
    return `\u20B9${(value / 10000000).toFixed(1)}Cr`;
  }

  if (value >= 100000) {
    return `\u20B9${(value / 100000).toFixed(1)}L`;
  }

  if (value >= 1000) {
    return `\u20B9${(value / 1000).toFixed(0)}K`;
  }

  return `\u20B9${value}`;
};

export const formatDate = (dateString) => {
  if (!dateString || dateString === '-') return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch (e) {
    return dateString;
  }
};
