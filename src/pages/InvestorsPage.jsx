import { ShieldCheck, UserPlus, Users, X, Pencil } from 'lucide-react';
import { useState } from 'react';
import DataTable from '../components/DataTable';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { investorsData, investorsPageStats } from '../data/adminData';
import { formatCurrency } from '../utils/formatters';

const statIcons = [Users, Users, ShieldCheck, UserPlus];
const statTones = ['blue', 'emerald', 'violet', 'cyan'];

function InvestorsPage() {
  const [investors, setInvestors] = useState(investorsData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editInvestorId, setEditInvestorId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    investmentAmount: '',
    kyc: 'Pending',
    status: 'Pending',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddInvestor = (e) => {
    e.preventDefault();
    
    if (editInvestorId) {
      setInvestors(investors.map(inv => inv.id === editInvestorId ? {
        ...inv,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        investmentAmount: Number(formData.investmentAmount) || 0,
        kyc: formData.kyc,
        status: formData.status,
      } : inv));
    } else {
      const newId = `INV${String(investors.length + 1).padStart(3, '0')}`;
      const newInvestor = {
        id: newId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        investmentAmount: Number(formData.investmentAmount) || 0,
        kyc: formData.kyc,
        status: formData.status,
        joinDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      };
      setInvestors([newInvestor, ...investors]);
    }

    setIsModalOpen(false);
    setEditInvestorId(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      city: '',
      investmentAmount: '',
      kyc: 'Pending',
      status: 'Pending',
    });
  };

  const handleEditClick = (row) => {
    setFormData({
      name: row.name,
      email: row.email,
      phone: row.phone,
      city: row.city,
      investmentAmount: row.investmentAmount,
      kyc: row.kyc,
      status: row.status,
    });
    setEditInvestorId(row.id);
    setIsModalOpen(true);
  };

  const columns = [
    { key: 'id', label: '#ID' },
    {
      key: 'name',
      label: 'Investor',
      render: (row) => (
        <div>
          <p className="font-semibold text-white">{row.name}</p>
          <p className="text-xs text-slate-500">{row.city}</p>
        </div>
      ),
    },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'investmentAmount',
      label: 'Investment Amount',
      render: (row) => formatCurrency(row.investmentAmount),
    },
    {
      key: 'kyc',
      label: 'KYC',
      render: (row) => <StatusBadge label={row.kyc} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge label={row.status} />,
    },
    { key: 'joinDate', label: 'Join Date' },
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
          Investor onboarding
        </p>
        <h1 className="section-title mt-3">Investors</h1>
        <p className="section-copy mt-3 max-w-3xl">
          Search, monitor, and segment investor records by activity, KYC stage, and committed
          capital.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {investorsPageStats.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            note={stat.note}
            icon={statIcons[index]}
            tone={statTones[index]}
            valueType="number"
          />
        ))}
      </div>

      <DataTable
        title="Investors Directory"
        description="Track investor growth, verify KYC submissions, and spot inactive accounts quickly."
        data={investors}
        columns={columns}
        searchableKeys={['id', 'name', 'email', 'phone', 'city']}
        searchPlaceholder="Search by name, email, phone, or city..."
        filterKey="status"
        filterOptions={['Active', 'Pending', 'Inactive']}
        actions={[{ label: 'Add Investor', icon: UserPlus, variant: 'primary', onClick: () => {
          setEditInvestorId(null);
          setFormData({
            name: '',
            email: '',
            phone: '',
            city: '',
            investmentAmount: '',
            kyc: 'Pending',
            status: 'Pending',
          });
          setIsModalOpen(true);
        } }]}
        itemsPerPage={20}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-lg overflow-hidden border border-white/10 bg-[#08152f]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h3 className="font-heading text-lg font-semibold text-white">
                {editInvestorId ? 'Edit Investor' : 'Add New Investor'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddInvestor} className="p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-300">Name</label>
                  <input required name="name" value={formData.name} onChange={handleInputChange} className="input-shell" placeholder="Full Name" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Email</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="input-shell" placeholder="Email Address" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Phone</label>
                  <input required name="phone" value={formData.phone} onChange={handleInputChange} className="input-shell" placeholder="Phone Number" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">City</label>
                  <input required name="city" value={formData.city} onChange={handleInputChange} className="input-shell" placeholder="City" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1 block text-sm font-medium text-slate-300">Investment Amount</label>
                  <input required type="number" name="investmentAmount" value={formData.investmentAmount} onChange={handleInputChange} className="input-shell" placeholder="e.g. 50000" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">KYC Status</label>
                  <select name="kyc" value={formData.kyc} onChange={handleInputChange} className="input-shell appearance-none">
                    <option value="Pending">Pending</option>
                    <option value="Verified">Verified</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange} className="input-shell appearance-none">
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editInvestorId ? 'Save Changes' : 'Add Investor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default InvestorsPage;
