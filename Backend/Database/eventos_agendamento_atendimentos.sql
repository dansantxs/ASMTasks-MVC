-- ============================================================================
-- Evento de agendamento: libera o tipo 'A' e cria o evento que falta nos
-- atendimentos que ainda nao tem nenhum.
--
-- POR QUE
-- O Relatorio de Historico de Atendimentos lista EVENTOS. Atendimento que
-- ainda nao foi concluido nem cancelado nao tinha evento nenhum e, por isso,
-- era invisivel la -- dava para ver o numero no indicador do dashboard e nao
-- achar os atendimentos no relatorio.
--
-- O codigo ja foi corrigido: atendimento novo nasce com o evento 'A'. Este
-- script libera o tipo no banco e cobre os antigos. E uma vez so.
--
-- SO OS INVISIVEIS
-- Atendimento ja concluido aparece no relatorio pelo evento de conclusao;
-- criar um agendamento para todos so dobraria a tabela de historico e encheria
-- os periodos passados de linhas novas. Se preferir o historico completo, veja
-- a variacao comentada no fim.
--
-- A data do evento e a data AGENDADA (DataHoraInicio), nao a do cadastro: o
-- relatorio nao tem coluna para a data do atendimento, entao e por ela que se
-- procura "o que estava marcado para tal dia". O usuario e quem cadastrou.
--
-- ANTES DE RODAR EM PRODUCAO: faca backup (Backend\Database\backup-prod.ps1).
-- ============================================================================

SET NOCOUNT ON;

-- ---------------------------------------------------------------------------
-- Parte 1: o CHECK do banco so aceitava 'C' e 'R'.
-- ---------------------------------------------------------------------------
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_AtendimentoHistoricoStatus_Tipo')
    ALTER TABLE AtendimentoHistoricoStatus DROP CONSTRAINT CK_AtendimentoHistoricoStatus_Tipo;

ALTER TABLE AtendimentoHistoricoStatus WITH CHECK
    ADD CONSTRAINT CK_AtendimentoHistoricoStatus_Tipo CHECK (Tipo IN ('A', 'C', 'R'));

PRINT 'Parte 1: tipo A liberado no historico de atendimentos.';

-- ---------------------------------------------------------------------------
-- Parte 2: o evento que falta nos atendimentos sem historico nenhum.
-- ---------------------------------------------------------------------------
INSERT INTO AtendimentoHistoricoStatus
    (AtendimentoId, Tipo, ColaboradorId, DataHoraAcao, Observacao)
SELECT a.Id, 'A', a.CadastradoPorColaboradorId, a.DataHoraInicio, NULL
FROM Atendimento a
WHERE a.CadastradoPorColaboradorId IS NOT NULL
  AND a.DataHoraInicio IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM AtendimentoHistoricoStatus h WHERE h.AtendimentoId = a.Id
  );

PRINT 'Parte 2: eventos de agendamento criados: ' + CAST(@@ROWCOUNT AS VARCHAR);

-- ---------------------------------------------------------------------------
-- Conferencia (nao altera nada).
-- ---------------------------------------------------------------------------
-- SELECT COUNT(*) AS AindaInvisiveis
-- FROM Atendimento a
-- WHERE NOT EXISTS (SELECT 1 FROM AtendimentoHistoricoStatus h WHERE h.AtendimentoId = a.Id);

-- ---------------------------------------------------------------------------
-- VARIACAO: agendamento para TODOS os atendimentos, e nao so para os
-- invisiveis. Deixa o historico completo, ao custo de uma linha nova por
-- atendimento (mais de mil) aparecendo nos periodos passados do relatorio.
-- ---------------------------------------------------------------------------
-- INSERT INTO AtendimentoHistoricoStatus
--     (AtendimentoId, Tipo, ColaboradorId, DataHoraAcao, Observacao)
-- SELECT a.Id, 'A', a.CadastradoPorColaboradorId, a.DataHoraInicio, NULL
-- FROM Atendimento a
-- WHERE a.CadastradoPorColaboradorId IS NOT NULL
--   AND a.DataHoraInicio IS NOT NULL
--   AND NOT EXISTS (
--       SELECT 1 FROM AtendimentoHistoricoStatus h
--       WHERE h.AtendimentoId = a.Id AND h.Tipo = 'A'
--   );
