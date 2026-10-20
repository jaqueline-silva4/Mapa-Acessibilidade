# ♿ Mapa da Acessibilidade — Guia do Projeto e de Contribuição

Este documento reúne as informações técnicas e as orientações de desenvolvimento do **Mapa da Acessibilidade**. Ele apresenta o objetivo do projeto, as tecnologias utilizadas, os procedimentos para executar a aplicação localmente e o fluxo de trabalho que deve ser seguido pelos integrantes da equipe.

O objetivo é manter a documentação centralizada, facilitar a configuração do ambiente de desenvolvimento, organizar as contribuições e evitar conflitos durante o trabalho colaborativo.

---

# PARTE I — SOBRE O PROJETO

## 1. Objetivo

O Mapa da Acessibilidade é um projeto fullstack voltado ao mapeamento e à consulta de informações sobre acessibilidade urbana.

A aplicação reúne uma interface web, uma API REST e um banco de dados, permitindo que as funcionalidades sejam desenvolvidas e integradas de forma organizada.

Esta documentação poderá ser atualizada conforme novas funcionalidades e decisões técnicas forem incorporadas ao projeto.

## 2. Tecnologias utilizadas

- **Frontend:** React 19, TypeScript e Vite.
- **Backend:** Node.js, Express e TypeScript.
- **ORM:** Prisma ORM 7.
- **Banco de dados:** MySQL 8.0.
- **Ambiente do banco de dados:** Docker Compose.
- **Controle de versão:** Git e GitHub.
- **Gerenciamento das tarefas:** GitHub Issues e GitHub Projects (Kanban).

## 3. Estrutura do projeto

O repositório está organizado da seguinte maneira:

```text
Mapa-Acessibilidade/
├── backend/
│   └── API REST, regras de negócio e acesso aos dados
├── frontend/
│   └── Interface web da aplicação
├── docker-compose.yml
├── README.md
└── CONTRIBUTING.md
```

O arquivo `docker-compose.yml` configura a execução dos serviços em containers. Os arquivos de configuração específicos do frontend e do backend ficam dentro de suas respectivas pastas.

## 4. Pré-requisitos

Antes de executar o projeto, instale:

- [Node.js](https://nodejs.org/), versão 20 ou superior;
- [Docker Desktop](https://www.docker.com/products/docker-desktop/), com Docker Compose habilitado;
- [Git](https://git-scm.com/);
- acesso ao repositório no GitHub.

Também é recomendável utilizar o Visual Studio Code ou outra IDE compatível com as tecnologias utilizadas.

## 5. Como obter o projeto

Caso ainda não tenha o repositório no computador, execute:

```bash
git clone https://github.com/jaqueline-silva4/Mapa-Acessibilidade.git
cd Mapa-Acessibilidade
```

Confira se o Git está funcionando corretamente:

```bash
git status
git branch
```

Antes de começar a trabalhar, verifique se está na branch correta e se existem alterações locais que precisam ser preservadas.

## 6. Como executar o projeto

### 6.1. Iniciar o banco de dados

Na raiz do projeto, execute:

```bash
docker compose up -d
```

O MySQL é disponibilizado na porta `3305` do computador e mapeado para a porta `3306` do container, conforme a configuração atual do projeto.

Para verificar o estado dos containers:

```bash
docker compose ps
```

Para acompanhar os logs do MySQL:

```bash
docker compose logs -f mysql
```

Para parar e remover os containers criados pelo Compose:

```bash
docker compose down
```

Esse comando não deve ser confundido com a remoção dos volumes. Antes de executar comandos que removam volumes, confira se há dados que precisam ser preservados.

### 6.2. Configurar e iniciar o backend

Abra um terminal na raiz do projeto e acesse a pasta do backend:

```bash
cd backend
```

Instale as dependências:

```bash
npm install
```

Crie o arquivo local de variáveis de ambiente a partir do arquivo de exemplo:

```bash
cp .env.example .env
```

No Windows PowerShell, se necessário, utilize:

```powershell
Copy-Item .env.example .env
```

Se o arquivo `.env.example` não existir, confirme com a equipe quais variáveis devem ser configuradas.

Gere o Prisma Client:

```bash
npm run prisma:generate
```

Teste a conexão com o banco de dados:

```bash
npm run test:db
```

Inicie o servidor em modo de desenvolvimento:

```bash
npm run dev
```

De acordo com a configuração atual, a API estará disponível nos seguintes endereços:

- `http://localhost:3000/` — informações da API e status da conexão com o banco;
- `http://localhost:3000/api/health` — verificação de saúde da aplicação.

Mantenha o terminal aberto enquanto estiver utilizando o backend.

### 6.3. Configurar e iniciar o frontend

Abra um segundo terminal na raiz do projeto e execute:

```bash
cd frontend
npm install
npm run dev
```

A aplicação web estará disponível em:

`http://localhost:5173`

Mantenha esse terminal aberto enquanto estiver utilizando o frontend.

## 7. Variáveis de ambiente

As variáveis de ambiente do backend devem ser configuradas no arquivo `backend/.env`.

A configuração atual utiliza as seguintes variáveis:

| Variável | Valor de referência local | Finalidade |
|---|---|---|
| `PORT` | `3000` | Porta do servidor Express |
| `NODE_ENV` | `development` | Ambiente de execução |
| `DB_HOST` | `localhost` | Host do banco de dados |
| `DB_PORT` | `3305` | Porta do MySQL no computador |
| `DB_NAME` | `mapa_acessibilidade` | Nome do banco |
| `DB_USER` | `root` | Usuário do banco |
| `DB_PASSWORD` | Definido localmente | Senha do banco |
| `DB_ROOT_PASSWORD` | Definido localmente | Senha de root do MySQL |
| `DATABASE_URL` | Definida conforme a configuração do banco | URL de conexão utilizada pelo Prisma ORM |

Os valores efetivos devem ser conferidos no arquivo de exemplo e na configuração do projeto. Não presuma que os valores de desenvolvimento sejam adequados para outros ambientes.

**Segurança:**

- Nunca envie senhas, tokens, chaves de API ou arquivos `.env` ao repositório.
- Não utilize senhas de exemplo em ambientes compartilhados ou de produção.
- Mantenha as credenciais fora do Git.
- Confira se o `.gitignore` exclui os arquivos locais de ambiente.
- Se uma credencial for publicada acidentalmente, avise a equipe e providencie sua substituição.

## 8. Comandos úteis

### Docker — na raiz do projeto

| Comando | Finalidade |
|---|---|
| `docker compose up -d` | Inicia os containers em segundo plano |
| `docker compose ps` | Mostra o estado dos containers |
| `docker compose down` | Para e remove os containers do Compose |
| `docker compose logs -f mysql` | Acompanha os logs do MySQL |

### Backend — dentro de `backend/`

| Comando | Finalidade |
|---|---|
| `npm install` | Instala as dependências |
| `npm run dev` | Inicia o servidor em desenvolvimento |
| `npm run test:db` | Testa a conexão com o banco |
| `npm run prisma:generate` | Gera o Prisma Client |
| `npm run build` | Compila o TypeScript |
| `npm run start` | Inicia a aplicação conforme a configuração de produção |

### Frontend — dentro de `frontend/`

| Comando | Finalidade |
|---|---|
| `npm install` | Instala as dependências |
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera o build de produção |
| `npm run lint` | Executa o linter |

Execute os comandos na pasta correspondente. Antes de utilizar outros comandos, confira os scripts disponíveis nos arquivos `package.json` de cada parte do projeto.

---

# PARTE II — COMO CONTRIBUIR

## 9. Princípios de colaboração

Toda contribuição deve seguir um fluxo organizado, com rastreabilidade das tarefas, revisão do código e integração controlada.

**Regra principal:** não desenvolva diretamente nas branches `main` ou `develop`. Cada tarefa deve ser realizada em uma branch própria e integrada por meio de Pull Request.

A estratégia de branches adotada neste guia é:

- **`main`:** branch principal do projeto.
- **`develop`:** branch de integração das funcionalidades e correções.

O fluxo pressupõe que a equipe continuará utilizando essa organização. Alterações nessa estratégia devem ser combinadas entre os integrantes e refletidas na documentação.

## 10. Fluxo geral do trabalho

O fluxo recomendado é:

```text
Identificar uma necessidade
        ↓
Criar uma Issue no GitHub
        ↓
Definir objetivo e critérios de aceitação
        ↓
Adicionar a Issue ao Kanban
        ↓
Definir responsável e prioridade
        ↓
Atualizar a develop local
        ↓
Criar uma branch para a tarefa
        ↓
Desenvolver e realizar commits
        ↓
Enviar a branch ao GitHub
        ↓
Executar testes e conferir as alterações
        ↓
Abrir Pull Request para develop
        ↓
Revisar o código e corrigir os pontos solicitados
        ↓
Obter aprovação
        ↓
Realizar o merge
        ↓
Atualizar o Kanban e encerrar a Issue
        ↓
Excluir a branch concluída, quando apropriado
```

## 11. Criar uma Issue antes de começar

Toda tarefa deve ser registrada em uma **GitHub Issue** antes do início do desenvolvimento.

A Issue serve para descrever o trabalho, registrar o contexto, definir os critérios de aceitação e acompanhar o progresso.

### Passo a passo

1. Abra o repositório do Mapa da Acessibilidade no GitHub.
2. Acesse a aba **Issues**.
3. Clique em **New issue**.
4. Escreva um título claro, preferencialmente começando com uma ação.
5. Descreva o objetivo da tarefa e o resultado esperado.
6. Inclua critérios de aceitação verificáveis.
7. Informe dependências, referências e capturas de tela, quando relevantes.
8. Defina o responsável, as labels e o milestone, se a equipe utilizar esses recursos.
9. Clique em **Submit new issue**.

### Exemplos de títulos

- `Criar estrutura inicial da página de acessibilidade`
- `Implementar endpoint de consulta de locais`
- `Adicionar validação ao formulário de cadastro`
- `Documentar configuração local do backend`
- `Corrigir apresentação dos dados de acessibilidade`

### Modelo para descrição de uma Issue

```markdown
## Objetivo
Explique o que precisa ser feito e qual resultado é esperado.

## Contexto
Explique por que a tarefa é necessária e inclua informações relevantes.

## Critérios de aceitação
- [ ] O comportamento esperado foi implementado.
- [ ] A alteração foi testada.
- [ ] A documentação foi atualizada, se necessário.

## Dependências
Informe se esta tarefa depende de outra Issue ou de uma decisão da equipe.

## Observações
Inclua informações adicionais, links ou referências.
```

Adapte os critérios ao tipo de tarefa. Os critérios devem permitir que a equipe verifique objetivamente quando o trabalho está concluído.

## 12. Organizar as tarefas no Kanban

Após criar a Issue, adicione-a ao GitHub Projects utilizado pela equipe.

### Passo a passo

1. Abra a Issue ou o projeto Kanban.
2. Adicione a Issue ao projeto correspondente.
3. Coloque a tarefa na coluna inicial adequada.
4. Confira o responsável, a prioridade e o status, conforme os campos configurados pela equipe.
5. Atualize o cartão sempre que o estado real da tarefa mudar.

### Sugestão de colunas

- **Backlog / A fazer:** tarefas registradas que ainda não foram iniciadas.
- **Pronta para desenvolvimento:** tarefas esclarecidas e disponíveis para serem assumidas.
- **Em andamento:** tarefas em desenvolvimento.
- **Em revisão:** tarefas com Pull Request aberto ou aguardando revisão.
- **Concluído:** tarefas integradas e finalizadas.

A equipe pode adotar outros nomes, desde que todos compreendam o significado das colunas.

Mover um cartão no Kanban não substitui atualizar a Issue ou o Pull Request quando necessário.

## 13. Preparar e atualizar o repositório local

Antes de iniciar uma nova tarefa, confira o estado do repositório:

```bash
git status
git branch
```

Atualize as referências remotas:

```bash
git fetch origin
```

Mude para a branch de integração:

```bash
git switch develop
```

Atualize a `develop`:

```bash
git pull origin develop
```

Antes de mudar de branch, verifique se há alterações locais. Salve o trabalho necessário antes de continuar. Não descarte alterações sem ter certeza de que podem ser perdidas.

Se a branch `develop` não existir ou houver algum erro de sincronização, confirme a situação com a equipe antes de criar outra branch de integração.

## 14. Criar uma branch para a tarefa

Cada tarefa deve ter uma branch própria, criada a partir da `develop` atualizada.

### Padrões de nomenclatura

Utilize nomes curtos, em minúsculas, sem acentos e separados por hífens.

| Prefixo | Finalidade | Exemplo |
|---|---|---|
| `feature/` | Nova funcionalidade | `feature/12-pagina-acessibilidade` |
| `fix/` | Correção de defeito | `fix/12-validacao-formulario` |
| `bugfix/` | Correção de defeito, se adotado pela equipe | `bugfix/12-consulta-locais` |
| `docs/` | Documentação | `docs/documentacao-projeto` |
| `test/` | Testes | `test/consulta-locais` |
| `refactor/` | Refatoração | `refactor/servico-consulta` |
| `chore/` | Manutenção ou configuração | `chore/ajuste-configuracao` |

A equipe deve manter um padrão consistente. Evite alternar prefixos para o mesmo tipo de tarefa sem necessidade.

### Criar a branch pelo terminal

Exemplo para uma Issue de criação de página:

```bash
git switch develop
git pull origin develop
git switch -c feature/12-pagina-acessibilidade
```

Substitua o número e o nome pelo identificador e pelo assunto reais da tarefa.

Também é possível criar uma branch a partir de uma Issue usando os recursos do GitHub, selecionando a branch-base `develop`. Depois, sincronize a branch remota com o repositório local.

Confira a branch atual:

```bash
git branch
```

A branch atual aparece marcada com `*`.

## 15. Desenvolver e registrar as alterações

Durante o desenvolvimento:

1. Trabalhe somente nos arquivos necessários para a Issue.
2. Siga a estrutura e os padrões existentes no projeto.
3. Execute a aplicação e os testes pertinentes.
4. Confira as alterações antes de registrá-las.
5. Faça commits claros e frequentes.
6. Atualize a Issue e o Kanban conforme o andamento.

Para conferir o estado do repositório:

```bash
git status
```

Para visualizar as alterações ainda não registradas:

```bash
git diff
```

Adicione somente os arquivos relacionados à tarefa:

```bash
git add caminho/do/arquivo
```

Se houver vários arquivos, adicione cada caminho necessário. Utilize `git add .` somente depois de conferir que todas as alterações presentes devem fazer parte do commit.

## 16. Padrão de mensagens de commit

As mensagens devem ser curtas, claras e indicar a natureza da alteração.

### Formato

```text
tipo: descrição curta da alteração
```

### Tipos sugeridos

| Tipo | Finalidade |
|---|---|
| `feature:` | Nova funcionalidade |
| `fix:` | Correção de defeito |
| `bugfix:` | Correção de defeito, se adotado pela equipe |
| `refactor:` | Melhoria interna sem mudança intencional de comportamento |
| `test:` | Criação ou atualização de testes |
| `docs:` | Documentação |
| `style:` | Formatação sem alteração da lógica |
| `chore:` | Manutenção e configuração |
| `build:` | Alterações no processo de build |
| `ci:` | Alterações na integração contínua |

### Exemplos

```bash
git commit -m "feature: adicionar filtro por tipo de local"
git commit -m "fix: corrigir validacao do formulario"
git commit -m "test: adicionar testes da consulta de locais"
git commit -m "docs: documentar configuracao do backend"
git commit -m "chore: atualizar configuracao do projeto"
```

Evite mensagens vagas, como `update`, `alterações`, `teste`, `final` ou `corrigi`.

## 17. Enviar a branch para o GitHub

No primeiro envio da branch:

```bash
git push -u origin feature/12-pagina-acessibilidade
```

Substitua o nome pelo da branch que você criou. O parâmetro `-u` configura o acompanhamento da branch remota.

Nos próximos envios:

```bash
git push
```

Faça push ao longo do trabalho, especialmente antes de encerrar o dia. Assim, os commits ficam disponíveis no GitHub mesmo que a tarefa ainda não esteja pronta para revisão.

## 18. Atualizar a branch antes do Pull Request

Antes de abrir o Pull Request, atualize sua branch com as alterações mais recentes da `develop`.

Primeiro, confirme que seu trabalho está salvo e commitado. Em seguida, execute:

```bash
git fetch origin
git switch develop
git pull origin develop
git switch feature/12-pagina-acessibilidade
git merge develop
```

Substitua o nome da branch pelo nome real da sua tarefa.

Se o merge terminar sem conflitos, execute novamente os testes pertinentes.

Se houver conflitos, siga as orientações da seção **Resolver conflitos**.

## 19. Conferir e testar a tarefa

Antes de abrir o Pull Request, confira os seguintes itens:

- [ ] A implementação atende ao objetivo da Issue.
- [ ] Os critérios de aceitação foram verificados.
- [ ] A aplicação inicia corretamente, quando aplicável.
- [ ] Os testes relevantes foram executados.
- [ ] O lint e o build foram executados, quando aplicáveis.
- [ ] Não foram incluídos arquivos temporários, credenciais ou segredos.
- [ ] As alterações não relacionadas à tarefa foram removidas do conjunto de mudanças.
- [ ] A documentação foi atualizada quando necessário.
- [ ] A branch foi atualizada com a `develop`.
- [ ] As alterações foram commitadas e enviadas ao GitHub.

Utilize os comandos disponíveis para a parte do projeto em que trabalhou.

No frontend, por exemplo:

```bash
npm run lint
npm run build
```

No backend:

```bash
npm run build
```

Execute também os testes configurados no `package.json` correspondente. Não marque testes como concluídos se eles não tiverem sido executados.

## 20. Abrir um Pull Request (PR)

Quando a tarefa estiver implementada, testada e enviada ao GitHub:

1. Abra o repositório no GitHub.
2. Acesse **Pull requests**.
3. Clique em **New pull request**.
4. Selecione a branch de destino e a branch que contém sua tarefa.
5. Confira o diff e a lista de arquivos modificados.
6. Escreva um título claro.
7. Preencha a descrição do PR.
8. Relacione a Issue correspondente.
9. Selecione os revisores, se a equipe utilizar essa funcionalidade.
10. Crie o Pull Request.

### Branches do Pull Request

- **Base:** `develop`.
- **Compare:** sua branch de tarefa, por exemplo `feature/12-pagina-acessibilidade`.

A branch-base deve ser confirmada antes de abrir o PR, pois o objetivo é integrar o trabalho à `develop`, e não diretamente à `main`.

### Padrão de título

Utilize um título semelhante ao dos commits:

```text
feature: adicionar página de acessibilidade
```

### Modelo de descrição do Pull Request

```markdown
## O que foi feito?
- Descreva as alterações realizadas.

## Como foi testado?
- Informe os testes e as verificações executados.
- Registre os resultados relevantes.

## Critérios de aceitação
- [ ] Critério 1 atendido.
- [ ] Critério 2 atendido.

## Pendências
- Informe o que ainda falta.
- Se não houver pendências, escreva: Nenhuma.

## Issue relacionada
Closes #12
```

Substitua `#12` pelo número correto da Issue.

O uso de `Closes #número` permite que o GitHub encerre a Issue automaticamente quando o PR for integrado, conforme o comportamento padrão da plataforma.

Ajuste os critérios ao conteúdo real da tarefa. Não marque como realizado um teste que não tenha sido executado.

## 21. Revisão do Pull Request

Depois de abrir o PR:

1. Atualize o cartão do Kanban para **Em revisão**, conforme o fluxo da equipe.
2. Aguarde a revisão de um colega ou responsável autorizado.
3. Responda aos comentários e esclareça dúvidas.
4. Se forem solicitadas alterações, faça-as na mesma branch.
5. Execute novamente os testes necessários.
6. Faça commit das correções e envie-as ao GitHub.

Exemplo:

```bash
git add caminho/do/arquivo
git commit -m "fix: ajustar pontos da revisao"
git push
```

O Pull Request existente será atualizado automaticamente. Não crie outro PR para a mesma tarefa apenas porque foram solicitadas correções.

Depois de realizar os ajustes, informe ao revisor que o PR está pronto para uma nova análise.

## 22. Resolver conflitos

Se o Git indicar conflitos durante a integração da `develop`:

1. Não escolha uma versão aleatoriamente.
2. Confira os arquivos afetados:

```bash
git status
```

3. Abra cada arquivo em conflito e identifique os trechos marcados pelo Git. Eles podem aparecer assim:

```text
<<<<<<< HEAD
alteracao da sua branch
=======
alteracao que veio da develop
>>>>>>> develop
```

4. Converse com os responsáveis pelas alterações quando não estiver claro como combinar os trechos.
5. Edite o arquivo para manter a solução correta e remova os marcadores.
6. Revise o arquivo completo.
7. Execute os testes pertinentes.
8. Marque os conflitos resolvidos e finalize o merge:

```bash
git add caminho/do/arquivo
git commit
```

9. Envie a branch atualizada:

```bash
git push
```

Se não souber resolver um conflito, pare e peça ajuda. Não apague código apenas para eliminar o conflito e não utilize comandos destrutivos sem compreender suas consequências.

## 23. Aprovação e merge

O PR só deve ser integrado quando:

- A revisão foi concluída.
- As solicitações de alteração foram atendidas.
- Os testes e as verificações necessárias passaram.
- Os critérios de aceitação foram atendidos.
- O responsável autorizado aprovou o PR.

**Não faça merge do seu próprio PR sem autorização da equipe.**

O responsável definido pelo projeto realiza o merge para `develop`, respeitando as regras de proteção e revisão do repositório.

### Depois do merge

1. Confirme que o PR foi integrado à `develop`.
2. Confirme se a Issue foi encerrada automaticamente ou encerre-a manualmente, se necessário.
3. Atualize o cartão do Kanban para **Concluído**.
4. Exclua a branch remota pelo GitHub, se ela não for mais necessária.
5. Atualize sua cópia local para iniciar a próxima tarefa.

## 24. Encerrar uma tarefa e iniciar outra

Depois que o PR tiver sido integrado, atualize sua branch local:

```bash
git switch develop
git pull origin develop
```

Se a branch concluída estiver totalmente integrada, você poderá removê-la localmente:

```bash
git branch -d feature/12-pagina-acessibilidade
```

Utilize o nome real da branch.

Se o Git informar que a branch não foi totalmente integrada, não force a exclusão. Confira a situação antes de prosseguir.

Para começar outra tarefa:

```bash
git switch develop
git pull origin develop
git switch -c feature/nova-tarefa
```

Não reutilize a branch de uma tarefa já concluída.

---

# PARTE III — CHECKLISTS E BOAS PRÁTICAS

## 25. Checklist diário

### Início do trabalho

- [ ] Estou no repositório correto.
- [ ] Conferi `git status` e não vou perder alterações locais.
- [ ] Atualizei a `develop`.
- [ ] Estou na branch correta para a tarefa.

### Durante o trabalho

- [ ] Minha tarefa está registrada em uma Issue.
- [ ] A Issue está no Kanban e tem responsável definido.
- [ ] Estou trabalhando na branch da tarefa.
- [ ] Faço commits claros e frequentes.
- [ ] Testo as alterações relevantes.
- [ ] Não incluo credenciais, tokens ou arquivos `.env`.

### Final do dia

- [ ] Conferi `git status`.
- [ ] Registrei as alterações que desejo salvar em commits.
- [ ] Fiz `git push`.
- [ ] Confirmei no GitHub que os commits estão na branch remota.
- [ ] Atualizei a Issue ou o Kanban com o estado real da tarefa.

### Antes de abrir um PR

- [ ] A tarefa atende aos critérios de aceitação.
- [ ] Executei os testes e as verificações aplicáveis.
- [ ] Atualizei a branch com a `develop`.
- [ ] Revisei o diff e confirmei que ele contém apenas alterações pertinentes.
- [ ] Fiz push.
- [ ] Preenchi a descrição e relacionei a Issue.

### Para concluir o PR

- [ ] O PR foi revisado.
- [ ] Corrigi os comentários solicitados.
- [ ] Os testes necessários passaram.
- [ ] O PR foi aprovado pelo responsável autorizado.
- [ ] O PR foi integrado à `develop`.
- [ ] A Issue e o Kanban foram atualizados.
- [ ] A branch concluída foi excluída quando apropriado.

## 26. Segurança e boas práticas

- Nunca envie senhas, tokens, chaves de API ou arquivos `.env` ao repositório.
- Nunca desenvolva diretamente nas branches `main` ou `develop`.
- Não faça merge de um PR sem a aprovação exigida pela equipe.
- Não use `git push --force`, `git reset --hard` ou `git branch -D` sem compreender o impacto e ter autorização.
- Não descarte alterações de outros integrantes sem conversar com a equipe.
- Evite incluir arquivos gerados ou temporários que não sejam necessários para o projeto.
- Mantenha a documentação atualizada quando houver mudanças importantes na configuração ou no fluxo de trabalho.
- Se houver dúvidas sobre uma Issue, um conflito ou uma decisão de implementação, alinhe com o responsável antes de fazer mudanças arriscadas.

O objetivo desse fluxo é manter o histórico confiável, deixar o andamento visível no Kanban, facilitar a revisão do código e permitir que todos contribuam de forma organizada.

## 27. Licença

A licença do projeto ainda deve ser definida pela equipe. Até que isso seja feito, não presuma que o código esteja licenciado para reutilização externa.
