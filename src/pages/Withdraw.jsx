import { Banknote, CreditCard, ShieldCheck, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { getOwnWithdrawals, requestWithdrawal, getWallet, getWithdrawalSettings } from '../services/api';
import { formatCurrency } from '../utils/formatters';

function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.withdrawals)) return payload.withdrawals;
  return [];
}

const DEFAULT_WITHDRAWAL_SETTINGS = {
  withdrawalEnabled: true,
  minimumWithdrawalAmount: 1000,
  maximumWithdrawalAmount: 0,
  dailyWithdrawalLimit: 0,
  monthlyWithdrawalLimit: 0,
  processingTime: '24 hours',
  preferredMethod: 'Bank Transfer',
};

function normalizeSettings(settings) {
  return {
    ...DEFAULT_WITHDRAWAL_SETTINGS,
    ...(settings || {}),
    withdrawalEnabled: settings?.withdrawalEnabled !== false,
    minimumWithdrawalAmount: Number(settings?.minimumWithdrawalAmount ?? settings?.minWithdrawal ?? DEFAULT_WITHDRAWAL_SETTINGS.minimumWithdrawalAmount),
    maximumWithdrawalAmount: Number(settings?.maximumWithdrawalAmount ?? settings?.maxWithdrawal ?? DEFAULT_WITHDRAWAL_SETTINGS.maximumWithdrawalAmount),
    dailyWithdrawalLimit: Number(settings?.dailyWithdrawalLimit ?? DEFAULT_WITHDRAWAL_SETTINGS.dailyWithdrawalLimit),
    monthlyWithdrawalLimit: Number(settings?.monthlyWithdrawalLimit ?? DEFAULT_WITHDRAWAL_SETTINGS.monthlyWithdrawalLimit),
  };
}

function Withdraw() {
  const [amount, setAmount] = useState('1000');
  const [method, setMethod] = useState('Bank Transfer');
  const [history, setHistory] = useState([]);
  const [walletData, setWalletData] = useState({});
  const [withdrawalSettings, setWithdrawalSettings] = useState(DEFAULT_WITHDRAWAL_SETTINGS);
  const [message, setMessage] = useState('');

  const mapWithdrawal = (item, index) => ({
    id: item.id || item.withdrawalId || `WDL${index + 1}`,
    requestedOn: item.requestedAt || item.requestedOn || item.createdAt || '-',
    amount: Number(item.requestedAmount ?? item.amount ?? 0),
    method: item.bankName ? 'Bank Transfer' : (item.method || item.mode || 'Bank Transfer'),
    status: item.status || 'Pending',
  });

  const minWithdrawal = Number(withdrawalSettings.minimumWithdrawalAmount ?? 1000);
  const maxWithdrawal = Number(withdrawalSettings.maximumWithdrawalAmount ?? 0);
  const availableBalance = Number(walletData.availableBalance ?? walletData.balance ?? 0);

  useEffect(() => {
    let active = true;
    Promise.all([getOwnWithdrawals(), getWallet(), getWithdrawalSettings()])
      .then(([withdrawalsRes, walletRes, settingsRes]) => {
        if (!active) return;
        setHistory(toArray(withdrawalsRes).map(mapWithdrawal));
        const walletPayload = walletRes?.data || walletRes || {};
        setWalletData(walletPayload.wallet || walletPayload || {});
        const normalizedSettings = normalizeSettings(walletPayload.withdrawalSettings || settingsRes);
        setWithdrawalSettings(normalizedSettings);
        setAmount(String(normalizedSettings.minimumWithdrawalAmount));
      })
      .catch(() => {
        if (!active) return;
        setHistory([]);
        setWalletData({});
        setWithdrawalSettings(DEFAULT_WITHDRAWAL_SETTINGS);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async () => {
    const value = Number(amount || 0);
    if (!withdrawalSettings.withdrawalEnabled) {
      setMessage('Withdrawals are currently disabled by admin.');
      return;
    }
    if (value < minWithdrawal) {
      setMessage(`Minimum withdrawal amount is ${formatCurrency(minWithdrawal)}.`);
      return;
    }
    if (maxWithdrawal > 0 && value > maxWithdrawal) {
      setMessage(`Maximum withdrawal per request is ${formatCurrency(maxWithdrawal)}.`);
      return;
    }
    if (value > availableBalance) {
      setMessage(`Amount exceeds available balance of ${formatCurrency(availableBalance)}.`);
      return;
    }

    try {
      await requestWithdrawal({ requestedAmount: value, method });
      const refreshed = await getOwnWithdrawals();
      setHistory(toArray(refreshed).map(mapWithdrawal));
      setMessage(`Withdrawal request for ${formatCurrency(value)} submitted.`);
    } catch (error) {
      setMessage(error?.message || 'Unable to submit withdrawal request.');
    }
  };

  const handleReset = () => {
    setAmount(String(minWithdrawal));
    setMethod('Bank Transfer');
    setMessage('');
  };

  const stats = useMemo(
    () => [
      { title: 'Available Balance', value: availableBalance, icon: Wallet, tone: 'blue', valueType: 'currency', note: 'current wallet balance' },
      { title: 'Minimum Withdrawal', value: minWithdrawal, icon: Banknote, tone: 'amber', valueType: 'currency', note: 'required minimum' },
      { title: 'Maximum Request', value: maxWithdrawal > 0 ? maxWithdrawal : 'Unlimited', icon: ShieldCheck, tone: 'emerald', valueType: maxWithdrawal > 0 ? 'currency' : 'text', note: 'per request' },
      { title: 'Method', value: withdrawalSettings.preferredMethod || method, icon: CreditCard, tone: 'violet', note: withdrawalSettings.processingTime || 'standard review' },
    ],
    [availableBalance, minWithdrawal, maxWithdrawal, withdrawalSettings, method],
  );

  const columns = [
    { key: 'id', label: 'Request ID' },
    { key: 'requestedOn', label: 'Requested On' },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => formatCurrency(row.amount),
    },
    { key: 'method', label: 'Method' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge label={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Withdraw</h2>
        <p className="section-copy mt-3 max-w-3xl">
          Request a wallet withdrawal, review payout requirements, and track your recent withdrawal
          history.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SectionCard title="Withdrawal Request" subtitle="Submit a new payout request from your wallet balance.">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Amount</label>
              <input
                type="number"
                className="input-shell"
                value={amount}
                min={minWithdrawal}
                max={maxWithdrawal > 0 ? maxWithdrawal : undefined}
                disabled={!withdrawalSettings.withdrawalEnabled}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Method</label>
              <select
                className="input-shell"
                value={method}
                onChange={(event) => setMethod(event.target.value)}
              >
                <option>Bank Transfer</option>
                <option>UPI</option>
              </select>
            </div>
          </div>
          <div className="mt-5 rounded-[24px] border border-blue-100 bg-blue-50 p-5 text-sm leading-7 text-blue-700">
            Preview: You are requesting <strong>{formatCurrency(Number(amount || 0))}</strong> via{' '}
            <strong>{method}</strong>. Withdrawals start from{' '}
            <strong>{formatCurrency(minWithdrawal)}</strong>
            {maxWithdrawal > 0 ? <> and max out at <strong>{formatCurrency(maxWithdrawal)}</strong> per request</> : null}.
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={handleSubmit} className="btn-primary" disabled={!withdrawalSettings.withdrawalEnabled}>Submit Request</button>
            <button type="button" onClick={handleReset} className="btn-secondary">Reset</button>
          </div>
          {message && <p className="mt-4 text-sm text-slate-500">{message}</p>}
        </SectionCard>

        <SectionCard title="Withdrawal Notes" subtitle="Important information before you submit.">
          <div className="space-y-4">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              Available balance: <span className="font-semibold text-slate-900">{formatCurrency(availableBalance)}</span>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              Standard processing: <span className="font-semibold text-slate-900">{withdrawalSettings.processingTime || 'within 24 hours'}</span>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              Daily limit: <span className="font-semibold text-slate-900">{withdrawalSettings.dailyWithdrawalLimit > 0 ? formatCurrency(withdrawalSettings.dailyWithdrawalLimit) : 'No daily cap'}</span>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              Monthly limit: <span className="font-semibold text-slate-900">{withdrawalSettings.monthlyWithdrawalLimit > 0 ? formatCurrency(withdrawalSettings.monthlyWithdrawalLimit) : 'No monthly cap'}</span>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              Payout verification: <span className="font-semibold text-slate-900">bank/KYC must remain verified</span>
            </div>
          </div>
        </SectionCard>
      </div>

      <DataTable
        title="Recent Withdrawals"
        description="Track the result of your latest wallet withdrawal requests."
        data={history}
        columns={columns}
        searchableKeys={['id', 'requestedOn', 'method', 'status']}
        searchPlaceholder="Search withdrawal history..."
        filterKey="status"
        filterOptions={['Completed', 'Pending', 'Rejected']}
      />
    </div>
  );
}

export default Withdraw;
