import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminCreatePlan } from '../../services/api';
import { formatINR } from '../../utils/formatters';

const WIZARD_STEPS = [
  '1. Basic Info',
  '2. Investment Rules',
  '3. Return Rules',
  '4. Payment Config',
  '5. Eligibility',
  '6. Documents',
  '7. Review',
  '8. Submit',
];

export default function CreatePlanWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    planName: '',
    planCode: '',
    category: 'FIXED_INCOME',
    shortDescription: '',
    description: '',
    riskLevel: 'LOW',
    termsVersion: 'v1.0',
    investmentType: 'ONE_TIME',
    minimumAmount: 5000,
    maximumAmount: 1000000,
    lockInMonths: 12,
    autoRenewal: false,
    investmentFrequency: 'MONTHLY',
    allowPartialInvestment: false,
    returnType: 'FIXED',
    calculationMethod: 'SIMPLE_INTEREST',
    monthlyInterestRate: 1.5,
    calculationFrequency: 'MONTHLY',
    payoutFrequency: 'MONTHLY',
    paymentMethods: ['UPI', 'NET_BANKING', 'RAZORPAY'],
    paymentTimeoutMinutes: 15,
    paymentVerification: 'AUTOMATIC',
    minAge: 18,
    maxAge: 70,
    kycRequired: true,
    panRequired: true,
    bankVerificationRequired: true,
    maxInvestmentsPerUser: 5,
    documents: [
      { name: 'Terms & Conditions.pdf', version: 'v1.0', status: 'ACTIVE' },
      { name: 'Risk Disclosure.pdf', version: 'v1.0', status: 'ACTIVE' },
    ],
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep === 0 && (!formData.planName || !formData.description)) {
      setError('Please fill in Plan Name and Description.');
      return;
    }
    if (currentStep === 1 && Number(formData.maximumAmount) <= Number(formData.minimumAmount)) {
      setError('Maximum Investment Amount must be greater than Minimum Amount.');
      return;
    }
    setError('');
    setCurrentStep((prev) => Math.min(prev + 1, WIZARD_STEPS.length - 1));
  };

  const handleBack = () => {
    setError('');
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (submitForApproval = false) => {
    setSubmitting(true);
    setError('');
    try {
      await adminCreatePlan({
        planName: formData.planName,
        description: formData.description,
        minimumAmount: Number(formData.minimumAmount),
        maximumAmount: Number(formData.maximumAmount),
        lockInMonths: Number(formData.lockInMonths),
        monthlyInterestRate: Number(formData.monthlyInterestRate),
        planCode: formData.planCode || `PLAN-${Date.now().toString().slice(-4)}`,
        category: formData.category,
        returnType: formData.returnType,
        payoutFrequency: formData.payoutFrequency,
      });
      setSuccess(submitForApproval ? 'Plan created & submitted for Super Admin approval!' : 'Plan draft saved successfully!');
      setTimeout(() => {
        navigate('/admin/plans');
      }, 1200);
    } catch (err) {
      setError(err?.message || 'Failed to save investment plan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Wizard Header Progress Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Create Investment Plan Wizard
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure product parameters, return formulas, eligibility criteria, and maker-checker approval options.
        </p>

        {/* Stepper Navigation */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {WIZARD_STEPS.map((step, idx) => (
            <button
              key={step}
              type="button"
              onClick={() => setCurrentStep(idx)}
              className={`px-2.5 py-2 text-xs font-semibold rounded-lg border text-center transition ${
                currentStep === idx
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : idx < currentStep
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {step}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          ✅ {success}
        </div>
      )}

      {/* Step Contents */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
        {currentStep === 0 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b pb-2">
              Step 1 — Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Plan Name *
                </label>
                <input
                  type="text"
                  value={formData.planName}
                  onChange={(e) => handleChange('planName', e.target.value)}
                  placeholder="e.g. Anusha Guaranteed High Return 12M"
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Plan Code (Unique)
                </label>
                <input
                  type="text"
                  value={formData.planCode}
                  onChange={(e) => handleChange('planCode', e.target.value)}
                  placeholder="e.g. PLAN-HR12M"
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="FIXED_INCOME">Fixed Income</option>
                  <option value="GROWTH">Growth</option>
                  <option value="BALANCED">Balanced</option>
                  <option value="HIGH_YIELD">High Yield</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Risk Level
                </label>
                <select
                  value={formData.riskLevel}
                  onChange={(e) => handleChange('riskLevel', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="LOW">Low Risk</option>
                  <option value="MODERATE">Moderate Risk</option>
                  <option value="HIGH">High Risk</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Detailed Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                placeholder="Comprehensive explanation of plan terms and target returns..."
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b pb-2">
              Step 2 — Investment Rules
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Minimum Investment (INR)
                </label>
                <input
                  type="number"
                  value={formData.minimumAmount}
                  onChange={(e) => handleChange('minimumAmount', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                <span className="text-xs text-slate-500">{formatINR(formData.minimumAmount)}</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Maximum Investment (INR)
                </label>
                <input
                  type="number"
                  value={formData.maximumAmount}
                  onChange={(e) => handleChange('maximumAmount', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                <span className="text-xs text-slate-500">{formatINR(formData.maximumAmount)}</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lock-in Period (Months)
                </label>
                <input
                  type="number"
                  value={formData.lockInMonths}
                  onChange={(e) => handleChange('lockInMonths', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b pb-2">
              Step 3 — Return & Payout Rules
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Monthly Interest Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.monthlyInterestRate}
                  onChange={(e) => handleChange('monthlyInterestRate', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
                <span className="text-xs text-emerald-600 font-semibold">
                  Annualized Rate: {(Number(formData.monthlyInterestRate) * 12).toFixed(1)}% p.a.
                </span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Return Type
                </label>
                <select
                  value={formData.returnType}
                  onChange={(e) => handleChange('returnType', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="FIXED">Fixed Interest</option>
                  <option value="VARIABLE">Variable Performance</option>
                  <option value="PROFIT_SHARING">Profit Sharing</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payout Frequency
                </label>
                <select
                  value={formData.payoutFrequency}
                  onChange={(e) => handleChange('payoutFrequency', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="MONTHLY">Monthly Credit</option>
                  <option value="QUARTERLY">Quarterly Credit</option>
                  <option value="MATURITY">At Maturity</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b pb-2">
              Step 4 — Payment Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Verification Mode
                </label>
                <select
                  value={formData.paymentVerification}
                  onChange={(e) => handleChange('paymentVerification', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                >
                  <option value="AUTOMATIC">Automatic Webhook + Manual Receipt Option</option>
                  <option value="MANUAL_ONLY">Manual Receipt Verification Only</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Timeout (Minutes)
                </label>
                <input
                  type="number"
                  value={formData.paymentTimeoutMinutes}
                  onChange={(e) => handleChange('paymentTimeoutMinutes', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2.5 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b pb-2">
              Step 5 — Investor Eligibility
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center space-x-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={formData.kycRequired}
                  onChange={(e) => handleChange('kycRequired', e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>KYC Verification Required</span>
              </label>
              <label className="flex items-center space-x-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={formData.panRequired}
                  onChange={(e) => handleChange('panRequired', e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>PAN Card Verified Required</span>
              </label>
              <label className="flex items-center space-x-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={formData.bankVerificationRequired}
                  onChange={(e) => handleChange('bankVerificationRequired', e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Bank Account Verified Required</span>
              </label>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b pb-2">
              Step 6 — Product Documents
            </h3>
            <ul className="space-y-2">
              {formData.documents.map((doc, idx) => (
                <li key={idx} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{doc.name}</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-semibold">{doc.version}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b pb-2">
              Step 7 — Read-Only Plan Review
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong className="text-slate-500">Plan Name:</strong> {formData.planName || 'N/A'}</div>
              <div><strong className="text-slate-500">Code:</strong> {formData.planCode || 'N/A'}</div>
              <div><strong className="text-slate-500">Min Investment:</strong> {formatINR(formData.minimumAmount)}</div>
              <div><strong className="text-slate-500">Max Investment:</strong> {formatINR(formData.maximumAmount)}</div>
              <div><strong className="text-slate-500">Lock-in:</strong> {formData.lockInMonths} Months</div>
              <div><strong className="text-slate-500">Monthly Interest:</strong> {formData.monthlyInterestRate}%</div>
            </div>
          </div>
        )}

        {currentStep === 7 && (
          <div className="space-y-4 text-center py-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Step 8 — Submit Investment Plan
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Select whether to save this plan as a <strong>DRAFT</strong> or submit it for <strong>SUPER ADMIN APPROVAL</strong> (Maker-Checker Workflow).
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit(false)}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Save as Draft
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSubmit(true)}
                className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                {submitting ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex justify-between border-t pt-4">
          <button
            type="button"
            disabled={currentStep === 0}
            onClick={handleBack}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
          >
            Back
          </button>
          {currentStep < WIZARD_STEPS.length - 1 && (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Next Step
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
