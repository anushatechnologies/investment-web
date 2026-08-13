import { 
  CheckCircle2, 
  Clock3, 
  TrendingUp, 
  Users,
  Gift,
  Link,
  Check,
  Copy,
  Share2,
  Smartphone,
  Zap,
  Target,
  Wallet,
  Search,
  Filter,
  ArrowDownToLine
} from 'lucide-react';
import { TradingChart } from '../components/TradingChart';
import { useEffect, useMemo, useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import { getInvestorDashboard, getReferralCommissions, getReferralTree } from '../services/api';
import { getRuntimeUserProfile } from '../utils/runtimeUserProfile';
import { formatCurrency } from '../utils/formatters';

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

// Custom Vibrant Stat Card
const CustomStatCard = ({ title, value, note, icon: Icon, colorClass, textColorClass, bgOpacityClass }) => (
  <div className="relative p-6 rounded-[2rem] bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 overflow-hidden group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
    <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full opacity-20 group-hover:scale-[2] transition-transform duration-700 blur-2xl ${colorClass}`} />
    
    <div className="flex items-start justify-between mb-6 relative z-10">
      <div className={`p-4 rounded-2xl ${bgOpacityClass} ${textColorClass} shadow-inner`}>
        <Icon className="w-7 h-7" />
      </div>
      <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${bgOpacityClass} ${textColorClass}`}>
        Live
      </div>
    </div>
    
    <div className="space-y-1.5 relative z-10">
      <h3 className="text-slate-500 dark:text-slate-300 font-bold text-xs uppercase tracking-wider">{title}</h3>
      <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-300 flex items-center gap-1">
        <TrendingUp className="w-3 h-3" /> {note}
      </p>
    </div>
  </div>
);

function ReferralNetwork() {
  const userProfile = getRuntimeUserProfile();
  const [tree, setTree] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [referralCode, setReferralCode] = useState(userProfile.referralCode || '');
  const [copied, setCopied] = useState(false);

  // Ledger state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

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
    () => {
      const filtered = commissions.filter((item) => referralTypeLabel(item) === 'Monthly Income');
      return filtered.map((item, index) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (filtered.length - 1 - index));
        return {
          time: date.toISOString().split('T')[0],
          value: Number(item.commissionAmount ?? item.amount ?? item.earnings ?? 0)
        };
      });
    },
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

  const totalReferrals = tree.reduce((sum, item) => sum + Number(item.members || item.count || 0), 0);
  const totalEarnings = instantCashback + monthlyIncome;

  const activeReferralCode = referralCode || userProfile.referralCode || '';
  const inviteLink = `${window.location.origin}/signup?ref=${encodeURIComponent(activeReferralCode)}`;
  
  const copyInvite = () => {
    navigator.clipboard?.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const shareInvite = () => {
    if (navigator.share) {
      navigator.share({ title: 'Join Anusha Trade', text: 'Use my referral code to join Anusha Trade.', url: inviteLink });
    } else {
      copyInvite();
    }
  };

  const filterOptions = ['All', 'Instant Cashback', 'Monthly Income'];
  
  const filteredLedger = useMemo(() => {
    return referralList.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'All' || item.type === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [referralList, searchQuery, activeFilter]);

  return (
    <div className="space-y-8 font-sans pb-12 transition-colors duration-500">
      
      {/* Premium Hero Invite Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 border border-slate-800 p-8 sm:p-12 shadow-2xl group">
        <div className="absolute top-[-30%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/30 to-purple-600/30 rounded-full blur-[100px] mix-blend-screen pointer-events-none transition-transform duration-1000 group-hover:scale-110" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-gradient-to-tr from-blue-500/20 to-cyan-400/20 rounded-full blur-[80px] mix-blend-screen pointer-events-none transition-transform duration-1000 group-hover:scale-110" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md">
              <Gift className="h-5 w-5 text-amber-400" />
              <span className="text-xs font-black uppercase tracking-widest text-white">Invite & Earn Rewards</span>
            </div>
            
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              Grow your wealth <br/> by growing <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">your network.</span>
            </h2>
            
            <p className="text-slate-500 dark:text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
              Earn huge instant cashbacks when your referrals activate their investments, and build a passive income stream with monthly interest shares from your direct referrers.
            </p>
          </div>

          {/* Invite Link Action Box */}
          <div className="w-full lg:w-auto min-w-[340px] bg-white/10 backdrop-blur-2xl border border-white/20 p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-300 ml-1">Your Unique Invite Link</p>
              
              <div className="flex items-center bg-slate-900/50 border border-white/10 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
                <div className="pl-3 pr-2">
                  <Link className="h-5 w-5 text-indigo-400" />
                </div>
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="w-full bg-transparent text-sm font-bold text-white outline-none truncate pr-2"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={copyInvite}
                  className={`flex-1 py-4 rounded-xl text-sm font-black text-white transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 shadow-lg ${ copied ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-indigo-500 hover:bg-indigo-400 shadow-indigo-500/20' }`}
                >
                  {copied ? <><Check className="h-5 w-5" /> Copied!</> : <><Copy className="h-5 w-5" /> Copy Link</>}
                </button>
                
                <a 
                  href={`https://wa.me/?text=${encodeURIComponent(`Join Anusha Trade using my referral link: ${inviteLink}`)}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-14 flex items-center justify-center rounded-xl bg-[#25D366] text-white hover:bg-[#20bd5a] transition-colors shadow-lg shadow-[#25D366]/20 active:scale-95"
                  title="Share on WhatsApp"
                >
                  <Smartphone className="h-5 w-5" />
                </a>
                
                <button 
                  type="button" 
                  onClick={shareInvite} 
                  className="w-14 flex items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-colors active:scale-95"
                  title="More Options"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vibrant Stats Bento Grid */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <CustomStatCard 
          title="Total Referrals" 
          value={totalReferrals} 
          note="Network Size" 
          icon={Users} 
          colorClass="bg-blue-500" 
          textColorClass="text-blue-600 dark:text-blue-400"
          bgOpacityClass="bg-blue-100 dark:bg-blue-500/20"
        />
        <CustomStatCard 
          title="Instant Cashback" 
          value={formatCurrency(instantCashback)} 
          note="From Activations" 
          icon={Zap} 
          colorClass="bg-amber-500" 
          textColorClass="text-amber-600 dark:text-amber-400"
          bgOpacityClass="bg-amber-100 dark:bg-amber-500/20"
        />
        <CustomStatCard 
          title="Monthly Income" 
          value={formatCurrency(monthlyIncome)} 
          note="Direct Referrers" 
          icon={TrendingUp} 
          colorClass="bg-purple-500" 
          textColorClass="text-purple-600 dark:text-purple-400"
          bgOpacityClass="bg-purple-100 dark:bg-purple-500/20"
        />
        <CustomStatCard 
          title="Total Earnings" 
          value={formatCurrency(totalEarnings)} 
          note="Lifetime Revenue" 
          icon={Wallet} 
          colorClass="bg-emerald-500" 
          textColorClass="text-emerald-600 dark:text-emerald-400"
          bgOpacityClass="bg-emerald-100 dark:bg-emerald-500/20"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        
        {/* Left Column */}
        <div className="space-y-8">
          
          {/* Rules Section */}
          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-[2rem] p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-rose-100 dark:bg-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Referral Rules</h3>
                <p className="text-sm text-slate-500 dark:text-slate-300">How your commissions are calculated</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 relative overflow-hidden group hover:border-blue-200 dark:hover:border-blue-500/30 transition-colors">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full group-hover:scale-150 transition-transform" />
                <h4 className="font-bold text-slate-900 dark:text-white mb-2 relative z-10">Investment Activated</h4>
                <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed relative z-10">Instant cashback is calculated directly from the investor's principal amount.</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 relative overflow-hidden group hover:border-amber-200 dark:hover:border-amber-500/30 transition-colors">
                <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full group-hover:scale-150 transition-transform" />
                <h4 className="font-bold text-slate-900 dark:text-white mb-2 relative z-10">Interest Credited</h4>
                <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed relative z-10">Monthly income is a percentage share of the credited interest amount.</p>
              </div>
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 relative overflow-hidden group hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-colors">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full group-hover:scale-150 transition-transform" />
                <h4 className="font-bold text-slate-900 dark:text-white mb-2 relative z-10">Direct Referrer</h4>
                <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed relative z-10">Only Level 1 direct referrers receive the monthly recurring referral income.</p>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-[2rem] p-8 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Growth Trajectory</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-300">Monthly recurring income over time</p>
                </div>
              </div>
            </div>
            <div className="h-[300px]">
              <TradingChart data={referralGrowthData} type="area" />
            </div>
          </div>

        </div>

        {/* Right Column - Tree */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 shadow-xl h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-100 dark:bg-purple-500/20 rounded-xl text-purple-600 dark:text-purple-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Network Tree</h3>
                <p className="text-sm text-slate-500 dark:text-slate-300">Structure by level</p>
              </div>
            </div>

            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {tree.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-white/5">
                  <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-300">No referrals yet</p>
                  <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">Share your link to start earning!</p>
                </div>
              ) : (
                tree.map((level, index) => (
                  <div key={level.level || index} className="rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50 p-5 hover:border-purple-300 dark:hover:border-purple-500/30 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <span className="rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400">
                        {level.level || `Level ${index + 1}`}
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 shadow-sm">
                        {level.members || level.count || 0} Members
                      </span>
                    </div>
                    
                    <p className="font-black text-2xl text-slate-900 dark:text-white mb-4 tracking-tight">
                      {formatCurrency(Number(level.income ?? level.commission ?? 0))}
                    </p>
                    
                    {Array.isArray(level.users) && level.users.length > 0 && (
                      <div className="space-y-2">
                        {level.users.slice(0, 3).map((user) => (
                          <div key={user.userId} className="rounded-xl bg-white dark:bg-slate-800 px-3 py-2.5 flex items-center justify-between border border-slate-200 dark:border-white/5 shadow-sm">
                            <span className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{user.fullName || 'Investor'}</span>
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-300 truncate ml-2 max-w-[100px]">{user.email}</span>
                          </div>
                        ))}
                        {level.users.length > 3 && (
                          <div className="text-center pt-2">
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer">+{level.users.length - 3} more</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Ultra-Premium Custom Earnings Ledger */}
      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 rounded-[2rem] p-6 sm:p-10 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-bl-full pointer-events-none" />
        
        {/* Ledger Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 relative z-10">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Earnings Ledger</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-300">Detailed record of your instant cashbacks and monthly recurring income.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-300" />
              <input 
                type="text" 
                placeholder="Search name, ID..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              />
            </div>
            
            <div className="flex bg-slate-50 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-white/10 overflow-x-auto">
              {filterOptions.map(option => (
                <button
                  key={option}
                  onClick={() => setActiveFilter(option)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${ activeFilter === option ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-300' }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Custom List UI */}
        <div className="space-y-3 relative z-10">
          {filteredLedger.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-slate-100 dark:border-white/5 border-dashed">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-slate-500 dark:text-slate-300" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">No earnings found</h4>
              <p className="text-sm text-slate-500 dark:text-slate-300 mt-1 text-center max-w-sm">
                We couldn't find any records matching your search or filter criteria.
              </p>
            </div>
          ) : (
            filteredLedger.map((item) => (
              <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 hover:border-blue-200 dark:hover:border-blue-500/30 shadow-sm hover:shadow-md transition-all group gap-4">
                
                {/* User & Type Info */}
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl shrink-0 flex items-center justify-center ${ item.type === 'Instant Cashback' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' }`}>
                    {item.type === 'Instant Cashback' ? <Zap className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{item.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">{item.id}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">{item.city}</span>
                    </div>
                  </div>
                </div>

                {/* Status & Level Badge */}
                <div className="flex items-center gap-3 md:w-48 shrink-0">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5">
                    {item.level}
                  </span>
                  <StatusBadge label={item.status} />
                </div>

                {/* Amount Info */}
                <div className="flex items-center justify-between md:justify-end gap-6 md:w-64 shrink-0">
                  <div className="text-left md:text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300 mb-0.5">{item.sourceLabel}</p>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{formatCurrency(item.sourceAmount)}</p>
                  </div>
                  
                  <div className="text-right pl-4 border-l border-slate-200 dark:border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-0.5 flex items-center justify-end gap-1">
                      <ArrowDownToLine className="w-3 h-3" /> Earned
                    </p>
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tight">{formatCurrency(item.earnings)}</p>
                  </div>
                </div>
                
              </div>
            ))
          )}
        </div>
      </div>
      
    </div>
  );
}

export default ReferralNetwork;
