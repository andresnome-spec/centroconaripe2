import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  professionalId: z.string().min(1),
  date: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  reason: z.string().optional().or(z.literal(''))
});

export async function POST(req: NextRequest) {
  const raw = Object.fromEntries((await req.formData()).entries());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const startAt = new Date(`${parsed.data.date}T${parsed.data.startTime}:00`);
  const endAt = new Date(`${parsed.data.date}T${parsed.data.endTime}:00`);
  await prisma.professionalBlock.create({ data: { professionalId: parsed.data.professionalId, startAt, endAt, reason: parsed.data.reason || null } });

  return NextResponse.redirect(new URL(`/professional?professionalId=${parsed.data.professionalId}`, req.url), { status: 303 });
}
