# NEXA Salud · Agenda y Box MVP

Versión mejorada del MVP inicial para tu centro, enfocada en tres módulos clave:

1. **Arriendo de Box** para profesionales externos o internos.
2. **Agenda de pacientes** solo para profesionales que atienden con el centro.
3. **Listado de pacientes del día** para profesionales y secretaría.

## Mejoras incluidas en esta versión
- Diseño visual más sólido y más cercano a un SaaS.
- Validación de cruces de agenda por profesional.
- Asignación automática de box disponible en reservas presenciales.
- Filtros por fecha y profesional en el listado del día.
- Confirmación visual posterior a la reserva.
- Preparado para **PostgreSQL**, más adecuado para desplegar en Vercel.

## Stack
- Next.js 14
- TypeScript
- Prisma
- PostgreSQL

## Cómo levantarlo localmente

1. Instala dependencias:

```bash
npm install
```

2. Crea tu archivo `.env` desde `.env.example` y agrega una base PostgreSQL:

```bash
cp .env.example .env
```

3. Genera el cliente Prisma y aplica el esquema:

```bash
npx prisma generate
npx prisma db push
```

4. Carga datos demo:

```bash
npm run prisma:seed
```

5. Inicia el proyecto:

```bash
npm run dev
```

## Cómo subirlo luego a Vercel
1. Sube la carpeta a GitHub.
2. Crea una base PostgreSQL en Supabase, Neon o equivalente.
3. En Vercel, importa el repositorio.
4. Agrega la variable `DATABASE_URL`.
5. Haz deploy.
6. Ejecuta una vez:

```bash
npx prisma db push
npm run prisma:seed
```

## Estructura principal
- `/box`: vista de arriendo por box
- `/booking`: formulario público de reserva
- `/booking/thanks`: confirmación de reserva
- `/staff`: listado del día con filtros
- `/dashboard`: panel administrativo

## Próxima etapa recomendada
- Login real y permisos por rol
- Calendario semanal/mensual drag & drop
- Bloqueos manuales de agenda
- Pago online
- WhatsApp y correo
- Ficha clínica y observaciones
- Multi-sucursal
