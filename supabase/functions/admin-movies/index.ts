import { getServiceSupabaseClient, verifyAdminRequest } from '../_shared/auth.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { enrichMovieTitle } from '../_shared/enrichment.ts';

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function runNext() {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await worker(items[idx], idx);
    }
  }

  const runners = Array.from({ length: Math.min(limit, items.length) }, () => runNext());
  await Promise.all(runners);
  return results;
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const auth = verifyAdminRequest(req);
  if (!auth.ok) {
    return jsonResponse({ ok: false, error: auth.error }, 401);
  }

  try {
    const supabase = getServiceSupabaseClient();
    const body = req.method === 'GET' ? { action: 'list' } : await req.json();
    const action = String(body?.action || 'list');

    if (action === 'list') {
      const [{ data: movies, error: mErr }, { data: settings, error: sErr }, { count }] =
        await Promise.all([
          supabase
            .from('movies')
            .select('*')
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false }),
          supabase.from('voting_settings').select('*').eq('id', 1).single(),
          supabase.from('votes').select('id', { count: 'exact', head: true }),
        ]);

      if (mErr) throw mErr;
      if (sErr) throw sErr;

      return jsonResponse({
        ok: true,
        movies: movies ?? [],
        settings,
        total_votes: count ?? 0,
      });
    }

    // Fase 1: Barrido inteligente por lista de títulos -> status = 'draft'
    if (action === 'enrich_batch') {
      const rawTitles: unknown[] = Array.isArray(body?.titles) ? body.titles : [];
      const titles = rawTitles
        .map((t) => String(t).trim())
        .filter((t) => t.length > 0)
        .slice(0, 20);

      if (titles.length === 0) {
        return jsonResponse(
          { ok: false, error: 'Introduce al menos un título de película.' },
          400
        );
      }

      const enrichedDrafts = await mapWithConcurrency(titles, 3, async (title, idx) => {
        const draft = await enrichMovieTitle(title);
        return {
          ...draft,
          status: 'draft' as const,
          display_order: idx + 1,
        };
      });

      const { data: inserted, error: insErr } = await supabase
        .from('movies')
        .insert(enrichedDrafts)
        .select('*');

      if (insErr) throw insErr;

      return jsonResponse({
        ok: true,
        created_count: inserted?.length ?? 0,
        movies: inserted ?? [],
      });
    }

    if (action === 'create_manual') {
      const moviePayload = body?.movie ?? {};
      const title = String(moviePayload.title || '').trim();
      if (!title) {
        return jsonResponse({ ok: false, error: 'El título es obligatorio.' }, 400);
      }

      const { data: inserted, error: insErr } = await supabase
        .from('movies')
        .insert({
          title,
          original_title: moviePayload.original_title || null,
          year: moviePayload.year ? Number(moviePayload.year) : null,
          duration_minutes: moviePayload.duration_minutes
            ? Number(moviePayload.duration_minutes)
            : null,
          genres: Array.isArray(moviePayload.genres) ? moviePayload.genres : [],
          tags: Array.isArray(moviePayload.tags) ? moviePayload.tags : [],
          age_rating: String(moviePayload.age_rating || 'TP'),
          synopsis: String(moviePayload.synopsis || ''),
          poster_url: String(moviePayload.poster_url || ''),
          backdrop_url: String(moviePayload.backdrop_url || ''),
          palette: moviePayload.palette || {
            primary: '#6366f1',
            secondary: '#ec4899',
            accent: '#f59e0b',
          },
          status: 'draft',
          source_provider: 'manual',
        })
        .select('*')
        .single();

      if (insErr) throw insErr;
      return jsonResponse({ ok: true, movie: inserted });
    }

    // Fase 2: Edición individual de ficha, textos, imágenes o paleta
    if (action === 'update') {
      const id = String(body?.id || '').trim();
      const patch = body?.patch ?? {};
      if (!id) {
        return jsonResponse({ ok: false, error: 'Falta el ID de la película.' }, 400);
      }

      const allowedPatch: Record<string, unknown> = {};
      const allowedFields = [
        'title',
        'original_title',
        'year',
        'duration_minutes',
        'genres',
        'tags',
        'age_rating',
        'synopsis',
        'poster_url',
        'backdrop_url',
        'palette',
        'status',
        'display_order',
      ];

      for (const field of allowedFields) {
        if (patch[field] !== undefined) {
          allowedPatch[field] = patch[field];
        }
      }

      const { data: updated, error: updErr } = await supabase
        .from('movies')
        .update(allowedPatch)
        .eq('id', id)
        .select('*')
        .single();

      if (updErr) throw updErr;
      return jsonResponse({ ok: true, movie: updated });
    }

    // Fase 2: Acción "Aprobar y Publicar Cartelera"
    if (action === 'publish_billboard') {
      const movieIds: string[] | undefined = Array.isArray(body?.movie_ids)
        ? body.movie_ids.map(String)
        : undefined;

      let query = supabase.from('movies').update({ status: 'published' });
      if (movieIds && movieIds.length > 0) {
        query = query.in('id', movieIds);
      } else {
        query = query.eq('status', 'draft');
      }

      const { data: published, error: pubErr } = await query.select('*');
      if (pubErr) throw pubErr;

      return jsonResponse({
        ok: true,
        published_count: published?.length ?? 0,
        movies: published ?? [],
      });
    }

    if (action === 'delete') {
      const id = String(body?.id || '').trim();
      if (!id) {
        return jsonResponse({ ok: false, error: 'Falta el ID de la película.' }, 400);
      }

      // Si ya tiene votos asociados, archivar en lugar de romper la integridad referencial
      const { count } = await supabase
        .from('vote_choices')
        .select('id', { count: 'exact', head: true })
        .eq('movie_id', id);

      if ((count ?? 0) > 0) {
        const { data: archived, error: archErr } = await supabase
          .from('movies')
          .update({ status: 'archived' })
          .eq('id', id)
          .select('*')
          .single();

        if (archErr) throw archErr;
        return jsonResponse({
          ok: true,
          archived: true,
          movie: archived,
          message:
            'La película ya tenía votos emitidos, por lo que se ha archivado para conservar la integridad del escrutinio.',
        });
      }

      const { error: delErr } = await supabase.from('movies').delete().eq('id', id);
      if (delErr) throw delErr;
      return jsonResponse({ ok: true, deleted: true });
    }

    if (action === 'update_settings') {
      const patch = body?.settings ?? {};
      const allowedPatch: Record<string, unknown> = {};
      const fields = [
        'campaign_title',
        'subtitle',
        'top_k',
        'scoring_mode',
        'theme_mode',
        'featured_movie_id',
        'allowed_classes',
        'allowed_email_domains',
        'voting_open',
      ];
      for (const f of fields) {
        if (patch[f] !== undefined) {
          allowedPatch[f] = patch[f];
        }
      }

      const { data: updated, error: updErr } = await supabase
        .from('voting_settings')
        .update(allowedPatch)
        .eq('id', 1)
        .select('*')
        .single();

      if (updErr) throw updErr;
      return jsonResponse({ ok: true, settings: updated });
    }

    if (action === 'reset_votes') {
      const { error: chErr } = await supabase
        .from('vote_choices')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (chErr) throw chErr;

      const { error: vErr } = await supabase
        .from('votes')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (vErr) throw vErr;

      const { error: otpErr } = await supabase
        .from('otp_tokens')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (otpErr) throw otpErr;

      return jsonResponse({ ok: true, reset: true });
    }

    if (action === 'delete_vote') {
      const voteId = String(body?.vote_id || '').trim();
      if (!voteId) {
        return jsonResponse({ ok: false, error: 'Falta el ID del voto.' }, 400);
      }
      const { error: delVoteErr } = await supabase
        .from('votes')
        .delete()
        .eq('id', voteId);
      if (delVoteErr) throw delVoteErr;
      return jsonResponse({ ok: true, deleted: true });
    }

    if (action === 'update_vote') {
      const voteId = String(body?.vote_id || '').trim();
      const curso = body?.curso ? String(body.curso).trim() : undefined;
      const rankedMovieIds: string[] | undefined = Array.isArray(body?.ranked_movie_ids)
        ? body.ranked_movie_ids.map(String)
        : undefined;

      if (!voteId) {
        return jsonResponse({ ok: false, error: 'Falta el ID del voto.' }, 400);
      }

      if (curso) {
        const { error: updVoteErr } = await supabase
          .from('votes')
          .update({ curso })
          .eq('id', voteId);
        if (updVoteErr) throw updVoteErr;
      }

      if (rankedMovieIds && rankedMovieIds.length > 0) {
        const { data: settingsRow } = await supabase
          .from('voting_settings')
          .select('top_k, scoring_mode')
          .eq('id', 1)
          .single();

        const topK = settingsRow?.top_k === 5 ? 5 : 3;
        const scoringMode = settingsRow?.scoring_mode === 'fractional' ? 'fractional' : 'classic';
        const uniqueIds = new Set(rankedMovieIds);
        if (uniqueIds.size !== rankedMovieIds.length || rankedMovieIds.length !== topK) {
          return jsonResponse(
            { ok: false, error: `Debes elegir exactamente ${topK} películas distintas.` },
            400
          );
        }

        const { error: delChErr } = await supabase
          .from('vote_choices')
          .delete()
          .eq('vote_id', voteId);
        if (delChErr) throw delChErr;

        const fractionalWeights = [1, 0.5, 0.25, 0.15, 0.1];
        const newChoices = rankedMovieIds.map((movieId, idx) => ({
          vote_id: voteId,
          movie_id: movieId,
          rank_position: idx + 1,
          points: scoringMode === 'fractional' ? fractionalWeights[idx] : topK - idx,
        }));

        const { error: insChErr } = await supabase
          .from('vote_choices')
          .insert(newChoices);
        if (insChErr) throw insChErr;
      }

      return jsonResponse({ ok: true });
    }

    return jsonResponse({ ok: false, error: `Acción desconocida: ${action}` }, 400);
  } catch (err) {
    console.error('admin-movies error:', err);
    return jsonResponse(
      { ok: false, error: 'Error al gestionar el catálogo de películas.' },
      500
    );
  }
});
