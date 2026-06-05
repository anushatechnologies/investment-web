import { CheckCircle2, Clock3, Save, Wallet, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import {
  adminApproveWithdrawal,
  adminGetWithdrawalSettings,
  adminGetPendingWithdrawals,
  adminProcessWithdrawal,
  adminRejectWithdrawal,
  adminUpdateWithdrawalSettings,
} from '../services/api';
import { formatCurrency } from '../utils/formatters';

const statIcons = [Clock3, Wallet, CheckCircle2, XCircle];
const statTones = ['blue', 'emerald', 'cyan', 'violet'];
const DEFAULT_WITHDRAWAL_SETTINGS = {
  withdrawalEnabled: true,
  minimumWithdrawalAmount: 1000,
  maximumWithdrawalAmount: 0,
  dailyWithdrawalLimit: 0,
  monthlyWithdrawalLimit: 0,
  largeWithdrawalAlertThreshold: 50000,
  processingTime: '24 hours',
  preferredMethod: 'Bank Transfer',
};

function normalizeSettings(settings) {
  return {
    ...DEFAULT_WITHDRAWAL_SETTINGS,
    ...(settings || {}),
    withdrawalEnabled: settings?.withdrawalEnabled !== false,
    minimumWithdrawalAmount: Number(settings?.minimumWithdrawalAmount ?? DEFAULT_WITHDRAWAL_SETTINGS.minimumWithdrawalAmount),
    maximumWithdrawalAmount: Number(settings?.maximumWithdrawalAmount ?? DEFAULT_WITHDRAWAL_SETTINGS.maximumWithdrawalAmount),
    dailyWithdrawalLimit: Number(settings?.dailyWithdrawalLimit ?? DEFAULT_WITHDRAWAL_SETTINGS.dailyWithdrawalLimit),
    monthlyWithdrawalLimit: Number(settings?.monthlyWithdrawalLimit ?? DEFAULT_WITHDRAWAL_SETTINGS.monthlyWithdrawalLimit),
    largeWithdrawalAlertThreshold: Number(settings?.largeWithdrawalAlertThreshold ?? DEFAULT_WITHDRAWAL_SETTINGS.largeWithdrawalAlertThreshold),
  };
}

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
  const [settings, setSettings] = useState(DEFAULT_WITHDRAWAL_SETTINGS);
  const [settingsDraft, setSettingsDraft] = useState(DEFAULT_WITHDRAWAL_SETTINGS);
  const [settingsLoading, setSettingsLoading] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([adminGetPendingWithdrawals(), adminGetWithdrawalSettings()])
      .then(([withdrawalsResponse, settingsResponse]) => {
        if (!active) return;
        setRequests(toArray(withdrawalsResponse));
        const normalized = normalizeSettings(settingsResponse);
        setSettings(normalized);
        setSettingsDraft(normalized);
      })
      .catch(() => {
        if (!active) return;
        setRequests([]);
        setSettings(DEFAULT_WITHDRAWAL_SETTINGS);
        setSettingsDraft(DEFAULT_WITHDRAWAL_SETTINGS);
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

  const updateSettingsDraft = (field, value) => {
    setSettingsDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSaveSettings = async () => {
    const payload = {
      ...settingsDraft,
      minimumWithdrawalAmount: Number(settingsDraft.minimumWithdrawalAmount || 0),
      maximumWithdrawalAmount: Number(settingsDraft.maximumWithdrawalAmount || 0),
      dailyWithdrawalLimit: Number(settingsDraft.dailyWithdrawalLimit || 0),
      monthlyWithdrawalLimit: Number(settingsDraft.monthlyWithdrawalLimit || 0),
      largeWithdrawalAlertThreshold: Number(settingsDraft.largeWithdrawalAlertThreshold || 0),
    };
    setSettingsLoading(true);
    setMessage('');
    try {
      const response = await adminUpdateWithdrawalSettings(payload);
      const normalized = normalizeSettings(response);
      setSettings(normalized);
      setSettingsDraft(normalized);
      setMessage('Withdrawal settings updated successfully.');
    } catch (error) {
      setMessage(error.message || 'Unable to update withdrawal settings.');
    } finally {
      setSettingsLoading(false);
    }
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
      exportValue: (row) => Number(row.requestedAmount ?? 0),
      render: (row) => formatCurrency(Number(row.requestedAmount ?? 0)),
    },
    {
      key: 'method',
      label: 'Payment Method',
      exportValue: (row) => (row.bankName ? 'Bank Transfer' : 'N/A'),
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
      exportValue: (row) => row.status || 'PENDING',
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
        subtitle="Manage payout limits and process the queue backed by the admin withdrawal APIs."
      >
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Minimum wallet withdrawal</p>
            <p className="mt-3 font-heading text-xl font-semibold text-white">{formatCurrency(settings.minimumWithdrawalAmount)}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Maximum per request</p>
            <p className="mt-3 font-heading text-xl font-semibold text-white">
              {settings.maximumWithdrawalAmount > 0 ? formatCurrency(settings.maximumWithdrawalAmount) : 'Unlimited'}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Daily limit</p>
            <p className="mt-3 font-heading text-xl font-semibold text-white">
              {settings.dailyWithdrawalLimit > 0 ? formatCurrency(settings.dailyWithdrawalLimit) : 'Unlimited'}
            </p>
          </div>
          <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5 text-sm leading-7 text-blue-100">
            Withdrawals are currently <strong>{settings.withdrawalEnabled ? 'enabled' : 'disabled'}</strong>. Large withdrawal alert starts at{' '}
            <strong>{settings.largeWithdrawalAlertThreshold > 0 ? formatCurrency(settings.largeWithdrawalAlertThreshold) : 'disabled'}</strong>.
          </div>
        </div>
        <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/30 p-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white">
              <input
                type="checkbox"
                checked={Boolean(settingsDraft.withdrawalEnabled)}
                onChange={(event) => updateSettingsDraft('withdrawalEnabled', event.target.checked)}
              />
              Withdrawals enabled
            </label>
            {[
              ['minimumWithdrawalAmount', 'Minimum Amount'],
              ['maximumWithdrawalAmount', 'Maximum Per Request'],
              ['dailyWithdrawalLimit', 'Daily Limit'],
              ['monthlyWithdrawalLimit', 'Monthly Limit'],
              ['largeWithdrawalAlertThreshold', 'Large Alert Threshold'],
            ].map(([field, label]) => (
              <div key={field}>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</label>
                <input
                  type="number"
                  min="0"
                  value={settingsDraft[field]}
                  onChange={(event) => updateSettingsDraft(field, event.target.value)}
                  className="input-shell w-full"
                />
              </div>
            ))}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Processing Time</label>
              <input
                value={settingsDraft.processingTime}
                onChange={(event) => updateSettingsDraft('processingTime', event.target.value)}
                className="input-shell w-full"
                placeholder="24 hours"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Preferred Method</label>
              <input
                value={settingsDraft.preferredMethod}
                onChange={(event) => updateSettingsDraft('preferredMethod', event.target.value)}
                className="input-shell w-full"
                placeholder="Bank Transfer"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-400">Use 0 for unlimited max, daily, monthly, or alert threshold.</p>
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={settingsLoading}
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 disabled:opacity-50"
            >
              <Save className="mr-2 inline h-4 w-4" />
              {settingsLoading ? 'Saving...' : 'Save Limits'}
            </button>
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
        enableCsvExport
        exportFileName="withdrawal-requests"
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
