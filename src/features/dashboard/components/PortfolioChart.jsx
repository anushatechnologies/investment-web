import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function PortfolioChart({ data }) {
  if (!data?.length) return null;
  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 p-4 shadow">
      <h3 className="mb-2 text-sm font-medium text-white/70">Portfolio Growth</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
          <XAxis dataKey="date" tick={{ fill: '#fff' }} />
          <YAxis tick={{ fill: '#fff' }} />
          <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: 'none' }} labelStyle={{ color: '#fff' }} />
          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
