export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { StatCard } from '@/components/StatCard';
import { appointmentStatusLabel, formatCLP, formatDateTime, paymentStatusLabel, reservationStatusLabel, startOfMonth } from '@/lib/utils';

export default async function DashboardPage() {
  const monthStart = startOfMonth(new Date());
  const [pendingAppointments, pendingBoxReservations, monthRevenue, monthAppointmentsRevenue, monthBoxRevenue, professionals, boxes, services] = await Promise.all([
    prisma.appointment.findMany({ where: { status: 'PENDING_PAYMENT' }, include: { patient: true, professional: true, service: true, box: true }, orderBy: { startAt: 'asc' } }),
    prisma.boxReservation.findMany({ where: { status: { in: ['PENDING_PAYMENT', 'VOUCHER_RECEIVED'] } }, include: { box: true }, orderBy: { startAt: 'asc' } }),
    prisma.revenueEntry.aggregate({ _sum: { amountCLP: true }, where: { createdAt: { gte: monthStart } } }),
    prisma.revenueEntry.aggregate({ _sum: { amountCLP: true }, where: { createdAt: { gte: monthStart }, type: 'APPOINTMENT' } }),
    prisma.revenueEntry.aggregate({ _sum: { amountCLP: true }, where: { createdAt: { gte: monthStart }, type: 'BOX_RENTAL' } }),
    prisma.user.findMany({ where: { role: 'PROFESIONAL_CENTRO' }, orderBy: { name: 'asc' } }),
    prisma.box.findMany({ orderBy: { name: 'asc' } }),
    prisma.service.findMany({ include: { professional: true }, orderBy: { name: 'asc' } })
  ]);

  return (
    <main className="page-stack">
      <section className="grid grid-4">
        <StatCard title="Ingresos mes" value={formatCLP(monthRevenue._sum.amountCLP ?? 0)} subtitle="Total general" />
        <StatCard title="Pacientes mes" value={formatCLP(monthAppointmentsRevenue._sum.amountCLP ?? 0)} subtitle="Agenda clínica" />
        <StatCard title="Box mes" value={formatCLP(monthBoxRevenue._sum.amountCLP ?? 0)} subtitle="Arriendo de box" />
        <StatCard title="Pendientes" value={pendingAppointments.length + pendingBoxReservations.length} subtitle="Pagos por validar" />
      </section>

      <section className="grid grid-2 align-start">
        <article className="card">
          <div className="section-head"><div><h3>Validar pagos · pacientes</h3><p className="muted">Al validar se confirma la hora, se registra caja y comisión.</p></div></div>
          <div className="stack-sm">
            {pendingAppointments.map((item) => (
              <form key={item.id} className="card" action="/api/admin/validate-appointment-payment" method="post">
                <input type="hidden" name="appointmentId" value={item.id} />
                <div className="timeline-item">
                  <div>
                    <strong>{item.patient.fullName}</strong>
                    <div className="muted">{item.professional.name} · {item.service.name}</div>
                    <div className="muted">{formatDateTime(item.startAt)} · {item.box?.name ?? 'Online'}</div>
                  </div>
                  <div className="right-align">
                    <div>{appointmentStatusLabel(item.status)} · {paymentStatusLabel(item.paymentStatus)}</div>
                    <strong>{formatCLP(item.service.priceCLP)}</strong>
                  </div>
                </div>
                <div className="form-grid">
                  <div><label className="label">Monto pagado</label><input className="input" name="amountCLP" type="number" defaultValue={item.service.priceCLP} required /></div>
                  <div><label className="label">Medio de pago</label><select className="select" name="paymentMethod"><option value="TRANSFERENCIA">Transferencia</option><option value="EFECTIVO">Efectivo</option><option value="WEBPAY">Webpay</option><option value="OTRO">Otro</option></select></div>
                  <div style={{ gridColumn: '1 / -1' }}><button className="btn small" type="submit">Validar pago y confirmar hora</button></div>
                </div>
              </form>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="section-head"><div><h3>Validar pagos · box</h3><p className="muted">Se registra el ingreso según el valor del box.</p></div></div>
          <div className="stack-sm">
            {pendingBoxReservations.map((item) => (
              <form key={item.id} className="card" action="/api/admin/validate-box-payment" method="post">
                <input type="hidden" name="reservationId" value={item.id} />
                <div className="timeline-item">
                  <div>
                    <strong>{item.fullName}</strong>
                    <div className="muted">{item.box.name} · {formatDateTime(item.startAt)}</div>
                  </div>
                  <div className="right-align">
                    <div>{reservationStatusLabel(item.status)} · {paymentStatusLabel(item.paymentStatus)}</div>
                    <strong>{formatCLP(item.priceCLP)}</strong>
                  </div>
                </div>
                <div className="form-grid">
                  <div><label className="label">Monto pagado</label><input className="input" name="amountCLP" type="number" defaultValue={item.priceCLP} required /></div>
                  <div><label className="label">Medio de pago</label><select className="select" name="paymentMethod"><option value="TRANSFERENCIA">Transferencia</option><option value="EFECTIVO">Efectivo</option><option value="WEBPAY">Webpay</option><option value="OTRO">Otro</option></select></div>
                  <div style={{ gridColumn: '1 / -1' }}><button className="btn small" type="submit">Validar arriendo</button></div>
                </div>
              </form>
            ))}
          </div>
        </article>
      </section>

      <section className="grid grid-2 align-start">
        <article className="card">
          <div className="section-head"><div><h3>Configurar profesionales</h3><p className="muted">Puedes cambiar la comisión por profesional.</p></div></div>
          <table className="table">
            <thead><tr><th>Profesional</th><th>Comisión centro</th><th>Duración base</th><th>Box preferido</th></tr></thead>
            <tbody>
              {professionals.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.commissionPercent}%</td>
                  <td>{item.defaultSessionMin} min</td>
                  <td>{item.preferredBoxId ?? 'Sin preferencia'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
        <article className="card">
          <div className="section-head"><div><h3>Configurar box</h3><p className="muted">Precio y URL de imagen editables por admin.</p></div></div>
          <div className="stack-sm">
            {boxes.map((box) => (
              <form key={box.id} className="card" action="/api/admin/update-box" method="post">
                <input type="hidden" name="boxId" value={box.id} />
                <div className="form-grid">
                  <div><label className="label">Nombre</label><input className="input" name="name" defaultValue={box.name} required /></div>
                  <div><label className="label">Valor</label><input className="input" name="priceCLP" type="number" defaultValue={box.priceCLP} required /></div>
                  <div style={{ gridColumn: '1 / -1' }}><label className="label">URL imagen</label><input className="input" name="imageUrl" defaultValue={box.imageUrl ?? ''} placeholder="https://..." /></div>
                  <div style={{ gridColumn: '1 / -1' }}><label className="label">Descripción</label><input className="input" name="description" defaultValue={box.description ?? ''} /></div>
                  <div style={{ gridColumn: '1 / -1' }}><button className="btn small" type="submit">Guardar box</button></div>
                </div>
              </form>
            ))}
          </div>
        </article>
      </section>

      <section className="card">
        <div className="section-head"><div><h3>Servicios del centro</h3><p className="muted">Duración y precio modificables por admin.</p></div></div>
        <table className="table">
          <thead><tr><th>Profesional</th><th>Servicio</th><th>Duración</th><th>Valor</th><th>Modalidades</th></tr></thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id}>
                <td>{service.professional.name}</td>
                <td>{service.name}</td>
                <td>{service.durationMin} min</td>
                <td>{formatCLP(service.priceCLP)}</td>
                <td>{service.isPresential ? 'Presencial' : ''}{service.isPresential && service.isOnlineEnabled ? ' / ' : ''}{service.isOnlineEnabled ? 'Online' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
