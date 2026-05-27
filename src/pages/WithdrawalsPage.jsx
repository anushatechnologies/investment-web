import { CheckCircle2, Clock3, Wallet, XCircle } from 'lucide-react';
import { useState } from 'react';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { platformRules, withdrawalRequests, withdrawalStats } from '../data/adminData';
import { formatCurrency } from '../utils/formatters';

const statIcons = [Clock3, Wallet, CheckCircle2, XCircle];
const statTones = ['blue', 'emerald', 'cyan', 'violet'];

function ActionButtons({ row, onAction }) {
  return (
    <div className="flex items-center gap-2">
      {row.status === 'Pending' && (
        <>
          <button type="button" onClick={() => onAction('Approved', row)} className="rounded-xl border border-emerald-500/20 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200">
            Approve
          </button>
          <button type="button" onClick={() => onAction('Rejected', row)} className="rounded-xl border border-rose-500/20 bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-200">
            Reject
          </button>
        </>
      )}
      <button type="button" onClick={() => onAction('Viewed', row)} className="rounded-xl border border-blue-500/20 bg-blue-500/15 px-3 py-2 text-xs font-semibold text-blue-100">
        View
      </button>
    </div>
  );
}

function WithdrawalsPage() {
  const [requests, setRequests] = useState(withdrawalRequests);
  const [message, setMessage] = useState('');
  const [viewedRequest, setViewedRequest] = useState(null);

  const handleAction = (action, row) => {
    if (action === 'Approved') {
      setRequests(requests.map(req => req.id === row.id ? { ...req, status: 'Approved' } : req));
      setMessage(`Approved withdrawal ${row.id} for ${row.investorName}.`);
    } else if (action === 'Rejected') {
      setRequests(requests.map(req => req.id === row.id ? { ...req, status: 'Rejected' } : req));
      setMessage(`Rejected withdrawal ${row.id} for ${row.investorName}.`);
    } else if (action === 'Viewed') {
      setViewedRequest(row);
    }
  };
  const columns = [
    { key: 'id', label: '#ID' },
    { key: 'investorName', label: 'Investor Name' },
    { key: 'account', label: 'Account' },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => formatCurrency(row.amount),
    },
    { key: 'method', label: 'Payment Method' },
    { key: 'requestDate', label: 'Request Date' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge label={row.status} />,
    },
    {
      key: 'action',
      label: 'Action',
      render: (row) => <ActionButtons row={row} onAction={handleAction} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">
          Admin payout queue
        </p>
        <h1 className="section-title mt-3">Withdrawals</h1>
        <p className="section-copy mt-3 max-w-3xl">
          Review wallet withdrawals, enforce the minimum threshold, and approve or reject requests
          before settlement.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {withdrawalStats.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            note={stat.note}
            icon={statIcons[index]}
            tone={statTones[index]}
            valueType={index === 1 ? 'currency' : 'number'}
          />
        ))}
      </div>

      <SectionCard
        title="Withdrawal Workflow"
        subtitle="Every wallet payout remains approval-driven and follows the configured threshold policy."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Minimum wallet withdrawal</p>
            <p className="mt-3 font-heading text-xl font-semibold text-white">
              {formatCurrency(platformRules.minWithdrawal)}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Approval policy</p>
            <p className="mt-3 font-heading text-xl font-semibold text-white">Admin approval required</p>
          </div>
          <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5 text-sm leading-7 text-blue-100">
            Pending requests stay in queue until the admin validates wallet balance, banking details,
            and fraud risk signals.
          </div>
        </div>
      </SectionCard>

      <DataTable
        title="Withdrawal Requests"
        description="Use approval actions to process withdrawal requests while keeping an audit-friendly queue."
        data={requests}
        itemsPerPage={20}
        columns={columns}
        searchableKeys={['id', 'investorName', 'account', 'method']}
        searchPlaceholder="Search by name, account, or payment method..."
        filterKey="method"
        filterOptions={['Bank Transfer', 'UPI']}
      />
      {message && <p className="text-sm text-slate-400">{message}</p>}

      {viewedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md overflow-hidden border border-white/10 bg-[#08152f]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h3 className="font-heading text-lg font-semibold text-white">Withdrawal Details</h3>
              <button onClick={() => setViewedRequest(null)} className="text-slate-400 hover:text-white">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-slate-400">Investor</p>
                <p className="text-white font-medium">{viewedRequest.investorName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Amount</p>
                <p className="text-white font-medium">{formatCurrency(viewedRequest.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Payment Method</p>
                <p className="text-white font-medium">{viewedRequest.method} ({viewedRequest.account})</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Status</p>
                <div className="mt-1">
                  <StatusBadge label={viewedRequest.status} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WithdrawalsPage;
