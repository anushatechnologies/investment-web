import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, KeyRound, MailCheck, ShieldCheck, Shield, Clock, Globe, Laptop, ArrowRight, ShieldAlert, Search } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { getSecuritySummary } from '../services/api';
import { useTheme } from '@mui/material/styles';

const getEventMeta = (action) => {
  const act = action.toUpperCase();
  if (act.includes('LOGIN')) {
    return {
      icon: KeyRound,
      colorClass: 'text-blue-500',
      borderClass: 'border-blue-500',
    };
  }
  if (act.includes('CREATED') || act.includes('SETUP') || act.includes('LINK')) {
    return {
      icon: ShieldCheck,
      colorClass: 'text-emerald-500',
      borderClass: 'border-emerald-500',
    };
  }
  if (act.includes('RESET') || act.includes('WARNING') || act.includes('FAIL')) {
    return {
      icon: ShieldAlert,
      colorClass: 'text-rose-500',
      borderClass: 'border-rose-500',
    };
  }
  return {
    icon: Shield,
    colorClass: 'text-indigo-500',
    borderClass: 'border-indigo-500',
  };
};

function SecurityCenter() {
  const [summary, setSummary] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  useEffect(() => {
    getSecuritySummary()
      .then(setSummary)
      .catch(() => setSummary({}));
  }, []);

  const score = useMemo(() => {
    let count = 0;
    if (summary.emailVerified) count += 25;
    if (summary.bankVerified) count += 25;
    if (summary.mpinCreated) count += 25;
    if (summary.biometricEnabled) count += 25;
    return count;
  }, [summary]);

  const scoreMeta = useMemo(() => {
    if (score === 100) {
      return { grade: 'A+', text: 'Secured Profile', color: 'from-emerald-500 to-teal-500', textClass: 'text-emerald-500 dark:text-emerald-400', desc: 'Excellent protection. Your account profile is fully hardened against credential threats.' };
    }
    if (score >= 75) {
      return { grade: 'B', text: 'Standard Protection', color: 'from-indigo-500 to-blue-500', textClass: 'text-indigo-500 dark:text-indigo-400', desc: 'Good coverage. Complete the remaining safety checkup step to achieve maximum protection.' };
    }
    return { grade: 'C', text: 'Action Required', color: 'from-amber-500 to-orange-500', textClass: 'text-amber-500 dark:text-amber-400', desc: 'Incomplete protection. Enable all security layers immediately to lock down your capital workspace.' };
  }, [score]);

  const events = useMemo(() => {
    return Array.isArray(summary.recentEvents)
      ? summary.recentEvents.map((event) => ({
          id: event.id,
          action: event.action,
          entityType: event.entityType,
          ipAddress: event.ipAddress || '-',
          userAgent: event.userAgent || '-',
          occurredAt: event.occurredAt ? new Date(event.occurredAt).toLocaleString() : '-',
        }))
      : [];
  }, [summary.recentEvents]);

  const filteredEvents = useMemo(() => {
    if (!searchTerm) return events;
    const term = searchTerm.toLowerCase();
    return events.filter(
      (event) =>
        event.action.toLowerCase().includes(term) ||
        event.entityType.toLowerCase().includes(term) ||
        event.ipAddress.toLowerCase().includes(term) ||
        event.userAgent.toLowerCase().includes(term) ||
        event.occurredAt.toLowerCase().includes(term)
    );
  }, [events, searchTerm]);

  return (
    <div className="space-y-8 pt-2">
      {/* Top Section: Health Score and Active Session Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Security Health Score */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between transition-all duration-300">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Security Health Audit</span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 ${scoreMeta.textClass}`}>
                Grade {scoreMeta.grade}
              </span>
            </div>
            
            <div className="flex items-center gap-5 my-3">
              {/* Score Circular Ring */}
              <div className="relative flex items-center justify-center h-20 w-20 flex-shrink-0">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke={isDark ? '#1e293b' : '#f1f5f9'}
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke={score === 100 ? '#10b981' : score >= 75 ? '#6366f1' : '#f59e0b'}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 34}
                    strokeDashoffset={2 * Math.PI * 34 * (1 - score / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-lg font-bold text-slate-900 dark:text-white leading-none">{score}%</span>
                </div>
              </div>

              <div>
                <h4 className="font-heading font-bold text-slate-900 dark:text-white text-base">{scoreMeta.text}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-300 mt-1 max-w-sm leading-relaxed">
                  {scoreMeta.desc}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`bg-gradient-to-r ${scoreMeta.color} h-1.5 rounded-full transition-all duration-1000`} 
                style={{ width: `${score}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Active Protection Session Info */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between transition-all duration-300">
          <div>
            <div className="flex items-center gap-2 mb-3.5">
              <Shield className="h-5 w-5 text-indigo-500" />
              <h3 className="font-heading text-sm font-bold text-slate-900 dark:text-white">Active Session Protection</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed mb-4">
              Your session is protected by automated session timeouts and hardware verification tokens. Below are your current login details.
            </p>
            
            <div className="grid gap-3 text-xs bg-slate-50/50 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800/60 p-4 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-300 font-bold uppercase tracking-wider text-[9px]">Last Access Time</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {summary.lastLoginAt ? new Date(summary.lastLoginAt).toLocaleString() : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-300 font-bold uppercase tracking-wider text-[9px]">Ip Address</span>
                <code className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                  {summary.lastLoginIp || '-'}
                </code>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Encrypted Tunnel Connection Active</span>
          </div>
        </div>
      </div>

      {/* Security Checkup List Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Email Verification Card */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between transition hover:shadow-md duration-300">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
                <MailCheck className="h-5 w-5" />
              </div>
              <StatusBadge label={summary.emailVerified ? 'Verified' : 'Pending'} />
            </div>
            <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white mt-4">Email Verification</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-1.5 leading-relaxed">
              Secures transactions, payout confirmations, and system notifications.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-300">
            Primary email linked
          </div>
        </div>

        {/* Bank Account verification Card */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between transition hover:shadow-md duration-300">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <StatusBadge label={summary.bankVerified ? 'Linked' : 'Pending'} />
            </div>
            <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white mt-4">Payout Account</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-1.5 leading-relaxed">
              Verifies the beneficiary bank to prevent fraudulent cashout routing.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/bank/link')}
            className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
          >
            <span>Manage Bank</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* MPIN Lock Card */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between transition hover:shadow-md duration-300">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400">
                <KeyRound className="h-5 w-5" />
              </div>
              <StatusBadge label={summary.mpinCreated ? 'Enabled' : 'Not Set'} />
            </div>
            <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white mt-4">Secure MPIN</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-1.5 leading-relaxed">
              Enables quick lockouts, device switching authorizations, and confirmation flags.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/setup-mpin')}
            className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
          >
            <span>Configure MPIN</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Biometrics Card */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between transition hover:shadow-md duration-300">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-950/20 dark:text-violet-400">
                <Fingerprint className="h-5 w-5" />
              </div>
              <StatusBadge label={summary.biometricEnabled ? 'Active' : 'Disabled'} />
            </div>
            <h4 className="font-heading font-bold text-sm text-slate-900 dark:text-white mt-4">Biometric Login</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-1.5 leading-relaxed">
              Utilizes FaceID or fingerprint keys on mobile devices for secure workspace access.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-300">
            Set via Mobile app
          </div>
        </div>
      </div>

      {/* Premium Security Feed & Audit Log */}
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800 mb-6">
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Recent Security Events</h3>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">Real-time audit trails of logins, credential updates, and workspace operations.</p>
          </div>
          
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Filter events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-shell pl-9 pr-4 py-2 text-xs focus:border-indigo-600 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-300" />
          </div>
        </div>

        {filteredEvents.length > 0 ? (
          <div className="relative pl-6 border-l-2 border-slate-100 dark:border-slate-800 space-y-6">
            {filteredEvents.map((event, idx) => {
              const meta = getEventMeta(event.action);
              const EventIcon = meta.icon;
              return (
                <div 
                  key={event.id || idx}
                  className="group relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/30 hover:border-slate-200 hover:bg-slate-50/70 transition-all duration-300 dark:border-slate-800 dark:bg-slate-800/10 dark:hover:border-slate-800 dark:hover:bg-slate-800/20"
                >
                  {/* Timeline Node Connector Dot */}
                  <div className={`absolute -left-[33px] top-6 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white dark:bg-slate-950 transition-all duration-300 group-hover:scale-110 ${meta.borderClass}`}>
                    <EventIcon className={`h-3.5 w-3.5 ${meta.colorClass}`} />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                          {event.action.replace(/_/g, ' ')}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-slate-500 dark:text-slate-300">
                          {event.entityType}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-2 flex items-center gap-1.5">
                        <Laptop className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[280px] sm:max-w-sm" title={event.userAgent}>
                          {event.userAgent}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 sm:self-center">
                    {/* IP Badge */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-300 bg-white border border-slate-100 dark:bg-slate-900 dark:border-slate-800 px-2.5 py-1 rounded-xl shadow-sm">
                      <Globe className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300" />
                      <code className="font-mono font-semibold text-[11px]">{event.ipAddress}</code>
                    </div>

                    {/* Time Stamp */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-300">
                      <Clock className="h-3.5 w-3.5 text-slate-500 dark:text-slate-300" />
                      <span>{event.occurredAt}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl dark:text-slate-300">
            <ShieldAlert className="h-8 w-8 text-slate-500 dark:text-slate-300 animate-pulse" />
            <p className="font-heading font-bold text-sm text-slate-800 dark:text-slate-200 mt-2">No matching events</p>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">Try resetting your filter keywords.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default SecurityCenter;
