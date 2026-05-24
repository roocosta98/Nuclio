import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signJWT } from '@/lib/auth';
import { comparePassword } from '@/lib/password';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    // 1. Validação básica de entrada
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    // 2. Busca do usuário pelo email no banco de dados
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Por segurança contra enumeração de emails, retornamos uma mensagem genérica de erro
      return NextResponse.json(
        { error: 'Credenciais inválidas.' },
        { status: 401 }
      );
    }

    // 3. Validação da senha criptografada (bcrypt)
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Credenciais inválidas.' },
        { status: 401 }
      );
    }

    // 4. Criação do Token JWT
    const token = await signJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // 5. Configuração da resposta JSON e Cookies HttpOnly para máxima segurança
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    // Configurando o Cookie seguro
    response.cookies.set('auth_token', token, {
      httpOnly: true, // Protege contra roubo de sessão via JavaScript malicioso (ataques XSS)
      secure: process.env.NODE_ENV === 'production', // Apenas transmite via HTTPS em produção
      sameSite: 'lax', // Proteção contra ataques CSRF
      path: '/', // O cookie fica disponível para todo o site
      maxAge: 60 * 60 * 24, // Expira em 1 dia (em segundos)
    });

    return response;
  } catch (error) {
    console.error('Erro na rota de login:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}
