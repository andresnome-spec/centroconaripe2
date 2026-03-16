import Link from 'next/link';

export default function BookingThanksPage() {
  return (
    <main className="card centered-card">
      <span className="badge">Reserva creada</span>
      <h2>La hora fue registrada correctamente</h2>
      <p className="muted">En este MVP la reserva queda visible de inmediato en el listado del día y en el panel administrativo.</p>
      <div className="stack-row center">
        <Link href="/booking" className="btn">Crear otra reserva</Link>
        <Link href="/staff" className="btn secondary">Ver listado del día</Link>
      </div>
    </main>
  );
}
