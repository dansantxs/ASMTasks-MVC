-- Migration: rastreio de quem lançou cada tarefa (ProjetoTarefa.CadastradoPorColaboradorId)
--
-- Antes desta versão a autoria só existia no nível do projeto
-- (Projeto.CadastradoPorColaboradorId). Agora cada tarefa registra quem a
-- lançou — na criação do projeto, ao adicionar tarefas a um projeto existente
-- e ao duplicar. Editar uma tarefa já existente NÃO altera a autoria dela.

-- 1. Adiciona a coluna (nullable — linhas antigas ficam sem valor e caem no
--    fallback para o autor do projeto nas consultas)
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[ProjetoTarefa]') AND name = 'CadastradoPorColaboradorId'
)
    ALTER TABLE [dbo].[ProjetoTarefa] ADD [CadastradoPorColaboradorId] [int] NULL;
GO

-- 2. FK para Colaborador
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = 'FK_ProjetoTarefa_CadastradoPorColaborador'
)
BEGIN
    ALTER TABLE [dbo].[ProjetoTarefa]
        ADD CONSTRAINT [FK_ProjetoTarefa_CadastradoPorColaborador]
        FOREIGN KEY ([CadastradoPorColaboradorId]) REFERENCES [dbo].[Colaborador]([Id]);
END
GO

-- 3. Backfill: tarefas existentes herdam o autor do projeto
UPDATE pt
SET pt.CadastradoPorColaboradorId = p.CadastradoPorColaboradorId
FROM [dbo].[ProjetoTarefa] pt
INNER JOIN [dbo].[Projeto] p ON p.Id = pt.ProjetoId
WHERE pt.CadastradoPorColaboradorId IS NULL;
GO
