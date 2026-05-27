import { ArrowRightLeft, Banknote, Percent, Users } from 'lucide-react';
import { useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { referralGrowthData, referralStats, topReferrers } from '../data/adminData';
import { formatCurrency, formatNumber } from '../utils/formatters';

const statIcons = [Users, ArrowRightLeft, Banknote, Percent];
const statTones = ['blue', 'emerald', 'violet', 'cyan'];

function ReferralStatisticsPage() {
  const [period, setPeriod] = useState('This Month');
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">
          Referral network performance
        </p>
        <h1 className="section-title mt-3">Referral Statistics</h1>
        <p className="section-copy mt-3 max-w-3xl">
          Measure the strength of direct referrals, successful conversions, and the payout impact
          of the commission engine.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {referralStats.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            note={stat.note}
            icon={statIcons[index]}
            tone={statTones[index]}
            valueType={index >= 2 ? 'currency' : 'number'}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <SectionCard
          title="Top Referrers"
          subtitle="Leaderboard based on successful referrals and commission earnings."
        >
          <div className="table-wrap">
            <div className="table-scroll">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/[0.03]">
                  <tr>
                    <th className="table-header-cell">#</th>
                    <th className="table-header-cell">Referrer Name</th>
                    <th className="table-header-cell">Total Referrals</th>
                    <th className="table-header-cell">Earnings</th>
                    <th className="table-header-cell">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {topReferrers.map((row) => (
                    <tr key={row.rank} className="hover:bg-white/[0.03]">
                      <td className="table-cell">{row.rank}</td>
                      <td className="table-cell font-medium text-white">{row.name}</td>
                      <td className="table-cell">{formatNumber(row.totalReferrals)}</td>
                      <td className="table-cell">{formatCurrency(row.earnings)}</td>
                      <td className="table-cell">
                        <StatusBadge label={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-gold/20 bg-gold/10 p-4 text-sm text-gold-soft">
            Direct referral commission is set to 5%, while passive monthly referral income remains
            configured at 1%.
          </div>
        </SectionCard>

        <SectionCard
          title="Referral Growth"
          subtitle="Daily referral build-up and conversion momentum for the current month."
          action={
            <button
              type="button"
              onClick={() => setPeriod((current) => (current === 'This Month' ? 'Last Month' : 'This Month'))}
              className="btn-secondary"
            >
              {period}
            </button>
          }
        >
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={referralGrowthData}>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value) => [formatNumber(value), 'Referrals']}
                  contentStyle={{
                    background: 'rgba(7, 17, 38, 0.95)',
                    border: '1px solid rgba(148, 163, 184, 0.18)',
                    borderRadius: '18px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="referrals"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#3b82f6' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

export default ReferralStatisticsPage;
