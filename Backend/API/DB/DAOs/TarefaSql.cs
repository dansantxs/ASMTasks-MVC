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
        /// A etapa de elaboração é a única dividida em "Reservado" (ociosa: alguém vai fazer, mas
        /// não começou) e a própria etapa (já começou). É reconhecida pelo NOME, como no Relatório
        /// de Comissão e em Frontend/src/utils/situacaoTarefa.js — renomear a etapa exige ajustar
        /// os três. <paramref name="aliasEtapa"/> é o alias de Etapa na consulta.
        /// </summary>
        public static string EhEtapaElaboracao(string aliasEtapa) =>
            $"(LOWER({aliasEtapa}.Nome) LIKE '%elabora%' OR LOWER({aliasEtapa}.Nome) LIKE '%desenvolv%')";
    }
}
