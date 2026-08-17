-- =====================================================================
-- 01_reset_movimentacao.sql  (AMBIENTE DE TESTE)
-- Apaga TODA a movimentacao: Projetos, Tarefas e Atendimentos, com todas
-- as tabelas filhas/logs ligadas a eles. Mantem intactos os demais
-- cadastros (Colaborador, Cargo, Setor, Usuario, NivelAcesso,
-- NivelAcessoPermissao, Etapa, Prioridade, ConfiguracaoSistema) e Cliente.
--
-- A ordem respeita as chaves estrangeiras (filhos antes dos pais).
-- Nenhuma FK usa ON DELETE CASCADE, por isso a ordem e' manual.
-- Rode no banco de TESTE (ASMTasksTest) ANTES de 02_reimport_clientes.sql.
-- =====================================================================
SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRAN;

-- ---- Tarefas de projeto (filhos -> pai) ----
DELETE FROM ProjetoTarefaAnexo;
DELETE FROM ProjetoTarefaHistorico;
DELETE FROM ProjetoTarefa;

-- ---- Projetos ----
DELETE FROM ProjetoHistorico;
DELETE FROM Projeto;

-- ---- Atendimentos (filhos -> pai) ----
DELETE FROM AtendimentoColaborador;
DELETE FROM AtendimentoHistoricoStatus;
DELETE FROM AtendimentoNotificacao;

-- Logs/notificacoes referenciam Atendimento (AtendimentoId) e sao transitorios;
-- limpamos por completo para permitir a exclusao dos atendimentos.
DELETE FROM NotificacaoEmailLog;
DELETE FROM NotificacaoSistema;

DELETE FROM Atendimento;

-- ---- Rezera os contadores IDENTITY (so tabelas que tem IDENTITY) ----
DBCC CHECKIDENT('ProjetoTarefaAnexo',     RESEED, 0);
DBCC CHECKIDENT('ProjetoTarefaHistorico', RESEED, 0);
DBCC CHECKIDENT('ProjetoTarefa',          RESEED, 0);
DBCC CHECKIDENT('ProjetoHistorico',       RESEED, 0);
DBCC CHECKIDENT('Projeto',                RESEED, 0);
DBCC CHECKIDENT('AtendimentoHistoricoStatus', RESEED, 0);
DBCC CHECKIDENT('NotificacaoEmailLog',    RESEED, 0);
DBCC CHECKIDENT('NotificacaoSistema',     RESEED, 0);
DBCC CHECKIDENT('Atendimento',            RESEED, 0);

COMMIT;
PRINT 'Movimentacao (projetos, tarefas, atendimentos) apagada com sucesso.';

SELECT 'Projeto' AS Tabela, COUNT(*) AS Linhas FROM Projeto
UNION ALL SELECT 'ProjetoTarefa', COUNT(*) FROM ProjetoTarefa
UNION ALL SELECT 'Atendimento', COUNT(*) FROM Atendimento;
