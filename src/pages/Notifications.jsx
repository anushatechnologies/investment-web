import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { 
  Bell, 
  CheckCircle2, 
  Gift, 
  Share2, 
  ShieldCheck, 
  Wallet, 
  Trash2, 
  Check, 
  ShieldAlert, 
  Clock, 
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import {
  deleteNotification as deleteNotificationRequest,
  getNotificationPreferences,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  updateNotificationPreferences,
} from '../services/api';
import { formatDate } from '../utils/formatters';

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

const getNotificationMeta = (type) => {
  const value = String(type || '').toUpperCase();
  if (value.includes('KYC_APPROVED') || value.includes('APPROVED')) {
    return {
      icon: ShieldCheck,
      gradColor: 'from-emerald-500 to-teal-500',
      iconColor: 'text-emerald-500',
      bgIconColor: 'bg-emerald-50 dark:bg-emerald-950/20',
      borderColor: 'border-emerald-200/30 dark:border-emerald-900/20',
    };
  }
  if (value.includes('REJECTED') || value.includes('FRAUD') || value.includes('ALERT')) {
    return {
      icon: ShieldAlert,
      gradColor: 'from-rose-500 to-red-500',
      iconColor: 'text-rose-500',
      bgIconColor: 'bg-rose-50 dark:bg-rose-950/20',
      borderColor: 'border-rose-200/30 dark:border-rose-900/20',
    };
  }
  if (value.includes('INTEREST') || value.includes('INCOME') || value.includes('CASHBACK') || value.includes('CREDITED') || value.includes('WALLET')) {
    return {
      icon: Wallet,
      gradColor: 'from-blue-500 to-indigo-500',
      iconColor: 'text-blue-500',
      bgIconColor: 'bg-blue-50 dark:bg-blue-950/20',
      borderColor: 'border-blue-200/30 dark:border-blue-900/20',
    };
  }
  if (value.includes('REFERRAL') || value.includes('COMMISSION')) {
    return {
      icon: Share2,
      gradColor: 'from-amber-500 to-orange-500',
      iconColor: 'text-amber-500',
      bgIconColor: 'bg-amber-50 dark:bg-amber-950/20',
      borderColor: 'border-amber-200/30 dark:border-amber-900/20',
    };
  }
  if (value.includes('COUPON') || value.includes('GIFT')) {
    return {
      icon: Gift,
      gradColor: 'from-fuchsia-500 to-pink-500',
      iconColor: 'text-fuchsia-500',
      bgIconColor: 'bg-fuchsia-50 dark:bg-fuchsia-950/20',
      borderColor: 'border-fuchsia-200/30 dark:border-fuchsia-900/20',
    };
  }
  return {
    icon: Bell,
    gradColor: 'from-purple-500 to-violet-500',
    iconColor: 'text-purple-500',
    bgIconColor: 'bg-purple-50 dark:bg-purple-950/20',
    borderColor: 'border-purple-200/30 dark:border-purple-900/20',
  };
};

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
    time: formatDate(item.sentAt || item.createdAt || item.time || '-'),
  };
}

function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState({});
  const [savingPreference, setSavingPreference] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const fetchNotifications = () => {
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

  const unreadCount = useMemo(() => items.filter((item) => item.status === 'Unread').length, [items]);
  const readCount = useMemo(() => items.filter((item) => item.status === 'Read').length, [items]);

  const stats = useMemo(
    () => [
      { 
        title: 'Unread Alerts', 
        value: unreadCount, 
        icon: Bell, 
        gradColor: 'from-blue-500 to-indigo-500', 
        shadowColor: 'shadow-blue-500/20',
        note: 'new actions for you' 
      },
      { 
        title: 'KYC & Security', 
        value: items.filter((item) => String(item.rawType || '').toUpperCase().includes('KYC') || String(item.rawType || '').toUpperCase().includes('FRAUD')).length, 
        icon: ShieldCheck, 
        gradColor: 'from-cyan-500 to-teal-500', 
        shadowColor: 'shadow-cyan-500/20',
        note: 'document approvals & warnings' 
      },
      { 
        title: 'Wallet Payouts', 
        value: items.filter((item) => String(item.rawType || '').toUpperCase().includes('INTEREST') || String(item.rawType || '').toUpperCase().includes('INCOME') || String(item.rawType || '').toUpperCase().includes('CASHBACK')).length, 
        icon: Wallet, 
        gradColor: 'from-emerald-500 to-teal-500', 
        shadowColor: 'shadow-emerald-500/20',
        note: 'returns & cashback logs' 
      },
    ],
    [items, unreadCount],
  );

  const filteredItems = useMemo(() => {
    if (activeTab === 'Unread') return items.filter(item => item.status === 'Unread');
    if (activeTab === 'Financial') return items.filter(item => ['Monthly Interest', 'Referral Income', 'Referral Monthly Income', 'Referral Instant Cashback', 'Coupon Cashback'].includes(item.category));
    if (activeTab === 'Security') return items.filter(item => ['KYC Approved', 'KYC Rejected', 'KYC Update', 'Security Alert'].includes(item.category));
    if (activeTab === 'System') return items.filter(item => ['System Update', 'General', 'Withdrawal Update', 'Investment Update'].includes(item.category));
    return items;
  }, [items, activeTab]);

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

  const tabs = [
    { label: 'All Alerts', value: 'All', count: items.length },
    { label: 'Unread', value: 'Unread', count: unreadCount },
    { label: 'Financial', value: 'Financial', count: items.filter(item => ['Monthly Interest', 'Referral Income', 'Referral Monthly Income', 'Referral Instant Cashback', 'Coupon Cashback'].includes(item.category)).length },
    { label: 'KYC & Security', value: 'Security', count: items.filter(item => ['KYC Approved', 'KYC Rejected', 'KYC Update', 'Security Alert'].includes(item.category)).length },
    { label: 'System', value: 'System', count: items.filter(item => ['System Update', 'General', 'Withdrawal Update', 'Investment Update'].includes(item.category)).length },
  ];

  return (
    <div className="space-y-8 pt-2">
      
      {/* Stats Counter Section */}
      <div className="grid gap-6 md:grid-cols-3">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div 
              key={idx}
              className="group relative rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 dark:border-slate-800/80 dark:bg-slate-900 flex items-center justify-between overflow-hidden"
            >
              <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-5 bg-gradient-to-tr ${stat.gradColor} group-hover:scale-125 transition-transform duration-500`} />
              
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                  {stat.title}
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {stat.value}
                </h3>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-300">
                  {stat.note}
                </p>
              </div>

              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr ${stat.gradColor} text-white shadow-lg ${stat.shadowColor} transition-transform duration-300 group-hover:scale-115`}>
                <Icon className="h-5.5 w-5.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Notification Preferences with Toggle Switches */}
      <SectionCard title="Notification Preferences" subtitle="Configure alert channels and in-app updates.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['kyc', 'KYC document alerts', 'Verification approvals & rejects'],
            ['investment', 'Investment actions', 'Plan signups and payment approvals'],
            ['interest', 'Monthly interest payouts', 'Wallet interest credits'],
            ['referral', 'Referral commission payouts', 'Level growth and passive earnings'],
            ['cashback', 'Cashback coupons', 'Promotional cashback credits'],
            ['withdrawal', 'Withdrawal requests', 'Cashout processing status updates'],
            ['system', 'System notices', 'System updates and maintenance alerts'],
          ].map(([key, label, desc]) => (
            <div 
              key={key} 
              className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-900/40 hover:border-slate-200/60 dark:hover:border-slate-800 transition duration-300"
            >
              <div className="min-w-0 pr-3">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">{label}</span>
                <span className="block text-[9px] text-slate-500 dark:text-slate-300 mt-0.5 leading-tight">{desc}</span>
              </div>
              
              {/* iOS style Toggle Switch */}
              <button
                type="button"
                onClick={() => togglePreference(key)}
                disabled={savingPreference === key}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out outline-none focus:outline-none ${ preferences[key] !== false ? 'bg-indigo-600 dark:bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700' }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-250 ease-in-out ${ preferences[key] !== false ? 'translate-x-4' : 'translate-x-0' }`}
                />
              </button>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Main Alert Log list feed */}
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition duration-300">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 pb-5 border-b border-slate-100 dark:border-slate-800 mb-6">
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Alert Log</h3>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">Chronological feed of updates, milestones and confirmations.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {unreadCount > 0 && (
              <button 
                type="button" 
                onClick={markAllRead} 
                className="btn-secondary text-[11px] py-1.5 px-3 flex items-center gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-2.5 mb-6 border-b border-slate-50 dark:border-slate-800 pb-4">
          {tabs.map((tab) => {
            const active = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl transition ${ active ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/15' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-slate-200' }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-lg ${ active ? 'bg-white/20 text-white' : 'bg-slate-200/60 text-slate-500 dark:bg-slate-700 dark:text-slate-300' }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Alerts Feed items */}
        <div className="space-y-4">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-[20px] border border-slate-100 bg-slate-50/20 dark:border-slate-800 dark:bg-slate-800/10 p-5" />
              ))}
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="space-y-4">
              {filteredItems.map((item) => {
                const isUnread = item.status === 'Unread';
                const meta = getNotificationMeta(item.rawType);
                const AlertIcon = meta.icon;
                return (
                  <div
                    key={item.id}
                    className={`group relative rounded-[20px] border p-5 transition-all duration-300 dark:bg-slate-800/5 ${ isUnread ? 'border-indigo-100 bg-indigo-50/15 dark:border-indigo-900/30' : 'border-slate-100 bg-slate-50/20 hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700' }`}
                  >
                    {/* Unread Left Border Accent indicator */}
                    {isUnread && (
                      <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[20px] bg-indigo-600 dark:bg-indigo-500" />
                    )}

                    <div className="flex items-start gap-4">
                      {/* Gradient icon wrap */}
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr ${meta.gradColor} text-white shadow-md transition-transform duration-300 group-hover:scale-105`}>
                        <AlertIcon className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-heading font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                                {item.title}
                              </span>
                              {isUnread && (
                                <span className="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-950/45 text-[9px] font-extrabold uppercase px-2 py-0.5 text-indigo-600 dark:text-indigo-300 tracking-wider">
                                  New
                                </span>
                              )}
                              <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:text-slate-300">
                                {item.category}
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-300 leading-relaxed max-w-4xl">
                              {item.message}
                            </p>
                          </div>

                          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3.5 shrink-0 self-stretch sm:self-auto border-t border-slate-100 sm:border-0 pt-3 sm:pt-0 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-widest">
                              {item.time}
                            </span>
                            
                            {/* Inline Actions */}
                            <div className="flex items-center gap-2">
                              {isUnread && (
                                <button
                                  type="button"
                                  onClick={() => markAsRead(item.id)}
                                  title="Mark as Read"
                                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => deleteNotification(item.id)}
                                title="Delete Alert"
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-950/40"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-10 text-center text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl dark:text-slate-300">
              <CheckCircle2 className="h-8 w-8 text-slate-500 dark:text-slate-300 animate-pulse" />
              <p className="font-heading font-bold text-sm text-slate-800 dark:text-slate-200 mt-3">All caught up!</p>
              <p className="text-xs text-slate-500 dark:text-slate-300 mt-1 max-w-sm">No notifications match your current tab selection.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Notifications;
