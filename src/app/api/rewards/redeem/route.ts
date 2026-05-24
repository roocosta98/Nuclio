import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { Role } from '@prisma/client';

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

    const body = await req.json().catch(() => ({}));
    const { rewardId, adminChildId } = body;

    if (!rewardId) {
      return NextResponse.json({ error: 'ID da recompensa é obrigatório.' }, { status: 400 });
    }

    // Buscar a recompensa e validar família
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId },
      select: { id: true, title: true, pointsCost: true, familyId: true },
    });

    if (!reward || reward.familyId !== currentUser.familyId) {
      return NextResponse.json({ error: 'Recompensa não encontrada ou inválida.' }, { status: 404 });
    }

    let childId = '';
    if (currentUser.role === Role.DEPENDENT) {
      const matchedChild = await prisma.child.findUnique({
        where: { userId: payload.userId },
        select: { id: true, points: true },
      });
      if (!matchedChild) {
        return NextResponse.json({ error: 'Perfil infantil não encontrado.' }, { status: 404 });
      }

      if (matchedChild.points < reward.pointsCost) {
        return NextResponse.json({ error: `Pontos insuficientes. Você precisa de ${reward.pointsCost} pontos, mas tem apenas ${matchedChild.points}.` }, { status: 400 });
      }
      childId = matchedChild.id;
    } else {
      if (!adminChildId) {
        return NextResponse.json({ error: 'ID da criança é obrigatório para administradores.' }, { status: 400 });
      }
      const matchedChild = await prisma.child.findUnique({
        where: { id: adminChildId },
        select: { id: true, points: true, familyId: true },
      });
      if (!matchedChild || matchedChild.familyId !== currentUser.familyId) {
        return NextResponse.json({ error: 'Criança inválida.' }, { status: 404 });
      }
      if (matchedChild.points < reward.pointsCost) {
        return NextResponse.json({ error: 'Pontos insuficientes para esta criança.' }, { status: 400 });
      }
      childId = matchedChild.id;
    }

    // Transação Atômica: Deduzir pontos e criar registro de resgate
    const redemption = await prisma.$transaction(async (tx) => {
      const updatedChild = await tx.child.update({
        where: { id: childId },
        data: {
          points: {
            decrement: reward.pointsCost,
          },
        },
      });

      const newRedemption = await tx.rewardRedemption.create({
        data: {
          pointsSpent: reward.pointsCost,
          rewardId: reward.id,
          childId: childId,
          status: 'PENDING',
        },
        include: {
          reward: { select: { title: true } },
          child: { select: { name: true } },
        },
      });

      return { child: updatedChild, redemption: newRedemption };
    });

    return NextResponse.json({
      success: true,
      message: `Sucesso! Resgate de "${reward.title}" realizado com sucesso!`,
      pointsRemaining: redemption.child.points,
      redemption: redemption.redemption,
    });
  } catch (error) {
    console.error('Erro na rota POST de resgate:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
