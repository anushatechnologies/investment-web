import React, { useEffect, useState } from 'react';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmModal from '../components/common/ConfirmModal';
import { TableSkeleton } from '../components/common/Skeletons';
import { adminApproveKyc, adminGetAllKyc, adminGetKycDocuments, adminRejectKyc } from '../services/api';
import { formatDate } from '../utils/formatters';

const TABS = ['PENDING', 'APPROVED', 'REJECTED', 'ALL'];

export default function AdminKycPage() {
  const [kycList, setKycList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [modalConfig, setModalConfig] = useState(null);
  const [selectedDocModal, setSelectedDocModal] = useState(null);

  const fetchKyc = async () => {
    setLoading(true);
    try {
      const data = await adminGetAllKyc(activeTab);
      setKycList(Array.isArray(data) ? data : []);
    } catch (e) {
      setKycList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKyc();
  }, [activeTab]);

  const handleAction = (kycId, actionType, title, message, requireReason = false) => {
    setModalConfig({
      kycId,
      actionType,
      title,
      message,
      requireReason,
    });
  };

  const handleConfirmAction = async (reason) => {
    if (!modalConfig) return;
    const { kycId, actionType } = modalConfig;
    try {
      if (actionType === 'APPROVE') {
        await adminApproveKyc(kycId, 'Approved by KYC Manager');
      } else if (actionType === 'REJECT') {
        await adminRejectKyc(kycId, reason, 'Rejected by KYC Manager');
      }
      fetchKyc();
    } catch (err) {
      alert(err?.message || 'Action failed');
    } finally {
      setModalConfig(null);
    }
  };

  const handleInspectDocs = async (kycId) => {
    try {
      const docs = await adminGetKycDocuments(kycId);
      setSelectedDocModal({ kycId, docs });
    } catch (err) {
      alert('Failed to load document links');
    }
  };

  const filteredKyc = kycList.filter((item) => {
    const searchMatch =
      !search ||
      String(item.panNumber || '').toLowerCase().includes(search.toLowerCase()) ||
      String(item.userId || '').toLowerCase().includes(search.toLowerCase());
    return searchMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            KYC Verification Desk
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Review submitted PAN, Aadhaar, Selfie, and Bank Proof documents before approving investor accounts.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === tab
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search PAN or User ID..."
          className="w-full sm:w-64 rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : filteredKyc.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
            No KYC submissions found under '{activeTab}'.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="p-4">Submission ID & User</th>
                <th className="p-4">PAN Number</th>
                <th className="p-4">Aadhaar (Masked)</th>
                <th className="p-4">Submitted Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredKyc.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                  <td className="p-4">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {item.userId}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">{item.id}</div>
                  </td>
                  <td className="p-4 font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {item.panNumber || 'N/A'}
                  </td>
                  <td className="p-4 font-mono text-slate-600 dark:text-slate-400">
                    {item.aadhaarNumberMasked || 'XXXX XXXX 8899'}
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => handleInspectDocs(item.id)}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      View Docs
                    </button>
                    {item.status === 'PENDING' && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            handleAction(
                              item.id,
                              'APPROVE',
                              'Approve KYC Submission',
                              `Approve KYC for investor ${item.userId}?`,
                              false
                            )
                          }
                          className="text-xs font-semibold text-emerald-600 hover:underline"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleAction(
                              item.id,
                              'REJECT',
                              'Reject KYC Submission',
                              `Reject KYC for investor ${item.userId}?`,
                              true
                            )
                          }
                          className="text-xs font-semibold text-red-600 hover:underline"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Inspect Docs Modal */}
      {selectedDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b pb-2">
              Submitted KYC Documents
            </h3>
            <div className="mt-4 space-y-3">
              {Object.entries(selectedDocModal.docs || {}).map(([docKey, url]) => (
                <div key={docKey} className="flex items-center justify-between rounded-lg border p-3 dark:border-slate-700">
                  <span className="text-sm font-medium capitalize text-slate-700 dark:text-slate-300">
                    {docKey.replace(/([A-Z])/g, ' $1')}
                  </span>
                  <a
                    href={url || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Open Document →
                  </a>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDocModal(null)}
                className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 dark:bg-slate-700 dark:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {modalConfig && (
        <ConfirmModal
          isOpen={true}
          title={modalConfig.title}
          message={modalConfig.message}
          confirmVariant={modalConfig.actionType === 'APPROVE' ? 'success' : 'danger'}
          requireReason={modalConfig.requireReason}
          onConfirm={handleConfirmAction}
          onClose={() => setModalConfig(null)}
        />
      )}
    </div>
  );
}
