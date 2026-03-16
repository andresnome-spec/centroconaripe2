export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { StatCard } from '@/components/StatCard';
import { appointmentStatusLabel, formatCLP, formatDateTime, paymentStatusLabel, reservationStatusLabel, startOfDay, endOfDay, startOfMonth } from '@/lib/utils';

export default async function HomePage() {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const monthStart = startOfMonth(new Date());

  const [boxCount, pendingBoxRentals, pendingAppointments, monthRevenue, nextAppointments, nextBoxReservations] = await Promise.all([
    prisma.box.count({ where: { isActive: true } }),
    prisma.boxReservation.count({ where: { status: 'PENDING_PAYMENT' } }),
    prisma.appointment.count({ where: { status: 'PENDING_PAYMENT' } }),
    prisma.revenueEntry.aggregate({ _sum: { amountCLP: true }, where: { createdAt: { gte: monthStart } } }),
    prisma.appointment.findMany({
      where: { startAt: { gte: todayStart }, status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] } },
      include: { patient: true, professional: true, service: true, box: true },
      orderBy: { startAt: 'asc' },
      take: 5
    }),
    prisma.boxReservation.findMany({
      where: { startAt: { gte: todayStart }, status: { in: ['CONFIRMED', 'PENDING_PAYMENT', 'VOUCHER_RECEIVED'] } },
      include: { box: true },
      orderBy: { startAt: 'asc' },
      take: 5
    })
  ]);

  const todayAppointments = await prisma.appointment.count({ where: { startAt: { gte: todayStart, lte: todayEnd }, status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] } } });

  return (
    <main className="page-stack">
      <section className="hero">
        <article className="card">
          <div className="section-head">
            <div>
              <h2>Centro Coñaripe OS</h2>
              <p className="muted">Sistema integrado de agenda clínica, arriendo de box, caja y liquidación profesional.</p>
            </div>
            <span className="soft-pill">Operativo</span>
          </div>
          <div className="notice">Los box físicos son compartidos por la agenda clínica presencial y por el arriendo externo. Los bloqueos del profesional solo afectan su agenda, no el box.</div>
          <div className="stack-row" style={{ marginTop: 14 }}>
            <Link href="/dashboard" className="btn">Abrir admin</Link>
            <Link href="/booking" className="btn secondary">Reservar hora</Link>
            <Link href="/box" className="btn secondary">Arrendar box</Link>
          </div>
        </article>
        <article className="card">
          <div className="section-head"><div><h3>KPIs del mes</h3><p className="muted">Vista ejecutiva rápida.</p></div></div>
          <div className="grid grid-2">
            <div className="kpi"><span className="muted">Ingresos mes</span><strong>{formatCLP(monthRevenue._sum.amountCLP ?? 0)}</strong></div>
            <div className="kpi"><span className="muted">Horas hoy</span><strong>{todayAppointments}</strong></div>
            <div className="kpi"><span className="muted">Pendiente box</span><strong>{pendingBoxRentals}</strong></div>
            <div className="kpi"><span className="muted">Pendiente pacientes</span><strong>{pendingAppointments}</strong></div>
          </div>
        </article>
      </section>

      <section className="grid grid-4">
        <StatCard title="Box activos" value={boxCount} subtitle="3 box configurados" />
        <StatCard title="Pendientes box" value={pendingBoxRentals} subtitle="Esperando validación" />
        <StatCard title="Pendientes pacientes" value={pendingAppointments} subtitle="Esperando pago manual" />
        <StatCard title="Atenciones hoy" value={todayAppointments} subtitle="Incluye online y presencial" />
      </section>

      <section className="grid grid-2 align-start">
        <article className="card">
          <div className="section-head"><div><h3>Próximas citas</h3><p className="muted">Agenda clínica del centro.</p></div></div>
          <div className="stack-sm">
            {nextAppointments.map((item) => (
              <div className="timeline-item" key={item.id}>
                <div>
                  <strong>{item.patient.fullName}</strong>
                  <div className="muted">{item.professional.name} · {item.service.name}</div>
                </div>
                <div className="right-align">
                  <div>{formatDateTime(item.startAt)}</div>
                  <div className="muted">{item.box?.name ?? 'Online'} · {appointmentStatusLabel(item.status)} · {paymentStatusLabel(item.paymentStatus)}</div>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="section-head"><div><h3>Próximos arriendos de box</h3><p className="muted">Ingresos externos o internos por uso del espacio.</p></div></div>
          <div className="stack-sm">
            {nextBoxReservations.map((item) => (
              <div className="timeline-item" key={item.id}>
                <div>
                  <strong>{item.fullName}</strong>
                  <div className="muted">{item.box.name} · {formatCLP(item.priceCLP)}</div>
                </div>
                <div className="right-align">
                  <div>{formatDateTime(item.startAt)}</div>
                  <div className="muted">{reservationStatusLabel(item.status)} · {paymentStatusLabel(item.paymentStatus)}</div>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
