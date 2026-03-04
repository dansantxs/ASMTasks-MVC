export function parseTimeToMinutes(timeValue, fallbackMinutes = 480) {
  if (typeof timeValue !== 'string' || !timeValue.includes(':')) return fallbackMinutes;

  const [hoursRaw, minutesRaw] = timeValue.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return fallbackMinutes;
  return (hours * 60) + minutes;
}

export function formatTimeLabel(timeValue, fallback = '08:00') {
  return typeof timeValue === 'string' && /^\d{2}:\d{2}$/.test(timeValue) ? timeValue : fallback;
}

export function getCompanyDisplayName(settings) {
  return settings?.nomeFantasia || settings?.razaoSocial || 'ASM Tasks';
}

export function getCompanySubtitle(settings) {
  return settings?.razaoSocial || 'Gerenciamento de Tarefas';
}

export function getCompanyFooterLines(settings) {
  const lines = [
    settings?.razaoSocial ? `Razao Social: ${settings.razaoSocial}` : null,
    settings?.nomeFantasia ? `Nome Fantasia: ${settings.nomeFantasia}` : null,
  ].filter(Boolean);

  return lines.length > 0 ? lines : ['ASM Tasks'];
}
