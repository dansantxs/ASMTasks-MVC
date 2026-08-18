#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Registra no Agendador de Tarefas do Windows os backups automaticos do ASMTasks.
.DESCRIPTION
    Cria 4 tarefas que rodam duas vezes ao dia (12:00 e 18:00):
        - Backup Prod 12h / 18h  -> backup-prod.ps1
        - Backup Test 12h / 18h  -> backup-test.ps1
    As tarefas rodam com privilegios elevados e mesmo com o usuario deslogado.
    Rode este script UMA vez, no servidor, como Administrador.
.EXAMPLE
    .\setup-backup-agendado.ps1
.EXAMPLE
    # Rodando como um usuario especifico (necessario se o Docker so existe no contexto dele):
    .\setup-backup-agendado.ps1 -RunAsUser "SERVIDOR\admin"
.EXAMPLE
    # Remove todas as tarefas criadas por este script:
    .\setup-backup-agendado.ps1 -Remove
#>
[CmdletBinding()]
param(
    # Pasta onde estao os scripts backup-prod.ps1 e backup-test.ps1.
    # Padrao: a propria pasta deste script.
    [string]$ScriptsDir = $PSScriptRoot,

    # Horarios (formato HH:mm) em que os backups devem rodar.
    [string[]]$Horarios = @('12:00', '18:00'),

    # Conta usada para executar as tarefas.
    #   'SYSTEM' (padrao) -> nao precisa de senha, sempre elevada.
    #                        Use SOMENTE se o Docker for acessivel pela conta SYSTEM.
    #   'DOMINIO\usuario' -> o script pedira a senha (tarefa roda mesmo deslogado).
    [string]$RunAsUser = 'SYSTEM',

    # Remove as tarefas ao inves de cria-las.
    [switch]$Remove
)

$ErrorActionPreference = 'Stop'

# Cada item: nome-base da tarefa + script correspondente.
$jobs = @(
    @{ Base = 'ASMTasks\Backup Prod'; Script = 'backup-prod.ps1' },
    @{ Base = 'ASMTasks\Backup Test'; Script = 'backup-test.ps1' }
)

# --- Modo remocao ------------------------------------------------------------
if ($Remove) {
    foreach ($job in $jobs) {
        foreach ($h in $Horarios) {
            $taskName = "$($job.Base) $($h.Replace(':',''))h"
            schtasks /Delete /TN "$taskName" /F 2>$null
            Write-Host "Removida (se existia): $taskName" -ForegroundColor Yellow
        }
    }
    Write-Host "`nRemocao concluida." -ForegroundColor Green
    return
}

# --- Valida os scripts -------------------------------------------------------
foreach ($job in $jobs) {
    $path = Join-Path $ScriptsDir $job.Script
    if (-not (Test-Path $path)) { throw "Script nao encontrado: $path" }
}

# --- Monta credenciais -------------------------------------------------------
$isSystem = ($RunAsUser -eq 'SYSTEM')
$cred = @()
if ($isSystem) {
    $cred = @('/RU', 'SYSTEM')
} else {
    $sec  = Read-Host "Senha de $RunAsUser" -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    $cred = @('/RU', $RunAsUser, '/RP', $plain)
}

# --- Cria as tarefas ---------------------------------------------------------
foreach ($job in $jobs) {
    $scriptPath = Join-Path $ScriptsDir $job.Script
    $action = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""

    foreach ($h in $Horarios) {
        $taskName = "$($job.Base) $($h.Replace(':',''))h"
        schtasks /Create /TN "$taskName" /SC DAILY /ST $h `
            /TR "$action" @cred /RL HIGHEST /F | Out-Null
        Write-Host "Criada: $taskName  (diariamente as $h)" -ForegroundColor Green
    }
}

Write-Host "`nTarefas registradas com sucesso." -ForegroundColor Green
Write-Host "Teste uma agora com:" -ForegroundColor Cyan
Write-Host "    schtasks /Run /TN `"ASMTasks\Backup Prod $($Horarios[0].Replace(':',''))h`"" -ForegroundColor White
Write-Host "E confira o log em C:\ASMTasks\backups\backup-prod.log" -ForegroundColor White
