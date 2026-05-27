-- Migration v1.3.0
-- Campos de tempo de execucao e teste nas tarefas + flag de etapa de teste

ALTER TABLE ProjetoTarefa ADD TempoExecucaoValor INT NULL;
ALTER TABLE ProjetoTarefa ADD TempoExecucaoUnidade CHAR(1) NULL; -- 'D'=Dias, 'H'=Horas, 'M'=Minutos
ALTER TABLE ProjetoTarefa ADD TempoTesteValor INT NULL;
ALTER TABLE ProjetoTarefa ADD TempoTesteUnidade CHAR(1) NULL; -- 'D'=Dias, 'H'=Horas, 'M'=Minutos

ALTER TABLE Etapa ADD EhEtapaTeste BIT NOT NULL DEFAULT 0;

-- Backfill: preenche EtapaId/EtapaNome nos historicos 'I' e 'P' que ficaram NULL
-- antes da correcao que passou a gravar a etapa atual no momento do evento.

-- Passo 1: usa o registro 'E' (mudanca de etapa) mais recente ANTERIOR ao evento.
--          Essa e a etapa em que a tarefa estava quando o usuario iniciou ou pausou.
UPDATE h
SET
    h.EtapaId   = last_e.EtapaId,
    h.EtapaNome = last_e.EtapaNome
FROM ProjetoTarefaHistorico h
CROSS APPLY (
    SELECT TOP 1 eh.EtapaId, eh.EtapaNome
    FROM ProjetoTarefaHistorico eh
    WHERE eh.TarefaId      = h.TarefaId
      AND eh.Tipo          = 'E'
      AND eh.EtapaId       IS NOT NULL
      AND eh.DataHoraAcao  <= h.DataHoraAcao
    ORDER BY eh.DataHoraAcao DESC
) last_e
WHERE h.Tipo      IN ('I', 'P')
  AND h.EtapaId  IS NULL;

-- Passo 2: para os que ainda ficaram NULL (a tarefa nunca passou por um 'E' antes
--          do evento — etapa foi definida na criacao do projeto), usa a etapa atual.
UPDATE h
SET
    h.EtapaId   = pt.EtapaId,
    h.EtapaNome = e.Nome
FROM ProjetoTarefaHistorico h
INNER JOIN ProjetoTarefa pt ON h.TarefaId = pt.Id
LEFT  JOIN Etapa          e  ON e.Id      = pt.EtapaId
WHERE h.Tipo     IN ('I', 'P')
  AND h.EtapaId IS NULL
  AND pt.EtapaId IS NOT NULL;

-- Backfill: preenche ColaboradorId/ColaboradorNome nos historicos 'E' (mudanca de etapa)
-- que ficaram NULL antes da correcao que passou a gravar o colaborador responsavel.
-- Melhor aproximacao: colaborador responsavel atual da tarefa.
UPDATE h
SET
    h.ColaboradorId   = pt.ColaboradorResponsavelId,
    h.ColaboradorNome = col.Nome
FROM ProjetoTarefaHistorico h
INNER JOIN ProjetoTarefa pt  ON h.TarefaId          = pt.Id
LEFT  JOIN Colaborador   col ON col.Id              = pt.ColaboradorResponsavelId
WHERE h.Tipo           = 'E'
  AND h.ColaboradorId IS NULL
  AND pt.ColaboradorResponsavelId IS NOT NULL;
