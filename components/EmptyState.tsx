export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <p className="muted" style={{ marginBottom: 0 }}>{description}</p>
    </div>
  );
}
