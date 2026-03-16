export function StatCard({ title, value, subtitle }: { title: string; value: number | string; subtitle?: string }) {
  return (
    <article className="card stat-card">
      <span className="muted">{title}</span>
      <strong className="stat-card-value">{value}</strong>
      {subtitle ? <span className="muted">{subtitle}</span> : null}
    </article>
  );
}
