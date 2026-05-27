import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveOnboardingStatus, setMpin } from '../services/api';

function SetupMpinPage() {
  const navigate = useNavigate();
  const [mpin, setMpinValue] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    if (mpin.length < 4 || mpin.length > 6) {
      setError('MPIN must be 4 to 6 digits.');
      return;
    }
    if (mpin !== confirmMpin) {
      setError('MPIN and confirm MPIN must match.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const response = await setMpin(mpin);
      saveOnboardingStatus(response);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to set MPIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="section-title">Set MPIN</h1>
      {error && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
        <input className="input-shell text-center text-xl tracking-[0.3em]" placeholder="Enter MPIN" value={mpin} maxLength={6} onChange={(e) => setMpinValue(e.target.value.replace(/\D/g, ''))} required />
        <input className="input-shell text-center text-xl tracking-[0.3em]" placeholder="Confirm MPIN" value={confirmMpin} maxLength={6} onChange={(e) => setConfirmMpin(e.target.value.replace(/\D/g, ''))} required />
        <button className="btn-primary w-full" disabled={loading} type="submit">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create MPIN'}
        </button>
      </form>
    </div>
  );
}

export default SetupMpinPage;

