import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Captura o token JWT seguro salvo nos cookies HttpOnly
  const token = req.cookies.get('auth_token')?.value;

  // 1. Identificar os tipos de rotas acessadas
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isAuthRoute = pathname === '/login' || pathname === '/register';

  const validRoles = ['SUPER_ADMIN', 'ADMIN', 'DEPENDENT'];

  // 2. Proteção de Rotas Administrativas e de Dashboard
  if (isDashboardRoute) {
    // Caso não exista o token, redireciona o usuário para o login
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Validação criptográfica do token
    const payload = await verifyJWT(token);

    // Se o token for inválido, corrompido ou expirado
    if (!payload) {
      const response = NextResponse.redirect(new URL('/login', req.url));
      response.cookies.delete('auth_token'); // Remove o cookie inválido por segurança
      return response;
    }

    // Permite acesso apenas a papéis conhecidos no sistema
    if (!validRoles.includes(payload.role)) {
      const response = NextResponse.redirect(new URL('/login?error=forbidden', req.url));
      response.cookies.delete('auth_token');
      return response;
    }

    // Regra de Negócio: Se for DEPENDENT (Criança), possui acesso limitado
    if (payload.role === 'DEPENDENT') {
      const isAllowedChildPath = pathname === '/dashboard/child-view' || pathname === '/dashboard/calendar';
      if (!isAllowedChildPath) {
        return NextResponse.redirect(new URL('/dashboard/child-view', req.url));
      }
    } else {
      // Se for SUPER_ADMIN ou ADMIN (Cuidador) e acessar a raiz, mantemos o dashboard padrão.
      // Se tentar acessar a visualização de criança, permitimos ou redirecionamos para o dashboard normal.
      if (pathname === '/dashboard/child-view') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }
  }

  // 3. Melhoria na Experiência do Usuário (UX)
  // Se o usuário já está logado e tenta acessar telas de login/cadastro, redireciona direto para o dashboard
  if (isAuthRoute && token) {
    const payload = await verifyJWT(token);
    if (payload && validRoles.includes(payload.role)) {
      const destination = payload.role === 'DEPENDENT' ? '/dashboard/child-view' : '/dashboard';
      return NextResponse.redirect(new URL(destination, req.url));
    }
  }

  return NextResponse.next();
}

// Configuração do Matcher: O Next.js apenas executará este middleware para as rotas listadas
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register',
  ],
};
