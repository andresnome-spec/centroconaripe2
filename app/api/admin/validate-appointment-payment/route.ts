import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PaymentMethod, PaymentStatus, RevenueType, AppointmentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const schema = z.object({ appointmentId: z.string().min(1), amountCLP: z.coerce.number().int().positive(), paymentMethod: z.nativeEnum(PaymentMethod) });

export async function POST(req: NextRequest) {
  const raw = Object.fromEntries((await req.formData()).entries());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const appointment = await prisma.appointment.findUnique({ where: { id: parsed.data.appointmentId }, include: { professional: true, patient: true } });
  if (!appointment) return NextResponse.json({ error: 'Hora no encontrada' }, { status: 404 });

  const centerShare = Math.round(parsed.data.amountCLP * (appointment.professional.commissionPercent / 100));
  const professionalShare = parsed.data.amountCLP - centerShare;

  await prisma.appointment.update({ where: { id: appointment.id }, data: {
    status: AppointmentStatus.CONFIRMED,
    paymentStatus: PaymentStatus.VALIDATED,
    paymentMethod: parsed.data.paymentMethod,
    chargedAmountCLP: parsed.data.amountCLP,
    centerShareCLP: centerShare,
    professionalShareCLP: professionalShare
  }});

  await prisma.payment.upsert({
    where: { appointmentId: appointment.id },
    update: { amountCLP: parsed.data.amountCLP, status: PaymentStatus.VALIDATED, method: parsed.data.paymentMethod, validatedAt: new Date(), validatedByName: 'Administrador' },
    create: { appointmentId: appointment.id, amountCLP: parsed.data.amountCLP, status: PaymentStatus.VALIDATED, method: parsed.data.paymentMethod, validatedAt: new Date(), validatedByName: 'Administrador' }
  });

  await prisma.revenueEntry.upsert({
    where: { appointmentId: appointment.id },
    update: { amountCLP: parsed.data.amountCLP, centerShareCLP: centerShare, professionalShareCLP: professionalShare, professionalId: appointment.professionalId, type: RevenueType.APPOINTMENT },
    create: { appointmentId: appointment.id, amountCLP: parsed.data.amountCLP, centerShareCLP: centerShare, professionalShareCLP: professionalShare, professionalId: appointment.professionalId, type: RevenueType.APPOINTMENT }
  });

  if (appointment.patient.email) {
    await prisma.emailLog.create({ data: { to: appointment.patient.email, subject: 'Centro Coñaripe · Hora confirmada', body: 'Tu hora fue validada correctamente y quedó confirmada.', kind: 'APPOINTMENT_CONFIRMED', relatedId: appointment.id } });
  }

  return NextResponse.redirect(new URL('/dashboard', req.url), { status: 303 });
}
