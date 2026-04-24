# DFD Control

Um sistema web robusto desenvolvido para a gestão e controlo de Documentos de Formalização de Demanda (DFDs), integrando a gestão de processos, equipamentos e utilizadores.

##  Principais Funcionalidades

* **Gestão de DFDs e Processos**: Criação, atualização e monitorização de processos e dos seus respetivos DFDs.
* **Controlo de Equipamentos**: Registo detalhado de equipamentos associados a cada demanda, incluindo nome, quantidade e especificações.
* **Autenticação e Segurança**: Sistema de login com controlo de "primeiro acesso" para novos utilizadores, utilizando encriptação de palavras-passe (`bcryptjs`) e tokens JWT (`jose`).
* **Processamento de Ficheiros PDF**: Capacidade de leitura, extração de dados e manipulação de ficheiros PDF associados aos documentos (`pdfjs-dist`, `unpdf`, `pdf2json`).
* **Relatórios e Exportação**: Geração de ficheiros Excel (`exceljs`) para exportação e análise de dados dos processos.
* **Dashboards e Métricas**: Visualização do estado dos processos através de gráficos dinâmicos e interativos (`recharts`).
* **Auditoria (Logs)**: Registo rigoroso das ações realizadas no sistema (identificando a entidade, o utilizador e a data) para garantir a rastreabilidade.
* **Integração com IA**: Preparado para processamento inteligente de dados através da integração com o `groq-sdk`.
* **Notificações**: Configuração para o envio de e-mails do sistema através do `nodemailer`.

##  Tecnologias Utilizadas

* **Frontend:** [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/) e componentes UI modernos (Shadcn, base-ui, Lucide React).
* **Backend:** Next.js Route Handlers.
* **Base de Dados:** [PostgreSQL](https://www.postgresql.org/) com integração serverless através do [@neondatabase/serverless](https://neon.tech/).
* **ORM:** [Prisma ORM](https://www.prisma.io/) com o adaptador Neon nativo.

##  Pré-requisitos

* [Node.js](https://nodejs.org/) (versão 20 ou superior recomendada)
* Gestor de pacotes (`npm`, `yarn`, `pnpm` ou `bun`)
* Instância de base de dados PostgreSQL (ex: Neon DB, Vercel Postgres ou local)

## Como Iniciar o Projeto

1. **Clonar o repositório**
   ```bash
   git clone https://github.com/victoriacarvalho/dfd-Control
   cd dfd-control
   ```

2. **Instalar as dependências**
   ```bash
   npm install
   ```

3. **Configurar as Variáveis de Ambiente**
   Crie um ficheiro `.env` na raiz do projeto e configure as variáveis essenciais baseadas na infraestrutura do projeto:
   ```env
   # Base de Dados (PostgreSQL / Neon)
   DATABASE_URL="postgresql://utilizador:senha@host/base_de_dados?sslmode=require"
   
   # Autenticação
   JWT_SECRET="sua-chave-secreta-aqui"
   
   # Integrações adicionais (ajuste conforme necessário)
   GROQ_API_KEY="sua-chave-api"
   SMTP_HOST="seu-servidor-smtp"
   ```

4. **Configurar a Base de Dados**
   Gere o cliente do Prisma e sincronize a estrutura com a base de dados:
   ```bash
   npx prisma generate
   npx prisma db push
   # (Alternativamente, utilize 'npx prisma migrate dev' em ambiente de desenvolvimento)
   ```

5. **Iniciar o Servidor de Desenvolvimento**
   ```bash
   npm run dev
   ```
   O projeto estará acessível no seu navegador através de [http://localhost:3000](http://localhost:3000).

## Estrutura da Base de Dados (Modelos Principais)

* **`Dfd`**: Representa o Documento de Formalização de Demanda. Inclui referências à Secretaria, Setor, versão do documento, e suporta *soft delete* (registo de quem apagou e quando).
* **`Equipamento`**: Detalha os itens vinculados a um DFD (nome, quantidade, especificação técnica).
* **`Processo`**: Entidade agregadora que pode conter múltiplos DFDs, gerida por um responsável (`Usuario`) com acompanhamento de estado (status).
* **`Usuario`**: Credenciais e perfis de acesso ao sistema.
* **`Log`**: Registo imutável de eventos (criação, edição, exclusão) que ocorrem nas diferentes entidades do sistema.
```
