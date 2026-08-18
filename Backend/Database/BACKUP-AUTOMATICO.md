# Backup automático (Produção e Teste)

Scripts para gerar backups `.bak` do SQL Server (em container) e agendá-los para
rodar **duas vezes ao dia** no servidor Windows.

## Arquivos

| Arquivo | O que faz |
|---|---|
| `backup-prod.ps1` | Gera o backup do banco de **produção** (`asmtasks-prod-sqlserver-1`). |
| `backup-test.ps1` | Gera o backup do banco de **teste** (`asmtasks-test-sqlserver-1`). |
| `setup-backup-agendado.ps1` | Registra as tarefas no Agendador do Windows (12h e 18h). |

Cada backup:
- lê `DB_NAME`/`DB_PASSWORD` do `.env.prod` / `.env.test`;
- gera o `.bak` dentro do container e copia para `C:\ASMTasks\backups`;
- **remove backups com mais de 30 dias** (ajustável com `-RetentionDays`);
- grava um **log** em `C:\ASMTasks\backups\backup-prod.log` / `backup-test.log`.

## 1. Instalar os scripts no servidor

Copie esta pasta (ou os três `.ps1`) para uma pasta fixa no servidor, por exemplo
`C:\ASMTasks\scripts\`. Os caminhos padrão (`C:\ASMTasks\app`, `C:\ASMTasks\backups`)
podem ser trocados por parâmetro se o seu ambiente for diferente.

## 2. Testar manualmente uma vez (como Administrador)

```powershell
.\backup-prod.ps1
.\backup-test.ps1
```

Confira se o `.bak` apareceu em `C:\ASMTasks\backups` e olhe o `.log`.

## 3. Agendar (12:00 e 18:00, todos os dias)

Abra o **PowerShell como Administrador** na pasta dos scripts e rode:

```powershell
# Conta SYSTEM (padrão) — use se o Docker for acessível pela conta do sistema:
.\setup-backup-agendado.ps1

# OU, se o Docker só funciona no seu usuário (pedirá a senha):
.\setup-backup-agendado.ps1 -RunAsUser "SERVIDOR\seu_usuario"
```

Isso cria 4 tarefas: `ASMTasks\Backup Prod 12h/18h` e `ASMTasks\Backup Test 12h/18h`.

### Testar uma tarefa agendada

```powershell
schtasks /Run /TN "ASMTasks\Backup Prod 12h"
schtasks /Query /TN "ASMTasks\Backup Prod 12h" /V /FO LIST   # 'Last Result' deve ser 0
```

### Remover as tarefas

```powershell
.\setup-backup-agendado.ps1 -Remove
```

## Observações

- **SYSTEM x usuário:** se ao rodar pela tarefa o Docker não for encontrado
  (`docker: command not found` / erro de conexão), rode o setup com
  `-RunAsUser "SERVIDOR\usuario"` — a conta SYSTEM às vezes não enxerga o Docker Desktop.
- **Retenção:** para manter, por exemplo, 15 dias, ajuste dentro dos scripts ou
  passe `-RetentionDays 15` (e, se quiser, altere a ação da tarefa no Agendador).
- **Restaurar** um `.bak` no ambiente local: use o `restore-local.ps1` desta mesma pasta.
