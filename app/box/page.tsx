export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma';
import { formatCLP, formatDateTime, getDateInputValue, paymentStatusLabel, reservationStatusLabel } from '@/lib/utils';

export default async function BoxPage() {
  const boxes = await prisma.box.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  const upcoming = await prisma.boxReservation.findMany({
    where: { startAt: { gte: new Date() }, status: { in: ['PENDING_PAYMENT', 'VOUCHER_RECEIVED', 'CONFIRMED'] } },
    include: { box: true },
    orderBy: { startAt: 'asc' },
    take: 8
  });

  return (
    <main className="page-stack">
      <section className="grid grid-3 align-start">
        {boxes.map((box) => (
          <article className="card" key={box.id}>
            <div className="photo-box">{box.imageUrl ? <img src={box.imageUrl} alt={box.name} /> : <span className="muted">Sin foto</span>}</div>
            <div className="section-head compact" style={{ marginTop: 12 }}>
              <div>
                <h3>{box.name}</h3>
                <p className="muted">{box.description}</p>
              </div>
              <span className="soft-pill">{formatCLP(box.priceCLP)}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="grid grid-2 align-start">
        <article className="card">
          <div className="section-head"><div><h2>Solicitar arriendo de box</h2><p className="muted">La reserva queda pendiente. Debes enviar comprobante de transferencia dentro de 2 horas.</p></div></div>
          <form className="form-grid" action="/api/box-rentals" method="post">
            <div>
              <label className="label">Nombre completo</label>
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
              <label className="label">Box</label>
              <select className="select" name="boxId" required>
                <option value="">Selecciona</option>
                {boxes.map((box) => <option key={box.id} value={box.id}>{box.name} · {formatCLP(box.priceCLP)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Fecha</label>
              <input className="input" name="date" type="date" defaultValue={getDateInputValue()} min={getDateInputValue()} required />
            </div>
            <div>
              <label className="label">Hora inicio</label>
              <input className="input" name="time" type="time" min="08:00" max="21:00" required />
            </div>
            <div>
              <label className="label">Duración</label>
              <select className="select" name="durationMin" required>
                <option value="60">60 min</option>
                <option value="120">120 min</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="label">Notas</label>
              <textarea className="textarea" name="notes" rows={4} />
            </div>
            <div style={{ gridColumn: '1 / -1' }} className="notice">Después de reservar debes enviar el comprobante de transferencia dentro de 2 horas. El box queda confirmado solo cuando el administrador valida el pago.</div>
            <div style={{ gridColumn: '1 / -1' }}><button className="btn" type="submit">Enviar solicitud</button></div>
          </form>
        </article>

        <article className="card">
          <div className="section-head"><div><h2>Próximos arriendos</h2><p className="muted">Estado y seguimiento.</p></div></div>
          <table className="table">
            <thead><tr><th>Fecha</th><th>Persona</th><th>Box</th><th>Estado</th></tr></thead>
            <tbody>
              {upcoming.map((item) => (
                <tr key={item.id}>
                  <td>{formatDateTime(item.startAt)}</td>
                  <td>{item.fullName}</td>
                  <td>{item.box.name}</td>
                  <td>{reservationStatusLabel(item.status)} · {paymentStatusLabel(item.paymentStatus)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </section>
    </main>
  );
}
