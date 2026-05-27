import { ArrowRight, BriefcaseBusiness, ShieldCheck, Share2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginWithEmail, verifyMpinLogin, saveAuthData } from '../services/api';
import { BRAND_LOGO_FALLBACK, BRAND_LOGO_PRIMARY } from '../constants/branding';
import { resolveInvestorRoute } from '../utils/onboardingRouter';

const highlights = [
  {
    title: 'Investor dashboard',
    copy: 'Track investments, wallet balance, monthly interest, receipts, and referral activity.',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Admin control center',
    copy: 'Manage investors, payments, withdrawals, fraud checks, reports, and platform settings.',
    icon: ShieldCheck,
  },
  {
    title: 'Referral and wallet flows',
    copy: 'Both user and admin roles can monitor referral activity and wallet-related operations.',
    icon: Share2,
  },
];

function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [mpin, setMpin] = useState('');
  const [credentialMode, setCredentialMode] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (credentialMode === 'mpin') {
        if (mpin.length < 4 || mpin.length > 6) {
          setError('MPIN must be 4-6 digits.');
          setLoading(false);
          return;
        }
        result = await verifyMpinLogin(identifier, mpin);
      } else {
        result = await loginWithEmail(identifier, password);
      }

      // Preserve all fields from result to capture phone and other data
      // Use the full result object for saveAuthData so that phone (mobileNumber/phoneNumber) is stored.
      // Then ensure email fallback if not provided.
      saveAuthData({
        ...result,
        email: result.email || (identifier.includes('@') ? identifier : ''),
        mobileNumber: result.mobileNumber || result.phoneNumber || (!identifier.includes('@') ? identifier : ''),
      });

      const role = (result.role?.toLowerCase() === 'admin' || result.role?.toLowerCase() === 'super_admin') ? 'admin' : 'user';
      onLogin(role);
      const investorRoute = resolveInvestorRoute(result);
      navigate(role === 'admin' ? '/admin' : investorRoute, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <div className="mx-auto grid w-full max-w-7xl overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)] lg:grid-cols-[1fr_460px]">
        <section className="relative overflow-hidden bg-[#07172d] px-8 py-10 text-white sm:px-10 lg:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.24),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.2),transparent_24%)]" />
          <div className="relative">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 overflow-hidden items-center justify-center rounded-full bg-white shadow-md">
                <img
                  src={BRAND_LOGO_PRIMARY}
                  alt="Anusha Trade"
                  className="h-full w-full object-contain p-0.5"
                  onError={(e) => { e.currentTarget.src = BRAND_LOGO_FALLBACK; }}
                />
              </div>
              <div>
                <p className="font-heading text-2xl font-semibold whitespace-nowrap">Anusha Trade</p>
              </div>
            </div>

            <div className="mt-12 max-w-2xl">
              <p className="inline-flex rounded-full bg-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white">
                User & Admin Access
              </p>
              <h1 className="mt-5 font-heading text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                One portal for investor dashboards and admin operations.
              </h1>
              <p className="mt-5 text-base leading-7 text-slate-300">
                Sign in with your mobile number or email to access your dashboard.
                New users can sign up with their mobile number via OTP verification.
              </p>
            </div>

            <div className="mt-10 grid gap-4">
              {highlights.map(({ title, copy, icon: Icon }) => (
                <div
                  key={title}
                  className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-100 ring-1 ring-white/10">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-heading text-lg font-semibold text-white">{title}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-300">{copy}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white px-8 py-10 sm:px-10">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-600">
              Welcome back
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-slate-900">
              Sign In
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Enter your credentials to access your account.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Mobile Number or Email</label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="input-shell"
                placeholder="Enter mobile number or email"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700">
                  {credentialMode === 'password' ? 'Password' : 'MPIN'}
                </label>
                <button
                  type="button"
                  onClick={() => { setCredentialMode((m) => m === 'password' ? 'mpin' : 'password'); setError(''); }}
                  className="text-xs font-medium text-blue-600 hover:text-blue-500"
                >
                  {credentialMode === 'password' ? 'Use MPIN instead' : 'Use Password instead'}
                </button>
              </div>
              {credentialMode === 'password' ? (
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="input-shell"
                  placeholder="Enter password"
                />
              ) : (
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={mpin}
                  onChange={(event) => setMpin(event.target.value.replace(/\D/g, ''))}
                  className="input-shell text-center text-xl tracking-[0.5em]"
                  placeholder="* * * *"
                />
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <Link to="/forgot-password" className="font-medium text-blue-600 hover:underline">
                Forgot Password?
              </Link>
              <Link to="/forgot-mpin" className="font-medium text-blue-600 hover:underline">
                Forgot MPIN?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center text-sm"><span className="bg-white px-4 text-slate-400">or</span></div>
            </div>

            <Link to="/signup" className="btn-secondary w-full text-center">
              <span>Sign up with Mobile OTP</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </form>
        </section>
      </div>
    </div>
  );
}

export default LoginPage;
