-- Migration: registra QUANDO cada tarefa foi lançada (ProjetoTarefa.DataCadastro)
--
-- Complemento da migration_tarefa_cadastrado_por.sql: além de quem lançou a
-- tarefa, passamos a guardar a data/hora do lançamento. Usado no Relatório de
-- Comissão para exibir a linha "Lançado por" com data.

-- 1. Adiciona a coluna (nullable — linhas antigas ganham valor no backfill abaixo,
--    novas tarefas gravam SYSDATETIME() no INSERT)
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
