import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/common/ConfirmModal';
import StatusBadge from '../components/common/StatusBadge';
import { TableSkeleton } from '../components/common/Skeletons';
import CreatePlanWizard from '../components/admin/CreatePlanWizard';
import {
  adminApprovePlan,
  adminClosePlan,
  adminGetAllPlans,
  adminPausePlan,
  adminPublishPlan,
  adminRejectPlan,
  adminSubmitPlan,
} from '../services/api';
import { formatINR } from '../utils/formatters';

const TABS = ['ALL', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ACTIVE', 'PAUSED', 'CLOSED'];

export default function AdminPlansPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showWizard, setShowWizard] = useState(false);

  // Confirm Modal state
  const [modalConfig, setModalConfig] = useState(null);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await adminGetAllPlans();
      setPlans(Array.isArray(data) ? data : []);
    } catch (e) {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleAction = (planId, actionType, title, message, requireReason = false, variant = 'danger') => {
    setModalConfig({
      planId,
      actionType,
      title,
      message,
      requireReason,
      variant,
    });
  };

  const handleConfirmAction = async (reason) => {
    if (!modalConfig) return;
    const { planId, actionType } = modalConfig;
    try {
      switch (actionType) {
        case 'SUBMIT':
          await adminSubmitPlan(planId);
          break;
        case 'APPROVE':
          await adminApprovePlan(planId, reason || 'Approved by Super Admin');
          break;
        case 'REJECT':
          await adminRejectPlan(planId, reason);
          break;
        case 'PUBLISH':
          await adminPublishPlan(planId);
          break;
        case 'PAUSE':
          await adminPausePlan(planId);
          break;
        case 'CLOSE':
          await adminClosePlan(planId);
          break;
        default:
          break;
      }
      fetchPlans();
    } catch (err) {
      alert(err?.message || 'Failed to complete action');
    } finally {
      setModalConfig(null);
    }
  };

  const filteredPlans = plans.filter((plan) => {
    const statusMatch =
      activeTab === 'ALL' || String(plan.planStatus || (plan.active ? 'ACTIVE' : 'PAUSED')).toUpperCase() === activeTab;
    const searchMatch =
      !search ||
      String(plan.planName || '').toLowerCase().includes(search.toLowerCase()) ||
      String(plan.planCode || '').toLowerCase().includes(search.toLowerCase());
    return statusMatch && searchMatch;
  });

  if (showWizard) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setShowWizard(false)}
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          ← Back to Investment Plans
        </button>
        <CreatePlanWizard />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Investment Plans Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure financial products, manage versions, and execute Maker-Checker approval workflows.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowWizard(true)}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
        >
          + Create New Plan Wizard
        </button>
      </div>

      {/* Filter Bar */}
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
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search plan name or code..."
          className="w-full sm:w-64 rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
      </div>

      {/* Table Section */}
      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : filteredPlans.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
            No investment plans found for tab '{activeTab}'.
          </p>
          <button
            type="button"
            onClick={() => setShowWizard(true)}
            className="mt-4 text-sm font-semibold text-blue-600 hover:underline"
          >
            Create First Plan Now →
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="p-4">Plan Code & Name</th>
                <th className="p-4">Category</th>
                <th className="p-4">Investment Range</th>
                <th className="p-4">Monthly Rate</th>
                <th className="p-4">Lock-in</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPlans.map((plan) => {
                const currentStatus = String(
                  plan.planStatus || (plan.active ? 'ACTIVE' : 'PAUSED')
                ).toUpperCase();

                return (
                  <tr key={plan.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {plan.planName}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {plan.planCode || plan.id.substring(0, 8)}
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                      {plan.category || 'FIXED_INCOME'}
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">
                      {formatINR(plan.minimumAmount)} - {formatINR(plan.maximumAmount)}
                    </td>
                    <td className="p-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {plan.monthlyInterestRate}% / mo
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">
                      {plan.lockInMonths} Months
                    </td>
                    <td className="p-4">
                      <StatusBadge status={currentStatus} />
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {currentStatus === 'DRAFT' && (
                        <button
                          type="button"
                          onClick={() =>
                            handleAction(
                              plan.id,
                              'SUBMIT',
                              'Submit Plan for Approval',
                              'Move status from DRAFT to PENDING_APPROVAL for Super Admin review?',
                              false,
                              'primary'
                            )
                          }
                          className="text-xs font-semibold text-blue-600 hover:underline"
                        >
                          Submit
                        </button>
                      )}
                      {currentStatus === 'PENDING_APPROVAL' && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              handleAction(
                                plan.id,
                                'APPROVE',
                                'Approve Investment Plan',
                                'Approve plan parameters?',
                                false,
                                'success'
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
                                plan.id,
                                'REJECT',
                                'Reject Investment Plan',
                                'Reject plan back to DRAFT state?',
                                true,
                                'danger'
                              )
                            }
                            className="text-xs font-semibold text-red-600 hover:underline"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {currentStatus === 'APPROVED' && (
                        <button
                          type="button"
                          onClick={() =>
                            handleAction(
                              plan.id,
                              'PUBLISH',
                              'Publish Investment Plan',
                              'Publishing makes this plan visible to eligible investors on Android App.',
                              false,
                              'success'
                            )
                          }
                          className="text-xs font-semibold text-emerald-600 hover:underline"
                        >
                          Publish
                        </button>
                      )}
                      {currentStatus === 'ACTIVE' && (
                        <button
                          type="button"
                          onClick={() =>
                            handleAction(
                              plan.id,
                              'PAUSE',
                              'Pause Active Plan',
                              'Pause new investor subscriptions for this plan?',
                              false,
                              'warning'
                            )
                          }
                          className="text-xs font-semibold text-amber-600 hover:underline"
                        >
                          Pause
                        </button>
                      )}
                      {(currentStatus === 'PAUSED' || currentStatus === 'ACTIVE') && (
                        <button
                          type="button"
                          onClick={() =>
                            handleAction(
                              plan.id,
                              'CLOSE',
                              'Close Investment Plan',
                              'Permanently close this plan for new subscriptions?',
                              false,
                              'danger'
                            )
                          }
                          className="text-xs font-semibold text-slate-500 hover:underline"
                        >
                          Close
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      {modalConfig && (
        <ConfirmModal
          isOpen={true}
          title={modalConfig.title}
          message={modalConfig.message}
          confirmVariant={modalConfig.variant}
          requireReason={modalConfig.requireReason}
          onConfirm={handleConfirmAction}
          onClose={() => setModalConfig(null)}
        />
      )}
    </div>
  );
}
