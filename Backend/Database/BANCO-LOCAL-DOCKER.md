# Banco local no Docker (dev) + restaurar backup + ver no SGBD

Guia para rodar **só o SQL Server no Docker** na sua máquina de desenvolvimento,
restaurar um **backup (`.bak`)** do servidor e abrir os dados no **SSMS** ou
**Azure Data Studio**. O backend (.NET) e o frontend (Next.js) você continua
rodando localmente no Visual Studio / terminal, como sempre.

> Pré-requisito: **Docker Desktop** instalado e aberto.

---

## 1. Configurar o `.env.dev`

Na raiz do repositório, copie o exemplo e ajuste a senha:

```powershell
copy .env.dev.example .env.dev
```

O único valor que importa para "só o banco" é o `DB_PASSWORD` (senha do usuário
`sa`). A senha precisa ser forte: mínimo 8 caracteres, com maiúscula, minúscula e
número/símbolo. O `.env.dev` **não** vai para o git.

## 2. Subir só o SQL Server

```powershell
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev up -d sqlserver
```

Isso sobe **apenas** o container do banco (não builda backend/frontend) e expõe a
porta **`1433`** na sua máquina. Confira quando ficar `healthy`:

```powershell
docker inspect --format="{{.State.Health.Status}}" asmtasks-sqlserver-1
# repita ate aparecer: healthy
```

## 3. Restaurar o backup do servidor

Traga o `.bak` do servidor para a sua máquina (ex.: pasta `Downloads`). Depois, na
pasta `Backend\Database`, rode:

```powershell
cd Backend\Database
.\restore-local.ps1 -BakPath "C:\Users\voce\Downloads\backup_prod.bak"
```

O script:

1. copia o `.bak` para dentro do container;
2. **detecta sozinho** os nomes lógicos do backup (funciona tanto para um backup de
   produção quanto de teste);
3. restaura como o banco **`ASMTasks`** (padrão), sobrescrevendo se já existir;
4. imprime a contagem de clientes para conferência.

Opções úteis:

```powershell
# outro nome de banco de destino
.\restore-local.ps1 -BakPath ".\backup.bak" -DbName ASMTasksLocal

# informar a senha na hora (em vez de ler do .env.dev)
.\restore-local.ps1 -BakPath ".\backup.bak" -Password "Local_Dev_123!"
```

## 4. Ver os dados no SGBD

Abra o **SQL Server Management Studio (SSMS)** ou o **Azure Data Studio** e conecte:

| Campo | Valor |
|-------|-------|
| Servidor / Server | `localhost,1433` |
| Autenticação | SQL Server Authentication |
| Login | `sa` |
| Senha | a mesma do `DB_PASSWORD` (`.env.dev`) |
| Trust server certificate | **marcado** |

Pronto — o banco `ASMTasks` (restaurado do backup) aparece na árvore de bancos.

## 5. Apontar o backend local para esse banco

No `Backend\API\appsettings.Development.json`, use a connection string apontando
para o container:

```json
"StringConexao": "Server=localhost,1433;Database=ASMTasks;User Id=sa;Password=SUA_SENHA;TrustServerCertificate=True;"
```

Troque `SUA_SENHA` pelo `DB_PASSWORD` do `.env.dev`. Depois rode a API normalmente
(`dotnet run --launch-profile https`).

---

## Comandos do dia a dia

```powershell
# Parar o banco (mantem os dados no volume)
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev stop sqlserver

# Subir de novo
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev up -d sqlserver

# Ver logs do banco
docker logs -f asmtasks-sqlserver-1

# Apagar tudo (container + dados). Cuidado: zera o banco local.
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev down -v
```

## Alternativa: sem backup (schema + seed)

Se em vez do backup você quiser um banco novo e vazio com os dados iniciais
(`admin` / `admin123`), depois de subir o container aplique os scripts:

```powershell
docker cp Backend\Database\schema.sql asmtasks-sqlserver-1:/tmp/schema.sql
docker cp Backend\Database\seed.sql   asmtasks-sqlserver-1:/tmp/seed.sql
docker exec asmtasks-sqlserver-1 /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "SUA_SENHA" -No -i /tmp/schema.sql
docker exec asmtasks-sqlserver-1 /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "SUA_SENHA" -No -i /tmp/seed.sql
```
