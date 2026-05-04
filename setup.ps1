#Requires -Version 5.1
<#
.SYNOPSIS
    Script de setup inicial do ASMTasks.
.DESCRIPTION
    Configura o backend, banco de dados e frontend para desenvolvimento local.
    Execute na raiz do repositório: .\setup.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step([string]$msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Ok([string]$msg)   { Write-Host "    OK: $msg" -ForegroundColor Green }
function Write-Warn([string]$msg) { Write-Host "    AVISO: $msg" -ForegroundColor Yellow }

$Root    = $PSScriptRoot
$BackendDir  = Join-Path $Root 'Backend\API'
$FrontendDir = Join-Path $Root 'Frontend'
$DbDir       = Join-Path $Root 'Backend\Database'

# ---------------------------------------------------------------------------
# Verificação de pré-requisitos
# ---------------------------------------------------------------------------
Write-Step "Verificando pré-requisitos"

if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    Write-Error "dotnet nao encontrado. Instale o .NET 9 SDK: https://dotnet.microsoft.com/download/dotnet/9.0"
}
$dotnetVersion = (dotnet --version)
Write-Ok ".NET SDK $dotnetVersion"

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "node nao encontrado. Instale o Node.js 20+: https://nodejs.org/"
}
$nodeVersion = (node --version)
Write-Ok "Node.js $nodeVersion"

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm nao encontrado. Reinstale o Node.js."
}
Write-Ok "npm $(npm --version)"

# ---------------------------------------------------------------------------
# Backend — appsettings.Development.json
# ---------------------------------------------------------------------------
Write-Step "Configurando backend"

$appSettingsExample = Join-Path $BackendDir 'appsettings.Example.json'
$appSettingsDev     = Join-Path $BackendDir 'appsettings.Development.json'

if (-not (Test-Path $appSettingsDev)) {
    Copy-Item $appSettingsExample $appSettingsDev
    Write-Ok "appsettings.Development.json criado a partir do exemplo"
} else {
    Write-Warn "appsettings.Development.json ja existe, nao sera sobrescrito"
}

# Lê o arquivo atual para verificar se já foi preenchido
$appSettings = Get-Content $appSettingsDev -Raw | ConvertFrom-Json
$needsEdit = $false

if ([string]::IsNullOrWhiteSpace($appSettings.StringConexao) -or $appSettings.StringConexao -like '*<*') {
    $needsEdit = $true
}
if ([string]::IsNullOrWhiteSpace($appSettings.Jwt.Key) -or $appSettings.Jwt.Key -like '*<*') {
    $needsEdit = $true
}

if ($needsEdit) {
    Write-Host ""
    Write-Host "    Preencha as configuracoes obrigatorias em:" -ForegroundColor Yellow
    Write-Host "    $appSettingsDev" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "    StringConexao : string de conexao com o SQL Server" -ForegroundColor Yellow
    Write-Host "    Jwt.Key       : chave secreta com no minimo 32 caracteres" -ForegroundColor Yellow
    Write-Host ""

    $resp = Read-Host "    Deseja abrir o arquivo agora para editar? (s/n)"
    if ($resp -match '^[sS]') {
        if (Get-Command code -ErrorAction SilentlyContinue) {
            code $appSettingsDev
        } else {
            notepad $appSettingsDev
        }
        Read-Host "    Pressione ENTER apos salvar o arquivo"
    } else {
        Write-Warn "Lembre-se de preencher $appSettingsDev antes de iniciar a API"
    }
}

# ---------------------------------------------------------------------------
# Banco de dados
# ---------------------------------------------------------------------------
Write-Step "Configurando banco de dados"

$schemaScript = Join-Path $DbDir 'schema.sql'
$seedScript   = Join-Path $DbDir 'seed.sql'

Write-Host ""
Write-Host "    Para aplicar o banco de dados, execute no SQL Server Management Studio" -ForegroundColor Yellow
Write-Host "    ou via sqlcmd os seguintes scripts, nesta ordem:" -ForegroundColor Yellow
Write-Host ""
Write-Host "    1. $schemaScript" -ForegroundColor White
Write-Host "    2. $seedScript" -ForegroundColor White
Write-Host ""
Write-Host "    Credenciais iniciais apos o seed: login=admin  senha=admin123" -ForegroundColor Green
Write-Host ""

$sqlcmdAvailable = Get-Command sqlcmd -ErrorAction SilentlyContinue
if ($sqlcmdAvailable) {
    $resp = Read-Host "    sqlcmd detectado. Deseja aplicar os scripts automaticamente? (s/n)"
    if ($resp -match '^[sS]') {
        $server = Read-Host "    Nome ou IP do servidor SQL Server (ex: localhost ou localhost\SQLEXPRESS)"
        $useWindowsAuth = Read-Host "    Usar autenticacao Windows? (s/n)"

        if ($useWindowsAuth -match '^[sS]') {
            Write-Host "    Aplicando schema.sql..." -ForegroundColor Cyan
            sqlcmd -S $server -E -i $schemaScript
            Write-Host "    Aplicando seed.sql..." -ForegroundColor Cyan
            sqlcmd -S $server -E -i $seedScript
        } else {
            $sqlUser = Read-Host "    Usuario SQL"
            $sqlPass = Read-Host "    Senha SQL" -AsSecureString
            $sqlPassPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
                [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sqlPass)
            )
            Write-Host "    Aplicando schema.sql..." -ForegroundColor Cyan
            sqlcmd -S $server -U $sqlUser -P $sqlPassPlain -i $schemaScript
            Write-Host "    Aplicando seed.sql..." -ForegroundColor Cyan
            sqlcmd -S $server -U $sqlUser -P $sqlPassPlain -i $seedScript
        }
        Write-Ok "Scripts de banco aplicados"
    }
} else {
    Write-Warn "sqlcmd nao encontrado — aplique os scripts manualmente"
}

# ---------------------------------------------------------------------------
# Frontend — .env.local
# ---------------------------------------------------------------------------
Write-Step "Configurando frontend"

$envExample = Join-Path $FrontendDir '.env.local.example'
$envLocal   = Join-Path $FrontendDir '.env.local'

if (-not (Test-Path $envLocal)) {
    Copy-Item $envExample $envLocal
    Write-Ok ".env.local criado a partir do exemplo"
} else {
    Write-Warn ".env.local ja existe, nao sera sobrescrito"
}

Write-Host "    Instalando dependencias npm..." -ForegroundColor Cyan
Push-Location $FrontendDir
try {
    npm install --prefer-offline 2>&1 | Out-Null
    Write-Ok "Dependencias instaladas"
} finally {
    Pop-Location
}

# ---------------------------------------------------------------------------
# Restaurar pacotes do backend
# ---------------------------------------------------------------------------
Write-Step "Restaurando pacotes .NET"
Push-Location $BackendDir
try {
    dotnet restore 2>&1 | Out-Null
    Write-Ok "Pacotes .NET restaurados"
} finally {
    Pop-Location
}

# ---------------------------------------------------------------------------
# Resumo final
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  Setup concluido!" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Para iniciar o backend:" -ForegroundColor White
Write-Host "    cd Backend\API" -ForegroundColor Gray
Write-Host "    dotnet run --launch-profile https" -ForegroundColor Gray
Write-Host ""
Write-Host "  Para iniciar o frontend (em outro terminal):" -ForegroundColor White
Write-Host "    cd Frontend" -ForegroundColor Gray
Write-Host "    npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  Acesse: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Login inicial: admin / admin123" -ForegroundColor Cyan
Write-Host ""
