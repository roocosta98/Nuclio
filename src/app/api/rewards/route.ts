import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { Role } from '@prisma/client';

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
      return NextResponse.json([], { status: 200 });
    }
    const rewards = await prisma.reward.findMany({
      where: { familyId: currentUser.familyId },
      orderBy: { pointsCost: 'asc' },
    });
    return NextResponse.json(rewards, { status: 200 });
  } catch (error) {
    console.error('Erro na rota GET de recompensas:', error);
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
      select: { familyId: true, role: true },
    });
    if (!currentUser || !currentUser.familyId) {
      return NextResponse.json({ error: 'Você não possui uma família vinculada.' }, { status: 400 });
    }

    if (currentUser.role === Role.DEPENDENT) {
      return NextResponse.json({ error: 'Acesso negado. Dependentes não podem cadastrar recompensas.' }, { status: 403 });
    }

    const { title, description, pointsCost, imageUrl } = await req.json();

    if (!title || pointsCost === undefined || pointsCost <= 0) {
      return NextResponse.json({ error: 'Título e custo de pontos (maior que zero) são obrigatórios.' }, { status: 400 });
    }

    const newReward = await prisma.reward.create({
      data: {
        title,
        description: description || null,
        pointsCost: Number(pointsCost),
        imageUrl: imageUrl || null,
        familyId: currentUser.familyId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Recompensa cadastrada com sucesso!',
      reward: newReward,
    }, { status: 201 });
  } catch (error) {
    console.error('Erro na rota POST de recompensas:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
