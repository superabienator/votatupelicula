import { verifyAdminRequest } from '../_shared/auth.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const auth = verifyAdminRequest(req);
  if (!auth.ok) {
    return jsonResponse({ ok: false, error: auth.error }, 401);
  }

  return jsonResponse({ ok: true });
});
