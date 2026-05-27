import { Bell, CheckCircle2, Mail, Share2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { getNotifications, markNotificationRead } from '../services/api';

function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.notifications)) return payload.notifications;
  return [];
}

function Notifications() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let active = true;

    const fetchNotifications = () => {
      getNotifications()
        .then((response) => {
          if (!active) return;
          setItems(
            toArray(response).map((item, index) => ({
              id: item.id || item.notificationId || `NTF${index + 1}`,
              title: item.title || item.subject || 'Notification',
              message: item.message || item.description || '-',
              category: item.category || item.type || 'General',
              status: (item.read || item.isRead) ? 'Read' : 'Unread',
              time: item.time || item.createdAt || '-',
            })),
          );
        })
        .catch(() => {
          if (!active) return;
          setItems([]);
        });
    };

    fetchNotifications();
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
      { title: 'Wallet Updates', value: items.filter((item) => String(item.category || '').toUpperCase().includes('WALLET')).length, icon: Mail, tone: 'violet', note: 'payment activity' },
      { title: 'Referral Updates', value: items.filter((item) => String(item.category || '').toUpperCase().includes('REFERRAL')).length, icon: Share2, tone: 'amber', note: 'network activity' },
    ],
    [items, unreadCount, readCount],
  );

  const markAllRead = async () => {
    const unreadItems = items.filter((item) => item.status === 'Unread');
    await Promise.all(unreadItems.map((item) => markNotificationRead(item.id).catch(() => null)));
    setItems((current) => current.map((item) => ({ ...item, status: 'Read' })));
  };

  const markAsRead = async (id) => {
    await markNotificationRead(id).catch(() => null);
    setItems((current) => current.map((item) => (item.id === id ? { ...item, status: 'Read' } : item)));
  };

  const deleteNotification = (id) => {
    setItems((current) => current.filter((item) => item.id !== id));
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <SectionCard title="All Notifications" subtitle="Recent updates and alerts from your investor account.">
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              className={`rounded-[24px] border ${item.status === 'Unread' ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200 bg-slate-50'} px-5 py-4 transition-colors`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <StatusBadge label={item.status} />
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
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export default Notifications;
