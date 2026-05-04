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
  "Jwt": {
    "Key": "uma-chave-secreta-com-no-minimo-32-caracteres",
    "Issuer": "ASMTasks",
    "Audience": "ASMTasks.Frontend",
    "ExpirationMinutes": 120,
    "SameSite": "None"
  }
}
```

> A `Jwt.Key` deve ter no mínimo 32 caracteres.

Inicie a API:

```powershell
dotnet run --launch-profile https
```

A API ficará disponível em `https://localhost:7199`. A documentação Swagger estará em `https://localhost:7199/swagger`.

### 3. Frontend (Next.js)

```powershell
cd Frontend
```

Copie o arquivo de exemplo de variáveis de ambiente:

```powershell
copy .env.local.example .env.local
```

Edite `.env.local` se a URL da API for diferente de `https://localhost:7199/api`:

```env
NEXT_PUBLIC_API_URL=https://localhost:7199/api
```

Instale as dependências e inicie:

```powershell
npm install
npm run dev
```

O frontend ficará disponível em `http://localhost:3000`.

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
│   ├── API/              # ASP.NET Core 9 — API REST
│   └── Database/
│       ├── schema.sql    # Criação do banco e tabelas
│       └── seed.sql      # Dados iniciais
├── Frontend/             # Next.js 16 — interface web
├── Documentação/         # ERS, diagramas de classe e BD
├── setup.ps1             # Script de instalação automatizada
└── README.md
```
