import './globals.css';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Centro Coñaripe · Agenda y Gestión',
  description: 'Agenda clínica, arriendo de box, caja y reportes de Centro Coñaripe.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <div className="shell">
          <aside className="sidebar">
            <div className="brand">
              <div className="brand-mark">CC</div>
              <div>
                <strong>Centro Coñaripe</strong>
                <div className="muted">Agenda y Box</div>
              </div>
            </div>
            <nav className="nav-list">
              <Link href="/">Inicio</Link>
              <Link href="/box">Arriendo de box</Link>
              <Link href="/booking">Reserva pacientes</Link>
              <Link href="/staff">Listado del día</Link>
              <Link href="/professional">Portal profesional</Link>
              <Link href="/dashboard">Admin</Link>
              <Link href="/reports">Reportes</Link>
            </nav>
          </aside>
          <div className="content-wrap">
            <header className="topbar">
              <div>
                <h1>Centro Coñaripe</h1>
                <p className="muted">Sistema de agenda clínica, arriendo de box y control financiero.</p>
              </div>
            </header>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
