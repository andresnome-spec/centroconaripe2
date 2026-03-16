import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { formatCLP, getDateInputValue } from '@/lib/utils';

export default async function BookingPage({ searchParams }: { searchParams?: { serviceId?: string } }) {
  const services = await prisma.service.findMany({
    where: { isPublicBooking: true },
    include: { professional: true },
    orderBy: [{ professional: { name: 'asc' } }, { name: 'asc' }]
  });

  const selectedServiceId = searchParams?.serviceId ?? '';

  return (
    <main className="grid grid-2 align-start">
      <section className="card">
        <div className="section-head">
          <div>
            <h2>Reserva de pacientes</h2>
            <p className="muted">Formulario público para profesionales del centro. El sistema valida cruces antes de confirmar.</p>
          </div>
          <span className="soft-pill">Público</span>
        </div>

        <form className="form-grid" action="/api/appointments" method="post">
          <div>
            <label className="label">Nombre paciente</label>
            <input className="input" name="fullName" required />
          </div>
          <div>
            <label className="label">Teléfono</label>
            <input className="input" name="phone" required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" name="email" type="email" />
          </div>
          <div>
            <label className="label">Servicio</label>
            <select className="select" name="serviceId" defaultValue={selectedServiceId} required>
              <option value="">Selecciona</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} · {service.professional.name} · {formatCLP(service.priceCLP)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Fecha</label>
            <input className="input" name="date" type="date" min={getDateInputValue()} defaultValue={getDateInputValue()} required />
          </div>
          <div>
            <label className="label">Hora</label>
            <input className="input" name="time" type="time" min="08:00" max="21:00" required />
          </div>
          <div>
            <label className="label">Modalidad</label>
            <select className="select" name="bookingMode" required>
              <option value="PRESENCIAL">Presencial</option>
              <option value="ONLINE">Online</option>
            </select>
          </div>
          <div>
            <label className="label">¿Primera vez?</label>
            <select className="select" name="isFirstVisit" required>
              <option value="SI">Sí</option>
              <option value="NO">No</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Notas</label>
            <textarea className="textarea" name="notes" rows={4} placeholder="Ej. motivo de consulta, solicitud administrativa o preferencia horaria" />
          </div>
          <div style={{ gridColumn: '1 / -1' }} className="stack-row">
            <button className="btn" type="submit">Crear reserva</button>
            <Link href="/staff" className="btn secondary">Ver listado del día</Link>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="section-head">
          <div>
            <h2>Servicios visibles al público</h2>
            <p className="muted">Solo aparecen los profesionales que sí atienden con el centro.</p>
          </div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Profesional</th>
              <th>Servicio</th>
              <th>Duración</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id}>
                <td>{service.professional.name}</td>
                <td>
                  <div>{service.name}</div>
                  <div className="muted">{service.isOnlineEnabled ? 'Online habilitado' : 'Solo presencial'}</div>
                </td>
                <td>{service.durationMin} min</td>
                <td>{formatCLP(service.priceCLP)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
