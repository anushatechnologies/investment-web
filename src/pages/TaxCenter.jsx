import { useMemo, useState } from 'react';
import { Download, FileCheck2, FileText, Landmark, ReceiptText, Calendar, Percent, CheckCircle2, ChevronDown, Table, ArrowUpRight, HelpCircle, Check } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency } from '../utils/formatters';

function TaxCenter() {
  const [year, setYear] = useState('2025-26');
  const [interest, setInterest] = useState('72000');
  const [tdsRate, setTdsRate] = useState('10');
  const [activeFaq, setActiveFaq] = useState(null);
  
  const [checklist, setChecklist] = useState({
    pan: true,
    statement: false,
    tds: false,
    reconciled: false,
  });

  const summary = useMemo(() => {
    const taxableInterest = Number(interest) || 0;
    const estimatedTds = taxableInterest * ((Number(tdsRate) || 0) / 100);
    return {
      taxableInterest,
      estimatedTds,
      netInterest: taxableInterest - estimatedTds,
    };
  }, [interest, tdsRate]);

  const chartData = useMemo(() => {
    if (summary.taxableInterest === 0) {
      return [{ name: 'No Earnings', value: 1, color: '#e2e8f0' }];
    }
    return [
      { name: 'Net Interest', value: Math.max(0, summary.netInterest), color: '#10b981' },
      { name: 'Estimated TDS', value: Math.max(0, summary.estimatedTds), color: '#f59e0b' }
    ];
  }, [summary]);

  const documents = [
    { title: 'Annual Interest Statement', type: 'PDF', status: 'Ready', period: year },
    { title: 'TDS Working Sheet', type: 'CSV', status: 'Draft', period: year },
    { title: 'Investment Ledger', type: 'PDF', status: 'Ready', period: year },
  ];

  const checklistItems = [
    { key: 'pan', label: 'PAN verified in KYC profile', desc: 'Required for tax filing' },
    { key: 'statement', label: 'Annual Interest statement ready', desc: 'Available for download' },
    { key: 'tds', label: 'TDS estimated value reviewed', desc: 'Checked against bank records' },
    { key: 'reconciled', label: 'Bank credit ledgers reconciled', desc: 'Matches interest received' },
  ];

  const checkedCount = Object.values(checklist).filter(Boolean).length;
  const progressPercent = Math.round((checkedCount / checklistItems.length) * 100);

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
    <div className="space-y-8 pt-2">
      {/* Top Export Banner */}
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition duration-300">
        <div>
          <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Tax Summary Sheet</h3>
          <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">Generate and download compiled CSV tax logs for CA submission.</p>
        </div>
        
        <button
          type="button"
          onClick={downloadSummary}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 hover:from-indigo-700 hover:to-blue-700 active:scale-[0.97] transition duration-300"
        >
          <Download className="h-4 w-4" />
          Export Summary
        </button>
      </div>

      {/* 3-Column Premium Stat Cards with glowing 3D gradient icons */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Taxable Interest */}
        <div className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition duration-300 dark:border-slate-800 dark:bg-slate-900">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 transition duration-300" />
          <div className="relative z-10">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/15 group-hover:scale-105 transition duration-300">
              <Landmark className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Taxable Interest</p>
            <p className="mt-1.5 font-heading text-2xl font-semibold text-slate-900 dark:text-white">{formatCurrency(summary.taxableInterest)}</p>
          </div>
        </div>

        {/* Estimated TDS */}
        <div className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition duration-300 dark:border-slate-800 dark:bg-slate-900">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-orange-500/0 group-hover:from-amber-500/5 group-hover:to-orange-500/5 transition duration-300" />
          <div className="relative z-10">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/15 group-hover:scale-105 transition duration-300">
              <ReceiptText className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-300">Estimated TDS</p>
            <p className="mt-1.5 font-heading text-2xl font-semibold text-slate-900 dark:text-white">{formatCurrency(summary.estimatedTds)}</p>
          </div>
        </div>

        {/* Net Interest */}
        <div className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition duration-300 dark:border-slate-800 dark:bg-slate-900">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/5 group-hover:to-teal-500/5 transition duration-300" />
          <div className="relative z-10">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/15 group-hover:scale-105 transition duration-300">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-300">Net Interest</p>
            <p className="mt-1.5 font-heading text-2xl font-semibold text-slate-900 dark:text-white">{formatCurrency(summary.netInterest)}</p>
          </div>
        </div>
      </div>

      {/* Split Grid: Tax Estimate Inputs & Documents List */}
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* Left Card: Tax Estimate & Visualizer */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Tax Calculator</h3>
              <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5 font-medium">Configure calculation variables and visualize domestic interest distributions.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 items-center">
              {/* Inputs */}
              <div className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Financial Year</span>
                  <div className="relative mt-1">
                    <select
                      className="input-shell pl-10 pr-10 focus:border-indigo-600 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
                      value={year}
                      onChange={(event) => setYear(event.target.value)}
                    >
                      <option>2025-26</option>
                      <option>2024-25</option>
                      <option>2023-24</option>
                    </select>
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500 pointer-events-none" />
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-300 pointer-events-none" />
                  </div>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Interest Earned</span>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      className="input-shell pl-10 focus:border-indigo-600 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
                      value={interest}
                      onChange={(event) => setInterest(event.target.value)}
                      placeholder="e.g. 72000"
                    />
                    <Landmark className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 pointer-events-none" />
                  </div>
                </label>

                <label className="block space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">TDS Rate (%)</span>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      className="input-shell pl-10 focus:border-indigo-600 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
                      value={tdsRate}
                      onChange={(event) => setTdsRate(event.target.value)}
                      placeholder="e.g. 10"
                    />
                    <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500 pointer-events-none" />
                  </div>
                </label>
              </div>

              {/* Doughnut Chart */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50/30 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800/50">
                <div className="relative flex items-center justify-center h-[160px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={68}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-bold text-slate-900 dark:text-white leading-none">
                      {summary.taxableInterest > 0 
                        ? `${((summary.netInterest / summary.taxableInterest) * 100).toFixed(0)}%` 
                        : '0%'}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 dark:text-slate-300 mt-1">
                      Net Yield
                    </span>
                  </div>
                </div>

                {/* Chart Legends */}
                <div className="flex gap-4 mt-2 text-xs font-bold">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-[#10b981]" />
                    <span className="text-slate-500 dark:text-slate-300">Net Interest</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-[#f59e0b]" />
                    <span className="text-slate-500 dark:text-slate-300">TDS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Documents List */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Tax Documents</h3>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5 font-medium">Download or request statement records for file declarations.</p>
          </div>

          <div className="space-y-3.5">
            {documents.map((doc) => (
              <div
                key={doc.title}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:shadow-sm hover:border-slate-300 transition-all duration-300 dark:border-slate-800 dark:bg-slate-800/10 dark:hover:border-slate-700"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-sm ${ doc.type === 'PDF' ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' }`}>
                    {doc.type === 'PDF' ? <FileText className="h-5 w-5" /> : <Table className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-heading font-bold text-slate-900 dark:text-white leading-tight">{doc.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">
                      {doc.type} Document • Financial Year {doc.period}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 self-end sm:self-auto flex-shrink-0 z-10">
                  <StatusBadge label={doc.status === 'Ready' ? 'Approved' : 'Pending'} />
                  <button
                    type="button"
                    className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 shadow-sm hover:scale-105 transition"
                    title="Download document"
                  >
                    <Download className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Filing Checklist */}
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white mb-1">Filing Readiness Checklist</h3>
            <p className="text-xs text-slate-500 dark:text-slate-300">Ensure all prerequisite details are verified prior to tax season declarations.</p>
          </div>
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Filing Readiness</span>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {checklistItems.map((item) => {
            const isChecked = checklist[item.key];
            return (
              <button
                type="button"
                key={item.key}
                onClick={() => setChecklist(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                className={`flex items-start text-left gap-3.5 p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-sm ${ isChecked ? 'border-emerald-200 bg-emerald-50/30 text-emerald-800 dark:border-emerald-950/20 dark:bg-emerald-950/10 dark:text-emerald-400' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/40' }`}
              >
                <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all ${ isChecked ? 'border-emerald-500 bg-emerald-500 text-white dark:border-emerald-500 dark:bg-emerald-500' : 'border-slate-300 dark:border-slate-600' }`}>
                  {isChecked && <Check className="h-4 w-4 stroke-[3px]" />}
                </div>
                <div>
                  <p className="font-heading font-bold text-xs leading-snug">{item.label}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-0.5">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Help & FAQ Accordion Section */}
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <HelpCircle className="h-5 w-5 text-indigo-500" />
          <div>
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Taxation Help & FAQs</h3>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">Quick guides to help you navigate investment taxation policies.</p>
          </div>
        </div>

        <div className="grid gap-3">
          {[
            {
              question: 'What is Form 15G / 15H and how do I submit it?',
              answer: 'Form 15G (for individuals below 60 years) and Form 15H (for senior citizens) are self-declaration forms you can submit to prevent TDS deduction on your interest earnings, provided your total taxable income for the financial year lies below the exemption threshold. You can upload them directly in the KYC/Profile section.'
            },
            {
              question: 'When is TDS deducted and what is the standard rate?',
              answer: 'TDS is deducted either at the time of interest credit or withdrawal payouts, depending on your scheme structure. The standard rate is 10% for residents who have verified their PAN. If PAN is not linked or verified, TDS is deducted at 20%.'
            },
            {
              question: 'How do I download my quarterly TDS certificate (Form 16A)?',
              answer: 'Form 16A certificates are compiled quarterly by our compliance desk and uploaded to the Tax Documents list above. Typically, they become available 4-6 weeks after the end of each financial quarter.'
            },
            {
              question: 'Is my earned interest income taxable under my slab?',
              answer: 'Yes. All interest earnings from capital investments are categorized as "Income from Other Sources". They are taxable at your respective income tax slab rates, subject to deductions or exemption certificates you provide.'
            }
          ].map((faq, idx) => {
            const isExpanded = activeFaq === idx;
            return (
              <div 
                key={idx}
                className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 transition-all duration-300"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isExpanded ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-heading font-bold text-sm text-slate-800 hover:bg-slate-50/50 dark:text-slate-200 dark:hover:bg-slate-800/20 transition duration-200"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`h-4 w-4 text-slate-500 dark:text-slate-300 transition-transform duration-200 ${ isExpanded ? 'rotate-180 text-indigo-500' : '' }`} />
                </button>
                <div 
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${ isExpanded ? 'max-h-40 border-t border-slate-100 dark:border-slate-800/80 p-4' : 'max-h-0' } bg-slate-50/30 dark:bg-slate-900/30 text-xs text-slate-600 dark:text-slate-300 leading-relaxed`}
                >
                  {faq.answer}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TaxCenter;
