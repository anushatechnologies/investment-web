import { CheckCircle2, Clock3, TrendingUp, Users } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { getInvestorDashboard, getReferralCommissions, getReferralTree } from '../services/api';
import { getRuntimeUserProfile } from '../utils/runtimeUserProfile';
import { formatCurrency } from '../utils/formatters';

const icons = [Users, CheckCircle2, Clock3, TrendingUp];
const tones = ['blue', 'cyan', 'violet', 'amber'];

function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.levels)) return payload.levels;
  if (Array.isArray(payload?.commissions)) return payload.commissions;
  return [];
}

function referralTypeLabel(item) {
  const value = String(item.commissionType || item.transactionType || item.type || '').toUpperCase();
  if (value.includes('INSTANT')) return 'Instant Cashback';
  if (value.includes('MONTHLY')) return 'Monthly Income';
  return 'Referral Income';
}

function referralSourceLabel(item) {
  return referralTypeLabel(item) === 'Instant Cashback' ? 'Investment Amount' : 'Interest Amount';
}

function ReferralNetwork() {
  const userProfile = getRuntimeUserProfile();
  const [tree, setTree] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [referralCode, setReferralCode] = useState(userProfile.referralCode || '');

  useEffect(() => {
    let active = true;
    Promise.all([getInvestorDashboard(), getReferralTree(), getReferralCommissions()])
      .then(([dashboardRes, treeRes, commissionsRes]) => {
        if (!active) return;
        const dashboard = dashboardRes?.data || dashboardRes || {};
        const dashboardProfile = dashboard?.profile || {};
        setReferralCode(dashboardProfile.referralCode || userProfile.referralCode || '');
        setTree(toArray(treeRes));
        setCommissions(toArray(commissionsRes));
      })
      .catch(() => {
        if (!active) return;
        setTree([]);
        setCommissions([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const referralGrowthData = useMemo(
    () => commissions
      .filter((item) => referralTypeLabel(item) === 'Monthly Income')
      .map((item, index) => ({ month: item.month || item.commissionMonth || `M${index + 1}`, earnings: Number(item.commissionAmount ?? item.amount ?? item.earnings ?? 0) })),
    [commissions],
  );

  const instantCashback = useMemo(
    () => commissions
      .filter((item) => referralTypeLabel(item) === 'Instant Cashback')
      .reduce((sum, item) => sum + Number(item.commissionAmount ?? item.amount ?? 0), 0),
    [commissions],
  );

  const monthlyIncome = useMemo(
    () => commissions
      .filter((item) => referralTypeLabel(item) === 'Monthly Income')
      .reduce((sum, item) => sum + Number(item.commissionAmount ?? item.amount ?? 0), 0),
    [commissions],
  );

  const referralList = useMemo(
    () =>
      commissions.map((item, index) => ({
        id: item.id || `REF${index + 1}`,
        name: item.referralName || item.name || item.sourceInvestorId || '-',
        city: item.city || '-',
        joinedOn: item.joinedOn || item.creditedAt || item.createdAt || '-',
        type: referralTypeLabel(item),
        level: item.level || item.referralLevel || '-',
        sourceLabel: referralSourceLabel(item),
        sourceAmount: Number(item.invested ?? item.sourceInterestAmount ?? 0),
        earnings: Number(item.commissionAmount ?? item.amount ?? item.earnings ?? 0),
        status: item.status || 'Active',
      })),
    [commissions],
  );

  const referralStats = [
    { title: 'Total Referrals', value: tree.reduce((sum, item) => sum + Number(item.members || item.count || 0), 0), note: 'network size' },
    { title: 'Instant Cashback', value: instantCashback, note: 'from investment activation' },
    { title: 'Monthly Income', value: monthlyIncome, note: 'direct referrer only' },
    { title: 'Total Earnings', value: instantCashback + monthlyIncome, note: 'lifetime referral income' },
  ];

  const activeReferralCode = referralCode || userProfile.referralCode || '';
  const inviteLink = `${window.location.origin}/signup?ref=${encodeURIComponent(activeReferralCode)}`;
  const copyInvite = () => {
    navigator.clipboard?.writeText(inviteLink);
  };
  const shareInvite = () => {
    if (navigator.share) {
      navigator.share({ title: 'Join Anusha Trade', text: 'Use my referral code to join Anusha Trade.', url: inviteLink });
    } else {
      copyInvite();
    }
  };

  const columns = [
    { key: 'id', label: 'Referral ID' },
    {
      key: 'name',
      label: 'Referral Name',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-900">{row.name}</p>
          <p className="text-xs text-slate-500">{row.city}</p>
        </div>
      ),
    },
    { key: 'joinedOn', label: 'Joined On' },
    { key: 'type', label: 'Income Type' },
    { key: 'level', label: 'Level' },
    { key: 'sourceAmount', label: 'Source Amount', render: (row) => (
      <div>
        <p className="font-semibold">{formatCurrency(row.sourceAmount)}</p>
        <p className="text-xs text-slate-500">{row.sourceLabel}</p>
      </div>
    ) },
    { key: 'earnings', label: 'Your Earnings', render: (row) => formatCurrency(row.earnings) },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge label={row.status} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="section-title">Referral Network</h2>
        </div>
        <div className="glass-card px-5 py-4 text-sm text-slate-600">
          <p>Your code: <span className="font-semibold text-blue-600">{activeReferralCode || '-'}</span></p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={copyInvite} className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">Copy Link</button>
            <a href={`https://wa.me/?text=${encodeURIComponent(`Join Anusha Trade using my referral link: ${inviteLink}`)}`} target="_blank" rel="noreferrer" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">WhatsApp</a>
            <button type="button" onClick={shareInvite} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">Share</button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {referralStats.map((stat, index) => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} note={stat.note} icon={icons[index]} tone={tones[index]} valueType={index >= 1 ? 'currency' : 'number'} />
        ))}
      </div>

      <SectionCard title="Referral Income Rule" subtitle="Instant cashback can come from up to five uplines. Monthly referral income is only for the direct referrer.">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Investment Activated</p>
            <p className="mt-2 text-xs leading-6 text-slate-500">Instant cashback is calculated from the investor's principal amount.</p>
          </div>
          <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Interest Credited</p>
            <p className="mt-2 text-xs leading-6 text-slate-500">Monthly income is calculated from the credited interest amount.</p>
          </div>
          <div className="rounded-[18px] border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Direct Referrer</p>
            <p className="mt-2 text-xs leading-6 text-slate-500">Only Level 1 receives monthly referral income.</p>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <SectionCard title="Referral Tree" subtitle="Your network structure by level and contribution.">
          <div className="space-y-4">
            {tree.map((level, index) => (
              <div key={level.level || index} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between"><span className="rounded-full px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700">{level.level || `Level ${index + 1}`}</span><span className="text-sm text-slate-500">{level.members || level.count || 0} members</span></div>
                <p className="mt-4 font-heading text-2xl font-semibold text-slate-900">{formatCurrency(Number(level.income ?? level.commission ?? 0))}</p>
                {Array.isArray(level.users) && level.users.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {level.users.slice(0, 3).map((user) => (
                      <div key={user.userId} className="rounded-xl bg-white px-3 py-2 text-sm text-slate-600">
                        <span className="font-semibold text-slate-800">{user.fullName || 'Investor'}</span>
                        <span className="ml-2 text-xs text-slate-400">{user.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Monthly Referral Income" subtitle="Monthly income credited from direct referral interest only.">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={referralGrowthData}>
                <CartesianGrid stroke="rgba(226,232,240,1)" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => [formatCurrency(value), 'Earnings']} />
                <Line type="monotone" dataKey="earnings" stroke="#2563eb" strokeWidth={3} dot={{ fill: '#2563eb', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <DataTable title="Referral Income List" description="Instant cashback and monthly referral income records." data={referralList} columns={columns} searchableKeys={['id', 'name', 'city', 'type', 'level', 'status']} searchPlaceholder="Search by referral name, city, type, level, or status..." filterKey="type" filterOptions={['Instant Cashback', 'Monthly Income', 'Referral Income']} />
    </div>
  );
}

export default ReferralNetwork;
