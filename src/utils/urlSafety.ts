/**
 * Helpers para validar URLs y colores hexadecimales antes de renderizar o almacenar,
 * previniendo inyecciones XSS (javascript:, data:, vbscript:) o inyecciones CSS.
 */

export function sanitizeSafeHttpUrl(raw?: string | null): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function sanitizeHexColor(raw?: string | null, fallback = '#6366f1'): string {
  if (typeof raw !== 'string') return fallback;
  const trimmed = raw.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : fallback;
}
