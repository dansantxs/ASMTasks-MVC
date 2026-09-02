-- Migration: registra QUANDO cada tarefa foi lancada (ProjetoTarefa.DataCadastro)
--
-- Complemento da migration_tarefa_cadastrado_por.sql: alem de quem lancou a
-- tarefa, passamos a guardar a data/hora do lancamento. Usado no Relatorio de
-- Comissao para exibir a linha Lancado por com data.
-- (Sem acentos nem aspas: este arquivo tambem roda via db.ps1, que passa o SQL
-- inline pro sqlcmd -- aspas duplas ou encoding UTF-8 quebrariam a chamada.)

-- 1. Adiciona a coluna (nullable -- linhas antigas ganham valor no backfill
--    abaixo, novas tarefas gravam SYSDATETIME() no INSERT)
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[ProjetoTarefa]') AND name = 'DataCadastro'
)
    ALTER TABLE [dbo].[ProjetoTarefa] ADD [DataCadastro] [datetime2](0) NULL;
GO

-- 2. Backfill: tarefas existentes herdam a data de cadastro do projeto
UPDATE pt
SET pt.DataCadastro = p.DataCadastro
FROM [dbo].[ProjetoTarefa] pt
INNER JOIN [dbo].[Projeto] p ON p.Id = pt.ProjetoId
WHERE pt.DataCadastro IS NULL;
GO
