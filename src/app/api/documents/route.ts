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

    // Bloqueia dependentes conforme especificação de segurança
    if (currentUser.role === Role.DEPENDENT) {
      return NextResponse.json({ error: 'Acesso negado. Dependentes não possuem permissão para ver documentos.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const childId = searchParams.get('childId');

    const documents = await prisma.document.findMany({
      where: {
        child: { familyId: currentUser.familyId },
        ...(childId ? { childId } : {}),
      },
      include: {
        child: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(documents, { status: 200 });
  } catch (error) {
    console.error('Erro na rota GET de documentos:', error);
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
      return NextResponse.json({ error: 'Acesso negado. Dependentes não podem fazer upload de documentos.' }, { status: 403 });
    }

    const { name, fileData, category, size, childId } = await req.json();

    if (!name || !fileData || !category || !childId) {
      return NextResponse.json({ error: 'Nome do arquivo, dados do arquivo, categoria e filho são obrigatórios.' }, { status: 400 });
    }

    // Validação de Segurança
    const targetChild = await prisma.child.findUnique({
      where: { id: childId },
      select: { familyId: true },
    });

    if (!targetChild || targetChild.familyId !== currentUser.familyId) {
      return NextResponse.json({ error: 'Criança inválida ou não pertence à sua família.' }, { status: 403 });
    }

    const newDocument = await prisma.document.create({
      data: {
        name,
        fileData,
        category,
        size: size || '0 KB',
        childId,
      },
      include: {
        child: { select: { name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Documento enviado com sucesso!',
      document: newDocument,
    }, { status: 201 });
  } catch (error) {
    console.error('Erro na rota POST de documentos:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
