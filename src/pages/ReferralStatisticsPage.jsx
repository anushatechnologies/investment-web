import { AlertTriangle, ArrowRightLeft, CheckCircle2, Clock3, Network, PlayCircle, Search, TrendingUp, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import {
  adminGetAllPlans,
  adminGetReferralCommissions,
  adminGetReferralPreview,
  adminGetReferralReport,
  adminGetUsers,
  adminReleaseReferralCommission,
  adminSimulateReferralPayout,
} from '../services/api';
import { formatCurrency } from '../utils/formatters';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function ReferralStatisticsPage() {
  const [report, setReport] = useState({});
  const [commissionReview, setCommissionReview] = useState([]);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewInvestmentId, setPreviewInvestmentId] = useState('');
  const [previewResult, setPreviewResult] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [simulatorForm, setSimulatorForm] = useState({ investorUserId: '', investmentPlanId: '', investmentAmount: '50000' });
  const [simulatorResult, setSimulatorResult] = useState(null);
  const [simulatorLoading, setSimulatorLoading] = useState(false);
  const [releasingId, setReleasingId] = useState('');

  const loadReferralData = async (isActive = () => true) => {
    return Promise.all([
      adminGetReferralReport(),
      adminGetReferralCommissions().catch(() => ({ commissions: [] })),
      adminGetUsers().catch(() => []),
      adminGetAllPlans().catch(() => []),
    ])
      .then(([data, commissionData, usersData, plansData]) => {
        if (!isActive()) return;
        setReport(data || {});
        setCommissionReview(asArray(commissionData?.commissions));
        const loadedUsers = asArray(usersData?.users || usersData);
        const loadedPlans = asArray(plansData?.plans || plansData);
        setUsers(loadedUsers);
        setPlans(loadedPlans);
        setSimulatorForm((current) => ({
          ...current,
          investorUserId: current.investorUserId || loadedUsers[0]?.id || '',
          investmentPlanId: current.investmentPlanId || loadedPlans[0]?.id || '',
        }));
        setError('');
      })
      .catch((err) => {
        if (!isActive()) return;
        setError(err?.message || 'Unable to load referral report.');
      })
      .finally(() => {
        if (isActive()) setLoading(false);
      });
  };

  useEffect(() => {
    let active = true;
    loadReferralData(() => active);
    return () => {
      active = false;
    };
  }, []);

  const runPreview = async (event) => {
    event.preventDefault();
    if (!previewInvestmentId.trim()) return;
    setPreviewLoading(true);
    setError('');
    try {
      setPreviewResult(await adminGetReferralPreview(previewInvestmentId.trim()));
    } catch (err) {
      setError(err?.message || 'Unable to preview referral payout.');
      setPreviewResult(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const runSimulator = async (event) => {
    event.preventDefault();
    setSimulatorLoading(true);
    setError('');
    try {
      setSimulatorResult(await adminSimulateReferralPayout({
        investorUserId: simulatorForm.investorUserId,
        investmentPlanId: simulatorForm.investmentPlanId || null,
        investmentAmount: Number(simulatorForm.investmentAmount || 0),
      }));
    } catch (err) {
      setError(err?.message || 'Unable to simulate referral payout.');
      setSimulatorResult(null);
    } finally {
      setSimulatorLoading(false);
    }
  };

  const releaseCommission = async (commissionId) => {
    setReleasingId(commissionId);
    setError('');
    try {
      await adminReleaseReferralCommission(commissionId);
      await loadReferralData();
    } catch (err) {
      setError(err?.message || 'Unable to release referral commission.');
    } finally {
      setReleasingId('');
    }
  };

  const stats = [
    { title: 'Referral Users', value: report.totalReferralUsers || 0, note: 'joined through a code', icon: Users, tone: 'blue', valueType: 'number' },
    { title: 'Active Links', value: report.activeLinks || 0, note: 'tracked relationships', icon: Network, tone: 'emerald', valueType: 'number' },
    { title: 'Instant Cashback', value: Number(report.instantCashbackPaid || 0), note: 'paid on activation', icon: CheckCircle2, tone: 'cyan', valueType: 'currency' },
    { title: 'Monthly Income', value: Number(report.monthlyReferralIncomePaid || 0), note: 'paid from interest', icon: Clock3, tone: 'violet', valueType: 'currency' },
    { title: 'Commissions', value: Number(report.totalCommissions || 0), note: 'total referral payout', icon: TrendingUp, tone: 'amber', valueType: 'currency' },
    { title: 'Skipped', value: report.skippedCommissions || 0, note: 'inactive beneficiaries', icon: ArrowRightLeft, tone: 'amber', valueType: 'number' },
  ];

  const levelRows = useMemo(
    () =>
      asArray(report.levelSummary).map((item) => ({
        id: `level-${item.level}`,
        level: `Level ${item.level}`,
        instantRate: `${item.instantRate ?? item.rate ?? 0}%`,
        monthlyRate: `${item.monthlyRate ?? 0}%`,
        relationships: item.relationships || 0,
        commissionAmount: Number(item.commissionAmount || 0),
        instantCashbackAmount: Number(item.instantCashbackAmount || 0),
        monthlyIncomeAmount: Number(item.monthlyIncomeAmount || 0),
      })),
    [report.levelSummary],
  );

  const topReferrers = useMemo(
    () =>
      asArray(report.topReferrers).map((item, index) => ({
        id: item.userId || `referrer-${index}`,
        name: item.name || '-',
        email: item.email || '-',
        referralCode: item.referralCode || '-',
        referralCount: item.referralCount || 0,
        commissionAmount: Number(item.commissionAmount || 0),
        accountStatus: item.accountStatus || '-',
      })),
    [report.topReferrers],
  );

  const relationshipRows = useMemo(
    () =>
      asArray(report.recentRelationships).map((item, index) => ({
        id: item.id || `relationship-${index}`,
        referrerName: item.referrerName || '-',
        referrerCode: item.referrerCode || '-',
        referredName: item.referredName || '-',
        referredEmail: item.referredEmail || '-',
        level: `Level ${item.level || '-'}`,
        active: item.active ? 'Active' : 'Inactive',
        linkedAt: item.linkedAt ? new Date(item.linkedAt).toLocaleString() : '-',
      })),
    [report.recentRelationships],
  );

  const commissionRows = useMemo(
    () =>
      commissionReview.map((item, index) => ({
        id: item.id || `commission-${index}`,
        beneficiaryName: item.beneficiaryName || '-',
        sourceInvestorName: item.sourceInvestorName || '-',
        type: item.typeLabel || item.commissionType || '-',
        commissionType: item.commissionType || '-',
        month: item.month || '-',
        level: `Level ${item.level || '-'}`,
        rate: `${item.rate || 0}%`,
        sourceAmountLabel: item.sourceAmountLabel || 'Source Amount',
        sourceAmount: Number(item.sourceAmount ?? item.sourceInterestAmount ?? 0),
        commissionAmount: Number(item.commissionAmount || 0),
        status: item.status || '-',
        skipReason: item.skipReason || '-',
        creditedAt: item.creditedAt ? new Date(item.creditedAt).toLocaleString() : '-',
      })),
    [commissionReview],
  );

  const renderPayoutPreview = (result) => {
    if (!result) return null;
    const rows = [
      ...asArray(result.instantCashbackRows).map((row, index) => ({ id: `instant-${index}`, ...row })),
      ...asArray(result.monthlyIncomeRows).map((row, index) => ({ id: `monthly-${index}`, ...row })),
    ];
    return (
      <div className="mt-5 space-y-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Investor', value: result.investorName || result.investorUserId, color: 'blue' },
            { label: 'Investment', value: formatCurrency(Number(result.investmentAmount || 0)), color: 'slate' },
            { label: 'Monthly Interest', value: formatCurrency(Number(result.investorMonthlyInterest || 0)), color: 'emerald' },
            { label: 'Referral Total', value: formatCurrency(Number(result.instantCashbackTotal || 0) + Number(result.monthlyIncomeTotal || 0)), color: 'amber' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-2xl border p-4 ${
              color === 'amber'   ? 'border-amber-500/20 bg-amber-500/[0.05] dark:bg-amber-500/[0.07]' :
              color === 'emerald' ? 'border-emerald-500/20 bg-emerald-500/[0.05] dark:bg-emerald-500/[0.07]' :
              color === 'blue'    ? 'border-blue-500/20 bg-blue-500/[0.05] dark:bg-blue-500/[0.07]' :
                                    'border-slate-200/60 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.03]'
            }`}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>
              <p className={`mt-2 text-sm font-bold ${
                color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                'text-slate-800 dark:text-slate-100'
              }`}>{value}</p>
            </div>
          ))}
        </div>

        <DataTable
          title="Preview Payout Rows"
          description={result.monthlyRule || 'Monthly referral income applies only to Level 1.'}
          data={rows}
          columns={[
            { key: 'beneficiaryName', label: 'Beneficiary' },
            { key: 'level', label: 'Level', render: (row) => `Level ${row.level || '-'}` },
            { key: 'type', label: 'Type' },
            { key: 'sourceAmount', label: 'Source Amount', render: (row) => (
              <div>
                <p className="font-semibold">{formatCurrency(Number(row.sourceAmount || 0))}</p>
                <p className="text-xs text-slate-500 dark:text-slate-300">{row.sourceLabel}</p>
              </div>
            ) },
            { key: 'rate', label: 'Rate', render: (row) => `${row.rate || 0}%` },
            { key: 'payoutAmount', label: 'Payout', render: (row) => formatCurrency(Number(row.payoutAmount || 0)) },
            { key: 'payable', label: 'Status', render: (row) => <StatusBadge label={row.payable ? 'Payable' : 'Hold'} /> },
            { key: 'holdReason', label: 'Hold Reason', render: (row) => row.holdReason || '-' },
          ]}
          searchableKeys={['beneficiaryName', 'type', 'holdReason']}
          emptyMessage="No upline payout rows found."
        />
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-amber-500/[0.08] dark:via-[#071226] dark:to-orange-500/[0.04] p-6 shadow-lg shadow-amber-500/5">
        <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl -translate-y-6 translate-x-6" />
        <div className="absolute bottom-0 left-0 h-24 w-24 rounded-full bg-orange-400/10 blur-xl translate-y-4 -translate-x-4" />
        <p className="relative text-xs font-bold uppercase tracking-[0.28em] text-amber-600 dark:text-amber-400">
          Referral operations
        </p>
        <h1 className="relative section-title mt-2">Referral Statistics</h1>
        <p className="relative section-copy mt-2 max-w-3xl">
          Monitor investor referral relationships, level-wise payouts, and commission activity.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/[0.08] px-5 py-4 shadow-lg shadow-rose-500/5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-rose-500/20 mt-0.5">
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-sm font-semibold text-rose-700 dark:text-rose-300 mt-1">{error}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#071226] shadow-sm">
        <div className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] px-5 py-4">
          <h2 className="text-base font-bold text-slate-800 dark:text-white">Referral Confirmation Flow</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">How admin settings are applied when an investment is activated and when interest is credited.</p>
        </div>
        <div className="grid gap-0 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-white/[0.06]">
          {[
            { step: '01', title: 'Signup Link', color: 'blue', icon: '🔗', desc: 'Referral chain is created when a user signs up with a valid referral code. Maximum payable depth is five uplines.' },
            { step: '02', title: 'Investment Activation', color: 'amber', icon: '⚡', desc: 'Instant cashback is calculated from the investment amount using level-wise instant rates.' },
            { step: '03', title: 'Monthly Interest', color: 'emerald', icon: '📈', desc: 'Investor interest comes from the selected plan. Monthly referral income is calculated from that credited interest.' },
          ].map(({ step, title, color, icon, desc }) => (
            <div key={step} className={`relative overflow-hidden p-6 ${
              color === 'blue'    ? 'bg-blue-50/80 dark:bg-blue-500/[0.05]' :
              color === 'amber'   ? 'bg-amber-50/80 dark:bg-amber-500/[0.05]' :
                                    'bg-emerald-50/80 dark:bg-emerald-500/[0.05]'
            }`}>
              <span className={`text-7xl font-black opacity-[0.07] absolute -bottom-2 -right-1 leading-none select-none ${
                color === 'blue' ? 'text-blue-600' : color === 'amber' ? 'text-amber-600' : 'text-emerald-600'
              }`}>{step}</span>
              <div className="flex items-center gap-3 mb-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg font-bold border ${
                  color === 'blue'    ? 'bg-blue-100 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/30' :
                  color === 'amber'   ? 'bg-amber-100 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30' :
                                        'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30'
                }`}>{icon}</span>
                <p className={`text-[10px] font-black uppercase tracking-widest ${
                  color === 'blue' ? 'text-blue-600 dark:text-blue-400' : color === 'amber' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}>Step {step}</p>
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-white mb-2">{title}</p>
              <p className="text-xs leading-6 text-slate-500 dark:text-slate-400">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#071226] shadow-sm">
        <div className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02] px-5 py-4">
          <h2 className="text-base font-bold text-slate-800 dark:text-white">Level Payout Rules</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Admin-configured instant cashback and monthly interest-share rates at each upline level.</p>
        </div>
        <div className="grid gap-0 divide-y md:divide-y-0 md:grid-cols-5 md:divide-x divide-slate-200 dark:divide-white/[0.06]">
          {levelRows.map((row, idx) => (
            <div key={row.id} className="group relative flex flex-col p-5 hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors duration-200">
              {/* Gradient top strip */}
              <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${
                idx === 0 ? 'from-blue-400 to-indigo-500' :
                idx === 1 ? 'from-indigo-400 to-purple-500' :
                idx === 2 ? 'from-purple-400 to-amber-500' :
                idx === 3 ? 'from-amber-400 to-orange-500' :
                            'from-orange-400 to-rose-500'
              }`} />
              <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">{row.level}</p>
              <p className="mt-2 text-2xl font-black text-slate-800 dark:text-white">{row.relationships}<span className="text-xs font-medium text-slate-400 ml-1">links</span></p>
              <div className="mt-4 space-y-3 flex-1">
                <div className="rounded-xl bg-amber-50 dark:bg-amber-500/[0.08] border border-amber-200 dark:border-amber-500/20 p-2.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500">Instant</p>
                  <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{row.instantRate}</p>
                  <p className="text-[10px] text-amber-500/70 dark:text-amber-500/50 mt-0.5">{formatCurrency(row.instantCashbackAmount)}</p>
                </div>
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/[0.08] border border-emerald-200 dark:border-emerald-500/20 p-2.5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500">Monthly</p>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{row.monthlyRate}</p>
                  <p className="text-[10px] text-emerald-500/70 dark:text-emerald-500/50 mt-0.5">{formatCurrency(row.monthlyIncomeAmount)}</p>
                </div>
              </div>
              <p className="mt-3 pt-3 border-t border-slate-200 dark:border-white/[0.06] text-[10px] font-bold text-slate-500 dark:text-slate-400">Total {formatCurrency(row.commissionAmount)}</p>
            </div>
          ))}
          {!loading && levelRows.length === 0 && (
            <div className="p-8 text-sm text-slate-400 dark:text-slate-500 md:col-span-5 text-center">No level data found.</div>
          )}
        </div>
      </div>

      <SectionCard title="Referral Payout Preview" subtitle="Check exact instant cashback, monthly direct-referrer income, and held rows before release.">
        <form onSubmit={runPreview} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Investment ID</span>
            <input
              className="input-shell mt-2"
              value={previewInvestmentId}
              onChange={(event) => setPreviewInvestmentId(event.target.value)}
              placeholder="Paste investment id"
            />
          </label>
          <button type="submit" disabled={previewLoading || !previewInvestmentId.trim()} className="btn-primary self-end disabled:opacity-60">
            <Search className="h-4 w-4" />
            <span>{previewLoading ? 'Checking...' : 'Preview'}</span>
          </button>
        </form>
        {renderPayoutPreview(previewResult)}
      </SectionCard>

      <SectionCard title="Admin Referral Simulator" subtitle="Model A -> B -> C payout before activating an investment.">
        <form onSubmit={runSimulator} className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_220px_auto]">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Investor</span>
            <select
              className="input-shell mt-2"
              value={simulatorForm.investorUserId}
              onChange={(event) => setSimulatorForm((current) => ({ ...current, investorUserId: event.target.value }))}
              required
            >
              <option value="">Select investor</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.fullName || user.name || user.email || user.id}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Plan</span>
            <select
              className="input-shell mt-2"
              value={simulatorForm.investmentPlanId}
              onChange={(event) => setSimulatorForm((current) => ({ ...current, investmentPlanId: event.target.value }))}
            >
              <option value="">No plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>{plan.planName} - {plan.monthlyInterestRate}% monthly</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Amount</span>
            <input
              type="number"
              min="1"
              className="input-shell mt-2"
              value={simulatorForm.investmentAmount}
              onChange={(event) => setSimulatorForm((current) => ({ ...current, investmentAmount: event.target.value }))}
              required
            />
          </label>
          <button type="submit" disabled={simulatorLoading || !simulatorForm.investorUserId} className="btn-primary self-end disabled:opacity-60">
            <PlayCircle className="h-4 w-4" />
            <span>{simulatorLoading ? 'Running...' : 'Simulate'}</span>
          </button>
        </form>
        {renderPayoutPreview(simulatorResult)}
      </SectionCard>

      <DataTable
        title="Top Referrers"
        description="Users with the largest active referral network."
        data={topReferrers}
        columns={[
          { key: 'name', label: 'Referrer' },
          { key: 'referralCode', label: 'Code' },
          { key: 'referralCount', label: 'Links' },
          { key: 'commissionAmount', label: 'Commission', render: (row) => formatCurrency(row.commissionAmount) },
          { key: 'accountStatus', label: 'Status', render: (row) => <StatusBadge label={row.accountStatus} /> },
        ]}
        searchableKeys={['name', 'email', 'referralCode', 'accountStatus']}
        searchPlaceholder="Search referrer, email, code, or status..."
        filterKey="accountStatus"
        filterOptions={['ACTIVE', 'PENDING', 'SUSPENDED', 'DEACTIVATED']}
        emptyMessage={loading ? 'Loading referral report...' : 'No referrers found.'}
      />

      <DataTable
        title="Recent Referral Links"
        description="Latest referral relationships created by signup activity."
        data={relationshipRows}
        columns={[
          { key: 'referrerName', label: 'Referrer' },
          { key: 'referrerCode', label: 'Code' },
          { key: 'referredName', label: 'Referred User' },
          { key: 'level', label: 'Level' },
          { key: 'active', label: 'Status', render: (row) => <StatusBadge label={row.active} /> },
          { key: 'linkedAt', label: 'Linked At' },
        ]}
        searchableKeys={['referrerName', 'referrerCode', 'referredName', 'referredEmail', 'level', 'active']}
        searchPlaceholder="Search referral relationship..."
        filterKey="active"
        filterOptions={['Active', 'Inactive']}
        emptyMessage={loading ? 'Loading referral links...' : 'No referral links found.'}
      />

      <DataTable
        title="Commission Review"
        description="Credited and skipped referral commission records for admin review."
        data={commissionRows}
        columns={[
          { key: 'beneficiaryName', label: 'Beneficiary' },
          { key: 'sourceInvestorName', label: 'Source Investor' },
          { key: 'type', label: 'Type' },
          { key: 'month', label: 'Due / Event' },
          { key: 'level', label: 'Level' },
          { key: 'rate', label: 'Rate' },
          { key: 'sourceAmount', label: 'Source Amount', render: (row) => (
            <div>
              <p className="font-semibold">{formatCurrency(row.sourceAmount)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-300">{row.sourceAmountLabel}</p>
            </div>
          ) },
          { key: 'commissionAmount', label: 'Commission', render: (row) => formatCurrency(row.commissionAmount) },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge label={row.status} /> },
          { key: 'creditedAt', label: 'Credited At' },
          { key: 'release', label: 'Release', render: (row) => (
            String(row.status || '').toUpperCase() === 'SKIPPED' ? (
              <button
                type="button"
                onClick={() => releaseCommission(row.id)}
                disabled={releasingId === row.id}
                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-200 disabled:opacity-50"
              >
                {releasingId === row.id ? 'Releasing...' : 'Release'}
              </button>
            ) : '-'
          ) },
        ]}
        searchableKeys={['beneficiaryName', 'sourceInvestorName', 'type', 'month', 'level', 'status', 'skipReason']}
        searchPlaceholder="Search commissions..."
        filterKey="type"
        filterOptions={['Instant Cashback', 'Monthly Interest Share']}
        enableCsvExport
        exportFileName="referral-commission-confirmation"
        emptyMessage={loading ? 'Loading commissions...' : 'No referral commission records found.'}
      />
    </div>
  );
}

export default ReferralStatisticsPage;
