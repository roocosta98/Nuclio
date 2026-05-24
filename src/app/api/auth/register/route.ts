import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { Role } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, familyName, cpf, phone, avatarUrl } = await req.json();

    // 1. Validação básica de entrada
    if (!name || !email || !password || !familyName) {
      return NextResponse.json(
        { error: 'Todos os campos (Nome, E-mail, Senha e Nome da Família) são obrigatórios.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve conter no mínimo 6 caracteres.' },
        { status: 400 }
      );
    }

    // 2. Verifica se o email já está cadastrado
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este e-mail já está cadastrado.' },
        { status: 409 }
      );
    }

    // 3. Verifica se o CPF (se fornecido) já está cadastrado
    if (cpf) {
      const existingCpf = await prisma.user.findUnique({
        where: { cpf: cpf },
      });
      if (existingCpf) {
        return NextResponse.json(
          { error: 'Este CPF já está cadastrado.' },
          { status: 409 }
        );
      }
    }

    // 4. Criptografia da senha
    const hashed = await hashPassword(password);

    // 5. Transação Atômica: Criar a Família Única e o SuperAdmin vinculados
    const result = await prisma.$transaction(async (tx) => {
      // Criar o registro único da Família
      const family = await tx.family.create({
        data: {
          name: familyName,
        },
      });

      // Criar o Usuário com papel SUPER_ADMIN vinculado a esta família com campos adicionais
      const user = await tx.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash: hashed,
          role: Role.SUPER_ADMIN,
          familyId: family.id,
          cpf: cpf || null,
          phone: phone || null,
          avatarUrl: avatarUrl || null,
        },
      });

      return { family, user };
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Cadastro inicial realizado com sucesso!',
        family: result.family,
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro na rota de cadastro inicial:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}
