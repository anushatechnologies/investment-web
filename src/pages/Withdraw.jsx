import { Banknote, CreditCard, ShieldCheck, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { getOwnWithdrawals, requestWithdrawal, getWallet } from '../services/api';
import { formatCurrency } from '../utils/formatters';

function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.withdrawals)) return payload.withdrawals;
  return [];
}

function Withdraw() {
  const [amount, setAmount] = useState('1000');
  const [method, setMethod] = useState('Bank Transfer');
  const [history, setHistory] = useState([]);
  const [walletData, setWalletData] = useState({});
  const [message, setMessage] = useState('');

  const minWithdrawal = Number(walletData.minWithdrawal ?? 1000);

  useEffect(() => {
    let active = true;
    Promise.all([getOwnWithdrawals(), getWallet()])
      .then(([withdrawalsRes, walletRes]) => {
        if (!active) return;
        setHistory(
          toArray(withdrawalsRes).map((item, index) => ({
            id: item.id || item.withdrawalId || `WDL${index + 1}`,
            requestedOn: item.requestedOn || item.createdAt || '-',
            amount: Number(item.requestedAmount ?? item.amount ?? 0),
            method: item.method || item.mode || 'Bank Transfer',
            status: item.status || 'Pending',
          })),
        );
        setWalletData(walletRes?.data || walletRes || {});
      })
      .catch(() => {
        if (!active) return;
        setHistory([]);
        setWalletData({});
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async () => {
    const value = Number(amount || 0);
    if (value < minWithdrawal) {
      setMessage(`Minimum withdrawal amount is ${formatCurrency(minWithdrawal)}.`);
      return;
    }

    try {
      await requestWithdrawal({ requestedAmount: value, method });
      const refreshed = await getOwnWithdrawals();
      setHistory(
        toArray(refreshed).map((item, index) => ({
          id: item.id || item.withdrawalId || `WDL${index + 1}`,
          requestedOn: item.requestedOn || item.createdAt || '-',
          amount: Number(item.requestedAmount ?? item.amount ?? 0),
          method: item.method || item.mode || 'Bank Transfer',
          status: item.status || 'Pending',
        })),
      );
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
      { title: 'Available Balance', value: Number(walletData.availableBalance ?? walletData.balance ?? 0), icon: Wallet, tone: 'blue', valueType: 'currency', note: 'current wallet balance' },
      { title: 'Minimum Withdrawal', value: minWithdrawal, icon: Banknote, tone: 'amber', valueType: 'currency', note: 'required minimum' },
      { title: 'Review Window', value: walletData.processingTime || '24 hours', icon: ShieldCheck, tone: 'emerald', note: 'standard approval time' },
      { title: 'Method', value: walletData.preferredMethod || method, icon: CreditCard, tone: 'violet', note: 'currently selected' },
    ],
    [walletData, minWithdrawal, method],
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
            <strong>{formatCurrency(minWithdrawal)}</strong>.
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={handleSubmit} className="btn-primary">Submit Request</button>
            <button type="button" onClick={handleReset} className="btn-secondary">Reset</button>
          </div>
          {message && <p className="mt-4 text-sm text-slate-500">{message}</p>}
        </SectionCard>

        <SectionCard title="Withdrawal Notes" subtitle="Important information before you submit.">
          <div className="space-y-4">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              Available balance: <span className="font-semibold text-slate-900">{formatCurrency(Number(walletData.availableBalance ?? walletData.balance ?? 0))}</span>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              Standard processing: <span className="font-semibold text-slate-900">{walletData.processingTime || 'within 24 hours'}</span>
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
