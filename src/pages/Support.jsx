import { LifeBuoy, Mail, MessageCircle, Phone, Send, ChevronDown, CheckCircle2, AlertCircle, HelpCircle, MessageSquare, Search, Info, Sliders, Layers, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { supportFaq } from '../data/mockData';
import { createSupportTicket, getSupportTickets } from '../services/api';

const fallbackFaq = [
  {
    title: 'How do I deposit funds into my wallet?',
    answer: 'You can deposit funds via IMPS, NEFT, RTGS, or UPI. Navigate to the Wallet section to find the current active bank details. After making the transfer, upload your payment receipt in the "Payment Receipts" tab. Credits are processed and reflected in your wallet within 2 to 4 hours.',
  },
  {
    title: 'What is the minimum withdrawal amount and time?',
    answer: 'The minimum amount for withdrawal is ₹1,000. All withdrawals are processed directly into your linked bank account. Standard withdrawals take between 12 to 24 business hours to credit after admin approval.',
  },
  {
    title: 'How are interest payouts calculated?',
    answer: 'Interest calculations depend on the specific plan duration and interest rates. Returns are credited on a monthly basis directly to your wallet balance. You can choose to automatically reinvest these returns by enabling Auto Reinvest in Settings.',
  },
  {
    title: 'How long does KYC verification take?',
    answer: 'Once you upload your PAN, Aadhaar, and selfie details, our operations team reviews the files. KYC verification is usually completed within 12 to 24 hours, after which you will be eligible to link your bank account and request withdrawals.',
  },
  {
    title: 'How does the referral commission structure work?',
    answer: 'The referral network tracks your direct and network-depth signups. Once a referral makes a successful investment plan contribution, commissions are automatically credited to your wallet according to your referral tier metrics.',
  },
];

function FaqItem({ title, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      onClick={() => setIsOpen(!isOpen)}
      className={`group rounded-2xl border transition-all duration-300 cursor-pointer p-5 ${ isOpen ? 'border-indigo-200 bg-indigo-50/20 dark:border-indigo-900/40 dark:bg-indigo-950/10' : 'border-slate-200/80 bg-white hover:shadow-md hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700' }`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* FAQ Icon with custom gradient state */}
          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${ isOpen ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/20' : 'bg-gradient-to-br from-purple-500/10 to-indigo-500/10 text-indigo-600 dark:from-purple-900/20 dark:to-indigo-900/20 dark:text-indigo-400 group-hover:scale-105' }`}>
            <HelpCircle className="h-4.5 w-4.5" />
          </div>
          <p className={`font-semibold transition-colors leading-snug ${ isOpen ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400' }`}>
            {title}
          </p>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-500 dark:text-slate-300 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
      </div>
      
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80' : 'max-h-0 opacity-0'}`}>
        <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-300">
          {answer}
        </p>
      </div>
    </div>
  );
}

function Support() {
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ category: 'GENERAL', subject: '', message: '', priority: 'MEDIUM' });
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [faqSearch, setFaqSearch] = useState('');

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
    setSubmitting(true);
    try {
      await createSupportTicket(form);
      setForm({ category: 'GENERAL', subject: '', message: '', priority: 'MEDIUM' });
      setMessage('Support ticket created successfully.');
      loadTickets();
    } catch (err) {
      setMessage(err?.message || 'Unable to create support ticket.');
    } finally {
      setSubmitting(false);
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
    {
      key: 'id',
      label: 'Ticket ID',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-800">
          #{String(row.id).slice(-8).toUpperCase()}
        </span>
      ),
    },
    {
      key: 'subject',
      label: 'Subject',
      render: (row) => (
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {row.subject}
        </span>
      ),
    },
    {
      key: 'createdOn',
      label: 'Created On',
      render: (row) => (
        <span className="text-xs text-slate-500 dark:text-slate-300">
          {row.createdOn}
        </span>
      ),
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => {
        const priority = String(row.priority).toUpperCase();
        const config = {
          LOW: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
          MEDIUM: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30',
          HIGH: 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200 dark:border-rose-900/30',
        };
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${config[priority] || 'bg-slate-50 text-slate-700'} dark:text-slate-200`}>
            <span className={`h-1.5 w-1.5 rounded-full ${ priority === 'LOW' ? 'bg-emerald-500' : priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-rose-500' }`} />
            {row.priority}
          </span>
        );
      },
    },
    {
      key: 'reply',
      label: 'Admin Reply',
      render: (row) => {
        const hasReply = row.reply && row.reply !== '-';
        if (!hasReply) {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-slate-400 bg-slate-50/50 border border-slate-100/50 dark:bg-slate-800/20 dark:border-slate-800 dark:text-slate-300">
              <Clock className="h-3 w-3 animate-spin" style={{ animationDuration: '3s' }} />
              Awaiting response
            </span>
          );
        }
        return (
          <div className="flex flex-col gap-1 max-w-[280px]">
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Representative Response
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic bg-indigo-50/10 dark:bg-indigo-950/5 p-2.5 rounded-xl border border-indigo-50/30 dark:border-indigo-950/10">
              "{row.reply}"
            </p>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge label={row.status} />,
    },
  ];

  const displayFaq = supportFaq && supportFaq.length > 0 ? supportFaq : fallbackFaq;
  const filteredFaqs = displayFaq.filter((item) =>
    item.title.toLowerCase().includes(faqSearch.toLowerCase()) ||
    item.answer.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Support Hero Section */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-10 text-center text-white shadow-lg dark:from-slate-950 dark:via-indigo-950/30 dark:to-slate-950">
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 ring-1 ring-inset ring-indigo-500/20">
            Customer Support Center
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl font-heading">
            How can we help you today?
          </h2>
          <p className="text-slate-500 dark:text-slate-300 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Search our integrated knowledge base, reach contact endpoints, or submit a support ticket below.
          </p>

          {/* Search bar inside Hero */}
          <div className="relative max-w-md mx-auto mt-6">
            <input
              type="text"
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 pl-10 text-sm text-white outline-none placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition duration-300"
              placeholder="Search frequently asked questions..."
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-300" />
          </div>
        </div>
      </div>

      {/* 3-Column Contact Channels grid with glowing premium 3D gradient icons */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Email Support Card */}
        <a
          href="mailto:support@anushatrade.com"
          className="group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-305 hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-sky-500/0 group-hover:from-indigo-500/5 group-hover:to-sky-500/5 transition duration-300" />
          <div className="relative z-10 flex flex-col items-center text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-400 text-white shadow-md shadow-indigo-500/15 group-hover:scale-110 transition duration-300">
              <Mail className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-base">Email Support</p>
              <p className="text-xs text-slate-500 dark:text-slate-300 mt-1 leading-relaxed">Response within 2-4 hours</p>
              <span className="inline-block mt-3.5 text-sm font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">support@anushatrade.com</span>
            </div>
          </div>
        </a>

        {/* Call Support Card */}
        <a
          href="tel:+916309981444"
          className="group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-300 hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/5 group-hover:to-teal-500/5 transition duration-300" />
          <div className="relative z-10 flex flex-col items-center text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white shadow-md shadow-emerald-500/15 group-hover:scale-110 transition duration-300">
              <Phone className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-base">Call Support</p>
              <p className="text-xs text-slate-500 dark:text-slate-300 mt-1 leading-relaxed">Direct support call desk</p>
              <span className="inline-block mt-3.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline">+91 6309981444</span>
            </div>
          </div>
        </a>

        {/* WhatsApp Support Card */}
        <a
          href="https://wa.me/916309981444"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-sm hover:shadow-md hover:border-green-300 transition-all duration-300 hover:-translate-y-1 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-emerald-500/0 group-hover:from-green-500/5 group-hover:to-emerald-500/5 transition duration-300" />
          <div className="relative z-10 flex flex-col items-center text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-md shadow-green-500/15 group-hover:scale-110 transition duration-300">
              <MessageCircle className="h-5.5 w-5.5" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-base">WhatsApp Support</p>
              <p className="text-xs text-slate-500 dark:text-slate-300 mt-1 leading-relaxed">Instant messaging assistance</p>
              <span className="inline-block mt-3.5 text-sm font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline">Chat on WhatsApp</span>
            </div>
          </div>
        </a>
      </div>

      {/* Middle Split Grid: FAQ list & Create Ticket Form */}
      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        {/* Left Card: FAQ List */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h3>
              <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">Instant answers for common portal questions.</p>
            </div>
            {faqSearch && (
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-750 dark:bg-indigo-950/20 dark:text-indigo-400">
                Filtered: {filteredFaqs.length}
              </span>
            )}
          </div>

          {filteredFaqs.length === 0 ? (
            <div className="flex flex-col items-center text-center py-16 px-4 my-auto rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300">
              <HelpCircle className="h-10 w-10 text-slate-400 dark:text-slate-600 mb-2 animate-bounce" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-300">No results for "{faqSearch}"</p>
              <p className="text-xs mt-1 leading-relaxed text-slate-500 dark:text-slate-300 max-w-[280px]">Try using general phrases or contact channels, or open a support ticket to the right.</p>
            </div>
          ) : (
            <div className="space-y-3.5 overflow-y-auto max-h-[440px] pr-1.5 scrollbar-thin">
              {filteredFaqs.map((item) => (
                <FaqItem key={item.title} title={item.title} answer={item.answer} />
              ))}
            </div>
          )}
        </div>

        {/* Right Card: Create Ticket */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Create Support Ticket</h3>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">Raise category-based query triggers for reviews.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Category</span>
                <div className="relative mt-1">
                  <select
                    className="input-shell appearance-none pl-10 pr-10 focus:border-indigo-600 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="GENERAL">General</option>
                    <option value="WALLET">Wallet</option>
                    <option value="WITHDRAWAL">Withdrawal</option>
                    <option value="REFERRAL">Referral</option>
                    <option value="KYC">KYC</option>
                  </select>
                  <Layers className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-indigo-500 pointer-events-none" />
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-300 pointer-events-none" />
                </div>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Priority</span>
                <div className="relative mt-1">
                  <select
                    className="input-shell appearance-none pl-10 pr-10 focus:border-indigo-600 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  >
                    <option value="LOW">Low Priority</option>
                    <option value="MEDIUM">Medium Priority</option>
                    <option value="HIGH">High Priority</option>
                  </select>
                  <Sliders className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-amber-500 pointer-events-none" />
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-300 pointer-events-none" />
                </div>
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Subject</span>
              <div className="relative mt-1">
                <input
                  className="input-shell pl-10 focus:border-indigo-600 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="Brief summary of your query..."
                  required
                />
                <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-blue-500 pointer-events-none" />
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Describe Issue</span>
              <div className="relative mt-1">
                <textarea
                  className="input-shell pl-10 pt-3 min-h-[120px] focus:border-indigo-600 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 leading-relaxed"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Provide detailed description of the problem..."
                  required
                />
                <Info className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-teal-500 pointer-events-none" />
              </div>
            </label>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 transition-all duration-300 hover:from-indigo-700 hover:to-blue-700 active:scale-[0.97] disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {submitting ? 'Submitting...' : 'Create Ticket'}
              </button>

              {message && (
                <div className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border ${ message.toLowerCase().includes('success') ? 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400' : 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400' }`}>
                  {message.toLowerCase().includes('success') ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
                  <span className="max-w-[200px] truncate">{message}</span>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Bottom Tickets DataTable */}
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
