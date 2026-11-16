import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Crown,
  GraduationCap,
  Medal,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { getLocalizedMovie } from '../i18n/translations';
import type { Movie, PublicStandings, VotingSettings } from '../types/cinema';
import { hexToRgba } from '../utils/colorExtractor';
import { useEscapeKey } from '../utils/useEscapeKey';
import { MoviePoster } from './MoviePoster';

interface PublicStandingsModalProps {
  open: boolean;
  onClose: () => void;
  standings: PublicStandings | null;
  movies: Movie[];
  settings: VotingSettings | null;
  loading: boolean;
  onRefresh: () => void;
}

export function PublicStandingsModal({
  open,
  onClose,
  standings,
  movies,
  settings,
  loading,
  onRefresh,
}: PublicStandingsModalProps) {
  const { lang, t } = useI18n();
  useEscapeKey(open, onClose);

  const movieMap = new Map(movies.map((m) => [m.id, m]));
  const getTitle = (movieId: string, fallback: string) => {
    const found = movieMap.get(movieId);
    return found ? getLocalizedMovie(found, lang).title : fallback;
  };

  const topK = settings?.top_k ?? 3;
  const leaderboard = standings?.leaderboard ?? [];
  const totalVotes = standings?.total_votes ?? 0;
  const maxPoints = Math.max(1, ...leaderboard.map((l) => l.total_points));
  const participation = standings?.participation_by_class ?? [];
  const maxClassVotes = Math.max(1, ...participation.map((c) => c.count));

  const podiumOrder = [
    leaderboard[1] ? { rank: 2 as const, item: leaderboard[1], height: 'h-32 sm:h-36', delay: 0.12 } : null,
    leaderboard[0] ? { rank: 1 as const, item: leaderboard[0], height: 'h-40 sm:h-44', delay: 0.04 } : null,
    leaderboard[2] ? { rank: 3 as const, item: leaderboard[2], height: 'h-24 sm:h-28', delay: 0.2 } : null,
  ].filter(Boolean) as Array<{
    rank: 1 | 2 | 3;
    item: (typeof leaderboard)[number];
    height: string;
    delay: number;
  }>;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-md sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="standings-modal-title"
            className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto overscroll-contain rounded-3xl border border-white/20 bg-[#12172e] p-5 text-white shadow-2xl sm:p-7"
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/15 pb-5">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-200">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {t.standingsPrivacyBadge}
                </span>
                <h2
                  id="standings-modal-title"
                  className="mt-2 font-display text-2xl font-extrabold text-white sm:text-3xl"
                >
                  {t.standingsModalTitle}
                </h2>
                <p className="mt-1 text-xs text-slate-300 sm:text-sm">
                  {t.standingsSubtitle}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  {loading ? t.standingsRefreshing : t.standingsRefreshBtn}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t.standingsCloseAria}
                  className="rounded-xl border border-white/15 bg-white/10 p-2 text-slate-200 transition hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* KPIs en vivo */}
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-4">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>{t.standingsTotalVotes}</span>
                  <Users className="h-4 w-4 text-sky-300" />
                </div>
                <p className="mt-1.5 font-mono text-3xl font-extrabold text-white">
                  {totalVotes}
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-4">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>{t.standingsPointsDistributed}</span>
                  <Trophy className="h-4 w-4 text-amber-300" />
                </div>
                <p className="mt-1.5 font-mono text-3xl font-extrabold text-white">
                  {standings?.grand_total_points ?? 0}
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-4">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>{t.standingsConsensusLeader}</span>
                  <Scale className="h-4 w-4 text-emerald-300" />
                </div>
                <p className="mt-1.5 font-mono text-3xl font-extrabold text-emerald-300">
                  {standings?.pedagogical_comparison.borda_winner
                    ? `${standings.pedagogical_comparison.borda_winner.top_k_pct}%`
                    : '0%'}
                </p>
              </div>
            </div>

            {totalVotes === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-white/20 bg-white/[0.03] p-10 text-center text-sm text-slate-300">
                {t.standingsNoVotesYet}
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {/* Podio provisional */}
                {podiumOrder.length > 0 && (
                  <section className="rounded-3xl border border-white/15 bg-black/25 p-5">
                    <div className="mb-5 flex items-center gap-2">
                      <Crown className="h-5 w-5 text-amber-300" />
                      <h3 className="font-display text-lg font-bold text-white">
                        {t.standingsPodiumTitle}
                      </h3>
                    </div>

                    <div className="grid grid-cols-3 items-end gap-2 sm:gap-5">
                      {podiumOrder.map(({ rank, item, height, delay }) => {
                        const title = getTitle(item.movie_id, item.title);
                        return (
                          <motion.div
                            key={item.movie_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay, type: 'spring', stiffness: 190, damping: 20 }}
                            className="flex flex-col items-center text-center"
                          >
                            <div className="relative mb-2.5">
                              <div
                                className="h-20 w-14 overflow-hidden rounded-xl border-2 shadow-xl sm:h-28 sm:w-20"
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
                                  title={title}
                                  posterUrl={item.poster_url}
                                  palette={item.palette}
                                  compact
                                  className="h-full w-full"
                                />
                              </div>
                              <span
                                className={`absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] font-extrabold shadow ${
                                  rank === 1
                                    ? 'bg-amber-400 text-slate-950'
                                    : rank === 2
                                      ? 'bg-slate-200 text-slate-950'
                                      : 'bg-orange-400 text-slate-950'
                                }`}
                              >
                                {t.rankOrdinal(rank)}
                              </span>
                            </div>

                            <p className="line-clamp-2 font-display text-xs font-bold text-white sm:text-sm">
                              {title}
                            </p>

                            <div
                              style={{
                                background: `linear-gradient(180deg, ${hexToRgba(item.palette.primary, 0.55)} 0%, rgba(15,23,42,0.88) 100%)`,
                                borderColor: hexToRgba(item.palette.primary, 0.65),
                              }}
                              className={`mt-2 flex w-full flex-col items-center justify-center rounded-t-2xl border-x border-t px-2 py-2.5 ${height}`}
                            >
                              <Medal className="h-4 w-4 text-amber-200" />
                              <span className="mt-1 font-mono text-sm font-extrabold text-white sm:text-lg">
                                {item.total_points}{' '}
                                {item.total_points === 1 ? t.ptSingular : t.ptPlural}
                              </span>
                              <span className="text-[10px] text-slate-200">
                                {item.borda_share_pct}%
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Comparativa cívica en vivo */}
                {standings?.pedagogical_comparison && (
                  <section className="rounded-3xl border border-white/15 bg-white/[0.04] p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="flex items-center gap-2 font-display text-base font-bold text-white">
                        <Sparkles className="h-4 w-4 text-sky-300" />
                        {t.standingsConsensusTitle}
                      </h3>
                      {standings.pedagogical_comparison.diverged && (
                        <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-200">
                          {t.standingsDivergedBadge}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-rose-400/25 bg-rose-950/20 p-3.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-rose-300">
                          {t.standingsFptpLabel}
                        </p>
                        {standings.pedagogical_comparison.fptp_winner && (
                          <p className="mt-1.5 font-display text-sm font-bold text-white">
                            {getTitle(
                              standings.pedagogical_comparison.fptp_winner.movie_id,
                              standings.pedagogical_comparison.fptp_winner.title
                            )}{' '}
                            <span className="font-mono text-xs text-rose-200">
                              ({standings.pedagogical_comparison.fptp_winner.first_choice_pct}%)
                            </span>
                          </p>
                        )}
                      </div>
                      <div className="rounded-2xl border border-emerald-400/35 bg-emerald-950/20 p-3.5">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                          {t.standingsBordaLabel}
                        </p>
                        {standings.pedagogical_comparison.borda_winner && (
                          <p className="mt-1.5 font-display text-sm font-bold text-white">
                            {getTitle(
                              standings.pedagogical_comparison.borda_winner.movie_id,
                              standings.pedagogical_comparison.borda_winner.title
                            )}{' '}
                            <span className="font-mono text-xs text-emerald-200">
                              ({standings.pedagogical_comparison.borda_winner.total_points}{' '}
                              {t.ptPlural} · TOP {topK}:{' '}
                              {standings.pedagogical_comparison.borda_winner.top_k_pct}%)
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {/* Barras de puntuación y participación por curso */}
                <div className="grid gap-5 lg:grid-cols-2">
                  <section className="rounded-3xl border border-white/15 bg-white/[0.04] p-5">
                    <h3 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-white">
                      <BarChart3 className="h-4 w-4 text-amber-300" />
                      {t.standingsLeaderboardTitle}
                    </h3>
                    <div className="space-y-3">
                      {leaderboard.map((item, idx) => {
                        const widthPct = Math.round((item.total_points / maxPoints) * 100);
                        return (
                          <div key={item.movie_id} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="truncate font-semibold text-white">
                                {idx + 1}. {getTitle(item.movie_id, item.title)}
                              </span>
                              <span className="ml-2 shrink-0 font-mono font-bold text-amber-300">
                                {item.total_points} {t.ptPlural}
                              </span>
                            </div>
                            <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${widthPct}%` }}
                                transition={{ duration: 0.45 }}
                                className="h-full rounded-full"
                                style={{
                                  background: `linear-gradient(90deg, ${item.palette.primary}, ${item.palette.accent})`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section className="rounded-3xl border border-white/15 bg-white/[0.04] p-5">
                    <h3 className="mb-4 flex items-center gap-2 font-display text-base font-bold text-white">
                      <GraduationCap className="h-4 w-4 text-sky-300" />
                      {t.standingsClassParticipationTitle}
                    </h3>
                    <div className="space-y-2.5">
                      {participation.map((cls) => {
                        const barPct = Math.round((cls.count / maxClassVotes) * 100);
                        return (
                          <div key={cls.curso} className="space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="font-semibold text-slate-100">{cls.curso}</span>
                              <span className="font-mono text-slate-300">
                                {t.standingsVotesLabel(cls.count)} ({cls.percentage}%)
                              </span>
                            </div>
                            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${barPct}%` }}
                                transition={{ duration: 0.45 }}
                                className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-400"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
