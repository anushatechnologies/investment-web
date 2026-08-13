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
  planName: 'Anusha Standard Growth Plan',
  description: 'Standard 6-Month Lock-in Investment Plan with 10% Monthly Payout credited to Wallet.',
  minimumAmount: 10000,
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
  const [activeTab, setActiveTab] = useState('plans');

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
        loadedPlans.find((plan) => String(plan.planName || '').toLowerCase().includes('anusha standard growth plan')) ||
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
    <div className="admin-settings-page space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 mb-4">
            <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-700 dark:text-indigo-400">
              Platform Controls
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white font-heading">
            Settings <span className="text-indigo-600 dark:text-indigo-400">Console</span>
          </h1>
          <p className="mt-3 text-slate-500 dark:text-slate-400 max-w-2xl text-lg">
            Configure system parameters, investment boundaries, and operational rules for the platform.
          </p>
        </div>
      </div>

      {(message || error) && (
        <div className={`animate-in fade-in slide-in-from-top-4 flex items-start gap-3 rounded-2xl border p-4 shadow-lg ${error ? 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-200' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'}`}>
          <div className={`mt-0.5 rounded-full p-1 ${error ? 'bg-rose-500/20' : 'bg-emerald-500/20'}`}>
            {error ? <ShieldCheck className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          </div>
          <p className="text-sm font-medium leading-relaxed">{error || message}</p>
        </div>
      )}

      {/* Premium Tab Navigation */}
      <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex inline-flex space-x-2 rounded-2xl bg-white dark:bg-[#121b2f] p-1.5 shadow-sm border border-slate-200/60 dark:border-white/5">
          {[
            { id: 'plans', label: 'Investment Plans', icon: TrendingUp },
            { id: 'withdrawals', label: 'Withdrawal Rules', icon: Wallet },
            { id: 'coupons', label: 'Promotions', icon: Tag },
            { id: 'referrals', label: 'Affiliate Rates', icon: Percent },
            { id: 'legal', label: 'Legal Docs', icon: FileText }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-bold transition-all duration-300 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-[1.02]' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-indigo-300'}`}
            >
              <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-white' : 'opacity-70'}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 transition-all duration-500 ease-in-out animate-in fade-in slide-in-from-bottom-4">
        {activeTab === 'plans' && (
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
            <SectionCard title="Plan Configuration" subtitle="Create and manage investment packages available to users.">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Select existing plan</label>
                  <div className="relative">
                    <select value={selectedPlanId} onChange={handlePlanSelect} className="w-full appearance-none rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5 pr-10 text-sm font-semibold text-slate-800 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700/60 dark:bg-slate-900/50 dark:text-white dark:focus:border-indigo-400">
                      <option value="">+ Create new plan</option>
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.planName} - {plan.monthlyInterestRate}% monthly
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                      <RefreshCw className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="group relative rounded-2xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-200/60 transition-all hover:bg-white hover:shadow-md hover:ring-indigo-500/30 dark:bg-[#121b2f]/50 dark:ring-white/5 dark:hover:bg-[#162138]/80 dark:hover:ring-indigo-400/30">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    <ShieldCheck className="h-4 w-4 text-indigo-500" /> Plan name
                  </span>
                  <input value={formValues.planName} onChange={updateField('planName')} className="w-full bg-transparent border-b-2 border-slate-200 px-1 py-2 text-lg font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700/60 dark:text-white dark:focus:border-indigo-400 transition-colors" />
                </div>

                <div className="group relative rounded-2xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-200/60 transition-all hover:bg-white hover:shadow-md hover:ring-indigo-500/30 dark:bg-[#121b2f]/50 dark:ring-white/5 dark:hover:bg-[#162138]/80 dark:hover:ring-indigo-400/30">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    <TrendingUp className="h-4 w-4 text-emerald-500" /> Monthly interest (%)
                  </span>
                  <input type="number" min="0" value={formValues.monthlyInterestRate} onChange={updateField('monthlyInterestRate')} className="w-full bg-transparent border-b-2 border-slate-200 px-1 py-2 text-lg font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700/60 dark:text-white dark:focus:border-indigo-400 transition-colors" />
                </div>

                <div className="group relative rounded-2xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-200/60 transition-all hover:bg-white hover:shadow-md hover:ring-indigo-500/30 dark:bg-[#121b2f]/50 dark:ring-white/5 dark:hover:bg-[#162138]/80 dark:hover:ring-indigo-400/30">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    <Banknote className="h-4 w-4 text-indigo-500" /> Min investment
                  </span>
                  <input type="number" min="1" value={formValues.minimumAmount} onChange={updateField('minimumAmount')} className="w-full bg-transparent border-b-2 border-slate-200 px-1 py-2 text-lg font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700/60 dark:text-white dark:focus:border-indigo-400 transition-colors" />
                </div>

                <div className="group relative rounded-2xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-200/60 transition-all hover:bg-white hover:shadow-md hover:ring-indigo-500/30 dark:bg-[#121b2f]/50 dark:ring-white/5 dark:hover:bg-[#162138]/80 dark:hover:ring-indigo-400/30">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    <Banknote className="h-4 w-4 text-indigo-500" /> Max investment
                  </span>
                  <input type="number" min={Number(formValues.minimumAmount || 1)} value={formValues.maximumAmount} onChange={updateField('maximumAmount')} className="w-full bg-transparent border-b-2 border-slate-200 px-1 py-2 text-lg font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700/60 dark:text-white dark:focus:border-indigo-400 transition-colors" />
                </div>

                <div className="group relative rounded-2xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-200/60 transition-all hover:bg-white hover:shadow-md hover:ring-indigo-500/30 dark:bg-[#121b2f]/50 dark:ring-white/5 dark:hover:bg-[#162138]/80 dark:hover:ring-indigo-400/30">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    <CalendarClock className="h-4 w-4 text-orange-500" /> Lock-in months
                  </span>
                  <input type="number" min="1" value={formValues.lockInMonths} onChange={updateField('lockInMonths')} className="w-full bg-transparent border-b-2 border-slate-200 px-1 py-2 text-lg font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700/60 dark:text-white dark:focus:border-indigo-400 transition-colors" />
                </div>

                <div className="group relative rounded-2xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-200/60 transition-all hover:bg-white hover:shadow-md hover:ring-indigo-500/30 dark:bg-[#121b2f]/50 dark:ring-white/5 dark:hover:bg-[#162138]/80 dark:hover:ring-indigo-400/30">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    <TrendingUp className="h-4 w-4 text-indigo-500" /> Status
                  </span>
                  <select value={formValues.active ? 'true' : 'false'} onChange={(event) => setFormValues((current) => ({ ...current, active: event.target.value === 'true' }))} className="w-full bg-transparent border-b-2 border-slate-200 px-1 py-2 text-lg font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700/60 dark:text-white dark:focus:border-indigo-400 transition-colors appearance-none">
                    <option value="true">Active for investors</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                <div className="group relative rounded-2xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-200/60 transition-all hover:bg-white hover:shadow-md hover:ring-indigo-500/30 dark:bg-[#121b2f]/50 dark:ring-white/5 dark:hover:bg-[#162138]/80 dark:hover:ring-indigo-400/30 md:col-span-2">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    <FileText className="h-4 w-4 text-indigo-500" /> Description
                  </span>
                  <textarea value={formValues.description} onChange={updateField('description')} className="w-full bg-transparent border-b-2 border-slate-200 px-1 py-2 text-base font-medium text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700/60 dark:text-white dark:focus:border-indigo-400 transition-colors min-h-[80px] resize-none" />
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end border-t border-slate-100 dark:border-slate-800/60 pt-6">
                <button type="button" onClick={handleNewPlan} className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">
                  Reset Form
                </button>
                <button type="button" onClick={handleSave} disabled={saving || loading} className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 disabled:shadow-none">
                  <Save className="h-5 w-5" />
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Simulation Engine" subtitle="Live preview of interest distribution based on the minimum amount.">
              <div className="space-y-6">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 p-8 shadow-xl shadow-indigo-600/20">
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <p className="text-indigo-100 font-medium text-sm tracking-wide uppercase">Active Selection</p>
                      <StatusBadge label={formValues.active ? 'ACTIVE' : 'INACTIVE'} />
                    </div>
                    <h3 className="text-3xl font-black text-white mb-2">{formValues.planName || 'Unnamed Plan'}</h3>
                    <div className="mt-8 bg-black/20 rounded-2xl p-5 backdrop-blur-sm border border-white/10">
                      <p className="text-indigo-200 text-sm mb-1 font-medium">Estimated Monthly Yield (At Min Amount)</p>
                      <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-black text-white tracking-tight">{formatCurrency(estimatedMonthlyInterest)}</span>
                        <span className="text-indigo-200 font-bold">/ mo</span>
                      </div>
                      <p className="mt-3 text-sm text-indigo-200/80 font-medium border-t border-white/10 pt-3">
                        Calculation: {formatCurrency(formValues.minimumAmount)} base × {formValues.monthlyInterestRate}% rate
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-indigo-200/60 bg-indigo-50/50 dark:border-indigo-500/20 dark:bg-indigo-500/5 p-5 flex gap-4">
                  <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2 rounded-lg h-fit shrink-0">
                    <RefreshCw className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-indigo-900 dark:text-indigo-200 mb-1">Manual Interest Trigger</h4>
                    <p className="text-sm leading-relaxed text-indigo-800/80 dark:text-indigo-300/80">
                      Executing this will immediately process the monthly interest queue. Backend services will iterate through active wallets and credit balances based on individual stored parameters.
                    </p>
                  </div>
                </div>

                <button type="button" onClick={handleTriggerInterest} disabled={interestRunning} className="group relative w-full flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-slate-900 px-6 py-4 font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 hover:shadow-lg">
                  <RefreshCw className={`h-5 w-5 ${interestRunning ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                  <span className="relative z-10">{interestRunning ? 'Processing Queue...' : 'Execute Monthly Interest Run'}</span>
                </button>
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
            <SectionCard title="Withdrawal Constraints" subtitle="Global threshold rules controlling investor liquidation capabilities.">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="md:col-span-2 flex items-center justify-between p-6 rounded-3xl border-2 border-indigo-100 bg-indigo-50/30 dark:border-indigo-500/20 dark:bg-indigo-500/5 transition-all hover:border-indigo-300 dark:hover:border-indigo-500/40">
                  <div>
                    <h4 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-indigo-600" /> Global Withdrawals
                    </h4>
                    <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Master switch to pause or resume all outgoing transfer requests.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={Boolean(withdrawalSettingsDraft.withdrawalEnabled)} onChange={(event) => setWithdrawalSettingsDraft((current) => ({ ...current, withdrawalEnabled: event.target.checked }))} className="sr-only peer" />
                    <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {[
                  { label: 'Minimum withdrawal', field: 'minimumWithdrawalAmount', icon: Banknote, color: 'text-emerald-500' },
                  { label: 'Maximum per request', field: 'maximumWithdrawalAmount', icon: Banknote, color: 'text-rose-500', note: '0 = Unlimited' },
                  { label: 'Daily volume limit', field: 'dailyWithdrawalLimit', icon: CalendarClock, color: 'text-indigo-500', note: '0 = Unlimited' },
                  { label: 'Monthly volume limit', field: 'monthlyWithdrawalLimit', icon: CalendarClock, color: 'text-violet-500', note: '0 = Unlimited' },
                  { label: 'Large amount alert trigger', field: 'largeWithdrawalAlertThreshold', icon: ShieldCheck, color: 'text-amber-500' }
                ].map(({ label, field, icon: Icon, color, note }) => (
                  <div key={field} className="group relative rounded-2xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-200/60 transition-all hover:bg-white hover:shadow-md hover:ring-indigo-500/30 dark:bg-[#121b2f]/50 dark:ring-white/5 dark:hover:bg-[#162138]/80 dark:hover:ring-indigo-400/30">
                    <div className="flex justify-between items-start mb-3">
                      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        <Icon className={`h-4 w-4 ${color}`} /> {label}
                      </span>
                      {note && <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded-md">{note}</span>}
                    </div>
                    <input type="number" min="0" value={withdrawalSettingsDraft[field]} onChange={updateWithdrawalField(field)} className="w-full bg-transparent border-b-2 border-slate-200 px-1 py-2 text-xl font-black text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700/60 dark:text-white dark:focus:border-indigo-400 transition-colors" />
                  </div>
                ))}

                <div className="group relative rounded-2xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-200/60 transition-all hover:bg-white hover:shadow-md hover:ring-indigo-500/30 dark:bg-[#121b2f]/50 dark:ring-white/5 dark:hover:bg-[#162138]/80 dark:hover:ring-indigo-400/30">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    <Clock3 className="h-4 w-4 text-blue-500" /> SLA Promise
                  </span>
                  <input value={withdrawalSettingsDraft.processingTime} onChange={updateWithdrawalField('processingTime')} placeholder="e.g. 24 hours" className="w-full bg-transparent border-b-2 border-slate-200 px-1 py-2 text-lg font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700/60 dark:text-white dark:focus:border-indigo-400 transition-colors" />
                </div>

                <div className="group relative rounded-2xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-200/60 transition-all hover:bg-white hover:shadow-md hover:ring-indigo-500/30 dark:bg-[#121b2f]/50 dark:ring-white/5 dark:hover:bg-[#162138]/80 dark:hover:ring-indigo-400/30 md:col-span-2">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    <Banknote className="h-4 w-4 text-emerald-600" /> Default Payout Method
                  </span>
                  <input value={withdrawalSettingsDraft.preferredMethod} onChange={updateWithdrawalField('preferredMethod')} placeholder="e.g. Bank Transfer" className="w-full bg-transparent border-b-2 border-slate-200 px-1 py-2 text-lg font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700/60 dark:text-white dark:focus:border-indigo-400 transition-colors" />
                </div>
              </div>

              <div className="mt-8 flex justify-end border-t border-slate-100 dark:border-slate-800/60 pt-6">
                <button type="button" onClick={handleSaveWithdrawalSettings} disabled={withdrawalSaving} className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 disabled:shadow-none">
                  <Save className="h-5 w-5" />
                  {withdrawalSaving ? 'Applying Rules...' : 'Apply Withdrawal Rules'}
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Rule Simulation" subtitle="End-user impact based on current active rules.">
              <div className="space-y-6">
                <div className={`rounded-3xl p-6 border-2 transition-colors ${withdrawalSettings.withdrawalEnabled ? 'border-emerald-200/60 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/5' : 'border-rose-200/60 bg-rose-50 dark:border-rose-500/20 dark:bg-rose-500/5'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-2xl ${withdrawalSettings.withdrawalEnabled ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                      <Wallet className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">System Status</p>
                      <p className={`text-3xl font-black mt-1 ${withdrawalSettings.withdrawalEnabled ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                        {withdrawalSettings.withdrawalEnabled ? 'Accepting' : 'Halted'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl bg-slate-50 dark:bg-[#121b2f]/50 p-6 ring-1 ring-inset ring-slate-200/60 dark:ring-white/5 space-y-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Allowed Per Transaction</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {formatCurrency(withdrawalSettings.minimumWithdrawalAmount)} <span className="text-slate-400 font-medium">to</span> {Number(withdrawalSettings.maximumWithdrawalAmount) > 0 ? formatCurrency(withdrawalSettings.maximumWithdrawalAmount) : '∞'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Daily Cap</p>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{Number(withdrawalSettings.dailyWithdrawalLimit) > 0 ? formatCurrency(withdrawalSettings.dailyWithdrawalLimit) : 'None'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Monthly Cap</p>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{Number(withdrawalSettings.monthlyWithdrawalLimit) > 0 ? formatCurrency(withdrawalSettings.monthlyWithdrawalLimit) : 'None'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-5 rounded-2xl border border-blue-200/50 dark:border-blue-800/50">
                  <Clock3 className="h-6 w-6 shrink-0" />
                  <p className="text-sm font-medium leading-relaxed">
                    Users are informed that processing takes <strong className="font-bold">{withdrawalSettings.processingTime || 'a standard period'}</strong> via <strong className="font-bold">{withdrawalSettings.preferredMethod || 'the approved method'}</strong>.
                  </p>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
            <SectionCard title="Coupon Builder" subtitle="Generate dynamic promotional codes to incentivize deposits.">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Modify existing promotion</label>
                  <div className="relative">
                    <select value={selectedCouponId} onChange={handleCouponSelect} className="w-full appearance-none rounded-2xl border-2 border-slate-200 bg-white px-4 py-3.5 pr-10 text-sm font-semibold text-slate-800 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700/60 dark:bg-slate-900/50 dark:text-white dark:focus:border-indigo-400">
                      <option value="">+ Create new coupon campaign</option>
                      {coupons.map((coupon) => (
                        <option key={coupon.id} value={coupon.id}>
                          {coupon.code} - {coupon.title}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                      <Tag className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                <div className="group relative rounded-2xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-200/60 transition-all hover:bg-white hover:shadow-md hover:ring-indigo-500/30 dark:bg-[#121b2f]/50 dark:ring-white/5 dark:hover:bg-[#162138]/80 dark:hover:ring-indigo-400/30">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    <Tag className="h-4 w-4 text-indigo-500" /> Coupon Code
                  </span>
                  <input value={couponForm.code} onChange={updateCouponField('code')} disabled={Boolean(selectedCouponId)} placeholder="e.g. SUMMER500" className="w-full bg-transparent border-b-2 border-slate-200 px-1 py-2 text-2xl font-black tracking-widest text-slate-900 uppercase focus:border-indigo-500 focus:outline-none dark:border-slate-700/60 dark:text-white dark:focus:border-indigo-400 transition-colors disabled:opacity-50" />
                </div>

                <div className="group relative rounded-2xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-200/60 transition-all hover:bg-white hover:shadow-md hover:ring-indigo-500/30 dark:bg-[#121b2f]/50 dark:ring-white/5 dark:hover:bg-[#162138]/80 dark:hover:ring-indigo-400/30">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    <FileText className="h-4 w-4 text-indigo-500" /> Campaign Title
                  </span>
                  <input value={couponForm.title} onChange={updateCouponField('title')} className="w-full bg-transparent border-b-2 border-slate-200 px-1 py-2 text-lg font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700/60 dark:text-white dark:focus:border-indigo-400 transition-colors" />
                </div>

                <div className="group relative rounded-2xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-200/60 transition-all hover:bg-white hover:shadow-md hover:ring-indigo-500/30 dark:bg-[#121b2f]/50 dark:ring-white/5 dark:hover:bg-[#162138]/80 dark:hover:ring-indigo-400/30">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    <Percent className="h-4 w-4 text-emerald-500" /> Cashback Type
                  </span>
                  <select value={couponForm.type} onChange={updateCouponField('type')} className="w-full bg-transparent border-b-2 border-slate-200 px-1 py-2 text-lg font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700/60 dark:text-white dark:focus:border-indigo-400 transition-colors appearance-none">
                    <option value="FLAT_CASHBACK">Flat Amount Cashback</option>
                    <option value="PERCENT_CASHBACK">Percentage Based</option>
                  </select>
                </div>

                <div className="group relative rounded-2xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-200/60 transition-all hover:bg-white hover:shadow-md hover:ring-indigo-500/30 dark:bg-[#121b2f]/50 dark:ring-white/5 dark:hover:bg-[#162138]/80 dark:hover:ring-indigo-400/30">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    <Banknote className="h-4 w-4 text-emerald-500" /> {couponForm.type === 'PERCENT_CASHBACK' ? 'Percent Value' : 'Flat Amount'}
                  </span>
                  <input type="number" value={couponForm.valueAmount} onChange={updateCouponField('valueAmount')} className="w-full bg-transparent border-b-2 border-slate-200 px-1 py-2 text-2xl font-black text-emerald-600 focus:border-indigo-500 focus:outline-none dark:border-slate-700/60 dark:text-emerald-400 dark:focus:border-indigo-400 transition-colors" />
                </div>

                {[
                  { label: 'Min Investment Required', field: 'minimumInvestmentAmount', icon: TrendingUp },
                  { label: 'Max Cashback Cap', field: 'maximumCashbackAmount', icon: ShieldCheck },
                  { label: 'Global Usage Limit', field: 'totalUsageLimit', icon: RefreshCw },
                  { label: 'Per User Limit', field: 'perUserUsageLimit', icon: Wallet }
                ].map(({ label, field, icon: Icon }) => (
                  <div key={field} className="group relative rounded-2xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-200/60 transition-all hover:bg-white hover:shadow-md hover:ring-indigo-500/30 dark:bg-[#121b2f]/50 dark:ring-white/5 dark:hover:bg-[#162138]/80 dark:hover:ring-indigo-400/30">
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                      <Icon className="h-4 w-4 text-indigo-400" /> {label}
                    </span>
                    <input type="number" value={couponForm[field]} onChange={updateCouponField(field)} className="w-full bg-transparent border-b-2 border-slate-200 px-1 py-2 text-lg font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700/60 dark:text-white dark:focus:border-indigo-400 transition-colors" />
                  </div>
                ))}

                <div className="group relative rounded-2xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-200/60 transition-all hover:bg-white hover:shadow-md hover:ring-indigo-500/30 dark:bg-[#121b2f]/50 dark:ring-white/5 dark:hover:bg-[#162138]/80 dark:hover:ring-indigo-400/30">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    <CalendarClock className="h-4 w-4 text-indigo-500" /> Valid From
                  </span>
                  <input type="date" value={couponForm.validFrom} onChange={updateCouponField('validFrom')} className="w-full bg-transparent border-b-2 border-slate-200 px-1 py-2 text-lg font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700/60 dark:text-white dark:focus:border-indigo-400 transition-colors appearance-none" />
                </div>

                <div className="group relative rounded-2xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-200/60 transition-all hover:bg-white hover:shadow-md hover:ring-indigo-500/30 dark:bg-[#121b2f]/50 dark:ring-white/5 dark:hover:bg-[#162138]/80 dark:hover:ring-indigo-400/30">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    <CalendarClock className="h-4 w-4 text-rose-500" /> Expiry Date
                  </span>
                  <input type="date" value={couponForm.validUntil} onChange={updateCouponField('validUntil')} className="w-full bg-transparent border-b-2 border-slate-200 px-1 py-2 text-lg font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700/60 dark:text-white dark:focus:border-indigo-400 transition-colors appearance-none" />
                </div>

                <div className="group relative rounded-2xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-200/60 transition-all hover:bg-white hover:shadow-md hover:ring-indigo-500/30 dark:bg-[#121b2f]/50 dark:ring-white/5 dark:hover:bg-[#162138]/80 dark:hover:ring-indigo-400/30 md:col-span-2 flex flex-col sm:flex-row gap-6 sm:items-center">
                  <div className="flex-1">
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                      <TrendingUp className="h-4 w-4 text-indigo-500" /> Lifecycle Status
                    </span>
                    <select value={couponForm.status} onChange={updateCouponField('status')} className="w-full bg-transparent border-b-2 border-slate-200 px-1 py-2 text-lg font-bold text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700/60 dark:text-white dark:focus:border-indigo-400 transition-colors appearance-none">
                      <option value="ACTIVE">Currently Active</option>
                      <option value="INACTIVE">Paused / Inactive</option>
                      <option value="EXPIRED">Force Expired</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="flex items-center gap-4 cursor-pointer">
                      <div className="relative">
                        <input type="checkbox" checked={Boolean(couponForm.firstInvestmentOnly)} onChange={(event) => setCouponForm((current) => ({ ...current, firstInvestmentOnly: event.target.checked }))} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">First Time Bonus Only</p>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">Restrict to new depositors.</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end border-t border-slate-100 dark:border-slate-800/60 pt-6">
                <button type="button" onClick={handleNewCoupon} className="px-6 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">
                  Reset Form
                </button>
                <button type="button" onClick={handleSaveCoupon} disabled={couponSaving} className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 disabled:shadow-none">
                  <Save className="h-5 w-5" />
                  {couponSaving ? 'Deploying...' : 'Deploy Campaign'}
                </button>
              </div>
            </SectionCard>

            <SectionCard title="Coupon Preview" subtitle="How this campaign looks synthetically.">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-1 shadow-xl shadow-orange-500/20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="bg-white dark:bg-slate-900 rounded-[22px] p-6 relative z-10 border-4 border-transparent h-full flex flex-col justify-center">
                  <div className="border-b-2 border-dashed border-slate-200 dark:border-slate-700 pb-5 mb-5 text-center">
                    <span className="inline-block bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-3">
                      {couponForm.firstInvestmentOnly ? 'Welcome Bonus' : 'Promo Code'}
                    </span>
                    <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-widest uppercase">{couponForm.code || 'CODE'}</h4>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-4xl font-black text-orange-500">
                      {couponForm.type === 'PERCENT_CASHBACK' ? `${couponForm.valueAmount}%` : formatCurrency(couponForm.valueAmount)}
                    </p>
                    <p className="text-lg font-bold text-slate-600 dark:text-slate-300">Cashback Reward</p>
                    {couponForm.minimumInvestmentAmount > 0 && (
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-500 pt-3">
                        On deposits over {formatCurrency(couponForm.minimumInvestmentAmount)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'referrals' && (
          <div className="max-w-4xl mx-auto">
            <SectionCard title="Multi-Level Affiliate Structure" subtitle="Define commission rates for the ML referral matrix. Changes apply to future transactions instantly.">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-4">
                    <div className="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 p-2.5 rounded-xl">
                      <Banknote className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-lg">Instant Payouts</h4>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Primary Commissions</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((level) => {
                      const key = `level${level}InstantRate`;
                      return (
                        <div key={key} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/60 dark:bg-[#121b2f]/50 dark:border-white/5">
                          <span className="font-bold text-slate-700 dark:text-slate-300">Level {level} Direct</span>
                          <div className="relative w-24">
                            <input type="number" min="0" value={referralSettings[key]} onChange={updateReferralField(key)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-right font-black text-slate-900 dark:text-white pr-8 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none" />
                            <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-4">
                    <div className="bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 p-2.5 rounded-xl">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-lg">Monthly Residuals</h4>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">Recurring Income</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50 border border-indigo-200/60 dark:bg-indigo-500/10 dark:border-indigo-500/20">
                      <span className="font-bold text-indigo-900 dark:text-indigo-200">Level 1 (Direct Referrer)</span>
                      <div className="relative w-24">
                        <input type="number" min="0" value={referralSettings.level1MonthlyRate} onChange={updateReferralField('level1MonthlyRate')} className="w-full bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-500/40 rounded-lg px-3 py-1.5 text-right font-black text-indigo-700 dark:text-indigo-300 pr-8 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none" />
                        <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-indigo-400" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/60 dark:bg-[#121b2f]/50 dark:border-white/5 opacity-60 grayscale cursor-not-allowed">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Level 2 - 5 Residuals</span>
                      <div className="text-right font-black text-slate-500 pr-2">0 %</div>
                    </div>
                    <p className="text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400 px-2">
                      Note: System architecture currently restricts recurring interest commissions strictly to direct level 1 uplines to maintain platform sustainability.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/60">
                <button type="button" onClick={handleSaveReferralSettings} disabled={referralSaving} className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 disabled:shadow-none text-lg">
                  <Save className="h-5 w-5" />
                  {referralSaving ? 'Saving Matrix...' : 'Publish Commission Matrix'}
                </button>
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'legal' && (
          <SectionCard title="Public Document Editor" subtitle="Manage compliance and terms text surfaced on user-facing portals.">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.4fr)_minmax(0,1fr)]">
              <div className="space-y-6">
                <div className="rounded-3xl bg-slate-50 p-6 ring-1 ring-inset ring-slate-200/60 dark:bg-[#121b2f]/50 dark:ring-white/5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Select Active Document</label>
                  <div className="relative">
                    <select value={selectedLegalKey} onChange={handleLegalDocumentSelect} className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-4 py-3 pr-10 font-bold text-slate-800 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white outline-none transition-all">
                      {legalDocumentOptions.map((option) => (
                        <option key={option.key} value={option.key}>{option.label}</option>
                      ))}
                    </select>
                    <FileText className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="group relative rounded-2xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-200/60 transition-all focus-within:ring-indigo-500/50 dark:bg-[#121b2f]/50 dark:ring-white/5">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Display Title</span>
                    <input value={legalForm.title} onChange={updateLegalField('title')} className="w-full bg-transparent font-bold text-slate-900 focus:outline-none dark:text-white text-lg" placeholder="e.g. Terms of Service" />
                  </div>

                  <div className="group relative rounded-2xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-200/60 transition-all focus-within:ring-indigo-500/50 dark:bg-[#121b2f]/50 dark:ring-white/5">
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Effective From Date</span>
                    <input type="date" value={legalForm.effectiveDate} onChange={updateLegalField('effectiveDate')} className="w-full bg-transparent font-bold text-slate-900 focus:outline-none dark:text-white" />
                  </div>
                </div>

                <div className="rounded-2xl border-l-4 border-indigo-500 bg-indigo-50/50 p-5 dark:bg-indigo-500/10">
                  <h4 className="font-bold text-indigo-900 dark:text-indigo-200 mb-2">Live Status</h4>
                  <div className="space-y-2 text-sm text-indigo-800/80 dark:text-indigo-300/80 font-medium">
                    <p className="flex justify-between border-b border-indigo-200/30 dark:border-indigo-500/20 pb-1"><span>Path:</span> <code>/api/legal/{selectedLegalKey}</code></p>
                    <p className="flex justify-between border-b border-indigo-200/30 dark:border-indigo-500/20 pb-1"><span>Editor:</span> <span>{legalForm.updatedBy || 'System Default'}</span></p>
                    <p className="flex justify-between"><span>Last Sync:</span> <span>{legalForm.updatedAt ? new Date(legalForm.updatedAt).toLocaleDateString() : 'N/A'}</span></p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 flex flex-col h-full">
                <div className="group relative rounded-2xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-200/60 transition-all focus-within:ring-indigo-500/50 dark:bg-[#121b2f]/50 dark:ring-white/5">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">Brief Summary (Meta)</span>
                  <textarea value={legalForm.summary} onChange={updateLegalField('summary')} placeholder="A short description for SEO and previews..." className="w-full bg-transparent font-medium text-slate-900 focus:outline-none dark:text-white resize-y min-h-[80px]" />
                </div>

                <div className="group relative rounded-2xl bg-slate-50 p-5 ring-1 ring-inset ring-slate-200/60 transition-all focus-within:ring-indigo-500/50 dark:bg-[#121b2f]/50 dark:ring-white/5 flex-grow flex flex-col">
                  <span className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    <span>Full Markdown Content</span>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-md dark:bg-indigo-500/20 dark:text-indigo-400">MD Supported</span>
                  </span>
                  <textarea value={legalForm.content} onChange={updateLegalField('content')} className="w-full flex-grow bg-transparent font-medium text-slate-900 focus:outline-none dark:text-slate-200 resize-none min-h-[400px] leading-relaxed" />
                </div>

                <div className="flex justify-end pt-2">
                  <button type="button" onClick={handleSaveLegalDocument} disabled={legalSaving} className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-lg transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 disabled:shadow-none text-lg">
                    <Save className="h-5 w-5" />
                    {legalSaving ? 'Syncing...' : 'Save & Publish Live'}
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );

}

export default SettingsPage;
