USE [ASMTasks];
GO

DECLARE @SetorId       INT;
DECLARE @CargoId       INT;
DECLARE @NivelAdminId  INT;
DECLARE @NivelPadraoId INT;
DECLARE @ColabId       INT;

-- =============================================
-- Setor
-- =============================================
INSERT INTO Setor (Nome, Descricao, Ativo)
VALUES (N'Geral', N'Setor geral', 1);
SET @SetorId = SCOPE_IDENTITY();

-- =============================================
-- Cargo
-- =============================================
INSERT INTO Cargo (Nome, Descricao, Ativo)
VALUES (N'Administrador', N'Cargo do administrador', 1);
SET @CargoId = SCOPE_IDENTITY();

-- =============================================
-- Configuração do Sistema
-- =============================================
INSERT INTO ConfiguracaoSistema (HoraInicioAgenda, HoraFimAgenda, Email, Telefone, RazaoSocial, NomeFantasia, Cnpj, InscricaoEstadual, Cep, Logradouro, Numero, Bairro, Cidade, Uf, SmtpServidor, SmtpPorta, SmtpUsaSsl, SmtpUsarSslTls, AnexoTamanhoMaximoMB, AnexoLimiteImagemMB, AnexoLimitePdfMB, AnexoLimiteExcelMB)
VALUES (N'00:00:00', N'23:59:00', N'asm.testes@gmail.com', N'(14) 3478-1993', N'ALVARO SHIOJI MATSUDA', N'ALWAYS SYSTEM MANAGER', N'06.186.222/0001-27', N'207.068.580.112', N'17690-037', N'Rua Presidente Vargas', N'520', N'Centro', N'Bastos', N'SP', N'smtp.gmail.com', 587, 1, 1, 25, NULL, NULL, NULL);

-- =============================================
-- NivelAcesso: ADMINISTRADOR (todas as permissoes)
-- =============================================
INSERT INTO NivelAcesso (Nome, Descricao, Ativo, EhAdministrador)
VALUES (N'ADMINISTRADOR', N'Acesso total ao sistema e a tela administrativa de acessos.', 1, 1);
SET @NivelAdminId = SCOPE_IDENTITY();

INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelAdminId, 'atendimentos.agenda');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelAdminId, 'cadastros.cargos');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelAdminId, 'cadastros.clientes');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelAdminId, 'cadastros.colaboradores');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelAdminId, 'cadastros.etapas');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelAdminId, 'cadastros.prioridades');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelAdminId, 'cadastros.setores');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelAdminId, 'configuracoes.acessos');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelAdminId, 'configuracoes.minha-conta');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelAdminId, 'configuracoes.sistema');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelAdminId, 'projetos.cadastro');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelAdminId, 'projetos.kanban');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelAdminId, 'relatorios.atendimentos-historico');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelAdminId, 'relatorios.cargos');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelAdminId, 'relatorios.clientes');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelAdminId, 'relatorios.colaboradores');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelAdminId, 'relatorios.etapas');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelAdminId, 'relatorios.prioridades');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelAdminId, 'relatorios.projetos-historico');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelAdminId, 'relatorios.setores');

-- =============================================
-- NivelAcesso: PADRAO (sem configuracoes.acessos)
-- =============================================
INSERT INTO NivelAcesso (Nome, Descricao, Ativo, EhAdministrador)
VALUES (N'PADRAO', N'Nivel padrao inicial do sistema.', 1, 0);
SET @NivelPadraoId = SCOPE_IDENTITY();

INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelPadraoId, 'atendimentos.agenda');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelPadraoId, 'cadastros.cargos');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelPadraoId, 'cadastros.clientes');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelPadraoId, 'cadastros.colaboradores');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelPadraoId, 'cadastros.etapas');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelPadraoId, 'cadastros.prioridades');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelPadraoId, 'cadastros.setores');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelPadraoId, 'configuracoes.minha-conta');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelPadraoId, 'configuracoes.sistema');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelPadraoId, 'projetos.cadastro');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelPadraoId, 'projetos.kanban');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelPadraoId, 'relatorios.atendimentos-historico');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelPadraoId, 'relatorios.cargos');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelPadraoId, 'relatorios.clientes');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelPadraoId, 'relatorios.colaboradores');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelPadraoId, 'relatorios.etapas');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelPadraoId, 'relatorios.prioridades');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelPadraoId, 'relatorios.projetos-historico');
INSERT INTO NivelAcessoPermissao (NivelAcessoId, TelaChave) VALUES (@NivelPadraoId, 'relatorios.setores');

-- =============================================
-- Prioridades
-- =============================================
INSERT INTO Prioridade (Nome, Descricao, Cor, Ativo, Ordem) VALUES (N'Crítica', N'Erros impeditivos ou falhas de segurança.', N'#FF0000', 1, 1);
INSERT INTO Prioridade (Nome, Descricao, Cor, Ativo, Ordem) VALUES (N'Alta', N'Funcionalidades principais afetadas com prazo curto.', N'#E67E22', 1, 2);
INSERT INTO Prioridade (Nome, Descricao, Cor, Ativo, Ordem) VALUES (N'Média', N'Demandas importantes, mas sem impacto imediato.', N'#F1C40F', 1, 3);
INSERT INTO Prioridade (Nome, Descricao, Cor, Ativo, Ordem) VALUES (N'Baixa', N'Melhorias cosméticas ou sugestões de UX.', N'#2ECC71', 1, 4);

-- =============================================
-- Colaborador admin
-- =============================================
INSERT INTO Colaborador (Nome, CPF, Email, Telefone, CEP, Cidade, UF, Logradouro, Bairro, Numero, DataNascimento, DataAdmissao, Ativo, SetorId, CargoId)
VALUES (N'Administrador', '000.000.000-00', 'admin@empresa.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, '1990-01-01', GETDATE(), 1, @SetorId, @CargoId);
SET @ColabId = SCOPE_IDENTITY();

-- =============================================
-- Usuario admin
-- Login: admin
-- Senha: admin123  (SHA-256 hex maiusculo, igual ao GerarHashSenha do Usuario.cs)
-- =============================================
INSERT INTO Usuario (ColaboradorId, Login, SenhaHash, Ativo, NivelAcesso, DataCadastro)
VALUES (@ColabId, 'admin', '240BE518FABD2724DDB6F04EEB1DA5967448D7E831C08C8FA822809F74C720A9', 1, @NivelAdminId, GETDATE());
