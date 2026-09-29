<#
.SYNOPSIS
    Aplica no banco as duas correcoes de atendimento que vieram na versao 1.12.0.
.DESCRIPTION
    Roda, nesta ordem:

      1. corrigir_conclusao_atendimentos.sql
         Preenche a conclusao dos atendimentos que o sistema fechou sozinho por
         horario e nunca gravou DataHoraConclusao -- eles ficavam de fora do
         indicador "Atendimentos Realizados" do dashboard.

      2. eventos_agendamento_atendimentos.sql
         Libera o tipo 'A' no CHECK da tabela de historico e cria o evento de
         agendamento dos atendimentos que ainda nao tem evento nenhum, que por
         isso nao apareciam no Relatorio de Historico de Atendimentos.

    O SEGUNDO NAO E OPCIONAL: o codigo da 1.12.0 grava o tipo 'A' ao criar
    atendimento, e sem o CHECK novo o cadastro passa a dar erro.

    Use -Simular primeiro. Ele roda tudo dentro de uma transacao e desfaz no
    fim: os numeros aparecem, o banco nao muda.

    Por seguranca o ambiente padrao e TESTE. Para tocar em PRODUCAO e preciso
    passar -Env prod explicitamente, e o script pede confirmacao digitada.
.PARAMETER Env
    'dev', 'test' (padrao) ou 'prod'.
.PARAMETER Simular
    Executa tudo e desfaz no fim (BEGIN TRANSACTION / ROLLBACK). Nada e gravado.
.PARAMETER PularDatasComissao
    Pula a parte que corrige a data dos eventos no historico. Use se a comissao
    dos meses afetados ja foi paga conferindo o relatorio antigo -- essa parte
    muda o dia (e, em poucos casos, o mes) em que o atendimento aparece no
    Relatorio de Comissao. O resto da correcao continua sendo aplicado.
.PARAMETER AppDir
    Pasta onde ficam os arquivos .env. Em 'dev', assume a raiz do repositorio.
.PARAMETER Container
    Nome do container do SQL Server, se for diferente do padrao do ambiente.
.EXAMPLE
    .\aplicar_correcoes_atendimentos.ps1 -Env dev -Simular
.EXAMPLE
    .\aplicar_correcoes_atendimentos.ps1 -Simular
    # teste, sem gravar
.EXAMPLE
    .\aplicar_correcoes_atendimentos.ps1
    # teste, aplicando de verdade
.EXAMPLE
    .\aplicar_correcoes_atendimentos.ps1 -Env prod -Simular
    # producao, so para ver os numeros
.EXAMPLE
    .\aplicar_correcoes_atendimentos.ps1 -Env prod
    # producao, aplicando (faca backup antes)
#>
[CmdletBinding()]
param(
    [ValidateSet('dev', 'test', 'prod')]
    [string]$Env = 'test',

    [switch]$Simular,

    [switch]$PularDatasComissao,

    [string]$AppDir = 'C:\ASMTasks\app',

    [string]$Container
)

$ErrorActionPreference = 'Stop'

# --- Ambiente ----------------------------------------------------------------
if ($Env -eq 'dev') {
    if (-not $PSBoundParameters.ContainsKey('AppDir')) {
        $AppDir = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
    }
    $envFile = Join-Path $AppDir '.env.dev'
    $padraoContainer = 'asmtasks-sqlserver-1'
}
elseif ($Env -eq 'prod') {
    $envFile = Join-Path $AppDir '.env.prod'
    $padraoContainer = 'asmtasks-sqlserver-1'   # ajuste se o de producao tiver outro nome
}
else {
    $envFile = Join-Path $AppDir '.env.test'
    $padraoContainer = 'asmtasks-test-sqlserver-1'
}
if (-not $Container) { $Container = $padraoContainer }

if (-not (Test-Path $envFile)) { throw "Arquivo de ambiente nao encontrado: $envFile" }

$envVars = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^([^#=][^=]*)=(.*)$') { $envVars[$Matches[1].Trim()] = $Matches[2].Trim() }
}
$dbName = $envVars['DB_NAME']
$dbPass = $envVars['DB_PASSWORD']
if (-not $dbName -or -not $dbPass) { throw "DB_NAME/DB_PASSWORD ausentes em $envFile" }

$running = docker ps --filter "name=$Container" --format '{{.Names}}'
if ($running -notcontains $Container) { throw "Container '$Container' nao esta rodando." }

# --- Execucao de SQL ---------------------------------------------------------
function Invoke-Sql {
    param([string]$Sql, [switch]$SemCabecalho)

    # Vai por arquivo, e nao pelo pipe, para nao depender de como o PowerShell
    # codifica a saida padrao.
    $local = Join-Path $env:TEMP ("asmtasks_" + [guid]::NewGuid().ToString('N') + ".sql")
    $remoto = '/tmp/asmtasks_aplicar.sql'
    try {
        Set-Content -Path $local -Value $Sql -Encoding utf8
        docker cp $local "${Container}:$remoto" | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "docker cp falhou (codigo $LASTEXITCODE)." }

        $argumentos = @(
            '/opt/mssql-tools18/bin/sqlcmd', '-S', 'localhost', '-U', 'sa', '-P', $dbPass,
            '-No', '-d', $dbName, '-b', '-f', '65001', '-i', $remoto
        )
        if ($SemCabecalho) { $argumentos += @('-h', '-1') }

        docker exec $Container @argumentos
        if ($LASTEXITCODE -ne 0) { throw "sqlcmd retornou codigo $LASTEXITCODE." }
    }
    finally {
        # O arquivo no container fica: ele vai como root pelo docker cp e o
        # usuario do container nao consegue apagar. O caminho e fixo, entao a
        # proxima execucao sobrescreve. Nao ha credencial nele -- a senha vai
        # como argumento do sqlcmd, nao dentro do SQL.
        if (Test-Path $local) { Remove-Item $local -Force }
    }
}

function Show-Conferencia {
    param([string]$Titulo)

    $consulta = @"
SET NOCOUNT ON;
SELECT '  Realizados sem data de conclusao: ' + CAST(COUNT(*) AS VARCHAR)
FROM Atendimento WHERE Status = 'R' AND DataHoraConclusao IS NULL;
SELECT '  Sem evento nenhum no historico:   ' + CAST(COUNT(*) AS VARCHAR)
FROM Atendimento a
WHERE NOT EXISTS (SELECT 1 FROM AtendimentoHistoricoStatus h WHERE h.AtendimentoId = a.Id);
"@

    Write-Host ''
    Write-Host $Titulo -ForegroundColor Cyan
    Invoke-Sql -Sql $consulta -SemCabecalho
}

function Invoke-ScriptSql {
    param([string]$Arquivo)

    $caminho = Join-Path $PSScriptRoot $Arquivo
    if (-not (Test-Path $caminho)) { throw "Script nao encontrado: $caminho" }
    $sql = Get-Content $caminho -Raw

    if ($PularDatasComissao) {
        $sql = $sql.Replace(
            'DECLARE @CorrigirDatasDoHistorico BIT = 1;',
            'DECLARE @CorrigirDatasDoHistorico BIT = 0;')
    }

    if ($Simular) {
        # A transacao cobre tambem o ALTER TABLE: no SQL Server, DDL e transacional.
        $sql = "BEGIN TRANSACTION;`r`n" + $sql + "`r`nROLLBACK;`r`nPRINT '  (simulacao: desfeito)';"
    }

    Write-Host ''
    Write-Host "--- $Arquivo" -ForegroundColor Yellow
    Invoke-Sql -Sql $sql
}

# --- Cabecalho e confirmacao -------------------------------------------------
if ($Simular) { $modo = 'SIMULACAO (nada sera gravado)' } else { $modo = 'APLICANDO DE VERDADE' }
if ($Simular) { $corModo = 'Cyan' } else { $corModo = 'Yellow' }

Write-Host ''
Write-Host "[$Env] Container: $Container | Banco: $dbName" -ForegroundColor Cyan
Write-Host "Modo: $modo" -ForegroundColor $corModo
if ($PularDatasComissao) {
    Write-Host 'Datas do historico: NAO serao corrigidas (-PularDatasComissao)' -ForegroundColor Yellow
}

if ($Env -eq 'prod' -and -not $Simular) {
    Write-Host ''
    Write-Host 'Isto altera o banco de PRODUCAO e so volta atras por restore.' -ForegroundColor Red
    Write-Host 'Ja rodou o backup (Backend\Database\backup-prod.ps1)?' -ForegroundColor Red
    $resposta = Read-Host 'Digite APLICAR para continuar'
    if ($resposta -cne 'APLICAR') {
        Write-Host 'Cancelado.' -ForegroundColor Yellow
        exit 1
    }
}

# --- Execucao ----------------------------------------------------------------
try {
    Show-Conferencia 'Antes:'

    Invoke-ScriptSql 'corrigir_conclusao_atendimentos.sql'
    Invoke-ScriptSql 'eventos_agendamento_atendimentos.sql'

    if ($Simular) {
        Show-Conferencia 'Depois (a simulacao ja foi desfeita, entao os numeros repetem):'
    }
    else {
        Show-Conferencia 'Depois (os dois devem estar em 0):'
    }

    Write-Host ''
    if ($Simular) {
        Write-Host 'Simulacao concluida. Nada foi gravado.' -ForegroundColor Green
        Write-Host 'Para aplicar, rode o mesmo comando sem -Simular.' -ForegroundColor Green
    }
    else {
        Write-Host 'Correcoes aplicadas.' -ForegroundColor Green
    }
    exit 0
}
catch {
    Write-Host ''
    Write-Host "FALHOU: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'Cada script roda por inteiro ou nao roda: se parou no meio, foi entre um e outro.' -ForegroundColor Red
    exit 1
}
