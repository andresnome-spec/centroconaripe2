export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { formatRole } from '@/lib/utils';
import { EmptyState } from '@/components/EmptyState';

const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default async function BoxPage() {
  const boxes = await prisma.box.findMany({
    include: {
      rentals: {
        include: { user: true },
        orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }]
      },
      appointments: {
        where: { startAt: { gte: new Date() }, status: { in: ['CONFIRMED', 'PENDING'] } },
        orderBy: { startAt: 'asc' },
        take: 3,
        include: { patient: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  return (
    <main className="page-stack">
      <section className="section-head">
        <div>
          <h2>Arriendo de box</h2>
          <p className="muted">Tus 3 box, sus bloques fijos y las próximas reservas presenciales.</p>
        </div>
      </section>

      <section className="grid grid-3 align-start">
        {boxes.map((box) => (
          <article className="card" key={box.id}>
            <div className="section-head compact">
              <div>
                <h3>{box.name}</h3>
                <p className="muted">{box.description}</p>
              </div>
              <span className="soft-pill">{box.rentals.length} bloque(s)</span>
            </div>

            <h4>Bloques fijos</h4>
            {box.rentals.length === 0 ? (
              <EmptyState title="Sin arriendos registrados" description="Aún no hay bloques semanales cargados para este box." />
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Día</th>
                    <th>Horario</th>
                    <th>Profesional</th>
                  </tr>
                </thead>
                <tbody>
                  {box.rentals.map((rental) => (
                    <tr key={rental.id}>
                      <td>{weekdays[rental.weekday]}</td>
                      <td>{rental.startTime} - {rental.endTime}</td>
                      <td>
                        <strong>{rental.user.name}</strong>
                        <div className="muted">{formatRole(rental.user.role)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="separator" />
            <h4>Próximas atenciones en este box</h4>
            {box.appointments.length === 0 ? (
              <EmptyState title="Sin reservas próximas" description="No hay atenciones presenciales futuras asignadas a este box." />
            ) : (
              <div className="stack-sm">
                {box.appointments.map((appointment) => (
                  <div className="timeline-item" key={appointment.id}>
                    <div>
                      <strong>{appointment.patient.fullName}</strong>
                      <div className="muted">{new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' }).format(appointment.startAt)}</div>
                    </div>
                    <span className="soft-pill">{appointment.bookingMode}</span>
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
