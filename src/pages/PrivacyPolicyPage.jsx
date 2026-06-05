import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getLegalDocument } from '../services/api';

const fallbackPrivacyPolicy = {
  title: 'Privacy Policy',
  summary: 'This policy explains how Anusha Trade collects, uses, stores, and protects your data. By using our platform, you consent to this policy.',
  content: `1. Information We Collect
We may collect mobile number, full name, email, KYC details, bank details, and transaction-related activity.

2. How We Use Information
Data is used for account creation, OTP verification, compliance checks, withdrawal processing, and customer support.

3. Data Sharing
We do not sell personal data. Data may be shared with verification/compliance partners where legally required.

4. Security
We apply reasonable security practices, token-based authentication, and access controls to protect user data.

5. Your Consent
By registering, you consent to policy terms and communication for KYC, account actions, and transactional updates.

6. Policy Updates
We may revise this policy periodically. Continued platform usage after updates indicates acceptance.`,
  effectiveDate: '',
};

function PrivacyPolicyPage() {
  const [document, setDocument] = useState(fallbackPrivacyPolicy);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getLegalDocument('privacy-policy')
      .then((response) => {
        if (!active) return;
        setDocument({
          ...fallbackPrivacyPolicy,
          ...response,
          title: response?.title || fallbackPrivacyPolicy.title,
          summary: response?.summary || fallbackPrivacyPolicy.summary,
          content: response?.content || fallbackPrivacyPolicy.content,
        });
      })
      .catch(() => {
        if (active) setDocument(fallbackPrivacyPolicy);
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
          {loading ? 'Loading policy...' : document.content}
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

export default PrivacyPolicyPage;
