# ♿ Mapa da Acessibilidade

Projeto fullstack para mapeamento e consulta de acessibilidade urbana, composto por uma interface web moderna em **React**, uma API RESTful em **Node.js com TypeScript e Prisma ORM**, e banco de dados **MySQL** orquestrado via **Docker**.

---

## 📁 Estrutura do Projeto

```text
Mapa-Acessibilidade/
├── backend/            # API REST (Node.js, Express, TypeScript, Prisma ORM 7)
├── frontend/           # Interface Web (React 19, TypeScript, Vite)
├── docker-compose.yml  # Orquestração do banco de dados MySQL 8.0
└── README.md           # Documentação geral do projeto
```

---

## ⚙️ Pré-requisitos

Antes de iniciar, certifique-se de ter instalado na sua máquina:

- [Node.js](https://nodejs.org/) (versão **20** ou superior)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (com Docker Compose habilitado)
- [Git](https://git-scm.com/)

---

## 🚀 Como Executar o Projeto

Siga os passos abaixo na ordem indicada para subir o ambiente completo:

### 1️⃣ Subir o Banco de Dados (MySQL via Docker)

Na **raiz do projeto**, execute:

```bash
docker compose up -d
```

> ℹ️ **Nota de Porta:** O container expõe o MySQL na porta **`3305`** no seu computador (mapeada para a 3306 interna do container), evitando conflitos com outras instâncias locais de MySQL.

Para verificar se o container está saudável:
```bash
docker compose ps
```

---

### 2️⃣ Configurar e Iniciar o Backend

Abra um terminal e entre na pasta `backend`:

```bash
cd backend
```

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Configure as variáveis de ambiente:**
   Se ainda não existir o arquivo `.env`, crie-o copiando o modelo:
   ```bash
   cp .env.example .env
   ```
   *(No Windows PowerShell, use: `copy .env.example .env`)*

3. **Gere os tipos do Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

4. **Teste a conexão com o banco de dados:**
   ```bash
   npm run test:db
   ```
   *Você deverá ver a mensagem: `CONEXAO COM O BANCO DE DADOS REALIZADA COM SUCESSO!`*

5. **Inicie o servidor em modo de desenvolvimento:**
   ```bash
   npm run dev
   ```

A API estará disponível em: **`http://localhost:3000`**

#### 🔍 Endpoints Iniciais de Teste
- **`GET http://localhost:3000/`**: Informações da API e status da conexão com o banco.
- **`GET http://localhost:3000/api/health`**: Health check detalhado da aplicação.

---

### 3️⃣ Iniciar o Frontend (React)

Abra um **segundo terminal** e entre na pasta `frontend`:

```bash
cd frontend
```

1. **Instale as dependências:**
   ```bash
   npm install
   ```

2. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

A aplicação React estará acessível no seu navegador em: **`http://localhost:5173`**

---

## 🔐 Variáveis de Ambiente (`backend/.env`)

As principais variáveis configuradas no `backend/.env` são:

| Variável | Valor Padrão | Descrição |
| :--- | :--- | :--- |
| `PORT` | `3000` | Porta onde o servidor Express responde |
| `NODE_ENV` | `development` | Ambiente de execução |
| `DB_HOST` | `localhost` | Host do banco de dados |
| `DB_PORT` | `3305` | Porta mapeada no Docker para o MySQL |
| `DB_NAME` | `mapa_acessibilidade` | Nome do banco de dados |
| `DB_USER` | `root` | Usuário do banco |
| `DB_PASSWORD` | `rootpassword` | Senha do banco |
| `DB_ROOT_PASSWORD` | `rootpassword` | Senha de root do MySQL |
| `DATABASE_URL` | `mysql://root:rootpassword@localhost:3305/mapa_acessibilidade?allowPublicKeyRetrieval=true` | String de conexão completa usada pelo Prisma ORM |

---

## 🛠️ Comandos Úteis do Dia a Dia

### Docker
- **Subir o banco em segundo plano:** `docker compose up -d`
- **Parar o banco:** `docker compose down`
- **Ver logs do banco:** `docker compose logs -f mysql`

### Backend (`/backend`)
- **Rodar em desenvolvimento com hot-reload:** `npm run dev`
- **Testar apenas a conexão do banco:** `npm run test:db`
- **Compilar o TypeScript:** `npm run build`
- **Iniciar o build de produção:** `npm run start`
- **Regenerar o Prisma Client:** `npm run prisma:generate`

### Frontend (`/frontend`)
- **Rodar em desenvolvimento:** `npm run dev`
- **Compilar para produção:** `npm run build`
- **Executar linter:** `npm run lint`

