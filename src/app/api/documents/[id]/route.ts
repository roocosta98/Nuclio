import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { Role } from '@prisma/client';

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
      return NextResponse.json({ error: 'Acesso negado. Dependentes não podem gerenciar documentos.' }, { status: 403 });
    }

    const { id } = await params;

    // Validação de Segurança
    const targetDocument = await prisma.document.findUnique({
      where: { id },
      include: { child: { select: { familyId: true } } },
    });

    if (!targetDocument || targetDocument.child.familyId !== currentUser.familyId) {
      return NextResponse.json({ error: 'Documento não encontrado ou acesso negado.' }, { status: 404 });
    }

    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Documento excluído com sucesso!',
    });
  } catch (error) {
    console.error('Erro na rota DELETE de documentos:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
