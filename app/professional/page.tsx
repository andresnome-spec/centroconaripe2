export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { appointmentStatusLabel, formatDateTime, getDateInputValue, paymentStatusLabel, startOfDay } from '@/lib/utils';

export default async function ProfessionalPage({ searchParams }: { searchParams?: { professionalId?: string } }) {
  const professionals = await prisma.user.findMany({ where: { role: 'PROFESIONAL_CENTRO' }, orderBy: { name: 'asc' } });
  const professionalId = searchParams?.professionalId || professionals[0]?.id;
  const professional = professionalId ? await prisma.user.findUnique({ where: { id: professionalId } }) : null;

  const appointments = professionalId ? await prisma.appointment.findMany({
    where: { professionalId, startAt: { gte: startOfDay(new Date()) } },
    include: { patient: true, service: true, box: true },
    orderBy: { startAt: 'asc' },
    take: 20
  }) : [];

  const blocks = professionalId ? await prisma.professionalBlock.findMany({ where: { professionalId, endAt: { gte: new Date() } }, orderBy: { startAt: 'asc' }, take: 10 }) : [];

  return (
    <main className="page-stack">
      <section className="card">
        <div className="section-head"><div><h2>Portal profesional</h2><p className="muted">Vista simple: solo citas, estado de pago y bloqueos personales.</p></div></div>
        <form className="filters" method="get">
          <div>
            <label className="label">Profesional</label>
            <select className="select" name="professionalId" defaultValue={professionalId}>
              {professionals.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="filter-actions"><button className="btn" type="submit">Ver agenda</button></div>
        </form>
      </section>

      {professional ? (
        <section className="grid grid-2 align-start">
          <article className="card">
            <div className="section-head"><div><h3>Próximas horas de {professional.name}</h3><p className="muted">Sin montos ni datos administrativos.</p></div></div>
            <table className="table">
              <thead><tr><th>Fecha</th><th>Paciente</th><th>Servicio</th><th>Pago</th></tr></thead>
              <tbody>
                {appointments.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDateTime(item.startAt)}</td>
                    <td>{item.patient.fullName}</td>
                    <td>{item.service.name} · {item.box?.name ?? 'Online'}</td>
                    <td>{appointmentStatusLabel(item.status)} · {paymentStatusLabel(item.paymentStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </article>
          <article className="card">
            <div className="section-head"><div><h3>Bloquear horario</h3><p className="muted">Este bloqueo afecta solo la agenda del profesional, no los box.</p></div></div>
            <form className="form-grid" action="/api/professional-blocks" method="post">
              <input type="hidden" name="professionalId" value={professional.id} />
              <div><label className="label">Fecha</label><input className="input" type="date" name="date" defaultValue={getDateInputValue()} required /></div>
              <div><label className="label">Hora inicio</label><input className="input" type="time" name="startTime" required /></div>
              <div><label className="label">Hora fin</label><input className="input" type="time" name="endTime" required /></div>
              <div style={{ gridColumn: '1 / -1' }}><label className="label">Motivo</label><input className="input" name="reason" placeholder="Almuerzo, trámite, ausencia" /></div>
              <div style={{ gridColumn: '1 / -1' }}><button className="btn" type="submit">Bloquear horario</button></div>
            </form>
            <div className="separator" />
            <div className="stack-sm">
              {blocks.map((block) => (
                <div key={block.id} className="timeline-item">
                  <div><strong>{formatDateTime(block.startAt)}</strong><div className="muted">hasta {formatDateTime(block.endAt)}</div></div>
                  <span className="soft-pill">{block.reason || 'Bloqueo'}</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      ) : null}
    </main>
  );
}
