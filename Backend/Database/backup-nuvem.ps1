<#
.SYNOPSIS
    Envia um .bak para a nuvem (Google Drive) com o rclone e apaga por la as copias antigas.
.DESCRIPTION
    Nao roda sozinho: e carregado (dot-source) por backup-prod.ps1 e backup-test.ps1, que
    chamam Send-BackupNuvem depois de gerar o backup local.

    O rclone e a configuracao dele ficam num caminho FIXO (C:\ASMTasks\rclone), e nao no
    perfil do usuario: as tarefas agendadas rodam como SYSTEM, que nao enxerga o
    %APPDATA%\rclone\rclone.conf de quem configurou. Passo a passo no GUIA-POWERSHELL.md,
    secao 4.
#>

function Send-BackupNuvem {
    param(
        # .bak ja gerado no host.
        [Parameter(Mandatory)][string]$Arquivo,

        # Remote do rclone + pasta de destino. Ex.: gdrive:ASMTasks/backups/prod
        [Parameter(Mandatory)][string]$Remote,

        # Padrao dos arquivos que a retencao pode apagar. Ex.: backup_prod_*.bak
        [Parameter(Mandatory)][string]$Filtro,

        [Parameter(Mandatory)][string]$RcloneExe,
        [Parameter(Mandatory)][string]$RcloneConfig,

        # Copias na nuvem mais antigas que isso sao apagadas. 0 = nunca apaga.
        [int]$RetentionDays = 365
    )

    $exe = if (Test-Path $RcloneExe) { $RcloneExe } else { (Get-Command rclone -ErrorAction SilentlyContinue).Source }
    if (-not $exe) { throw "rclone nao encontrado (procurado em $RcloneExe e no PATH)." }
    if (-not (Test-Path $RcloneConfig)) { throw "Configuracao do rclone nao encontrada: $RcloneConfig" }

    & $exe copy "$Arquivo" "$Remote" --config "$RcloneConfig" --retries 3 --low-level-retries 5
    if ($LASTEXITCODE -ne 0) { throw "rclone copy retornou codigo $LASTEXITCODE." }

    # --min-age olha a data de modificacao, que o rclone copy preserva do arquivo local.
    # No Google Drive o apagado vai para a lixeira, que se esvazia sozinha em 30 dias.
    if ($RetentionDays -gt 0) {
        & $exe delete "$Remote" --config "$RcloneConfig" --min-age "${RetentionDays}d" --include "$Filtro"
        if ($LASTEXITCODE -ne 0) { throw "rclone delete retornou codigo $LASTEXITCODE." }
    }
}
