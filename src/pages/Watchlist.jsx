import { useEffect, useMemo, useState } from 'react';
import { Bell, Bookmark, Calculator, Check, Plus, Target, Trash2, TrendingUp, Clock, Calendar, Landmark, Percent, Wallet, Info } from 'lucide-react';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import { getActivePlans } from '../services/api';
import { formatCurrency } from '../utils/formatters';

const STORAGE_KEY = 'anusha-plan-watchlist';

function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function planAmount(plan, key, fallback) {
  return Number(plan?.[key] ?? fallback ?? 0);
}

function Watchlist() {
  const [plans, setPlans] = useState([]);
  const [watchlist, setWatchlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (_) {
      return [];
    }
  });
  const [goal, setGoal] = useState({ targetAmount: '500000', monthlySaving: '25000', months: '12' });
  
  // Interactive Smart Alerts Toggle State
  const [alerts, setAlerts] = useState({
    rateChange: true,
    minDrop: false,
    maturity: true,
  });

  useEffect(() => {
    let active = true;
    getActivePlans()
      .then((response) => {
        if (!active) return;
        setPlans(toArray(response).filter((plan) => plan.active !== false));
      })
      .catch(() => {
        if (active) setPlans([]);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const fallbackPlans = [
    { id: 'growth-12', planName: 'Growth 12', minimumAmount: 50000, maximumAmount: 1000000, monthlyInterestRate: 2.2, tenureMonths: 12 },
    { id: 'income-6', planName: 'Income 6', minimumAmount: 25000, maximumAmount: 500000, monthlyInterestRate: 1.7, tenureMonths: 6 },
    { id: 'premium-18', planName: 'Premium 18', minimumAmount: 100000, maximumAmount: 2500000, monthlyInterestRate: 2.6, tenureMonths: 18 },
  ];

  const displayPlans = plans.length ? plans : fallbackPlans;
  const watchedPlans = displayPlans.filter((plan) => watchlist.includes(String(plan.id)));

  const projection = useMemo(() => {
    const target = Number(goal.targetAmount) || 0;
    const saving = Number(goal.monthlySaving) || 0;
    const months = Number(goal.months) || 0;
    const bestRate = displayPlans.reduce((max, plan) => Math.max(max, Number(plan.monthlyInterestRate ?? plan.interestRate ?? 0)), 0);
    const projected = saving * months * (1 + (bestRate / 100) * Math.max(months - 1, 0) / 2);
    return {
      projected,
      gap: Math.max(0, target - projected),
      progress: target > 0 ? Math.min(100, Math.round((projected / target) * 100)) : 0,
      bestRate,
    };
  }, [displayPlans, goal]);

  const togglePlan = (id) => {
    const planId = String(id);
    setWatchlist((current) =>
      current.includes(planId) ? current.filter((item) => item !== planId) : [...current, planId],
    );
  };

  const toggleAlert = (key) => {
    setAlerts((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 pt-2">
      {/* 2-Column Core Layout: Available Plans Grid & Goal Calculator */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <SectionCard 
          title="Available Plans" 
          subtitle="Shortlist plans you want to track before investing."
        >
          <div className="grid gap-4 xl:grid-cols-2">
            {displayPlans.map((plan) => {
              const planId = String(plan.id);
              const isSaved = watchlist.includes(planId);
              const rate = Number(plan.monthlyInterestRate ?? plan.interestRate ?? 0);
              const tenure = plan.tenureMonths || plan.durationMonths || plan.tenure || 'Flexible';
              const yieldType = rate >= 2.2 ? 'High Yield' : 'Balanced';

              return (
                <div 
                  key={planId} 
                  className={`group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 ${ isSaved ? 'border-indigo-200 bg-indigo-50/10 dark:border-indigo-900/40 dark:bg-indigo-950/5' : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700' }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-heading font-bold text-slate-900 dark:text-white leading-tight">
                          {plan.planName || plan.name || 'Investment Plan'}
                        </p>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${ yieldType === 'High Yield' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400' }`}>
                          {yieldType}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-300">
                        Limits: {formatCurrency(planAmount(plan, 'minimumAmount', 0))} – {formatCurrency(planAmount(plan, 'maximumAmount', 0))}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePlan(plan.id)}
                      className={`inline-flex items-center justify-center h-9 w-9 rounded-xl border transition-all duration-200 ${ isSaved ? 'border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.95]' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 active:scale-[0.95]' }`}
                      title={isSaved ? 'Remove from watchlist' : 'Add to watchlist'}
                    >
                      {isSaved ? <Check className="h-5 w-5 stroke-[3px]" /> : <Plus className="h-5 w-5" />}
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] font-bold">
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-800/20">
                      <p className="text-slate-500 dark:text-slate-300 uppercase tracking-wider text-[9px]">Interest</p>
                      <div className="mt-1 flex items-center gap-1 text-slate-700 dark:text-slate-300">
                        <TrendingUp className="h-4 w-4 text-indigo-500" />
                        <span>{rate || '-'}% /mo</span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-800/20">
                      <p className="text-slate-500 dark:text-slate-300 uppercase tracking-wider text-[9px]">Tenure</p>
                      <div className="mt-1 flex items-center gap-1 text-slate-700 dark:text-slate-300">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>{tenure} mos</span>
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-800/20">
                      <p className="text-slate-500 dark:text-slate-300 uppercase tracking-wider text-[9px]">Risk Level</p>
                      <div className="mt-1">
                        <StatusBadge label={rate >= 2.2 ? 'Moderate' : 'Conservative'} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* Right Card: Goal Calculator */}
        <SectionCard 
          title="Goal Calculator" 
          subtitle="Estimate progress using your best available monthly rate."
        >
          <div className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Target Amount</span>
              <div className="relative mt-1">
                <input 
                  type="number"
                  className="input-shell pl-10 focus:border-indigo-600 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30" 
                  value={goal.targetAmount} 
                  onChange={(event) => setGoal({ ...goal, targetAmount: event.target.value })} 
                />
                <Target className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500 pointer-events-none" />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 dark:text-slate-300 pointer-events-none">INR</span>
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Monthly Saving</span>
              <div className="relative mt-1">
                <input 
                  type="number"
                  className="input-shell pl-10 focus:border-indigo-600 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30" 
                  value={goal.monthlySaving} 
                  onChange={(event) => setGoal({ ...goal, monthlySaving: event.target.value })} 
                />
                <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500 pointer-events-none" />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 dark:text-slate-300 pointer-events-none">/mo</span>
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Time Horizon</span>
              <div className="relative mt-1">
                <input 
                  type="number"
                  className="input-shell pl-10 focus:border-indigo-600 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30" 
                  value={goal.months} 
                  onChange={(event) => setGoal({ ...goal, months: event.target.value })} 
                />
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 pointer-events-none" />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 dark:text-slate-300 pointer-events-none">Months</span>
              </div>
            </label>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50 transition-all duration-300">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-indigo-500" />
                  <span>Projected Value ({projection.bestRate}% Rate)</span>
                </div>
                <span className="text-indigo-600 dark:text-indigo-400">{projection.progress}%</span>
              </div>
              <p className="mt-2.5 font-heading text-2xl font-bold text-slate-900 dark:text-white leading-none">
                {formatCurrency(projection.projected)}
              </p>
              
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 transition-all duration-500 ease-out" 
                  style={{ width: `${projection.progress}%` }} 
                />
              </div>
              <div className="mt-3 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-300">
                <Info className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                <span>
                  {projection.gap > 0 
                    ? `${formatCurrency(projection.gap)} gap remaining from target amount.` 
                    : 'Target fully reachable under the current savings pace!'}
                </span>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Saved Watchlist Row */}
      <SectionCard 
        title="Saved Watchlist" 
        subtitle="Keep your shortlist focused."
        action={
          <div className="rounded-full border border-indigo-100 bg-indigo-50/50 dark:border-indigo-950/20 dark:bg-indigo-950/10 px-3 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400">
            {watchlist.length} Saved Plans
          </div>
        }
      >
        {watchedPlans.length ? (
          <div className="grid gap-3 md:grid-cols-3">
            {watchedPlans.map((plan) => (
              <div 
                key={plan.id} 
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
                    <Bookmark className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white leading-tight">
                      {plan.planName || plan.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">
                      {Number(plan.monthlyInterestRate ?? plan.interestRate ?? 0)}% Monthly • {plan.tenureMonths || plan.durationMonths || plan.tenure || 'Flexible'} Mo
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="inline-flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-red-950/20 dark:hover:text-red-400 dark:hover:border-red-900 shadow-sm transition-all duration-200 active:scale-[0.95]" 
                  onClick={() => togglePlan(plan.id)}
                  title="Remove plan"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center text-slate-500 dark:border-slate-800 dark:text-slate-300">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-400 dark:bg-slate-900 dark:text-slate-600">
              <Target className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <p className="font-heading font-bold text-sm text-slate-800 dark:text-slate-200">Watchlist is Empty</p>
              <p className="text-xs text-slate-500 dark:text-slate-300 mt-1 max-w-xs">Save investment plans above to compare payouts and track your financial milestones.</p>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Smart Alerts Section */}
      <SectionCard title="Smart Alerts" subtitle="Suggested alert rules for your shortlist.">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { key: 'rateChange', label: 'Rate change on saved plans', desc: 'Notify if interest yields change' },
            { key: 'minDrop', label: 'Minimum amount drops', desc: 'Alert if investment barriers lower' },
            { key: 'maturity', label: 'Maturity window reminder', desc: 'Email 7 days prior to scheme maturity' }
          ].map((item) => {
            const isEnabled = alerts[item.key];
            return (
              <button
                type="button"
                key={item.key}
                onClick={() => toggleAlert(item.key)}
                className={`flex items-center justify-between text-left p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-sm ${ isEnabled ? 'border-indigo-200 bg-indigo-50/20 text-indigo-900 dark:border-indigo-950/30 dark:bg-indigo-950/10 dark:text-indigo-400' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/40' }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${ isEnabled ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300' }`}>
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-xs leading-snug">{item.label}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-0.5">{item.desc}</p>
                  </div>
                </div>
                
                {/* Toggle Switch */}
                <div className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 ml-3 ${ isEnabled ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-700' }`}>
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-300 ${ isEnabled ? 'translate-x-4.5' : 'translate-x-1' }`} />
                </div>
              </button>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}

export default Watchlist;
