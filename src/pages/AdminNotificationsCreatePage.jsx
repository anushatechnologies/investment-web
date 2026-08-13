import React, { useState } from 'react';
import { adminBroadcastNotification } from '../services/api';

export default function AdminNotificationsCreatePage() {
  const [form, setForm] = useState({
    title: '',
    message: '',
    targetAudience: 'ALL_USERS',
    channel: 'ALL',
  });
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.message) {
      alert('Title and Message are required');
      return;
    }
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await adminBroadcastNotification(form);
      setStatusMsg({ type: 'success', text: res?.message || 'Notification broadcast queued successfully!' });
      setForm({ title: '', message: '', targetAudience: 'ALL_USERS', channel: 'ALL' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err?.message || 'Failed to broadcast notification' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Multi-Channel Notification Broadcaster
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Dispatch promotional announcements, interest credit updates, and operational notices across Email, Push, SMS, and WhatsApp.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`rounded-lg p-4 text-sm font-semibold border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Notification Title *
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            required
            placeholder="e.g. Monthly Interest Credited for August 2026"
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Audience
            </label>
            <select
              value={form.targetAudience}
              onChange={(e) => setForm((p) => ({ ...p, targetAudience: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="ALL_USERS">All Registered Investors</option>
              <option value="KYC_PENDING">Investors with Pending KYC</option>
              <option value="PLAN_INVESTORS">Active Plan Subscribers</option>
              <option value="UPCOMING_MATURITY">Investors Maturing in 30 Days</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Delivery Channel
            </label>
            <select
              value={form.channel}
              onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="ALL">All Channels (Push + Email + SMS + WhatsApp)</option>
              <option value="PUSH">In-App Push Only</option>
              <option value="EMAIL">Email SMTP Only</option>
              <option value="SMS">SMS Only</option>
              <option value="WHATSAPP">Meta WhatsApp Cloud API Only</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Message Body *
          </label>
          <textarea
            value={form.message}
            onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
            required
            rows={5}
            placeholder="Write clear, professional message text..."
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Queueing Broadcast...' : 'Broadcast Notification Now'}
          </button>
        </div>
      </form>
    </div>
  );
}
