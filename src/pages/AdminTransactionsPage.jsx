import React, { useEffect, useState } from 'react';
import StatusBadge from '../components/common/StatusBadge';
import { TableSkeleton } from '../components/common/Skeletons';
import { adminAdjustLedger, adminGetLedger } from '../services/api';
import { formatDateTime, formatINR } from '../utils/formatters';

export default function AdminTransactionsPage() {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ userId: '', amount: '', reason: '' });
  const [adjusting, setAdjusting] = useState(false);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const data = await adminGetLedger();
      setLedger(Array.isArray(data) ? data : []);
    } catch (e) {
      setLedger([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustForm.userId || !adjustForm.amount || !adjustForm.reason) {
      alert('Please fill all fields');
      return;
    }
    setAdjusting(true);
    try {
      await adminAdjustLedger({
        userId: adjustForm.userId,
        amount: Number(adjustForm.amount),
        reason: adjustForm.reason,
      });
      alert('Ledger adjustment executed successfully');
      setShowAdjustModal(false);
      setAdjustForm({ userId: '', amount: '', reason: '' });
      fetchLedger();
    } catch (err) {
      alert(err?.message || 'Failed to adjust ledger');
    } finally {
      setAdjusting(false);
    }
  };

  const filteredLedger = ledger.filter((txn) => {
    return (
      !search ||
      String(txn.id || '').toLowerCase().includes(search.toLowerCase()) ||
      String(txn.userId || '').toLowerCase().includes(search.toLowerCase()) ||
      String(txn.transactionType || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Immutable Financial Ledger
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Double-entry accounting transaction records for investments, payouts, withdrawals, and balance adjustments.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdjustModal(true)}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          + Manual Ledger Adjustment
        </button>
      </div>

      <div className="flex justify-between items-center border-b pb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search Transaction ID, User ID, Type..."
          className="w-full sm:w-80 rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={7} />
      ) : filteredLedger.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
            No double-entry ledger transactions recorded yet.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="p-4">Txn ID & User</th>
                <th className="p-4">Type</th>
                <th className="p-4">Direction</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Reference / Description</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLedger.map((txn) => {
                const isCredit = txn.direction === 'CREDIT';
                return (
                  <tr key={txn.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {txn.userId}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">{txn.id}</div>
                    </td>
                    <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono dark:bg-slate-800">
                        {txn.transactionType}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-xs">
                      <span className={isCredit ? 'text-emerald-600' : 'text-rose-600'}>
                        {isCredit ? '+ CREDIT' : '- DEBIT'}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                      {formatINR(txn.amount)}
                    </td>
                    <td className="p-4 text-xs text-slate-600 dark:text-slate-400">
                      {txn.description || txn.referenceId || 'N/A'}
                    </td>
                    <td className="p-4 text-xs text-slate-600 dark:text-slate-400">
                      {formatDateTime(txn.createdAt)}
                    </td>
                    <td className="p-4">
                      <StatusBadge status="SUCCESS" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <form onSubmit={handleAdjustSubmit} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b pb-2">
              Manual Ledger Adjustment
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">User ID *</label>
              <input
                type="text"
                value={adjustForm.userId}
                onChange={(e) => setAdjustForm((p) => ({ ...p, userId: e.target.value }))}
                required
                placeholder="User UUID..."
                className="w-full rounded-lg border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount (Positive for Credit, Negative for Debit) *
              </label>
              <input
                type="number"
                step="0.01"
                value={adjustForm.amount}
                onChange={(e) => setAdjustForm((p) => ({ ...p, amount: e.target.value }))}
                required
                placeholder="e.g. 5000 or -1000"
                className="w-full rounded-lg border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mandatory Reason / Audit Note *
              </label>
              <textarea
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm((p) => ({ ...p, reason: e.target.value }))}
                required
                rows={3}
                placeholder="Specify regulatory or accounting justification..."
                className="w-full rounded-lg border p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="rounded-lg border px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adjusting}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                {adjusting ? 'Executing...' : 'Post Adjustment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
