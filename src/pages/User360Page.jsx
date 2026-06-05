import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { adminAdjustWallet, adminGetUser360 } from '../services/api';
import { formatCurrency } from '../utils/formatters';

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function User360Page() {
  const { userId } = useParams();
  const [data, setData] = useState({});
  const [adjustment, setAdjustment] = useState({ amount: '', reason: '' });
  const [adjustmentMessage, setAdjustmentMessage] = useState('');
  const [adjustmentError, setAdjustmentError] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const profile = data.profile || {};
  const wallet = data.wallet || {};

  const loadUser = () => {
    if (userId) {
      return adminGetUser360(userId).then(setData).catch(() => setData({}));
    }
    return Promise.resolve();
  };

  useEffect(() => {
    loadUser();
  }, [userId]);

  const submitAdjustment = async (event) => {
    event.preventDefault();
    const amount = Number(adjustment.amount || 0);
    if (!amount) {
      setAdjustmentError('Enter a non-zero amount. Use negative value for debit.');
      return;
    }
    if (!adjustment.reason.trim()) {
      setAdjustmentError('Reason is required for audit log.');
      return;
    }
    setAdjusting(true);
    setAdjustmentError('');
    setAdjustmentMessage('');
    try {
      await adminAdjustWallet({ userId, amount, reason: adjustment.reason.trim() });
      setAdjustment({ amount: '', reason: '' });
      setAdjustmentMessage('Wallet adjustment saved and investor notified.');
      await loadUser();
    } catch (err) {
      setAdjustmentError(err?.message || 'Unable to adjust wallet.');
    } finally {
      setAdjusting(false);
    }
  };

  const investments = toArray(data.investments).map((item) => ({
    id: item.id,
    amount: Number(item.investmentAmount || 0),
    status: item.status,
    appliedAt: item.appliedAt ? new Date(item.appliedAt).toLocaleString() : '-',
  }));

  const transactions = toArray(data.walletTransactions).slice(0, 20).map((item) => ({
    id: item.id,
    type: item.transactionType,
    direction: item.direction,
    amount: Number(item.amount || 0),
    createdAt: item.createdAt ? new Date(item.createdAt).toLocaleString() : '-',
  }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">User 360</p>
        <h1 className="section-title mt-3">{profile.fullName || 'Investor Profile'}</h1>
        <p className="section-copy mt-3 max-w-3xl">{profile.email || userId}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Wallet Balance" value={Number(wallet.availableBalance || 0)} valueType="currency" note="available balance" />
        <StatCard title="Account" value={profile.accountStatus || '-'} note="account status" tone="emerald" />
        <StatCard title="KYC" value={profile.kycStatus || '-'} note="kyc status" tone="amber" />
        <StatCard title="Referral Code" value={profile.referralCode || '-'} note="share code" tone="violet" />
      </div>

      <SectionCard title="Profile Snapshot" subtitle="Core identity, bank, and onboarding status.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            ['Mobile', profile.mobileNumber],
            ['PAN', profile.panNumber],
            ['Aadhaar Last 4', profile.aadhaarLast4],
            ['Bank', profile.bankName],
            ['Bank Account', profile.bankAccountNumber],
            ['Onboarding', profile.onboardingStatus],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
              <p className="mt-2 font-semibold text-white">{value || '-'}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Admin Wallet Adjustment" subtitle="Credit or debit wallet balance with an audit reason.">
        {(adjustmentMessage || adjustmentError) && (
          <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${adjustmentError ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {adjustmentError || adjustmentMessage}
          </div>
        )}
        <form onSubmit={submitAdjustment} className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)_auto]">
          <label className="block">
            <span className="text-sm font-semibold text-slate-300">Amount</span>
            <input
              type="number"
              step="0.01"
              className="input-shell mt-2"
              value={adjustment.amount}
              onChange={(event) => setAdjustment((current) => ({ ...current, amount: event.target.value }))}
              placeholder="500 or -500"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-300">Reason</span>
            <input
              className="input-shell mt-2"
              value={adjustment.reason}
              onChange={(event) => setAdjustment((current) => ({ ...current, reason: event.target.value }))}
              placeholder="Manual correction, bonus, reversal..."
            />
          </label>
          <button type="submit" disabled={adjusting} className="btn-primary self-end disabled:opacity-60">
            {adjusting ? 'Saving...' : 'Apply'}
          </button>
        </form>
      </SectionCard>

      <DataTable
        title="Investments"
        data={investments}
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'amount', label: 'Amount', render: (row) => formatCurrency(row.amount) },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge label={row.status} /> },
          { key: 'appliedAt', label: 'Applied' },
        ]}
        searchableKeys={['id', 'status', 'appliedAt']}
      />

      <DataTable
        title="Recent Wallet Transactions"
        data={transactions}
        columns={[
          { key: 'type', label: 'Type' },
          { key: 'direction', label: 'Direction' },
          { key: 'amount', label: 'Amount', render: (row) => formatCurrency(row.amount) },
          { key: 'createdAt', label: 'Created' },
        ]}
        searchableKeys={['type', 'direction', 'createdAt']}
      />
    </div>
  );
}

export default User360Page;
