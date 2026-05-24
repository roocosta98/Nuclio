import bcrypt from 'bcryptjs';

/**
 * Cria o hash criptografado (salvamento seguro) a partir de uma senha em texto puro.
 * Esta função utiliza 'bcryptjs' que depende de APIs do ambiente Node.js.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compara uma senha fornecida com o hash armazenado no banco de dados.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
