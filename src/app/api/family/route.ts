import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { Role, FamilyType } from '@prisma/client';

// 1. GET: Retornar dados de tipo de família e opções de guarda da família logada
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

    const family = await prisma.family.findUnique({
      where: { id: currentUser.familyId },
      select: {
        id: true,
        name: true,
        familyType: true,
        custodyOption: true,
        custodyStartAnchor: true,
        custodyStartParent: true,
        custodyWeekendStart: true,
        custodyWeekendEnd: true,
      },
    });

    return NextResponse.json(family, { status: 200 });
  } catch (error) {
    console.error('Erro ao obter dados de família:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}

// 2. PUT: Atualizar configurações de arranjo familiar e escala de guarda das crianças
export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 401 });
    }

    // Apenas SUPER_ADMIN ou ADMIN podem modificar configurações
    if (payload.role === Role.DEPENDENT) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { familyId: true },
    });

    if (!currentUser || !currentUser.familyId) {
      return NextResponse.json({ error: 'Nenhuma família associada.' }, { status: 400 });
    }

    const { name, familyType, custodyOption, custodyStartAnchor, custodyStartParent, custodyWeekendStart, custodyWeekendEnd } = await req.json();

    if (!name || !familyType) {
      return NextResponse.json(
        { error: 'Nome da família e Tipo de Arranjo são obrigatórios.' },
        { status: 400 }
      );
    }

    // Garante que o familyType é um tipo válido de enum
    const validTypes = [FamilyType.FAMILIA_UNICA, FamilyType.GUARDA_COMPARTILHADA, FamilyType.COPARENTALIDADE];
    if (!validTypes.includes(familyType as FamilyType)) {
      return NextResponse.json(
        { error: 'Tipo de arranjo familiar inválido.' },
        { status: 400 }
      );
    }

    // Atualiza o registro da família com suporte a parâmetros de contagem dinâmica e FDS customizados
    const updatedFamily = await prisma.family.update({
      where: { id: currentUser.familyId },
      data: {
        name,
        familyType: familyType as FamilyType,
        custodyOption: familyType === FamilyType.FAMILIA_UNICA ? null : (custodyOption || null),
        custodyStartAnchor: familyType === FamilyType.FAMILIA_UNICA 
          ? null 
          : (custodyStartAnchor ? new Date(custodyStartAnchor) : null),
        custodyStartParent: familyType === FamilyType.FAMILIA_UNICA 
          ? null 
          : (custodyStartParent || null),
        custodyWeekendStart: familyType === FamilyType.FAMILIA_UNICA
          ? null
          : (custodyWeekendStart !== undefined ? Number(custodyWeekendStart) : 5),
        custodyWeekendEnd: familyType === FamilyType.FAMILIA_UNICA
          ? null
          : (custodyWeekendEnd !== undefined ? Number(custodyWeekendEnd) : 0),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Configurações de arranjo familiar atualizadas com sucesso!',
      family: updatedFamily,
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações de família:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}
