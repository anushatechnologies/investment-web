import { Link } from 'react-router-dom';

function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-4xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Legal</p>
        <h1 className="mt-3 font-heading text-3xl font-bold text-slate-900">Privacy Policy</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          This policy explains how Anusha Trade collects, uses, stores, and protects your data.
          By using our platform, you consent to this policy.
        </p>

        <div className="mt-8 space-y-5 text-sm leading-7 text-slate-700">
          <section>
            <h2 className="font-semibold text-slate-900">1. Information We Collect</h2>
            <p>We may collect mobile number, full name, email, KYC details, bank details, and transaction-related activity.</p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-900">2. How We Use Information</h2>
            <p>Data is used for account creation, OTP verification, compliance checks, withdrawal processing, and customer support.</p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-900">3. Data Sharing</h2>
            <p>We do not sell personal data. Data may be shared with verification/compliance partners where legally required.</p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-900">4. Security</h2>
            <p>We apply reasonable security practices, token-based authentication, and access controls to protect user data.</p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-900">5. Your Consent</h2>
            <p>By registering, you consent to policy terms and communication for KYC, account actions, and transactional updates.</p>
          </section>
          <section>
            <h2 className="font-semibold text-slate-900">6. Policy Updates</h2>
            <p>We may revise this policy periodically. Continued platform usage after updates indicates acceptance.</p>
          </section>
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
