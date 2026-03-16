export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { formatCLP, getDateInputValue } from '@/lib/utils';

export default async function BookingPage() {
  const services = await prisma.service.findMany({
    where: { isPublicBooking: true, professional: { visibleToPatients: true } },
    include: { professional: true },
    orderBy: [{ professional: { name: 'asc' } }, { name: 'asc' }]
  });

  return (
    <main className="page-stack">
      <section className="grid grid-2 align-start">
        <article className="card">
          <div className="section-head">
            <div>
              <h2>Reserva de pacientes</h2>
              <p className="muted">Elige profesional, servicio y modalidad. La hora queda pendiente hasta validar el pago.</p>
            </div>
          </div>
          <form className="form-grid" action="/api/appointments" method="post">
            <div><label className="label">Nombre paciente</label><input className="input" name="fullName" required /></div>
            <div><label className="label">Teléfono</label><input className="input" name="phone" required /></div>
            <div><label className="label">Email</label><input className="input" name="email" type="email" /></div>
            <div>
              <label className="label">Servicio</label>
              <select className="select" name="serviceId" required>
                <option value="">Selecciona</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>{service.professional.name} · {service.name} · {formatCLP(service.priceCLP)}</option>
                ))}
              </select>
            </div>
            <div><label className="label">Fecha</label><input className="input" type="date" name="date" min={getDateInputValue()} defaultValue={getDateInputValue()} required /></div>
            <div><label className="label">Hora</label><input className="input" type="time" name="time" min="08:00" max="21:00" required /></div>
            <div>
              <label className="label">Modalidad</label>
              <select className="select" name="bookingMode">
                <option value="PRESENCIAL">Presencial</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>
            <div>
              <label className="label">Primera vez</label>
              <select className="select" name="isFirstVisit">
                <option value="SI">Sí</option>
                <option value="NO">No</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}><label className="label">Notas</label><textarea className="textarea" name="notes" rows={4} /></div>
            <div style={{ gridColumn: '1 / -1' }} className="notice">Tu hora quedará reservada correctamente pero en estado pendiente hasta que el administrador valide el pago recibido por transferencia.</div>
            <div style={{ gridColumn: '1 / -1' }}><button className="btn" type="submit">Solicitar hora</button></div>
          </form>
        </article>
        <article className="card">
          <div className="section-head"><div><h2>Servicios disponibles</h2><p className="muted">Solo profesionales visibles al público.</p></div></div>
          <table className="table">
            <thead><tr><th>Profesional</th><th>Servicio</th><th>Duración</th><th>Valor</th></tr></thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td>{service.professional.name}</td>
                  <td>{service.name}</td>
                  <td>{service.durationMin} min</td>
                  <td>{formatCLP(service.priceCLP)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>
    </main>
  );
}
