-- =====================================================================
-- 05_corrigir_matriz.sql   (rodar no TESTE e na PRODUCAO)
-- Corrige vinculos de matriz (MatrizId) invalidos, gerados por
-- documentos DUPLICADOS na base legada durante a reimportacao.
--
-- Sintoma: um cliente que E' matriz aparecia com o campo "Empresa Matriz"
-- EM BRANCO (em vez de "Nenhuma") e sumia da lista de matrizes, porque
-- ficou com MatrizId apontando para si mesmo (auto-referencia).
--
-- Nao apaga clientes; so limpa vinculos errados (MatrizId -> NULL).
-- Pode rodar quantas vezes quiser (idempotente).
--
-- Rode no banco correto de cada ambiente:
--   TESTE     -> -d ASMTasksTest
--   PRODUCAO  -> -d ASMTasksProd
-- =====================================================================
SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRAN;

-- 1) Auto-referencias: cliente apontando para si mesmo
UPDATE Cliente SET MatrizId = NULL WHERE MatrizId = Id;

-- 2) Vinculos orfaos: MatrizId apontando para um cliente que nao existe
UPDATE Cliente SET MatrizId = NULL
 WHERE MatrizId IS NOT NULL
   AND MatrizId NOT IN (SELECT Id FROM Cliente);

-- 3) Uma matriz nao pode ser filial (achata cadeias): quem e' matriz de
--    alguem nao pode ter MatrizId proprio, senao some da lista de matrizes.
UPDATE Cliente SET MatrizId = NULL
 WHERE Id IN (SELECT DISTINCT MatrizId FROM Cliente WHERE MatrizId IS NOT NULL);

COMMIT;
PRINT 'Vinculos de matriz corrigidos.';

-- Conferencia (deve retornar 0 nas tres)
SELECT
    SUM(CASE WHEN MatrizId = Id THEN 1 ELSE 0 END) AS AutoReferencias,
    SUM(CASE WHEN MatrizId IS NOT NULL
              AND MatrizId NOT IN (SELECT Id FROM Cliente) THEN 1 ELSE 0 END) AS Orfaos,
    (SELECT COUNT(*) FROM Cliente c
      WHERE c.Id IN (SELECT DISTINCT MatrizId FROM Cliente WHERE MatrizId IS NOT NULL)
        AND c.MatrizId IS NOT NULL) AS MatrizesQueSaoFilhas
FROM Cliente;
