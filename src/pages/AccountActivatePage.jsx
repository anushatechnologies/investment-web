import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { activateAccount, saveOnboardingStatus } from '../services/api';

function AccountActivatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onActivate = async () => {
    setLoading(true);
    setError('');
    try {
      await activateAccount();
      saveOnboardingStatus({ accountStatus: 'ACTIVE' });
      navigate('/setup-mpin', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to activate account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="section-title">Activate Account</h1>
      <p className="section-copy mt-2">Once activated, you can create your MPIN and open dashboard access.</p>
      {error && <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      <button className="btn-primary mt-6" onClick={onActivate} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Activate Account'}
      </button>
    </div>
  );
}

export default AccountActivatePage;

