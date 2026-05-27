import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { linkBank, saveOnboardingStatus } from '../services/api';

function BankLinkPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    accountHolderName: '',
    bankAccountNumber: '',
    confirmBankAccountNumber: '',
    bankIfscCode: '',
    bankName: '',
  });

  const onSubmit = async (event) => {
    event.preventDefault();
    if (form.bankAccountNumber !== form.confirmBankAccountNumber) {
      setError('Bank account number and confirm bank account number must match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await linkBank(form);
      saveOnboardingStatus({ bankVerified: true });
      navigate('/account/activate', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to link bank account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="section-title">Link Bank Account</h1>
      {error && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
        <input className="input-shell" placeholder="Account Holder Name" value={form.accountHolderName} onChange={(e) => setForm((p) => ({ ...p, accountHolderName: e.target.value }))} required />
        <input className="input-shell" placeholder="Bank Account Number" value={form.bankAccountNumber} onChange={(e) => setForm((p) => ({ ...p, bankAccountNumber: e.target.value.replace(/\D/g, '') }))} required />
        <input className="input-shell" placeholder="Confirm Bank Account Number" value={form.confirmBankAccountNumber} onChange={(e) => setForm((p) => ({ ...p, confirmBankAccountNumber: e.target.value.replace(/\D/g, '') }))} required />
        <input className="input-shell" placeholder="IFSC Code" value={form.bankIfscCode} onChange={(e) => setForm((p) => ({ ...p, bankIfscCode: e.target.value.toUpperCase() }))} required />
        <input className="input-shell" placeholder="Bank Name" value={form.bankName} onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))} required />
        <button className="btn-primary w-full" type="submit" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Link Bank Account'}
        </button>
      </form>
    </div>
  );
}

export default BankLinkPage;

