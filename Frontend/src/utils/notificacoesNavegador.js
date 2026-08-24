'use client';

const ICONE = '/icon.svg';

function suportado() {
  return typeof window !== 'undefined' && 'Notification' in window && window.isSecureContext;
}

export function solicitarPermissaoNotificacao() {
  if (!suportado()) return;
  if (Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

export async function exibirNotificacaoNativa(titulo, { body } = {}) {
  if (!suportado() || Notification.permission !== 'granted') return;

  const opcoes = { body, icon: ICONE, badge: ICONE, tag: `asmtasks-notificacao-${Date.now()}` };

  try {
    if (navigator.serviceWorker) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(titulo, opcoes);
      return;
    }
  } catch {
    // segue para o fallback abaixo
  }

  try {
    new Notification(titulo, opcoes);
  } catch {
    // navegador pode recusar sem interação do usuário; ignora silenciosamente
  }
}
