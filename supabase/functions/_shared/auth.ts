import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2.49.4';

export function getServiceSupabaseClient(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !serviceKey) {
    throw new Error('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.');
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function constantTimeEquals(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  if (bufA.length !== bufB.length) return false;
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) {
    diff |= bufA[i] ^ bufB[i];
  }
  return diff === 0;
}

export async function verifyAdminRequest(
  req: Request
): Promise<{ ok: boolean; error?: string }> {
  const expectedSecret = Deno.env.get('ADMIN_SECRET')?.trim();
  if (!expectedSecret) {
    return {
      ok: false,
      error: 'El servidor no tiene configurado el secreto ADMIN_SECRET.',
    };
  }

  const provided = req.headers.get('x-admin-secret')?.trim() || '';
  if (!provided || !constantTimeEquals(provided, expectedSecret)) {
    // Retardo defensivo para mitigar fuerza bruta sobre ADMIN_SECRET
    await new Promise((resolve) => setTimeout(resolve, 450));
    return { ok: false, error: 'Clave de administración incorrecta.' };
  }

  return { ok: true };
}

export function generateFourDigitOtp(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  const num = array[0] % 10000;
  return String(num).padStart(4, '0');
}

export function generateRandomSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashOtpCode(salt: string, code: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${code}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
