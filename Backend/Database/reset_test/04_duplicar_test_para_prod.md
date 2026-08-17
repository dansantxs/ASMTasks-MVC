# Duplicar o banco de TESTE para PRODUÇÃO

Deixa o banco de **produção** (`ASMTasksProd`) idêntico ao de **teste** (`ASMTasksTest`),
restaurando um backup do teste dentro do container de produção.

> Faça isto **por último**, depois de terminar o reset, as exclusões e a conferência no teste —
> assim produção espelha o estado final do teste.
>
> ⚠️ Este procedimento **sobrescreve** o banco de produção. Combinamos que produção pode ser
> sobrescrita (está vazia/nova). Se um dia tiver dados reais em produção, faça backup dela antes.

## Passo a passo (PowerShell como Administrador)

```powershell
Set-Location "C:\ASMTasks\app"

# 1) Subir produção (cria/da start no container asmtasks-prod-sqlserver-1).
#    Requer o arquivo .env.prod configurado.
C:\ASMTasks\start-prod.ps1

# 2) Aguardar o SQL Server de produção ficar "healthy"
docker inspect --format="{{.State.Health.Status}}" asmtasks-prod-sqlserver-1
#    repita até aparecer: healthy

# 3) Gerar um backup fresco do TESTE (estado final que queremos copiar)
C:\ASMTasks\backup-test

# 4) Pegar o .bak mais recente e copiar para o container de PRODUÇÃO
$bak = Get-ChildItem "C:\ASMTasks\backups\backup_test_*.bak" |
       Sort-Object LastWriteTime -Descending | Select-Object -First 1
Write-Host "Usando backup: $($bak.Name)"
docker cp "$($bak.FullName)" "asmtasks-prod-sqlserver-1:/tmp/test.bak"

# 5) Carregar a senha do SA de produção
$envP = @{}
Get-Content "C:\ASMTasks\app\.env.prod" | ForEach-Object {
    if ($_ -match "^([^#=][^=]*)=(.*)$") { $envP[$Matches[1].Trim()] = $Matches[2].Trim() }
}
$Cp = "asmtasks-prod-sqlserver-1"
$Pp = $envP['DB_PASSWORD']

# 6) (Conferência) ver os nomes lógicos dentro do .bak — devem ser
#    'ASMTasksTest' e 'ASMTasksTest_log'
docker exec $Cp /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$Pp" -No `
    -Q "RESTORE FILELISTONLY FROM DISK='/tmp/test.bak'"

# 7) Parar backend/frontend de produção (libera conexões com o banco)
docker compose --project-name asmtasks-prod --env-file .env.prod `
    -f docker-compose.yml -f docker-compose.prod.yml stop backend frontend

# 8) RESTAURAR o backup do teste COMO ASMTasksProd (sobrescreve)
docker exec $Cp /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$Pp" -No -Q @"
RESTORE DATABASE [ASMTasksProd] FROM DISK='/tmp/test.bak'
WITH MOVE 'ASMTasksTest'     TO '/var/opt/mssql/data/ASMTasksProd.mdf',
     MOVE 'ASMTasksTest_log' TO '/var/opt/mssql/data/ASMTasksProd_log.ldf',
     REPLACE, RECOVERY;
"@

# 9) Religar backend/frontend de produção
docker compose --project-name asmtasks-prod --env-file .env.prod `
    -f docker-compose.yml -f docker-compose.prod.yml start backend frontend

# 10) Conferir que produção ficou igual ao teste
docker exec $Cp /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$Pp" -d ASMTasksProd -No `
    -Q "SELECT COUNT(*) AS Clientes FROM Cliente; SELECT COUNT(*) AS Etapas FROM Etapa;"
docker exec asmtasks-test-sqlserver-1 /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa `
    -P "<SENHA_DO_.env.test>" -d ASMTasksTest -No `
    -Q "SELECT COUNT(*) AS Clientes FROM Cliente; SELECT COUNT(*) AS Etapas FROM Etapa;"
```

Os dois `SELECT COUNT(*)` (produção e teste) devem bater. Depois acesse a URL de produção
e confirme o login (usuário `admin`, senha conforme o que estiver no teste).

## Observações

- O **login/usuários** e a **ConfiguracaoSistema** também são copiados do teste — produção fica
  exatamente igual, como pedido.
- Configurações que ficam no **`.env.prod`** (portas, `CORS_ORIGINS`, `JWT_KEY`, domínio) **não**
  são afetadas pelo restore — elas continuam as de produção. Só os **dados** do banco são copiados.
- Se o passo 8 reclamar que o banco está em uso, confirme que o passo 7 parou o backend e rode de
  novo (ou use `ALTER DATABASE [ASMTasksProd] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;` antes).
