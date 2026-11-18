const DEFAULT_PROD_ORIGIN = 'https://mercuriovotatupelicula.netlify.app';

const EXTRA_ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

function isAllowedOrigin(origin: string): boolean {
  if (origin === DEFAULT_PROD_ORIGIN) return true;
  if (EXTRA_ALLOWED_ORIGINS.includes(origin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)) return true;
  return false;
}

export function resolveAllowedOrigin(req?: Request): string {
  const origin = req?.headers.get('origin')?.trim();
  if (origin && isAllowedOrigin(origin)) {
    return origin;
  }
  return Deno.env.get('ALLOWED_ORIGIN')?.trim() || DEFAULT_PROD_ORIGIN;
}

export function getCorsHeaders(req?: Request): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': resolveAllowedOrigin(req),
    'Access-Control-Allow-Headers':
      'authorization, x-client-info, apikey, content-type, x-admin-secret',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    Vary: 'Origin',
  };
}

export const corsHeaders: Record<string, string> = getCorsHeaders();

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }
  return null;
}

export function jsonResponse(
  payload: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
  req?: Request
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...getCorsHeaders(req),
      'Content-Type': 'application/json; charset=utf-8',
      ...extraHeaders,
    },
  });
}
