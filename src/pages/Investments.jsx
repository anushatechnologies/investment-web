import { BriefcaseBusiness, CalendarClock, ShieldCheck, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { getOwnInvestments } from '../services/api';
import { formatCurrency } from '../utils/formatters';

function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.investments)) return payload.investments;
  return [];
}

function Investments() {
  const [investments, setInvestments] = useState([]);

  useEffect(() => {
    let active = true;
    getOwnInvestments()
      .then((response) => {
        if (!active) return;
        setInvestments(toArray(response));
      })
      .catch(() => {
        if (!active) return;
        setInvestments([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const normalizedInvestments = useMemo(
    () =>
      investments.map((item, index) => ({
        id: item.id || item.investmentId || `INV${index + 1}`,
        plan: item.planName || item.plan || item.investmentPlanName || '-',
        amount: Number(item.investmentAmount ?? item.amount ?? 0),
        startDate: item.startDate || item.createdAt || '-',
        maturityDate: item.maturityDate || '-',
        monthlyReturn: item.monthlyReturn || item.monthlyInterestRate || '-',
        status: item.status || 'Unknown',
      })),
    [investments],
  );

  const stats = useMemo(() => {
    const totalInvestment = normalizedInvestments.reduce((sum, item) => sum + (item.amount || 0), 0);
    const activePlans = normalizedInvestments.filter((item) => item.status?.toLowerCase() === 'active').length;
    const nearestMaturity = normalizedInvestments.find((item) => item.maturityDate && item.maturityDate !== '-')?.maturityDate || '-';
    return [
      { title: 'Total Investment', value: totalInvestment, icon: BriefcaseBusiness, tone: 'blue', valueType: 'currency', note: 'across all plans' },
      { title: 'Active Plans', value: activePlans, icon: ShieldCheck, tone: 'emerald', note: 'currently earning' },
      { title: 'Monthly Return', value: '-', icon: TrendingUp, tone: 'violet', note: 'interest per month' },
      { title: 'Next Maturity', value: nearestMaturity, icon: CalendarClock, tone: 'amber', note: 'nearest maturity date' },
    ];
  }, [normalizedInvestments]);

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
    { key: 'monthlyReturn', label: 'Monthly Return' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge label={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">My Investments</h2>
        <p className="section-copy mt-3 max-w-3xl">
          Review every investment plan, monthly return policy, maturity date, and current
          processing status.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <SectionCard
        title="Portfolio Overview"
        subtitle="Your investments are diversified across monthly-income and growth-based plans."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Primary plan</p>
            <p className="mt-3 font-heading text-xl font-semibold text-slate-900">
              Prime Monthly Income Plan
            </p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Expected monthly interest</p>
            <p className="mt-3 font-heading text-xl font-semibold text-slate-900">₹10,000</p>
          </div>
          <div className="rounded-[24px] border border-blue-100 bg-blue-50 p-5 text-sm leading-7 text-blue-700">
            The latest reinvestment is still processing, so it will move to active once the receipt
            verification is fully completed.
          </div>
        </div>
      </SectionCard>

      <DataTable
        title="Investment List"
        description="Complete list of your current and recently added investment plans."
        data={normalizedInvestments}
        columns={columns}
        searchableKeys={['id', 'plan', 'status']}
        searchPlaceholder="Search by plan, investment ID, or status..."
        filterKey="status"
        filterOptions={['Active', 'Processing']}
      />
    </div>
  );
}

export default Investments;
