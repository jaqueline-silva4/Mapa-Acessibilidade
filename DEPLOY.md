# 🚀 Guia de Deploy em Produção (VPS + Docker + Nginx + Let's Encrypt)

Este guia reúne todos os passos necessários para colocar o **Acessa+** no ar a partir de uma **VPS nova (Ubuntu/Debian)** com **Docker**, **Git + chave SSH no GitHub**, **Nginx** e **certificado digital HTTPS gratuito via Let's Encrypt**.

> 💡 **Desenvolvimento local:** o arquivo `docker-compose.yml` da raiz continua exclusivo para rodar apenas o MySQL localmente na porta `3305`, conforme descrito no [README.md](./README.md).

---

## 1. Acessar a VPS e atualizar o sistema

Conecte-se ao servidor via SSH:

```bash
ssh root@IP_DA_SUA_VPS
```

Atualize os pacotes e instale utilitários básicos:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl gnupg git ufw
```

### Configurar o Firewall (UFW)

Libere SSH (`22`), HTTP (`80`, necessário para validação do Let's Encrypt) e HTTPS (`443`):

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## 2. Instalar o Docker e o Docker Compose

Instale o Docker oficial com o plugin `docker compose` (Ubuntu/Debian):

```bash
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

> ℹ️ Se sua VPS usar **Debian** em vez de Ubuntu, substitua `linux/ubuntu` por `linux/debian` no comando acima.

Verifique a instalação:

```bash
sudo docker --version
sudo docker compose version
```

Para rodar o Docker sem precisar digitar `sudo` toda vez (recomendado):

```bash
sudo usermod -aG docker $USER
newgrp docker
```

---

## 3. Configurar Git e Chave SSH no GitHub

Configure seu nome e e-mail no Git da VPS:

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

Gere uma nova chave SSH (`ed25519`):

```bash
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"
```
*(Pressione **Enter** em todas as perguntas para salvar no caminho padrão `~/.ssh/id_ed25519`.)*

Inicie o agente SSH e adicione a chave:

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

Exiba a chave pública para copiar:

```bash
cat ~/.ssh/id_ed25519.pub
```

### Adicionar a chave no GitHub
1. Copie toda a linha exibida pelo comando `cat ~/.ssh/id_ed25519.pub` (começa com `ssh-ed25519 ...`).
2. No GitHub, acesse **Settings → SSH and GPG keys → New SSH key**.
3. Dê um título (ex.: `VPS Produção Acessa+`), cole a chave e clique em **Add SSH key**.

Teste a conexão com o GitHub:

```bash
ssh -T git@github.com
```
*(Responda `yes` na primeira conexão. Você verá a mensagem: `Hi <usuario>! You've successfully authenticated...`)*

### Clonar o repositório na VPS

```bash
sudo mkdir -p /opt/apps && sudo chown -R $USER:$USER /opt/apps
cd /opt/apps
git clone git@github.com:SEU_USUARIO/Mapa-Acessibilidade.git
cd Mapa-Acessibilidade
```

---

## 4. Configurar o Domínio (DNS)

No painel DNS do seu provedor de domínio (Registro.br, Cloudflare, Hostinger, etc.), crie um registro do tipo **A**:

- **Tipo:** `A`
- **Nome / Host:** `@` (para domínio raiz, ex.: `acessamais.com.br`) ou subdomínio (ex.: `mapa`)
- **Valor / Aponta para:** `IP_PUBLICO_DA_VPS`

Confirme na VPS se o DNS já propagou:

```bash
getent hosts seudominio.com.br
```

---

## 5. Configurar o `.env` de Produção

Na raiz do projeto (`/opt/apps/Mapa-Acessibilidade`), crie o arquivo `.env` a partir do modelo de produção:

```bash
cp .env.prod.example .env
```

Gere uma chave forte para `JWT_SECRET`:

```bash
openssl rand -base64 48
```

Edite o arquivo `.env`:

```bash
nano .env
```

Preencha os campos principais:

```env
DOMAIN=seudominio.com.br
LETSENCRYPT_EMAIL=contato@seudominio.com.br
LETSENCRYPT_STAGING=0

DB_NAME=mapa_acessibilidade
DB_ROOT_PASSWORD=defina-uma-senha-forte-aqui

JWT_SECRET=cole-aqui-a-chave-gerada-com-openssl
JWT_EXPIRES_IN=1h
```

> 💡 Para testar a subida antes de emitir o certificado definitivo (evitando limites do Let's Encrypt), defina `LETSENCRYPT_STAGING=1`. Quando tudo estiver OK, mude para `LETSENCRYPT_STAGING=0` e suba novamente.

---

## 6. Subir a Aplicação com Nginx e Let's Encrypt

Execute o compose de produção:

```bash
sudo docker compose -f docker-compose.prod.yml up -d --build
```

O que acontece automaticamente nessa subida:
1. O **MySQL 8.0** inicia em rede interna isolada e aguarda ficar saudável.
2. O **Backend** sincroniza o schema (`npx prisma db push`), popula as categorias de acessibilidade (`npx tsx prisma/seed.ts`) e sobe na porta interna `3000`.
3. O **Nginx** compila o frontend React, inicia com um certificado temporário na primeira execução (evitando erro de inicialização) e faz proxy de `/api/` e `/uploads/` para o backend.
4. O **Certbot** solicita o certificado digital válido do **Let's Encrypt** para o seu `DOMAIN`, e o Nginx recarrega automaticamente aplicando o HTTPS real (com renovação automática a cada 12 horas).

Acompanhe os logs para confirmar a emissão do certificado:

```bash
sudo docker compose -f docker-compose.prod.yml logs -f certbot nginx backend
```

Depois disso, acesse **`https://seudominio.com.br`** no navegador.

---

## 7. Criar o Usuário Administrador Inicial

Com os containers rodando, crie a conta administrativa executando:

```bash
sudo docker compose -f docker-compose.prod.yml exec backend npm run create-admin
```

---

## 8. Comandos Úteis de Manutenção

### Atualizar a aplicação após novas alterações no GitHub
```bash
cd /opt/apps/Mapa-Acessibilidade
git pull
sudo docker compose -f docker-compose.prod.yml up -d --build
```

### Ver status dos containers
```bash
sudo docker compose -f docker-compose.prod.yml ps
```

### Ver logs em tempo real
```bash
sudo docker compose -f docker-compose.prod.yml logs -f
```

### Backup do banco de dados MySQL
```bash
sudo docker compose -f docker-compose.prod.yml exec -T mysql \
  mysqldump -u root -p"$(grep DB_ROOT_PASSWORD .env | cut -d '=' -f2)" mapa_acessibilidade > backup_$(date +%F).sql
```

### Parar os serviços de produção
```bash
sudo docker compose -f docker-compose.prod.yml down
```
*(Os dados do banco, uploads e certificados permanecem salvos nos volumes Docker.)*
