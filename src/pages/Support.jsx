import { LifeBuoy, Mail, MessageCircle, Phone } from 'lucide-react';
import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import { supportFaq } from '../data/mockData';
import { createSupportTicket, getSupportTickets } from '../services/api';

function Support() {
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ category: 'GENERAL', subject: '', message: '', priority: 'MEDIUM' });
  const [message, setMessage] = useState('');

  const loadTickets = () => {
    getSupportTickets()
      .then((data) => setTickets(Array.isArray(data) ? data : []))
      .catch(() => setTickets([]));
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      await createSupportTicket(form);
      setForm({ category: 'GENERAL', subject: '', message: '', priority: 'MEDIUM' });
      setMessage('Support ticket created successfully.');
      loadTickets();
    } catch (err) {
      setMessage(err?.message || 'Unable to create support ticket.');
    }
  };

  const ticketRows = tickets.map((ticket) => ({
    id: ticket.id,
    subject: ticket.subject,
    createdOn: ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '-',
    priority: ticket.priority,
    status: ticket.status,
    reply: ticket.adminReply || '-',
  }));

  const columns = [
    { key: 'id', label: 'Ticket ID' },
    { key: 'subject', label: 'Subject' },
    { key: 'createdOn', label: 'Created On' },
    { key: 'priority', label: 'Priority' },
    { key: 'reply', label: 'Admin Reply' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge label={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="section-title">Support</h2>
        <p className="section-copy mt-3 max-w-3xl">
          Reach support for wallet, withdrawal, referral, or receipt-related questions and track
          your open tickets.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <SectionCard title="Contact Channels" subtitle="Quick ways to reach the support team.">
          <div className="space-y-4">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-slate-900">Email Support</p>
                  <p className="text-sm text-slate-500">support@anushatrade.com</p>
                </div>
              </div>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-semibold text-slate-900">Call Support</p>
                  <p className="text-sm text-slate-500">+91 6309981444</p>
                </div>
              </div>
            </div>
            <a href="https://wa.me/916309981444" target="_blank" rel="noopener noreferrer" className="block rounded-[24px] border border-slate-200 bg-slate-50 p-5 transition hover:border-emerald-300 hover:bg-emerald-50">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-semibold text-slate-900">WhatsApp Chat</p>
                  <p className="text-sm text-slate-500">Chat with us on WhatsApp</p>
                </div>
              </div>
            </a>
          </div>
        </SectionCard>

        <SectionCard title="Create Ticket" subtitle="Raise wallet, withdrawal, referral, or receipt issues.">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <select className="input-shell" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="GENERAL">General</option>
                <option value="WALLET">Wallet</option>
                <option value="WITHDRAWAL">Withdrawal</option>
                <option value="REFERRAL">Referral</option>
                <option value="KYC">KYC</option>
              </select>
              <select className="input-shell" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <input className="input-shell" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Subject" required />
            <textarea className="input-shell min-h-32" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Explain your issue" required />
            {message && <p className="text-sm text-slate-600">{message}</p>}
            <button type="submit" className="btn-primary">Create Ticket</button>
          </form>
        </SectionCard>
      </div>

      <SectionCard title="Frequently Asked Questions" subtitle="Fast answers for common investor queries.">
        <div className="grid gap-4 lg:grid-cols-2">
            {supportFaq.map((item) => (
              <div key={item.title} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start gap-3">
                  <LifeBuoy className="mt-1 h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-500">{item.answer}</p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </SectionCard>

      <DataTable
        title="Support Tickets"
        description="Current and previous support requests from your account."
        data={ticketRows}
        columns={columns}
        searchableKeys={['id', 'subject', 'priority', 'status', 'reply']}
        searchPlaceholder="Search support tickets..."
        filterKey="status"
        filterOptions={['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']}
      />
    </div>
  );
}

export default Support;
