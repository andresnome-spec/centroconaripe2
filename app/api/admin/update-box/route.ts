import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  boxId: z.string().min(1),
  name: z.string().min(1),
  priceCLP: z.coerce.number().int().positive(),
  imageUrl: z.string().optional().or(z.literal('')),
  description: z.string().optional().or(z.literal(''))
});

export async function POST(req: NextRequest) {
  const raw = Object.fromEntries((await req.formData()).entries());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await prisma.box.update({ where: { id: parsed.data.boxId }, data: { name: parsed.data.name, priceCLP: parsed.data.priceCLP, imageUrl: parsed.data.imageUrl || null, description: parsed.data.description || null } });
  return NextResponse.redirect(new URL('/dashboard', req.url), { status: 303 });
}
