-- Migration 006: Adiciona colunas de limite de tamanho de anexos na tabela ConfiguracaoSistema
-- Data: 2026-04-17

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('ConfiguracaoSistema') AND name = 'AnexoTamanhoMaximoMB'
)
BEGIN
    ALTER TABLE ConfiguracaoSistema
        ADD AnexoTamanhoMaximoMB INT NOT NULL DEFAULT 20;
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('ConfiguracaoSistema') AND name = 'AnexoLimiteImagemMB'
)
BEGIN
    ALTER TABLE ConfiguracaoSistema
        ADD AnexoLimiteImagemMB INT NULL;
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('ConfiguracaoSistema') AND name = 'AnexoLimitePdfMB'
)
BEGIN
    ALTER TABLE ConfiguracaoSistema
        ADD AnexoLimitePdfMB INT NULL;
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('ConfiguracaoSistema') AND name = 'AnexoLimiteExcelMB'
)
BEGIN
    ALTER TABLE ConfiguracaoSistema
        ADD AnexoLimiteExcelMB INT NULL;
END;
