import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';
import { hashPassword } from '@/lib/password';
import { Role, RelationshipType, AccessLevel } from '@prisma/client';

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
        { error: 'Você não possui uma família vinculada para cadastrar cuidadores.' },
        { status: 400 }
      );
    }

    const { name, email, password, relationship, accessLevel, childIds, cpf, phone, avatarUrl } = await req.json();

    if (!name || !email || !password || !relationship || !accessLevel) {
      return NextResponse.json(
        { error: 'Todos os campos (Nome, E-mail, Senha, Parentesco e Acesso) são obrigatórios.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha do cuidador deve ter no mínimo 6 caracteres.' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este e-mail de cuidador já está cadastrado no sistema.' },
        { status: 409 }
      );
    }

    const hashed = await hashPassword(password);

    // Transação Atômica: Criar o cuidador e vinculá-lo a múltiplas crianças (childIds)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Criar o Usuário Cuidador
      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash: hashed,
          role: Role.ADMIN,
          familyId: currentUser.familyId,
          cpf: cpf || null,
          phone: phone || null,
          avatarUrl: avatarUrl || null,
        },
      });

      // 2. Vincular a múltiplas crianças se childIds for um array
      const links = [];
      if (childIds && Array.isArray(childIds)) {
        for (const childId of childIds) {
          const link = await tx.guardianChild.create({
            data: {
              userId: user.id,
              childId: childId,
              relationship: relationship as RelationshipType,
              accessLevel: accessLevel as AccessLevel,
            },
          });
          links.push(link);
        }
      }

      return { user, links };
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Cuidador cadastrado com sucesso!',
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        },
        links: result.links,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro na rota de criação de cuidadores:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}

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

    const caregivers = await prisma.user.findMany({
      where: {
        familyId: currentUser.familyId,
        role: {
          not: Role.DEPENDENT,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        cpf: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
        guardianOf: {
          select: {
            childId: true,
            relationship: true,
            accessLevel: true,
            child: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(caregivers, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar cuidadores:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}

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
        { error: 'Você não possui uma família vinculada para editar cuidadores.' },
        { status: 400 }
      );
    }

    const { id, name, email, password, relationship, accessLevel, childIds, cpf, phone, avatarUrl } = await req.json();

    if (!id || !name || !email) {
      return NextResponse.json(
        { error: 'ID, Nome e E-mail são obrigatórios.' },
        { status: 400 }
      );
    }

    // Validação de Segurança: Garante que o cuidador pertence à mesma família do usuário logado
    const targetCaregiver = await prisma.user.findUnique({
      where: { id: id },
      select: { familyId: true },
    });

    if (!targetCaregiver || targetCaregiver.familyId !== currentUser.familyId) {
      return NextResponse.json(
        { error: 'Acesso negado. Este cuidador não pertence à sua família.' },
        { status: 403 }
      );
    }

    // Transação Atômica: Atualizar os dados do cuidador e atualizar seus vínculos com as crianças
    const updatedUser = await prisma.$transaction(async (tx) => {
      // 1. Atualizar informações de cadastro do usuário
      const dataToUpdate: any = {
        name,
        email: email.toLowerCase(),
      };

      if (cpf !== undefined) dataToUpdate.cpf = cpf || null;
      if (phone !== undefined) dataToUpdate.phone = phone || null;
      if (avatarUrl !== undefined) dataToUpdate.avatarUrl = avatarUrl || null;

      if (password) {
        dataToUpdate.passwordHash = await hashPassword(password);
      }

      const user = await tx.user.update({
        where: { id: id },
        data: dataToUpdate,
      });

      // 2. Limpar os vínculos antigos de crianças na tabela intermediária
      await tx.guardianChild.deleteMany({
        where: { userId: id },
      });

      // 3. Cadastrar os novos vínculos de crianças (se informados no array)
      const links = [];
      if (childIds && Array.isArray(childIds)) {
        for (const childId of childIds) {
          const link = await tx.guardianChild.create({
            data: {
              userId: id,
              childId: childId,
              relationship: (relationship || 'OUTRO') as RelationshipType,
              accessLevel: (accessLevel || 'READ') as AccessLevel,
            },
          });
          links.push(link);
        }
      }

      return { user, links };
    });

    return NextResponse.json({
      success: true,
      message: 'Dados do Cuidador e seus vínculos atualizados com sucesso!',
      user: updatedUser.user,
      links: updatedUser.links,
    });
  } catch (error) {
    console.error('Erro na rota de edição de cuidadores:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}
