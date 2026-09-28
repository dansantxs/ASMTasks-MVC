-- ============================================================================
-- Nomes das etapas: alinha a tabela Etapa E o historico ja gravado.
--
--   Em Desenvolvimento            -> Elaboracao   (ordem 2)
--   QA / Testes                   -> Aprovacao    (ordem 3)
--   Atualizar (Aguardando Deploy) -> Atualizacao  (ordem 4)
--   Producao                      -> Concluido    (ordem 5)
--
-- POR QUE SAO DUAS PARTES
-- ProjetoTarefaHistorico.EtapaNome e uma COPIA do nome, gravada quando a linha
-- foi criada -- e e dela que o Relatorio de Comissao le (ProjetosDAO, consulta
-- do relatorio-historico usa h.EtapaNome, nao e.Nome). Renomear so a tabela
-- Etapa muda as linhas NOVAS; as antigas continuam com o nome velho.
--
-- Linhas novas ja nascem certas: os INSERTs do historico leem o nome de Etapa
-- na hora (SELECT e.Nome FROM ... Etapa e ...). Este script e uma vez so.
--
-- ANTES DE RODAR EM PRODUCAO: faca backup (Backend\Database\backup-prod.ps1).
-- A parte 2 reescreve o historico e so volta atras por restore.
--
--   powershell -ExecutionPolicy Bypass -File .\Backend\Database\db.ps1 `
--     -Env prod -File .\renomear_etapas.sql
--
-- O arquivo e ASCII puro de proposito: o db.ps1 passa o SQL como argumento de
-- linha de comando, e acento nao sobrevive a esse caminho. Os nomes acentuados
-- sao montados com NCHAR() abaixo.
--
-- E idempotente: rodar de novo nao altera nada.
-- ============================================================================
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @ccedil NCHAR(1) = NCHAR(231);  -- c com cedilha
DECLARE @atil   NCHAR(1) = NCHAR(227);  -- a com til
DECLARE @iagudo NCHAR(1) = NCHAR(237);  -- i com acento agudo

DECLARE @Elaboracao  NVARCHAR(50) = N'Elabora'  + @ccedil + @atil + N'o';
DECLARE @Aprovacao   NVARCHAR(50) = N'Aprova'   + @ccedil + @atil + N'o';
DECLARE @Atualizacao NVARCHAR(50) = N'Atualiza' + @ccedil + @atil + N'o';
DECLARE @Concluido   NVARCHAR(50) = N'Conclu'   + @iagudo + N'do';
DECLARE @Producao    NVARCHAR(50) = N'Produ'    + @ccedil + @atil + N'o';

PRINT '=== ANTES: tabela Etapa ===';
SELECT Id, Ordem, Nome, Ativo, EhEtapaFinal, EhEtapaTeste FROM Etapa ORDER BY Ordem, Id;

PRINT '=== ANTES: nome gravado no historico x nome atual da etapa ===';
SELECT h.EtapaId,
       h.EtapaNome AS NomeNoHistorico,
       e.Nome      AS NomeAtualDaEtapa,
       COUNT(*)    AS Linhas
  FROM ProjetoTarefaHistorico h
  JOIN Etapa e ON e.Id = h.EtapaId
 GROUP BY h.EtapaId, h.EtapaNome, e.Nome
 ORDER BY h.EtapaId;

DECLARE @RenomeadasEtapa   INT = 0;
DECLARE @AjustadasHistorico INT = 0;

BEGIN TRANSACTION;

    -- ------------------------------------------------------------------
    -- PARTE 1 -- tabela Etapa (pula se ja estiver renomeada)
    -- ------------------------------------------------------------------
    DECLARE @Mapa TABLE (NomeAntigo NVARCHAR(50), NomeNovo NVARCHAR(50), Ordem INT);
    INSERT INTO @Mapa (NomeAntigo, NomeNovo, Ordem) VALUES
        (N'Em Desenvolvimento',            @Elaboracao,  2),
        (N'QA / Testes',                   @Aprovacao,   3),
        (N'Atualizar (Aguardando Deploy)', @Atualizacao, 4),
        (@Producao,                        @Concluido,   5);

    -- O NOT EXISTS impede criar nome duplicado se o banco ja estiver renomeado
    -- (ou parcialmente renomeado) -- e o que torna o script repetivel.
    UPDATE e
       SET e.Nome  = m.NomeNovo,
           e.Ordem = m.Ordem
      FROM Etapa e
      JOIN @Mapa m ON m.NomeAntigo = e.Nome
     WHERE NOT EXISTS (SELECT 1 FROM Etapa x WHERE x.Nome = m.NomeNovo);

    SET @RenomeadasEtapa = @@ROWCOUNT;

    -- ------------------------------------------------------------------
    -- PARTE 2 -- historico ja gravado
    --
    -- Realinha a copia com o nome atual da etapa, por EtapaId (nao por nome:
    -- assim vale para qualquer renomeacao, agora ou depois). JOIN e nao LEFT
    -- JOIN de proposito -- linha cuja etapa foi apagada mantem o nome antigo,
    -- que e a unica pista que sobrou dela.
    -- ------------------------------------------------------------------
    UPDATE h
       SET h.EtapaNome = e.Nome
      FROM ProjetoTarefaHistorico h
      JOIN Etapa e ON e.Id = h.EtapaId
     WHERE h.EtapaNome IS NULL OR h.EtapaNome <> e.Nome;

    SET @AjustadasHistorico = @@ROWCOUNT;

COMMIT TRANSACTION;

PRINT '=== Etapas renomeadas nesta execucao ===';
PRINT CAST(@RenomeadasEtapa AS VARCHAR(10));
PRINT '=== Linhas de historico ajustadas nesta execucao ===';
PRINT CAST(@AjustadasHistorico AS VARCHAR(10));

PRINT '=== DEPOIS: tabela Etapa ===';
SELECT Id, Ordem, Nome, Ativo, EhEtapaFinal, EhEtapaTeste FROM Etapa ORDER BY Ordem, Id;

PRINT '=== DEPOIS: nome gravado no historico (deve bater com a etapa) ===';
SELECT h.EtapaId,
       h.EtapaNome AS NomeNoHistorico,
       e.Nome      AS NomeAtualDaEtapa,
       COUNT(*)    AS Linhas
  FROM ProjetoTarefaHistorico h
  JOIN Etapa e ON e.Id = h.EtapaId
 GROUP BY h.EtapaId, h.EtapaNome, e.Nome
 ORDER BY h.EtapaId;

-- ----------------------------------------------------------------------------
-- Conferencias. Nada aqui altera dado; e so para voce olhar o resultado.
-- ----------------------------------------------------------------------------

-- 1) Sobrou alguma etapa fora do modelo de 4? Decida na tela de Etapas se
--    desativa (Ativo = 0) ou renomeia. NAO apague: ha historico apontando
--    para ela, e apagar deixaria essas linhas orfas.
--    "Atendimento" NAO e etapa cadastrada: e a coluna fixa do Kanban para
--    tarefa sem etapa. Uma etapa com esse nome apareceria duplicada no quadro.
PRINT '=== Etapas fora do modelo novo (conferir na tela de Etapas) ===';
SELECT e.Id, e.Ordem, e.Nome, e.Ativo,
       (SELECT COUNT(*) FROM ProjetoTarefaHistorico h WHERE h.EtapaId = e.Id) AS UsosNoHistorico
  FROM Etapa e
 WHERE e.Nome NOT IN (@Elaboracao, @Aprovacao, @Atualizacao, @Concluido)
 ORDER BY e.Ordem, e.Id;

-- 2) As flags acompanham o NOME? Renomear nao move flag: se antes a etapa final
--    era "Homologacao", ela continua sendo a final depois do rename.
--    Esperado: Aprovacao com EhEtapaTeste = 1, Concluido com EhEtapaFinal = 1,
--    e nenhuma outra etapa com essas flags.
PRINT '=== Flags (esperado: so Aprovacao com Teste, so Concluido com Final) ===';
SELECT Id, Nome, EhEtapaTeste, EhEtapaFinal
  FROM Etapa
 WHERE EhEtapaTeste = 1 OR EhEtapaFinal = 1
 ORDER BY Ordem, Id;
