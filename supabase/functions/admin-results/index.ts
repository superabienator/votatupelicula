import { getServiceSupabaseClient, verifyAdminRequest } from '../_shared/auth.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  const auth = await verifyAdminRequest(req);
  if (!auth.ok) {
    return jsonResponse({ ok: false, error: auth.error }, 401);
  }

  try {
    const supabase = getServiceSupabaseClient();

    const [
      { data: settings, error: sErr },
      { data: movies, error: mErr },
      { data: votes, error: vErr },
      { data: choices, error: cErr },
    ] = await Promise.all([
      supabase.from('voting_settings').select('*').eq('id', 1).single(),
      supabase
        .from('movies')
        .select('id, title, poster_url, palette, year, status, genres')
        .in('status', ['published', 'archived']),
      supabase
        .from('votes')
        .select('id, nombre, apellidos, curso, email, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('vote_choices').select('vote_id, movie_id, rank_position, points'),
    ]);

    if (sErr) throw sErr;
    if (mErr) throw mErr;
    if (vErr) throw vErr;
    if (cErr) throw cErr;

    const totalVotes = votes?.length ?? 0;
    const allowedClasses: string[] = Array.isArray(settings?.allowed_classes)
      ? settings.allowed_classes.map(String)
      : [];

    // Participación por curso/grupo
    const classCounts = new Map<string, number>();
    for (const c of allowedClasses) classCounts.set(c, 0);
    for (const v of votes ?? []) {
      classCounts.set(v.curso, (classCounts.get(v.curso) ?? 0) + 1);
    }

    const participationByClass = Array.from(classCounts.entries()).map(([curso, count]) => ({
      curso,
      count,
      percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 1000) / 10 : 0,
    }));

    // Agregación Borda y comparación pedagógica
    const movieStatsMap = new Map<
      string,
      {
        movie_id: string;
        title: string;
        poster_url: string;
        palette: { primary: string; secondary: string; accent: string };
        year: number | null;
        status: string;
        total_points: number;
        first_choice_votes: number;
        top_k_appearances: number;
        rank_breakdown: Record<number, number>;
      }
    >();

    for (const m of movies ?? []) {
      movieStatsMap.set(m.id, {
        movie_id: m.id,
        title: m.title,
        poster_url: m.poster_url,
        palette: m.palette,
        year: m.year,
        status: m.status,
        total_points: 0,
        first_choice_votes: 0,
        top_k_appearances: 0,
        rank_breakdown: {},
      });
    }

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

    const fptpSorted = [...leaderboard].sort((a, b) => {
      if (b.first_choice_votes !== a.first_choice_votes) {
        return b.first_choice_votes - a.first_choice_votes;
      }
      return b.total_points - a.total_points;
    });

    const consensusSorted = [...leaderboard].sort((a, b) => {
      if (b.top_k_appearances !== a.top_k_appearances) {
        return b.top_k_appearances - a.top_k_appearances;
      }
      return b.total_points - a.total_points;
    });

    const bordaWinner = leaderboard[0] ?? null;
    const fptpWinner = fptpSorted[0] ?? null;
    const consensusWinner = consensusSorted[0] ?? null;

    const diverged = Boolean(
      bordaWinner && fptpWinner && bordaWinner.movie_id !== fptpWinner.movie_id
    );

    let insightTitle = 'Sin votos registrados todavía';
    let insightText =
      'Cuando el alumnado emita los primeros votos verificados, verás aquí la comparativa entre Mayoría Simple y Consenso Borda.';

    if (totalVotes > 0 && bordaWinner && fptpWinner) {
      if (diverged) {
        insightTitle = '¡El Voto Preferencial ha evitado la polarización!';
        insightText = `Con Mayoría Simple habría ganado "${fptpWinner.title}" con solo un ${fptpWinner.first_choice_pct}% de primeras opciones. Sin embargo, el Recuento Borda premia a "${bordaWinner.title}" porque aparece en el TOP ${settings?.top_k ?? 3} del ${bordaWinner.top_k_pct}% del alumnado, logrando mayor consenso real en el aula.`;
      } else {
        insightTitle = 'Consenso sólido y primera opción alineada';
        insightText = `"${bordaWinner.title}" lidera tanto en primeras elecciones (${bordaWinner.first_choice_pct}%) como en presencia global dentro del TOP ${settings?.top_k ?? 3} (${bordaWinner.top_k_pct}% del alumnado), demostrando un apoyo transversal en toda la clase.`;
      }
    }

    const movieTitleMap = new Map<string, string>();
    for (const m of movies ?? []) {
      movieTitleMap.set(m.id, m.title);
    }

    const choicesByVote = new Map<
      string,
      Array<{ rank_position: number; movie_id: string; title: string }>
    >();
    for (const ch of choices ?? []) {
      const list = choicesByVote.get(ch.vote_id) ?? [];
      list.push({
        rank_position: ch.rank_position,
        movie_id: ch.movie_id,
        title: movieTitleMap.get(ch.movie_id) ?? 'Película',
      });
      choicesByVote.set(ch.vote_id, list);
    }

    const votesLog = (votes ?? []).map((v) => ({
      id: v.id,
      nombre: v.nombre,
      apellidos: v.apellidos,
      curso: v.curso,
      email: v.email,
      created_at: v.created_at,
      choices: (choicesByVote.get(v.id) ?? []).sort(
        (a, b) => a.rank_position - b.rank_position
      ),
    }));

    return jsonResponse({
      ok: true,
      settings,
      total_votes: totalVotes,
      grand_total_points: grandTotalPoints,
      participation_by_class: participationByClass,
      leaderboard,
      votes_log: votesLog,
      pedagogical_comparison: {
        fptp_winner: fptpWinner,
        borda_winner: bordaWinner,
        consensus_winner: consensusWinner,
        diverged,
        insight_title: insightTitle,
        insight_text: insightText,
      },
    });
  } catch (err) {
    console.error('admin-results error:', err);
    return jsonResponse(
      { ok: false, error: 'Error al calcular los resultados del escrutinio.' },
      500
    );
  }
});
