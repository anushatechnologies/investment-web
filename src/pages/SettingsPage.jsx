import { Banknote, CalendarClock, Clock3, FileText, Percent, RefreshCw, Save, ShieldCheck, Tag, TrendingUp, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';
import {
  adminCreatePlan,
  adminCreateCoupon,
  adminGetCoupons,
  adminGetAllPlans,
  adminGetLegalDocuments,
  adminGetReferralSettings,
  adminGetWithdrawalSettings,
  adminTriggerMonthlyInterestRun,
  adminUpdateCoupon,
  adminUpdateLegalDocument,
  adminUpdatePlan,
  adminUpdateReferralSettings,
  adminUpdateWithdrawalSettings,
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

const emptyCoupon = {
  id: '',
  code: '',
  title: 'First Investment Cashback',
  description: 'Cashback credited to wallet after investment activation.',
  type: 'FLAT_CASHBACK',
  valueAmount: 500,
  minimumInvestmentAmount: 5000,
  maximumCashbackAmount: 500,
  totalUsageLimit: 100,
  perUserUsageLimit: 1,
  firstInvestmentOnly: true,
  status: 'ACTIVE',
  validFrom: '',
  validUntil: '',
};

const emptyReferralSettings = {
  level1InstantRate: 5,
  level2InstantRate: 4,
  level3InstantRate: 3,
  level4InstantRate: 2,
  level5InstantRate: 1,
  level1MonthlyRate: 1,
  level2MonthlyRate: 0,
  level3MonthlyRate: 0,
  level4MonthlyRate: 0,
  level5MonthlyRate: 0,
};

const defaultWithdrawalSettings = {
  withdrawalEnabled: true,
  minimumWithdrawalAmount: 1000,
  maximumWithdrawalAmount: 0,
  dailyWithdrawalLimit: 0,
  monthlyWithdrawalLimit: 0,
  largeWithdrawalAlertThreshold: 50000,
  processingTime: '24 hours',
  preferredMethod: 'Bank Transfer',
};

const legalDocumentOptions = [
  { key: 'privacy-policy', label: 'Privacy Policy' },
  { key: 'terms-and-conditions', label: 'Terms and Conditions' },
];

const emptyLegalDocument = {
  key: 'privacy-policy',
  title: 'Privacy Policy',
  summary: '',
  content: '',
  effectiveDate: '',
};

function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function toDateInput(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

function toApiDateTime(value, endOfDay = false) {
  if (!value) return null;
  return `${value}T${endOfDay ? '23:59:59' : '00:00:00'}`;
}

function normalizeWithdrawalSettings(settings) {
  return {
    ...defaultWithdrawalSettings,
    ...(settings || {}),
    withdrawalEnabled: settings?.withdrawalEnabled !== false,
    minimumWithdrawalAmount: Number(settings?.minimumWithdrawalAmount ?? defaultWithdrawalSettings.minimumWithdrawalAmount),
    maximumWithdrawalAmount: Number(settings?.maximumWithdrawalAmount ?? defaultWithdrawalSettings.maximumWithdrawalAmount),
    dailyWithdrawalLimit: Number(settings?.dailyWithdrawalLimit ?? defaultWithdrawalSettings.dailyWithdrawalLimit),
    monthlyWithdrawalLimit: Number(settings?.monthlyWithdrawalLimit ?? defaultWithdrawalSettings.monthlyWithdrawalLimit),
    largeWithdrawalAlertThreshold: Number(settings?.largeWithdrawalAlertThreshold ?? defaultWithdrawalSettings.largeWithdrawalAlertThreshold),
    processingTime: settings?.processingTime || defaultWithdrawalSettings.processingTime,
    preferredMethod: settings?.preferredMethod || defaultWithdrawalSettings.preferredMethod,
  };
}

function normalizeLegalDocument(document, fallbackKey = 'privacy-policy') {
  const key = document?.key || document?.documentKey || fallbackKey;
  const option = legalDocumentOptions.find((item) => item.key === key) || legalDocumentOptions[0];
  return {
    ...emptyLegalDocument,
    key: option.key,
    title: document?.title || option.label,
    summary: document?.summary || '',
    content: document?.content || '',
    effectiveDate: toDateInput(document?.effectiveDate),
    updatedAt: document?.updatedAt || null,
    updatedBy: document?.updatedBy || '',
  };
}

function normalizeReferralSettings(settings = {}) {
  return {
    level1InstantRate: Number(settings.level1InstantRate ?? settings.level1Rate ?? emptyReferralSettings.level1InstantRate),
    level2InstantRate: Number(settings.level2InstantRate ?? settings.level2Rate ?? emptyReferralSettings.level2InstantRate),
    level3InstantRate: Number(settings.level3InstantRate ?? settings.level3Rate ?? emptyReferralSettings.level3InstantRate),
    level4InstantRate: Number(settings.level4InstantRate ?? settings.level4Rate ?? emptyReferralSettings.level4InstantRate),
    level5InstantRate: Number(settings.level5InstantRate ?? settings.level5Rate ?? emptyReferralSettings.level5InstantRate),
    level1MonthlyRate: Number(settings.level1MonthlyRate ?? emptyReferralSettings.level1MonthlyRate),
    level2MonthlyRate: Number(settings.level2MonthlyRate ?? emptyReferralSettings.level2MonthlyRate),
    level3MonthlyRate: Number(settings.level3MonthlyRate ?? emptyReferralSettings.level3MonthlyRate),
    level4MonthlyRate: Number(settings.level4MonthlyRate ?? emptyReferralSettings.level4MonthlyRate),
    level5MonthlyRate: Number(settings.level5MonthlyRate ?? emptyReferralSettings.level5MonthlyRate),
  };
}

function SettingsPage() {
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [formValues, setFormValues] = useState(emptyPlan);
  const [coupons, setCoupons] = useState([]);
  const [selectedCouponId, setSelectedCouponId] = useState('');
  const [couponForm, setCouponForm] = useState(emptyCoupon);
  const [couponSaving, setCouponSaving] = useState(false);
  const [referralSettings, setReferralSettings] = useState(emptyReferralSettings);
  const [referralSaving, setReferralSaving] = useState(false);
  const [withdrawalSettings, setWithdrawalSettings] = useState(defaultWithdrawalSettings);
  const [withdrawalSettingsDraft, setWithdrawalSettingsDraft] = useState(defaultWithdrawalSettings);
  const [withdrawalSaving, setWithdrawalSaving] = useState(false);
  const [legalDocuments, setLegalDocuments] = useState([]);
  const [selectedLegalKey, setSelectedLegalKey] = useState('privacy-policy');
  const [legalForm, setLegalForm] = useState(emptyLegalDocument);
  const [legalSaving, setLegalSaving] = useState(false);
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

  const loadBusinessSettings = async () => {
    try {
      const [couponsRes, referralRes, withdrawalRes, legalRes] = await Promise.all([
        adminGetCoupons().catch(() => []),
        adminGetReferralSettings().catch(() => emptyReferralSettings),
        adminGetWithdrawalSettings().catch(() => defaultWithdrawalSettings),
        adminGetLegalDocuments().catch(() => []),
      ]);
      const loadedCoupons = toArray(couponsRes);
      setCoupons(loadedCoupons);
      const firstCoupon = loadedCoupons[0];
      if (firstCoupon) {
        setSelectedCouponId(firstCoupon.id);
        setCouponForm({
          ...emptyCoupon,
          ...firstCoupon,
          validFrom: toDateInput(firstCoupon.validFrom),
          validUntil: toDateInput(firstCoupon.validUntil),
        });
      }
      setReferralSettings(normalizeReferralSettings(referralRes));
      const normalizedWithdrawalSettings = normalizeWithdrawalSettings(withdrawalRes);
      setWithdrawalSettings(normalizedWithdrawalSettings);
      setWithdrawalSettingsDraft(normalizedWithdrawalSettings);

      const legalList = legalDocumentOptions.map((option) => {
        const match = toArray(legalRes).find((document) => (document?.key || document?.documentKey) === option.key);
        return normalizeLegalDocument(match, option.key);
      });
      setLegalDocuments(legalList);
      setLegalForm(legalList.find((document) => document.key === selectedLegalKey) || legalList[0] || emptyLegalDocument);
    } catch (err) {
      setError(err.message || 'Failed to load business settings.');
    }
  };

  useEffect(() => {
    loadPlans();
    loadBusinessSettings();
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

      if (!Number.isFinite(payload.minimumAmount) || payload.minimumAmount < 1) {
        throw new Error('Minimum investment must be at least Rs 1.');
      }
      if (!Number.isFinite(payload.maximumAmount) || payload.maximumAmount < payload.minimumAmount) {
        throw new Error('Maximum investment must be greater than or equal to minimum investment.');
      }
      if (!Number.isFinite(payload.lockInMonths) || payload.lockInMonths < 1) {
        throw new Error('Lock-in months must be at least 1.');
      }
      if (!Number.isFinite(payload.monthlyInterestRate) || payload.monthlyInterestRate < 0) {
        throw new Error('Monthly interest rate cannot be negative.');
      }

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

  const updateCouponField = (field) => (event) => {
    const value = event.target.type === 'number' ? Number(event.target.value) : event.target.value;
    setMessage('');
    setError('');
    setCouponForm((current) => ({ ...current, [field]: value }));
  };

  const handleCouponSelect = (event) => {
    const coupon = coupons.find((item) => String(item.id) === String(event.target.value));
    setSelectedCouponId(event.target.value);
    setMessage('');
    setError('');
    if (coupon) {
      setCouponForm({
        ...emptyCoupon,
        ...coupon,
        validFrom: toDateInput(coupon.validFrom),
        validUntil: toDateInput(coupon.validUntil),
      });
    }
  };

  const handleNewCoupon = () => {
    setSelectedCouponId('');
    setCouponForm(emptyCoupon);
    setMessage('');
    setError('');
  };

  const handleSaveCoupon = async () => {
    setCouponSaving(true);
    setMessage('');
    setError('');
    try {
      const payload = {
        code: couponForm.code.trim().toUpperCase(),
        title: couponForm.title,
        description: couponForm.description,
        type: couponForm.type,
        valueAmount: Number(couponForm.valueAmount),
        minimumInvestmentAmount: Number(couponForm.minimumInvestmentAmount || 0),
        maximumCashbackAmount: Number(couponForm.maximumCashbackAmount || 0),
        totalUsageLimit: Number(couponForm.totalUsageLimit || 0),
        perUserUsageLimit: Number(couponForm.perUserUsageLimit || 1),
        firstInvestmentOnly: Boolean(couponForm.firstInvestmentOnly),
        status: couponForm.status,
        validFrom: toApiDateTime(couponForm.validFrom),
        validUntil: toApiDateTime(couponForm.validUntil, true),
      };
      if (selectedCouponId) {
        const { code, ...updatePayload } = payload;
        await adminUpdateCoupon(selectedCouponId, updatePayload);
        setMessage('Coupon updated.');
      } else {
        await adminCreateCoupon(payload);
        setMessage('Coupon created.');
      }
      await loadBusinessSettings();
    } catch (err) {
      setError(err.message || 'Failed to save coupon.');
    } finally {
      setCouponSaving(false);
    }
  };

  const updateReferralField = (field) => (event) => {
    setReferralSettings((current) => ({ ...current, [field]: Number(event.target.value) }));
    setMessage('');
    setError('');
  };

  const handleSaveReferralSettings = async () => {
    setReferralSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await adminUpdateReferralSettings(referralSettings);
      setReferralSettings(normalizeReferralSettings({ ...referralSettings, ...response }));
      setMessage('Referral settings updated.');
    } catch (err) {
      setError(err.message || 'Failed to update referral settings.');
    } finally {
      setReferralSaving(false);
    }
  };

  const handleLegalDocumentSelect = (event) => {
    const key = event.target.value;
    setSelectedLegalKey(key);
    setMessage('');
    setError('');
    const document = legalDocuments.find((item) => item.key === key);
    setLegalForm(document || normalizeLegalDocument(null, key));
  };

  const updateLegalField = (field) => (event) => {
    setLegalForm((current) => ({ ...current, [field]: event.target.value }));
    setMessage('');
    setError('');
  };

  const handleSaveLegalDocument = async () => {
    setLegalSaving(true);
    setMessage('');
    setError('');
    try {
      const payload = {
        title: String(legalForm.title || '').trim(),
        summary: String(legalForm.summary || '').trim(),
        content: String(legalForm.content || '').trim(),
        effectiveDate: legalForm.effectiveDate || null,
      };

      if (!payload.title) {
        throw new Error('Legal document title is required.');
      }
      if (!payload.content) {
        throw new Error('Legal document content is required.');
      }

      const saved = normalizeLegalDocument(await adminUpdateLegalDocument(selectedLegalKey, payload), selectedLegalKey);
      setLegalDocuments((current) => {
        const next = current.filter((item) => item.key !== saved.key);
        return legalDocumentOptions.map((option) => next.find((item) => item.key === option.key) || (option.key === saved.key ? saved : normalizeLegalDocument(null, option.key)));
      });
      setLegalForm(saved);
      setMessage(`${saved.title} updated. Investor public page will show this content.`);
    } catch (err) {
      setError(err.message || 'Failed to update legal document.');
    } finally {
      setLegalSaving(false);
    }
  };

  const updateWithdrawalField = (field) => (event) => {
    const value = event.target.type === 'number' ? Number(event.target.value) : event.target.value;
    setWithdrawalSettingsDraft((current) => ({ ...current, [field]: value }));
    setMessage('');
    setError('');
  };

  const handleSaveWithdrawalSettings = async () => {
    setWithdrawalSaving(true);
    setMessage('');
    setError('');
    try {
      const payload = {
        ...withdrawalSettingsDraft,
        withdrawalEnabled: Boolean(withdrawalSettingsDraft.withdrawalEnabled),
        minimumWithdrawalAmount: Number(withdrawalSettingsDraft.minimumWithdrawalAmount || 0),
        maximumWithdrawalAmount: Number(withdrawalSettingsDraft.maximumWithdrawalAmount || 0),
        dailyWithdrawalLimit: Number(withdrawalSettingsDraft.dailyWithdrawalLimit || 0),
        monthlyWithdrawalLimit: Number(withdrawalSettingsDraft.monthlyWithdrawalLimit || 0),
        largeWithdrawalAlertThreshold: Number(withdrawalSettingsDraft.largeWithdrawalAlertThreshold || 0),
        processingTime: String(withdrawalSettingsDraft.processingTime || '').trim(),
        preferredMethod: String(withdrawalSettingsDraft.preferredMethod || '').trim(),
      };

      if (payload.minimumWithdrawalAmount < 1) {
        throw new Error('Minimum withdrawal must be at least Rs 1.');
      }
      if (payload.maximumWithdrawalAmount > 0 && payload.maximumWithdrawalAmount < payload.minimumWithdrawalAmount) {
        throw new Error('Maximum withdrawal must be 0 or greater than/equal to minimum withdrawal.');
      }
      if (payload.dailyWithdrawalLimit > 0 && payload.dailyWithdrawalLimit < payload.minimumWithdrawalAmount) {
        throw new Error('Daily withdrawal limit must be 0 or greater than/equal to minimum withdrawal.');
      }
      if (payload.monthlyWithdrawalLimit > 0 && payload.monthlyWithdrawalLimit < payload.minimumWithdrawalAmount) {
        throw new Error('Monthly withdrawal limit must be 0 or greater than/equal to minimum withdrawal.');
      }

      const response = await adminUpdateWithdrawalSettings(payload);
      const normalized = normalizeWithdrawalSettings(response);
      setWithdrawalSettings(normalized);
      setWithdrawalSettingsDraft(normalized);
      setMessage('Withdrawal limits updated. Investor app will use these limits immediately.');
    } catch (err) {
      setError(err.message || 'Failed to update withdrawal limits.');
    } finally {
      setWithdrawalSaving(false);
    }
  };

  return (
    <div className="admin-settings-page space-y-6">
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
        <div className={`admin-settings-alert rounded-2xl border px-4 py-3 text-sm ${error ? 'border-rose-500/30 bg-rose-500/10 text-rose-100' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'}`}>
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
              <input type="number" min="0" value={formValues.monthlyInterestRate} onChange={updateField('monthlyInterestRate')} className="input-shell mt-3" />
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Banknote className="h-4 w-4 text-gold-soft" />
                Minimum investment
              </span>
              <input type="number" min="1" value={formValues.minimumAmount} onChange={updateField('minimumAmount')} className="input-shell mt-3" />
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Banknote className="h-4 w-4 text-gold-soft" />
                Maximum investment
              </span>
              <input type="number" min={Number(formValues.minimumAmount || 1)} value={formValues.maximumAmount} onChange={updateField('maximumAmount')} className="input-shell mt-3" />
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <CalendarClock className="h-4 w-4 text-gold-soft" />
                Lock-in months
              </span>
              <input type="number" min="1" value={formValues.lockInMonths} onChange={updateField('lockInMonths')} className="input-shell mt-3" />
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <SectionCard title="Withdrawal Limits" subtitle="Control investor wallet withdrawal rules shown in the app and enforced by backend APIs.">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:col-span-2">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Wallet className="h-4 w-4 text-gold-soft" />
                Enable wallet withdrawals
              </span>
              <input
                type="checkbox"
                checked={Boolean(withdrawalSettingsDraft.withdrawalEnabled)}
                onChange={(event) => setWithdrawalSettingsDraft((current) => ({ ...current, withdrawalEnabled: event.target.checked }))}
                className="h-5 w-5"
              />
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Banknote className="h-4 w-4 text-gold-soft" />
                Minimum withdrawal
              </span>
              <input type="number" min="1" value={withdrawalSettingsDraft.minimumWithdrawalAmount} onChange={updateWithdrawalField('minimumWithdrawalAmount')} className="input-shell mt-3" />
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Banknote className="h-4 w-4 text-gold-soft" />
                Maximum per request
              </span>
              <input type="number" min="0" value={withdrawalSettingsDraft.maximumWithdrawalAmount} onChange={updateWithdrawalField('maximumWithdrawalAmount')} className="input-shell mt-3" />
              <p className="mt-2 text-xs text-slate-400">Use 0 for no maximum limit.</p>
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <CalendarClock className="h-4 w-4 text-gold-soft" />
                Daily withdrawal limit
              </span>
              <input type="number" min="0" value={withdrawalSettingsDraft.dailyWithdrawalLimit} onChange={updateWithdrawalField('dailyWithdrawalLimit')} className="input-shell mt-3" />
              <p className="mt-2 text-xs text-slate-400">Use 0 for unlimited daily withdrawals.</p>
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <CalendarClock className="h-4 w-4 text-gold-soft" />
                Monthly withdrawal limit
              </span>
              <input type="number" min="0" value={withdrawalSettingsDraft.monthlyWithdrawalLimit} onChange={updateWithdrawalField('monthlyWithdrawalLimit')} className="input-shell mt-3" />
              <p className="mt-2 text-xs text-slate-400">Use 0 for unlimited monthly withdrawals.</p>
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <ShieldCheck className="h-4 w-4 text-gold-soft" />
                Large withdrawal alert
              </span>
              <input type="number" min="0" value={withdrawalSettingsDraft.largeWithdrawalAlertThreshold} onChange={updateWithdrawalField('largeWithdrawalAlertThreshold')} className="input-shell mt-3" />
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Clock3 className="h-4 w-4 text-gold-soft" />
                Processing time
              </span>
              <input value={withdrawalSettingsDraft.processingTime} onChange={updateWithdrawalField('processingTime')} className="input-shell mt-3" />
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:col-span-2">
              <span className="text-sm font-medium text-slate-300">Preferred payout method</span>
              <input value={withdrawalSettingsDraft.preferredMethod} onChange={updateWithdrawalField('preferredMethod')} className="input-shell mt-3" />
            </label>
          </div>

          <div className="mt-6 flex justify-end">
            <button type="button" onClick={handleSaveWithdrawalSettings} disabled={withdrawalSaving} className="btn-primary disabled:opacity-60">
              <Save className="h-4 w-4" />
              {withdrawalSaving ? 'Saving...' : 'Save Withdrawal Limits'}
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Withdrawal Preview" subtitle="What investors will see when requesting wallet withdrawals.">
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-slate-400">Current status</p>
              <p className="mt-3 font-heading text-2xl font-semibold text-white">
                {withdrawalSettings.withdrawalEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-slate-400">Allowed amount</p>
              <p className="mt-3 font-heading text-xl font-semibold text-white">
                {formatCurrency(withdrawalSettings.minimumWithdrawalAmount)} to{' '}
                {Number(withdrawalSettings.maximumWithdrawalAmount) > 0 ? formatCurrency(withdrawalSettings.maximumWithdrawalAmount) : 'No max'}
              </p>
            </div>

            <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5 text-sm leading-7 text-blue-100">
              Daily limit: {Number(withdrawalSettings.dailyWithdrawalLimit) > 0 ? formatCurrency(withdrawalSettings.dailyWithdrawalLimit) : 'Unlimited'}.
              Monthly limit: {Number(withdrawalSettings.monthlyWithdrawalLimit) > 0 ? formatCurrency(withdrawalSettings.monthlyWithdrawalLimit) : 'Unlimited'}.
              Processing: {withdrawalSettings.processingTime || 'Not specified'} via {withdrawalSettings.preferredMethod || 'admin configured method'}.
            </div>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
        <SectionCard title="Coupon Campaign" subtitle="Create wallet cashback coupons for investor checkout.">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 md:col-span-2">
              <span className="text-sm font-medium text-slate-300">Select coupon</span>
              <select value={selectedCouponId} onChange={handleCouponSelect} className="input-shell mt-3">
                <option value="">Create new coupon</option>
                {coupons.map((coupon) => (
                  <option key={coupon.id} value={coupon.id}>
                    {coupon.code} - {coupon.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <Tag className="h-4 w-4 text-gold-soft" />
                Coupon code
              </span>
              <input value={couponForm.code} onChange={updateCouponField('code')} disabled={Boolean(selectedCouponId)} className="input-shell mt-3 disabled:opacity-60" />
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="text-sm font-medium text-slate-300">Title</span>
              <input value={couponForm.title} onChange={updateCouponField('title')} className="input-shell mt-3" />
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="text-sm font-medium text-slate-300">Cashback type</span>
              <select value={couponForm.type} onChange={updateCouponField('type')} className="input-shell mt-3">
                <option value="FLAT_CASHBACK">Flat cashback</option>
                <option value="PERCENT_CASHBACK">Percent cashback</option>
              </select>
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="text-sm font-medium text-slate-300">{couponForm.type === 'PERCENT_CASHBACK' ? 'Cashback percent' : 'Cashback amount'}</span>
              <input type="number" value={couponForm.valueAmount} onChange={updateCouponField('valueAmount')} className="input-shell mt-3" />
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="text-sm font-medium text-slate-300">Minimum investment</span>
              <input type="number" value={couponForm.minimumInvestmentAmount} onChange={updateCouponField('minimumInvestmentAmount')} className="input-shell mt-3" />
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="text-sm font-medium text-slate-300">Max cashback</span>
              <input type="number" value={couponForm.maximumCashbackAmount} onChange={updateCouponField('maximumCashbackAmount')} className="input-shell mt-3" />
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="text-sm font-medium text-slate-300">Total usage limit</span>
              <input type="number" value={couponForm.totalUsageLimit} onChange={updateCouponField('totalUsageLimit')} className="input-shell mt-3" />
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="text-sm font-medium text-slate-300">Per investor limit</span>
              <input type="number" value={couponForm.perUserUsageLimit} onChange={updateCouponField('perUserUsageLimit')} className="input-shell mt-3" />
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="text-sm font-medium text-slate-300">Valid from</span>
              <input type="date" value={couponForm.validFrom} onChange={updateCouponField('validFrom')} className="input-shell mt-3" />
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="text-sm font-medium text-slate-300">Valid until</span>
              <input type="date" value={couponForm.validUntil} onChange={updateCouponField('validUntil')} className="input-shell mt-3" />
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <span className="text-sm font-medium text-slate-300">Status</span>
              <select value={couponForm.status} onChange={updateCouponField('status')} className="input-shell mt-3">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm font-medium text-slate-300">
              <input
                type="checkbox"
                checked={Boolean(couponForm.firstInvestmentOnly)}
                onChange={(event) => setCouponForm((current) => ({ ...current, firstInvestmentOnly: event.target.checked }))}
                className="h-4 w-4"
              />
              First investment only
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={handleNewCoupon} className="btn-secondary">
              New Coupon
            </button>
            <button type="button" onClick={handleSaveCoupon} disabled={couponSaving} className="btn-primary disabled:opacity-60">
              <Save className="h-4 w-4" />
              {couponSaving ? 'Saving...' : 'Save Coupon'}
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Referral Rates" subtitle="Instant cashback pays up to five uplines. Monthly income pays only the direct referrer.">
          <div className="space-y-6">
            <div>
              <p className="mb-3 text-sm font-semibold text-slate-200">Instant Cashback</p>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((level) => {
                  const key = `level${level}InstantRate`;
                  return (
                    <label key={key} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                      <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                        <Percent className="h-4 w-4 text-gold-soft" />
                        Level {level} instant rate
                      </span>
                      <input type="number" min="0" value={referralSettings[key]} onChange={updateReferralField(key)} className="input-shell mt-3" />
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold text-slate-200">Monthly Interest Share</p>
              <div className="space-y-4">
                <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <Percent className="h-4 w-4 text-gold-soft" />
                    Level 1 direct referrer monthly rate
                  </span>
                  <input type="number" min="0" value={referralSettings.level1MonthlyRate} onChange={updateReferralField('level1MonthlyRate')} className="input-shell mt-3" />
                </label>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <Percent className="h-4 w-4 text-gold-soft" />
                    Level 2-5 monthly rate
                  </span>
                  <p className="mt-3 text-2xl font-semibold text-slate-200">0%</p>
                  <p className="mt-2 text-xs leading-6 text-slate-400">
                    Monthly referral income is credited only to the direct referrer from the investor's interest amount.
                  </p>
                </div>
              </div>
            </div>

            <button type="button" onClick={handleSaveReferralSettings} disabled={referralSaving} className="btn-primary w-full disabled:opacity-60">
              <Save className="h-4 w-4" />
              {referralSaving ? 'Saving...' : 'Save Referral Rates'}
            </button>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Legal Documents" subtitle="Edit the Privacy Policy and Terms shown on investor signup and public legal pages.">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.45fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 block">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
                <FileText className="h-4 w-4 text-gold-soft" />
                Select legal document
              </span>
              <select value={selectedLegalKey} onChange={handleLegalDocumentSelect} className="input-shell mt-3">
                {legalDocumentOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 block">
              <span className="text-sm font-medium text-slate-300">Title</span>
              <input value={legalForm.title} onChange={updateLegalField('title')} className="input-shell mt-3" />
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 block">
              <span className="text-sm font-medium text-slate-300">Effective date</span>
              <input type="date" value={legalForm.effectiveDate} onChange={updateLegalField('effectiveDate')} className="input-shell mt-3" />
            </label>

            <div className="rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5 text-sm leading-7 text-blue-100">
              <p>Public URL: /api/legal/{selectedLegalKey}</p>
              <p>Updated by: {legalForm.updatedBy || 'SYSTEM'}</p>
              <p>Updated at: {legalForm.updatedAt || 'Default content'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 block">
              <span className="text-sm font-medium text-slate-300">Summary</span>
              <textarea value={legalForm.summary} onChange={updateLegalField('summary')} className="input-shell mt-3 min-h-[88px] resize-y" />
            </label>

            <label className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 block">
              <span className="text-sm font-medium text-slate-300">Content</span>
              <textarea value={legalForm.content} onChange={updateLegalField('content')} className="input-shell mt-3 min-h-[320px] resize-y leading-7" />
            </label>

            <div className="flex justify-end">
              <button type="button" onClick={handleSaveLegalDocument} disabled={legalSaving} className="btn-primary disabled:opacity-60">
                <Save className="h-4 w-4" />
                {legalSaving ? 'Saving...' : 'Save Legal Document'}
              </button>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

export default SettingsPage;
