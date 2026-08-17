-- =====================================================================
-- 03_excluir_registros.sql  (AMBIENTE DE TESTE)
-- EXCLUSAO FISICA (DELETE) de etapas e clientes.
--
-- Por que SQL? No app, o botao "Excluir" de cliente/etapa apenas INATIVA
-- (Ativo = 0). Para apagar a linha de verdade, use este script.
--
-- Pre-requisito: rodar DEPOIS de 01_reset_movimentacao.sql. Com a
-- movimentacao ja apagada, nenhuma tarefa aponta para Etapa e nenhum
-- projeto/atendimento aponta para Cliente, entao o DELETE e' seguro.
--
-- >>> EDITE os nomes das etapas e os documentos dos clientes abaixo. <<<
-- =====================================================================
SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRAN;

-- ------------------------------------------------------------------
-- 1) EXCLUIR 2 ETAPAS  (troque pelos nomes exatos)
--    Etapas atuais: 'Análise & Requisitos', 'Design / UI-UX',
--    'Em Desenvolvimento', 'QA / Testes', 'Homologação',
--    'Aguardando Deploy', 'Produção' (final - evite excluir esta).
-- ------------------------------------------------------------------
DELETE FROM Etapa WHERE Nome = N'TROQUE_NOME_DA_ETAPA_1';
DELETE FROM Etapa WHERE Nome = N'TROQUE_NOME_DA_ETAPA_2';

-- ------------------------------------------------------------------
-- 2) EXCLUIR 2 CLIENTES  (troque pelos documentos/CNPJ exatos)
--    Primeiro solta o vinculo de matriz de eventuais filiais que
--    apontem para esses clientes, depois apaga.
-- ------------------------------------------------------------------
DECLARE @docs TABLE (Documento nvarchar(18));
INSERT INTO @docs (Documento) VALUES
    (N'TROQUE_DOCUMENTO_CLIENTE_1'),
    (N'TROQUE_DOCUMENTO_CLIENTE_2');

UPDATE Cliente
   SET MatrizId = NULL
 WHERE MatrizId IN (SELECT Id FROM Cliente WHERE Documento IN (SELECT Documento FROM @docs));

DELETE FROM Cliente WHERE Documento IN (SELECT Documento FROM @docs);

COMMIT;
PRINT 'Exclusao concluida.';

-- Conferencia
SELECT COUNT(*) AS TotalEtapas FROM Etapa;
SELECT Id, Documento, Nome FROM Cliente
 WHERE Documento IN (N'TROQUE_DOCUMENTO_CLIENTE_1', N'TROQUE_DOCUMENTO_CLIENTE_2');
-- (a segunda consulta deve vir VAZIA se os clientes foram excluidos)
