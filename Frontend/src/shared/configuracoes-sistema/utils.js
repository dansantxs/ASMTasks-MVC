export function converterHoraParaMinutos(valor, fallback = 480) {
  if (typeof valor !== 'string' || !valor.includes(':')) return fallback;

  const [horasStr, minutosStr] = valor.split(':');
  const horas = Number(horasStr);
  const minutos = Number(minutosStr);

  if (!Number.isFinite(horas) || !Number.isFinite(minutos)) return fallback;
  return (horas * 60) + minutos;
}

export function formatarRotuloHora(valor, fallback = '08:00') {
  return typeof valor === 'string' && /^\d{2}:\d{2}$/.test(valor) ? valor : fallback;
}

export function obterNomeEmpresa(configuracoes) {
  return configuracoes?.nomeFantasia || configuracoes?.razaoSocial || 'ASM Tasks';
}

export function obterSubtituloEmpresa(configuracoes) {
  return configuracoes?.razaoSocial || 'Gerenciamento de Tarefas';
}

export function obterLinhasRodapeEmpresa(configuracoes) {
  const linhas = [
    configuracoes?.razaoSocial ? `Razão Social: ${configuracoes.razaoSocial}` : null,
    configuracoes?.nomeFantasia ? `Nome Fantasia: ${configuracoes.nomeFantasia}` : null,
  ].filter(Boolean);

  return linhas.length > 0 ? linhas : ['ASM Tasks'];
}
