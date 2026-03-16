export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { formatCLP, formatDate, formatRole, startOfDay, endOfDay } from '@/lib/utils';
import { StatCard } from '@/components/StatCard';

export default async function DashboardPage() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  const [users, services, nextAppointments, rentals, todayAppointments] = await Promise.all([
    prisma.user.findMany({ orderBy: { role: 'asc' } }),
    prisma.service.findMany({ include: { professional: true }, orderBy: { name: 'asc' } }),
    prisma.appointment.findMany({
      include: { patient: true, professional: true, service: true, box: true },
      where: { startAt: { gte: now }, status: { in: ['CONFIRMED', 'PENDING'] } },
      orderBy: { startAt: 'asc' },
      take: 10
    }),
    prisma.boxRental.findMany({ include: { user: true, box: true } }),
    prisma.appointment.count({
      where: { startAt: { gte: todayStart, lte: todayEnd }, status: { in: ['CONFIRMED', 'PENDING'] } }
    })
  ]);

  const projectedRevenue = nextAppointments.reduce((sum, item) => sum + item.service.priceCLP, 0);

  return (
    <main className="page-stack">
      <section className="grid grid-4">
        <StatCard title="Usuarios" value={users.length} subtitle="Admin, secretaría y profesionales" />
        <StatCard title="Servicios" value={services.length} subtitle="Servicios agendables del centro" />
        <StatCard title="Bloques de arriendo" value={rentals.length} subtitle="Arriendos fijos registrados" />
        <StatCard title="Atenciones hoy" value={todayAppointments} subtitle="Confirmadas o pendientes" />
      </section>

      <section className="grid grid-2 align-start">
        <section className="card">
          <div className="section-head">
            <div>
              <h3>Usuarios y roles</h3>
              <p className="muted">Aquí se ve quién puede acceder al listado del día.</p>
            </div>
          </div>
          <table className="table">
            <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Listado día</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{formatRole(u.role)}</td>
                  <td>{u.canSeeDayList ? 'Sí' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card">
          <div className="section-head">
            <div>
              <h3>Resumen comercial</h3>
              <p className="muted">Proyección simple basada en las próximas reservas cargadas.</p>
            </div>
          </div>
          <div className="stack-sm">
            <div className="timeline-item">
              <span className="muted">Valor proyectado próximas reservas</span>
              <strong>{formatCLP(projectedRevenue)}</strong>
            </div>
            <div className="timeline-item">
              <span className="muted">Servicios publicados</span>
              <strong>{services.filter((s) => s.isPublicBooking).length}</strong>
            </div>
            <div className="timeline-item">
              <span className="muted">Profesionales visibles en agenda</span>
              <strong>{new Set(services.map((s) => s.professionalId)).size}</strong>
            </div>
          </div>
        </section>
      </section>

      <section className="card">
        <div className="section-head">
          <div>
            <h3>Servicios del centro</h3>
            <p className="muted">Servicios visibles para pacientes y sus condiciones.</p>
          </div>
        </div>
        <table className="table">
          <thead><tr><th>Profesional</th><th>Servicio</th><th>Duración</th><th>Modalidad</th><th>Valor</th></tr></thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id}>
                <td>{s.professional.name}</td>
                <td>{s.name}</td>
                <td>{s.durationMin} min</td>
                <td>{s.isPresential ? 'Presencial' : ''}{s.isPresential && s.isOnlineEnabled ? ' / ' : ''}{s.isOnlineEnabled ? 'Online' : ''}</td>
                <td>{formatCLP(s.priceCLP)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <div className="section-head">
          <div>
            <h3>Próximas reservas</h3>
            <p className="muted">Lista operativa para seguimiento.</p>
          </div>
        </div>
        <table className="table">
          <thead><tr><th>Fecha</th><th>Paciente</th><th>Profesional</th><th>Servicio</th><th>Box</th></tr></thead>
          <tbody>
            {nextAppointments.map((a) => (
              <tr key={a.id}>
                <td>{formatDate(a.startAt)} {a.startAt.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</td>
                <td>{a.patient.fullName}</td>
                <td>{a.professional.name}</td>
                <td>{a.service.name}</td>
                <td>{a.box?.name ?? 'Online'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
