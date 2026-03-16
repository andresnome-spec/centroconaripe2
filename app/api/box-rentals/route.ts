import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { BoxReservationStatus, PaymentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  fullName: z.string().min(3),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal('')),
  boxId: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  durationMin: z.coerce.number().min(30).max(240),
  notes: z.string().optional().or(z.literal(''))
});

export async function POST(req: NextRequest) {
  const raw = Object.fromEntries((await req.formData()).entries());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { boxId, date, time, durationMin } = parsed.data;
  const startAt = new Date(`${date}T${time}:00`);
  const endAt = new Date(startAt.getTime() + durationMin * 60000);
  const box = await prisma.box.findUnique({ where: { id: boxId } });
  if (!box) return NextResponse.json({ error: 'Box no encontrado' }, { status: 404 });

  const overlap = {
    startAt: { lt: endAt },
    endAt: { gt: startAt }
  };

  const [reservationConflict, appointmentConflict] = await Promise.all([
    prisma.boxReservation.findFirst({ where: { boxId, ...overlap, status: { in: [BoxReservationStatus.PENDING_PAYMENT, BoxReservationStatus.VOUCHER_RECEIVED, BoxReservationStatus.CONFIRMED] } } }),
    prisma.appointment.findFirst({ where: { boxId, ...overlap, status: { in: ['PENDING_PAYMENT', 'CONFIRMED'] } } })
  ]);

  if (reservationConflict || appointmentConflict) {
    return NextResponse.json({ error: 'Ese box ya está ocupado en el horario solicitado.' }, { status: 409 });
  }

  const reservation = await prisma.boxReservation.create({
    data: {
      boxId,
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      startAt,
      endAt,
      status: BoxReservationStatus.PENDING_PAYMENT,
      paymentStatus: PaymentStatus.PENDING,
      priceCLP: box.priceCLP,
      notes: parsed.data.notes || null,
      transferNote: 'Debe enviar comprobante de transferencia dentro de 2 horas.',
      proofDueAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
    }
  });

  if (parsed.data.email) {
    await prisma.emailLog.create({
      data: {
        to: parsed.data.email,
        subject: 'Centro Coñaripe · Solicitud de arriendo recibida',
        body: `Tu solicitud para ${box.name} fue recibida para ${startAt.toISOString()} y quedó pendiente de pago.`,
        kind: 'BOX_RENTAL_PENDING',
        relatedId: reservation.id
      }
    });
  }

  return NextResponse.redirect(new URL('/booking/thanks', req.url), { status: 303 });
}
