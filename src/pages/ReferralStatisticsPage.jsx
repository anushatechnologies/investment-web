import { ArrowRightLeft, Network, TrendingUp, Users } from 'lucide-react';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';

const stats = [
  { title: 'Referral Users', value: 0, note: 'live data pending', icon: Users, tone: 'blue', valueType: 'number' },
  { title: 'Active Links', value: 0, note: 'tracked relationships', icon: Network, tone: 'emerald', valueType: 'number' },
  { title: 'Commissions', value: 0, note: 'total referral payout', icon: TrendingUp, tone: 'violet', valueType: 'currency' },
  { title: 'Pending Reviews', value: 0, note: 'requires admin action', icon: ArrowRightLeft, tone: 'amber', valueType: 'number' },
];

function ReferralStatisticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">
          Referral operations
        </p>
        <h1 className="section-title mt-3">Referral Statistics</h1>
        <p className="section-copy mt-3 max-w-3xl">
          Monitor investor referral relationships, contribution, and commission activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <SectionCard
        title="Referral Activity"
        subtitle="Referral analytics will appear here when backend reporting is connected."
      >
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
          No referral activity found.
        </div>
      </SectionCard>
    </div>
  );
}

export default ReferralStatisticsPage;
