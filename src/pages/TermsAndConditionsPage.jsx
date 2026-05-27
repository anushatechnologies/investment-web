import { Link } from 'react-router-dom';

const termsRows = [
  { feature: 'Minimum Investment', details: 'Rs10,000' },
  { feature: 'Maximum Investment', details: 'Rs10,00,000' },
  { feature: 'Lock-in Period', details: '6 Months' },
  { feature: 'Monthly Interest', details: '10%' },
  { feature: 'Interest Credit', details: 'Wallet' },
  { feature: 'Wallet Withdrawal Minimum', details: 'Rs1,000' },
  { feature: 'Withdrawal Approval', details: 'Admin Approval' },
  { feature: 'Investment Completion Return', details: '90%' },
  { feature: 'Early Withdrawal Return', details: '70%' },
];

function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-4xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">Legal</p>
        <h1 className="mt-3 font-heading text-3xl font-bold text-slate-900">Terms and Conditions</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          By creating an account or using Anusha Trade services, you agree to these terms.
          Please review the investment rules and operational policies below.
        </p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full border-collapse text-left">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-sm font-semibold text-slate-700">Feature</th>
                <th className="px-4 py-3 text-sm font-semibold text-slate-700">Details</th>
              </tr>
            </thead>
            <tbody>
              {termsRows.map((row) => (
                <tr key={row.feature} className="border-t border-slate-200">
                  <td className="px-4 py-3 text-sm text-slate-700">{row.feature}</td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{row.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="mt-8 space-y-2 text-sm leading-7 text-slate-600">
          <li>All returns and payout timelines are subject to verification and platform policy updates.</li>
          <li>Any fraud, policy abuse, or invalid KYC/payment information may result in account suspension.</li>
          <li>By continuing, you acknowledge that these terms may be revised from time to time.</li>
        </ul>

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
