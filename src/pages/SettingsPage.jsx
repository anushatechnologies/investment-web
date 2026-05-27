import { ArrowRightLeft, Banknote, Bell, ShieldCheck, Wallet } from 'lucide-react';
import { useState } from 'react';
import SectionCard from '../components/SectionCard';
import { platformRules, settingsToggles } from '../data/adminData';
import { formatCurrency } from '../utils/formatters';

function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <div>
        <p className="font-medium text-white">{label}</p>
        <p className="mt-1 text-sm text-slate-400">{description}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative h-8 w-16 rounded-full transition ${
          checked ? 'bg-blue-600' : 'bg-slate-700'
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white transition ${
            checked ? 'left-9' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}

function SettingsPage() {
  const [formValues, setFormValues] = useState({
    minInvestment: platformRules.minInvestment,
    maxInvestment: platformRules.maxInvestment,
    monthlyInterest: platformRules.monthlyInterest,
    directReferralCommission: platformRules.directReferralCommission,
    passiveReferralIncome: platformRules.passiveReferralIncome,
    minWithdrawal: platformRules.minWithdrawal,
    adminApprovalRequired: settingsToggles.adminApprovalRequired,
    receiptVerificationRequired: settingsToggles.receiptVerificationRequired,
    fraudMonitoringEnabled: settingsToggles.fraudMonitoringEnabled,
    autoFreezeHighRiskUsers: settingsToggles.autoFreezeHighRiskUsers,
    emailAlertsEnabled: settingsToggles.emailAlertsEnabled,
    weeklySummaryEnabled: settingsToggles.weeklySummaryEnabled,
  });
  const [saved, setSaved] = useState(false);

  const updateNumber = (field) => (event) => {
    setSaved(false);
    setFormValues((current) => ({
      ...current,
      [field]: Number(event.target.value),
    }));
  };

  const toggleValue = (field) => () => {
    setSaved(false);
    setFormValues((current) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  const handleSave = () => {
    setSaved(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">
          Platform controls
        </p>
        <h1 className="section-title mt-3">Settings</h1>
        <p className="section-copy mt-3 max-w-3xl">
          Configure investment rules, referral commissions, approval requirements, and notification
          preferences for the admin platform.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <SectionCard title="Business Rules" subtitle="Editable values ready for backend configuration wiring.">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Banknote className="h-4 w-4 text-gold-soft" />
                Minimum investment
              </span>
              <input
                type="number"
                value={formValues.minInvestment}
                onChange={updateNumber('minInvestment')}
                className="input-shell mt-3"
              />
            </label>
            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Banknote className="h-4 w-4 text-gold-soft" />
                Maximum investment
              </span>
              <input
                type="number"
                value={formValues.maxInvestment}
                onChange={updateNumber('maxInvestment')}
                className="input-shell mt-3"
              />
            </label>
            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Banknote className="h-4 w-4 text-gold-soft" />
                Monthly interest (%)
              </span>
              <input
                type="number"
                value={formValues.monthlyInterest}
                onChange={updateNumber('monthlyInterest')}
                className="input-shell mt-3"
              />
            </label>
            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <ArrowRightLeft className="h-4 w-4 text-gold-soft" />
                Direct referral commission (%)
              </span>
              <input
                type="number"
                value={formValues.directReferralCommission}
                onChange={updateNumber('directReferralCommission')}
                className="input-shell mt-3"
              />
            </label>
            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <ArrowRightLeft className="h-4 w-4 text-gold-soft" />
                Passive referral income (%)
              </span>
              <input
                type="number"
                value={formValues.passiveReferralIncome}
                onChange={updateNumber('passiveReferralIncome')}
                className="input-shell mt-3"
              />
            </label>
            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Wallet className="h-4 w-4 text-gold-soft" />
                Minimum wallet withdrawal
              </span>
              <input
                type="number"
                value={formValues.minWithdrawal}
                onChange={updateNumber('minWithdrawal')}
                className="input-shell mt-3"
              />
            </label>
          </div>
        </SectionCard>

        <SectionCard title="Workflow Controls" subtitle="Approval and safety toggles for admin operations.">
          <div className="space-y-4">
            <ToggleRow
              label="Admin approval required"
              description="Keep withdrawals and sensitive actions pending until approved by admin."
              checked={formValues.adminApprovalRequired}
              onChange={toggleValue('adminApprovalRequired')}
            />
            <ToggleRow
              label="Receipt verification required"
              description="Require admin verification before crediting payment receipts."
              checked={formValues.receiptVerificationRequired}
              onChange={toggleValue('receiptVerificationRequired')}
            />
            <ToggleRow
              label="Fraud monitoring enabled"
              description="Continuously scan suspicious behavior across transactions and referrals."
              checked={formValues.fraudMonitoringEnabled}
              onChange={toggleValue('fraudMonitoringEnabled')}
            />
            <ToggleRow
              label="Auto-freeze high risk users"
              description="Automatically restrict accounts flagged with severe risk indicators."
              checked={formValues.autoFreezeHighRiskUsers}
              onChange={toggleValue('autoFreezeHighRiskUsers')}
            />
            <ToggleRow
              label="Email alerts enabled"
              description="Send operational alerts for approvals, rejections, and compliance flags."
              checked={formValues.emailAlertsEnabled}
              onChange={toggleValue('emailAlertsEnabled')}
            />
            <ToggleRow
              label="Weekly summary enabled"
              description="Deliver weekly management summaries for revenue and portfolio movement."
              checked={formValues.weeklySummaryEnabled}
              onChange={toggleValue('weeklySummaryEnabled')}
            />
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Live Policy Preview" subtitle="Current business rule summary based on the staged settings values.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Investment band</p>
            <p className="mt-3 font-heading text-xl font-semibold text-white">
              {formatCurrency(formValues.minInvestment)} to {formatCurrency(formValues.maxInvestment)}
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Monthly interest</p>
            <p className="mt-3 font-heading text-xl font-semibold text-white">
              {formValues.monthlyInterest}%
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Referral economics</p>
            <p className="mt-3 font-heading text-xl font-semibold text-white">
              {formValues.directReferralCommission}% direct / {formValues.passiveReferralIncome}%
              passive
            </p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="flex items-center gap-2 text-sm text-slate-400">
              <Bell className="h-4 w-4 text-gold-soft" />
              Withdrawal threshold
            </p>
            <p className="mt-3 font-heading text-xl font-semibold text-white">
              {formatCurrency(formValues.minWithdrawal)}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-400">
            {saved
              ? 'Settings have been staged successfully and are ready for backend persistence.'
              : 'Changes on this screen are local UI state and ready for developer API integration.'}
          </div>
          <button type="button" onClick={handleSave} className="btn-primary">
            <ShieldCheck className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

export default SettingsPage;
