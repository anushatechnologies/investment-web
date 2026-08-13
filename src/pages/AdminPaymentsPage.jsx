import React, { useEffect, useState } from 'react';
import ConfirmModal from '../components/common/ConfirmModal';
import StatusBadge from '../components/common/StatusBadge';
import { TableSkeleton } from '../components/common/Skeletons';
import {
  adminGetAllPayments,
  adminGetPaymentReconciliation,
  adminGetPaymentWebhooks,
  adminRefundPayment,
} from '../services/api';
import { formatDateTime, formatINR } from '../utils/formatters';

const TABS = ['PAYMENTS', 'RECONCILIATION', 'WEBHOOKS'];

export default function AdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState('PAYMENTS');
  const [payments, setPayments] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Refund Modal State
  const [refundModal, setRefundModal] = useState(null);
  const [refundForm, setRefundForm] = useState({ amount: '', reason: '' });
  const [refunding, setRefunding] = useState(false);

  // Timeline Drawer State
  const [viewingPayment, setViewingPayment] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'PAYMENTS') {
        const data = await adminGetAllPayments();
        setPayments(Array.isArray(data) ? data : []);
      } else if (activeTab === 'RECONCILIATION') {
        const data = await adminGetPaymentReconciliation();
        setReconciliations(Array.isArray(data) ? data : []);
      } else if (activeTab === 'WEBHOOKS') {
        const data = await adminGetPaymentWebhooks();
        setWebhooks(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      setPayments([]);
      setReconciliations([]);
      setWebhooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    if (!refundModal || !refundForm.reason) {
      alert('Please enter a valid refund reason');
      return;
    }
    setRefunding(true);
    try {
      await adminRefundPayment(refundModal.id, {
        amount: refundForm.amount ? Number(refundForm.amount) : refundModal.amount,
        reason: refundForm.reason,
      });
      alert('Razorpay Refund initiated successfully!');
      setRefundModal(null);
      setRefundForm({ amount: '', reason: '' });
      fetchData();
    } catch (err) {
      alert(err?.message || 'Failed to process refund');
    } finally {
      setRefunding(false);
    }
  };

  // Metrics Calculation
  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const successfulCount = payments.filter((p) => String(p.status).toUpperCase() === 'CAPTURED' || String(p.status).toUpperCase() === 'PAID').length;
  const pendingCount = payments.filter((p) => String(p.status).toUpperCase() === 'CREATED' || String(p.status).toUpperCase() === 'PAYMENT_PENDING').length;
  const failedCount = payments.filter((p) => String(p.status).toUpperCase() === 'FAILED').length;
  const refundedCount = payments.filter((p) => String(p.status).toUpperCase() === 'REFUNDED').length;

  const filteredPayments = payments.filter((p) => {
    const statusMatch = statusFilter === 'ALL' || String(p.status).toUpperCase() === statusFilter;
    const searchMatch =
      !search ||
      String(p.id || '').toLowerCase().includes(search.toLowerCase()) ||
      String(p.razorpayPaymentId || '').toLowerCase().includes(search.toLowerCase()) ||
      String(p.razorpayOrderId || '').toLowerCase().includes(search.toLowerCase()) ||
      String(p.investorId || '').toLowerCase().includes(search.toLowerCase());
    return statusMatch && searchMatch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Razorpay Payment Management Desk
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time payment dashboard, webhook event logger, automated reconciliation, and server-side refund management.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold text-slate-500">Total Volume</div>
          <div className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{formatINR(totalAmount)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold text-slate-500">Successful</div>
          <div className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">{successfulCount}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold text-slate-500">Pending</div>
          <div className="mt-1 text-lg font-bold text-amber-600 dark:text-amber-400">{pendingCount}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold text-slate-500">Failed</div>
          <div className="mt-1 text-lg font-bold text-rose-600 dark:text-rose-400">{failedCount}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold text-slate-500">Refunded</div>
          <div className="mt-1 text-lg font-bold text-indigo-600 dark:text-indigo-400">{refundedCount}</div>
        </div>
      </div>

      {/* Navigation Tabs & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div className="flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'PAYMENTS' && (
          <div className="flex gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="CAPTURED">CAPTURED</option>
              <option value="PAID">PAID</option>
              <option value="CREATED">CREATED</option>
              <option value="FAILED">FAILED</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Payment ID, Order ID, User..."
              className="w-full sm:w-64 rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>
        )}
      </div>

      {/* Content Rendering based on Tab */}
      {loading ? (
        <TableSkeleton rows={6} cols={7} />
      ) : activeTab === 'PAYMENTS' ? (
        filteredPayments.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
              No Razorpay payments recorded matching filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="p-4">Payment ID / Order</th>
                  <th className="p-4">Investor</th>
                  <th className="p-4">Investment ID</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Method</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="p-4">
                      <div className="font-bold font-mono text-slate-900 dark:text-white">
                        {p.razorpayPaymentId || p.id}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">{p.razorpayOrderId}</div>
                    </td>
                    <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                      {p.investorId}
                    </td>
                    <td className="p-4 font-mono text-xs text-blue-600 dark:text-blue-400">
                      {p.investmentId}
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                      {formatINR(p.amount)}
                    </td>
                    <td className="p-4">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono dark:bg-slate-800">
                        {p.method || 'RAZORPAY'}
                      </span>
                    </td>
                    <td className="p-4">
                      <StatusBadge status={p.status || 'CAPTURED'} />
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setViewingPayment(p)}
                        className="text-xs font-semibold text-blue-600 hover:underline"
                      >
                        Timeline
                      </button>
                      {String(p.status).toUpperCase() !== 'REFUNDED' && (
                        <button
                          type="button"
                          onClick={() => {
                            setRefundModal(p);
                            setRefundForm({ amount: p.amount, reason: '' });
                          }}
                          className="text-xs font-semibold text-rose-600 hover:underline"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : activeTab === 'RECONCILIATION' ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="p-4">Payment ID</th>
                <th className="p-4">Razorpay Order ID</th>
                <th className="p-4">Investment ID</th>
                <th className="p-4">Internal Amount</th>
                <th className="p-4">Match Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {reconciliations.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="p-4 font-mono font-bold">{item.razorpayPaymentId || item.paymentId}</td>
                  <td className="p-4 font-mono text-xs">{item.razorpayOrderId}</td>
                  <td className="p-4 font-mono text-xs text-blue-600">{item.investmentId}</td>
                  <td className="p-4 font-mono font-bold">{formatINR(item.amount)}</td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        item.matched
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {item.matched ? '✓ MATCHED' : '⚠ MISMATCH'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Webhooks Monitor Tab */
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="p-4">Event ID</th>
                <th className="p-4">Event Type</th>
                <th className="p-4">Payment ID</th>
                <th className="p-4">Order ID</th>
                <th className="p-4">Received At</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {webhooks.map((w, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="p-4 font-mono text-xs">{w.eventId}</td>
                  <td className="p-4 font-mono font-bold text-blue-600 text-xs">{w.eventType}</td>
                  <td className="p-4 font-mono text-xs">{w.paymentId}</td>
                  <td className="p-4 font-mono text-xs">{w.orderId}</td>
                  <td className="p-4 text-xs text-slate-500">{formatDateTime(w.receivedAt)}</td>
                  <td className="p-4">
                    <StatusBadge status={w.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Timeline Modal */}
      {viewingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b pb-2">
              Payment Timeline & Audit Log
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center space-x-3 text-emerald-600">
                <span>✓</span>
                <div>
                  <div className="font-bold">Investment Order Created</div>
                  <div className="text-slate-400">{formatDateTime(viewingPayment.checkoutOrderCreatedAt)}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-emerald-600">
                <span>✓</span>
                <div>
                  <div className="font-bold">Razorpay Order Issued</div>
                  <div className="text-slate-400">Order ID: {viewingPayment.razorpayOrderId}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-emerald-600">
                <span>✓</span>
                <div>
                  <div className="font-bold">Payment Authorized & Captured</div>
                  <div className="text-slate-400">Payment ID: {viewingPayment.razorpayPaymentId}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-emerald-600">
                <span>✓</span>
                <div>
                  <div className="font-bold">Server Signature Verified</div>
                  <div className="text-slate-400">{formatDateTime(viewingPayment.signatureVerifiedAt)}</div>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-emerald-600">
                <span>✓</span>
                <div>
                  <div className="font-bold">Investment Activated & Receipt Generated</div>
                  <div className="text-slate-400">Investment ID: {viewingPayment.investmentId}</div>
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingPayment(null)}
                className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 dark:bg-slate-700 dark:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Dialog Modal */}
      {refundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <form onSubmit={handleRefundSubmit} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b pb-2">
              Execute Razorpay Refund
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Refund Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                value={refundForm.amount}
                onChange={(e) => setRefundForm((p) => ({ ...p, amount: e.target.value }))}
                required
                className="w-full rounded-lg border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mandatory Reason / Audit Note *
              </label>
              <textarea
                value={refundForm.reason}
                onChange={(e) => setRefundForm((p) => ({ ...p, reason: e.target.value }))}
                required
                rows={3}
                placeholder="Specify regulatory or accounting refund reason..."
                className="w-full rounded-lg border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRefundModal(null)}
                className="rounded-lg border px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={refunding}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              >
                {refunding ? 'Processing Refund...' : 'Confirm Refund'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
