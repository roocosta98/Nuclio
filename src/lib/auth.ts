import { SignJWT, jwtVerify } from 'jose';

// Converte a chave secreta em um formato legível pela biblioteca jose
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'chave_secreta_super_segura_e_longa_para_gerenciamento_familiar_2026'
);

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

/**
 * Assina um token JWT com as informações básicas do usuário e expiração de 1 dia.
 * Esta função utiliza 'jose' e é 100% compatível com o Edge Runtime do Next.js Middleware.
 */
export async function signJWT(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // O token expira em 24 horas
    .sign(JWT_SECRET);
}

/**
 * Verifica a validade de um token JWT e extrai seu payload.
 * Retorna null se o token for inválido, corrompido ou expirado.
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}
