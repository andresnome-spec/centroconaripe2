import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AppointmentStatus, PaymentStatus, BookingMode } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  fullName: z.string().min(3),
  phone: z.string().min(6),
  email: z.string().email().optional().or(z.literal('')),
  serviceId: z.string().min(1),
  date: z.string().min(1),
  time: z.string().min(1),
  bookingMode: z.enum(['PRESENCIAL', 'ONLINE']),
  isFirstVisit: z.enum(['SI', 'NO']),
  notes: z.string().optional().or(z.literal(''))
});

const activeAppointmentStatuses = [AppointmentStatus.PENDING_PAYMENT, AppointmentStatus.CONFIRMED];

function overlap(startAt: Date, endAt: Date) {
  return { startAt: { lt: endAt }, endAt: { gt: startAt } };
}

export async function POST(req: NextRequest) {
  const raw = Object.fromEntries((await req.formData()).entries());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const startAt = new Date(`${parsed.data.date}T${parsed.data.time}:00`);
  const service = await prisma.service.findUnique({ where: { id: parsed.data.serviceId }, include: { professional: true } });
  if (!service) return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });

  const endAt = new Date(startAt.getTime() + service.durationMin * 60000);
  const professionalConflict = await prisma.appointment.findFirst({ where: { professionalId: service.professionalId, ...overlap(startAt, endAt), status: { in: activeAppointmentStatuses } } });
  const professionalBlock = await prisma.professionalBlock.findFirst({ where: { professionalId: service.professionalId, ...overlap(startAt, endAt) } });
  if (professionalConflict || professionalBlock) {
    return NextResponse.json({ error: 'El profesional no está disponible en ese horario.' }, { status: 409 });
  }

  let boxId: string | null = null;
  if (parsed.data.bookingMode === BookingMode.PRESENCIAL) {
    const boxes = await prisma.box.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
    const preferredFirst = boxes.sort((a, b) => (a.id === service.professional.preferredBoxId ? -1 : b.id === service.professional.preferredBoxId ? 1 : 0));
    for (const box of preferredFirst) {
      const [appointmentConflict, reservationConflict] = await Promise.all([
        prisma.appointment.findFirst({ where: { boxId: box.id, ...overlap(startAt, endAt), status: { in: activeAppointmentStatuses } } }),
        prisma.boxReservation.findFirst({ where: { boxId: box.id, ...overlap(startAt, endAt), status: { in: ['PENDING_PAYMENT', 'VOUCHER_RECEIVED', 'CONFIRMED'] } } })
      ]);
      if (!appointmentConflict && !reservationConflict) {
        boxId = box.id;
        break;
      }
    }
    if (!boxId) return NextResponse.json({ error: 'No hay box físicos disponibles para esa hora.' }, { status: 409 });
  }

  const patient = await prisma.patient.create({ data: { fullName: parsed.data.fullName, phone: parsed.data.phone, email: parsed.data.email || null, notes: parsed.data.notes || null } });
  const appointment = await prisma.appointment.create({
    data: {
      patientId: patient.id,
      professionalId: service.professionalId,
      serviceId: service.id,
      boxId,
      bookingMode: parsed.data.bookingMode,
      startAt,
      endAt,
      status: AppointmentStatus.PENDING_PAYMENT,
      paymentStatus: PaymentStatus.PENDING,
      notes: `Primera vez: ${parsed.data.isFirstVisit}. ${parsed.data.notes || ''}`.trim()
    }
  });

  if (parsed.data.email) {
    await prisma.emailLog.create({
      data: {
        to: parsed.data.email,
        subject: 'Centro Coñaripe · Solicitud de hora recibida',
        body: `Tu solicitud para ${service.name} fue recibida y quedó pendiente de pago.`,
        kind: 'APPOINTMENT_PENDING',
        relatedId: appointment.id
      }
    });
  }

  return NextResponse.redirect(new URL('/booking/thanks', req.url), { status: 303 });
}
