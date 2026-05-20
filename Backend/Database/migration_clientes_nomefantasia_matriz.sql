-- Migration: NomeFantasia e MatrizId em Cliente, ExibicaoNomeCliente em ConfiguracaoSistema

-- 1. Adiciona NomeFantasia ao Cliente (somente se não existir)
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[Cliente]') AND name = 'NomeFantasia'
)
    ALTER TABLE [dbo].[Cliente] ADD [NomeFantasia] [nvarchar](100) NULL;
GO

-- 2. Adiciona MatrizId ao Cliente — self-reference opcional
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[Cliente]') AND name = 'MatrizId'
)
    ALTER TABLE [dbo].[Cliente] ADD [MatrizId] [int] NULL;
GO

-- 3. Cria FK MatrizId -> Cliente(Id) se ainda não existe
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = 'FK_Cliente_Matriz'
)
BEGIN
    ALTER TABLE [dbo].[Cliente]
        ADD CONSTRAINT [FK_Cliente_Matriz]
        FOREIGN KEY ([MatrizId]) REFERENCES [dbo].[Cliente]([Id]);
END
GO

-- 4. Adiciona ExibicaoNomeCliente à ConfiguracaoSistema
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[ConfiguracaoSistema]') AND name = 'ExibicaoNomeCliente'
)
    ALTER TABLE [dbo].[ConfiguracaoSistema] ADD [ExibicaoNomeCliente] [nvarchar](20) NULL;
GO
