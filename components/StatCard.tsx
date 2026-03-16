export function StatCard({ title, value, subtitle }: { title: string; value: string | number; subtitle: string }) {
  return (
    <div className="card">
      <div className="muted">{title}</div>
      <div className="kpi">{value}</div>
      <div className="muted">{subtitle}</div>
    </div>
  );
}
