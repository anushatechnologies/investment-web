import { ArrowDownLeft, ArrowUpRight, Banknote, Wallet as WalletIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { getWallet, getWalletTransactions } from '../services/api';
import { formatCurrency } from '../utils/formatters';

function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.transactions)) return payload.transactions;
  return [];
}

function Wallet() {
  const [walletData, setWalletData] = useState({});
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([getWallet(), getWalletTransactions()])
      .then(([walletResponse, transactionsResponse]) => {
        if (!active) return;
        const walletPayload = walletResponse?.data || walletResponse || {};
        setWalletData(walletPayload.wallet || walletPayload || {});
        setTransactions(toArray(transactionsResponse).length ? toArray(transactionsResponse) : toArray(walletPayload.recentTransactions));
      })
      .catch(() => {
        if (!active) return;
        setWalletData({});
        setTransactions([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const availableBalance = Number(walletData.availableBalance ?? walletData.balance ?? 0);
  const pendingBalance = Number(walletData.pendingBalance ?? 0);
  const lockedBalance = Number(walletData.lockedBalance ?? 0);

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
        source: item.source || item.type || item.description || '-',
        amount: Number(item.amount ?? 0),
        status: item.status || 'Unknown',
      })),
    [transactions],
  );

  const stats = [
    { title: 'Available Balance', value: availableBalance, icon: WalletIcon, tone: 'blue', valueType: 'currency', note: 'ready to use' },
    { title: 'Minimum Withdraw', value: Number(walletData.minWithdrawal ?? 1000), icon: ArrowDownLeft, tone: 'amber', valueType: 'currency', note: 'per request' },
    { title: 'Processing Time', value: walletData.processingTime || '24 hours', icon: ArrowUpRight, tone: 'violet', note: 'standard payout window' },
    { title: 'Preferred Method', value: walletData.preferredMethod || 'Bank Transfer', icon: Banknote, tone: 'emerald', note: 'current payout method' },
  ];

  const columns = [
    { key: 'id', label: 'Entry ID' },
    { key: 'date', label: 'Date' },
    { key: 'source', label: 'Source' },
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
              Withdrawals above {formatCurrency(Number(walletData.minWithdrawal ?? 1000))} can be requested from the Withdraw page and are processed within the standard review window.
            </div>
          </div>
        </SectionCard>
      </div>

      <DataTable
        title="Wallet Ledger"
        description="Chronological record of wallet credits, deductions, and referral earnings."
        data={walletLedger}
        columns={columns}
        searchableKeys={['id', 'date', 'source', 'status']}
        searchPlaceholder="Search wallet entries..."
        filterKey="status"
        filterOptions={['Credited', 'Completed', 'Success']}
      />
    </div>
  );
}

export default Wallet;
