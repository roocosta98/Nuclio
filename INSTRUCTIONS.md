# Guia de Inicialização do Projeto: gerenciamento_familiar

Este projeto foi configurado com **Next.js (App Router + TypeScript)** e um banco de dados **PostgreSQL** rodando localmente via **Docker Compose**.

## 🚀 Passo a Passo para Subir o Ambiente

### 1. Inicializar o Next.js
Como o Docker Compose espera encontrar os arquivos do Next.js (como `package.json` e `src/`) na raiz para realizar o build, você deve criar o projeto Next.js primeiro.

Abra o terminal na pasta raiz do projeto (`c:\Users\rooco\Documents\gerenciamento_familiar`) e execute:

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

> **Nota:** Quando o instalador perguntar se deseja sobrescrever ou mesclar arquivos existentes, pode confirmar. Ele não irá apagar os arquivos Docker criados (`Dockerfile` e `docker-compose.yml`).

---

### 2. Configurar as Variáveis de Ambiente
Antes de rodar o Docker Compose, copie o arquivo `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

Abra o arquivo `.env.local` e ajuste a senha em `DB_PASSWORD` e na `DATABASE_URL` se desejar.

---

### 3. Executar o Docker Compose pela primeira vez
Para construir a imagem do container do Next.js e subir o banco de dados PostgreSQL com persistência de dados, execute:

```bash
docker-compose up --build
```

#### O que este comando faz?
1. **Builda a imagem do Next.js** otimizada para desenvolvimento a partir do `Dockerfile`.
2. **Cria e inicia o container `db` (PostgreSQL 16)** e verifica sua saúde (`healthcheck`).
3. **Cria e inicia o container `web` (Next.js)** assim que o banco de dados estiver pronto e aceitando conexões.
4. **Habilita o Hot Reloading:** As alterações que você fizer nos arquivos da sua máquina local serão refletidas instantaneamente dentro do container.

---

## 🛠️ Detalhes das Otimizações Realizadas

### Dockerfile (`Dockerfile`)
- **Node.js 22 (LTS) no Alpine Linux:** Uma imagem extremamente leve e rápida.
- **Cache Otimizado:** Copiamos apenas os arquivos de dependência (`package.json`, lockfiles) antes do resto do código para evitar reinstalações demoradas quando você alterar apenas código-fonte.
- **Detecção Inteligente de Lockfile:** O container detecta automaticamente se você está usando `npm`, `yarn`, `pnpm` ou `bun` e instala usando o comando correto de forma congelada (`frozen-lockfile`/`ci`).

### Docker Compose (`docker-compose.yml`)
- **Volumes Anônimos para Node Modules (`/app/node_modules`):** Impede que o `node_modules` gerado localmente no Windows sobrescreva os pacotes compilados especificamente para a arquitetura Linux do container. Isso evita erros comuns de compilação binária (como node-gyp ou compilers nativos).
- **Healthcheck do Postgres:** O container do Next.js só inicia após o PostgreSQL estar 100% pronto para receber conexões. Isso previne que a aplicação falhe ao tentar se conectar ao banco na inicialização.
