import { motion } from 'framer-motion';
import {
  AlertTriangle,
  BarChart3,
  Crown,
  Edit3,
  GraduationCap,
  Medal,
  RefreshCw,
  RotateCcw,
  Scale,
  Search,
  Sparkles,
  Trash2,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { DashboardResults, Movie, VoteLogEntry } from '../types/cinema';
import { hexToRgba } from '../utils/colorExtractor';
import { MoviePoster } from './MoviePoster';

interface ResultsDashboardProps {
  results: DashboardResults | null;
  movies: Movie[];
  loading: boolean;
  onRefresh: () => void;
  onResetVotes: () => Promise<void>;
  onDeleteVote: (voteId: string) => Promise<void>;
  onUpdateVote: (
    voteId: string,
    patch: { curso?: string; ranked_movie_ids?: string[] }
  ) => Promise<void>;
}

export function ResultsDashboard({
  results,
  movies,
  loading,
  onRefresh,
  onResetVotes,
  onDeleteVote,
  onUpdateVote,
}: ResultsDashboardProps) {
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [voteSearch, setVoteSearch] = useState('');
  const [editingVote, setEditingVote] = useState<VoteLogEntry | null>(null);
  const [editCurso, setEditCurso] = useState('');
  const [editMovieIds, setEditMovieIds] = useState<string[]>([]);
  const [voteEditError, setVoteEditError] = useState<string | null>(null);
  if (!results) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-sm text-slate-400">
        {loading ? 'Calculando escrutinio Borda y métricas de consenso…' : 'Sin datos disponibles.'}
      </div>
    );
  }

  const {
    total_votes,
    grand_total_points,
    participation_by_class,
    leaderboard,
    pedagogical_comparison,
    settings,
  } = results;

  const maxPoints = Math.max(1, ...leaderboard.map((l) => l.total_points));
  const maxClassVotes = Math.max(1, ...participation_by_class.map((c) => c.count));

  // Orden visual clásico de podio: [2º, 1º, 3º]
  const podiumOrder = [
    leaderboard[1] ? { rank: 2, item: leaderboard[1], height: 'h-36 sm:h-40', delay: 0.15 } : null,
    leaderboard[0] ? { rank: 1, item: leaderboard[0], height: 'h-44 sm:h-52', delay: 0.05 } : null,
    leaderboard[2] ? { rank: 3, item: leaderboard[2], height: 'h-28 sm:h-32', delay: 0.25 } : null,
  ].filter(Boolean) as Array<{
    rank: 1 | 2 | 3;
    item: (typeof leaderboard)[number];
    height: string;
    delay: number;
  }>;

  return (
    <div className="space-y-6">
      {/* Cabecera de métricas */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-extrabold text-white">
            Escrutinio en Directo & Análisis Cívico
          </h3>
          <p className="text-xs text-slate-400">
            Recuento ponderado TOP {settings.top_k} ({settings.scoring_mode === 'classic' ? 'Borda Clásico' : 'Borda Fraccional'})
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar escrutinio
          </button>

          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            disabled={loading || total_votes === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/35 bg-rose-500/15 px-3.5 py-2 text-xs font-bold text-rose-200 transition hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Vaciar urna a cero
          </button>
        </div>
      </div>

      {/* KPIs superiores */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Votos válidos verificados</span>
            <Users className="h-4 w-4 text-sky-400" />
          </div>
          <p className="mt-2 font-mono text-3xl font-extrabold text-white">{total_votes}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">100% autenticados con OTP</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Puntos Borda repartidos</span>
            <Trophy className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 font-mono text-3xl font-extrabold text-white">
            {grand_total_points}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {leaderboard.length} películas en cartelera
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Consenso de la ganadora</span>
            <Scale className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 font-mono text-3xl font-extrabold text-emerald-300">
            {pedagogical_comparison.borda_winner
              ? `${pedagogical_comparison.borda_winner.top_k_pct}%`
              : '0%'}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Presente en el TOP {settings.top_k} del alumnado
          </p>
        </div>
      </div>

      {/* 1. PODIO INTERACTIVO */}
      {podiumOrder.length > 0 && (
        <section className="overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.04] to-black/30 p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-400" />
            <h4 className="font-display text-lg font-bold text-white">
              Podio de Cartelera
            </h4>
          </div>

          <div className="grid grid-cols-3 items-end gap-2 sm:gap-5">
            {podiumOrder.map(({ rank, item, height, delay }) => (
              <motion.div
                key={item.movie_id}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay, type: 'spring', stiffness: 180, damping: 18 }}
                className="flex flex-col items-center text-center"
              >
                <div className="relative mb-3">
                  <div
                    className="h-24 w-16 overflow-hidden rounded-xl border-2 shadow-xl sm:h-32 sm:w-24"
                    style={{
                      borderColor:
                        rank === 1
                          ? '#fbbf24'
                          : rank === 2
                            ? '#cbd5e1'
                            : '#fb923c',
                    }}
                  >
                    <MoviePoster
                      title={item.title}
                      posterUrl={item.poster_url}
                      palette={item.palette}
                      compact
                      className="h-full w-full"
                    />
                  </div>
                  <span
                    className={`absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-extrabold shadow-lg ${
                      rank === 1
                        ? 'bg-amber-400 text-slate-950'
                        : rank === 2
                          ? 'bg-slate-200 text-slate-950'
                          : 'bg-orange-400 text-slate-950'
                    }`}
                  >
                    {rank}º
                  </span>
                </div>

                <p className="line-clamp-2 font-display text-xs font-bold text-white sm:text-sm">
                  {item.title}
                </p>

                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ delay: delay + 0.1, duration: 0.45 }}
                  style={{
                    originY: 1,
                    background: `linear-gradient(180deg, ${hexToRgba(item.palette.primary, 0.55)} 0%, rgba(15,23,42,0.9) 100%)`,
                    borderColor: hexToRgba(item.palette.primary, 0.65),
                  }}
                  className={`mt-2 flex w-full flex-col items-center justify-center rounded-t-2xl border-x border-t px-2 py-3 ${height}`}
                >
                  <Medal
                    className={`h-5 w-5 ${
                      rank === 1
                        ? 'text-amber-300'
                        : rank === 2
                          ? 'text-slate-200'
                          : 'text-orange-300'
                    }`}
                  />
                  <span className="mt-1 font-mono text-base font-extrabold text-white sm:text-xl">
                    {item.total_points} pts
                  </span>
                  <span className="text-[10px] text-slate-300 sm:text-xs">
                    {item.borda_share_pct}% del total
                  </span>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* 2. DESGLOSE DE CONSENSO PEDAGÓGICO (1ª opción vs TOP K) */}
      <section className="rounded-3xl border border-white/15 bg-[#0a0e1a] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-sky-400" />
            <h4 className="font-display text-lg font-bold text-white">
              Desglose de Consenso Pedagógico
            </h4>
          </div>
          {pedagogical_comparison.diverged && (
            <span className="rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-300">
              ¡Divergencia detectada entre sistemas!
            </span>
          )}
        </div>

        {/* Banner explicativo para proyectar en clase */}
        <div
          className={`mt-4 rounded-2xl border p-4 ${
            pedagogical_comparison.diverged
              ? 'border-emerald-400/35 bg-emerald-500/10'
              : 'border-sky-400/30 bg-sky-500/10'
          }`}
        >
          <p className="font-display text-sm font-extrabold text-white">
            {pedagogical_comparison.insight_title}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-200">
            {pedagogical_comparison.insight_text}
          </p>
        </div>

        {/* Comparativa gráfica 1ª Opción vs Presencia en TOP 3 */}
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-rose-400/25 bg-rose-950/15 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-300">
              Si solo contase la 1ª opción (Mayoría Simple)
            </p>
            {pedagogical_comparison.fptp_winner ? (
              <div className="mt-3 flex items-center gap-3">
                <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg border border-white/15">
                  <MoviePoster
                    title={pedagogical_comparison.fptp_winner.title}
                    posterUrl={pedagogical_comparison.fptp_winner.poster_url}
                    palette={pedagogical_comparison.fptp_winner.palette}
                    compact
                    className="h-full w-full"
                  />
                </div>
                <div>
                  <p className="font-display font-bold text-white">
                    {pedagogical_comparison.fptp_winner.title}
                  </p>
                  <p className="font-mono text-xs text-rose-200">
                    {pedagogical_comparison.fptp_winner.first_choice_votes} votos #1 (
                    {pedagogical_comparison.fptp_winner.first_choice_pct}%)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Presencia en TOP {settings.top_k}:{' '}
                    {pedagogical_comparison.fptp_winner.top_k_pct}%
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-400">Sin datos</p>
            )}
          </div>

          <div className="rounded-2xl border border-emerald-400/35 bg-emerald-950/15 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
              Con Voto Preferencial Borda (Consenso TOP {settings.top_k})
            </p>
            {pedagogical_comparison.borda_winner ? (
              <div className="mt-3 flex items-center gap-3">
                <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg border border-white/15">
                  <MoviePoster
                    title={pedagogical_comparison.borda_winner.title}
                    posterUrl={pedagogical_comparison.borda_winner.poster_url}
                    palette={pedagogical_comparison.borda_winner.palette}
                    compact
                    className="h-full w-full"
                  />
                </div>
                <div>
                  <p className="font-display font-bold text-white">
                    {pedagogical_comparison.borda_winner.title}
                  </p>
                  <p className="font-mono text-xs text-emerald-200">
                    {pedagogical_comparison.borda_winner.total_points} pts · en TOP{' '}
                    {settings.top_k} del {pedagogical_comparison.borda_winner.top_k_pct}%
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Votos como 1ª opción:{' '}
                    {pedagogical_comparison.borda_winner.first_choice_votes} (
                    {pedagogical_comparison.borda_winner.first_choice_pct}%)
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-400">Sin datos</p>
            )}
          </div>
        </div>

        {/* Gráfico comparativo doble por película */}
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />% votos como 1ª opción
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />% alumnos que la
              incluyen en su TOP {settings.top_k} (consenso)
            </span>
          </div>

          {leaderboard.map((item) => (
            <div key={`cmp-${item.movie_id}`} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white">{item.title}</span>
                <span className="font-mono text-[11px] text-slate-400">
                  1ª: {item.first_choice_pct}% · TOP {settings.top_k}: {item.top_k_pct}%
                </span>
              </div>
              <div className="space-y-1">
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.first_choice_pct}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full rounded-full bg-rose-400"
                  />
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.top_k_pct}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full rounded-full bg-emerald-400"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. PUNTUACIONES PONDERADAS + PARTICIPACIÓN POR CURSO */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Gráfico de puntuaciones ponderadas */}
        <section className="rounded-3xl border border-white/15 bg-white/[0.02] p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-amber-400" />
            <h4 className="font-display text-base font-bold text-white">
              Puntuación Borda Ponderada
            </h4>
          </div>
          <div className="space-y-3.5">
            {leaderboard.map((item, idx) => {
              const widthPct = Math.round((item.total_points / maxPoints) * 100);
              return (
                <div key={item.movie_id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate font-semibold text-white">
                      {idx + 1}. {item.title}
                    </span>
                    <span className="ml-2 shrink-0 font-mono font-bold text-amber-300">
                      {item.total_points} pts
                    </span>
                  </div>
                  <div className="h-3.5 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPct}%` }}
                      transition={{ duration: 0.55 }}
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${item.palette.primary}, ${item.palette.accent})`,
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
                    {Array.from({ length: settings.top_k }, (_, i) => i + 1).map((pos) => (
                      <span key={pos} className="font-mono">
                        {pos}ª: {item.rank_breakdown[pos] ?? 0}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Participación por Curso / Grupo */}
        <section className="rounded-3xl border border-white/15 bg-white/[0.02] p-5">
          <div className="mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-sky-400" />
            <h4 className="font-display text-base font-bold text-white">
              Participación por Curso / Grupo
            </h4>
          </div>
          <div className="space-y-3">
            {participation_by_class.map((cls) => {
              const barPct = Math.round((cls.count / maxClassVotes) * 100);
              return (
                <div key={cls.curso} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{cls.curso}</span>
                    <span className="font-mono text-slate-300">
                      {cls.count} {cls.count === 1 ? 'voto' : 'votos'} ({cls.percentage}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barPct}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* 4. REGISTRO DE VOTOS / ENTRADAS PARA CORRECCIONES GRÁFICAS */}
      <section className="rounded-3xl border border-white/15 bg-white/[0.02] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h4 className="font-display text-base font-bold text-white">
              Votos registrados ({results.votes_log?.length ?? 0})
            </h4>
            <p className="text-xs text-slate-400">
              Si un alumno se equivocó al elegir su curso o quieres anular un voto de prueba,
              puedes editarlo o eliminarlo aquí.
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="search"
              value={voteSearch}
              onChange={(e) => setVoteSearch(e.target.value)}
              placeholder="Buscar alumno o curso…"
              className="w-full rounded-xl border border-white/15 bg-black/40 py-2 pl-8 pr-3 text-xs text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
            />
          </div>
        </div>

        {!results.votes_log || results.votes_log.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-400">
            La urna está vacía (0 votos).
          </p>
        ) : (
          <div className="mt-4 space-y-2.5">
            {results.votes_log
              .filter((v) => {
                const q = voteSearch.trim().toLowerCase();
                if (!q) return true;
                return (
                  v.nombre.toLowerCase().includes(q) ||
                  v.apellidos.toLowerCase().includes(q) ||
                  v.curso.toLowerCase().includes(q) ||
                  v.email.toLowerCase().includes(q)
                );
              })
              .map((vote) => (
                <div
                  key={vote.id}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 p-3.5 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-sm font-bold capitalize text-white">
                        {vote.nombre} {vote.apellidos}
                      </span>
                      <span className="rounded-lg bg-sky-500/20 px-2 py-0.5 text-[11px] font-bold text-sky-300">
                        {vote.curso}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {vote.email}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-300">
                      {vote.choices.map((ch) => (
                        <span
                          key={ch.rank_position}
                          className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5"
                        >
                          <strong className="text-amber-300">{ch.rank_position}º</strong>{' '}
                          {ch.title}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingVote(vote);
                        setEditCurso(vote.curso);
                        setEditMovieIds(vote.choices.map((c) => c.movie_id));
                        setVoteEditError(null);
                      }}
                      className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/10"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-sky-300" />
                      Modificar
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteVote(vote.id)}
                      className="inline-flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-200 hover:bg-rose-500/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Anular
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Modal de confirmación para Vaciar Urna a cero */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-rose-500/40 bg-[#120e16] p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h4 className="font-display text-lg font-extrabold text-white">
                  ¿Vaciar toda la urna a cero?
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                  Se borrarán los <strong>{total_votes} votos</strong> y los códigos OTP
                  temporales para que puedas empezar una votación limpia desde 0.{' '}
                  <strong>Tus películas y ajustes NO se borrarán.</strong>
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/10"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmResetOpen(false);
                  await onResetVotes();
                }}
                className="rounded-xl bg-rose-500 px-4 py-2 text-xs font-extrabold text-white hover:bg-rose-400"
              >
                Sí, vaciar urna a cero
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal gráfico para modificar un voto concreto */}
      {editingVote && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (new Set(editMovieIds).size !== editMovieIds.length) {
                setVoteEditError('No puedes repetir la misma película en dos puestos.');
                return;
              }
              setVoteEditError(null);
              await onUpdateVote(editingVote.id, {
                curso: editCurso,
                ranked_movie_ids: editMovieIds,
              });
              setEditingVote(null);
            }}
            className="w-full max-w-md space-y-4 rounded-3xl border border-white/20 bg-[#101526] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-display text-lg font-bold capitalize text-white">
                Modificar voto de {editingVote.nombre} {editingVote.apellidos}
              </h4>
              <button
                type="button"
                onClick={() => setEditingVote(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-300">
                Curso / Grupo
              </label>
              <select
                value={editCurso}
                onChange={(e) => setEditCurso(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-[#090c16] px-3 py-2 text-sm text-white"
              >
                {settings.allowed_classes.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-slate-300">
                Orden de películas elegido:
              </p>
              {editMovieIds.map((movieId, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-8 font-mono text-xs font-bold text-amber-300">
                    {idx + 1}º
                  </span>
                  <select
                    value={movieId}
                    onChange={(e) => {
                      const next = [...editMovieIds];
                      next[idx] = e.target.value;
                      setEditMovieIds(next);
                    }}
                    className="flex-1 rounded-xl border border-white/15 bg-[#090c16] px-3 py-2 text-xs text-white"
                  >
                    {movies
                      .filter((m) => m.status === 'published' || m.id === movieId)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title}
                        </option>
                      ))}
                  </select>
                </div>
              ))}
            </div>

            {voteEditError && (
              <p className="rounded-xl border border-rose-500/40 bg-rose-500/15 p-2.5 text-xs text-rose-200">
                {voteEditError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingVote(null)}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-extrabold text-slate-950 hover:bg-emerald-300"
              >
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
