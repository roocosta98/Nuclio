const { Client } = require('pg');

async function testConnection(name, connectionString) {
  console.log(`[TESTE] Conectando com: ${name}...`);
  const client = new Client({ connectionString });
  try {
    await client.connect();
    console.log(`✅ [SUCESSO] ${name} conectou perfeitamente!`);
    const res = await client.query('SELECT NOW()');
    console.log(`   Data/Hora do Banco: ${res.rows[0].now}`);
  } catch (err) {
    console.error(`❌ [FALHA] ${name} falhou:`, err.message);
  } finally {
    await client.end();
  }
}

async function run() {
  // Teste 1: senha 'postgres'
  await testConnection(
    "Senha 'postgres'",
    "postgresql://postgres:postgres@localhost:5432/gerenciamento_db?schema=public"
  );

  // Teste 2: senha 'sua_senha_secreta_aqui'
  await testConnection(
    "Senha 'sua_senha_secreta_aqui'",
    "postgresql://postgres:sua_senha_secreta_aqui@localhost:5432/gerenciamento_db?schema=public"
  );
}

run();
