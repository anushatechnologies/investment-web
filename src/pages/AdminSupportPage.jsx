import { MessageSquareReply, MessageSquare, Clock, Activity, CheckCircle2, X, Send, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import { adminGetSupportTickets, adminRespondSupportTicket } from '../services/api';

function AdminSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState('IN_PROGRESS');
  const [message, setMessage] = useState('');

  const loadTickets = () => {
    adminGetSupportTickets().then((data) => setTickets(Array.isArray(data) ? data : [])).catch(() => setTickets([]));
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const stats = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => String(t.status).toUpperCase() === 'OPEN').length;
    const progress = tickets.filter((t) => String(t.status).toUpperCase() === 'IN_PROGRESS').length;
    const resolved = tickets.filter((t) => ['RESOLVED', 'CLOSED'].includes(String(t.status).toUpperCase())).length;
    return { total, open, progress, resolved };
  }, [tickets]);

  const rows = useMemo(
    () =>
      tickets.map((ticket) => ({
        id: ticket.id,
        userId: ticket.userId,
        category: ticket.category,
        subject: ticket.subject,
        priority: ticket.priority,
        status: ticket.status,
        createdAt: ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '-',
        adminReply: ticket.adminReply || '-',
        raw: ticket,
      })),
    [tickets],
  );

  const handleReply = async (event) => {
    event.preventDefault();
    if (!selected) return;
    await adminRespondSupportTicket(selected.id, { status, adminReply: reply });
    setMessage('Ticket updated.');
    setSelected(null);
    setReply('');
    setStatus('IN_PROGRESS');
    loadTickets();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">Service desk</p>
        <h1 className="section-title mt-3">Support Tickets</h1>
        <p className="section-copy mt-3 max-w-3xl">Review investor support tickets and send admin replies.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Tickets"     value={stats.total}    icon={MessageSquare}  tone="blue"    note="all time" />
        <StatCard title="Open Tickets"      value={stats.open}     icon={Clock}          tone="amber"   note="awaiting response" />
        <StatCard title="In Progress"       value={stats.progress} icon={Activity}       tone="violet"  note="being handled" />
        <StatCard title="Resolved & Closed" value={stats.resolved} icon={CheckCircle2}   tone="emerald" note="completed" />
      </div>

      {/* Success message */}
      {message && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.08] px-5 py-3.5 shadow-lg shadow-emerald-500/5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/20">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="rounded-lg p-1.5 text-emerald-500 transition hover:bg-emerald-500/20">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Conditionally Split layout if a ticket is selected */}
      <div className={`grid gap-6 ${selected ? 'lg:grid-cols-12' : 'grid-cols-1'}`}>
        <div className={selected ? 'lg:col-span-7 xl:col-span-8' : 'w-full'}>
          <DataTable
            title="Tickets Ledger"
            description="All investor support requests."
            data={rows}
            columns={[
              { key: 'subject', label: 'Subject' },
              { key: 'category', label: 'Category' },
              { key: 'priority', label: 'Priority', render: (row) => <StatusBadge label={row.priority} /> },
              { key: 'status', label: 'Status', exportValue: (row) => row.status, render: (row) => <StatusBadge label={row.status} /> },
              { key: 'createdAt', label: 'Created' },
              {
                key: 'action',
                label: 'Action',
                render: (row) => (
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(row);
                      setStatus(row.status || 'IN_PROGRESS');
                      setReply(row.raw.adminReply || '');
                    }}
                    className={`rounded-xl px-4 py-2 text-xs font-bold tracking-wide transition-all duration-200 ${
                      selected?.id === row.id
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-400/30'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 hover:opacity-90'
                    }`}
                  >
                    {selected?.id === row.id ? '✓ Active' : 'Reply'}
                  </button>
                ),
              },
            ]}
            searchableKeys={['subject', 'category', 'priority', 'status', 'userId']}
            filterKey="status"
            filterOptions={['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']}
            enableCsvExport
            exportFileName="support-tickets"
          />
        </div>

        {selected && (
          <div className="lg:col-span-5 xl:col-span-4">
            {/* Premium Reply Drawer */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-white/[0.08] bg-white dark:bg-[#071226] shadow-2xl shadow-black/10 dark:shadow-black/50">
              {/* Drawer Header */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-200/60 dark:border-white/[0.08] bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-white/[0.03] dark:to-transparent px-5 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquareReply className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Ticket #{selected.id}</p>
                  </div>
                  <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">Respond to Ticket</h3>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="flex-shrink-0 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/80 dark:bg-white/[0.05] p-2 text-slate-400 transition hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5 p-5">
                {/* Subject & Details Card */}
                <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.025] p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-300">
                      {selected.category}
                    </span>
                    <StatusBadge label={selected.priority} />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-snug">{selected.subject}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <User className="h-3.5 w-3.5" />
                    <span>Investor ID: {selected.userId}</span>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
                  {/* Investor Bubble */}
                  <div className="flex flex-col items-start gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-black text-white shadow-md shadow-blue-500/25">
                        INV
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Investor</span>
                      <span className="text-[10px] text-slate-400">{selected.createdAt}</span>
                    </div>
                    <div className="max-w-[92%] rounded-2xl rounded-tl-sm border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 p-3.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed shadow-sm">
                      {selected.raw.message}
                    </div>
                  </div>

                  {/* Admin Reply Bubble (if exists) */}
                  {selected.raw.adminReply !== '-' && selected.raw.adminReply && (
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">Previous response</span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Admin Support</span>
                        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-[10px] font-black text-white shadow-md shadow-indigo-500/25">
                          ADM
                        </div>
                      </div>
                      <div className="max-w-[92%] rounded-2xl rounded-tr-sm border border-indigo-500/20 bg-indigo-500/[0.06] dark:bg-indigo-500/[0.08] p-3.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed shadow-sm">
                        {selected.raw.adminReply}
                      </div>
                    </div>
                  )}
                </div>

                {/* Response Form */}
                <form onSubmit={handleReply} className="space-y-4 pt-4 border-t border-slate-200/60 dark:border-white/[0.08]">
                  {/* Status selector */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Update Ticket Status
                    </label>
                    <div className="flex gap-1.5 flex-wrap">
                      {[
                        { key: 'OPEN',        activeClass: 'border-amber-400 bg-amber-400/10 text-amber-600 dark:text-amber-300 shadow-amber-400/15' },
                        { key: 'IN_PROGRESS', activeClass: 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-300 shadow-blue-500/15' },
                        { key: 'RESOLVED',    activeClass: 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 shadow-emerald-500/15' },
                        { key: 'CLOSED',      activeClass: 'border-slate-400 bg-slate-400/10 text-slate-600 dark:text-slate-300 shadow-slate-400/15' },
                      ].map(({ key, activeClass }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setStatus(key)}
                          className={`rounded-xl border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-all duration-200 shadow-md ${
                            status === key
                              ? activeClass
                              : 'border-slate-200 dark:border-white/10 bg-transparent text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20 shadow-none'
                          }`}
                        >
                          {key.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Textarea */}
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                      Admin Reply
                    </label>
                    <textarea
                      className="w-full min-h-[110px] resize-none rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.03] p-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500/50"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Type your official support response..."
                      required
                    />
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 py-3.5 text-sm font-bold text-white shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all duration-200 active:scale-[0.98]"
                  >
                    <Send className="h-4 w-4" />
                    Send Update
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminSupportPage;
