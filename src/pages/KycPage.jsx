import { Loader2, UploadCloud } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveOnboardingStatus, submitKyc } from '../services/api';

function KycPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    panNumber: '',
    aadhaarLast4: '',
    dateOfBirth: '',
    address: '',
    panCardImage: null,
    aadhaarFrontImage: null,
    aadhaarBackImage: null,
    selfiePhoto: null,
    bankPassbookOrStatement: null,
  });

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await submitKyc(form);
      saveOnboardingStatus({ kycStatus: 'PENDING' });
      navigate('/kyc/status', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to submit KYC.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="section-title">KYC Submission</h1>
      <p className="section-copy mt-2">Upload your required KYC documents for admin approval.</p>
      {error && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
        <input className="input-shell" placeholder="PAN Number" value={form.panNumber} onChange={(e) => update('panNumber', e.target.value.toUpperCase())} required />
        <input className="input-shell" placeholder="Aadhaar Last 4" maxLength={4} value={form.aadhaarLast4} onChange={(e) => update('aadhaarLast4', e.target.value.replace(/\D/g, ''))} required />
        <input className="input-shell" type="date" value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} required />
        <input className="input-shell" placeholder="Address" value={form.address} onChange={(e) => update('address', e.target.value)} required />
        <label className="text-sm text-slate-600">PAN Card Image<input className="input-shell mt-1" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => update('panCardImage', e.target.files?.[0] || null)} required /></label>
        <label className="text-sm text-slate-600">Aadhaar Front Image<input className="input-shell mt-1" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => update('aadhaarFrontImage', e.target.files?.[0] || null)} required /></label>
        <label className="text-sm text-slate-600">Aadhaar Back Image<input className="input-shell mt-1" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => update('aadhaarBackImage', e.target.files?.[0] || null)} required /></label>
        <label className="text-sm text-slate-600">Selfie Photo<input className="input-shell mt-1" type="file" accept=".jpg,.jpeg,.png" onChange={(e) => update('selfiePhoto', e.target.files?.[0] || null)} required /></label>
        <label className="text-sm text-slate-600">Bank Passbook / Statement<input className="input-shell mt-1" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => update('bankPassbookOrStatement', e.target.files?.[0] || null)} required /></label>
        <button type="submit" disabled={loading} className="btn-primary mt-2 w-full disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UploadCloud className="h-4 w-4" />Submit KYC</>}
        </button>
      </form>
    </div>
  );
}

export default KycPage;

