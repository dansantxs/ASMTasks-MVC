-- Migration: registra quem foi o último a alterar o projeto (Projeto.AlteradoPorColaboradorId / DataAlteracao)
--
-- O autor original continua em Projeto.CadastradoPorColaboradorId. Estas
-- colunas passam a guardar quem editou o projeto por último e quando —
-- exibido no formulário de edição e na visualização do projeto.

-- 1. Colunas (nullable — projetos nunca editados ficam sem valor)
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[Projeto]') AND name = 'AlteradoPorColaboradorId'
)
    ALTER TABLE [dbo].[Projeto] ADD [AlteradoPorColaboradorId] [int] NULL;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[Projeto]') AND name = 'DataAlteracao'
)
    ALTER TABLE [dbo].[Projeto] ADD [DataAlteracao] [datetime2](0) NULL;
GO

-- 2. FK para Colaborador
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = 'FK_Projeto_ColaboradorAlteracao'
)
BEGIN
    ALTER TABLE [dbo].[Projeto]
        ADD CONSTRAINT [FK_Projeto_ColaboradorAlteracao]
        FOREIGN KEY ([AlteradoPorColaboradorId]) REFERENCES [dbo].[Colaborador]([Id]);
END
GO
