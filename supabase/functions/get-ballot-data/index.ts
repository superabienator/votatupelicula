import { getServiceSupabaseClient } from '../_shared/auth.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const supabase = getServiceSupabaseClient();

    const [{ data: settings, error: settingsErr }, { data: movies, error: moviesErr }] =
      await Promise.all([
        supabase
          .from('voting_settings')
          .select(
            'id, campaign_title, subtitle, top_k, scoring_mode, theme_mode, featured_movie_id, allowed_classes, allowed_email_domains, voting_open'
          )
          .eq('id', 1)
          .single(),
        supabase
          .from('movies')
          .select(
            'id, title, original_title, year, duration_minutes, genres, tags, age_rating, synopsis, poster_url, backdrop_url, palette, status, display_order'
          )
          .eq('status', 'published')
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: true }),
      ]);

    if (settingsErr) throw settingsErr;
    if (moviesErr) throw moviesErr;

    return jsonResponse({
      ok: true,
      settings,
      movies: movies ?? [],
    });
  } catch (err) {
    console.error('get-ballot-data error:', err);
    return jsonResponse(
      { ok: false, error: 'No se pudo cargar la cartelera de votación.' },
      500
    );
  }
});
