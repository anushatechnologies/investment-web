import React, { useEffect, useState } from 'react';
import { TableSkeleton } from '../components/common/Skeletons';
import { adminGetAuditLogs } from '../services/api';
import { formatDateTime } from '../utils/formatters';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminGetAuditLogs(search);
      setLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Append-Only Audit Trail Log
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Immutable audit record of all administrative actions, plan approvals, financial overrides, and system changes.
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center border-b pb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by admin, action type, IP address..."
          className="w-full sm:w-80 rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
            No audit logs found matching query.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Admin Agent</th>
                <th className="p-4">Action</th>
                <th className="p-4">Entity</th>
                <th className="p-4">Reason / Notes</th>
                <th className="p-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="p-4 text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {formatDateTime(log.createdAt || log.timestamp)}
                  </td>
                  <td className="p-4 font-semibold text-slate-900 dark:text-white">
                    {log.adminEmail || log.adminUserId || 'SYSTEM'}
                  </td>
                  <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                    {log.action}
                  </td>
                  <td className="p-4 text-xs text-slate-700 dark:text-slate-300 font-mono">
                    {log.entityName} ({log.entityId || 'N/A'})
                  </td>
                  <td className="p-4 text-xs text-slate-600 dark:text-slate-400 max-w-xs truncate">
                    {log.details || log.reason || log.newValue || 'N/A'}
                  </td>
                  <td className="p-4 text-xs font-mono text-slate-500">
                    {log.ipAddress || '127.0.0.1'}
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
