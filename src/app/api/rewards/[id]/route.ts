import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { Role } from '@prisma/client';

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
      select: { familyId: true, role: true },
    });
    if (!currentUser || !currentUser.familyId) {
      return NextResponse.json({ error: 'Você não possui uma família vinculada.' }, { status: 400 });
    }

    if (currentUser.role === Role.DEPENDENT) {
      return NextResponse.json({ error: 'Acesso negado. Dependentes não podem gerenciar recompensas.' }, { status: 403 });
    }

    const { id } = await params;

    // Validação de Segurança
    const targetReward = await prisma.reward.findUnique({
      where: { id },
      select: { familyId: true },
    });

    if (!targetReward || targetReward.familyId !== currentUser.familyId) {
      return NextResponse.json({ error: 'Acesso negado. Recompensa não pertence à sua família.' }, { status: 403 });
    }

    const { title, description, pointsCost, imageUrl } = await req.json();

    if (!title || pointsCost === undefined || pointsCost <= 0) {
      return NextResponse.json({ error: 'Título e custo de pontos (maior que zero) são obrigatórios.' }, { status: 400 });
    }

    const updatedReward = await prisma.reward.update({
      where: { id },
      data: {
        title,
        description: description || null,
        pointsCost: Number(pointsCost),
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Recompensa atualizada com sucesso!',
      reward: updatedReward,
    });
  } catch (error) {
    console.error('Erro na rota PUT de recompensa:', error);
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
      select: { familyId: true, role: true },
    });
    if (!currentUser || !currentUser.familyId) {
      return NextResponse.json({ error: 'Você não possui uma família vinculada.' }, { status: 400 });
    }

    if (currentUser.role === Role.DEPENDENT) {
      return NextResponse.json({ error: 'Acesso negado. Dependentes não podem gerenciar recompensas.' }, { status: 403 });
    }

    const { id } = await params;

    // Validação de Segurança
    const targetReward = await prisma.reward.findUnique({
      where: { id },
      select: { familyId: true },
    });

    if (!targetReward || targetReward.familyId !== currentUser.familyId) {
      return NextResponse.json({ error: 'Acesso negado. Recompensa não pertence à sua família.' }, { status: 403 });
    }

    await prisma.reward.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Recompensa excluída com sucesso!',
    });
  } catch (error) {
    console.error('Erro na rota DELETE de recompensa:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
