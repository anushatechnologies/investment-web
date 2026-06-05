import { MessageSquareReply } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
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
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">Service desk</p>
        <h1 className="section-title mt-3">Support Tickets</h1>
        <p className="section-copy mt-3 max-w-3xl">Review investor support tickets and send admin replies.</p>
      </div>

      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

      {selected && (
        <SectionCard title="Respond to Ticket" subtitle={selected.subject}>
          <form onSubmit={handleReply} className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
              {selected.raw.message}
            </div>
            <select className="input-shell" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
            <textarea className="input-shell min-h-28" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Admin reply" />
            <button type="submit" className="btn-primary">
              <MessageSquareReply className="h-4 w-4" />
              <span>Update Ticket</span>
            </button>
          </form>
        </SectionCard>
      )}

      <DataTable
        title="Tickets"
        description="All investor support requests."
        data={rows}
        columns={[
          { key: 'subject', label: 'Subject' },
          { key: 'category', label: 'Category' },
          { key: 'priority', label: 'Priority' },
          { key: 'status', label: 'Status', exportValue: (row) => row.status, render: (row) => <StatusBadge label={row.status} /> },
          { key: 'createdAt', label: 'Created' },
          { key: 'action', label: 'Action', render: (row) => <button type="button" onClick={() => setSelected(row)} className="rounded-xl border border-blue-500/20 bg-blue-500/15 px-3 py-2 text-xs font-semibold text-blue-100">Reply</button> },
        ]}
        searchableKeys={['subject', 'category', 'priority', 'status', 'userId']}
        filterKey="status"
        filterOptions={['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']}
        enableCsvExport
        exportFileName="support-tickets"
      />
    </div>
  );
}

export default AdminSupportPage;
