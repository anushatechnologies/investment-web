import {
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  formatPercent,
} from '../utils/formatters';

const toneClasses = {
  blue: {
    shell: 'from-blue-50 via-white to-white',
    icon: 'bg-blue-100 text-blue-600 ring-blue-200',
  },
  emerald: {
    shell: 'from-emerald-50 via-white to-white',
    icon: 'bg-emerald-100 text-emerald-600 ring-emerald-200',
  },
  violet: {
    shell: 'from-violet-50 via-white to-white',
    icon: 'bg-violet-100 text-violet-600 ring-violet-200',
  },
  amber: {
    shell: 'from-amber-50 via-white to-white',
    icon: 'bg-amber-100 text-amber-600 ring-amber-200',
  },
  rose: {
    shell: 'from-rose-50 via-white to-white',
    icon: 'bg-rose-100 text-rose-600 ring-rose-200',
  },
  cyan: {
    shell: 'from-cyan-50 via-white to-white',
    icon: 'bg-cyan-100 text-cyan-600 ring-cyan-200',
  },
};

function StatCard({
  title,
  value,
  change,
  note,
  icon: Icon,
  tone = 'blue',
  valueType = 'number',
  compact = false,
  formatter,
}) {
  const valueFormatter =
    formatter ??
    (valueType === 'currency'
      ? compact
        ? formatCompactCurrency
        : formatCurrency
      : formatNumber);
  const currentTone = toneClasses[tone] ?? toneClasses.blue;
  const displayValue = typeof value === 'string' ? value : valueFormatter(value);

  return (
    <article
      className={`glass-card relative overflow-hidden bg-gradient-to-br ${currentTone.shell} p-5 sm:p-6`}
    >
      <div className="theme-stat-halo absolute -right-10 -top-10 h-28 w-28 rounded-full bg-slate-100/80" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="theme-card-kicker text-sm font-medium text-slate-500">{title}</p>
          <p className="theme-card-value mt-4 font-heading text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            {displayValue}
          </p>
          {typeof change === 'number' ? (
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className={change >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {formatPercent(change)}
              </span>
              {note && <span className="theme-card-note text-sm text-slate-500">{note}</span>}
            </div>
          ) : (
            note && <p className="theme-card-note mt-4 text-sm text-slate-500">{note}</p>
          )}
        </div>
        {Icon && (
          <div
            className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${currentTone.icon}`}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </article>
  );
}

export default StatCard;
