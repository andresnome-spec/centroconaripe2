export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { formatCLP, startOfMonth } from '@/lib/utils';

export default async function ReportsPage() {
  const monthStart = startOfMonth(new Date());
  const [revenues, professionals] = await Promise.all([
    prisma.revenueEntry.findMany({ where: { createdAt: { gte: monthStart } }, orderBy: { createdAt: 'asc' } }),
    prisma.user.findMany({ where: { role: 'PROFESIONAL_CENTRO' }, orderBy: { name: 'asc' } })
  ]);

  const boxRevenue = revenues.filter((r) => r.type === 'BOX_RENTAL').reduce((sum, r) => sum + r.amountCLP, 0);
  const appointmentRevenue = revenues.filter((r) => r.type === 'APPOINTMENT').reduce((sum, r) => sum + r.amountCLP, 0);
  const totalRevenue = revenues.reduce((sum, r) => sum + r.amountCLP, 0);

  const professionalRows = await Promise.all(professionals.map(async (professional) => {
    const items = await prisma.revenueEntry.findMany({ where: { createdAt: { gte: monthStart }, professionalId: professional.id } });
    const gross = items.reduce((sum, r) => sum + r.amountCLP, 0);
    const center = items.reduce((sum, r) => sum + (r.centerShareCLP ?? 0), 0);
    const payout = items.reduce((sum, r) => sum + (r.professionalShareCLP ?? 0), 0);
    return { professional, gross, center, payout };
  }));

  return (
    <main className="page-stack">
      <section className="grid grid-3">
        <article className="card"><span className="muted">Ingresos box</span><strong className="stat-card-value">{formatCLP(boxRevenue)}</strong></article>
        <article className="card"><span className="muted">Ingresos pacientes</span><strong className="stat-card-value">{formatCLP(appointmentRevenue)}</strong></article>
        <article className="card"><span className="muted">Total general</span><strong className="stat-card-value">{formatCLP(totalRevenue)}</strong></article>
      </section>
      <section className="grid grid-2 align-start">
        <article className="card">
          <div className="section-head"><div><h2>Reporte por área</h2><p className="muted">Resumen ejecutivo del mes actual.</p></div></div>
          <table className="table">
            <thead><tr><th>Área</th><th>Total</th></tr></thead>
            <tbody>
              <tr><td>Arriendo de box</td><td>{formatCLP(boxRevenue)}</td></tr>
              <tr><td>Atenciones pacientes</td><td>{formatCLP(appointmentRevenue)}</td></tr>
              <tr><td>Total general</td><td>{formatCLP(totalRevenue)}</td></tr>
            </tbody>
          </table>
        </article>
        <article className="card">
          <div className="section-head"><div><h2>Liquidación por profesional</h2><p className="muted">Calculada según comisión configurable.</p></div></div>
          <table className="table">
            <thead><tr><th>Profesional</th><th>Facturado</th><th>Centro</th><th>A pagar</th></tr></thead>
            <tbody>
              {professionalRows.map((row) => (
                <tr key={row.professional.id}>
                  <td>{row.professional.name}</td>
                  <td>{formatCLP(row.gross)}</td>
                  <td>{formatCLP(row.center)}</td>
                  <td>{formatCLP(row.payout)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>
    </main>
  );
}
