import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getKycStatus, saveOnboardingStatus } from '../services/api';

const DOC_FIELDS = [
  { label: 'PAN Card', statusKey: 'panCardStatus', reasonKey: 'panCardRejectionReason' },
  { label: 'Aadhaar Front', statusKey: 'aadhaarFrontStatus', reasonKey: 'aadhaarFrontRejectionReason' },
  { label: 'Aadhaar Back', statusKey: 'aadhaarBackStatus', reasonKey: 'aadhaarBackRejectionReason' },
  { label: 'Selfie Photo', statusKey: 'selfieStatus', reasonKey: 'selfieRejectionReason' },
  { label: 'Bank Proof', statusKey: 'bankProofStatus', reasonKey: 'bankProofRejectionReason' },
];

function badgeTone(status) {
  switch (String(status || '').toUpperCase()) {
    case 'APPROVED':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
    case 'REUPLOAD_REQUIRED':
    case 'REJECTED':
      return 'border-rose-500/30 bg-rose-500/10 text-rose-300';
    case 'PENDING':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
    default:
      return 'border-slate-700 bg-slate-900/70 text-slate-300';
  }
}

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
        saveOnboardingStatus(status);
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

  const submission = data?.submission || {};
  const kycStatus = data?.kycStatus || 'PENDING';
  const canUpload = data?.canUpload !== false;
  const approved = kycStatus === 'APPROVED';
  const reuploadDocs = useMemo(
    () => DOC_FIELDS.filter((doc) => ['REUPLOAD_REQUIRED', 'REJECTED'].includes(String(submission?.[doc.statusKey] || '').toUpperCase())),
    [submission],
  );
  const reupload = reuploadDocs.length > 0 || ['REUPLOAD_REQUIRED', 'REJECTED'].includes(String(kycStatus).toUpperCase());

  return (
    <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="section-title">KYC Status</h1>
      <p className="section-copy mt-2">This page auto-refreshes every 15 seconds.</p>
      {error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5">
        <p className="text-sm text-slate-500">Current Status</p>
        <p className="mt-1 text-xl font-semibold text-slate-900">{kycStatus}</p>
        {submission?.rejectionReason ? <p className="mt-2 text-sm text-rose-700">Reason: {submission.rejectionReason}</p> : null}
        {submission?.adminNotes ? <p className="mt-2 text-sm text-slate-600">Admin notes: {submission.adminNotes}</p> : null}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">Document Review Breakdown</p>
            <p className="mt-1 text-sm text-slate-500">Check which documents are approved, pending, or requested for reupload.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {DOC_FIELDS.map((doc) => (
            <div key={doc.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-medium text-slate-900">{doc.label}</p>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeTone(submission?.[doc.statusKey])}`}>
                  {submission?.[doc.statusKey] || 'NOT_UPLOADED'}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-500">
                {submission?.[doc.reasonKey] ? `Reason: ${submission[doc.reasonKey]}` : 'No document-specific issue reported.'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {approved ? <Link className="btn-primary" to="/bank/link">Continue to Bank Linking</Link> : null}
        {reupload && canUpload ? (
          <div className="space-y-3">
            {reuploadDocs.length > 0 ? (
              <p className="text-sm text-slate-600">
                Reupload required for: {reuploadDocs.map((doc) => doc.label).join(', ')}.
              </p>
            ) : null}
            <Link className="btn-primary" to="/kyc">Open KYC Reupload</Link>
          </div>
        ) : null}
        {approved && !canUpload ? (
          <p className="mt-3 text-sm text-slate-600">
            Your KYC is approved. If the admin later requests a document update, this page will show the reupload action again.
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default KycStatusPage;
