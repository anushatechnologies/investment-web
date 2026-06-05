import { useEffect, useMemo, useState } from 'react';
import { Bell, Bookmark, Calculator, Check, Plus, Target, Trash2, TrendingUp } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="section-title">Plan Watchlist</h2>
          <p className="section-copy mt-3 max-w-3xl">
            Compare active plans, save shortlisted options, and see whether your savings pace can meet a target.
          </p>
        </div>
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">
          {watchlist.length} saved plans
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <SectionCard title="Available Plans" subtitle="Shortlist plans you want to track before investing.">
          <div className="grid gap-3 xl:grid-cols-2">
            {displayPlans.map((plan) => {
              const planId = String(plan.id);
              const isSaved = watchlist.includes(planId);
              const rate = Number(plan.monthlyInterestRate ?? plan.interestRate ?? 0);
              const tenure = plan.tenureMonths || plan.durationMonths || plan.tenure || 'Flexible';

              return (
                <div key={planId} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-heading text-lg font-semibold text-slate-900">
                        {plan.planName || plan.name || 'Investment Plan'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Min {formatCurrency(planAmount(plan, 'minimumAmount', 0))} to {formatCurrency(planAmount(plan, 'maximumAmount', 0))}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePlan(plan.id)}
                      className={isSaved ? 'btn-primary !px-3 !py-2' : 'btn-secondary !px-3 !py-2'}
                      title={isSaved ? 'Remove from watchlist' : 'Add to watchlist'}
                    >
                      {isSaved ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                    <div className="rounded-xl bg-white p-3">
                      <p className="text-slate-500">Monthly</p>
                      <p className="mt-1 font-semibold text-slate-900">{rate || '-'}%</p>
                    </div>
                    <div className="rounded-xl bg-white p-3">
                      <p className="text-slate-500">Tenure</p>
                      <p className="mt-1 font-semibold text-slate-900">{tenure}</p>
                    </div>
                    <div className="rounded-xl bg-white p-3">
                      <p className="text-slate-500">Status</p>
                      <div className="mt-1"><StatusBadge label="Active" /></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Goal Calculator" subtitle="Estimate progress using your best available monthly rate.">
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Target amount</span>
              <input className="input-shell mt-2" value={goal.targetAmount} onChange={(event) => setGoal({ ...goal, targetAmount: event.target.value })} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Monthly saving</span>
              <input className="input-shell mt-2" value={goal.monthlySaving} onChange={(event) => setGoal({ ...goal, monthlySaving: event.target.value })} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Time horizon in months</span>
              <input className="input-shell mt-2" value={goal.months} onChange={(event) => setGoal({ ...goal, months: event.target.value })} />
            </label>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <Calculator className="h-4 w-4 text-blue-600" />
                Projected value
              </div>
              <p className="mt-2 font-heading text-2xl font-semibold text-slate-900">{formatCurrency(projection.projected)}</p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${projection.progress}%` }} />
              </div>
              <p className="mt-3 text-sm text-slate-500">
                {projection.gap > 0 ? `${formatCurrency(projection.gap)} gap remaining` : 'Target can be reached with this pace.'}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Saved Watchlist" subtitle="Keep your shortlist focused.">
        {watchedPlans.length ? (
          <div className="grid gap-3 md:grid-cols-3">
            {watchedPlans.map((plan) => (
              <div key={plan.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                    <Bookmark className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{plan.planName || plan.name}</p>
                    <p className="text-sm text-slate-500">{Number(plan.monthlyInterestRate ?? plan.interestRate ?? 0)}% monthly</p>
                  </div>
                </div>
                <button type="button" className="btn-secondary !px-3 !py-2" onClick={() => togglePlan(plan.id)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 p-5 text-slate-500">
            <Target className="h-5 w-5" />
            Save a plan above to start tracking it.
          </div>
        )}
      </SectionCard>

      <SectionCard title="Smart Alerts" subtitle="Suggested alert rules for your shortlist.">
        <div className="grid gap-3 md:grid-cols-3">
          {['Rate change on saved plan', 'Minimum amount drops', 'Maturity window reminder'].map((label) => (
            <div key={label} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <Bell className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-slate-700">{label}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

export default Watchlist;
