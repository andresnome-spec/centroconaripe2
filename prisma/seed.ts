import { PrismaClient, Role, BookingMode, AppointmentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.appointment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.service.deleteMany();
  await prisma.boxRental.deleteMany();
  await prisma.box.deleteMany();
  await prisma.user.deleteMany();

  const [box1, box2, box3] = await Promise.all([
    prisma.box.create({ data: { name: 'Box 1', description: 'Atención psicológica general' } }),
    prisma.box.create({ data: { name: 'Box 2', description: 'Atención psiquiátrica / híbrida' } }),
    prisma.box.create({ data: { name: 'Box 3', description: 'Box premium para sesiones extendidas' } })
  ]);

  const admin = await prisma.user.create({
    data: {
      name: 'Andrés Andrade',
      email: 'admin@nexasalud.cl',
      role: Role.ADMIN,
      canSeeDayList: true
    }
  });

  const secretaria = await prisma.user.create({
    data: {
      name: 'Secretaria Centro',
      email: 'secretaria@nexasalud.cl',
      role: Role.SECRETARIA,
      canSeeDayList: true
    }
  });

  const psicologo = await prisma.user.create({
    data: {
      name: 'Ps. Andrés Andrade',
      email: 'andres@nexasalud.cl',
      role: Role.PROFESIONAL_CENTRO,
      canSeeDayList: true
    }
  });

  const psiquiatra = await prisma.user.create({
    data: {
      name: 'Dr. Pablo Guzmán',
      email: 'pablo@nexasalud.cl',
      role: Role.PROFESIONAL_CENTRO,
      canSeeDayList: true
    }
  });

  const arrendatario = await prisma.user.create({
    data: {
      name: 'Terapeuta Externo',
      email: 'externo@nexasalud.cl',
      role: Role.ARRENDATARIO_BOX,
      canSeeDayList: false
    }
  });

  await prisma.boxRental.createMany({
    data: [
      { userId: arrendatario.id, boxId: box1.id, weekday: 1, startTime: '09:00', endTime: '13:00', notes: 'Arriendo fijo lunes mañana' },
      { userId: psiquiatra.id, boxId: box2.id, weekday: 2, startTime: '15:00', endTime: '20:00', notes: 'Bloque centro' },
      { userId: psicologo.id, boxId: box3.id, weekday: 4, startTime: '10:00', endTime: '18:00', notes: 'Bloque centro' }
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

  const paciente1 = await prisma.patient.create({
    data: { fullName: 'María Pérez', phone: '+56911111111', email: 'maria@email.com' }
  });

  const paciente2 = await prisma.patient.create({
    data: { fullName: 'Juan Soto', phone: '+56922222222', email: 'juan@email.com' }
  });

  const today = new Date();
  const sameDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0);
  const sameDay2 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0, 0);
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 16, 0, 0);

  await prisma.appointment.createMany({
    data: [
      {
        patientId: paciente1.id,
        professionalId: psicologo.id,
        serviceId: terapia.id,
        boxId: box3.id,
        bookingMode: BookingMode.PRESENCIAL,
        startAt: sameDay,
        endAt: new Date(sameDay.getTime() + 50 * 60000),
        status: AppointmentStatus.CONFIRMED,
        notes: 'Primera sesión'
      },
      {
        patientId: paciente2.id,
        professionalId: psiquiatra.id,
        serviceId: psiquiatria.id,
        boxId: null,
        bookingMode: BookingMode.ONLINE,
        startAt: sameDay2,
        endAt: new Date(sameDay2.getTime() + 45 * 60000),
        status: AppointmentStatus.CONFIRMED,
        notes: 'Control mensual'
      },
      {
        patientId: paciente1.id,
        professionalId: psicologo.id,
        serviceId: evaluacion.id,
        boxId: box1.id,
        bookingMode: BookingMode.PRESENCIAL,
        startAt: tomorrow,
        endAt: new Date(tomorrow.getTime() + 60 * 60000),
        status: AppointmentStatus.PENDING,
        notes: 'Evaluación inicial'
      }
    ]
  });

  console.log({ admin, secretaria, psicologo, psiquiatra, arrendatario });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
