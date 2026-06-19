import { useEffect, useMemo, useState } from 'react';
import { 
  Download, 
  FileText, 
  Printer, 
  ReceiptText, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Sparkles, 
  Activity, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Share2, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { getInvestorStatements } from '../services/api';
import { formatCurrency, formatDate } from '../utils/formatters';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function readableTransactionType(type) {
  const value = String(type || '').toUpperCase();
  if (value === 'REFERRAL_INSTANT_CASHBACK') return 'Referral Instant Cashback';
  if (value === 'REFERRAL_MONTHLY_INCOME') return 'Referral Monthly Income';
  if (value === 'INTEREST_CREDIT') return 'Monthly Interest';
  if (value === 'REFERRAL_COMMISSION') return 'Referral Income';
  return String(type || '-').replaceAll('_', ' ');
}

function referralTypeLabel(item) {
  const value = String(item.commissionType || '').toUpperCase();
  if (value.includes('INSTANT')) return 'Instant Cashback';
  if (value.includes('MONTHLY')) return 'Monthly Income';
  return 'Referral Income';
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function Statements() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ledger');
  
  // Date filter states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Exporter simulation states
  const [exportingType, setExportingType] = useState('');
  const [exportSuccessMessage, setExportSuccessMessage] = useState('');

  const fetchStatements = () => {
    setLoading(true);
    getInvestorStatements()
      .then((res) => {
        setData(res || {});
      })
      .catch(() => {
        setData({});
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStatements();
  }, []);

  const transactions = useMemo(
    () =>
      asArray(data.walletTransactions).map((item) => ({
        id: item.id,
        rawDate: item.createdAt ? new Date(item.createdAt) : null,
        date: item.createdAt ? formatDate(item.createdAt) : '-',
        type: readableTransactionType(item.transactionType),
        direction: item.direction,
        amount: Number(item.amount || 0),
        balanceAfter: Number(item.balanceAfter || 0),
        description: item.description || '-',
      })),
    [data.walletTransactions],
  );

  const commissions = useMemo(
    () =>
      asArray(data.referralCommissions).map((item) => {
        let rawDate = null;
        if (item.commissionMonth) {
          // Parse month string like "October 2024" or standard date string
          try {
            const parsed = new Date(item.commissionMonth);
            if (!isNaN(parsed.getTime())) {
              rawDate = parsed;
            }
          } catch (_) {}
        }
        return {
          id: item.id,
          rawDate,
          month: item.commissionMonth,
          type: referralTypeLabel(item),
          level: item.referralLevel,
          sourceLabel: referralTypeLabel(item) === 'Instant Cashback' ? 'Investment Amount' : 'Interest Amount',
          sourceAmount: Number(item.sourceInterestAmount || 0),
          commissionAmount: Number(item.commissionAmount || 0),
          status: item.status,
        };
      }),
    [data.referralCommissions],
  );

  // Apply date range filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (!t.rawDate) return true;
      if (startDate) {
        const start = new Date(startDate + 'T00:00:00');
        if (t.rawDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate + 'T23:59:59');
        if (t.rawDate > end) return false;
      }
      return true;
    });
  }, [transactions, startDate, endDate]);

  const filteredCommissions = useMemo(() => {
    return commissions.filter((c) => {
      if (!c.rawDate) return true;
      if (startDate) {
        const start = new Date(startDate + 'T00:00:00');
        if (c.rawDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate + 'T23:59:59');
        if (c.rawDate > end) return false;
      }
      return true;
    });
  }, [commissions, startDate, endDate]);

  const summary = data.summary || {};
  
  const stats = useMemo(
    () => [
      { 
        title: 'Wallet Credits', 
        value: Number(summary.totalCredits || 0), 
        icon: TrendingUp, 
        gradColor: 'from-emerald-500 to-teal-500', 
        shadowColor: 'shadow-emerald-500/20',
        note: 'all credited transactions' 
      },
      { 
        title: 'Wallet Debits', 
        value: Number(summary.totalDebits || 0), 
        icon: TrendingDown, 
        gradColor: 'from-rose-500 to-red-500', 
        shadowColor: 'shadow-rose-500/20',
        note: 'withdrawals and debits' 
      },
      { 
        title: 'Interest Earned', 
        value: Number(summary.totalInterest || 0), 
        icon: Activity, 
        gradColor: 'from-blue-500 to-indigo-500', 
        shadowColor: 'shadow-blue-500/20',
        note: 'lifetime interest payouts' 
      },
      { 
        title: 'Referral Earnings', 
        value: Number(summary.totalReferral || 0), 
        icon: Sparkles, 
        gradColor: 'from-amber-500 to-orange-500', 
        shadowColor: 'shadow-amber-500/20',
        note: 'lifetime commissions' 
      },
    ],
    [summary],
  );

  const applyPresetFilter = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    // format as YYYY-MM-DD
    const formatDate = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };
    
    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  };

  const clearDateFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  // Simulated export download
  const handleExportRequest = (type) => {
    setExportingType(type);
    setExportSuccessMessage('');
    setTimeout(() => {
      setExportingType('');
      setExportSuccessMessage(`Your ${type.toUpperCase()} statement download has started successfully.`);
      
      // Trigger actual downloads for convenience
      if (type === 'wallet') {
        downloadCsv('wallet-ledger-statement.csv', [
          ['Date', 'Type', 'Direction', 'Amount', 'Balance After', 'Description'],
          ...filteredTransactions.map((row) => [row.date, row.type, row.direction, row.amount, row.balanceAfter, row.description]),
        ]);
      } else if (type === 'referral') {
        downloadCsv('referral-commissions-statement.csv', [
          ['Due / Event', 'Type', 'Level', 'Source Amount', 'Commission Amount', 'Status'],
          ...filteredCommissions.map((row) => [row.month, row.type, `L${row.level}`, row.sourceAmount, row.commissionAmount, row.status]),
        ]);
      }
    }, 1500);
  };

  return (
    <div className="space-y-8 pt-2">
      
      {/* Date-Range Action bar */}
      <div className="rounded-[24px] border border-slate-200 bg-white/60 p-5 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/50 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-5 transition duration-300">
        <div className="flex flex-wrap items-center gap-4.5">
          <div className="flex items-center gap-2">
            <Calendar className="h-4.5 w-4.5 text-indigo-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Statement Range:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-550 focus:ring-1 focus:ring-indigo-550 transition"
            />
            <span className="text-xs text-slate-500 dark:text-slate-300 font-medium">to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-550 focus:ring-1 focus:ring-indigo-550 transition"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <button 
              type="button" 
              onClick={() => applyPresetFilter(30)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800/80 text-[10px] font-bold text-slate-500 dark:text-slate-300 transition"
            >
              30 Days
            </button>
            <button 
              type="button" 
              onClick={() => applyPresetFilter(90)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-800/80 text-[10px] font-bold text-slate-500 dark:text-slate-300 transition"
            >
              90 Days
            </button>
            {(startDate || endDate) && (
              <button 
                type="button" 
                onClick={clearDateFilters}
                className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-[10px] font-extrabold text-rose-600 dark:text-rose-400 transition"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.97] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4 text-indigo-500" />
            <span>Print Ledger</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-550/10 transition hover:from-indigo-700 hover:to-blue-700 active:scale-[0.97]"
            onClick={() => handleExportRequest('wallet')}
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Premium 3D Stats Counter Section */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
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
                  {formatCurrency(stat.value)}
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

      {/* Segmented Tab Bar navigation */}
      <div className="flex flex-wrap gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        {[
          { id: 'ledger', label: 'Wallet Ledger', icon: Wallet, count: filteredTransactions.length },
          { id: 'commissions', label: 'Referral Commissions', icon: Share2, count: filteredCommissions.length },
          { id: 'exporter', label: 'Exporter Hub', icon: FileSpreadsheet, count: null },
        ].map((tab) => {
          const active = activeTab === tab.id;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition ${ active ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/15' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-slate-200' }`}
            >
              <TabIcon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-lg ${ active ? 'bg-white/20 text-white' : 'bg-slate-200/60 text-slate-500 dark:bg-slate-700 dark:text-slate-300' }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main tab content */}
      <div className="space-y-6">
        {activeTab === 'ledger' && (
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition duration-300">
            <DataTable
              title="Wallet Statement"
              description="Chronological credit and debit statement."
              data={filteredTransactions}
              columns={[
                { key: 'date', label: 'Date' },
                { 
                  key: 'type', 
                  label: 'Type',
                  render: (row) => (
                    <span className="font-semibold text-slate-900 dark:text-slate-200">
                      {row.type}
                    </span>
                  )
                },
                { 
                  key: 'direction', 
                  label: 'Direction',
                  render: (row) => {
                    const isCredit = row.direction === 'CREDIT';
                    return (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${ isCredit ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400' }`}>
                        {isCredit ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownLeft className="h-3 w-3" />}
                        {row.direction}
                      </span>
                    );
                  }
                },
                { 
                  key: 'amount', 
                  label: 'Amount', 
                  render: (row) => {
                    const isCredit = row.direction === 'CREDIT';
                    return (
                      <span className={`font-mono font-bold ${isCredit ? 'text-emerald-600 dark:text-emerald-450' : 'text-slate-800 dark:text-slate-200'}`}>
                        {isCredit ? '+' : '-'}{formatCurrency(row.amount)}
                      </span>
                    );
                  }
                },
                { 
                  key: 'balanceAfter', 
                  label: 'Balance After', 
                  render: (row) => (
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {formatCurrency(row.balanceAfter)}
                    </span>
                  )
                },
                { key: 'description', label: 'Description' },
              ]}
              searchableKeys={['date', 'type', 'direction', 'description']}
              filterKey="direction"
              filterOptions={['CREDIT', 'DEBIT']}
            />
          </div>
        )}

        {activeTab === 'commissions' && (
          <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition duration-300">
            <DataTable
              title="Referral Commission Statement"
              description="Level-wise referral commission history."
              data={filteredCommissions}
              columns={[
                { key: 'month', label: 'Due / Event' },
                { 
                  key: 'type', 
                  label: 'Type',
                  render: (row) => (
                    <span className="font-semibold text-slate-900 dark:text-slate-200">
                      {row.type}
                    </span>
                  )
                },
                { 
                  key: 'level', 
                  label: 'Level',
                  render: (row) => (
                    <span className="inline-flex items-center rounded-lg bg-indigo-50 dark:bg-indigo-950/45 px-2 py-0.5 text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                      L{row.level}
                    </span>
                  )
                },
                { 
                  key: 'sourceAmount', 
                  label: 'Source Amount', 
                  render: (row) => (
                    <div className="space-y-0.5">
                      <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatCurrency(row.sourceAmount)}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">{row.sourceLabel}</p>
                    </div>
                  ) 
                },
                { 
                  key: 'commissionAmount', 
                  label: 'Commission', 
                  render: (row) => (
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-450">
                      {formatCurrency(row.commissionAmount)}
                    </span>
                  )
                },
                { 
                  key: 'status', 
                  label: 'Status',
                  render: (row) => <StatusBadge label={row.status} />
                },
              ]}
              searchableKeys={['month', 'type', 'level', 'status']}
              filterKey="type"
              filterOptions={['Instant Cashback', 'Monthly Income', 'Referral Income']}
            />
          </div>
        )}

        {activeTab === 'exporter' && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            {/* Left Column: Generate File Hub */}
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition duration-300">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
                <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Export Statement Hub</h3>
                <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5 font-medium">Download custom reports, financial certificates and tax calculations.</p>
              </div>

              {exportSuccessMessage && (
                <div className="mb-5 flex items-center gap-2 text-sm font-semibold p-4 rounded-xl border text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400 animate-fade-in-up">
                  <CheckCircle2 className="h-4.5 w-4.5 flex-shrink-0" />
                  <span>{exportSuccessMessage}</span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { 
                    id: 'wallet', 
                    title: 'Wallet Ledger CSV', 
                    desc: 'Complete history of deposits, interest payouts and withdrawals.',
                    icon: Wallet,
                    tone: 'indigo'
                  },
                  { 
                    id: 'referral', 
                    title: 'Referral Statement CSV', 
                    desc: 'Detailed monthly commission logs, source payouts and level splits.',
                    icon: Share2,
                    tone: 'emerald'
                  },
                  { 
                    id: 'pdf_full', 
                    title: 'Annual PDF Statement', 
                    desc: 'Officially certified comprehensive PDF file containing KYC details and capital metrics.',
                    icon: FileText,
                    tone: 'amber'
                  },
                  { 
                    id: 'tax', 
                    title: 'TDS Deduction Certificate', 
                    desc: 'Form 16-A summary details of deducted withholding taxes on returns.',
                    icon: FileSpreadsheet,
                    tone: 'rose'
                  },
                ].map((item) => {
                  const ExportIcon = item.icon;
                  const isExporting = exportingType === item.id;
                  
                  return (
                    <div 
                      key={item.id} 
                      className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/20 dark:bg-slate-900/40 hover:border-slate-200/60 dark:hover:border-slate-800 transition duration-300 flex flex-col justify-between"
                    >
                      <div>
                        <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 mb-3.5`}>
                          <ExportIcon className="h-4.5 w-4.5" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-1 leading-normal">{item.desc}</p>
                      </div>

                      <button
                        type="button"
                        disabled={!!exportingType}
                        onClick={() => {
                          if (item.id === 'pdf_full') {
                            window.print();
                          } else if (item.id === 'tax') {
                            setExportingType('tax');
                            setExportSuccessMessage('');
                            setTimeout(() => {
                              setExportingType('');
                              setExportSuccessMessage('TDS Certificate generated successfully. Print layout ready.');
                              window.print();
                            }, 1000);
                          } else {
                            handleExportRequest(item.id);
                          }
                        }}
                        className={`mt-4 w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 transition ${ isExporting ? 'opacity-70' : '' }`}
                      >
                        {isExporting ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <Download className="h-3.5 w-3.5" />
                            <span>Download File</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Statement Notes & Guidelines */}
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition duration-300 flex flex-col justify-between">
              <div>
                <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
                  <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Reporting Notes</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5 font-medium">Read guide notes on transaction dates and tax computations.</p>
                </div>

                <div className="space-y-4">
                  {[
                    ['Transaction Timestamps', 'All ledger logs represent transaction request completion times in IST (UTC+05:30). Processing may lag bank clearance by up to 2 hours.'],
                    ['Interest Computations', 'Monthly interest credits are calculated on daily balance records and settled on the 1st of each succeeding month.'],
                    ['TDS Deductions', 'A withholding tax of 10% (under Section 194A) is deducted from all interest credit transactions for Indian PAN holders.'],
                    ['Referral Commissions', 'Commissions are divided into Instant Cashback (on invitee deposit) and Monthly Income (on invitee interest settlements).']
                  ].map(([title, desc], idx) => (
                    <div key={idx} className="flex items-start gap-3.5">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 mt-0.5 text-[10px] font-extrabold">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{title}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-0.5 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 p-4 rounded-2xl border border-blue-50 bg-blue-50/20 dark:border-blue-900/30 dark:bg-blue-950/15 flex items-start gap-3">
                <AlertCircle className="h-4.5 w-4.5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Need Certified Ledger?</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-300 leading-relaxed">
                    You can contact our support team from the Support desk if you require physically signed and stamped bank ledger sheets.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

export default Statements;
