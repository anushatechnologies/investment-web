import { Banknote, CircleDollarSign, Percent, TrendingUp } from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
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
  recentTransactions,
  revenueBarData,
  revenueSourceData,
  revenueStats,
} from '../data/adminData';
import { formatCompactCurrency, formatCurrency, formatShortTick } from '../utils/formatters';

const statIcons = [Banknote, Percent, CircleDollarSign, TrendingUp];
const statTones = ['blue', 'emerald', 'violet', 'amber'];

function RevenuePage() {
  const totalRevenue = revenueSourceData.reduce((sum, item) => sum + item.value, 0);
  const transactionColumns = [
    { key: 'date', label: 'Date' },
    { key: 'type', label: 'Type' },
    { key: 'description', label: 'Description' },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => formatCurrency(row.amount),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge label={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">
          Revenue intelligence
        </p>
        <h1 className="section-title mt-3">Revenue</h1>
        <p className="section-copy mt-3 max-w-3xl">
          Break down realized revenue by source, compare collection performance, and review recent
          transactions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {revenueStats.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            note={stat.note}
            icon={statIcons[index]}
            tone={statTones[index]}
            valueType="currency"
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <SectionCard title="Revenue Overview" subtitle="Weekly realized revenue trend across all collections.">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueBarData}>
                <XAxis dataKey="label" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatShortTick}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                  contentStyle={{
                    background: 'rgba(7, 17, 38, 0.95)',
                    border: '1px solid rgba(148, 163, 184, 0.18)',
                    borderRadius: '18px',
                  }}
                />
                <Bar dataKey="amount" radius={[14, 14, 0, 0]}>
                  {revenueBarData.map((entry, index) => (
                    <Cell
                      key={entry.label}
                      fill={index % 2 === 0 ? 'rgba(59,130,246,0.95)' : 'rgba(37,99,235,0.72)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Revenue By Source" subtitle="Interest income continues to drive the majority of earnings.">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_180px] xl:grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_180px]">
            <div className="relative mx-auto h-[280px] w-full max-w-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueSourceData}
                    dataKey="value"
                    innerRadius={78}
                    outerRadius={112}
                    paddingAngle={3}
                  />
                  <Tooltip
                    formatter={(value, name) => [formatCurrency(value), name]}
                    contentStyle={{
                      background: 'rgba(7, 17, 38, 0.95)',
                      border: '1px solid rgba(148, 163, 184, 0.18)',
                      borderRadius: '18px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading text-3xl font-semibold text-white">
                  {formatCompactCurrency(totalRevenue)}
                </span>
                <span className="text-sm text-slate-400">Total revenue</span>
              </div>
            </div>

            <div className="space-y-3">
              {revenueSourceData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.fill }} />
                    <span className="text-sm font-medium text-slate-200">{item.name}</span>
                  </div>
                  <span className="text-sm text-slate-400">
                    {Math.round((item.value / totalRevenue) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>
      </div>

      <DataTable
        title="Recent Transactions"
        description="Recent revenue entries across interest, referral commission, and other operational income."
        data={recentTransactions}
        columns={transactionColumns}
        searchableKeys={['type', 'description', 'date']}
        searchPlaceholder="Search by type, description, or date..."
        filterKey="type"
        filterOptions={['Interest', 'Referral', 'Other']}
      />
    </div>
  );
}

export default RevenuePage;
