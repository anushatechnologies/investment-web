export function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

export function asNumber(value) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function prettifyEnum(value) {
  if (!value) return 'N/A';
  return String(value)
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatDate(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getRecentMonthBuckets(count = 6) {
  const today = new Date();
  const buckets = [];
  for (let index = count - 1; index >= 0; index -= 1) {
    const cursor = new Date(today.getFullYear(), today.getMonth() - index, 1);
    buckets.push({
      key: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`,
      label: cursor.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
    });
  }
  return buckets;
}

export function buildMonthlySeries(items, valueGetter, dateGetter, count = 6) {
  const buckets = getRecentMonthBuckets(count);
  const totals = buckets.reduce((acc, bucket) => ({ ...acc, [bucket.key]: 0 }), {});

  items.forEach((item) => {
    const rawDate = dateGetter(item);
    if (!rawDate) return;
    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!(key in totals)) return;
    totals[key] += asNumber(valueGetter(item));
  });

  return buckets.map((bucket) => ({
    label: bucket.label,
    key: bucket.key,
    value: totals[bucket.key],
  }));
}
