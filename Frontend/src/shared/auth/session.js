'use client';

const CHAVE_ARMAZENAMENTO = 'asm_auth_session';
const LIMITE_INATIVIDADE_MS = 30 * 60 * 1000;

export function obterSessaoArmazenada() {
  if (typeof window === 'undefined') return null;
  const bruto = localStorage.getItem(CHAVE_ARMAZENAMENTO);
  if (!bruto) return null;

  try {
    return JSON.parse(bruto);
  } catch {
    localStorage.removeItem(CHAVE_ARMAZENAMENTO);
    return null;
  }
}

export function salvarSessao(respostaLogin) {
  if (typeof window === 'undefined') return;

  const sessao = {
    expiraEm: respostaLogin.expiraEm,
    usuarioId: respostaLogin.usuarioId,
    colaboradorId: respostaLogin.colaboradorId,
    colaboradorNome: respostaLogin.colaboradorNome ?? '',
    nivelAcesso: respostaLogin.nivelAcesso ?? 0,
    permissoes: respostaLogin.permissoes ?? [],
    ehAdministrador: respostaLogin.ehAdministrador ?? false,
    ultimoAcessoEm: Date.now(),
  };

  localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(sessao));
}

export function limparSessao() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CHAVE_ARMAZENAMENTO);
}

export function isSessaoValida() {
  const sessao = obterSessaoArmazenada();
  if (!sessao?.usuarioId || !sessao?.expiraEm) return false;

  const expiraEm = new Date(sessao.expiraEm).getTime();
  if (Number.isNaN(expiraEm) || expiraEm <= Date.now()) {
    limparSessao();
    return false;
  }

  if (Date.now() - (sessao.ultimoAcessoEm ?? 0) > LIMITE_INATIVIDADE_MS) {
    limparSessao();
    return false;
  }

  return true;
}

export function registrarAtividadeSessao() {
  const sessao = obterSessaoArmazenada();
  if (!sessao) return;

  sessao.ultimoAcessoEm = Date.now();
  localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(sessao));
}

export function obterLimiteInatividadeMs() {
  return LIMITE_INATIVIDADE_MS;
}
