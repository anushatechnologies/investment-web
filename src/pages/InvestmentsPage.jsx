import { Banknote, BriefcaseBusiness, ShieldCheck, TrendingUp, X, Pencil } from 'lucide-react';
import { useState } from 'react';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { investmentsData, investmentsPageStats, platformRules } from '../data/adminData';
import { formatCurrency } from '../utils/formatters';

const statIcons = [BriefcaseBusiness, Banknote, TrendingUp, ShieldCheck];
const statTones = ['blue', 'emerald', 'violet', 'amber'];

function InvestmentsPage() {
  const [investments, setInvestments] = useState(investmentsData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editInvestmentId, setEditInvestmentId] = useState(null);
  
  const [formData, setFormData] = useState({
    investor: '',
    product: '',
    amount: '',
    interestRate: '',
    referralSource: '',
    startDate: '',
    maturityDate: '',
    status: 'Active',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateInvestment = (e) => {
    e.preventDefault();
    if (editInvestmentId) {
      setInvestments(investments.map(inv => inv.id === editInvestmentId ? {
        ...inv,
        investor: formData.investor,
        product: formData.product,
        amount: Number(formData.amount) || 0,
        interestRate: formData.interestRate,
        referralSource: formData.referralSource,
        startDate: formData.startDate,
        maturityDate: formData.maturityDate,
        status: formData.status,
      } : inv));
    }
    setIsModalOpen(false);
    setEditInvestmentId(null);
  };

  const handleEditClick = (row) => {
    setFormData({
      investor: row.investor,
      product: row.product,
      amount: row.amount,
      interestRate: row.interestRate,
      referralSource: row.referralSource,
      startDate: row.startDate,
      maturityDate: row.maturityDate,
      status: row.status,
    });
    setEditInvestmentId(row.id);
    setIsModalOpen(true);
  };

  const columns = [
    { key: 'id', label: 'Investment ID' },
    { key: 'investor', label: 'Investor' },
    { key: 'product', label: 'Product' },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => formatCurrency(row.amount),
    },
    { key: 'interestRate', label: 'Interest' },
    { key: 'referralSource', label: 'Source' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'maturityDate', label: 'Maturity Date' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge label={row.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={() => handleEditClick(row)}
          className="text-slate-400 transition hover:text-blue-500"
        >
          <Pencil className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">
          Portfolio lifecycle
        </p>
        <h1 className="section-title mt-3">Investments</h1>
        <p className="section-copy mt-3 max-w-3xl">
          Monitor active investments, expected monthly returns, and maturity schedules across all
          investor portfolios.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {investmentsPageStats.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            note={stat.note}
            icon={statIcons[index]}
            tone={statTones[index]}
            valueType={index === 1 || index === 2 ? 'currency' : 'number'}
          />
        ))}
      </div>

      <SectionCard
        title="Investment Guardrails"
        subtitle="Operational limits and policies applied to the investment engine."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Investment window</p>
            <p className="mt-3 font-heading text-xl font-semibold text-white">
              {formatCurrency(platformRules.minInvestment)} to{' '}
              {formatCurrency(platformRules.maxInvestment)}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Monthly return policy</p>
            <p className="mt-3 font-heading text-xl font-semibold text-white">
              {platformRules.monthlyInterest}% interest payout
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-blue-500/10 p-5 text-sm leading-7 text-blue-100">
            Every credited investment remains tied to receipt verification and admin oversight for
            exception handling.
          </div>
        </div>
      </SectionCard>

      <DataTable
        title="Investment Book"
        description="Search by investor, product, or source to review the current allocation mix."
        data={investments}
        columns={columns}
        searchableKeys={['id', 'investor', 'product', 'referralSource']}
        searchPlaceholder="Search by investor, product, or source..."
        filterKey="status"
        filterOptions={['Active', 'Matured', 'Pending', 'Under Review']}
        itemsPerPage={20}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg overflow-hidden border border-white/10 bg-[#08152f]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h3 className="font-heading text-lg font-semibold text-white">Edit Investment</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateInvestment} className="p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-300">Investor</label>
                  <input required name="investor" value={formData.investor} onChange={handleInputChange} className="input-shell" placeholder="Investor Name" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Product</label>
                  <input required name="product" value={formData.product} onChange={handleInputChange} className="input-shell" placeholder="Product Name" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Amount</label>
                  <input required type="number" name="amount" value={formData.amount} onChange={handleInputChange} className="input-shell" placeholder="Amount" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Interest</label>
                  <input required name="interestRate" value={formData.interestRate} onChange={handleInputChange} className="input-shell" placeholder="Interest Rate" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Source</label>
                  <input required name="referralSource" value={formData.referralSource} onChange={handleInputChange} className="input-shell" placeholder="Referral Source" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Start Date</label>
                  <input required name="startDate" value={formData.startDate} onChange={handleInputChange} className="input-shell" placeholder="Start Date" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Maturity Date</label>
                  <input required name="maturityDate" value={formData.maturityDate} onChange={handleInputChange} className="input-shell" placeholder="Maturity Date" />
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-300">Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="input-shell appearance-none">
                    <option value="Active">Active</option>
                    <option value="Matured">Matured</option>
                    <option value="Pending">Pending</option>
                    <option value="Under Review">Under Review</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvestmentsPage;
