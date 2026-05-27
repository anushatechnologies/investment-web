export default function SummaryCard({ title, value }) {
  return (
    <div className="dashboard-card p-4">
      <h3 className="text-sm font-medium text-white/70">{title}</h3>
      <p className="mt-2 text-2xl font-bold text-white">{value?.toLocaleString?.() || '-'}</p>
    </div>
  );
}
