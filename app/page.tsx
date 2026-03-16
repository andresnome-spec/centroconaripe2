export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { StatCard } from '@/components/StatCard';
import { formatCLP, startOfDay, endOfDay } from '@/lib/utils';

export default async function HomePage() {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [boxes, publicServices, rentals, todayAppointments, nextAppointments] = await Promise.all([
    prisma.box.count({ where: { isActive: true } }),
    prisma.service.count({ where: { isPublicBooking: true } }),
    prisma.boxRental.count(),
    prisma.appointment.count({
      where: {
        startAt: { gte: todayStart, lte: todayEnd },
        status: { in: ['CONFIRMED', 'PENDING'] }
      }
    }),
    prisma.appointment.findMany({
      where: { startAt: { gte: new Date() }, status: { in: ['CONFIRMED', 'PENDING'] } },
      include: { patient: true, professional: true, service: true, box: true },
      orderBy: { startAt: 'asc' },
      take: 4
    })
  ]);

  return (
    <main className="page-stack">
      <section className="grid grid-4">
        <StatCard title="Box activos" value={boxes} subtitle="Tus 3 box en una sola vista" />
        <StatCard title="Servicios públicos" value={publicServices} subtitle="Solo profesionales del centro" />
        <StatCard title="Bloques de arriendo" value={rentals} subtitle="Arriendos semanales registrados" />
        <StatCard title="Atenciones hoy" value={todayAppointments} subtitle="Presenciales y online" />
      </section>

      <section className="grid grid-3">
        <article className="card feature-card">
          <div className="feature-number">01</div>
          <h3>Arriendo de box</h3>
          <p className="muted">Controla quién ocupa cada box, en qué día y en qué horario fijo.</p>
          <Link href="/box" className="btn">Ver box</Link>
        </article>
        <article className="card feature-card">
          <div className="feature-number">02</div>
          <h3>Agenda de pacientes</h3>
          <p className="muted">Reserva pública solo para profesionales vinculados al centro.</p>
          <Link href="/booking" className="btn">Ir a reservas</Link>
        </article>
        <article className="card feature-card">
          <div className="feature-number">03</div>
          <h3>Listado del día</h3>
          <p className="muted">Profesionales y secretaría ven sus atenciones del día con box y modalidad.</p>
          <Link href="/staff" className="btn">Abrir listado</Link>
        </article>
      </section>

      <section className="grid grid-2">
        <div className="card">
          <div className="section-head">
            <div>
              <h2>Qué mejora esta versión</h2>
              <p className="muted">Más cercana a una app operativa y lista para subir a Vercel con Postgres.</p>
            </div>
          </div>
          <ul className="clean-list">
            <li>Chequeo de cruces de agenda para profesional y box.</li>
            <li>Filtros por fecha y profesional en el listado del día.</li>
            <li>Panel con métricas y próximas reservas.</li>
            <li>Compatibilidad preparada para Postgres en despliegue.</li>
          </ul>
        </div>

        <div className="card">
          <div className="section-head">
            <div>
              <h2>Próximas reservas</h2>
              <p className="muted">Vista rápida para secretaría.</p>
            </div>
          </div>
          <div className="stack-sm">
            {nextAppointments.map((item) => (
              <div className="timeline-item" key={item.id}>
                <div>
                  <strong>{item.patient.fullName}</strong>
                  <div className="muted">{item.professional.name} · {item.service.name}</div>
                </div>
                <div className="right-align">
                  <div>{new Intl.DateTimeFormat('es-CL', { dateStyle: 'short', timeStyle: 'short' }).format(item.startAt)}</div>
                  <div className="muted">{item.box?.name ?? 'Online'} · {formatCLP(item.service.priceCLP)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
