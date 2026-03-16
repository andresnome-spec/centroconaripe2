import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NEXA Salud · Agenda y Box',
  description: 'MVP para arriendo de box, agenda de pacientes y listado del día'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="container">
          <header className="hero-shell">
            <div className="hero-top">
              <div>
                <span className="badge">NEXA Salud · MVP operativo</span>
                <h1>Agenda clínica + arriendo de box</h1>
                <p className="muted hero-text">
                  Una base real para administrar tus 3 box, reservas de pacientes y el listado diario de atención.
                </p>
              </div>
              <div className="hero-actions">
                <Link href="/booking" className="btn">Agendar paciente</Link>
                <Link href="/dashboard" className="btn secondary">Panel admin</Link>
              </div>
            </div>
            <nav className="nav">
              <Link href="/">Inicio</Link>
              <Link href="/box">Arriendo de box</Link>
              <Link href="/booking">Agenda de pacientes</Link>
              <Link href="/staff">Listado del día</Link>
              <Link href="/dashboard">Panel admin</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
