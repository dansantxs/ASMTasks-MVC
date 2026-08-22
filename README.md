# ASMTasks

Sistema de gerenciamento de tarefas, projetos e atendimentos.

## Pré-requisitos

- [.NET 9 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [Node.js 20+](https://nodejs.org/) com npm
- SQL Server (local ou remoto)

## Instalação rápida

Execute o script de setup na raiz do projeto:

```powershell
.\setup.ps1
```

O script configura o backend, aplica o banco de dados e prepara o frontend automaticamente.

> **O PowerShell recusou o script** com "não está assinado digitalmente"
> (`UnauthorizedAccess`)? É a *execution policy* padrão do Windows. Rode
> `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` uma
> vez (ou veja a [seção 0 do guia](GUIA-POWERSHELL.md#0-antes-de-tudo-liberar-a-execução-de-scripts-execution-policy))
> e execute o `.\setup.ps1` de novo.

> **Comandos PowerShell (setup, containers, deploy, backup, restore, console SQL):**
> veja o guia único em [`GUIA-POWERSHELL.md`](GUIA-POWERSHELL.md).

---

## Instalação manual

### 1. Banco de dados

No SQL Server Management Studio ou `sqlcmd`, execute os scripts nesta ordem:

```sql
-- 1. Cria o banco e todas as tabelas
Backend\Database\schema.sql

-- 2. Popula dados iniciais (admin, níveis de acesso, etc.)
Backend\Database\seed.sql
```

### 2. Backend (.NET)

```powershell
cd Backend\API
```

Copie o arquivo de exemplo e preencha os valores:

```powershell
copy appsettings.Example.json appsettings.Development.json
```

Edite `appsettings.Development.json`:

```json
{
  "StringConexao": "Server=localhost;Database=ASMTasks;User Id=sa;Password=SuaSenha;TrustServerCertificate=True;",
  "CorsOrigens": "http://localhost:3000",
  "AllowedHosts": "*",
  "Jwt": {
    "Key": "uma-chave-secreta-com-no-minimo-32-caracteres",
    "Issuer": "ASMTasks",
    "Audience": "ASMTasks.Frontend",
    "ExpirationMinutes": 240,
    "SameSite": "Strict"
  }
}
```

> A `Jwt.Key` deve ter no mínimo 32 caracteres. O token expira em `ExpirationMinutes` (padrão: 240 = 4 horas).

Inicie a API:

```powershell
dotnet run --launch-profile https
```

A API ficará disponível em `https://localhost:7199` (Swagger em `https://localhost:7199/swagger`). O perfil `https` também expõe a API em `http://localhost:5273`.

> **Em desenvolvimento, prefira a URL HTTP (`http://localhost:5273`) no frontend.** Misturar o frontend em `http://localhost:3000` com a API em `https` causa conflito no esquema de cookies de autenticação (login não persiste). Veja o passo 3.

### 3. Frontend (Next.js)

```powershell
cd Frontend
```

Copie o arquivo de exemplo de variáveis de ambiente:

```powershell
copy .env.local.example .env.local
```

Edite `.env.local` conforme a URL da API. Em desenvolvimento, use a URL **HTTP** para evitar conflito no esquema de cookies (frontend HTTP → API HTTP):

```env
NEXT_PUBLIC_API_URL=http://localhost:5273/api
```

Instale as dependências e inicie:

```powershell
npm install
npm run dev
```

O frontend ficará disponível em `http://localhost:3000`.

---

## Execução com Docker

O projeto inclui `Dockerfile`s para o backend e o frontend e arquivos Compose para diferentes cenários:

| Arquivo | Uso |
|---------|-----|
| `docker-compose.yml` | Base (SQL Server + backend + frontend). Não sobe portas sozinho. |
| `docker-compose.dev.yml` | Desenvolvimento — publica as portas (`sqlserver` 1433, `backend` 5000→8080, `frontend` 3000). |
| `docker-compose.prod.yml` | Produção — `restart: unless-stopped` e túnel Cloudflare opcional (profile `cloudflare`). |
| `docker-compose.demo.yml` | Demonstração via túnel Cloudflare com URL temporária. |

No container, o backend escuta em `8080` e o frontend em `3000`.

### Variáveis de ambiente

Copie o exemplo correspondente e ajuste os valores (senha do SQL Server, `JWT_KEY` com no mínimo 32 caracteres, origens de CORS, etc.):

```bash
cp .env.dev.example .env.dev      # desenvolvimento
cp .env.prod.example .env.prod    # produção
```

### Somente o banco no Docker

Útil para rodar backend/frontend localmente (fora do container) e manter só o SQL Server em container:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev up -d sqlserver
```

Detalhes de restauração de backup `.bak` e acesso via SSMS / Azure Data Studio em
[`GUIA-POWERSHELL.md`](GUIA-POWERSHELL.md).

### Stack completa (dev)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev up -d --build
```

Frontend em `http://localhost:3000` e API em `http://localhost:5000`.

### Produção

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d --build
# Com o túnel Cloudflare (requer CLOUDFLARE_TUNNEL_TOKEN no .env.prod):
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod --profile cloudflare up -d --build
```

> O schema e os dados iniciais precisam ser aplicados ao banco em container na
> primeira execução (`schema.sql` e `seed.sql`) — veja a seção
> [Instalação manual](#1-banco-de-dados) e o [`GUIA-POWERSHELL.md`](GUIA-POWERSHELL.md).

---

## Acesso inicial

Após rodar o `seed.sql`, o sistema terá um usuário administrador padrão:

| Campo | Valor |
|-------|-------|
| Login | `admin` |
| Senha | `admin123` |

Troque a senha após o primeiro acesso.

---

## Estrutura do projeto

```
ASMTasks-MVC/
├── Backend/
│   ├── API/                    # ASP.NET Core 9 — API REST
│   ├── Database/
│   │   ├── schema.sql          # Criação do banco e tabelas
│   │   └── seed.sql            # Dados iniciais
│   └── Dockerfile              # Imagem do backend
├── Frontend/                   # Next.js 16 — interface web (+ Dockerfile)
├── Documentação/               # ERS, diagramas de classe e BD
├── docker-compose.yml          # Base (SQL Server + backend + frontend)
├── docker-compose.dev.yml      # Override de desenvolvimento
├── docker-compose.prod.yml     # Override de produção (+ Cloudflare)
├── docker-compose.demo.yml     # Override de demonstração
├── .env.dev.example            # Variáveis de ambiente (dev)
├── .env.prod.example           # Variáveis de ambiente (produção)
├── setup.ps1                   # Script de instalação automatizada
├── GUIA-POWERSHELL.md          # Guia único: setup, containers, deploy, backup, restore, console SQL
└── README.md
```
