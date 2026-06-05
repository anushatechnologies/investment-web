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
          className="rounded-xl border border-blue-500/20 bg-blue-500/15 px-3 py-2 text-xs font-semibold text-blue-100"
        >
          View
        </button>
      ),
    },
  ];

  const canReviewReceipt = viewedRequest && String(viewedRequest.status).toUpperCase() === 'RECEIPT_UPLOADED';
  const canActivateInvestment = viewedRequest && viewedRequest.receiptApproved && String(viewedRequest.status).toUpperCase() !== 'ACTIVE';

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">
          Deposit confirmation queue
        </p>
        <h1 className="section-title mt-3">Payment Verification</h1>
        <p className="section-copy mt-3 max-w-3xl">
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

      <SectionCard
        title="Verification Policy"
        subtitle="Receipt review happens before investment activation."
      >
        <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5 text-sm leading-7 text-blue-100">
          Backend status flow: `RECEIPT_UPLOADED`, then receipt approval or rejection, then
          `ACTIVE` once the admin activates the investment.
        </div>
      </SectionCard>

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
      {message && <p className="text-sm text-slate-400">{message}</p>}

      {viewedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-2xl overflow-hidden border border-white/10 bg-[#08152f]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h3 className="font-heading text-lg font-semibold text-white">Investment Receipt Review</h3>
              <button onClick={() => setViewedRequest(null)} className="text-slate-400 hover:text-white">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-5 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-400">Investment ID</p>
                  <p className="font-medium text-white">{viewedRequest.id}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Investor ID</p>
                  <p className="font-medium text-white">{viewedRequest.investorUserId}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Amount</p>
                  <p className="font-medium text-white">{formatCurrency(Number(viewedRequest.investmentAmount ?? 0))}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Current Status</p>
                  <div className="mt-1">
                    <StatusBadge label={viewedRequest.status || 'PENDING'} />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-slate-300">
                The current backend exposes investment-level receipt review and activation actions,
                but it does not yet return a direct receipt file URL in this queue response.
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Rejection Reason</label>
                <textarea
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  className="input-shell min-h-[96px] w-full resize-none"
                  placeholder="Required only when rejecting a receipt"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Activation Notes</label>
                <textarea
                  value={activationNotes}
                  onChange={(event) => setActivationNotes(event.target.value)}
                  className="input-shell min-h-[96px] w-full resize-none"
                  placeholder="Optional notes when activating the investment"
                />
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button type="button" onClick={() => setViewedRequest(null)} className="btn-secondary">
                Close
              </button>
              {canReviewReceipt && (
                <>
                  <button
                    type="button"
                    onClick={() => handleVerify(false)}
                    disabled={actionLoading}
                    className="rounded-xl border border-rose-500/20 bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-200 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Reject Receipt'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerify(true)}
                    disabled={actionLoading}
                    className="rounded-xl border border-emerald-500/20 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Approve Receipt'}
                  </button>
                </>
              )}
              {canActivateInvestment && (
                <button
                  type="button"
                  onClick={handleActivate}
                  disabled={actionLoading}
                  className="rounded-xl border border-blue-500/20 bg-blue-500/15 px-4 py-2 text-sm font-semibold text-blue-100 disabled:opacity-50"
                >
                  {actionLoading ? 'Activating...' : 'Activate Investment'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentVerificationPage;
