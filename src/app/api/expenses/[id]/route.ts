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
      return NextResponse.json({ error: 'Acesso negado. Dependentes não excluem despesas.' }, { status: 403 });
    }

    const { id } = await params;

    // Validação de Segurança: A despesa deve pertencer à mesma família do usuário logado
    const targetExpense = await prisma.expense.findUnique({
      where: { id },
      select: { familyId: true },
    });

    if (!targetExpense || targetExpense.familyId !== currentUser.familyId) {
      return NextResponse.json(
        { error: 'Acesso negado. Esta despesa não pertence à sua família.' },
        { status: 403 }
      );
    }

    await prisma.expense.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Despesa excluída com sucesso!',
    });
  } catch (error) {
    console.error('Erro na rota DELETE de despesas:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}

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
      return NextResponse.json({ error: 'Acesso negado. Dependentes não editam despesas.' }, { status: 403 });
    }

    const { id } = await params;
    const { receiptData } = await req.json();

    if (!receiptData) {
      return NextResponse.json({ error: 'O comprovante de pagamento é obrigatório.' }, { status: 400 });
    }

    // Validação de Segurança: A despesa deve pertencer à mesma família do usuário logado
    const targetExpense = await prisma.expense.findUnique({
      where: { id },
      select: { familyId: true },
    });

    if (!targetExpense || targetExpense.familyId !== currentUser.familyId) {
      return NextResponse.json(
        { error: 'Acesso negado. Esta despesa não pertence à sua família.' },
        { status: 403 }
      );
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        receiptData,
        isPaid: true,
      },
      include: {
        paidBy: { select: { id: true, name: true, avatarUrl: true } },
        child: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Comprovante anexado e pagamento confirmado!',
      expense: updatedExpense,
    });
  } catch (error) {
    console.error('Erro na rota PUT de despesas:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
