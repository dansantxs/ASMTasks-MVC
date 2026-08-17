# Reset do banco de TESTE — ASMTasksTest

Scripts para **recomeçar o banco de teste**: apagar toda a movimentação
(projetos, tarefas e atendimentos), reimportar a base de clientes a partir do
`cliente.sql` e **manter os demais cadastros** (colaboradores, cargos, setores,
usuários, níveis de acesso, etapas, prioridades e configuração do sistema).

> ⚠️ Tudo aqui é para o ambiente **TESTE** (`asmtasks-test` / banco `ASMTasksTest`).
> **Produção não é tocada.**

## Arquivos

| Arquivo | O que faz |
|---|---|
| `00_verificacao_ativo.sql` | (Opcional, só leitura) Lista os clientes inativos hoje, para conferir o que mudou. |
| `01_reset_movimentacao.sql` | Apaga projetos, tarefas e atendimentos (e logs/histórico) na ordem correta de FK e rezera os contadores. |
| `02_reimport_clientes.sql` | Limpa a tabela `Cliente` e reimporta **1384 clientes** convertidos do `cliente.sql`, religando as matrizes. |
| `03_excluir_registros.sql` | (Opcional) Exclui **de verdade** (DELETE) etapas e clientes — você edita os nomes/documentos. Roda depois do `01`. |
| `04_duplicar_test_para_prod.md` | (Opcional) Passo a passo para deixar **produção igual ao teste** (restore do backup do teste em `ASMTasksProd`). |

### Sobre a conversão dos clientes
O `cliente.sql` é um export do ERP legado (colunas `CLI_*`) e **não roda direto**
no ASMTasks. O `02_reimport_clientes.sql` já vem com os dados **convertidos** para
o schema do sistema. A conversão foi validada contra o `seed.sql` (documento, tipo de
pessoa e data de cadastro batem 100%; as poucas diferenças de nome/e-mail/endereço são
clientes que foram **atualizados no ERP** desde o seed). As **cidades** foram
**recalculadas** (ver abaixo), pois as do seed estavam erradas.

- **Status ativo/inativo** vem do ERP (`CLI_STATUS = 9` → inativo). Como o
  `cliente.sql` é o export atual, ele já reflete os clientes inativados no meio
  tempo. Há **8 clientes** cujo status havia sido editado só no ASMTasks e diverge
  do ERP — eles estão listados no comentário do `00_verificacao_ativo.sql`. Após o
  import, **o valor do ERP prevalece**; ajuste manualmente se quiser manter algum.
- **Cidade** é resolvida pelo **código IBGE** guardado em `CLI_CIDENT`. Assim **1382 dos
  1384** clientes recebem a cidade **correta**; só **2** (código IBGE `3546108`, CEP
  15785-000) ficam sem cidade. A **UF é sempre preenchida**. Isto **corrige** as cidades
  erradas do seed original (que tinha ~547 clientes marcados como "Bastos" por default e
  vários municípios trocados — conferido pelo CEP).

## Passo a passo (PowerShell como Administrador, no servidor)

```powershell
# 0) Entrar na pasta do app e puxar o código novo (traz esta pasta reset_test)
Set-Location "C:\ASMTasks\app"
git pull

# 1) Backup de seguranca do banco de teste
C:\ASMTasks\backup-test

# 2) Carregar variaveis do ambiente de teste
$envT = @{}
Get-Content "C:\ASMTasks\app\.env.test" | ForEach-Object {
    if ($_ -match "^([^#=][^=]*)=(.*)$") { $envT[$Matches[1].Trim()] = $Matches[2].Trim() }
}
$C   = "asmtasks-test-sqlserver-1"
$P   = $envT['DB_PASSWORD']
$DB  = $envT['DB_NAME']            # ASMTasksTest
$dir = "C:\ASMTasks\app\Backend\Database\reset_test"

# 3) (Opcional) Conferencia ANTES do reset
docker cp "$dir\00_verificacao_ativo.sql" "${C}:/tmp/00.sql"
docker exec $C /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$P" -d "$DB" -i /tmp/00.sql -No

# 4) Apagar a movimentacao (projetos, tarefas, atendimentos)
docker cp "$dir\01_reset_movimentacao.sql" "${C}:/tmp/01.sql"
docker exec $C /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$P" -d "$DB" -i /tmp/01.sql -No

# 5) Reimportar os clientes
docker cp "$dir\02_reimport_clientes.sql" "${C}:/tmp/02.sql"
docker exec $C /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$P" -d "$DB" -i /tmp/02.sql -No

# 6) Reiniciar backend/frontend de teste e verificar
docker compose --project-name asmtasks-test --env-file .env.test `
    -f docker-compose.yml -f docker-compose.prod.yml restart backend frontend
C:\ASMTasks\status.ps1
```

Ao final, o passo 5 imprime um resumo (`TotalClientes`, `Ativos`, `Inativos`,
`Filiais`, `SemCidade`). Abra `http://IP_DO_SERVIDOR:3001` e confira:
clientes reimportados (incluindo os novos), **nenhum** projeto/tarefa/atendimento,
e os demais cadastros intactos.

> Se algum acento aparecer errado no banco, rode os `sqlcmd` do passo 4/5 com a
> opção extra `-f 65001` (força leitura UTF-8).

## Reverter, se necessário
Restaurar o `.bak` gerado no passo 1 (o `backup-test` salva em `C:\ASMTasks\backups`).
