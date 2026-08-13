import { CheckCircle2, Clock3, Receipt, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import {
  adminActivateInvestment,
  adminGetAllInvestments,
  adminGetPendingInvestments,
  adminVerifyReceipt,
} from '../services/api';
import { formatCurrency } from '../utils/formatters';

const statIcons = [Receipt, Clock3, CheckCircle2, XCircle];
const statTones = ['blue', 'amber', 'emerald', 'violet'];

function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function PaymentVerificationPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [viewedRequest, setViewedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [activationNotes, setActivationNotes] = useState('');

  useEffect(() => {
    let active = true;

    async function loadRequests() {
      setLoading(true);
      try {
        const [pendingRes, allRes] = await Promise.all([
          adminGetPendingInvestments().catch(() => []),
          adminGetAllInvestments().catch(() => []),
        ]);

        if (!active) return;

        const pending = toArray(pendingRes);
        const all = toArray(allRes);
        const pendingIds = new Set(pending.map((item) => item.id));
        const receiptApproved = all.filter((item) => item.receiptApproved && String(item.status).toUpperCase() !== 'ACTIVE');
        const merged = [...pending, ...receiptApproved.filter((item) => !pendingIds.has(item.id))];
        setRequests(merged);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRequests();
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const pendingCount = requests.filter((item) => String(item.status).toUpperCase() === 'RECEIPT_UPLOADED').length;
    const readyToActivate = requests.filter((item) => item.receiptApproved && String(item.status).toUpperCase() !== 'ACTIVE').length;
    const activeCount = requests.filter((item) => String(item.status).toUpperCase() === 'ACTIVE').length;
    const rejectedCount = requests.filter((item) => String(item.status).toUpperCase() === 'REJECTED').length;

    return [
      { title: 'Receipt Queue', value: pendingCount, note: 'awaiting admin review' },
      { title: 'Awaiting Activation', value: readyToActivate, note: 'receipt approved' },
      { title: 'Active Investments', value: activeCount, note: 'already activated' },
      { title: 'Rejected', value: rejectedCount, note: 'receipt rejected' },
    ];
  }, [requests]);

  const updateRequest = (investmentId, updater) => {
    setRequests((current) => current.map((item) => (item.id === investmentId ? { ...item, ...updater(item) } : item)));
    setViewedRequest((current) => (current?.id === investmentId ? { ...current, ...updater(current) } : current));
  };

  const handleVerify = async (approved) => {
    if (!viewedRequest) return;
    if (!approved && !rejectionReason.trim()) {
      setMessage('Rejection reason is required before rejecting a receipt.');
      return;
    }

    setActionLoading(true);
    setMessage('');
    try {
      await adminVerifyReceipt(viewedRequest.id, approved, rejectionReason.trim());
      updateRequest(viewedRequest.id, () => ({
        status: approved ? 'RECEIPT_VERIFIED' : 'REJECTED',
        receiptApproved: approved,
      }));
      setMessage(approved ? `Receipt approved for ${viewedRequest.id}.` : `Receipt rejected for ${viewedRequest.id}.`);
      setRejectionReason('');
    } catch (error) {
      setMessage(error.message || 'Unable to update receipt status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!viewedRequest) return;
    setActionLoading(true);
    setMessage('');
    try {
      await adminActivateInvestment(viewedRequest.id, activationNotes.trim());
      updateRequest(viewedRequest.id, () => ({
        status: 'ACTIVE',
      }));
      setMessage(`Investment ${viewedRequest.id} activated.`);
      setViewedRequest((current) => current ? { ...current, status: 'ACTIVE' } : current);
    } catch (error) {
      setMessage(error.message || 'Unable to activate investment.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { key: 'id', label: 'Investment ID' },
    { key: 'investorUserId', label: 'Investor ID' },
    {
      key: 'investmentAmount',
      label: 'Amount',
      exportValue: (row) => Number(row.investmentAmount ?? 0),
      render: (row) => formatCurrency(Number(row.investmentAmount ?? 0)),
    },
    {
      key: 'appliedAt',
      label: 'Applied On',
      render: (row) => row.appliedAt ? new Date(row.appliedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
    },
    {
      key: 'status',
      label: 'Status',
      exportValue: (row) => row.status || 'PENDING',
      render: (row) => <StatusBadge label={row.status || 'PENDING'} />,
    },
    {
      key: 'receiptApproved',
      label: 'Receipt',
      exportValue: (row) => (row.receiptApproved ? 'APPROVED' : 'PENDING'),
      render: (row) => <StatusBadge label={row.receiptApproved ? 'APPROVED' : 'PENDING'} />,
    },
    {
      key: 'action',
      label: 'Action',
      render: (row) => (
        <button
          type="button"
          onClick={() => {
            setViewedRequest(row);
            setMessage('');
            setRejectionReason('');
            setActivationNotes(row.notes || '');
          }}
          className={`rounded-xl px-4 py-2 text-xs font-bold tracking-wide transition-all duration-200 ${
            viewedRequest?.id === row.id
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/30'
              : 'border border-slate-500/20 bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:border-transparent hover:from-blue-500 hover:to-indigo-600 hover:shadow-md hover:shadow-blue-500/20 dark:border-white/10 dark:from-white/[0.06] dark:to-white/[0.04] dark:text-slate-200'
          }`}
        >
          {viewedRequest?.id === row.id ? '● Active' : 'View'}
        </button>
      ),
    },
  ];

  const canReviewReceipt = viewedRequest && String(viewedRequest.status).toUpperCase() === 'RECEIPT_UPLOADED';
  const canActivateInvestment = viewedRequest && viewedRequest.receiptApproved && String(viewedRequest.status).toUpperCase() !== 'ACTIVE';

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-500/[0.08] dark:via-[#071226] dark:to-indigo-500/[0.04] p-6 shadow-lg shadow-blue-500/5">
        <div className="absolute right-0 top-0 h-32 w-32 -translate-y-6 translate-x-6 rounded-full bg-blue-400/10 blur-2xl" />
        <div className="absolute bottom-0 left-0 h-24 w-24 -translate-x-4 translate-y-4 rounded-full bg-indigo-400/10 blur-xl" />
        <p className="relative text-xs font-bold uppercase tracking-[0.28em] text-blue-600 dark:text-blue-400">
          Deposit confirmation queue
        </p>
        <h1 className="relative section-title mt-2">Payment Verification</h1>
        <p className="relative section-copy mt-2 max-w-3xl">
          Review receipt-uploaded investments, approve or reject the payment evidence, and activate
          the investment once the receipt is accepted.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            note={stat.note}
            icon={statIcons[index]}
            tone={statTones[index]}
            valueType="number"
          />
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#071226] shadow-sm">
        <div className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] px-5 py-4">
          <h2 className="text-base font-bold text-slate-800 dark:text-white">Verification Policy</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Backend status flow for processing investments.</p>
        </div>
        <div className="grid gap-0 divide-y divide-slate-200 dark:divide-white/[0.06] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {[
            { step: '01', title: 'Receipt Uploaded', color: 'amber', icon: '🧾', desc: 'Investor uploads their payment receipt, moving status to RECEIPT_UPLOADED.' },
            { step: '02', title: 'Receipt Verification', color: 'blue', icon: '🔍', desc: 'Admin reviews the receipt. Can be approved or rejected with a reason.' },
            { step: '03', title: 'Investment Activation', color: 'emerald', icon: '✅', desc: 'Once approved, admin explicitly activates the investment making it ACTIVE.' },
          ].map(({ step, title, color, icon, desc }) => (
            <div key={step} className={`relative overflow-hidden p-6 ${
              color === 'blue'    ? 'bg-blue-50/80 dark:bg-blue-500/[0.05]' :
              color === 'amber'   ? 'bg-amber-50/80 dark:bg-amber-500/[0.05]' :
                                    'bg-emerald-50/80 dark:bg-emerald-500/[0.05]'
            }`}>
              <span className={`absolute -bottom-2 -right-1 select-none text-7xl font-black leading-none opacity-[0.07] ${
                color === 'blue' ? 'text-blue-600' : color === 'amber' ? 'text-amber-600' : 'text-emerald-600'
              }`}>{step}</span>
              <div className="mb-3 flex items-center gap-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl border text-lg font-bold ${
                  color === 'blue'    ? 'border-blue-200 bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/20' :
                  color === 'amber'   ? 'border-amber-200 bg-amber-100 dark:border-amber-500/30 dark:bg-amber-500/20' :
                                        'border-emerald-200 bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/20'
                }`}>{icon}</span>
                <p className={`text-[10px] font-black uppercase tracking-widest ${
                  color === 'blue' ? 'text-blue-600 dark:text-blue-400' : color === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}>Step {step}</p>
              </div>
              <p className="mb-2 text-sm font-bold text-slate-800 dark:text-white">{title}</p>
              <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <DataTable
        title="Investment Receipt Queue"
        description="Live admin queue backed by `/api/admin/investments` and receipt verification actions."
        data={requests}
        itemsPerPage={20}
        columns={columns}
        searchableKeys={['id', 'investorUserId', 'status']}
        searchPlaceholder="Search by investment ID, investor ID, or status..."
        filterKey="status"
        filterOptions={['RECEIPT_UPLOADED', 'REJECTED', 'ACTIVE']}
        loading={loading}
        enableCsvExport
        exportFileName="investment-receipt-queue"
      />
      {message && <p className="text-sm text-slate-500 dark:text-slate-300">{message}</p>}

      {Boolean(viewedRequest) && (
        <div className="fixed inset-0 z-[1600] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_32px_90px_rgba(0,0,0,0.2)] dark:border-white/[0.08] dark:bg-[#071226] dark:shadow-[0_32px_90px_rgba(0,0,0,0.6)]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200/60 bg-gradient-to-r from-blue-500/5 to-transparent px-6 py-4 dark:border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10">
                  <Receipt className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Investment Receipt Review</h3>
                  <p className="text-[11px] text-slate-400">ID #{viewedRequest.id}</p>
                </div>
              </div>
              <button
                onClick={() => setViewedRequest(null)}
                className="rounded-xl border border-slate-200/60 bg-slate-50 p-2 text-slate-400 transition hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-500 dark:border-white/10 dark:bg-white/[0.04] dark:hover:text-blue-400"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Investment ID', content: <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{viewedRequest.id}</span> },
                  { label: 'Investor ID', content: <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{viewedRequest.investorUserId}</span> },
                  { label: 'Amount', content: <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatCurrency(Number(viewedRequest.investmentAmount ?? 0))}</span> },
                  { label: 'Current Status', content: <StatusBadge label={viewedRequest.status || 'PENDING'} /> },
                ].map(({ label, content }, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200/60 bg-slate-50/40 p-3 dark:border-white/[0.07] dark:bg-white/[0.02]">
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>
                    {content}
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 text-sm leading-6 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200">
                The current backend exposes investment-level receipt review and activation actions,
                but it does not yet return a direct receipt file URL in this queue response.
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  className="w-full min-h-[96px] resize-none rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 text-sm text-slate-800 placeholder-slate-400 transition duration-200 focus:border-rose-500/40 focus:outline-none focus:ring-2 focus:ring-rose-500/25 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-100 dark:placeholder-slate-500"
                  placeholder="Required only when rejecting a receipt"
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Activation Notes
                </label>
                <textarea
                  value={activationNotes}
                  onChange={(event) => setActivationNotes(event.target.value)}
                  className="w-full min-h-[96px] resize-none rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 text-sm text-slate-800 placeholder-slate-400 transition duration-200 focus:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-100 dark:placeholder-slate-500"
                  placeholder="Optional notes when activating the investment"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-slate-200/60 bg-slate-50/50 px-6 py-4 dark:border-white/[0.08] dark:bg-white/[0.02]">
              <button
                onClick={() => setViewedRequest(null)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200/60 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.07]"
              >
                <XCircle className="h-4 w-4" />
                Close
              </button>
              <div className="flex items-center gap-2">
                {canReviewReceipt && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleVerify(false)}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-bold text-rose-600 transition-all duration-200 hover:border-rose-500/50 hover:bg-rose-500/20 disabled:opacity-50 dark:text-rose-400"
                    >
                      {actionLoading ? 'Processing...' : 'Reject Receipt'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerify(true)}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-600 transition-all duration-200 hover:border-emerald-500/50 hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-400"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {actionLoading ? 'Processing...' : 'Approve Receipt'}
                    </button>
                  </>
                )}
                {canActivateInvestment && (
                  <button
                    type="button"
                    onClick={handleActivate}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/35 disabled:opacity-50"
                  >
                    {actionLoading ? 'Activating...' : 'Activate Investment'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentVerificationPage;
