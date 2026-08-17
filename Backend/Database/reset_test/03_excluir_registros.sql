-- =====================================================================
-- 03_excluir_registros.sql  (AMBIENTE DE TESTE)
-- EXCLUSAO FISICA (DELETE) de etapas e clientes.
--
-- Por que SQL? No app, o botao "Excluir" de cliente/etapa apenas INATIVA
-- (Ativo = 0). Para apagar a linha de verdade, use este script.
--
-- Pre-requisitos:
--   * Rodar DEPOIS de 01_reset_movimentacao.sql (senao o DELETE de cliente
--     pode falhar por projetos/atendimentos ligados).
--   * Rodar DEPOIS de 02_reimport_clientes.sql, pois o reimport REZERA os
--     IDs dos clientes. Os IDs abaixo (320 e 323) valem para a base JA
--     reimportada:
--         Id 320 = cliente "21"    (CLI_CODCLI 421, sem CNPJ)
--         Id 323 = cliente "21DIA" (CLI_CODCLI 424, sem CNPJ)
--     As etapas NAO sao rezeradas; Id 2 e 5 sao estaveis:
--         Id 2 = "Design / UI-UX"   |   Id 5 = "Homologação"
--
-- >>> CONFIRA a saida dos SELECTs antes de confiar no resultado. <<<
-- =====================================================================
SET NOCOUNT ON;
SET XACT_ABORT ON;

-- ---- Conferencia ANTES (o que sera apagado) ----
PRINT '--- Etapas que serao excluidas (Id 2, 5): ---';
SELECT Id, Nome FROM Etapa WHERE Id IN (2, 5);
PRINT '--- Clientes que serao excluidos (Id 320, 323): ---';
SELECT Id, Documento, Nome, NomeFantasia FROM Cliente WHERE Id IN (320, 323);

BEGIN TRAN;

-- ---- 1) Excluir as 2 etapas ----
DELETE FROM Etapa WHERE Id IN (2, 5);

-- ---- 2) Excluir os 2 clientes ----
-- solta o vinculo de matriz de filiais que apontem para eles, depois apaga
UPDATE Cliente SET MatrizId = NULL WHERE MatrizId IN (320, 323);
DELETE FROM Cliente WHERE Id IN (320, 323);

COMMIT;
PRINT 'Exclusao concluida.';

-- ---- Conferencia DEPOIS (devem vir VAZIAS) ----
SELECT Id, Nome FROM Etapa WHERE Id IN (2, 5);
SELECT Id, Nome FROM Cliente WHERE Id IN (320, 323);
SELECT COUNT(*) AS TotalEtapas FROM Etapa;
