import { useMemo, useState } from 'react';
import { Download, FileCheck2, FileText, Landmark, ReceiptText } from 'lucide-react';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency } from '../utils/formatters';

function TaxCenter() {
  const [year, setYear] = useState('2025-26');
  const [interest, setInterest] = useState('72000');
  const [tdsRate, setTdsRate] = useState('10');

  const summary = useMemo(() => {
    const taxableInterest = Number(interest) || 0;
    const estimatedTds = taxableInterest * ((Number(tdsRate) || 0) / 100);
    return {
      taxableInterest,
      estimatedTds,
      netInterest: taxableInterest - estimatedTds,
    };
  }, [interest, tdsRate]);

  const documents = [
    { title: 'Annual Interest Statement', type: 'PDF', status: 'Ready', period: year },
    { title: 'TDS Working Sheet', type: 'CSV', status: 'Draft', period: year },
    { title: 'Investment Ledger', type: 'PDF', status: 'Ready', period: year },
  ];

  const downloadSummary = () => {
    const rows = [
      ['Financial Year', year],
      ['Taxable Interest', summary.taxableInterest],
      ['Estimated TDS', summary.estimatedTds],
      ['Net Interest', summary.netInterest],
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tax-summary-${year}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="section-title">Tax Center</h2>
          <p className="section-copy mt-3 max-w-3xl">
            Keep interest income, TDS estimates, and downloadable records in one place for filing season.
          </p>
        </div>
        <button type="button" onClick={downloadSummary} className="btn-primary">
          <Download className="h-4 w-4" />
          Export Summary
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
            <Landmark className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-500">Taxable Interest</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-slate-900">{formatCurrency(summary.taxableInterest)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <ReceiptText className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-500">Estimated TDS</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-slate-900">{formatCurrency(summary.estimatedTds)}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <FileCheck2 className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-500">Net Interest</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-slate-900">{formatCurrency(summary.netInterest)}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <SectionCard title="Tax Estimate" subtitle="Adjust this using your latest statement totals.">
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Financial year</span>
              <select className="input-shell mt-2" value={year} onChange={(event) => setYear(event.target.value)}>
                <option>2025-26</option>
                <option>2024-25</option>
                <option>2023-24</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Interest earned</span>
              <input className="input-shell mt-2" value={interest} onChange={(event) => setInterest(event.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">TDS rate (%)</span>
              <input className="input-shell mt-2" value={tdsRate} onChange={(event) => setTdsRate(event.target.value)} />
            </label>
          </div>
        </SectionCard>

        <SectionCard title="Documents" subtitle="Download or prepare records for your CA.">
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.title} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-blue-600">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{doc.title}</p>
                    <p className="text-sm text-slate-500">{doc.type} document - {doc.period}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge label={doc.status === 'Ready' ? 'Approved' : 'Pending'} />
                  <button type="button" className="btn-secondary !px-3 !py-2">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Filing Checklist" subtitle="A compact readiness view for investors.">
        <div className="grid gap-3 md:grid-cols-4">
          {['PAN verified in KYC', 'Interest statement ready', 'TDS estimate reviewed', 'Bank credits reconciled'].map((item) => (
            <div key={item} className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              {item}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export default TaxCenter;
