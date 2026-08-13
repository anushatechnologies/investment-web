import React, { useState } from 'react';

const ROLES = [
  { name: 'SUPER_ADMIN', desc: 'Full root access across all modules, plans approval, and settings configuration.' },
  { name: 'ADMIN', desc: 'General administrator for user management, investment operations, and support.' },
  { name: 'FINANCE', desc: 'Finance officer responsible for withdrawals, double-entry ledger adjustments, and payout reviews.' },
  { name: 'KYC_MANAGER', desc: 'Dedicated identity reviewer for PAN, Aadhaar, Selfie, and bank account verifications.' },
  { name: 'OPERATIONS', desc: 'Operations manager managing plan drafts and daily customer workflows.' },
  { name: 'SUPPORT', desc: 'Customer support representative handling support desk tickets.' },
  { name: 'AUDITOR', desc: 'Read-only auditor with access to financial reports and append-only audit logs.' },
];

const PERMISSION_GROUPS = [
  { name: 'Users & KYC', keys: ['users.view', 'users.edit', 'users.block', 'kyc.view', 'kyc.review'] },
  { name: 'Plans & Products', keys: ['plans.view', 'plans.create', 'plans.edit', 'plans.approve', 'plans.publish', 'plans.pause'] },
  { name: 'Financial Engine', keys: ['investments.view', 'payments.view', 'payouts.process', 'withdrawals.approve', 'ledger.adjust'] },
  { name: 'Governance & System', keys: ['reports.export', 'settings.edit', 'roles.manage', 'audit.view'] },
];

export default function AdminRolesPage() {
  const [selectedRole, setSelectedRole] = useState('SUPER_ADMIN');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Roles & Granular Permissions Matrix
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Configure Role-Based Access Control (RBAC) privileges across platform modules.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 px-2">
            System Roles
          </h3>
          {ROLES.map((role) => (
            <button
              key={role.name}
              type="button"
              onClick={() => setSelectedRole(role.name)}
              className={`w-full text-left p-3 rounded-lg border transition ${
                selectedRole === role.name
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="text-sm font-bold">{role.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-normal line-clamp-2">
                {role.desc}
              </div>
            </button>
          ))}
        </div>

        {/* Permissions Matrix */}
        <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Permissions for {selectedRole}
              </h3>
              <p className="text-xs text-slate-500">Backend security authorization policies.</p>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Active Authorization Policy
            </span>
          </div>

          <div className="space-y-6">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.name} className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {group.name}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.keys.map((permKey) => (
                    <label key={permKey} className="flex items-center space-x-2.5 rounded-lg border border-slate-200 p-2.5 text-xs font-semibold text-slate-800 dark:border-slate-800 dark:text-slate-200">
                      <input
                        type="checkbox"
                        defaultChecked={selectedRole === 'SUPER_ADMIN' || permKey.startsWith(selectedRole.toLowerCase().split('_')[0])}
                        disabled={selectedRole === 'SUPER_ADMIN'}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-mono">{permKey}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
