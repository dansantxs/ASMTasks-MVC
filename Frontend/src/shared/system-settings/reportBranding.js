'use client';

import { getCompanyFooterLines } from './utils';

export async function getReportLogoDataUrl(settings) {
  return settings?.logoBase64 || null;
}

export function getReportFooterLines(settings) {
  return getCompanyFooterLines(settings);
}
