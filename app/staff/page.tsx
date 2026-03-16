export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { formatTime, getDateInputValue, startOfDay, endOfDay } from '@/lib/utils';
import { EmptyState } from '@/components/EmptyState';

export default async function StaffPage({
  searchParams
}: {
  searchParams?: { date?: string; professional?: string };
}) {
  const selectedDate = searchParams?.date || getDateInputValue();
  const professionalFilter = searchParams?.professional || '';
  const baseDate = new Date(`${selectedDate}T12:00:00`);
  const start = startOfDay(baseDate);
  const end = endOfDay(baseDate);

  const [professionals, appointments] = await Promise.all([
    prisma.user.findMany({
      where: { canSeeDayList: true },
      orderBy: { name: 'asc' }
    }),
    prisma.appointment.findMany({
      where: {
        startAt: { gte: start, lte: end },
        professional: { canSeeDayList: true },
        ...(professionalFilter ? { professionalId: professionalFilter } : {})
      },
      include: {
        patient: true,
        professional: true,
        service: true,
        box: true
      },
      orderBy: { startAt: 'asc' }
    })
  ]);

  return (
    <main className="page-stack">
      <section className="card">
        <div className="section-head">
          <div>
            <h2>Pacientes del día</h2>
            <p className="muted">Vista pensada para profesionales y secretaría del centro.</p>
          </div>
          <span className="soft-pill">{appointments.length} atención(es)</span>
        </div>

        <form className="filters" method="get">
          <div>
            <label className="label">Fecha</label>
            <input className="input" type="date" name="date" defaultValue={selectedDate} />
          </div>
          <div>
            <label className="label">Profesional</label>
            <select className="select" name="professional" defaultValue={professionalFilter}>
              <option value="">Todos</option>
              {professionals.map((item) => (
                <option value={item.id} key={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-actions">
            <button className="btn" type="submit">Filtrar</button>
          </div>
        </form>

        {appointments.length === 0 ? (
          <EmptyState title="No hay pacientes agendados" description="Prueba otra fecha o quita el filtro del profesional." />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Hora</th>
                <th>Paciente</th>
                <th>Profesional</th>
                <th>Servicio</th>
                <th>Modalidad</th>
                <th>Box</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((item) => (
                <tr key={item.id}>
                  <td>{formatTime(item.startAt)}</td>
                  <td>
                    <strong>{item.patient.fullName}</strong>
                    <div className="muted">{item.patient.phone}</div>
                  </td>
                  <td>{item.professional.name}</td>
                  <td>{item.service.name}</td>
                  <td><span className="soft-pill">{item.bookingMode}</span></td>
                  <td>{item.box?.name ?? 'Online / sin box'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
