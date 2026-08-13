import { Bell, Lock, ShieldCheck, Smartphone, Shield, Activity, Save, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { userSettingsInitial } from '../data/mockData';

function ToggleRow({ label, description, checked, onChange, icon: Icon, themeColor }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300/80 dark:border-slate-700/80 dark:bg-slate-800 dark:hover:border-slate-600/80">
      <div className="flex items-start gap-4">
        <div className={`mt-0.5 flex h-12 w-12 items-center justify-center rounded-2xl ${themeColor} shadow-inner flex-shrink-0`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{label}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-300 leading-relaxed">{description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${ checked ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700' }`}
      >
        <span
          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${ checked ? 'translate-x-7' : 'translate-x-0' }`}
        />
      </button>
    </div>
  );
}

function Settings() {
  const [settings, setSettings] = useState(userSettingsInitial);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('notifications');

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
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Left Column: Tabbed Navigation */}
      <div className="flex flex-row flex-wrap gap-1.5 lg:flex-col lg:gap-2 lg:sticky lg:top-[96px] self-start">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-left text-sm font-semibold transition-all duration-300 ${ activeTab === 'notifications' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-600 bg-white/50 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60 dark:text-slate-300 dark:bg-slate-800/40 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:border-slate-700/60' }`}
        >
          <Bell className="h-4 w-4 flex-shrink-0" />
          Notifications
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-left text-sm font-semibold transition-all duration-300 ${ activeTab === 'security' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-600 bg-white/50 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60 dark:text-slate-300 dark:bg-slate-800/40 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:border-slate-700/60' }`}
        >
          <Shield className="h-4 w-4 flex-shrink-0" />
          Security & Trading
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-left text-sm font-semibold transition-all duration-300 ${ activeTab === 'sessions' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-600 bg-white/50 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60 dark:text-slate-300 dark:bg-slate-800/40 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:border-slate-700/60' }`}
        >
          <Activity className="h-4 w-4 flex-shrink-0" />
          Sessions & Activity
        </button>
      </div>

      {/* Right Column: Tab Content */}
      <div className="space-y-6">
        {activeTab === 'notifications' && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="rounded-2xl border border-slate-200 bg-white/50 p-6 dark:border-slate-800 dark:bg-slate-900/50 animate-fade-in-up">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Notification Preferences</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Configure how and when you want to receive alerts and notifications.</p>
            </div>
            
            <ToggleRow
              label="Email Alerts"
              description="Receive updates for interest credits, payment receipts, and withdrawal statuses by email."
              checked={settings.emailAlerts}
              onChange={toggleField('emailAlerts')}
              icon={Bell}
              themeColor="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
            />
            <ToggleRow
              label="SMS Alerts"
              description="Receive direct text messages for important account updates and security verifications."
              checked={settings.smsAlerts}
              onChange={toggleField('smsAlerts')}
              icon={Smartphone}
              themeColor="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
            />
            <ToggleRow
              label="Payout Reminders"
              description="Get timely notifications prior to wallet payouts and interest credit dates."
              checked={settings.payoutReminders}
              onChange={toggleField('payoutReminders')}
              icon={Bell}
              themeColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
            />
            <ToggleRow
              label="Referral Updates"
              description="Get real-time updates when new direct or indirect members join using your code."
              checked={settings.referralUpdates}
              onChange={toggleField('referralUpdates')}
              icon={Bell}
              themeColor="bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
            />
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="rounded-2xl border border-slate-200 bg-white/50 p-6 dark:border-slate-800 dark:bg-slate-900/50 animate-fade-in-up">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Security & Investment Preferences</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Manage automated system triggers and secure authentication options.</p>
            </div>

            <ToggleRow
              label="Auto Reinvest"
              description="Reinvest matured or eligible wallet balance automatically into the next high-yield plan."
              checked={settings.autoReinvest}
              onChange={toggleField('autoReinvest')}
              icon={ShieldCheck}
              themeColor="bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
            />
            <ToggleRow
              label="Secure Login Alerts"
              description="Get immediate security warnings whenever a login is attempted from a new device."
              checked={settings.secureLoginAlerts}
              onChange={toggleField('secureLoginAlerts')}
              icon={Lock}
              themeColor="bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
            />
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Active Sessions Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Active Device Sessions</h3>
              <div className="space-y-4">
                <div className="flex items-start justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0 dark:border-slate-800">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">Chrome on Windows 11</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">IP: 192.168.1.45 • Mumbai, India</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                    Current Session
                  </span>
                </div>

                <div className="flex items-start justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0 dark:border-slate-800">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">Safari on iPhone 15 Pro</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">IP: 103.45.21.90 • Mumbai, India</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-300 font-medium">
                    2 hours ago
                  </span>
                </div>
              </div>
            </div>

            {/* Audit Log Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Security Audit Log</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between border-l-2 border-emerald-500 pl-3">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">Successful login completed</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">Device: Chrome (Windows) • Mumbai, India</p>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-300">Today, 10:10 AM</span>
                </div>

                <div className="flex items-center justify-between border-l-2 border-indigo-500 pl-3">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">MPIN authenticated successfully</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">Security check passed for session</p>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-300">Today, 10:11 AM</span>
                </div>

                <div className="flex items-center justify-between border-l-2 border-slate-300 pl-3 dark:border-slate-700">
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">Security settings modified</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">Auto Reinvest enabled</p>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-300">Yesterday, 9:45 AM</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Controls & Action Buttons */}
        {activeTab !== 'sessions' && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/40">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 transition-all duration-300 hover:bg-indigo-700 hover:shadow-indigo-700/20 active:scale-[0.97]"
                >
                  <Save className="h-4 w-4" />
                  Save Settings
                </button>
                <button
                  type="button"
                  onClick={handleRestore}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 active:scale-[0.97]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restore Defaults
                </button>
              </div>

              {/* Status Message Panel */}
              <div className="flex items-center gap-2 text-sm">
                {saved ? (
                  <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-1.5 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                    <CheckCircle2 className="h-4 w-4" />
                    Settings saved for this demo session.
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-300">
                    <AlertCircle className="h-4 w-4 text-indigo-500" />
                    Toggle preferences and save your changes.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;
