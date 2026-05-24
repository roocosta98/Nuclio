import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { Role, Recurrence } from '@prisma/client';

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

    // Apenas Cuidadores têm acesso total ao financeiro
    if (currentUser.role === Role.DEPENDENT) {
      return NextResponse.json({ error: 'Acesso negado. Crianças não visualizam painel financeiro.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const childId = searchParams.get('childId');
    const expenseType = searchParams.get('expenseType');

    const expenses = await prisma.expense.findMany({
      where: {
        familyId: currentUser.familyId,
        ...(childId ? { childId } : {}),
        ...(expenseType ? { expenseType } : {}),
      },
      include: {
        paidBy: { select: { id: true, name: true, avatarUrl: true } },
        child: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(expenses, { status: 200 });
  } catch (error) {
    console.error('Erro na rota GET de despesas:', error);
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
      return NextResponse.json({ error: 'Acesso negado. Dependentes não lançam despesas.' }, { status: 403 });
    }

    const { 
      description, 
      amount, 
      date, 
      expenseType, 
      recurrence, 
      childId, 
      paidById,
      toBeSplit,
      isPaid,
      receiptData
    } = await req.json();

    if (!description || amount === undefined || !date || !childId || !paidById) {
      return NextResponse.json({ error: 'Descrição, valor, data, filho e pagador são obrigatórios.' }, { status: 400 });
    }

    // Validação de Segurança do Filho
    const child = await prisma.child.findUnique({
      where: { id: childId },
      select: { familyId: true },
    });
    if (!child || child.familyId !== currentUser.familyId) {
      return NextResponse.json({ error: 'Criança inválida ou não pertence à sua família.' }, { status: 403 });
    }

    // Validação de Segurança do Pagador
    const paidBy = await prisma.user.findUnique({
      where: { id: paidById },
      select: { familyId: true },
    });
    if (!paidBy || paidBy.familyId !== currentUser.familyId) {
      return NextResponse.json({ error: 'Pagador inválido ou não pertence à sua família.' }, { status: 403 });
    }

    const calculatedIsPaid = receiptData ? true : (isPaid !== undefined ? Boolean(isPaid) : false);
    const parsedAmount = Math.max(0, Number(amount));

    // Se a despesa for para dividir (toBeSplit), criamos 2 despesas de metade do valor
    if (toBeSplit) {
      // 1. Buscar o pagador selecionado para obter o nome
      const selectedPayer = await prisma.user.findUnique({
        where: { id: paidById },
        select: { name: true }
      });
      const payerName = selectedPayer?.name || 'Responsável';

      // 2. Buscar outros cuidadores na mesma família
      const otherCaregivers = await prisma.user.findMany({
        where: {
          familyId: currentUser.familyId,
          role: { not: Role.DEPENDENT },
          id: { not: paidById },
        },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });

      if (otherCaregivers.length > 0) {
        const otherCg = otherCaregivers[0];
        const halfAmount = parsedAmount / 2;

        const result = await prisma.$transaction(async (tx) => {
          // Criar a metade do pagador atual
          const expense1 = await tx.expense.create({
            data: {
              description: `${description} (1/2 - ${payerName})`,
              amount: halfAmount,
              date: new Date(date),
              expenseType,
              recurrence: (recurrence || 'NONE') as Recurrence,
              toBeSplit: false, // Já está dividida!
              isPaid: calculatedIsPaid,
              receiptData: receiptData || null,
              paidById,
              childId,
              familyId: currentUser.familyId as string,
            },
            include: {
              paidBy: { select: { id: true, name: true } },
              child: { select: { id: true, name: true } },
            },
          });

          // Criar a metade do outro cuidador
          await tx.expense.create({
            data: {
              description: `${description} (2/2 - ${otherCg.name})`,
              amount: halfAmount,
              date: new Date(date),
              expenseType,
              recurrence: (recurrence || 'NONE') as Recurrence,
              toBeSplit: false, // Já está dividida!
              isPaid: false, // Começa como pendente
              receiptData: null,
              paidById: otherCg.id,
              childId,
              familyId: currentUser.familyId as string,
            }
          });

          return expense1;
        });

        return NextResponse.json({
          success: true,
          message: 'Despesa dividida 50/50 e lançada para ambos os responsáveis!',
          expense: result,
        }, { status: 201 });
      }
    }

    // Se NÃO for dividir (ou se não houver outro cuidador), cria uma despesa única do valor cheio
    const newExpense = await prisma.expense.create({
      data: {
        description,
        amount: parsedAmount,
        date: new Date(date),
        expenseType,
        recurrence: (recurrence || 'NONE') as Recurrence,
        toBeSplit: false,
        isPaid: calculatedIsPaid,
        receiptData: receiptData || null,
        paidById,
        childId,
        familyId: currentUser.familyId,
      },
      include: {
        paidBy: { select: { id: true, name: true } },
        child: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Despesa lançada com sucesso!',
      expense: newExpense,
    }, { status: 201 });
  } catch (error) {
    console.error('Erro na rota POST de despesas:', error);
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 });
  }
}
