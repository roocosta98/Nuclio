import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { Recurrence } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 401 });
    }
    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { familyId: true },
    });
    if (!currentUser || !currentUser.familyId) {
      return NextResponse.json({ error: 'Você não possui uma família vinculada.' }, { status: 400 });
    }
    const events = await prisma.event.findMany({
      where: { familyId: currentUser.familyId },
      include: {
        children: { select: { id: true, name: true, avatarUrl: true } },
        caregiver: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { date: 'asc' },
    });
    return NextResponse.json(events, { status: 200 });
  } catch (error) {
    console.error('Erro na rota GET de eventos:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }
    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 401 });
    }
    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { familyId: true },
    });
    if (!currentUser || !currentUser.familyId) {
      return NextResponse.json({ error: 'Você não possui uma família vinculada.' }, { status: 400 });
    }

    const { title, description, date, time, location, type, recurrence, childIds, caregiverId } = await req.json();

    if (!title || !date || !type) {
      return NextResponse.json({ error: 'Título, data e tipo são obrigatórios.' }, { status: 400 });
    }

    // Validação opcional das crianças
    if (childIds && Array.isArray(childIds)) {
      for (const childId of childIds) {
        const child = await prisma.child.findUnique({
          where: { id: childId },
          select: { familyId: true },
        });
        if (!child || child.familyId !== currentUser.familyId) {
          return NextResponse.json({ error: 'Acesso negado. Uma das crianças não pertence à sua família.' }, { status: 403 });
        }
      }
    }

    // Validação opcional do cuidador
    if (caregiverId) {
      const caregiver = await prisma.user.findUnique({
        where: { id: caregiverId },
        select: { familyId: true },
      });
      if (!caregiver || caregiver.familyId !== currentUser.familyId) {
        return NextResponse.json({ error: 'Acesso negado. Cuidador não pertence à sua família.' }, { status: 403 });
      }
    }

    const newEvent = await prisma.event.create({
      data: {
        title,
        description: description || null,
        date: new Date(date),
        time: time || null,
        location: location || null,
        type,
        recurrence: (recurrence || 'NONE') as Recurrence,
        familyId: currentUser.familyId,
        children: {
          connect: childIds && Array.isArray(childIds) ? childIds.map((id: string) => ({ id })) : [],
        },
        caregiverId: caregiverId || null,
      },
      include: {
        children: { select: { id: true, name: true } },
        caregiver: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Evento criado com sucesso!',
      event: newEvent,
    }, { status: 201 });
  } catch (error) {
    console.error('Erro na rota POST de eventos:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
