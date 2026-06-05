import { ArrowDownLeft, ArrowUpRight, Banknote, Wallet as WalletIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { getWallet, getWalletTransactionProof, getWalletTransactions, getWithdrawalSettings } from '../services/api';
import { formatCurrency } from '../utils/formatters';

function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.transactions)) return payload.transactions;
  return [];
}

function readableTransactionType(type) {
  const value = String(type || '').toUpperCase();
  if (value === 'REFERRAL_INSTANT_CASHBACK') return 'Referral Instant Cashback';
  if (value === 'REFERRAL_MONTHLY_INCOME') return 'Referral Monthly Income';
  if (value === 'INTEREST_CREDIT') return 'Monthly Interest';
  if (value === 'COUPON_CASHBACK') return 'Coupon Cashback';
  if (value === 'WITHDRAWAL_DEBIT') return 'Withdrawal';
  if (value === 'REFERRAL_COMMISSION') return 'Referral Income';
  return String(type || '-').replaceAll('_', ' ');
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

function Wallet() {
  const [walletData, setWalletData] = useState({});
  const [withdrawalSettings, setWithdrawalSettings] = useState(DEFAULT_WITHDRAWAL_SETTINGS);
  const [transactions, setTransactions] = useState([]);
  const [selectedProof, setSelectedProof] = useState(null);
  const [proofLoadingId, setProofLoadingId] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([getWallet(), getWalletTransactions(), getWithdrawalSettings()])
      .then(([walletResponse, transactionsResponse, settingsResponse]) => {
        if (!active) return;
        const walletPayload = walletResponse?.data || walletResponse || {};
        setWalletData(walletPayload.wallet || walletPayload || {});
        setWithdrawalSettings(normalizeSettings(walletPayload.withdrawalSettings || settingsResponse));
        setTransactions(toArray(transactionsResponse).length ? toArray(transactionsResponse) : toArray(walletPayload.recentTransactions));
      })
      .catch(() => {
        if (!active) return;
        setWalletData({});
        setWithdrawalSettings(DEFAULT_WITHDRAWAL_SETTINGS);
        setTransactions([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const availableBalance = Number(walletData.availableBalance ?? walletData.balance ?? 0);
  const pendingBalance = Number(walletData.pendingBalance ?? 0);
  const lockedBalance = Number(walletData.lockedBalance ?? 0);
  const minimumWithdrawal = Number(withdrawalSettings.minimumWithdrawalAmount ?? 1000);
  const maximumWithdrawal = Number(withdrawalSettings.maximumWithdrawalAmount ?? 0);

  const walletDonutData = [
    { name: 'Available', value: availableBalance, fill: '#2563eb' },
    { name: 'Pending', value: pendingBalance, fill: '#93c5fd' },
    { name: 'Locked', value: lockedBalance, fill: '#1d4ed8' },
  ];

  const walletLedger = useMemo(
    () =>
      transactions.map((item, index) => ({
        id: item.id || item.transactionId || `TXN${index + 1}`,
        date: item.date || item.createdAt || '-',
        source: item.description || readableTransactionType(item.transactionType || item.type || item.source),
        transactionType: readableTransactionType(item.transactionType || item.type),
        amount:
          (String(item.direction || '').toUpperCase() === 'DEBIT' ? -1 : 1) *
          Number(item.amount ?? 0),
        status: item.status || item.direction || 'Unknown',
      })),
    [transactions],
  );

  const stats = [
    { title: 'Available Balance', value: availableBalance, icon: WalletIcon, tone: 'blue', valueType: 'currency', note: 'ready to use' },
    { title: 'Minimum Withdraw', value: minimumWithdrawal, icon: ArrowDownLeft, tone: 'amber', valueType: 'currency', note: 'per request' },
    { title: 'Maximum Withdraw', value: maximumWithdrawal > 0 ? maximumWithdrawal : 'Unlimited', icon: ArrowUpRight, tone: 'violet', valueType: maximumWithdrawal > 0 ? 'currency' : 'text', note: withdrawalSettings.withdrawalEnabled ? 'per request' : 'withdrawals paused' },
    { title: 'Preferred Method', value: withdrawalSettings.preferredMethod || 'Bank Transfer', icon: Banknote, tone: 'emerald', note: withdrawalSettings.processingTime || 'standard payout window' },
  ];

  const columns = [
    { key: 'id', label: 'Entry ID' },
    { key: 'date', label: 'Date' },
    { key: 'source', label: 'Source' },
    { key: 'transactionType', label: 'Type' },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => (
        <span className={row.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}>
          {row.amount < 0 ? '-' : '+'}
          {formatCurrency(Math.abs(row.amount))}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge label={row.status} />,
    },
    {
      key: 'proof',
      label: 'Proof',
      render: (row) => (
        <button
          type="button"
          onClick={async () => {
            setProofLoadingId(row.id);
            try {
              setSelectedProof(await getWalletTransactionProof(row.id));
            } finally {
              setProofLoadingId('');
            }
          }}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          {proofLoadingId === row.id ? 'Loading...' : 'View'}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Wallet</h2>
        <p className="section-copy mt-3 max-w-3xl">
          Monitor wallet balance, incoming credits, recent deductions, and pending locked amounts.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <SectionCard title="Wallet Breakdown" subtitle="Available, pending, and locked balance distribution.">
          <div className="relative mx-auto h-[260px] w-full max-w-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={walletDonutData} dataKey="value" innerRadius={74} outerRadius={112} paddingAngle={4} />
                <Tooltip
                  formatter={(value, name) => [formatCurrency(value), name]}
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid rgba(226,232,240,1)',
                    borderRadius: '18px',
                    boxShadow: '0 20px 40px rgba(15,23,42,0.08)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-heading text-3xl font-semibold text-slate-900">{formatCurrency(availableBalance)}</span>
              <span className="text-sm text-slate-500">Live balance</span>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Wallet Summary" subtitle="Quick view of payout policy and live wallet conditions.">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Current available</p>
              <p className="mt-3 font-heading text-2xl font-semibold text-slate-900">{formatCurrency(availableBalance)}</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Pending clearance</p>
              <p className="mt-3 font-heading text-2xl font-semibold text-slate-900">{formatCurrency(pendingBalance)}</p>
            </div>
            <div className="rounded-[24px] border border-blue-100 bg-blue-50 p-5 text-sm leading-7 text-blue-700">
              {withdrawalSettings.withdrawalEnabled ? (
                <>
                  Withdrawals start at {formatCurrency(minimumWithdrawal)}
                  {maximumWithdrawal > 0 ? <> and are capped at {formatCurrency(maximumWithdrawal)} per request</> : null}.
                  Daily limit: {withdrawalSettings.dailyWithdrawalLimit > 0 ? formatCurrency(withdrawalSettings.dailyWithdrawalLimit) : 'no cap'}.
                </>
              ) : (
                'Withdrawals are currently paused by admin.'
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      <DataTable
        title="Wallet Ledger"
        description="Chronological record of wallet credits, deductions, and referral earnings."
        data={walletLedger}
        columns={columns}
        searchableKeys={['id', 'date', 'source', 'transactionType', 'status']}
        searchPlaceholder="Search wallet entries..."
        filterKey="status"
        filterOptions={['CREDIT', 'DEBIT', 'Completed', 'Success']}
      />

      {selectedProof && (
        <SectionCard title="Wallet Credit Proof" subtitle="Source details for the selected wallet entry.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Type</p>
              <p className="mt-2 font-semibold text-slate-900">{readableTransactionType(selectedProof.transactionType)}</p>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Amount</p>
              <p className="mt-2 font-semibold text-slate-900">{formatCurrency(Number(selectedProof.amount || 0))}</p>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Direction</p>
              <p className="mt-2 font-semibold text-slate-900">{selectedProof.direction || '-'}</p>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Reference</p>
              <p className="mt-2 break-all text-sm font-semibold text-slate-900">{selectedProof.referenceId || '-'}</p>
            </div>
          </div>

          {selectedProof.referralCommission && (
            <div className="mt-4 rounded-[18px] border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-900">Referral payout details</p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <p className="text-sm text-blue-700">Source investor: <span className="font-semibold">{selectedProof.referralCommission.sourceInvestorName}</span></p>
                <p className="text-sm text-blue-700">Level: <span className="font-semibold">{selectedProof.referralCommission.level}</span></p>
                <p className="text-sm text-blue-700">Rate: <span className="font-semibold">{selectedProof.referralCommission.rate}%</span></p>
                <p className="text-sm text-blue-700">Source: <span className="font-semibold">{selectedProof.referralCommission.sourceAmountLabel}</span></p>
                <p className="text-sm text-blue-700">Source amount: <span className="font-semibold">{formatCurrency(Number(selectedProof.referralCommission.sourceAmount || 0))}</span></p>
                <p className="text-sm text-blue-700">Commission: <span className="font-semibold">{formatCurrency(Number(selectedProof.referralCommission.commissionAmount || 0))}</span></p>
              </div>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}

export default Wallet;
