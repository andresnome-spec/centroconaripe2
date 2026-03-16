import Link from 'next/link';

export default function ThanksPage() {
  return (
    <main className="page-stack">
      <section className="card">
        <h2>Solicitud enviada</h2>
        <p className="muted">Tu solicitud fue registrada correctamente y quedó pendiente de validación de pago. Revisa tu correo para ver el detalle enviado por Centro Coñaripe.</p>
        <div className="stack-row">
          <Link href="/booking" className="btn">Volver a reservar</Link>
          <Link href="/" className="btn secondary">Ir al inicio</Link>
        </div>
      </section>
    </main>
  );
}
