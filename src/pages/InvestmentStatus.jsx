import {
  Activity,
  CalendarClock,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from 'recharts';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import {
  investmentProgress,
  investmentStatusSummary,
  investmentTimeline,
  investmentsData,
} from '../data/mockData';
import { formatCurrency } from '../utils/formatters';

const icons = [ShieldCheck, Activity, CalendarClock, TrendingUp];
const tones = ['blue', 'emerald', 'amber', 'violet'];
const progressData = [{ name: 'Status', value: investmentProgress.percentage, fill: '#2563eb' }];

function InvestmentStatus() {
  const columns = [
    { key: 'id', label: 'Investment ID' },
    { key: 'plan', label: 'Plan' },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => formatCurrency(row.amount),
    },
    { key: 'startDate', label: 'Start Date' },
    { key: 'maturityDate', label: 'Maturity Date' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge label={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Investment Status</h2>
        <p className="section-copy mt-3 max-w-3xl">
          Check your plan progress, upcoming interest cycle, and the latest status updates across
          each investment.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {investmentStatusSummary.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            note={stat.note}
            icon={icons[index]}
            tone={tones[index]}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <SectionCard title="Overall Progress" subtitle="Primary plan completion percentage.">
          <div className="relative mx-auto h-[240px] w-full max-w-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                data={progressData}
                startAngle={90}
                endAngle={-270}
                innerRadius="72%"
                outerRadius="100%"
                barSize={16}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background clockWise dataKey="value" cornerRadius={999} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-heading text-4xl font-semibold text-slate-900">
                {investmentProgress.percentage}%
              </span>
              <span className="text-sm text-slate-500">Plan status</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Latest Timeline" subtitle="Most recent updates across your investment plans.">
          <div className="space-y-4">
            {investmentTimeline.map((item) => (
              <div key={item.id} className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.update}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-slate-500">{item.date}</p>
                    <StatusBadge label={item.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <DataTable
        title="Plan Status List"
        description="Status tracking for each plan currently linked to your investor profile."
        data={investmentsData}
        columns={columns}
        searchableKeys={['id', 'plan', 'status']}
        searchPlaceholder="Search investment statuses..."
        filterKey="status"
        filterOptions={['Active', 'Processing']}
      />
    </div>
  );
}

export default InvestmentStatus;
