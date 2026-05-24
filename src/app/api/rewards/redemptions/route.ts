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
      select: { familyId: true, role: true },
    });

    if (!currentUser || !currentUser.familyId) {
      return NextResponse.json([], { status: 200 });
    }

    let redemptions;
    if (currentUser.role === Role.DEPENDENT) {
      const matchedChild = await prisma.child.findUnique({
        where: { userId: payload.userId },
        select: { id: true },
      });
      if (!matchedChild) {
        return NextResponse.json([], { status: 200 });
      }
      redemptions = await prisma.rewardRedemption.findMany({
        where: { childId: matchedChild.id },
        include: {
          reward: { select: { title: true, description: true } },
          child: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      redemptions = await prisma.rewardRedemption.findMany({
        where: {
          child: { familyId: currentUser.familyId },
        },
        include: {
          reward: { select: { title: true, description: true } },
          child: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json(redemptions, { status: 200 });
  } catch (error) {
    console.error('Erro na rota GET de resgates:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
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
      return NextResponse.json({ error: 'Acesso negado. Apenas pais podem alterar o status do resgate.' }, { status: 403 });
    }

    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'ID e status são obrigatórios.' }, { status: 400 });
    }

    // Validação de Segurança
    const redemption = await prisma.rewardRedemption.findUnique({
      where: { id },
      include: { child: { select: { familyId: true } } },
    });

    if (!redemption || redemption.child.familyId !== currentUser.familyId) {
      return NextResponse.json({ error: 'Resgate não encontrado ou acesso negado.' }, { status: 404 });
    }

    const updatedRedemption = await prisma.rewardRedemption.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      message: 'Status do resgate atualizado com sucesso!',
      redemption: updatedRedemption,
    });
  } catch (error) {
    console.error('Erro na rota PATCH de resgates:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
