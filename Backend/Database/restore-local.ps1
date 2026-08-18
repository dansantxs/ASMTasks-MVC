#Requires -Version 5.1
<#
.SYNOPSIS
    Restaura um backup (.bak) do ASMTasks dentro do SQL Server em container (dev local).
.DESCRIPTION
    Copia o .bak para o container, detecta automaticamente os nomes logicos do
    backup (funciona para backups vindos de Prod ou Test) e restaura como o banco
    local (padrao: ASMTasks). Use na sua maquina de desenvolvimento, depois de
    subir o container do SQL Server.
.EXAMPLE
    .\restore-local.ps1 -BakPath "C:\Downloads\backup_prod.bak"
.EXAMPLE
    .\restore-local.ps1 -BakPath ".\backup.bak" -DbName ASMTasks -Container asmtasks-sqlserver-1
#>
[CmdletBinding()]
param(
    # Caminho do arquivo .bak (obrigatorio).
    [Parameter(Mandatory = $true)]
    [string]$BakPath,

    # Nome do banco de destino no container.
    [string]$DbName = 'ASMTasks',

    # Nome do container do SQL Server (padrao do docker-compose.yml -> projeto "asmtasks").
    [string]$Container = 'asmtasks-sqlserver-1',

    # Senha do usuario 'sa'. Se omitida, e lida de DB_PASSWORD no .env.dev.
    [string]$Password,

    # Caminho do arquivo .env com DB_PASSWORD (padrao: .env.dev na raiz do repo).
    [string]$EnvFile
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step([string]$m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
function Write-Ok([string]$m)   { Write-Host "    OK: $m" -ForegroundColor Green }

# --- Valida o .bak -----------------------------------------------------------
if (-not (Test-Path $BakPath)) { Write-Error "Arquivo .bak nao encontrado: $BakPath" }
$Bak = (Resolve-Path $BakPath).Path

# --- Resolve a senha do SA ----------------------------------------------------
# Prioridade: -Password  >  -EnvFile  >  .env.dev na raiz do repositorio.
if (-not $Password) {
    if (-not $EnvFile) {
        $EnvFile = Join-Path $PSScriptRoot '..\..\.env.dev'
    }
    if (Test-Path $EnvFile) {
        Get-Content $EnvFile | ForEach-Object {
            if ($_ -match '^\s*DB_PASSWORD\s*=\s*(.+)$') { $Password = $Matches[1].Trim() }
        }
    }
}
if (-not $Password) {
    Write-Error "Senha do SA nao informada. Use -Password, ou crie o .env.dev com DB_PASSWORD=..."
}

# --- Confere se o container esta rodando -------------------------------------
$running = docker ps --filter "name=$Container" --format "{{.Names}}"
if ($running -notcontains $Container) {
    Write-Error @"
Container '$Container' nao esta rodando. Suba o banco primeiro:

  docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.dev up -d sqlserver
"@
}

$Sqlcmd = '/opt/mssql-tools18/bin/sqlcmd'

# --- Copia o backup para dentro do container ---------------------------------
Write-Step "Copiando o backup para o container"
docker cp "$Bak" "${Container}:/tmp/restore.bak"
Write-Ok "Backup copiado para /tmp/restore.bak"

# --- Descobre os nomes logicos (dados/log) dentro do .bak --------------------
Write-Step "Lendo os nomes logicos do backup"
$flRaw = docker exec $Container $Sqlcmd -S localhost -U sa -P "$Password" -No -h -1 -W -s "|" `
    -Q "SET NOCOUNT ON; RESTORE FILELISTONLY FROM DISK='/tmp/restore.bak'"

$dataName = $null
$logName  = $null
foreach ($line in $flRaw) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    $cols = $line -split '\|'
    if ($cols.Count -lt 3) { continue }
    $logical = $cols[0].Trim()
    $type    = $cols[2].Trim()
    if     ($type -eq 'D' -and -not $dataName) { $dataName = $logical }
    elseif ($type -eq 'L' -and -not $logName)  { $logName  = $logical }
}
if (-not $dataName -or -not $logName) {
    Write-Host ($flRaw -join "`n")
    Write-Error "Nao consegui identificar os arquivos de dados/log dentro do .bak."
}
Write-Ok "Dados: $dataName  |  Log: $logName"

# --- Restaura ----------------------------------------------------------------
Write-Step "Restaurando como [$DbName]"
$dataDir = '/var/opt/mssql/data'
$tsql = @"
IF DB_ID(N'$DbName') IS NOT NULL
    ALTER DATABASE [$DbName] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
RESTORE DATABASE [$DbName] FROM DISK='/tmp/restore.bak'
WITH MOVE '$dataName' TO '$dataDir/${DbName}.mdf',
     MOVE '$logName'  TO '$dataDir/${DbName}_log.ldf',
     REPLACE, RECOVERY;
ALTER DATABASE [$DbName] SET MULTI_USER;
"@

docker exec $Container $Sqlcmd -S localhost -U sa -P "$Password" -No -Q "$tsql"
Write-Ok "Restore concluido"

# --- Confere -----------------------------------------------------------------
Write-Step "Conferindo"
docker exec $Container $Sqlcmd -S localhost -U sa -P "$Password" -d "$DbName" -No `
    -Q "SELECT DB_NAME() AS BancoAtual; SELECT COUNT(*) AS Clientes FROM Cliente;"

Write-Host ""
Write-Host "Pronto! Conecte o SSMS / Azure Data Studio em:" -ForegroundColor Green
Write-Host "  Servidor: localhost,1433" -ForegroundColor White
Write-Host "  Login:    sa" -ForegroundColor White
Write-Host "  Senha:    a mesma do DB_PASSWORD (.env.dev)" -ForegroundColor White
Write-Host "  Marque 'Trust server certificate'." -ForegroundColor White
Write-Host ""
