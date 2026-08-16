import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin, adminVerify2fa, saveAuthData } from '../services/api';
import { Shield, KeyRound, Lock, UserCheck, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function AdminLoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@anushabazaar.com');
  const [password, setPassword] = useState('Admin@123');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await adminLogin({ email, password, twoFactorCode: twoFactorCode.trim() });
      if (res.requires2FA) {
        setRequires2FA(true);
        setTempToken(res.tempToken || '');
        setSuccessMsg(res.message || '2FA code required. Enter code 123456');
      } else if (res.accessToken || res.token) {
        saveAuthData(res);
        if (onLogin) onLogin('admin');
        setSuccessMsg('Admin authentication successful! Redirecting...');
        setTimeout(() => {
          navigate('/admin');
        }, 500);
      }
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Admin authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await adminVerify2fa({ tempToken, code: twoFactorCode.trim() });
      if (res.accessToken || res.token) {
        saveAuthData(res);
        if (onLogin) onLogin('admin');
        setSuccessMsg('2FA verified successfully! Redirecting...');
        setTimeout(() => {
          navigate('/admin');
        }, 500);
      }
    } catch (err) {
      setError(err?.data?.message || err?.message || 'Invalid 2FA code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-2">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Anusha Trade Admin Portal</h1>
          <p className="text-sm text-slate-400">Phase 1: Secure Admin Authentication & RBAC System</p>
        </div>

        {/* Status Banners */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-emerald-400 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {!requires2FA ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Admin Email / Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 pl-10 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                  placeholder="admin@anushabazaar.com"
                />
                <UserCheck className="w-5 h-5 text-slate-500 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 pl-10 text-slate-100 focus:outline-none focus:border-indigo-500 text-sm"
                  placeholder="••••••••••••"
                />
                <Lock className="w-5 h-5 text-slate-500 absolute left-3 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Admin Portal'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify2FA} className="space-y-4">
            <div className="text-center p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
              <KeyRound className="w-6 h-6 text-indigo-400 mx-auto mb-1" />
              <p className="text-xs text-indigo-300">Enter the 6-digit 2FA verification code sent to your account (Demo OTP: 123456)</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                2FA OTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-center text-xl font-mono tracking-widest text-indigo-400 focus:outline-none focus:border-indigo-500"
                placeholder="123456"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? 'Verifying 2FA...' : 'Verify & Continue'}
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-500">
          Supported Admin Roles: SUPER_ADMIN, ADMIN, FINANCE, KYC_MANAGER, OPERATIONS, SUPPORT, AUDITOR
        </div>
      </div>
    </div>
  );
}
