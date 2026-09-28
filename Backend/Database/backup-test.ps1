#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Gera um backup (.bak) do banco de TESTE do ASMTasks (SQL Server em container).
.DESCRIPTION
    Faz BACKUP DATABASE dentro do container, copia o .bak para a pasta de backups
    do host, remove backups antigos (retencao) e registra tudo num arquivo de log.
    Pensado para rodar sozinho pelo Agendador de Tarefas do Windows.
.EXAMPLE
    .\backup-test.ps1
.EXAMPLE
    .\backup-test.ps1 -RetentionDays 15
#>
[CmdletBinding()]
param(
    # Pasta da aplicacao (onde fica o .env.test).
    [string]$AppDir = 'C:\ASMTasks\app',

    # Pasta onde os .bak serao gravados no host.
    [string]$BackupsDir = 'C:\ASMTasks\backups',

    # Nome do container do SQL Server de teste.
    [string]$Container = 'asmtasks-test-sqlserver-1',

    # Por quantos dias manter os backups. Arquivos mais antigos sao apagados.
    [int]$RetentionDays = 30,

    # Copia na nuvem: remote do rclone + pasta. Vazio ('') = nao envia para a nuvem.
    [string]$CloudRemote = 'gdrive:ASMTasks/backups/test',

    # Por quantos dias manter as copias na nuvem.
    [int]$CloudRetentionDays = 365,

    # rclone e configuracao dele (caminho fixo: a tarefa agendada roda como SYSTEM).
    [string]$RcloneExe = 'C:\ASMTasks\rclone\rclone.exe',
    [string]$RcloneConfig = 'C:\ASMTasks\rclone\rclone.conf'
)

$ErrorActionPreference = 'Stop'

# --- Preparacao --------------------------------------------------------------
New-Item -ItemType Directory -Force -Path $BackupsDir | Out-Null

$logFile = Join-Path $BackupsDir 'backup-test.log'
function Write-Log {
    param([string]$Message, [string]$Level = 'INFO')
    $line = "{0} [{1}] {2}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Level, $Message
    Add-Content -Path $logFile -Value $line
    $color = switch ($Level) { 'ERROR' { 'Red' } 'WARN' { 'Yellow' } default { 'Green' } }
    Write-Host $line -ForegroundColor $color
}

try {
    Write-Log "===== Iniciando backup de TESTE ====="

    # --- Le senha e nome do banco do .env.test -------------------------------
    $envFile = Join-Path $AppDir '.env.test'
    if (-not (Test-Path $envFile)) { throw "Arquivo de ambiente nao encontrado: $envFile" }

    $envT = @{}
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^#=][^=]*)=(.*)$') { $envT[$Matches[1].Trim()] = $Matches[2].Trim() }
    }
    $dbName = $envT['DB_NAME']
    $dbPass = $envT['DB_PASSWORD']
    if (-not $dbName -or -not $dbPass) { throw "DB_NAME/DB_PASSWORD ausentes em $envFile" }

    # --- Confere se o container esta rodando ---------------------------------
    $running = docker ps --filter "name=$Container" --format '{{.Names}}'
    if ($running -notcontains $Container) { throw "Container '$Container' nao esta rodando." }

    # --- Gera o .bak dentro do container -------------------------------------
    $timestamp     = Get-Date -Format 'yyyy-MM-dd_HH-mm'
    $backupName    = "backup_test_$timestamp.bak"
    $containerPath = "/tmp/$backupName"

    Write-Log "Banco: $dbName | Gerando .bak no container..."
    docker exec $Container `
        /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$dbPass" -No `
        -Q "BACKUP DATABASE [$dbName] TO DISK = N'$containerPath' WITH FORMAT"
    if ($LASTEXITCODE -ne 0) { throw "sqlcmd retornou codigo $LASTEXITCODE ao gerar o backup." }

    # --- Copia para o host e limpa o container -------------------------------
    $destPath = Join-Path $BackupsDir $backupName
    Write-Log "Copiando para $destPath..."
    docker cp "${Container}:${containerPath}" "$destPath"
    if ($LASTEXITCODE -ne 0) { throw "docker cp retornou codigo $LASTEXITCODE." }

    docker exec $Container rm -f $containerPath | Out-Null

    if (-not (Test-Path $destPath)) { throw "Backup nao encontrado no host apos a copia: $destPath" }
    $sizeMB = [math]::Round((Get-Item $destPath).Length / 1MB, 2)
    Write-Log "Backup concluido: $destPath ($sizeMB MB)"

    # --- Retencao: remove backups antigos ------------------------------------
    if ($RetentionDays -gt 0) {
        $limite = (Get-Date).AddDays(-$RetentionDays)
        $antigos = Get-ChildItem -Path $BackupsDir -Filter 'backup_test_*.bak' -File |
                   Where-Object { $_.LastWriteTime -lt $limite }
        foreach ($f in $antigos) {
            Remove-Item $f.FullName -Force
            Write-Log "Removido backup antigo (> $RetentionDays dias): $($f.Name)"
        }
    }

    # --- Copia na nuvem --------------------------------------------------------
    # Falha aqui NAO invalida o backup local: registra o erro e sai com codigo 2,
    # para o 'Last Result' da tarefa agendada acusar que a nuvem ficou sem copia.
    if ($CloudRemote) {
        try {
            . (Join-Path $PSScriptRoot 'backup-nuvem.ps1')
            Write-Log "Enviando para a nuvem ($CloudRemote)..."
            Send-BackupNuvem -Arquivo $destPath -Remote $CloudRemote -Filtro 'backup_test_*.bak' `
                -RcloneExe $RcloneExe -RcloneConfig $RcloneConfig -RetentionDays $CloudRetentionDays
            Write-Log "Copia na nuvem concluida."
        }
        catch {
            Write-Log "Falha ao enviar para a nuvem (backup local mantido): $($_.Exception.Message)" 'ERROR'
            Write-Log "===== Backup de TESTE finalizado SEM copia na nuvem =====" 'WARN'
            exit 2
        }
    }

    Write-Log "===== Backup de TESTE finalizado com sucesso ====="
    exit 0
}
catch {
    Write-Log $_.Exception.Message 'ERROR'
    exit 1
}
