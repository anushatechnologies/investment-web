import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getKycStatus, saveOnboardingStatus } from '../services/api';

function KycStatusPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const status = await getKycStatus();
        if (!active) return;
        setData(status);
        saveOnboardingStatus({ kycStatus: status.kycStatus });
      } catch (err) {
        if (active) setError(err.message || 'Unable to fetch KYC status.');
      }
    };
    run();
    const id = setInterval(run, 15000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const kycStatus = data?.kycStatus || 'PENDING';
  const reupload = kycStatus === 'REUPLOAD_REQUIRED' || kycStatus === 'REJECTED';
  const approved = kycStatus === 'APPROVED';

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="section-title">KYC Status</h1>
      <p className="section-copy mt-2">This page auto-refreshes every 15 seconds.</p>
      {error && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5">
        <p className="text-sm text-slate-500">Current Status</p>
        <p className="mt-1 text-xl font-semibold text-slate-900">{kycStatus}</p>
      </div>
      <div className="mt-6">
        {approved && <Link className="btn-primary" to="/bank/link">Continue to Bank Linking</Link>}
        {reupload && <Link className="btn-primary" to="/kyc">Re-upload KYC Documents</Link>}
      </div>
    </div>
  );
}

export default KycStatusPage;

