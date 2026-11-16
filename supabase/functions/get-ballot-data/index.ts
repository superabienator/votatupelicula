import { computeVoteAuditHash } from '../_shared/auditHash.ts';
import { getServiceSupabaseClient } from '../_shared/auth.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const supabase = getServiceSupabaseClient();

    // Nota RGPD/LOPDGDD: De `votes` se selecciona EXCLUSIVAMENTE `id, curso`
    // (nunca nombre, apellidos, email ni huella_alumno) para calcular el
    // estado público anónimo sin exponer identidades personales.
    const [
      { data: settings, error: settingsErr },
      { data: movies, error: moviesErr },
      { data: voteRefs, error: votesErr },
      { data: choices, error: choicesErr },
    ] = await Promise.all([
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
      supabase.from('votes').select('id, curso'),
      supabase.from('vote_choices').select('movie_id, rank_position, points'),
    ]);

    if (settingsErr) throw settingsErr;
    if (moviesErr) throw moviesErr;
    if (votesErr) throw votesErr;
    if (choicesErr) throw choicesErr;

    const publishedMovies = movies ?? [];
    const totalVotes = voteRefs?.length ?? 0;
    const allowedClasses: string[] = Array.isArray(settings?.allowed_classes)
      ? settings.allowed_classes.map(String)
      : [];

    const classCounts = new Map<string, number>();
    for (const c of allowedClasses) classCounts.set(c, 0);
    for (const v of voteRefs ?? []) {
      classCounts.set(v.curso, (classCounts.get(v.curso) ?? 0) + 1);
    }

    const participationByClass = Array.from(classCounts.entries()).map(
      ([curso, count]) => ({
        curso,
        count,
        percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 1000) / 10 : 0,
      })
    );

    const movieStatsMap = new Map(
      publishedMovies.map((m) => [
        m.id,
        {
          movie_id: m.id,
          title: m.title,
          poster_url: m.poster_url,
          palette: m.palette,
          year: m.year,
          status: m.status,
          total_points: 0,
          first_choice_votes: 0,
          top_k_appearances: 0,
          rank_breakdown: {} as Record<number, number>,
        },
      ])
    );

    let grandTotalPoints = 0;
    for (const ch of choices ?? []) {
      const entry = movieStatsMap.get(ch.movie_id);
      if (!entry) continue;
      const pts = Number(ch.points) || 0;
      entry.total_points = Math.round((entry.total_points + pts) * 100) / 100;
      grandTotalPoints = Math.round((grandTotalPoints + pts) * 100) / 100;
      entry.top_k_appearances += 1;
      if (ch.rank_position === 1) {
        entry.first_choice_votes += 1;
      }
      entry.rank_breakdown[ch.rank_position] =
        (entry.rank_breakdown[ch.rank_position] ?? 0) + 1;
    }

    const leaderboard = Array.from(movieStatsMap.values())
      .map((item) => ({
        ...item,
        first_choice_pct:
          totalVotes > 0
            ? Math.round((item.first_choice_votes / totalVotes) * 1000) / 10
            : 0,
        top_k_pct:
          totalVotes > 0
            ? Math.round((item.top_k_appearances / totalVotes) * 1000) / 10
            : 0,
        borda_share_pct:
          grandTotalPoints > 0
            ? Math.round((item.total_points / grandTotalPoints) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => {
        if (b.total_points !== a.total_points) return b.total_points - a.total_points;
        if (b.first_choice_votes !== a.first_choice_votes) {
          return b.first_choice_votes - a.first_choice_votes;
        }
        if (b.top_k_appearances !== a.top_k_appearances) {
          return b.top_k_appearances - a.top_k_appearances;
        }
        return a.title.localeCompare(b.title, 'es');
      });

    const fptpWinner =
      [...leaderboard].sort((a, b) => {
        if (b.first_choice_votes !== a.first_choice_votes) {
          return b.first_choice_votes - a.first_choice_votes;
        }
        return b.total_points - a.total_points;
      })[0] ?? null;

    const bordaWinner = leaderboard[0] ?? null;
    const consensusWinner =
      [...leaderboard].sort((a, b) => b.top_k_appearances - a.top_k_appearances)[0] ??
      null;

    return jsonResponse({
      ok: true,
      settings,
      movies: publishedMovies,
      public_standings: {
        total_votes: totalVotes,
        grand_total_points: grandTotalPoints,
        participation_by_class: participationByClass,
        leaderboard,
        pedagogical_comparison: {
          fptp_winner: fptpWinner,
          borda_winner: bordaWinner,
          consensus_winner: consensusWinner,
          diverged: Boolean(
            bordaWinner && fptpWinner && bordaWinner.movie_id !== fptpWinner.movie_id
          ),
        },
        verified_hashes: (voteRefs ?? []).map((v) => ({
          audit_hash: computeVoteAuditHash(v.id, v.curso),
          curso: v.curso,
        })),
      },
    });
  } catch (err) {
    console.error('get-ballot-data error:', err);
    return jsonResponse(
      { ok: false, error: 'No se pudo cargar la cartelera de votación.' },
      500
    );
  }
});
