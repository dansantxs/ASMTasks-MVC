<#
.SYNOPSIS
    Executa comandos SQL (SELECT, UPDATE, DELETE, etc.) no banco do ASMTasks
    rodando em container Docker, lendo usuario/senha/banco do arquivo .env.
.DESCRIPTION
    Carrega DB_PASSWORD e DB_NAME do .env do ambiente escolhido, monta a chamada
    ao sqlcmd dentro do container e executa a query informada. Aceita a query
    como parametro, como arquivo .sql ou em modo interativo.

    Por seguranca o ambiente padrao e TESTE. Para tocar em PRODUCAO e preciso
    passar -Env prod explicitamente.
.PARAMETER Query
    Comando SQL a executar (string). Se omitido e sem -File, entra em modo
    interativo pedindo o SQL.
.PARAMETER Env
    Ambiente alvo: 'test' (padrao) ou 'prod'. Define qual .env e qual container
    serao usados.
.PARAMETER File
    Caminho de um arquivo .sql a executar no lugar de -Query.
.EXAMPLE
    .\db.ps1 "SELECT TOP 10 Id, Nome, MatrizId FROM Cliente;"
.EXAMPLE
    .\db.ps1 "UPDATE Cliente SET MatrizId = NULL WHERE Id = MatrizId;"
.EXAMPLE
    .\db.ps1 -File .\reset_test\05_corrigir_matriz.sql
.EXAMPLE
    .\db.ps1 -Env prod "SELECT COUNT(*) FROM Cliente;"
.EXAMPLE
    .\db.ps1
    # modo interativo: digita o SQL e aperta ENTER
#>
[CmdletBinding()]
param(
    # Comando SQL a executar. Sem este e sem -File, entra em modo interativo.
    [Parameter(Position = 0)]
    [string]$Query,

    # Ambiente alvo. Padrao 'test'. Use 'prod' de proposito para producao.
    [ValidateSet('test', 'prod')]
    [string]$Env = 'test',

    # Caminho de um arquivo .sql a executar no lugar de -Query.
    [string]$File,

    # Pasta da aplicacao (onde ficam os arquivos .env).
    [string]$AppDir = 'C:\ASMTasks\app'
)

$ErrorActionPreference = 'Stop'

# --- Resolve arquivo .env e container conforme o ambiente --------------------
if ($Env -eq 'prod') {
    $envFile   = Join-Path $AppDir '.env.prod'
    $container = 'asmtasks-sqlserver-1'        # ajuste se o container de prod tiver outro nome
} else {
    $envFile   = Join-Path $AppDir '.env.test'
    $container = 'asmtasks-test-sqlserver-1'
}

if (-not (Test-Path $envFile)) { throw "Arquivo de ambiente nao encontrado: $envFile" }

# --- Le DB_PASSWORD e DB_NAME do .env ----------------------------------------
$envVars = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^([^#=][^=]*)=(.*)$') { $envVars[$Matches[1].Trim()] = $Matches[2].Trim() }
}
$dbName = $envVars['DB_NAME']
$dbPass = $envVars['DB_PASSWORD']
if (-not $dbName -or -not $dbPass) { throw "DB_NAME/DB_PASSWORD ausentes em $envFile" }

# --- Confere se o container esta rodando -------------------------------------
$running = docker ps --filter "name=$container" --format '{{.Names}}'
if ($running -notcontains $container) { throw "Container '$container' nao esta rodando." }

# --- Determina o SQL (arquivo, parametro ou modo interativo) -----------------
if ($File) {
    if (-not (Test-Path $File)) { throw "Arquivo SQL nao encontrado: $File" }
    $sql = Get-Content $File -Raw
} elseif ($Query) {
    $sql = $Query
} else {
    $sql = Read-Host 'Digite o SQL'
}
if ([string]::IsNullOrWhiteSpace($sql)) { throw 'Nenhum SQL informado.' }

Write-Host "[$Env] Container: $container | Banco: $dbName" -ForegroundColor Cyan

# --- Executa no container ----------------------------------------------------
docker exec -i $container `
    /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$dbPass" -No -d $dbName `
    -Q "$sql"

exit $LASTEXITCODE
