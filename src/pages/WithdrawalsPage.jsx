import { CheckCircle2, Clock3, Wallet, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import {
  adminApproveWithdrawal,
  adminGetPendingWithdrawals,
  adminProcessWithdrawal,
  adminRejectWithdrawal,
} from '../services/api';
import { formatCurrency } from '../utils/formatters';

const statIcons = [Clock3, Wallet, CheckCircle2, XCircle];
const statTones = ['blue', 'emerald', 'cyan', 'violet'];

function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function WithdrawalsPage() {
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState('');
  const [viewedRequest, setViewedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [bankTransferReference, setBankTransferReference] = useState('');

  useEffect(() => {
    let active = true;

    adminGetPendingWithdrawals()
      .then((response) => {
        if (!active) return;
        setRequests(toArray(response));
      })
      .catch(() => {
        if (!active) return;
        setRequests([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const pendingCount = requests.filter((item) => String(item.status).toUpperCase() === 'PENDING').length;
    const approvedCount = requests.filter((item) => String(item.status).toUpperCase() === 'APPROVED').length;
    const approvedAmount = requests
      .filter((item) => String(item.status).toUpperCase() === 'APPROVED')
      .reduce((sum, item) => sum + Number(item.requestedAmount ?? 0), 0);
    const rejectedCount = requests.filter((item) => String(item.status).toUpperCase() === 'REJECTED').length;

    return [
      { title: 'Pending Requests', value: pendingCount, note: 'awaiting review' },
      { title: 'Approved Amount', value: approvedAmount, note: 'ready to process', valueType: 'currency' },
      { title: 'Approved Count', value: approvedCount, note: 'bank transfer next' },
      { title: 'Rejected Count', value: rejectedCount, note: 'returned to investor' },
    ];
  }, [requests]);

  const updateRequest = (withdrawalId, updater) => {
    setRequests((current) => current.map((item) => (item.id === withdrawalId ? { ...item, ...updater(item) } : item)));
    setViewedRequest((current) => (current?.id === withdrawalId ? { ...current, ...updater(current) } : current));
  };

  const handleApprove = async () => {
    if (!viewedRequest) return;
    setActionLoading(true);
    setMessage('');
    try {
      await adminApproveWithdrawal(viewedRequest.id, adminNotes.trim());
      updateRequest(viewedRequest.id, () => ({
        status: 'APPROVED',
        adminNotes: adminNotes.trim(),
      }));
      setMessage(`Withdrawal ${viewedRequest.id} approved.`);
    } catch (error) {
      setMessage(error.message || 'Unable to approve withdrawal.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!viewedRequest) return;
    if (!rejectionReason.trim()) {
      setMessage('Rejection reason is required.');
      return;
    }
    setActionLoading(true);
    setMessage('');
    try {
      await adminRejectWithdrawal(viewedRequest.id, rejectionReason.trim(), adminNotes.trim());
      updateRequest(viewedRequest.id, () => ({
        status: 'REJECTED',
        rejectionReason: rejectionReason.trim(),
        adminNotes: adminNotes.trim(),
      }));
      setMessage(`Withdrawal ${viewedRequest.id} rejected.`);
    } catch (error) {
      setMessage(error.message || 'Unable to reject withdrawal.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcess = async () => {
    if (!viewedRequest) return;
    if (!bankTransferReference.trim()) {
      setMessage('Bank transfer reference is required before processing.');
      return;
    }
    setActionLoading(true);
    setMessage('');
    try {
      await adminProcessWithdrawal(viewedRequest.id, bankTransferReference.trim(), adminNotes.trim());
      updateRequest(viewedRequest.id, () => ({
        status: 'PROCESSED',
        bankTransferReference: bankTransferReference.trim(),
        adminNotes: adminNotes.trim(),
      }));
      setMessage(`Withdrawal ${viewedRequest.id} processed.`);
    } catch (error) {
      setMessage(error.message || 'Unable to process withdrawal.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { key: 'id', label: '#ID' },
    { key: 'investorId', label: 'Investor ID' },
    {
      key: 'account',
      label: 'Account',
      render: (row) => row.bankAccountNumber || 'N/A',
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => formatCurrency(Number(row.requestedAmount ?? 0)),
    },
    {
      key: 'method',
      label: 'Payment Method',
      render: (row) => row.bankName ? 'Bank Transfer' : 'N/A',
    },
    {
      key: 'requestDate',
      label: 'Request Date',
      render: (row) => row.requestedAt ? new Date(row.requestedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge label={row.status || 'PENDING'} />,
    },
    {
      key: 'action',
      label: 'Action',
      render: (row) => (
        <button
          type="button"
          onClick={() => {
            setViewedRequest(row);
            setAdminNotes(row.adminNotes || '');
            setRejectionReason(row.rejectionReason || '');
            setBankTransferReference(row.bankTransferReference || '');
            setMessage('');
          }}
          className="rounded-xl border border-blue-500/20 bg-blue-500/15 px-3 py-2 text-xs font-semibold text-blue-100"
        >
          View
        </button>
      ),
    },
  ];

  const selectedStatus = String(viewedRequest?.status || '').toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">
          Admin payout queue
        </p>
        <h1 className="section-title mt-3">Withdrawals</h1>
        <p className="section-copy mt-3 max-w-3xl">
          Review live withdrawal requests, approve them, and mark them processed once the bank
          transfer is completed.
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
            valueType={stat.valueType || 'number'}
          />
        ))}
      </div>

      <SectionCard
        title="Withdrawal Workflow"
        subtitle="Queue is backed by `/api/admin/withdrawals/pending` and the approve/process/reject endpoints."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Minimum wallet withdrawal</p>
            <p className="mt-3 font-heading text-xl font-semibold text-white">{formatCurrency(1000)}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Approval policy</p>
            <p className="mt-3 font-heading text-xl font-semibold text-white">Approve then process</p>
          </div>
          <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5 text-sm leading-7 text-blue-100">
            Approved requests remain in this screen state locally so you can capture the bank
            transfer reference and complete processing in the same admin session.
          </div>
        </div>
      </SectionCard>

      <DataTable
        title="Withdrawal Requests"
        description="Live admin queue for wallet payouts."
        data={requests}
        itemsPerPage={20}
        columns={columns}
        searchableKeys={['id', 'investorId', 'bankAccountNumber', 'bankName', 'status']}
        searchPlaceholder="Search by withdrawal ID, investor, or bank account..."
        filterKey="status"
        filterOptions={['PENDING', 'APPROVED', 'REJECTED', 'PROCESSED']}
      />
      {message && <p className="text-sm text-slate-400">{message}</p>}

      {viewedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-2xl overflow-hidden border border-white/10 bg-[#08152f]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h3 className="font-heading text-lg font-semibold text-white">Withdrawal Details</h3>
              <button onClick={() => setViewedRequest(null)} className="text-slate-400 hover:text-white">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-5 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-400">Investor ID</p>
                  <p className="font-medium text-white">{viewedRequest.investorId}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Requested Amount</p>
                  <p className="font-medium text-white">{formatCurrency(Number(viewedRequest.requestedAmount ?? 0))}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Bank Name</p>
                  <p className="font-medium text-white">{viewedRequest.bankName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Account Number</p>
                  <p className="font-medium text-white">{viewedRequest.bankAccountNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">IFSC</p>
                  <p className="font-medium text-white">{viewedRequest.bankIfsc || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <div className="mt-1">
                    <StatusBadge label={viewedRequest.status || 'PENDING'} />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(event) => setAdminNotes(event.target.value)}
                  className="input-shell min-h-[96px] w-full resize-none"
                  placeholder="Optional admin notes"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Rejection Reason</label>
                <textarea
                  value={rejectionReason}
                  onChange={(event) => setRejectionReason(event.target.value)}
                  className="input-shell min-h-[96px] w-full resize-none"
                  placeholder="Required when rejecting"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Bank Transfer Reference</label>
                <input
                  value={bankTransferReference}
                  onChange={(event) => setBankTransferReference(event.target.value)}
                  className="input-shell w-full"
                  placeholder="Required when processing an approved withdrawal"
                />
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button type="button" onClick={() => setViewedRequest(null)} className="btn-secondary">
                Close
              </button>
              {selectedStatus === 'PENDING' && (
                <>
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="rounded-xl border border-rose-500/20 bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-200 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="rounded-xl border border-emerald-500/20 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Approve'}
                  </button>
                </>
              )}
              {selectedStatus === 'APPROVED' && (
                <button
                  type="button"
                  onClick={handleProcess}
                  disabled={actionLoading}
                  className="rounded-xl border border-blue-500/20 bg-blue-500/15 px-4 py-2 text-sm font-semibold text-blue-100 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Mark Processed'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WithdrawalsPage;
