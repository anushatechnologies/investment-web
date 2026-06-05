import { ArrowRightLeft, CheckCircle2, Clock3, Network, PlayCircle, Search, TrendingUp, Users } from 'lucide-react';
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
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Investor</p>
            <p className="mt-2 font-semibold text-white">{result.investorName || result.investorUserId}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Investment</p>
            <p className="mt-2 font-semibold text-white">{formatCurrency(Number(result.investmentAmount || 0))}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Investor Monthly Interest</p>
            <p className="mt-2 font-semibold text-white">{formatCurrency(Number(result.investorMonthlyInterest || 0))}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Referral Total</p>
            <p className="mt-2 font-semibold text-gold-soft">
              {formatCurrency(Number(result.instantCashbackTotal || 0) + Number(result.monthlyIncomeTotal || 0))}
            </p>
          </div>
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
                <p className="text-xs text-slate-500">{row.sourceLabel}</p>
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
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">
          Referral operations
        </p>
        <h1 className="section-title mt-3">Referral Statistics</h1>
        <p className="section-copy mt-3 max-w-3xl">
          Monitor investor referral relationships, level-wise payouts, and commission activity.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <SectionCard title="Referral Confirmation Flow" subtitle="How admin settings are applied when an investment is activated and when interest is credited.">
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-semibold text-white">1. Signup Link</p>
            <p className="mt-2 text-xs leading-6 text-slate-400">Referral chain is created when a user signs up with a valid referral code. Maximum payable depth is five uplines.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-semibold text-white">2. Investment Activation</p>
            <p className="mt-2 text-xs leading-6 text-slate-400">Instant cashback is calculated from the investment amount using level-wise instant rates.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-semibold text-white">3. Monthly Interest</p>
            <p className="mt-2 text-xs leading-6 text-slate-400">Investor interest comes from the selected plan. Monthly referral income is calculated from that credited interest.</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Level Payout Rules" subtitle="Admin-configured instant cashback and monthly interest-share rates at each upline level.">
        <div className="grid gap-3 md:grid-cols-5">
          {levelRows.map((row) => (
            <div key={row.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm font-semibold text-white">{row.level}</p>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Instant</p>
                  <p className="mt-1 text-xl font-semibold text-gold-soft">{row.instantRate}</p>
                  <p className="mt-1 text-xs text-slate-300">{formatCurrency(row.instantCashbackAmount)}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Monthly</p>
                  <p className="mt-1 text-xl font-semibold text-emerald-300">{row.monthlyRate}</p>
                  <p className="mt-1 text-xs text-slate-300">{formatCurrency(row.monthlyIncomeAmount)}</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-400">{row.relationships} links</p>
              <p className="mt-1 text-xs text-slate-300">Total {formatCurrency(row.commissionAmount)}</p>
            </div>
          ))}
          {!loading && levelRows.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400 md:col-span-5">
              No level data found.
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Referral Payout Preview" subtitle="Check exact instant cashback, monthly direct-referrer income, and held rows before release.">
        <form onSubmit={runPreview} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <label className="block">
            <span className="text-sm font-semibold text-slate-300">Investment ID</span>
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
            <span className="text-sm font-semibold text-slate-300">Investor</span>
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
            <span className="text-sm font-semibold text-slate-300">Plan</span>
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
            <span className="text-sm font-semibold text-slate-300">Amount</span>
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
              <p className="text-xs text-slate-500">{row.sourceAmountLabel}</p>
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
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-60"
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
