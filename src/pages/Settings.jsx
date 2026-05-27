import { Bell, Lock, ShieldCheck, Smartphone } from 'lucide-react';
import { useState } from 'react';
import SectionCard from '../components/SectionCard';
import { userSettingsInitial } from '../data/mockData';

function ToggleRow({ label, description, checked, onChange, icon: Icon }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="font-medium text-slate-900">{label}</p>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative h-8 w-16 rounded-full transition ${
          checked ? 'bg-blue-600' : 'bg-slate-300'
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

function Settings() {
  const [settings, setSettings] = useState(userSettingsInitial);
  const [saved, setSaved] = useState(false);

  const toggleField = (field) => () => {
    setSaved(false);
    setSettings((current) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  const handleSave = () => {
    setSaved(true);
  };

  const handleRestore = () => {
    setSettings(userSettingsInitial);
    setSaved(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Settings</h2>
        <p className="section-copy mt-3 max-w-3xl">
          Choose how you want to receive alerts and manage your account security preferences.
        </p>
      </div>

      <SectionCard title="Notification Preferences" subtitle="Control how alerts reach you.">
        <div className="space-y-4">
          <ToggleRow
            label="Email Alerts"
            description="Receive updates for interest credits, receipts, and withdrawals by email."
            checked={settings.emailAlerts}
            onChange={toggleField('emailAlerts')}
            icon={Bell}
          />
          <ToggleRow
            label="SMS Alerts"
            description="Receive text messages for important account and security updates."
            checked={settings.smsAlerts}
            onChange={toggleField('smsAlerts')}
            icon={Smartphone}
          />
          <ToggleRow
            label="Payout Reminders"
            description="Get reminders before wallet payouts and interest credit dates."
            checked={settings.payoutReminders}
            onChange={toggleField('payoutReminders')}
            icon={Bell}
          />
          <ToggleRow
            label="Referral Updates"
            description="Receive notifications when new referrals join using your code."
            checked={settings.referralUpdates}
            onChange={toggleField('referralUpdates')}
            icon={Bell}
          />
        </div>
      </SectionCard>

      <SectionCard title="Security & Investment Preferences" subtitle="Manage account-level controls.">
        <div className="space-y-4">
          <ToggleRow
            label="Auto Reinvest"
            description="Reinvest eligible wallet credits automatically into the next available plan."
            checked={settings.autoReinvest}
            onChange={toggleField('autoReinvest')}
            icon={ShieldCheck}
          />
          <ToggleRow
            label="Secure Login Alerts"
            description="Get immediate alerts when a new device signs in to your account."
            checked={settings.secureLoginAlerts}
            onChange={toggleField('secureLoginAlerts')}
            icon={Lock}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={handleSave} className="btn-primary">Save Settings</button>
          <button type="button" onClick={handleRestore} className="btn-secondary">Restore Defaults</button>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          {saved ? 'Settings saved for this demo session.' : 'Toggle preferences and save your changes.'}
        </p>
      </SectionCard>
    </div>
  );
}

export default Settings;
