-- ============================================================================
-- Atendimentos fechados automaticamente pelo sistema: preenche a conclusao que
-- ficou faltando e corrige a data do evento.
--
-- O QUE ESTAVA ERRADO
-- A varredura que fecha atendimento vencido (AtendimentosDAO,
-- AtualizarAtendimentosVencidosAsync) marcava Status = 'R' e gravava o evento
-- 'C' no historico, mas nao preenchia Atendimento.DataHoraConclusao nem
-- ConcluidoPorColaboradorId. Como o dashboard conta "Atendimentos Realizados"
-- por DataHoraConclusao, todos esses ficavam de fora da contagem.
--
-- Alem disso, o evento era datado do instante da VARREDURA, que so roda quando
-- alguem abre o sistema -- as vezes dias depois. O Relatorio de Comissao le a
-- data do evento, entao o atendimento entrava no dia errado.
--
-- O codigo ja foi corrigido: daqui para frente a conclusao usa a hora de
-- TERMINO agendada (DataHoraFim). Este script aplica o mesmo criterio ao que
-- ja esta gravado. E uma vez so.
--
-- ANTES DE RODAR EM PRODUCAO: faca backup (Backend\Database\backup-prod.ps1).
-- A parte 2 reescreve o historico e so volta atras por restore.
-- ============================================================================

SET NOCOUNT ON;

-- Parte 1 (datas do historico) liga e desliga aqui. Ver o aviso sobre o Relatorio de
-- Comissao logo antes dela. O aplicar_correcoes_atendimentos.ps1 troca este 1 por 0
-- quando recebe -PularDatasComissao.
DECLARE @CorrigirDatasDoHistorico BIT = 1;

-- ---------------------------------------------------------------------------
-- O conjunto: atendimentos realizados, sem conclusao gravada e com hora de
-- termino conhecida. Fica num temp porque a parte 1 preenche a conclusao e,
-- depois dela, nao daria mais para reconhecer quem eram.
--
-- Atendimento que foi fechado pelo sistema e DEPOIS reaberto e concluido por
-- alguem nao entra: ali a conclusao ja existe e a data do evento e a hora real
-- do clique.
-- ---------------------------------------------------------------------------
SELECT a.Id, a.DataHoraFim
INTO #Alvo
FROM Atendimento a
WHERE a.Status = 'R'
  AND a.DataHoraConclusao IS NULL
  AND a.DataHoraFim IS NOT NULL;

DECLARE @Qtd INT;
SELECT @Qtd = COUNT(*) FROM #Alvo;
PRINT 'Atendimentos a corrigir: ' + CAST(@Qtd AS VARCHAR);

-- ---------------------------------------------------------------------------
-- Parte 1: a data do evento passa a ser a hora de termino agendada.
--
-- ATENCAO: isto muda o dia (e, em poucos casos, o mes) em que o atendimento
-- aparece no Relatorio de Comissao. Se a comissao desses meses ja foi paga
-- conferindo o relatorio antigo, rode a conferencia no fim deste arquivo antes
-- de decidir -- ou pule esta parte, rodando so a parte 2.
-- ---------------------------------------------------------------------------
IF @CorrigirDatasDoHistorico = 1
BEGIN
    UPDATE h
    SET h.DataHoraAcao = alvo.DataHoraFim
    FROM AtendimentoHistoricoStatus h
    INNER JOIN #Alvo alvo ON alvo.Id = h.AtendimentoId
    WHERE h.Tipo = 'C'
      AND h.DataHoraAcao <> alvo.DataHoraFim;

    PRINT 'Parte 1: data corrigida em ' + CAST(@@ROWCOUNT AS VARCHAR) + ' evento(s) do historico.';
END
ELSE
    PRINT 'Parte 1: PULADA a pedido; as datas do historico ficam como estao.';

-- ---------------------------------------------------------------------------
-- Parte 2: preenche a conclusao que faltou.
-- O credito vai para quem o proprio evento do historico ja registra, que e
-- quem cadastrou o atendimento -- o sistema fechou, ninguem concluiu de fato.
-- ---------------------------------------------------------------------------
UPDATE a
SET a.DataHoraConclusao = alvo.DataHoraFim,
    a.ConcluidoPorColaboradorId = COALESCE(
        (SELECT TOP 1 h.ColaboradorId
         FROM AtendimentoHistoricoStatus h
         WHERE h.AtendimentoId = a.Id AND h.Tipo = 'C'
         ORDER BY h.DataHoraAcao, h.Id),
        a.CadastradoPorColaboradorId)
FROM Atendimento a
INNER JOIN #Alvo alvo ON alvo.Id = a.Id;

PRINT 'Parte 2: conclusao preenchida em ' + CAST(@@ROWCOUNT AS VARCHAR) + ' atendimento(s).';

DROP TABLE #Alvo;

-- ---------------------------------------------------------------------------
-- Conferencia (nao altera nada). Rode ANTES para ver o tamanho do estrago,
-- ou DEPOIS para confirmar que nao sobrou nada.
-- ---------------------------------------------------------------------------
-- SELECT COUNT(*) AS AindaSemConclusao
-- FROM Atendimento WHERE Status = 'R' AND DataHoraConclusao IS NULL;
--
-- -- Quantos mudam de DIA e de MES no Relatorio de Comissao:
-- SELECT
--     SUM(CASE WHEN CAST(h.DataHoraAcao AS DATE) <> CAST(a.DataHoraFim AS DATE) THEN 1 ELSE 0 END) AS MudamDeDia,
--     SUM(CASE WHEN YEAR(h.DataHoraAcao) <> YEAR(a.DataHoraFim)
--               OR MONTH(h.DataHoraAcao) <> MONTH(a.DataHoraFim) THEN 1 ELSE 0 END) AS MudamDeMes
-- FROM Atendimento a
-- INNER JOIN AtendimentoHistoricoStatus h ON h.AtendimentoId = a.Id AND h.Tipo = 'C'
-- WHERE a.Status = 'R' AND a.DataHoraConclusao IS NULL AND a.DataHoraFim IS NOT NULL;
