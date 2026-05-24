import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { Role } from '@prisma/client';

// 1. GET: Listar reuniões e atas com suas tarefas geradas
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

    // Apenas SUPER_ADMIN e ADMIN (Cuidadores) têm acesso às atas e reuniões
    if (payload.role === Role.DEPENDENT) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { familyId: true },
    });

    if (!currentUser || !currentUser.familyId) {
      return NextResponse.json([], { status: 200 });
    }

    // Busca reuniões da família, incluindo as tarefas e o nome da criança/cuidador associado
    const meetings = await prisma.meeting.findMany({
      where: { familyId: currentUser.familyId },
      include: {
        tasks: {
          include: {
            child: {
              select: {
                name: true,
              },
            },
            caregiver: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(meetings, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar reuniões:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}

// 2. POST: Marcar Reunião + Salvar Ata + Cadastrar listagem de tarefas pendentes em lote
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

    // Apenas Cuidadores criam reuniões
    if (payload.role === Role.DEPENDENT) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
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

    // Recebe título da reunião, data, ata (minutes) e lista de tarefas geradas
    const { title, date, minutes, tasks } = await req.json();

    if (!title || !date) {
      return NextResponse.json(
        { error: 'Título e Data da reunião são obrigatórios.' },
        { status: 400 }
      );
    }

    // Cria a Reunião e as Tarefas associadas atomaticamente na transação
    const result = await prisma.$transaction(async (tx) => {
      // 1. Cria a reunião
      const meeting = await tx.meeting.create({
        data: {
          title,
          date: new Date(date),
          minutes: minutes || null,
          familyId: currentUser.familyId as string,
        },
      });

      // 2. Se houver tarefas geradas, cadastra no banco associadas a ela
      const createdTasks = [];
      if (tasks && Array.isArray(tasks)) {
        for (const t of tasks) {
          if (t.title && (t.childId || t.caregiverId)) {
            if (t.childId) {
              // Verifica se a criança pertence à família
              const child = await tx.child.findUnique({
                where: { id: t.childId },
                select: { familyId: true },
              });

              if (child && child.familyId === currentUser.familyId) {
                const task = await tx.task.create({
                  data: {
                    title: t.title,
                    description: `Gerado a partir da reunião: ${title}`,
                    dueDate: new Date(date), // Vence na data da reunião ou próxima
                    childId: t.childId,
                    familyId: currentUser.familyId as string,
                    meetingId: meeting.id,
                  },
                });
                createdTasks.push(task);
              }
            } else if (t.caregiverId) {
              // Verifica se o cuidador pertence à família
              const caregiver = await tx.user.findUnique({
                where: { id: t.caregiverId },
                select: { familyId: true },
              });

              if (caregiver && caregiver.familyId === currentUser.familyId) {
                const task = await tx.task.create({
                  data: {
                    title: t.title,
                    description: `Gerado a partir da reunião: ${title}`,
                    dueDate: new Date(date), // Vence na data da reunião ou próxima
                    caregiverId: t.caregiverId,
                    familyId: currentUser.familyId as string,
                    meetingId: meeting.id,
                  },
                });
                createdTasks.push(task);
              }
            }
          }
        }
      }

      return { meeting, createdTasks };
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Reunião e tarefas vinculadas salvas com sucesso!',
        meeting: result.meeting,
        tasks: result.createdTasks,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao salvar reunião:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}
