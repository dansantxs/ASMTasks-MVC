USE [ASMTasks]
GO

IF COL_LENGTH('dbo.ConfiguracaoSistema', 'SmtpServidor') IS NULL
    ALTER TABLE [dbo].[ConfiguracaoSistema] ADD [SmtpServidor] [nvarchar](255) NULL;
GO

IF COL_LENGTH('dbo.ConfiguracaoSistema', 'SmtpPorta') IS NULL
    ALTER TABLE [dbo].[ConfiguracaoSistema] ADD [SmtpPorta] [int] NULL;
GO

IF COL_LENGTH('dbo.ConfiguracaoSistema', 'SmtpUsuario') IS NULL
    ALTER TABLE [dbo].[ConfiguracaoSistema] ADD [SmtpUsuario] [nvarchar](255) NULL;
GO

IF COL_LENGTH('dbo.ConfiguracaoSistema', 'SmtpSenha') IS NULL
    ALTER TABLE [dbo].[ConfiguracaoSistema] ADD [SmtpSenha] [nvarchar](255) NULL;
GO

IF COL_LENGTH('dbo.ConfiguracaoSistema', 'SmtpUsarSslTls') IS NULL
BEGIN
    ALTER TABLE [dbo].[ConfiguracaoSistema]
    ADD [SmtpUsarSslTls] [bit] NOT NULL
        CONSTRAINT [DF_ConfiguracaoSistema_SmtpUsarSslTls] DEFAULT ((1));
END
GO

IF OBJECT_ID('dbo.NotificacaoSistema', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[NotificacaoSistema](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [ColaboradorId] [int] NOT NULL,
        [AtendimentoId] [int] NOT NULL,
        [MinutosAntecedencia] [int] NOT NULL,
        [Titulo] [nvarchar](180) NOT NULL,
        [Mensagem] [nvarchar](500) NOT NULL,
        [DataNotificacao] [datetime] NOT NULL,
        [Lida] [bit] NOT NULL CONSTRAINT [DF_NotificacaoSistema_Lida] DEFAULT ((0)),
        [DataLeitura] [datetime] NULL,
        [DataCadastro] [datetime] NOT NULL,
        CONSTRAINT [PK_NotificacaoSistema] PRIMARY KEY CLUSTERED ([Id] ASC)
    );
END
GO

IF OBJECT_ID('dbo.NotificacaoEmailLog', 'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[NotificacaoEmailLog](
        [Id] [int] IDENTITY(1,1) NOT NULL,
        [ColaboradorId] [int] NOT NULL,
        [AtendimentoId] [int] NOT NULL,
        [MinutosAntecedencia] [int] NOT NULL,
        [EmailDestino] [nvarchar](255) NOT NULL,
        [DataEnvio] [datetime] NOT NULL,
        CONSTRAINT [PK_NotificacaoEmailLog] PRIMARY KEY CLUSTERED ([Id] ASC)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_NotificacaoSistema_Atendimento')
BEGIN
    ALTER TABLE [dbo].[NotificacaoSistema] WITH CHECK ADD CONSTRAINT [FK_NotificacaoSistema_Atendimento]
    FOREIGN KEY([AtendimentoId]) REFERENCES [dbo].[Atendimento]([Id]);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_NotificacaoSistema_Colaborador')
BEGIN
    ALTER TABLE [dbo].[NotificacaoSistema] WITH CHECK ADD CONSTRAINT [FK_NotificacaoSistema_Colaborador]
    FOREIGN KEY([ColaboradorId]) REFERENCES [dbo].[Colaborador]([Id]);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_NotificacaoEmailLog_Atendimento')
BEGIN
    ALTER TABLE [dbo].[NotificacaoEmailLog] WITH CHECK ADD CONSTRAINT [FK_NotificacaoEmailLog_Atendimento]
    FOREIGN KEY([AtendimentoId]) REFERENCES [dbo].[Atendimento]([Id]);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_NotificacaoEmailLog_Colaborador')
BEGIN
    ALTER TABLE [dbo].[NotificacaoEmailLog] WITH CHECK ADD CONSTRAINT [FK_NotificacaoEmailLog_Colaborador]
    FOREIGN KEY([ColaboradorId]) REFERENCES [dbo].[Colaborador]([Id]);
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_NotificacaoSistema_Colaborador_Lida_DataNotificacao'
      AND object_id = OBJECT_ID('dbo.NotificacaoSistema')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_NotificacaoSistema_Colaborador_Lida_DataNotificacao]
    ON [dbo].[NotificacaoSistema]([ColaboradorId] ASC, [Lida] ASC, [DataNotificacao] DESC);
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_NotificacaoSistema_Atendimento_Colaborador_Antecedencia_DataNotificacao'
      AND object_id = OBJECT_ID('dbo.NotificacaoSistema')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_NotificacaoSistema_Atendimento_Colaborador_Antecedencia_DataNotificacao]
    ON [dbo].[NotificacaoSistema]([AtendimentoId] ASC, [ColaboradorId] ASC, [MinutosAntecedencia] ASC, [DataNotificacao] DESC);
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = 'IX_NotificacaoEmailLog_Atendimento_Colaborador_Antecedencia_DataEnvio'
      AND object_id = OBJECT_ID('dbo.NotificacaoEmailLog')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_NotificacaoEmailLog_Atendimento_Colaborador_Antecedencia_DataEnvio]
    ON [dbo].[NotificacaoEmailLog]([AtendimentoId] ASC, [ColaboradorId] ASC, [MinutosAntecedencia] ASC, [DataEnvio] DESC);
END
GO
