import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { Recurrence } from '@prisma/client';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Validação de Segurança: O evento deve pertencer à mesma família do usuário logado
    const targetEvent = await prisma.event.findUnique({
      where: { id },
      select: { familyId: true },
    });

    if (!targetEvent || targetEvent.familyId !== currentUser.familyId) {
      return NextResponse.json(
        { error: 'Acesso negado. Este evento não pertence à sua família.' },
        { status: 403 }
      );
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

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        title,
        description: description || null,
        date: new Date(date),
        time: time || null,
        location: location || null,
        type,
        recurrence: (recurrence || 'NONE') as Recurrence,
        children: {
          set: childIds && Array.isArray(childIds) ? childIds.map((id: string) => ({ id })) : [],
        },
        caregiverId: caregiverId || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Evento atualizado com sucesso!',
      event: updatedEvent,
    });
  } catch (error) {
    console.error('Erro na rota PUT de eventos:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Validação de Segurança: O evento deve pertencer à mesma família do usuário logado
    const targetEvent = await prisma.event.findUnique({
      where: { id },
      select: { familyId: true },
    });

    if (!targetEvent || targetEvent.familyId !== currentUser.familyId) {
      return NextResponse.json(
        { error: 'Acesso negado. Este evento não pertence à sua família.' },
        { status: 403 }
      );
    }

    await prisma.event.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Evento excluído com sucesso!',
    });
  } catch (error) {
    console.error('Erro na rota DELETE de eventos:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
