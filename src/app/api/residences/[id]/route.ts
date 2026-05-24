import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

// 1. PUT: Atualizar os dados de uma residência específica e seus cuidadores vinculados
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Garante que a residência pertence à família do usuário logado
    const existing = await prisma.residence.findFirst({
      where: { id, familyId: currentUser.familyId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Residência não encontrada ou não pertencente a esta família.' },
        { status: 404 }
      );
    }

    // Atualiza nome/endereço e redefine cuidadores associados (relação set)
    const updated = await prisma.residence.update({
      where: { id },
      data: {
        name,
        address: address || null,
        users: {
          set: Array.isArray(userIds) ? userIds.map((uid: string) => ({ id: uid })) : [],
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

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar residência:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}

// 2. DELETE: Excluir uma residência
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Garante que pertence à família
    const existing = await prisma.residence.findFirst({
      where: { id, familyId: currentUser.familyId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Residência não encontrada.' },
        { status: 404 }
      );
    }

    await prisma.residence.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, message: 'Residência excluída com sucesso!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao excluir residência:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}
