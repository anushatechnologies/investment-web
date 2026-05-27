import { LifeBuoy, Mail, MessageCircle, Phone } from 'lucide-react';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import { supportFaq, supportTickets } from '../data/mockData';

function Support() {
  const columns = [
    { key: 'id', label: 'Ticket ID' },
    { key: 'subject', label: 'Subject' },
    { key: 'createdOn', label: 'Created On' },
    { key: 'priority', label: 'Priority' },
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

        <SectionCard title="Frequently Asked Questions" subtitle="Fast answers for common investor queries.">
          <div className="space-y-4">
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
      </div>

      <DataTable
        title="Support Tickets"
        description="Current and previous support requests from your account."
        data={supportTickets}
        columns={columns}
        searchableKeys={['id', 'subject', 'priority', 'status']}
        searchPlaceholder="Search support tickets..."
        filterKey="status"
        filterOptions={['Open', 'Completed']}
      />
    </div>
  );
}

export default Support;
