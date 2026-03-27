-- Adiciona coluna Concluido na tabela Projeto
-- Quando todas as tarefas de um projeto estiverem na etapa final, o projeto é marcado como concluído
-- e deixa de aparecer no quadro Kanban.

ALTER TABLE Projeto
ADD Concluido BIT NOT NULL DEFAULT 0;
