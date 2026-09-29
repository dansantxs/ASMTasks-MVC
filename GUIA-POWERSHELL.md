# Guia único de PowerShell — ASMTasks

Todos os comandos PowerShell usados no dia a dia do projeto: setup local,
subir/atualizar containers, backup, restore e console SQL. Substitui os
antigos `BANCO-LOCAL-DOCKER.md`, `BACKUP-AUTOMATICO.md` e `DB-CONSOLE.md`
(o conteúdo deles foi incorporado aqui).

---

## 0. Antes de tudo: liberar a execução de scripts (execution policy)

Numa máquina Windows recém-configurada, o PowerShell **bloqueia** os `.ps1`
deste projeto e mostra um erro assim:

```
.\restore-local.ps1 : O arquivo ...\restore-local.ps1 não pode ser carregado.
O arquivo ...\restore-local.ps1 não está assinado digitalmente.
Não é possível executar este script no sistema atual.
    + FullyQualifiedErrorId : UnauthorizedAccess
```

Isso é a *execution policy* do PowerShell, não um problema do script. Os
scripts do projeto não têm assinatura digital, então a política padrão os
recusa. Também aparece o erro `CommandNotFoundException` (`.\restore-local.ps1`
não é reconhecido) quando você **não está na pasta do script** — nesse caso
basta `cd` para a pasta certa (ex.: `cd Backend\Database`) antes de rodar.

Escolha **uma** das opções abaixo (da mais recomendada para a menos):

```powershell
# A) Liberar só o seu usuário, uma vez (recomendado, permanente).
#    RemoteSigned permite scripts locais e exige assinatura só para os baixados.
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
# responda "S" (Sim) quando perguntar.

# B) Liberar só a janela atual do PowerShell (temporário, não altera nada global).
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#    ...e então rode o script normalmente nesta mesma janela.

# C) Rodar um script específico sem mudar política nenhuma.
powershell -ExecutionPolicy Bypass -File .\restore-local.ps1 -BakPath "C:\...\backup.bak"
```

> **Arquivo baixado / vindo do GitHub (Mark of the Web):** se, mesmo com a
> política em `RemoteSigned`, o script continuar sendo recusado por "não estar
> assinado", ele veio marcado como baixado da internet. Desmarque com
> `Unblock-File`:
>
> ```powershell
> # um arquivo
> Unblock-File .\restore-local.ps1
> # ou todos os scripts do projeto de uma vez
> Get-ChildItem -Recurse -Filter *.ps1 | Unblock-File
> ```

Para conferir a política atual: `Get-ExecutionPolicy -List`.

---

## 1. Setup inicial (ambiente de desenvolvimento local)

Na raiz do repositório:

```powershell
.\setup.ps1
```

O script verifica pré-requisitos (.NET SDK, Node.js), cria
`Backend\API\appsettings.Development.json` e `Frontend\.env.local` a partir
dos exemplos, aplica `schema.sql`/`seed.sql` (se `sqlcmd` estiver disponível)
e instala as dependências do frontend/backend.

Se preferir configurar manualmente:

```powershell
copy Backend\API\appsettings.Example.json Backend\API\appsettings.Development.json
copy Frontend\.env.local.example Frontend\.env.local
copy .env.dev.example .env.dev
copy .env.prod.example .env.prod
```

Login inicial após aplicar o `seed.sql`: `admin` / `admin123`.

---

## 2. Subir e parar containers

```powershell
# Só o SQL Server (dev), pra rodar backend/frontend fora do container
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev up -d sqlserver

# Stack completa de desenvolvimento (build + up)
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev up -d --build

# Stack de produção
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d --build

# Produção com túnel Cloudflare (requer CLOUDFLARE_TUNNEL_TOKEN no .env.prod)
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod --profile cloudflare up -d --build

# Parar (mantém os dados no volume)
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev stop

# Apagar tudo (container + dados) — cuidado, zera o banco
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev down -v
```

No container, o backend escuta em `8080` e o frontend em `3000`. Confira a
saúde do banco:

```powershell
docker inspect --format="{{.State.Health.Status}}" asmtasks-sqlserver-1
# repita até aparecer: healthy
```

---

## 3. Atualizar o servidor (deploy)

No servidor, dentro da pasta da aplicação (padrão `C:\ASMTasks\app`):

```powershell
Set-Location "C:\ASMTasks\app"
git pull

# Ambiente de teste
docker compose --project-name asmtasks-test --env-file .env.test `
    -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Ambiente de produção
docker compose --project-name asmtasks-prod --env-file .env.prod `
    -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Se a mudança for só no código (sem alterar dependências), um `restart` é
mais rápido que `up -d --build`:

```powershell
docker compose --project-name asmtasks-test --env-file .env.test `
    -f docker-compose.yml -f docker-compose.prod.yml restart backend frontend
```

Se a mudança inclui alteração de banco, aplique o script novo com o
`db.ps1` (seção 6) **antes** do restart/rebuild.

---

## 4. Backup automático (produção e teste)

Scripts em `Backend\Database\`: `backup-prod.ps1`, `backup-test.ps1` e
`setup-backup-agendado.ps1`. Cada backup lê `DB_NAME`/`DB_PASSWORD` do
`.env.prod`/`.env.test`, gera o `.bak` dentro do container, copia para
`C:\ASMTasks\backups`, remove backups com mais de 30 dias
(`-RetentionDays` ajusta) e grava log em
`C:\ASMTasks\backups\backup-prod.log` / `backup-test.log`.

```powershell
# Testar manualmente (como Administrador)
.\backup-prod.ps1
.\backup-test.ps1

# Agendar 12h e 18h todos os dias (PowerShell como Administrador)
.\setup-backup-agendado.ps1
# OU, se o Docker só funciona no seu usuário (pede a senha):
.\setup-backup-agendado.ps1 -RunAsUser "SERVIDOR\seu_usuario"

# Testar uma tarefa agendada
schtasks /Run /TN "ASMTasks\Backup Prod 12h"
schtasks /Query /TN "ASMTasks\Backup Prod 12h" /V /FO LIST   # 'Last Result' deve ser 0

# Remover as tarefas agendadas
.\setup-backup-agendado.ps1 -Remove
```

> **SYSTEM x usuário:** se a tarefa agendada não achar o Docker
> (`docker: command not found`), rode o setup com `-RunAsUser "SERVIDOR\usuario"`
> — a conta SYSTEM às vezes não enxerga o Docker Desktop.

---

## 5. Restaurar backup localmente

Pré-requisito: Docker Desktop aberto e `.env.dev` configurado (senha `sa`
forte — mínimo 8 caracteres, maiúscula, minúscula e número/símbolo).

```powershell
# 1) Subir só o SQL Server
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev up -d sqlserver

# 2) Restaurar o .bak trazido do servidor
cd Backend\Database
.\restore-local.ps1 -BakPath "C:\Users\voce\Downloads\backup_prod.bak"

# outro nome de banco de destino
.\restore-local.ps1 -BakPath ".\backup.bak" -DbName ASMTasksLocal

# informar a senha na hora (em vez de ler do .env.dev)
.\restore-local.ps1 -BakPath ".\backup.bak" -Password "Local_Dev_123!"
```

O script detecta sozinho os nomes lógicos do backup (produção ou teste),
restaura como `ASMTasks` (padrão) e imprime a contagem de clientes.

Conecte no **SSMS** / **Azure Data Studio**: servidor `localhost,1433`,
autenticação SQL Server, login `sa`, senha do `.env.dev`, com
**Trust server certificate** marcado.

Depois, aponte o backend local (`appsettings.Development.json`) para
`Server=localhost,1433;Database=ASMTasks;User Id=sa;Password=SUA_SENHA;TrustServerCertificate=True;`.

### Alternativa sem backup (schema + seed, banco vazio)

```powershell
docker cp Backend\Database\schema.sql asmtasks-sqlserver-1:/tmp/schema.sql
docker cp Backend\Database\seed.sql   asmtasks-sqlserver-1:/tmp/seed.sql
docker exec asmtasks-sqlserver-1 /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "SUA_SENHA" -No -i /tmp/schema.sql
docker exec asmtasks-sqlserver-1 /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "SUA_SENHA" -No -i /tmp/seed.sql
```

> Não existe pasta de migrations: `schema.sql` é a fonte única da estrutura do
> banco. Alteração de estrutura entra no `schema.sql` e, em bancos já existentes,
> é aplicada à mão com `db.ps1` (seção 6).

---

## 6. Console SQL rápido (`db.ps1`)

Roda comandos SQL direto no container sem abrir SSMS nem digitar
usuário/senha na mão. Lê `DB_PASSWORD`/`DB_NAME` do `.env` do ambiente e
executa o `sqlcmd` dentro do container. Requer o `.env.test`/`.env.prod` na
pasta da aplicação (padrão `C:\ASMTasks\app`, ajustável com `-AppDir`).

```powershell
cd Backend\Database

# SELECT
.\db.ps1 "SELECT TOP 10 Id, Nome, MatrizId FROM Cliente;"

# UPDATE / DELETE
.\db.ps1 "UPDATE Cliente SET MatrizId = NULL WHERE Id = MatrizId;"
.\db.ps1 "DELETE FROM Cliente WHERE Id = 123;"

# Rodar um arquivo .sql inteiro
.\db.ps1 -File .\algum_script.sql

# Modo interativo
.\db.ps1

# Produção (precisa passar -Env prod de propósito)
.\db.ps1 -Env prod "SELECT COUNT(*) FROM Cliente;"

# Pasta da aplicação diferente do padrão
.\db.ps1 -AppDir "D:\meu\caminho\app" "SELECT 1;"
```

**Segurança:** ambiente padrão é `test`; só toca produção com `-Env prod`
explícito. A senha é lida do `.env` em tempo de execução, nada fica escrito
no script. Sempre confira um `SELECT` antes de rodar `UPDATE`/`DELETE` sem
`WHERE`.

Nomes de container assumidos pelo script: teste `asmtasks-test-sqlserver-1`,
produção `asmtasks-sqlserver-1`. Para ver os containers ativos:
`docker ps --format "{{.Names}}"`.

---

## 7. Correções de dados da versão 1.12.0 (`aplicar_correcoes_atendimentos.ps1`)

A 1.12.0 corrigiu duas coisas no código que também precisam de um acerto no
banco. **Rode depois do deploy, em cada ambiente.**

> **O segundo script não é opcional.** Ele libera o tipo `A` no CHECK da tabela
> `AtendimentoHistoricoStatus`. Sem ele, o código novo não consegue cadastrar
> atendimento nenhum — o INSERT do evento de agendamento falha.

```powershell
cd C:\ASMTasks\app\Backend\Database

# 1) Simule primeiro: roda tudo numa transação e desfaz no fim.
.\aplicar_correcoes_atendimentos.ps1 -Env test -Simular

# 2) Aplique em teste.
.\aplicar_correcoes_atendimentos.ps1 -Env test

# 3) Produção: simule, faça o backup e só então aplique.
.\aplicar_correcoes_atendimentos.ps1 -Env prod -Simular
.\backup-prod.ps1
.\aplicar_correcoes_atendimentos.ps1 -Env prod   # pede para digitar APLICAR
```

O script mostra a conferência antes e depois. Aplicado de verdade, os dois
números têm de terminar em zero.

**`-PularDatasComissao`** pula a parte que corrige a data dos eventos no
histórico. Essa parte muda o dia — e, em poucos casos, o mês — em que o
atendimento aparece no Relatório de Comissão. Se a comissão desses meses já foi
paga conferindo o relatório antigo, use a opção; o resto da correção continua
sendo aplicado.

Os dois `.sql` também podem ser rodados à mão (`db.ps1 -File`), na ordem acima.
Cada um traz no cabeçalho o que faz e por quê.

---

## 8. Outros comandos úteis do dia a dia

```powershell
# Ver logs do banco em tempo real
docker logs -f asmtasks-sqlserver-1

# Listar containers ativos
docker ps --format "{{.Names}}"

# Copiar um script .sql pro container e rodar direto (sem o db.ps1)
docker cp meu_script.sql asmtasks-test-sqlserver-1:/tmp/meu_script.sql
docker exec asmtasks-test-sqlserver-1 /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "SENHA" -d ASMTasksTest -i /tmp/meu_script.sql -No

# Forçar leitura UTF-8 no sqlcmd (se acento sair errado)
docker exec asmtasks-test-sqlserver-1 /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "SENHA" -d ASMTasksTest -i /tmp/meu_script.sql -No -f 65001
```
