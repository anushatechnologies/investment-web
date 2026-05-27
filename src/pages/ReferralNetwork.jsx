import { ArrowDownToLine, Share2, TrendingUp, Users } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { getReferralCommissions, getReferralTree } from '../services/api';
import { getRuntimeUserProfile } from '../utils/runtimeUserProfile';
import { formatCurrency } from '../utils/formatters';

const icons = [Users, Share2, TrendingUp, ArrowDownToLine];
const tones = ['blue', 'emerald', 'violet', 'amber'];

function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function ReferralNetwork() {
  const userProfile = getRuntimeUserProfile();
  const [tree, setTree] = useState([]);
  const [commissions, setCommissions] = useState([]);

  useEffect(() => {
    let active = true;
    Promise.all([getReferralTree(), getReferralCommissions()])
      .then(([treeRes, commissionsRes]) => {
        if (!active) return;
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
    () => commissions.map((item, index) => ({ month: item.month || `M${index + 1}`, earnings: Number(item.amount ?? item.earnings ?? 0) })),
    [commissions],
  );

  const referralList = useMemo(
    () =>
      commissions.map((item, index) => ({
        id: item.id || `REF${index + 1}`,
        name: item.referralName || item.name || '-',
        city: item.city || '-',
        joinedOn: item.joinedOn || item.createdAt || '-',
        level: item.level || '-',
        invested: Number(item.invested ?? 0),
        earnings: Number(item.amount ?? item.earnings ?? 0),
        status: item.status || 'Active',
      })),
    [commissions],
  );

  const referralStats = [
    { title: 'Total Referrals', value: referralList.length, note: 'network size' },
    { title: 'Active Referrals', value: referralList.filter((item) => item.status === 'Active').length, note: 'currently active' },
    { title: 'Total Earnings', value: referralList.reduce((sum, item) => sum + item.earnings, 0), note: 'lifetime commissions' },
    { title: 'This Month', value: referralGrowthData.slice(-1)[0]?.earnings || 0, note: 'latest monthly earnings' },
  ];

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
    { key: 'level', label: 'Level' },
    { key: 'invested', label: 'Invested', render: (row) => formatCurrency(row.invested) },
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
          Your code: <span className="font-semibold text-blue-600">{userProfile.referralCode}</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {referralStats.map((stat, index) => (
          <StatCard key={stat.title} title={stat.title} value={stat.value} note={stat.note} icon={icons[index]} tone={tones[index]} valueType={index >= 2 ? 'currency' : 'number'} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <SectionCard title="Referral Tree" subtitle="Your network structure by level and contribution.">
          <div className="space-y-4">
            {tree.map((level, index) => (
              <div key={level.level || index} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center justify-between"><span className="rounded-full px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700">{level.level || `Level ${index + 1}`}</span><span className="text-sm text-slate-500">{level.members || level.count || 0} members</span></div>
                <p className="mt-4 font-heading text-2xl font-semibold text-slate-900">{formatCurrency(Number(level.income ?? level.commission ?? 0))}</p>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Referral Earnings Growth" subtitle="Monthly increase in referral earnings from your expanding network.">
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

      <DataTable title="Referral List" description="Complete referral list from API." data={referralList} columns={columns} searchableKeys={['id', 'name', 'city', 'level', 'status']} searchPlaceholder="Search by referral name, city, level, or status..." filterKey="status" filterOptions={['Active', 'Pending']} />
    </div>
  );
}

export default ReferralNetwork;
