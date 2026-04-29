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
