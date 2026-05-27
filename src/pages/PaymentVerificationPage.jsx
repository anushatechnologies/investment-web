import { CheckCircle2, Clock3, Receipt, XCircle } from 'lucide-react';
import { useState } from 'react';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { paymentRequests, paymentVerificationStats } from '../data/adminData';
import { formatCurrency } from '../utils/formatters';

const statIcons = [Receipt, Clock3, CheckCircle2, XCircle];
const statTones = ['blue', 'amber', 'emerald', 'violet'];

function ReceiptPreview({ label }) {
  return (
    <div className="flex h-16 w-12 flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-b from-white to-slate-300 p-2 text-[7px] font-bold uppercase tracking-[0.2em] text-slate-700 shadow-lg shadow-slate-950/20">
      <span>{label.includes('UPI') ? 'UPI' : 'BANK'}</span>
      <div className="space-y-1">
        <div className="h-[2px] rounded bg-slate-400" />
        <div className="h-[2px] rounded bg-slate-400" />
        <div className="h-[2px] w-3/4 rounded bg-slate-400" />
      </div>
    </div>
  );
}

function PaymentVerificationPage() {
  const [requests, setRequests] = useState(paymentRequests);
  const [message, setMessage] = useState('');
  const [viewedRequest, setViewedRequest] = useState(null);

  const handleAction = (action, row) => {
    if (action === 'Verified') {
      setRequests(requests.map(req => req.id === row.id ? { ...req, status: 'Verified' } : req));
      setMessage(`Verified payment request ${row.id} for ${row.investorName}.`);
    } else if (action === 'Rejected') {
      setRequests(requests.map(req => req.id === row.id ? { ...req, status: 'Rejected' } : req));
      setMessage(`Rejected payment request ${row.id} for ${row.investorName}.`);
    } else if (action === 'Viewed') {
      setViewedRequest(row);
    }
  };
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'investorName', label: 'Investor Name' },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => formatCurrency(row.amount),
    },
    { key: 'paymentMethod', label: 'Payment Method' },
    {
      key: 'receiptType',
      label: 'Receipt Preview',
      render: (row) => <ReceiptPreview label={row.receiptType} />,
    },
    { key: 'requestDate', label: 'Request Date' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge label={row.status} />,
    },
    {
      key: 'action',
      label: 'Action',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.status === 'Pending' && (
            <>
              <button
                type="button"
                onClick={() => handleAction('Verified', row)}
                className="rounded-xl border border-emerald-500/20 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200"
              >
                Verify
              </button>
              <button
                type="button"
                onClick={() => handleAction('Rejected', row)}
                className="rounded-xl border border-rose-500/20 bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-200"
              >
                Reject
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => handleAction('Viewed', row)}
            className="rounded-xl border border-blue-500/20 bg-blue-500/15 px-3 py-2 text-xs font-semibold text-blue-100"
          >
            View
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">
          Deposit confirmation queue
        </p>
        <h1 className="section-title mt-3">Payment Verification</h1>
        <p className="section-copy mt-3 max-w-3xl">
          Review uploaded payment receipts, confirm deposit evidence, and approve credits before
          investor balances are updated.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {paymentVerificationStats.map((stat, index) => (
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

      <SectionCard
        title="Verification Policy"
        subtitle="Receipts are checked manually by admin before investment ledger entries are marked complete."
      >
        <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5 text-sm leading-7 text-blue-100">
          Uploaded bank slips and UPI receipts remain in the pending queue until an admin verifies
          proof of payment and clears any fraud or mismatch concerns.
        </div>
      </SectionCard>

      <DataTable
        title="Payment Requests"
        description="Search and process payment receipts with verify and reject actions."
        data={requests}
        itemsPerPage={20}
        columns={columns}
        searchableKeys={['id', 'investorName', 'paymentMethod', 'receiptType']}
        searchPlaceholder="Search by investor, request ID, or payment method..."
        filterKey="status"
        filterOptions={['Pending', 'Verified', 'Rejected']}
      />
      {message && <p className="text-sm text-slate-400">{message}</p>}

      {viewedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md overflow-hidden border border-white/10 bg-[#08152f]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h3 className="font-heading text-lg font-semibold text-white">Payment Details</h3>
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
                <p className="text-white font-medium">{viewedRequest.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Request Date</p>
                <p className="text-white font-medium">{viewedRequest.requestDate}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Status</p>
                <div className="mt-1">
                  <StatusBadge label={viewedRequest.status} />
                </div>
              </div>
              <div className="pt-4 border-t border-white/10">
                <p className="text-sm text-slate-400 mb-3">Receipt Document</p>
                <div className="h-48 w-full sm:w-64 mx-auto rounded-xl border border-white/10 bg-gradient-to-b from-slate-100 to-slate-300 p-4 shadow-xl flex flex-col">
                  <div className="flex justify-between items-center border-b border-slate-400/30 pb-2 mb-3">
                    <span className="font-bold text-slate-700 text-xs tracking-wider">
                      {viewedRequest.receiptType?.includes('UPI') ? 'UPI RECEIPT' : 'BANK SLIP'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="h-1.5 w-3/4 bg-slate-400/40 rounded" />
                    <div className="h-1.5 w-1/2 bg-slate-400/40 rounded" />
                    <div className="h-1.5 w-full bg-slate-400/40 rounded" />
                    <div className="h-1.5 w-5/6 bg-slate-400/40 rounded" />
                  </div>
                  <div className="mt-auto pt-3 border-t border-slate-400/30 flex justify-between items-end">
                    <span className="text-slate-500 text-[10px] font-semibold tracking-widest">AMOUNT PAID</span>
                    <span className="font-bold text-slate-800">{formatCurrency(viewedRequest.amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentVerificationPage;
