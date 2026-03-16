import { PrismaClient, Role, BookingMode, AppointmentStatus, BoxReservationStatus, PaymentStatus, PaymentMethod, RevenueType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.emailLog.deleteMany();
  await prisma.payout.deleteMany();
  await prisma.revenueEntry.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.professionalBlock.deleteMany();
  await prisma.boxReservation.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.service.deleteMany();
  await prisma.boxRental.deleteMany();
  await prisma.user.deleteMany();
  await prisma.box.deleteMany();

  const [box1, box2, box3] = await Promise.all([
    prisma.box.create({ data: { name: 'Box 1', description: 'Box individual estándar', priceCLP: 6000, imageUrl: '/box-1.jpg' } }),
    prisma.box.create({ data: { name: 'Box 2', description: 'Box individual estándar', priceCLP: 6000, imageUrl: '/box-2.jpg' } }),
    prisma.box.create({ data: { name: 'Box 3', description: 'Box premium', priceCLP: 8000, imageUrl: '/box-3.jpg' } })
  ]);

  const admin = await prisma.user.create({
    data: {
      name: 'Andrés Andrade',
      email: 'admin@centroconaripe.cl',
      role: Role.ADMIN,
      canSeeDayList: true,
      commissionPercent: 35
    }
  });

  await prisma.user.create({
    data: {
      name: 'Secretaria Centro',
      email: 'secretaria@centroconaripe.cl',
      role: Role.SECRETARIA,
      canSeeDayList: true,
      commissionPercent: 35
    }
  });

  const psicologo = await prisma.user.create({
    data: {
      name: 'Ps. Andrés Andrade',
      email: 'andres@centroconaripe.cl',
      role: Role.PROFESIONAL_CENTRO,
      canSeeDayList: true,
      visibleToPatients: true,
      commissionPercent: 35,
      defaultSessionMin: 50,
      preferredBoxId: box2.id
    }
  });

  const psiquiatra = await prisma.user.create({
    data: {
      name: 'Dr. Pablo Guzmán',
      email: 'pablo@centroconaripe.cl',
      role: Role.PROFESIONAL_CENTRO,
      canSeeDayList: true,
      visibleToPatients: true,
      commissionPercent: 35,
      defaultSessionMin: 45,
      preferredBoxId: box3.id
    }
  });

  const arrendatario = await prisma.user.create({
    data: {
      name: 'Terapeuta Externo',
      email: 'externo@centroconaripe.cl',
      role: Role.ARRENDATARIO_BOX,
      canSeeDayList: false,
      commissionPercent: 0
    }
  });

  await prisma.boxRental.createMany({
    data: [
      { userId: arrendatario.id, boxId: box1.id, weekday: 1, startTime: '09:00', endTime: '13:00', notes: 'Arriendo fijo lunes mañana' },
      { userId: psiquiatra.id, boxId: box3.id, weekday: 2, startTime: '15:00', endTime: '20:00', notes: 'Bloque interno base' },
      { userId: psicologo.id, boxId: box2.id, weekday: 4, startTime: '10:00', endTime: '18:00', notes: 'Bloque interno base' }
    ]
  });

  const terapia = await prisma.service.create({
    data: {
      name: 'Psicoterapia individual',
      durationMin: 50,
      priceCLP: 35000,
      isOnlineEnabled: true,
      isPresential: true,
      isPublicBooking: true,
      professionalId: psicologo.id
    }
  });

  const psiquiatria = await prisma.service.create({
    data: {
      name: 'Consulta psiquiátrica',
      durationMin: 45,
      priceCLP: 39990,
      isOnlineEnabled: true,
      isPresential: true,
      isPublicBooking: true,
      professionalId: psiquiatra.id
    }
  });

  const evaluacion = await prisma.service.create({
    data: {
      name: 'Evaluación psicológica inicial',
      durationMin: 60,
      priceCLP: 45000,
      isOnlineEnabled: false,
      isPresential: true,
      isPublicBooking: true,
      professionalId: psicologo.id
    }
  });

  const paciente1 = await prisma.patient.create({ data: { fullName: 'María Pérez', phone: '+56911111111', email: 'maria@email.com' } });
  const paciente2 = await prisma.patient.create({ data: { fullName: 'Juan Soto', phone: '+56922222222', email: 'juan@email.com' } });

  const today = new Date();
  const start1 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0);
  const start2 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0, 0);
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 16, 0, 0);

  const confirmedAppointment = await prisma.appointment.create({
    data: {
      patientId: paciente1.id,
      professionalId: psicologo.id,
      serviceId: terapia.id,
      boxId: box2.id,
      bookingMode: BookingMode.PRESENCIAL,
      startAt: start1,
      endAt: new Date(start1.getTime() + 50 * 60000),
      status: AppointmentStatus.CONFIRMED,
      paymentStatus: PaymentStatus.VALIDATED,
      paymentMethod: PaymentMethod.TRANSFERENCIA,
      chargedAmountCLP: terapia.priceCLP,
      centerShareCLP: Math.round(terapia.priceCLP * 0.35),
      professionalShareCLP: terapia.priceCLP - Math.round(terapia.priceCLP * 0.35),
      notes: 'Primera sesión'
    }
  });

  await prisma.payment.create({
    data: {
      appointmentId: confirmedAppointment.id,
      amountCLP: terapia.priceCLP,
      status: PaymentStatus.VALIDATED,
      method: PaymentMethod.TRANSFERENCIA,
      validatedAt: new Date(),
      validatedByName: admin.name
    }
  });

  await prisma.revenueEntry.create({
    data: {
      type: RevenueType.APPOINTMENT,
      amountCLP: terapia.priceCLP,
      centerShareCLP: confirmedAppointment.centerShareCLP,
      professionalShareCLP: confirmedAppointment.professionalShareCLP,
      professionalId: psicologo.id,
      appointmentId: confirmedAppointment.id
    }
  });

  await prisma.appointment.create({
    data: {
      patientId: paciente2.id,
      professionalId: psiquiatra.id,
      serviceId: psiquiatria.id,
      bookingMode: BookingMode.ONLINE,
      startAt: start2,
      endAt: new Date(start2.getTime() + 45 * 60000),
      status: AppointmentStatus.PENDING_PAYMENT,
      paymentStatus: PaymentStatus.PENDING,
      notes: 'Control mensual'
    }
  });

  await prisma.appointment.create({
    data: {
      patientId: paciente1.id,
      professionalId: psicologo.id,
      serviceId: evaluacion.id,
      boxId: box1.id,
      bookingMode: BookingMode.PRESENCIAL,
      startAt: tomorrow,
      endAt: new Date(tomorrow.getTime() + 60 * 60000),
      status: AppointmentStatus.PENDING_PAYMENT,
      paymentStatus: PaymentStatus.PENDING,
      notes: 'Evaluación inicial'
    }
  });

  const rental = await prisma.boxReservation.create({
    data: {
      boxId: box3.id,
      fullName: 'Terapeuta Laura Gómez',
      email: 'laura@email.com',
      phone: '+56933333333',
      startAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 18, 0, 0),
      endAt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 19, 0, 0),
      status: BoxReservationStatus.PENDING_PAYMENT,
      paymentStatus: PaymentStatus.PENDING,
      priceCLP: box3.priceCLP,
      transferNote: 'Debe enviar comprobante de transferencia dentro de 2 horas.',
      proofDueAt: new Date(Date.now() + 2 * 60 * 60 * 1000)
    }
  });

  await prisma.emailLog.createMany({
    data: [
      {
        to: 'laura@email.com',
        subject: 'Centro Coñaripe · Solicitud de arriendo recibida',
        body: 'Tu solicitud de arriendo fue recibida y quedó pendiente de pago.',
        kind: 'BOX_RENTAL_PENDING',
        relatedId: rental.id
      },
      {
        to: 'juan@email.com',
        subject: 'Centro Coñaripe · Solicitud de hora recibida',
        body: 'Tu solicitud de hora fue recibida y quedó pendiente de pago.',
        kind: 'APPOINTMENT_PENDING'
      }
    ]
  });

  console.log({ admin: admin.email, psicologo: psicologo.email, psiquiatra: psiquiatra.email });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
