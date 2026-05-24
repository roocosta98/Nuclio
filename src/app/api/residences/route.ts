import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

// 1. GET: Listar todas as residências da família do usuário logado
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
      return NextResponse.json({ error: 'Nenhuma família associada.' }, { status: 400 });
    }

    const residences = await prisma.residence.findMany({
      where: { familyId: currentUser.familyId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            role: true,
          }
        }
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(residences, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar residências:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}

// 2. POST: Criar uma nova residência vinculada à família
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload || payload.role === 'DEPENDENT') {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { familyId: true },
    });

    if (!currentUser || !currentUser.familyId) {
      return NextResponse.json({ error: 'Nenhuma família associada.' }, { status: 400 });
    }

    const { name, address, userIds } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Nome da residência é obrigatório.' },
        { status: 400 }
      );
    }

    const residence = await prisma.residence.create({
      data: {
        name,
        address: address || null,
        familyId: currentUser.familyId,
        users: {
          connect: Array.isArray(userIds) ? userIds.map((id: string) => ({ id })) : [],
        }
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          }
        }
      }
    });

    return NextResponse.json(residence, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar residência:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}
