import { Bell, CheckCircle2, Gift, Share2, ShieldCheck, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import {
  deleteNotification as deleteNotificationRequest,
  getNotificationPreferences,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
} from '../services/api';

function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.notifications)) return payload.notifications;
  return [];
}

function notificationCategory(type) {
  const value = String(type || '').toUpperCase();
  if (value === 'KYC_APPROVED') return 'KYC Approved';
  if (value === 'KYC_REJECTED') return 'KYC Rejected';
  if (value === 'KYC_UPDATE') return 'KYC Update';
  if (value === 'REFERRAL_INSTANT_CASHBACK') return 'Referral Instant Cashback';
  if (value === 'REFERRAL_MONTHLY_INCOME') return 'Referral Monthly Income';
  if (value === 'REFERRAL_COMMISSION') return 'Referral Income';
  if (value === 'COUPON_CASHBACK') return 'Coupon Cashback';
  if (value === 'INTEREST_CREDITED') return 'Monthly Interest';
  if (value === 'INVESTMENT_UPDATE') return 'Investment Update';
  if (value === 'WITHDRAWAL_UPDATE') return 'Withdrawal Update';
  if (value === 'FRAUD_ALERT') return 'Security Alert';
  if (value === 'SYSTEM') return 'System Update';
  return String(type || 'General').replaceAll('_', ' ');
}

function notificationTone(type) {
  const value = String(type || '').toUpperCase();
  if (value.includes('KYC_APPROVED') || value.includes('CASHBACK') || value.includes('MONTHLY_INCOME') || value.includes('INTEREST')) return 'emerald';
  if (value.includes('REJECTED') || value.includes('FRAUD')) return 'rose';
  if (value.includes('REFERRAL')) return 'amber';
  if (value.includes('KYC')) return 'blue';
  return 'violet';
}

function normalizeNotification(item, index) {
  const isRead = Boolean(item.readFlag ?? item.read ?? item.isRead);
  const rawType = item.category || item.type || 'General';
  return {
    id: item.id || item.notificationId || `NTF${index + 1}`,
    title: item.title || item.subject || 'Notification',
    message: item.message || item.description || '-',
    category: notificationCategory(rawType),
    rawType,
    tone: notificationTone(rawType),
    status: isRead ? 'Read' : 'Unread',
    time: item.sentAt || item.createdAt || item.time || '-',
  };
}

function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({});
  const [savingPreference, setSavingPreference] = useState('');

  useEffect(() => {
    let active = true;

    const fetchNotifications = () => {
      setLoading(true);
      getNotifications()
        .then((response) => {
          if (!active) return;
          setItems(toArray(response).map(normalizeNotification));
        })
        .catch(() => {
          if (!active) return;
          setItems([]);
        })
        .finally(() => {
          if (!active) return;
          setLoading(false);
        });
    };

    fetchNotifications();
    getNotificationPreferences().then(setPreferences).catch(() => setPreferences({}));
    const interval = setInterval(fetchNotifications, 10000); // poll every 10 seconds

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const unreadCount = items.filter((item) => item.status === 'Unread').length;
  const readCount = items.filter((item) => item.status === 'Read').length;

  const stats = useMemo(
    () => [
      { title: 'Unread Alerts', value: unreadCount, icon: Bell, tone: 'blue', note: 'new for you' },
      { title: 'Read Alerts', value: readCount, icon: CheckCircle2, tone: 'emerald', note: 'already reviewed' },
      { title: 'KYC Updates', value: items.filter((item) => String(item.rawType || '').toUpperCase().includes('KYC')).length, icon: ShieldCheck, tone: 'cyan', note: 'approval and review' },
      { title: 'Cashback Alerts', value: items.filter((item) => String(item.rawType || '').toUpperCase().includes('CASHBACK')).length, icon: Gift, tone: 'amber', note: 'wallet credits' },
      { title: 'Referral Updates', value: items.filter((item) => String(item.rawType || '').toUpperCase().includes('REFERRAL')).length, icon: Share2, tone: 'violet', note: 'network activity' },
      { title: 'Wallet Credits', value: items.filter((item) => String(item.rawType || '').toUpperCase().includes('INTEREST') || String(item.rawType || '').toUpperCase().includes('INCOME')).length, icon: Wallet, tone: 'emerald', note: 'interest and income' },
    ],
    [items, unreadCount, readCount],
  );

  const markAllRead = async () => {
    const unreadItems = items.filter((item) => item.status === 'Unread');
    if (!unreadItems.length) return;
    await markAllNotificationsRead().catch(() => null);
    setItems((current) => current.map((item) => ({ ...item, status: 'Read' })));
  };

  const markAsRead = async (id) => {
    await markNotificationRead(id).catch(() => null);
    setItems((current) => current.map((item) => (item.id === id ? { ...item, status: 'Read' } : item)));
  };

  const deleteNotification = async (id) => {
    await deleteNotificationRequest(id).catch(() => null);
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const togglePreference = async (key) => {
    const next = { ...preferences, [key]: !(preferences[key] !== false) };
    setPreferences(next);
    setSavingPreference(key);
    try {
      setPreferences(await updateNotificationPreferences(next));
    } catch {
      setPreferences(preferences);
    } finally {
      setSavingPreference('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="section-title">Notifications</h2>
          <p className="section-copy mt-3 max-w-3xl">
            Stay informed about wallet credits, referral activity, withdrawals, and account
            reminders.
          </p>
        </div>
        <button type="button" onClick={markAllRead} className="btn-secondary">
          Mark All Read
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <SectionCard title="Notification Preferences" subtitle="Choose which account events create in-app alerts.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['kyc', 'KYC alerts'],
            ['investment', 'Investment alerts'],
            ['interest', 'Interest alerts'],
            ['referral', 'Referral alerts'],
            ['cashback', 'Cashback alerts'],
            ['withdrawal', 'Withdrawal alerts'],
            ['system', 'System alerts'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => togglePreference(key)}
              className={`rounded-[18px] border px-4 py-3 text-left text-sm font-semibold transition ${preferences[key] !== false ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}
            >
              <span>{label}</span>
              <span className="mt-1 block text-xs font-medium">{savingPreference === key ? 'Saving...' : preferences[key] !== false ? 'Enabled' : 'Disabled'}</span>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="All Notifications" subtitle="Recent updates and alerts from your investor account.">
        <div className="space-y-4">
          {loading ? (
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
              Loading notifications...
            </div>
          ) : items.length ? (
            items.map((item) => (
              <div
                key={item.id}
                className={`rounded-[24px] border ${item.status === 'Unread' ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200 bg-slate-50'} px-5 py-4 transition-colors`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-semibold text-slate-900">{item.title}</p>
                      <StatusBadge label={item.status} />
                      <StatusBadge label={item.category} />
                    </div>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-500">{item.message}</p>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-3">
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-medium text-slate-700">{item.category}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{item.time}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.status === 'Unread' && (
                        <button
                          onClick={() => markAsRead(item.id)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(item.id)}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-600 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
              No notifications yet.
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}

export default Notifications;
