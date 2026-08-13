import React, { useEffect, useState } from 'react';
import StatusBadge from '../components/common/StatusBadge';
import { TableSkeleton } from '../components/common/Skeletons';
import { adminGetAllBankAccounts, adminVerifyBankAccount } from '../services/api';

export default function AdminBankAccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchBankAccounts = async () => {
    setLoading(true);
    try {
      const data = await adminGetAllBankAccounts();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (e) {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const handleVerify = async (bankId) => {
    if (!window.confirm('Mark this bank account as verified?')) return;
    try {
      await adminVerifyBankAccount(bankId);
      fetchBankAccounts();
    } catch (err) {
      alert(err?.message || 'Failed to verify bank account');
    }
  };

  const filteredAccounts = accounts.filter((acc) => {
    return (
      !search ||
      String(acc.userName || '').toLowerCase().includes(search.toLowerCase()) ||
      String(acc.bankName || '').toLowerCase().includes(search.toLowerCase()) ||
      String(acc.bankIfscCode || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Bank Account Verification Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Linked investor bank accounts directory with masked account numbers and penny-drop verification status.
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center border-b pb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search bank name, investor, IFSC..."
          className="w-full sm:w-80 rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : filteredAccounts.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
            No bank accounts found matching search.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="p-4">Investor</th>
                <th className="p-4">Bank Name</th>
                <th className="p-4">Account Number (Masked)</th>
                <th className="p-4">IFSC Code</th>
                <th className="p-4">Account Holder</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAccounts.map((acc) => (
                <tr key={acc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="p-4">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {acc.userName || 'N/A'}
                    </div>
                    <div className="text-xs text-slate-500">{acc.userMobile || acc.userId}</div>
                  </td>
                  <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                    {acc.bankName}
                  </td>
                  <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                    {acc.bankAccountNumberMasked || 'XXXX XXXX 4521'}
                  </td>
                  <td className="p-4 font-mono text-slate-600 dark:text-slate-400">
                    {acc.bankIfscCode}
                  </td>
                  <td className="p-4 text-slate-700 dark:text-slate-300">
                    {acc.accountHolderName}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={acc.verified ? 'VERIFIED' : 'PENDING'} />
                  </td>
                  <td className="p-4 text-right">
                    {!acc.verified && (
                      <button
                        type="button"
                        onClick={() => handleVerify(acc.id)}
                        className="text-xs font-semibold text-emerald-600 hover:underline"
                      >
                        Verify Account
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
