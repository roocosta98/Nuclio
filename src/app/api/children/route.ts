import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { Role } from '@prisma/client';
import { hashPassword } from '@/lib/password';

// 1. POST: Cadastrar Criança (e criar conta de login de Dependente se fornecido)
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
      select: { familyId: true },
    });

    if (!currentUser || !currentUser.familyId) {
      return NextResponse.json(
        { error: 'Você não possui uma família vinculada para cadastrar crianças.' },
        { status: 400 }
      );
    }

    const { name, birthDate, avatarUrl, email, password, primaryResidenceId } = await req.json();

    if (!name) {
      return NextResponse.json(
        { error: 'O nome da criança é obrigatório.' },
        { status: 400 }
      );
    }

    // Se informou e-mail para acesso, faz validações adicionais
    let hashed = '';
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: 'Este e-mail de acesso já está cadastrado por outro usuário.' },
          { status: 409 }
        );
      }
      if (!password || password.length < 6) {
        return NextResponse.json(
          { error: 'A senha do dependente é obrigatória e deve ter no mínimo 6 caracteres.' },
          { status: 400 }
        );
      }
      hashed = await hashPassword(password);
    }

    // Transação Atômica: Se e-mail/senha passados, cria o User DEPENDENT e vincula à Criança
    const newChild = await prisma.$transaction(async (tx) => {
      let createdUserId: string | null = null;

      if (email && hashed) {
        const dependentUser = await tx.user.create({
          data: {
            name,
            email: email.toLowerCase(),
            passwordHash: hashed,
            role: Role.DEPENDENT,
            familyId: currentUser.familyId,
          },
        });
        createdUserId = dependentUser.id;
      }

      const child = await tx.child.create({
        data: {
          name,
          birthDate: birthDate ? new Date(birthDate) : null,
          avatarUrl: avatarUrl || null,
          familyId: currentUser.familyId as string,
          userId: createdUserId,
          primaryResidenceId: primaryResidenceId || null,
        },
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      return child;
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Criança cadastrada com sucesso!',
        child: newChild,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro na rota de criação de crianças:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}

// 2. GET: Listar crianças (inclui e-mail de login se tiver)
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
      return NextResponse.json([], { status: 200 });
    }

    const children = await prisma.child.findMany({
      where: { familyId: currentUser.familyId },
      include: {
        user: {
          select: {
            email: true,
          },
        },
        primaryResidence: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(children, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar lista de crianças:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}

// 3. PUT: Atualizar Criança (e atualizar/criar conta de login)
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

    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { familyId: true },
    });

    if (!currentUser || !currentUser.familyId) {
      return NextResponse.json(
        { error: 'Você não possui uma família vinculada para editar crianças.' },
        { status: 400 }
      );
    }

    const { id, name, birthDate, avatarUrl, email, password, primaryResidenceId } = await req.json();

    if (!id || !name) {
      return NextResponse.json(
        { error: 'ID e Nome da criança são obrigatórios.' },
        { status: 400 }
      );
    }

    // Validação de Segurança: Garante que a criança pertence à mesma família
    const targetChild = await prisma.child.findUnique({
      where: { id: id },
      select: { familyId: true, userId: true },
    });

    if (!targetChild || targetChild.familyId !== currentUser.familyId) {
      return NextResponse.json(
        { error: 'Acesso negado. Esta criança não pertence à sua família.' },
        { status: 403 }
      );
    }

    // Transação Atômica para atualizar dados e sincronizar perfil de Usuário DEPENDENT
    const updatedChild = await prisma.$transaction(async (tx) => {
      let linkedUserId = targetChild.userId;

      // 1. Caso o cuidador queira ativar a conta ou atualizar o e-mail
      if (email) {
        if (linkedUserId) {
          // Já possuía conta, atualiza o e-mail
          // Verifica se o e-mail não foi tomado por outro usuário
          const conflictingUser = await tx.user.findFirst({
            where: {
              email: email.toLowerCase(),
              id: { not: linkedUserId },
            },
          });
          if (conflictingUser) {
            throw new Error('Este e-mail de acesso já está cadastrado por outro usuário.');
          }

          const userUpdateData: any = {
            name,
            email: email.toLowerCase(),
          };

          if (password) {
            userUpdateData.passwordHash = await hashPassword(password);
          }

          await tx.user.update({
            where: { id: linkedUserId },
            data: userUpdateData,
          });
        } else {
          // Não possuía conta, cria uma nova
          const conflictingUser = await tx.user.findUnique({
            where: { email: email.toLowerCase() },
          });
          if (conflictingUser) {
            throw new Error('Este e-mail de acesso já está cadastrado por outro usuário.');
          }

          if (!password || password.length < 6) {
            throw new Error('A senha do dependente é obrigatória para criar a conta e deve ter no mínimo 6 caracteres.');
          }

          const hashedPass = await hashPassword(password);
          const newDepUser = await tx.user.create({
            data: {
              name,
              email: email.toLowerCase(),
              passwordHash: hashedPass,
              role: Role.DEPENDENT,
              familyId: currentUser.familyId,
            },
          });
          linkedUserId = newDepUser.id;
        }
      }

      // 2. Atualiza os dados da criança
      const child = await tx.child.update({
        where: { id: id },
        data: {
          name,
          birthDate: birthDate ? new Date(birthDate) : null,
          avatarUrl: avatarUrl !== undefined ? (avatarUrl || null) : undefined,
          userId: linkedUserId, // Seta o userId caso tenha sido criado
          primaryResidenceId: primaryResidenceId !== undefined ? (primaryResidenceId || null) : undefined,
        },
        include: {
          user: {
            select: {
              email: true,
            },
          },
          primaryResidence: {
            select: {
              id: true,
              name: true,
            }
          }
        },
      });

      return child;
    });

    return NextResponse.json({
      success: true,
      message: 'Criança e credenciais atualizadas com sucesso!',
      child: updatedChild,
    });
  } catch (error: any) {
    console.error('Erro na rota de edição de crianças:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}
