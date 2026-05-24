require('dotenv').config({ path: '.env' });
console.log("DATABASE_URL carregada do .env:", process.env.DATABASE_URL);

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Tentando se conectar ao banco de dados usando o Prisma local...");
    const users = await prisma.user.findMany();
    console.log("SUCESSO! Conexão estabelecida. Total de usuários no banco:", users.length);
  } catch (error) {
    console.error("ERRO DE CONEXÃO ENCONTRADO:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
