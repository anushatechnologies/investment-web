import React, { useEffect, useState } from 'react';
import StatusBadge from '../components/common/StatusBadge';
import { TableSkeleton } from '../components/common/Skeletons';
import { adminGetUpcomingMaturities, adminSettleMaturity } from '../services/api';
import { formatDate, formatINR } from '../utils/formatters';

export default function AdminMaturitiesPage() {
  const [maturities, setMaturities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMaturities = async () => {
    setLoading(true);
    try {
      const data = await adminGetUpcomingMaturities();
      setMaturities(Array.isArray(data) ? data : []);
    } catch (e) {
      setMaturities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaturities();
  }, []);

  const handleSettle = async (investmentId) => {
    if (!window.confirm('Process final maturity settlement and credit investor wallet?')) return;
    try {
      await adminSettleMaturity(investmentId);
      alert('Maturity settlement processed successfully!');
      fetchMaturities();
    } catch (err) {
      alert(err?.message || 'Failed to settle maturity');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Upcoming Maturities & Final Settlement
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Monitor portfolios reaching maturity date, review total earned interest, and execute final wallet settlement.
          </p>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : maturities.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
            No active investments approaching maturity.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="p-4">Investment ID & User</th>
                <th className="p-4">Principal Amount</th>
                <th className="p-4">Interest Earned</th>
                <th className="p-4">Maturity Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {maturities.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="p-4">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {inv.investorUserId}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">{inv.id}</div>
                  </td>
                  <td className="p-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {formatINR(inv.investmentAmount)}
                  </td>
                  <td className="p-4 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {formatINR(inv.totalInterestEarned || 0)}
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">
                    {formatDate(inv.maturityDate)}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="p-4 text-right">
                    {inv.status !== 'MATURED' && (
                      <button
                        type="button"
                        onClick={() => handleSettle(inv.id)}
                        className="text-xs font-semibold text-emerald-600 hover:underline"
                      >
                        Settle Maturity
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
