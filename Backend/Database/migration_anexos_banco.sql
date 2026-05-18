-- Migration: armazenamento de anexos migrado de filesystem para banco de dados
-- Executa em bancos existentes que já possuem a tabela ProjetoTarefaAnexo

-- 1. Adiciona a coluna de conteúdo binário (inicialmente nullable para não bloquear a execução)
ALTER TABLE [dbo].[ProjetoTarefaAnexo]
    ADD [Conteudo] [varbinary](max) NULL;
GO

-- 2. Remove a coluna de nome de arquivo (não usada após a migração)
--    Os arquivos físicos em uploads/tarefas/ podem ser excluídos manualmente após confirmar a migração.
ALTER TABLE [dbo].[ProjetoTarefaAnexo]
    DROP COLUMN [NomeArquivo];
GO

-- 3. Torna a coluna NOT NULL após a alteração estrutural
--    (registros existentes já terão sido tratados ou a tabela estará vazia)
ALTER TABLE [dbo].[ProjetoTarefaAnexo]
    ALTER COLUMN [Conteudo] [varbinary](max) NOT NULL;
GO
