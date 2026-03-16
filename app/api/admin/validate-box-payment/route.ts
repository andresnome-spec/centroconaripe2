import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PaymentMethod, PaymentStatus, RevenueType, BoxReservationStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const schema = z.object({ reservationId: z.string().min(1), amountCLP: z.coerce.number().int().positive(), paymentMethod: z.nativeEnum(PaymentMethod) });

export async function POST(req: NextRequest) {
  const raw = Object.fromEntries((await req.formData()).entries());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const reservation = await prisma.boxReservation.findUnique({ where: { id: parsed.data.reservationId } });
  if (!reservation) return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });

  await prisma.boxReservation.update({ where: { id: reservation.id }, data: { status: BoxReservationStatus.CONFIRMED, paymentStatus: PaymentStatus.VALIDATED, validatedAt: new Date() } });
  await prisma.payment.upsert({
    where: { boxReservationId: reservation.id },
    update: { amountCLP: parsed.data.amountCLP, status: PaymentStatus.VALIDATED, method: parsed.data.paymentMethod, validatedAt: new Date(), validatedByName: 'Administrador' },
    create: { boxReservationId: reservation.id, amountCLP: parsed.data.amountCLP, status: PaymentStatus.VALIDATED, method: parsed.data.paymentMethod, validatedAt: new Date(), validatedByName: 'Administrador' }
  });
  await prisma.revenueEntry.upsert({
    where: { boxReservationId: reservation.id },
    update: { amountCLP: parsed.data.amountCLP, type: RevenueType.BOX_RENTAL },
    create: { boxReservationId: reservation.id, amountCLP: parsed.data.amountCLP, type: RevenueType.BOX_RENTAL }
  });
  if (reservation.email) {
    await prisma.emailLog.create({ data: { to: reservation.email, subject: 'Centro Coñaripe · Arriendo confirmado', body: 'Tu reserva de box fue validada correctamente.', kind: 'BOX_RENTAL_CONFIRMED', relatedId: reservation.id } });
  }
  return NextResponse.redirect(new URL('/dashboard', req.url), { status: 303 });
}
