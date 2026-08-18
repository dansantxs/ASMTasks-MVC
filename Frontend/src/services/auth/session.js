'use client';

const CHAVE_ARMAZENAMENTO = 'asm_auth_session';

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

// Armazena apenas metadados de tempo — dados do usuário ficam em memória via useUsuarioAtual.
export function salvarSessao(respostaLogin) {
  if (typeof window === 'undefined') return;

  const sessao = {
    expiraEm: respostaLogin.expiraEm,
  };

  localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(sessao));
}

export function limparSessao() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CHAVE_ARMAZENAMENTO);
}

// A sessão só é considerada inválida quando o token realmente expira (Jwt:ExpirationMinutes no backend).
// Não há mais logout por inatividade — o cronômetro de tarefas cobre a pausa automática nesse cenário.
export function isSessaoValida() {
  const sessao = obterSessaoArmazenada();
  if (!sessao?.expiraEm) return false;

  const expiraEm = new Date(sessao.expiraEm).getTime();
  if (Number.isNaN(expiraEm) || expiraEm <= Date.now()) {
    limparSessao();
    return false;
  }

  return true;
}
