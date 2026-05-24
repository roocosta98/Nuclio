import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Sessão encerrada com sucesso.',
    });

    // Remove o cookie seguro limpando seu valor e definindo expiração imediata
    response.cookies.delete('auth_token');

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao encerrar a sessão.' },
      { status: 500 }
    );
  }
}
