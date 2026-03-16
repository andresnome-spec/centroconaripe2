import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
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

const ACTIVE_APPOINTMENT_STATUSES = ['CONFIRMED', 'PENDING'];

function overlapClause(startAt: Date, endAt: Date) {
  return {
    startAt: { lt: endAt },
    endAt: { gt: startAt },
    status: { in: ACTIVE_APPOINTMENT_STATUSES }
  };
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';
  const raw = contentType.includes('application/json')
    ? await req.json()
    : Object.fromEntries((await req.formData()).entries());

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { date, time, bookingMode, notes } = parsed.data;
  const startAt = new Date(`${date}T${time}:00`);
  if (Number.isNaN(startAt.getTime()) || startAt.getTime() < Date.now() - 60000) {
    return NextResponse.json({ error: 'La fecha u hora no es válida.' }, { status: 400 });
  }

  const service = await prisma.service.findUnique({
    where: { id: parsed.data.serviceId },
    include: { professional: true }
  });

  if (!service || !service.isPublicBooking) {
    return NextResponse.json({ error: 'Servicio no disponible.' }, { status: 404 });
  }

  if (bookingMode === 'ONLINE' && !service.isOnlineEnabled) {
    return NextResponse.json({ error: 'Este servicio no admite modalidad online.' }, { status: 400 });
  }

  if (bookingMode === 'PRESENCIAL' && !service.isPresential) {
    return NextResponse.json({ error: 'Este servicio no admite modalidad presencial.' }, { status: 400 });
  }

  const endAt = new Date(startAt.getTime() + service.durationMin * 60000);

  const professionalConflict = await prisma.appointment.findFirst({
    where: {
      professionalId: service.professionalId,
      ...overlapClause(startAt, endAt)
    }
  });

  if (professionalConflict) {
    return NextResponse.json({ error: 'El profesional ya tiene una reserva en ese horario.' }, { status: 409 });
  }

  let selectedBoxId: string | null = null;

  if (bookingMode === 'PRESENCIAL') {
    const activeBoxes = await prisma.box.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    for (const box of activeBoxes) {
      const boxConflict = await prisma.appointment.findFirst({
        where: {
          boxId: box.id,
          ...overlapClause(startAt, endAt)
        }
      });

      if (!boxConflict) {
        selectedBoxId = box.id;
        break;
      }
    }

    if (!selectedBoxId) {
      return NextResponse.json({ error: 'No hay box disponibles para esa hora.' }, { status: 409 });
    }
  }

  const patient = await prisma.patient.create({
    data: {
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      notes: notes || null
    }
  });

  await prisma.appointment.create({
    data: {
      patientId: patient.id,
      professionalId: service.professionalId,
      serviceId: service.id,
      boxId: selectedBoxId,
      bookingMode,
      startAt,
      endAt,
      notes: `Primera vez: ${parsed.data.isFirstVisit}. ${notes || ''}`.trim()
    }
  });

  const redirectUrl = new URL('/booking/thanks', req.url);
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
