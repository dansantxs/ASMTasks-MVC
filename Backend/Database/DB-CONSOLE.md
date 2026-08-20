# db.ps1 - Console SQL rapido do ASMTasks

Script para rodar comandos SQL (SELECT, UPDATE, DELETE, etc.) no banco do
ASMTasks que roda em container Docker, sem precisar abrir SSMS nem digitar
usuario/senha na mao.

O script le `DB_PASSWORD` e `DB_NAME` do arquivo `.env` do ambiente e executa
o `sqlcmd` dentro do container.

## Pre-requisitos

- Docker rodando com o container do SQL Server ativo.
- Arquivo `.env.test` (e/ou `.env.prod`) presente na pasta da aplicacao.

Por padrao a pasta da aplicacao e `C:\ASMTasks\app`. Se a sua for outra, use
o parametro `-AppDir`.

## Uso

```powershell
# SELECT
.\db.ps1 "SELECT TOP 10 Id, Nome, MatrizId FROM Cliente;"

# UPDATE
.\db.ps1 "UPDATE Cliente SET MatrizId = NULL WHERE Id = MatrizId;"

# DELETE
.\db.ps1 "DELETE FROM Cliente WHERE Id = 123;"

# Rodar um arquivo .sql inteiro
.\db.ps1 -File .\reset_test\05_corrigir_matriz.sql

# Modo interativo (digita o SQL e aperta ENTER)
.\db.ps1

# Producao (precisa passar -Env prod de proposito)
.\db.ps1 -Env prod "SELECT COUNT(*) FROM Cliente;"

# Pasta da aplicacao diferente do padrao
.\db.ps1 -AppDir "D:\meu\caminho\app" "SELECT 1;"
```

## Seguranca

- **Ambiente padrao e `test`.** So toca em producao com `-Env prod` explicito.
- A senha e lida do `.env` em tempo de execucao; nada fica escrito no script.
- Sempre confira um `SELECT` antes de rodar `UPDATE`/`DELETE` sem `WHERE`.

## Parametros

| Parametro   | Padrao                | Descricao                                             |
|-------------|-----------------------|-------------------------------------------------------|
| `-Query`    | (posicional)          | Comando SQL a executar.                               |
| `-Env`      | `test`                | Ambiente: `test` ou `prod`.                           |
| `-File`     | -                     | Arquivo `.sql` a executar no lugar de `-Query`.       |
| `-AppDir`   | `C:\ASMTasks\app`     | Pasta onde ficam os arquivos `.env`.                  |

## Nomes de container

O script assume:

- teste: `asmtasks-test-sqlserver-1`
- prod:  `asmtasks-sqlserver-1`

Se o container de producao tiver outro nome, ajuste a linha correspondente em
`db.ps1`. Para ver os containers ativos: `docker ps --format "{{.Names}}"`.
