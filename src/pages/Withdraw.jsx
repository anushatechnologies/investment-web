import { 
  Banknote, 
  CreditCard, 
  ShieldCheck, 
  Wallet,
  Building,
  Smartphone,
  Check,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Sparkles,
  ArrowUpRight,
  RotateCcw
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { getOwnWithdrawals, requestWithdrawal, getWallet, getWithdrawalSettings, verifyMpin } from '../services/api';
import { formatCurrency } from '../utils/formatters';

function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.withdrawals)) return payload.withdrawals;
  return [];
}

const DEFAULT_WITHDRAWAL_SETTINGS = {
  withdrawalEnabled: true,
  minimumWithdrawalAmount: 1000,
  maximumWithdrawalAmount: 0,
  dailyWithdrawalLimit: 0,
  monthlyWithdrawalLimit: 0,
  processingTime: '24 hours',
  preferredMethod: 'Bank Transfer',
};

function normalizeSettings(settings) {
  return {
    ...DEFAULT_WITHDRAWAL_SETTINGS,
    ...(settings || {}),
    withdrawalEnabled: settings?.withdrawalEnabled !== false,
    minimumWithdrawalAmount: Number(settings?.minimumWithdrawalAmount ?? settings?.minWithdrawal ?? DEFAULT_WITHDRAWAL_SETTINGS.minimumWithdrawalAmount),
    maximumWithdrawalAmount: Number(settings?.maximumWithdrawalAmount ?? settings?.maxWithdrawal ?? DEFAULT_WITHDRAWAL_SETTINGS.maximumWithdrawalAmount),
    dailyWithdrawalLimit: Number(settings?.dailyWithdrawalLimit ?? DEFAULT_WITHDRAWAL_SETTINGS.dailyWithdrawalLimit),
    monthlyWithdrawalLimit: Number(settings?.monthlyWithdrawalLimit ?? DEFAULT_WITHDRAWAL_SETTINGS.monthlyWithdrawalLimit),
  };
}

function Withdraw() {
  const [amount, setAmount] = useState('1000');
  const [method, setMethod] = useState('Bank Transfer');
  const [history, setHistory] = useState([]);
  const [walletData, setWalletData] = useState({});
  const [withdrawalSettings, setWithdrawalSettings] = useState(DEFAULT_WITHDRAWAL_SETTINGS);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const mapWithdrawal = (item, index) => ({
    id: item.id || item.withdrawalId || `WDL${index + 1}`,
    requestedOn: item.requestedAt || item.requestedOn || item.createdAt || '-',
    amount: Number(item.requestedAmount ?? item.amount ?? 0),
    method: item.bankName ? 'Bank Transfer' : (item.method || item.mode || 'Bank Transfer'),
    status: item.status || 'Pending',
  });

  const minWithdrawal = Number(withdrawalSettings.minimumWithdrawalAmount ?? 1000);
  const maxWithdrawal = Number(withdrawalSettings.maximumWithdrawalAmount ?? 0);
  const availableBalance = Number(walletData.availableBalance ?? walletData.balance ?? 0);

  useEffect(() => {
    let active = true;
    Promise.all([getOwnWithdrawals(), getWallet(), getWithdrawalSettings()])
      .then(([withdrawalsRes, walletRes, settingsRes]) => {
        if (!active) return;
        setHistory(toArray(withdrawalsRes).map(mapWithdrawal));
        const walletPayload = walletRes?.data || walletRes || {};
        setWalletData(walletPayload.wallet || walletPayload || {});
        const normalizedSettings = normalizeSettings(walletPayload.withdrawalSettings || settingsRes);
        setWithdrawalSettings(normalizedSettings);
        setAmount(String(normalizedSettings.minimumWithdrawalAmount));
      })
      .catch(() => {
        if (!active) return;
        setHistory([]);
        setWalletData({});
        setWithdrawalSettings(DEFAULT_WITHDRAWAL_SETTINGS);
      });

    return () => {
      active = false;
    };
  }, []);

  const validationChecks = useMemo(() => {
    const value = Number(amount || 0);
    return [
      {
        label: `Amount meets minimum of ${formatCurrency(minWithdrawal)}`,
        status: value >= minWithdrawal,
        key: 'min'
      },
      {
        label: maxWithdrawal > 0 ? `Amount is within maximum limit of ${formatCurrency(maxWithdrawal)}` : 'No maximum request cap active',
        status: maxWithdrawal > 0 ? value <= maxWithdrawal : true,
        key: 'max'
      },
      {
        label: `Sufficient balance (Available: ${formatCurrency(availableBalance)})`,
        status: value <= availableBalance && availableBalance > 0,
        key: 'balance'
      }
    ];
  }, [amount, minWithdrawal, maxWithdrawal, availableBalance]);

  const allChecksPassed = useMemo(() => {
    return validationChecks.every(c => c.status);
  }, [validationChecks]);

  const handleSubmit = async () => {
    const value = Number(amount || 0);
    if (!withdrawalSettings.withdrawalEnabled) {
      setMessage('Withdrawals are currently disabled by admin.');
      return;
    }
    if (value < minWithdrawal) {
      setMessage(`Minimum withdrawal amount is ${formatCurrency(minWithdrawal)}.`);
      return;
    }
    if (maxWithdrawal > 0 && value > maxWithdrawal) {
      setMessage(`Maximum withdrawal per request is ${formatCurrency(maxWithdrawal)}.`);
      return;
    }
    if (value > availableBalance) {
      setMessage(`Amount exceeds available balance of ${formatCurrency(availableBalance)}.`);
      return;
    }

    setSubmitting(true);
    setMessage('');
    try {
      await requestWithdrawal({ requestedAmount: value, method });
      const refreshed = await getOwnWithdrawals();
      setHistory(toArray(refreshed).map(mapWithdrawal));
      
      // Refresh wallet details to update available balance
      const refreshedWallet = await getWallet();
      const newWalletData = refreshedWallet?.data || refreshedWallet || {};
      setWalletData(newWalletData.wallet || newWalletData || {});
      
      setMessage(`Withdrawal request for ${formatCurrency(value)} submitted successfully.`);
    } catch (error) {
      setMessage(error?.message || 'Unable to submit withdrawal request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setAmount(String(minWithdrawal));
    setMethod('Bank Transfer');
    setMessage('');
  };

  const handleQuickSelect = (item) => {
    if (item.value) {
      setAmount(String(item.value));
    } else if (item.factor) {
      const computed = Math.floor(availableBalance * item.factor);
      setAmount(String(Math.max(computed, 0)));
    }
  };

  const stats = useMemo(
    () => [
      { title: 'Available Balance', value: availableBalance, icon: Wallet, tone: 'blue', valueType: 'currency', note: 'current wallet balance' },
      { title: 'Minimum Withdrawal', value: minWithdrawal, icon: Banknote, tone: 'amber', valueType: 'currency', note: 'required minimum' },
      { title: 'Maximum Request', value: maxWithdrawal > 0 ? maxWithdrawal : 'Unlimited', icon: ShieldCheck, tone: 'emerald', valueType: maxWithdrawal > 0 ? 'currency' : 'text', note: 'per request' },
      { title: 'Method', value: withdrawalSettings.preferredMethod || method, icon: CreditCard, tone: 'violet', note: withdrawalSettings.processingTime || 'standard review' },
    ],
    [availableBalance, minWithdrawal, maxWithdrawal, withdrawalSettings, method],
  );

  const methods = [
    { id: 'Bank Transfer', label: 'Bank Transfer', icon: Building, desc: 'Direct deposit to linked bank' },
    { id: 'UPI', label: 'UPI Payout', icon: Smartphone, desc: 'Instant payout to UPI VPA ID' }
  ];

  const quickSelects = [
    { label: 'Min', value: minWithdrawal },
    { label: '25%', factor: 0.25 },
    { label: '50%', factor: 0.50 },
    { label: '75%', factor: 0.75 },
    { label: 'Max Balance', factor: 1.00 }
  ];

  const columns = [
    { key: 'id', label: 'Request ID' },
    { key: 'requestedOn', label: 'Requested On' },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => formatCurrency(row.amount),
    },
    { key: 'method', label: 'Method' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge label={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        
        {/* Withdrawal form card */}
        <SectionCard title="Withdrawal Request" subtitle="Submit a new payout request from your wallet balance.">
          
          {/* Suspension alert block if withdrawals are blocked */}
          {!withdrawalSettings.withdrawalEnabled && (
            <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-300 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold">Withdrawals Suspended</h4>
                <p className="text-[10px] mt-0.5 font-medium leading-relaxed">
                  The admin has currently paused payout requests. Contact support if you believe this is in error.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-5">
            
            {/* Amount input block with preset selectors */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300">Withdrawal Amount</label>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                  Wallet Bal: {formatCurrency(availableBalance)}
                </span>
              </div>
              
              <div className="relative mt-1">
                <input
                  type="number"
                  className="input-shell pl-10 w-full bg-slate-50/50 focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950/40 font-heading text-lg font-bold"
                  value={amount}
                  min={minWithdrawal}
                  max={maxWithdrawal > 0 ? maxWithdrawal : undefined}
                  disabled={!withdrawalSettings.withdrawalEnabled}
                  onChange={(event) => setAmount(event.target.value)}
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-slate-500 dark:text-slate-300 font-bold text-base">
                  ₹
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                {quickSelects.map((qs, i) => (
                  <button
                    key={i}
                    type="button"
                    disabled={!withdrawalSettings.withdrawalEnabled}
                    onClick={() => handleQuickSelect(qs)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-indigo-300 dark:border-slate-800 dark:hover:border-indigo-900/50 bg-white hover:bg-indigo-50/20 dark:bg-slate-900/40 text-[10px] font-bold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all duration-300"
                  >
                    {qs.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Premium Method Select Grid */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300 mb-1 block">Payout Mode</label>
              <div className="grid grid-cols-2 gap-4">
                {methods.map((m) => {
                  const IconComp = m.icon;
                  const isSelected = method === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={!withdrawalSettings.withdrawalEnabled}
                      onClick={() => setMethod(m.id)}
                      className={`flex flex-col items-start p-4 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group ${ isSelected ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10 text-indigo-900 dark:text-indigo-200' : 'border-slate-200 bg-white hover:bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/30 dark:hover:bg-slate-900/50 text-slate-800 dark:text-slate-300' }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 h-5 w-5 flex items-center justify-center rounded-full bg-indigo-600 text-white shadow-md">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                      <div className={`p-2 rounded-xl mb-3 ${ isSelected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/15' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300 group-hover:scale-105 transition-all' }`}>
                        <IconComp className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold">{m.label}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-300 mt-1 line-clamp-1">{m.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Validation indicators */}
            <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-950/25 border border-slate-100 dark:border-slate-900/60">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300">Payout Requirements</span>
              <div className="grid gap-2 mt-1">
                {validationChecks.map((check) => (
                  <div key={check.key} className="flex items-center gap-2 text-xs">
                    {check.status ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                    )}
                    <span className={`font-semibold ${check.status ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500 dark:text-slate-300'}`}>
                      {check.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button 
                type="button" 
                onClick={handleSubmit} 
                disabled={submitting || !withdrawalSettings.withdrawalEnabled || !allChecksPassed}
                className="btn-primary flex items-center gap-2"
              >
                {submitting ? 'Submitting...' : 'Submit Request'}
                <ArrowUpRight className="h-4 w-4" />
              </button>
              <button 
                type="button" 
                onClick={handleReset} 
                className="btn-secondary flex items-center gap-2"
              >
                Reset
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            {/* Beautiful Toast/Status message block */}
            {message && (
              <div className={`p-4 rounded-2xl border flex items-start gap-3 transition-all duration-300 ${ message.includes('successfully') ? 'bg-emerald-50/70 border-emerald-100 dark:bg-emerald-950/15 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-300' : 'bg-rose-50/70 border-rose-100 dark:bg-rose-950/15 dark:border-rose-900/30 text-rose-800 dark:text-rose-300' }`}>
                {message.includes('successfully') ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                )}
                <span className="text-xs font-semibold leading-relaxed">{message}</span>
              </div>
            )}

          </div>
        </SectionCard>

        {/* Withdrawal note side panel */}
        <SectionCard title="Payout Compliance" subtitle="Important notes before submitting request.">
          <div className="space-y-4">
            
            <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900/40">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 shrink-0">
                <Wallet className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300">Available balance</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5 truncate">{formatCurrency(availableBalance)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900/40">
              <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/20 dark:text-violet-400 shrink-0">
                <Info className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300">Standard review time</p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">{withdrawalSettings.processingTime || 'within 24 hours'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900/40">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300">Limits per request</p>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                  Min: {formatCurrency(minWithdrawal)} <span className="text-slate-500 dark:text-slate-300 font-normal">/</span> Max: {maxWithdrawal > 0 ? formatCurrency(maxWithdrawal) : 'Unlimited'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-4 rounded-2xl border border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900/40">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300">Payout compliance</p>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">Linked bank KYC must remain verified</p>
              </div>
            </div>

          </div>
        </SectionCard>
      </div>

      {/* Recent Withdrawals Table */}
      <DataTable
        title="Recent Withdrawals"
        description="Track the status of your recent wallet withdrawal requests."
        data={history}
        columns={columns}
        searchableKeys={['id', 'requestedOn', 'method', 'status']}
        searchPlaceholder="Search withdrawal history..."
        filterKey="status"
        filterOptions={['Completed', 'Pending', 'Rejected']}
      />
    </div>
  );
}

export default Withdraw;
