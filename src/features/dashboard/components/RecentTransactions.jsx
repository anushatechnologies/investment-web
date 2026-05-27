export default function RecentTransactions({ transactions }) {
  if (!transactions?.length) return (
    <p className="text-sm text-white/50">No recent transactions.</p>
  );
  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 p-4">
      <h3 className="mb-2 text-sm font-medium text-white/70">Recent Transactions</h3>
      <ul className="divide-y divide-white/10">
        {transactions.map((tx) => (
          <li key={tx.id} className="flex justify-between py-2 text-sm text-white/80">
            <span>{tx.type} • {new Date(tx.date).toLocaleDateString()}</span>
            <span className={tx.amount > 0 ? 'text-green-400' : 'text-red-400'}>{tx.amount > 0 ? '+' : '-'}{Math.abs(tx.amount).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
