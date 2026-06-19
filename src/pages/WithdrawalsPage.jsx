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
          className={`rounded-xl px-4 py-2 text-xs font-bold tracking-wide transition-all duration-200 ${
            viewedRequest?.id === row.id
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/30'
              : 'border border-slate-500/20 bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:border-transparent hover:from-emerald-500 hover:to-teal-600 hover:shadow-md hover:shadow-emerald-500/20 dark:border-white/10 dark:from-white/[0.06] dark:to-white/[0.04] dark:text-slate-200'
          }`}
        >
          {viewedRequest?.id === row.id ? '● Active' : 'View'}
        </button>
      ),
    },
  ];

  const selectedStatus = String(viewedRequest?.status || '').toUpperCase();

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-500/[0.08] dark:via-[#071226] dark:to-teal-500/[0.04] p-6 shadow-lg shadow-emerald-500/5">
        <div className="absolute right-0 top-0 h-32 w-32 -translate-y-6 translate-x-6 rounded-full bg-emerald-400/10 blur-2xl" />
        <div className="absolute bottom-0 left-0 h-24 w-24 -translate-x-4 translate-y-4 rounded-full bg-teal-400/10 blur-xl" />
        <p className="relative text-xs font-bold uppercase tracking-[0.28em] text-emerald-600 dark:text-emerald-400">
          Admin payout queue
        </p>
        <h1 className="relative section-title mt-2">Withdrawals</h1>
        <p className="relative section-copy mt-2 max-w-3xl">
          Review live withdrawal requests, approve them, and mark them processed once the bank transfer is completed.
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

      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#071226] shadow-sm">
        <div className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] px-5 py-4">
          <h2 className="text-base font-bold text-slate-800 dark:text-white">Withdrawal Settings</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Manage payout limits and process the queue backed by the admin withdrawal APIs.</p>
        </div>
        
        <div className="p-5">
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Min. Withdrawal</p>
              <p className="mt-2 text-xl font-black text-slate-800 dark:text-white">{formatCurrency(settings.minimumWithdrawalAmount)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Max. Per Request</p>
              <p className="mt-2 text-xl font-black text-slate-800 dark:text-white">
                {settings.maximumWithdrawalAmount > 0 ? formatCurrency(settings.maximumWithdrawalAmount) : 'Unlimited'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/60 bg-slate-50/50 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Daily Limit</p>
              <p className="mt-2 text-xl font-black text-slate-800 dark:text-white">
                {settings.dailyWithdrawalLimit > 0 ? formatCurrency(settings.dailyWithdrawalLimit) : 'Unlimited'}
              </p>
            </div>
            <div className={`rounded-2xl border p-4 ${settings.withdrawalEnabled ? 'border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10' : 'border-rose-500/20 bg-rose-500/5 dark:bg-rose-500/10'}`}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Status</p>
              <p className={`mt-2 text-lg font-bold ${settings.withdrawalEnabled ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {settings.withdrawalEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/[0.06] dark:bg-slate-900/40">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-800 dark:text-slate-200">Edit Settings</h3>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-200 dark:hover:bg-white/[0.05]">
                <input
                  type="checkbox"
                  checked={Boolean(settingsDraft.withdrawalEnabled)}
                  onChange={(event) => updateSettingsDraft('withdrawalEnabled', event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
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
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</label>
                  <input
                    type="number"
                    min="0"
                    value={settingsDraft[field]}
                    onChange={(event) => updateSettingsDraft(field, event.target.value)}
                    className="w-full rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-sm text-slate-800 placeholder-slate-400 transition duration-200 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-100"
                  />
                </div>
              ))}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Processing Time</label>
                <input
                  value={settingsDraft.processingTime}
                  onChange={(event) => updateSettingsDraft('processingTime', event.target.value)}
                  className="w-full rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-sm text-slate-800 placeholder-slate-400 transition duration-200 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-100"
                  placeholder="24 hours"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Preferred Method</label>
                <input
                  value={settingsDraft.preferredMethod}
                  onChange={(event) => updateSettingsDraft('preferredMethod', event.target.value)}
                  className="w-full rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-sm text-slate-800 placeholder-slate-400 transition duration-200 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 dark:border-white/10 dark:bg-white/[0.02] dark:text-slate-100"
                  placeholder="Bank Transfer"
                />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 dark:border-white/[0.06]">
              <p className="text-xs text-slate-500 dark:text-slate-400">Use 0 for unlimited max, daily, monthly, or alert threshold.</p>
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={settingsLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:from-emerald-400 hover:to-teal-400 hover:shadow-emerald-500/30 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {settingsLoading ? 'Saving...' : 'Save Limits'}
              </button>
            </div>
          </div>
        </div>
      </div>

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
      {message && <p className="text-sm text-slate-500 dark:text-slate-300">{message}</p>}

      {Boolean(viewedRequest) && (
        <div className="fixed inset-0 z-[1600] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
          <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_32px_90px_rgba(0,0,0,0.2)] dark:border-white/[0.08] dark:bg-[#071226] dark:shadow-[0_32px_90px_rgba(0,0,0,0.6)]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200/60 bg-gradient-to-r from-emerald-500/5 to-transparent px-6 py-4 dark:border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                  <Wallet className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Withdrawal Details</h3>
                  <p className="text-[11px] text-slate-400">ID #{viewedRequest.id}</p>
                </div>
              </div>
              <button
                onClick={() => setViewedRequest(null)}
                className="rounded-xl border border-slate-200/60 bg-slate-50 p-2 text-slate-400 transition hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-500 dark:border-white/10 dark:bg-white/[0.04] dark:hover:text-emerald-400"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  { label: 'Investor ID', content: <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{viewedRequest.investorId}</span> },
                  { label: 'Amount', content: <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(Number(viewedRequest.requestedAmount ?? 0))}</span> },
                  { label: 'Status', content: <StatusBadge label={viewedRequest.status || 'PENDING'} /> },
                  { label: 'Bank Name', content: <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{viewedRequest.bankName || 'N/A'}</span> },
                  { label: 'Account Number', content: <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{viewedRequest.bankAccountNumber || 'N/A'}</span> },
                  { label: 'IFSC', content: <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{viewedRequest.bankIfsc || 'N/A'}</span> },
                ].map(({ label, content }, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200/60 bg-slate-50/40 p-3 dark:border-white/[0.07] dark:bg-white/[0.02]">
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>
                    {content}
                  </div>
                ))}
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  Admin Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(event) => setAdminNotes(event.target.value)}
                  className="w-full min-h-[80px] resize-none rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 text-sm text-slate-800 placeholder-slate-400 transition duration-200 focus:border-emerald-500/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/25 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-100 dark:placeholder-slate-500"
                  placeholder="Optional admin notes"
                />
              </div>

              {selectedStatus === 'PENDING' && (
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Rejection Reason
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(event) => setRejectionReason(event.target.value)}
                    className="w-full min-h-[80px] resize-none rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 text-sm text-slate-800 placeholder-slate-400 transition duration-200 focus:border-rose-500/40 focus:outline-none focus:ring-2 focus:ring-rose-500/25 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-100 dark:placeholder-slate-500"
                    placeholder="Required when rejecting"
                  />
                </div>
              )}

              {selectedStatus === 'APPROVED' && (
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                    Bank Transfer Reference
                  </label>
                  <input
                    value={bankTransferReference}
                    onChange={(event) => setBankTransferReference(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 text-sm text-slate-800 placeholder-slate-400 transition duration-200 focus:border-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500/25 dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-100 dark:placeholder-slate-500"
                    placeholder="Required when processing an approved withdrawal"
                  />
                </div>
              )}
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
                {selectedStatus === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-bold text-rose-600 transition-all duration-200 hover:border-rose-500/50 hover:bg-rose-500/20 disabled:opacity-50 dark:text-rose-400"
                    >
                      {actionLoading ? 'Processing...' : 'Reject'}
                    </button>
                    <button
                      type="button"
                      onClick={handleApprove}
                      disabled={actionLoading}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-600 transition-all duration-200 hover:border-emerald-500/50 hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-400"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {actionLoading ? 'Processing...' : 'Approve'}
                    </button>
                  </>
                )}
                {selectedStatus === 'APPROVED' && (
                  <button
                    type="button"
                    onClick={handleProcess}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/35 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {actionLoading ? 'Processing...' : 'Mark Processed'}
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

export default WithdrawalsPage;
