-- Migration: Mover SetorId de Projeto para ProjetoTarefa
-- Executar no banco de dados existente

-- 1. Remover FK e index de Projeto.SetorId
ALTER TABLE [dbo].[Projeto] DROP CONSTRAINT [FK_Projeto_Setor];
GO
DROP INDEX [IX_Projeto_SetorId] ON [dbo].[Projeto];
GO

-- 2. Remover coluna SetorId de Projeto
ALTER TABLE [dbo].[Projeto] DROP COLUMN [SetorId];
GO

-- 3. Adicionar coluna SetorId (nullable) em ProjetoTarefa
ALTER TABLE [dbo].[ProjetoTarefa] ADD [SetorId] [int] NULL;
GO

-- 3b. Preencher todas as tarefas existentes com o primeiro setor ativo disponível
UPDATE [dbo].[ProjetoTarefa]
SET [SetorId] = (SELECT TOP 1 [Id] FROM [dbo].[Setor] WHERE [Ativo] = 1 ORDER BY [Id]);
GO

-- 3c. Tornar coluna NOT NULL
ALTER TABLE [dbo].[ProjetoTarefa] ALTER COLUMN [SetorId] [int] NOT NULL;
GO

-- 4. Adicionar FK de ProjetoTarefa.SetorId para Setor
ALTER TABLE [dbo].[ProjetoTarefa] WITH CHECK
    ADD CONSTRAINT [FK_ProjetoTarefa_Setor] FOREIGN KEY([SetorId])
    REFERENCES [dbo].[Setor] ([Id]);
GO
ALTER TABLE [dbo].[ProjetoTarefa] CHECK CONSTRAINT [FK_ProjetoTarefa_Setor];
GO

-- 5. Adicionar index em ProjetoTarefa.SetorId
CREATE NONCLUSTERED INDEX [IX_ProjetoTarefa_SetorId] ON [dbo].[ProjetoTarefa]
(
    [SetorId] ASC
) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF,
        DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY];
GO
