-- =====================================================================
-- 00_verificacao_ativo.sql  (AMBIENTE DE TESTE) -- OPCIONAL, so leitura
-- Rode ANTES do reset para conferir a base atual de clientes.
-- Nao altera nada. Use a saida para comparar com o cliente.sql e
-- confirmar os clientes cujo status (ativo/inativo) mudou no meio tempo.
-- =====================================================================
SET NOCOUNT ON;

-- Resumo atual
SELECT COUNT(*) AS TotalClientes,
       SUM(CASE WHEN Ativo=1 THEN 1 ELSE 0 END) AS Ativos,
       SUM(CASE WHEN Ativo=0 THEN 1 ELSE 0 END) AS Inativos
FROM Cliente;

-- Lista completa de clientes inativos hoje (para conferencia manual)
SELECT Id, Documento, Nome, NomeFantasia
FROM Cliente
WHERE Ativo = 0
ORDER BY Nome;

-- IMPORTANTE:
-- A reimportacao (02_reimport_clientes.sql) define Ativo a partir do ERP
-- (cliente.sql): CLI_STATUS = 9 => inativo, caso contrario ativo.
-- Existem 8 clientes cujo status no ASMTasks foi editado a mao e diverge
-- do ERP. Apos a reimportacao, o valor do ERP prevalece. Se quiser MANTER
-- alguma inativacao/ativacao feita so no ASMTasks, ajuste manualmente
-- depois, por exemplo:
--   UPDATE Cliente SET Ativo = 0 WHERE Documento = N'DOCUMENTO_DO_CLIENTE';
-- Divergencias conhecidas (Documento -> estado no ERP apos import):
--   FAZENDA DA TOCA LTDA ................ ERP=INATIVO (era ativo)
--   CLAUDINEI JOSE GUASTALI-ME .......... ERP=INATIVO (era ativo)
--   DDI TRANSPORTES LTDA ................ ERP=INATIVO (era ativo)
--   TRANSPORTADORA LEONARDO VELOZES LTDA  ERP=INATIVO (era ativo)
--   A & E COMERCIO DE OVOS LTDA ......... ERP=ATIVO   (era inativo)
--   GERSON JOSE BERGAMO ................. ERP=ATIVO   (era inativo)
--   LOURIVAL DE LIMA PONCE ............... ERP=ATIVO  (era inativo)
--   BRUNA APARECIDA SEGURA BUZANELLI .... ERP=ATIVO   (era inativo)
