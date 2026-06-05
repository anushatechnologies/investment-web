import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getLegalDocument } from '../services/api';

const fallbackTerms = {
  title: 'Terms and Conditions',
  summary: 'By creating an account or using Anusha Trade services, you agree to these terms. Please review the investment rules and operational policies below.',
  content: `1. Account Eligibility
You must provide accurate registration, KYC, bank, and payment details. Anusha Trade may reject, suspend, or restrict accounts with invalid or suspicious information.

2. Investment Rules
Investment limits, lock-in periods, monthly interest, coupon benefits, and maturity values are controlled by active platform settings and may be updated by the admin panel.

3. KYC and Bank Verification
KYC approval and verified bank details may be required before investment, wallet withdrawal, account activation, MPIN setup, or other account actions.

4. Withdrawals
Wallet withdrawals are subject to minimum and maximum limits, daily and monthly rules, available balance, bank verification, fraud checks, and admin approval.

5. Referral and Coupon Benefits
Referral commissions and coupon cashback are calculated using current platform rules and may be withheld, reversed, or rejected if misuse or policy abuse is detected.

6. Platform Changes
Anusha Trade may update operational rules, policies, fees, limits, supported payment methods, and account workflows. Continued usage indicates acceptance of updated terms.`,
  effectiveDate: '',
};

function TermsAndConditionsPage() {
  const [document, setDocument] = useState(fallbackTerms);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getLegalDocument('terms-and-conditions')
      .then((response) => {
        if (!active) return;
        setDocument({
          ...fallbackTerms,
          ...response,
          title: response?.title || fallbackTerms.title,
          summary: response?.summary || fallbackTerms.summary,
          content: response?.content || fallbackTerms.content,
        });
      })
      .catch(() => {
        if (active) setDocument(fallbackTerms);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-4xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Legal</p>
        <h1 className="mt-3 font-heading text-3xl font-bold text-slate-900">{document.title}</h1>
        {document.effectiveDate && (
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Effective {String(document.effectiveDate).slice(0, 10)}
          </p>
        )}
        <p className="mt-3 text-sm leading-7 text-slate-600">{document.summary}</p>

        <div className="mt-8 whitespace-pre-line text-sm leading-7 text-slate-700">
          {loading ? 'Loading terms...' : document.content}
        </div>

        <div className="mt-8">
          <Link to="/signup" className="font-semibold text-blue-600 hover:underline">
            Back to Signup
          </Link>
        </div>
      </div>
    </div>
  );
}

export default TermsAndConditionsPage;
