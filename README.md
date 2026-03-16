# Centro Coñaripe · Sistema Pro v1

Sistema web para:
- arriendo de box
- agenda clínica
- portal profesional
- caja y comisiones
- reportes mensuales

## Variables
Usa DATABASE_URL con pooler y DIRECT_URL con conexión directa.

## Puesta en marcha
1. `npm install`
2. crear `.env` desde `.env.example`
3. `npx prisma db push`
4. `npm run prisma:seed`
5. `npm run dev`

## Qué incluye
- Panel admin con validación manual de pagos
- Box 1 y 2 a $6.000 y Box 3 a $8.000
- Fotos por URL editable desde admin
- Correo preparado como `EmailLog`
- Cálculo de comisión por profesional
- Reporte mensual por área y liquidación profesional
- Bloqueos de agenda del profesional que no bloquean el box
