import { Banknote, CalendarClock, RefreshCw, Save, ShieldCheck, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import {
  adminCreatePlan,
  adminGetAllPlans,
  adminTriggerMonthlyInterestRun,
  adminUpdatePlan,
} from '../services/api';
import { formatCurrency } from '../utils/formatters';

const emptyPlan = {
  id: '',
  planName: 'Anusha Milk Trade',
  description: 'Monthly income plan with admin-managed returns.',
  minimumAmount: 5000,
  maximumAmount: 1000000,
  lockInMonths: 6,
  monthlyInterestRate: 10,
  active: true,
};

function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function SettingsPage() {
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [formValues, setFormValues] = useState(emptyPlan);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [interestRunning, setInterestRunning] = useState(false);

  const selectedPlan = useMemo(
    () => plans.find((plan) => String(plan.id) === String(selectedPlanId)),
    [plans, selectedPlanId],
  );

  const estimatedMonthlyInterest = useMemo(() => {
    const amount = Number(formValues.minimumAmount || 0);
    const rate = Number(formValues.monthlyInterestRate || 0);
    return (amount * rate) / 100;
  }, [formValues.minimumAmount, formValues.monthlyInterestRate]);

  const loadPlans = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminGetAllPlans();
      const loadedPlans = toArray(response);
      setPlans(loadedPlans);
      const primaryPlan =
        loadedPlans.find((plan) => String(plan.planName || '').toLowerCase().includes('anusha milk trade')) ||
        loadedPlans.find((plan) => plan.active !== false) ||
        loadedPlans[0];

      if (primaryPlan) {
        setSelectedPlanId(primaryPlan.id);
        setFormValues({
          id: primaryPlan.id,
          planName: primaryPlan.planName || emptyPlan.planName,
          description: primaryPlan.description || emptyPlan.description,
          minimumAmount: Number(primaryPlan.minimumAmount || emptyPlan.minimumAmount),
          maximumAmount: Number(primaryPlan.maximumAmount || emptyPlan.maximumAmount),
          lockInMonths: Number(primaryPlan.lockInMonths || emptyPlan.lockInMonths),
          monthlyInterestRate: Number(primaryPlan.monthlyInterestRate || emptyPlan.monthlyInterestRate),
          active: primaryPlan.active !== false,
        });
      } else {
        setSelectedPlanId('');
        setFormValues(emptyPlan);
      }
    } catch (err) {
      setError(err.message || 'Failed to load investment plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const updateField = (field) => (event) => {
    const value = event.target.type === 'number' ? Number(event.target.value) : event.target.value;
    setMessage('');
    setError('');
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handlePlanSelect = (event) => {
    const plan = plans.find((item) => String(item.id) === String(event.target.value));
    setSelectedPlanId(event.target.value);
    setMessage('');
    setError('');
    if (plan) {
      setFormValues({
        id: plan.id,
        planName: plan.planName || emptyPlan.planName,
        description: plan.description || emptyPlan.description,
        minimumAmount: Number(plan.minimumAmount || emptyPlan.minimumAmount),
        maximumAmount: Number(plan.maximumAmount || emptyPlan.maximumAmount),
        lockInMonths: Number(plan.lockInMonths || emptyPlan.lockInMonths),
        monthlyInterestRate: Number(plan.monthlyInterestRate || emptyPlan.monthlyInterestRate),
        active: plan.active !== false,
      });
    }
  };

  const handleNewPlan = () => {
    setSelectedPlanId('');
    setFormValues(emptyPlan);
    setMessage('');
    setError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const payload = {
        planName: formValues.planName,
        description: formValues.description,
        minimumAmount: Number(formValues.minimumAmount),
        maximumAmount: Number(formValues.maximumAmount),
        lockInMonths: Number(formValues.lockInMonths),
        monthlyInterestRate: Number(formValues.monthlyInterestRate),
        active: Boolean(formValues.active),
      };

      if (selectedPlanId) {
        await adminUpdatePlan(selectedPlanId, payload);
        setMessage('Investment plan updated. New investments will use the updated monthly interest.');
      } else {
        const { active, ...createPayload } = payload;
        await adminCreatePlan(createPayload);
        setMessage('Investment plan created and made available to investors.');
      }
      await loadPlans();
    } catch (err) {
      setError(err.message || 'Failed to save investment plan.');
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerInterest = async () => {
    setInterestRunning(true);
    setMessage('');
    setError('');
    try {
      const response = await adminTriggerMonthlyInterestRun();
      setMessage(response?.message || 'Monthly interest run completed.');
    } catch (err) {
      setError(err.message || 'Failed to trigger monthly interest.');
    } finally {
      setInterestRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">
          Platform controls
        </p>
        <h1 className="section-title mt-3">Settings</h1>
        <p className="section-copy mt-3 max-w-3xl">
          Manage real investment plans, investor amount limits, and monthly interest credited from
          the admin panel.
        </p>
      </div>

      {(message || error) && (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${error ? 'border-rose-500/30 bg-rose-500/10 text-rose-100' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'}`}>
          {error || message}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <SectionCard title="Investment Plan" subtitle="These values feed investor checkout and monthly interest calculation.">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:col-span-2">
              <span className="text-sm font-medium text-slate-300">Select existing plan</span>
              <select value={selectedPlanId} onChange={handlePlanSelect} className="input-shell mt-3">
                <option value="">Create new plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.planName} - {plan.monthlyInterestRate}% monthly
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <ShieldCheck className="h-4 w-4 text-gold-soft" />
                Plan name
              </span>
              <input value={formValues.planName} onChange={updateField('planName')} className="input-shell mt-3" />
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <TrendingUp className="h-4 w-4 text-gold-soft" />
                Monthly interest (%)
              </span>
              <input type="number" value={formValues.monthlyInterestRate} onChange={updateField('monthlyInterestRate')} className="input-shell mt-3" />
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Banknote className="h-4 w-4 text-gold-soft" />
                Minimum investment
              </span>
              <input type="number" value={formValues.minimumAmount} onChange={updateField('minimumAmount')} className="input-shell mt-3" />
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Banknote className="h-4 w-4 text-gold-soft" />
                Maximum investment
              </span>
              <input type="number" value={formValues.maximumAmount} onChange={updateField('maximumAmount')} className="input-shell mt-3" />
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <CalendarClock className="h-4 w-4 text-gold-soft" />
                Lock-in months
              </span>
              <input type="number" value={formValues.lockInMonths} onChange={updateField('lockInMonths')} className="input-shell mt-3" />
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="text-sm font-medium text-slate-300">Status</span>
              <select
                value={formValues.active ? 'true' : 'false'}
                onChange={(event) => setFormValues((current) => ({ ...current, active: event.target.value === 'true' }))}
                className="input-shell mt-3"
              >
                <option value="true">Active for investors</option>
                <option value="false">Inactive</option>
              </select>
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:col-span-2">
              <span className="text-sm font-medium text-slate-300">Description</span>
              <textarea value={formValues.description} onChange={updateField('description')} className="input-shell mt-3 min-h-[96px] resize-none" />
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={handleNewPlan} className="btn-secondary">
              New Plan
            </button>
            <button type="button" onClick={handleSave} disabled={saving || loading} className="btn-primary disabled:opacity-60">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Plan'}
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Interest Preview" subtitle="How the monthly credit is calculated for active investments.">
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-slate-400">Selected plan</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="font-heading text-xl font-semibold text-white">{formValues.planName}</p>
                <StatusBadge label={formValues.active ? 'ACTIVE' : 'INACTIVE'} />
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-slate-400">Example monthly interest at minimum amount</p>
              <p className="mt-3 font-heading text-2xl font-semibold text-white">
                {formatCurrency(estimatedMonthlyInterest)}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                {formatCurrency(formValues.minimumAmount)} x {formValues.monthlyInterestRate}% per month
              </p>
            </div>

            <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5 text-sm leading-7 text-blue-100">
              When admin triggers monthly interest, backend credits each active investor wallet using
              their own investment amount and the rate stored on that investment.
            </div>

            <button type="button" onClick={handleTriggerInterest} disabled={interestRunning} className="btn-primary w-full disabled:opacity-60">
              <RefreshCw className="h-4 w-4" />
              {interestRunning ? 'Running Interest...' : 'Trigger Monthly Interest'}
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export default SettingsPage;
