import { useEffect } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import SummaryCard from '../components/SummaryCard';
import PortfolioChart from '../components/PortfolioChart';
import QuickActions from '../components/QuickActions';
import RecentTransactions from '../components/RecentTransactions';
import NotificationBanner from '../components/NotificationBanner';

export default function DashboardPage() {
  const { data, loading, error, refresh } = useDashboard();

  // Auto‑refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="loader animate-spin rounded-full border-4 border-t-4 border-blue-500 h-12 w-12" />
    </div>
  );

  if (error) return (
    <div className="p-4 text-center text-red-600">
      <p>Failed to load dashboard data.</p>
      <button onClick={refresh} className="mt-2 btn-primary">Retry</button>
    </div>
  );

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-600">No dashboard data available.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page space-y-6 p-4">
      <NotificationBanner message="Welcome back!" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SummaryCard title="Total Invested" value={data.totalInvested} />
        <SummaryCard title="Current Value" value={data.currentValue} />
        <SummaryCard title="Profit / Loss" value={data.profitLoss} />
        <SummaryCard title="Return %" value={`${data.returnPercentage}%`} />
        <SummaryCard title="Wallet Balance" value={data.walletBalance} />
      </div>
      <PortfolioChart data={data.chartData} />
      <QuickActions />
      <RecentTransactions transactions={data.recentTransactions} />
    </div>
  );
}
