import { ShieldCheck, UserPlus, Users, X, Pencil, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import DataTable from '../components/DataTable';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { adminGetAllInvestments, adminGetUsers, adminUpdateUser } from '../services/api';
import { formatCurrency } from '../utils/formatters';

function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function InvestorsPage() {
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editInvestorId, setEditInvestorId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    investmentAmount: 0,
    kyc: 'NOT_SUBMITTED',
    status: 'PENDING',
  });

  const loadInvestors = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersRes, investmentsRes] = await Promise.all([
        adminGetUsers(),
        adminGetAllInvestments().catch(() => []),
      ]);

      const users = toArray(usersRes);
      const investments = toArray(investmentsRes);

      const totalByInvestor = investments.reduce((acc, item) => {
        const userId = item.investorUserId;
        if (!userId) return acc;
        acc[userId] = (acc[userId] || 0) + Number(item.investmentAmount ?? 0);
        return acc;
      }, {});

      const mapped = users.map((user) => ({
        id: user.id,
        name: user.fullName || user.name || 'N/A',
        email: user.email || 'N/A',
        phone: user.mobileNumber || user.phoneNumber || 'N/A',
        city: user.address || user.city || 'N/A',
        investmentAmount: totalByInvestor[user.id] || 0,
        kyc: user.kycStatus || 'NOT_SUBMITTED',
        status: user.accountStatus || 'PENDING',
        joinDate: user.createdAt
          ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'N/A',
        raw: user,
      }));

      setInvestors(mapped);
    } catch (err) {
      console.error('Failed to load investors', err);
      setError(err.message || 'Failed to load investors.');
      setInvestors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvestors();
  }, []);

  const stats = useMemo(() => {
    const total = investors.length;
    const active = investors.filter((item) => String(item.status).toUpperCase() === 'ACTIVE').length;
    const kycApproved = investors.filter((item) => String(item.kyc).toUpperCase() === 'APPROVED').length;
    const pending = investors.filter((item) => String(item.status).toUpperCase() === 'PENDING').length;

    return [
      { title: 'Total Investors', value: total, note: 'loaded from admin users API' },
      { title: 'Active Accounts', value: active, note: 'account status is ACTIVE' },
      { title: 'KYC Approved', value: kycApproved, note: 'ready for next onboarding steps' },
      { title: 'Pending Accounts', value: pending, note: 'still under onboarding/review' },
    ];
  }, [investors]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const handleSaveInvestor = async (event) => {
    event.preventDefault();
    if (!editInvestorId) {
      setError('Creating a new investor is not supported by the current backend admin API.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await adminUpdateUser(editInvestorId, {
        accountStatus: formData.status,
      });
      setIsModalOpen(false);
      setEditInvestorId(null);
      await loadInvestors();
    } catch (err) {
      console.error('Failed to update investor status', err);
      setError(err.message || 'Failed to update investor status.');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'id', label: '#ID' },
    {
      key: 'name',
      label: 'Investor',
      exportValue: (row) => row.name,
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
      exportValue: (row) => row.investmentAmount,
      render: (row) => formatCurrency(row.investmentAmount),
    },
    {
      key: 'kyc',
      label: 'KYC',
      exportValue: (row) => row.kyc,
      render: (row) => <StatusBadge label={row.kyc} />,
    },
    {
      key: 'status',
      label: 'Status',
      exportValue: (row) => row.status,
      render: (row) => <StatusBadge label={row.status} />,
    },
    { key: 'joinDate', label: 'Join Date' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          type="button"
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

      {error && <Alert severity="error">{error}</Alert>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            note={stat.note}
            icon={[Users, Users, ShieldCheck, UserPlus][index]}
            tone={['blue', 'emerald', 'violet', 'cyan'][index]}
            valueType="number"
          />
        ))}
      </div>

      <DataTable
        title="Investors Directory"
        description="Live investor list from the backend admin APIs."
        data={investors}
        columns={columns}
        searchableKeys={['id', 'name', 'email', 'phone', 'city']}
        searchPlaceholder="Search by name, email, phone, or city..."
        filterKey="status"
        filterOptions={['ACTIVE', 'PENDING', 'SUSPENDED', 'DEACTIVATED']}
        actions={[
          {
            label: 'Refresh',
            icon: RefreshCw,
            variant: 'secondary',
            onClick: loadInvestors,
          },
        ]}
        emptyMessage={loading ? 'Loading investors...' : 'No investors found.'}
        itemsPerPage={20}
        enableCsvExport
        exportFileName="investors-directory"
      />

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editInvestorId ? 'Investor Details' : 'Add Investor'}</DialogTitle>
        <form onSubmit={handleSaveInvestor}>
          <DialogContent>
            <Stack spacing={2}>
              <TextField label="Name" name="name" value={formData.name} onChange={handleInputChange} disabled />
              <TextField label="Email" name="email" value={formData.email} onChange={handleInputChange} disabled />
              <TextField label="Phone" name="phone" value={formData.phone} onChange={handleInputChange} disabled />
              <TextField label="City / Address" name="city" value={formData.city} onChange={handleInputChange} disabled />
              <TextField label="Investment Amount" name="investmentAmount" value={formatCurrency(Number(formData.investmentAmount || 0))} disabled />
              <TextField label="KYC Status" name="kyc" value={formData.kyc} disabled />
              <TextField
                select
                label="Account Status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                <MenuItem value="PENDING">PENDING</MenuItem>
                <MenuItem value="DEACTIVATED">DEACTIVATED</MenuItem>
              </TextField>
              <Typography variant="body2" color="text.secondary">
                The backend admin API currently supports account status updates here. Editing profile fields from this screen is not exposed by the backend.
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving...' : 'Save Status'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}

export default InvestorsPage;
