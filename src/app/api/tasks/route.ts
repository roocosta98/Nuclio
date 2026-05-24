import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { Role, Recurrence } from '@prisma/client';

// 1. GET: Listar tarefas de uma criança (filtrando por childId)
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

    // Busca o usuário atual e seu familyId
    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { familyId: true, role: true, name: true },
    });

    if (!currentUser || !currentUser.familyId) {
      return NextResponse.json(
        { error: 'Você não possui uma família vinculada.' },
        { status: 400 }
      );
    }

    // Self-healing reset de tarefas recorrentes concluídas em dias anteriores
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const completedRecurrentTasks = await prisma.task.findMany({
      where: {
        familyId: currentUser.familyId,
        isCompleted: true,
        recurrence: { not: 'NONE' },
        updatedAt: { lt: todayStart }
      },
      select: { id: true }
    });

    if (completedRecurrentTasks.length > 0) {
      await prisma.task.updateMany({
        where: {
          id: { in: completedRecurrentTasks.map(t => t.id) }
        },
        data: {
          isCompleted: false
        }
      });
    }

    const { searchParams } = new URL(req.url);
    let childId = searchParams.get('childId');

    // Se o usuário logado for DEPENDENT (Criança) e nenhum childId for fornecido,
    // usamos o vínculo 1-para-1 direto com o userId da sessão
    if (currentUser.role === Role.DEPENDENT && !childId) {
      const matchedChild = await prisma.child.findUnique({
        where: { userId: payload.userId },
      });
      if (matchedChild) {
        childId = matchedChild.id;
      }
    }

    // Se não houver childId fornecido, retornamos TODAS as tarefas da família (para a home/linha do tempo)
    if (!childId) {
      const tasks = await prisma.task.findMany({
        where: {
          familyId: currentUser.familyId,
        },
        include: {
          child: { select: { id: true, name: true, avatarUrl: true } },
          caregiver: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(tasks, { status: 200 });
    }

    // Validação de Segurança: A criança deve pertencer à mesma família do usuário logado
    const targetChild = await prisma.child.findUnique({
      where: { id: childId },
      select: { familyId: true },
    });

    if (!targetChild || targetChild.familyId !== currentUser.familyId) {
      return NextResponse.json(
        { error: 'Acesso negado. Esta criança não pertence à sua família.' },
        { status: 403 }
      );
    }

    // Busca as tarefas da criança ordenadas pelas mais novas
    const tasks = await prisma.task.findMany({
      where: {
        childId: childId,
        familyId: currentUser.familyId,
      },
      include: {
        child: { select: { id: true, name: true, avatarUrl: true } },
        caregiver: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tasks, { status: 200 });
  } catch (error) {
    console.error('Erro na rota GET de tarefas:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}

// 2. POST: Criar uma nova tarefa para a criança (apenas Cuidadores)
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
      return NextResponse.json(
        { error: 'Você não possui uma família vinculada.' },
        { status: 400 }
      );
    }

    // Regra de segurança: Apenas SUPER_ADMIN e ADMIN podem criar tarefas
    if (currentUser.role === Role.DEPENDENT) {
      return NextResponse.json(
        { error: 'Acesso negado. Dependentes não podem criar tarefas.' },
        { status: 403 }
      );
    }

    const { title, description, childId, caregiverId, dueDate, recurrence, points } = await req.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Título é obrigatório.' },
        { status: 400 }
      );
    }

    if (!childId && !caregiverId) {
      return NextResponse.json(
        { error: 'A tarefa deve ser atribuída a uma criança ou a um cuidador.' },
        { status: 400 }
      );
    }

    // Validação de Segurança: A criança deve pertencer à mesma família do usuário logado
    if (childId) {
      const targetChild = await prisma.child.findUnique({
        where: { id: childId },
        select: { familyId: true },
      });

      if (!targetChild || targetChild.familyId !== currentUser.familyId) {
        return NextResponse.json(
          { error: 'Acesso negado. Esta criança não pertence à sua família.' },
          { status: 403 }
        );
      }
    }

    // Validação de Segurança: O cuidador deve pertencer à mesma família do usuário logado
    if (caregiverId) {
      const targetCaregiver = await prisma.user.findUnique({
        where: { id: caregiverId },
        select: { familyId: true },
      });

      if (!targetCaregiver || targetCaregiver.familyId !== currentUser.familyId) {
        return NextResponse.json(
          { error: 'Acesso negado. Este cuidador não pertence à sua família.' },
          { status: 403 }
        );
      }
    }

    // Cria a tarefa no banco
    const newTask = await prisma.task.create({
      data: {
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        recurrence: (recurrence || 'NONE') as Recurrence,
        childId: childId || null,
        caregiverId: caregiverId || null,
        points: points !== undefined ? Math.max(0, Number(points)) : 10,
        familyId: currentUser.familyId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Tarefa criada com sucesso!',
        task: newTask,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro na rota POST de tarefas:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}

// 3. PATCH: Atualizar o status de uma tarefa (isCompleted: true/false)
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
      select: { familyId: true },
    });

    if (!currentUser || !currentUser.familyId) {
      return NextResponse.json(
        { error: 'Você não possui uma família vinculada.' },
        { status: 400 }
      );
    }

    const { id, isCompleted } = await req.json();

    if (!id || isCompleted === undefined) {
      return NextResponse.json(
        { error: 'ID e status de conclusão são obrigatórios.' },
        { status: 400 }
      );
    }

    // Validação de Segurança: A tarefa deve pertencer à mesma família do usuário logado
    const targetTask = await prisma.task.findUnique({
      where: { id },
      select: { familyId: true, isCompleted: true, points: true, childId: true },
    });

    if (!targetTask || targetTask.familyId !== currentUser.familyId) {
      return NextResponse.json(
        { error: 'Acesso negado. Esta tarefa não pertence à sua família.' },
        { status: 403 }
      );
    }

    const nextStatus = Boolean(isCompleted);

    // Atualiza status e gerencia pontos em uma transação atômica
    const result = await prisma.$transaction(async (tx) => {
      // 1. Atualiza a tarefa no banco
      const updated = await tx.task.update({
        where: { id },
        data: {
          isCompleted: nextStatus,
        },
      });

      // 2. Se for tarefa de criança e o status realmente mudou, atualiza saldo
      if (targetTask.childId && targetTask.isCompleted !== nextStatus) {
        await tx.child.update({
          where: { id: targetTask.childId },
          data: {
            points: {
              increment: nextStatus ? targetTask.points : -targetTask.points,
            },
          },
        });
      }

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: 'Status da tarefa atualizado com sucesso!',
      task: result,
    });
  } catch (error) {
    console.error('Erro na rota PATCH de tarefas:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}
