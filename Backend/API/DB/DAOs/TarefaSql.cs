namespace API.DB.DAOs
{
    /// <summary>
    /// Trechos de SQL sobre a situação de uma tarefa, usados por mais de uma consulta. Ficam num
    /// lugar só para o Kanban, o dashboard e a tela de projetos nunca discordarem.
    /// </summary>
    internal static class TarefaSql
    {
        /// <summary>
        /// 'Em andamento' (cronômetro aberto), 'Pausada' (pausou depois da última troca de etapa)
        /// ou 'Ociosa' (ainda não iniciada nesta etapa). <paramref name="aliasTarefa"/> é o alias
        /// de ProjetoTarefa na consulta.
        /// </summary>
        public static string StatusAtual(string aliasTarefa) => $@"CASE
                        WHEN {aliasTarefa}.DataHoraInicio IS NOT NULL THEN 'Em andamento'
                        WHEN EXISTS (
                            SELECT 1 FROM ProjetoTarefaHistorico hs
                            WHERE hs.TarefaId = {aliasTarefa}.Id AND hs.Tipo = 'P'
                              AND hs.DataHoraAcao > COALESCE(
                                  (SELECT MAX(hs2.DataHoraAcao) FROM ProjetoTarefaHistorico hs2
                                   WHERE hs2.TarefaId = {aliasTarefa}.Id AND hs2.Tipo = 'E'),
                                  '1900-01-01')
                        ) THEN 'Pausada'
                        ELSE 'Ociosa'
                    END";

        /// <summary>
        /// A elaboração já foi iniciada alguma vez (existe evento 'I' no histórico). É o que separa
        /// "Reservado" (ninguém começou ainda) de "Em elaboração" — inclusive quando a tarefa volta
        /// do teste para a elaboração: ela já foi elaborada, então não volta a ser reservada.
        /// </summary>
        public static string ElaboracaoJaIniciada(string aliasTarefa) => $@"CASE WHEN EXISTS (
                        SELECT 1 FROM ProjetoTarefaHistorico hi
                        WHERE hi.TarefaId = {aliasTarefa}.Id AND hi.Tipo = 'I'
                    ) THEN 1 ELSE 0 END";

        /// <summary>
        /// A etapa de elaboração é a única dividida em "Reservado" (ociosa: alguém vai fazer, mas
        /// não começou) e a própria etapa (já começou). É reconhecida pelo NOME, como no Relatório
        /// de Comissão e em Frontend/src/utils/situacaoTarefa.js — renomear a etapa exige ajustar
        /// os três. <paramref name="aliasEtapa"/> é o alias de Etapa na consulta.
        /// </summary>
        public static string EhEtapaElaboracao(string aliasEtapa) =>
            $"(LOWER({aliasEtapa}.Nome) LIKE '%elabora%' OR LOWER({aliasEtapa}.Nome) LIKE '%desenvolv%')";

        /// <summary>
        /// Tabela derivada com as saídas de etapa de uma tarefa: cada evento 'E' com a etapa que
        /// ele DEIXOU (EtapaDeixadaId). O ColaboradorId do 'E' é o responsável da etapa deixada,
        /// ou seja, quem fez aquela passagem. <paramref name="expressaoTarefaId"/> é a expressão
        /// do Id da tarefa na consulta de fora; <paramref name="condicaoFim"/>, se houver, limita
        /// os eventos (ex.: "&lt; @Fim").
        /// </summary>
        public static string SaidasDeEtapa(string expressaoTarefaId, string? condicaoFim = null) => $@"(
                        SELECT he.ColaboradorId, he.DataHoraAcao, he.Id,
                               LAG(he.EtapaId) OVER (ORDER BY he.DataHoraAcao, he.Id) AS EtapaDeixadaId
                        FROM ProjetoTarefaHistorico he
                        WHERE he.TarefaId = {expressaoTarefaId} AND he.Tipo = 'E'{(condicaoFim == null ? "" : $" AND he.DataHoraAcao {condicaoFim}")})";

        /// <summary>
        /// Quem recebe o crédito por elaboração de uma tarefa concluída (COM-10 e COM-11), com os
        /// eventos que satisfazem <paramref name="condicaoFim"/>. Mesma regra do Relatório de
        /// Comissão (Frontend/src/app/relatorios/useItensAgrupados.js), na ordem:
        /// quem saiu por último da elaboração; senão, quem saiu por último de uma etapa que não é
        /// a final; senão, o responsável da passagem pela final (a última atribuição). Pode ser
        /// NULL, e então a tarefa não credita ninguém (COM-05).
        /// </summary>
        public static string CreditoElaboracao(string expressaoTarefaId, string condicaoFim) => $@"COALESCE(
                    (SELECT TOP 1 s.ColaboradorId FROM {SaidasDeEtapa(expressaoTarefaId, condicaoFim)} s
                       INNER JOIN Etapa ee ON ee.Id = s.EtapaDeixadaId AND {EhEtapaElaboracao("ee")}
                      WHERE s.ColaboradorId IS NOT NULL
                      ORDER BY s.DataHoraAcao DESC, s.Id DESC),
                    (SELECT TOP 1 s.ColaboradorId FROM {SaidasDeEtapa(expressaoTarefaId, condicaoFim)} s
                       INNER JOIN Etapa eo ON eo.Id = s.EtapaDeixadaId AND eo.EhEtapaFinal = 0
                      WHERE s.ColaboradorId IS NOT NULL
                      ORDER BY s.DataHoraAcao DESC, s.Id DESC),
                    (SELECT TOP 1 ha.ColaboradorId FROM ProjetoTarefaHistorico ha
                      WHERE ha.TarefaId = {expressaoTarefaId} AND ha.Tipo = 'A' AND ha.DataHoraAcao {condicaoFim}
                      ORDER BY ha.DataHoraAcao DESC, ha.Id DESC))";
    }
}
