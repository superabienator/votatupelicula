import { motion } from 'framer-motion';
import {
  AlertTriangle,
  BarChart3,
  Check,
  ClipboardCheck,
  Crown,
  Download,
  Edit3,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Fingerprint,
  GraduationCap,
  Medal,
  RefreshCw,
  RotateCcw,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { getLocalizedMovie } from '../i18n/translations';
import type { DashboardResults, Movie, VoteLogEntry } from '../types/cinema';
import { computeVoteAuditHash } from '../utils/auditHash';
import { hexToRgba } from '../utils/colorExtractor';
import { useEscapeKey } from '../utils/useEscapeKey';
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
  onSubModalOpenChange?: (open: boolean) => void;
}

function maskNamePart(value: string): string {
  const clean = value.trim();
  if (!clean) return '***';
  return clean
    .split(/\s+/)
    .map((w) => (w.length <= 1 ? '*' : `${w[0]}${'*'.repeat(Math.min(4, w.length - 1))}`))
    .join(' ');
}

function maskEmailAddress(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return '***';
  const [local, domain] = parts;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

function escapeCsvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

function formatReadableName(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ');
}

export function ResultsDashboard({
  results,
  movies,
  loading,
  onRefresh,
  onResetVotes,
  onDeleteVote,
  onUpdateVote,
  onSubModalOpenChange,
}: ResultsDashboardProps) {
  const { lang, t } = useI18n();
  const tx = t.adminExtra;
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [confirmDeleteVoteId, setConfirmDeleteVoteId] = useState<string | null>(null);
  const [censusModalOpen, setCensusModalOpen] = useState(false);
  const [censusClassFilter, setCensusClassFilter] = useState<string>('ALL');
  const [censusIncludeEmail, setCensusIncludeEmail] = useState(false);
  const [censusCopied, setCensusCopied] = useState(false);
  const [voteSearch, setVoteSearch] = useState('');
  const [showIdentities, setShowIdentities] = useState(false);
  const [editingVote, setEditingVote] = useState<VoteLogEntry | null>(null);
  const [editCurso, setEditCurso] = useState('');
  const [editMovieIds, setEditMovieIds] = useState<string[]>([]);
  const [voteEditError, setVoteEditError] = useState<string | null>(null);

  const hasSubModal = Boolean(
    confirmResetOpen || editingVote || confirmDeleteVoteId || censusModalOpen
  );
  useEffect(() => {
    onSubModalOpenChange?.(hasSubModal);
  }, [hasSubModal, onSubModalOpenChange]);

  useEscapeKey(confirmResetOpen, () => setConfirmResetOpen(false));
  useEscapeKey(Boolean(confirmDeleteVoteId), () => setConfirmDeleteVoteId(null));
  useEscapeKey(Boolean(editingVote), () => setEditingVote(null));
  useEscapeKey(censusModalOpen, () => setCensusModalOpen(false));

  const movieById = new Map(movies.map((m) => [m.id, m]));
  const resolveTitle = (movieId: string, fallbackTitle: string) => {
    const m = movieById.get(movieId);
    return m ? getLocalizedMovie(m, lang).title : fallbackTitle;
  };

  if (!results) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-sm text-slate-400">
        {loading ? tx.resultsCalcLoading : tx.resultsNoData}
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
            {tx.resultsTitle}
          </h3>
          <p className="text-xs text-slate-400">
            {tx.resultsSubtitle(settings.top_k, settings.scoring_mode === 'classic')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setCensusCopied(false);
              setCensusModalOpen(true);
            }}
            disabled={loading || total_votes === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-3.5 py-2 text-xs font-bold text-emerald-200 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            {tx.censusBtn}
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? t.standingsRefreshing : tx.resultsRefreshBtn}
          </button>

          <button
            type="button"
            onClick={() => setConfirmResetOpen(true)}
            disabled={loading || total_votes === 0}
            className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/35 bg-rose-500/15 px-3.5 py-2 text-xs font-bold text-rose-200 transition hover:bg-rose-500/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {tx.resultsResetBtn}
          </button>
        </div>
      </div>

      {/* KPIs superiores */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{tx.resultsTotalVotesLabel}</span>
            <Users className="h-4 w-4 text-sky-400" />
          </div>
          <p className="mt-2 font-mono text-3xl font-extrabold text-white">{total_votes}</p>
          <p className="mt-0.5 text-[11px] text-slate-400">{tx.resultsOtpVerified}</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{tx.resultsBordaPointsLabel}</span>
            <Trophy className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 font-mono text-3xl font-extrabold text-white">
            {grand_total_points}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {tx.resultsMoviesCount(leaderboard.length)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{tx.resultsLeaderConsensusLabel}</span>
            <Scale className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 font-mono text-3xl font-extrabold text-emerald-300">
            {pedagogical_comparison.borda_winner
              ? `${pedagogical_comparison.borda_winner.top_k_pct}%`
              : '0%'}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {tx.resultsTopKPresence(settings.top_k)}
          </p>
        </div>
      </div>

      {/* 1. PODIO INTERACTIVO */}
      {podiumOrder.length > 0 && (
        <section className="overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.04] to-black/30 p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-400" />
            <h4 className="font-display text-lg font-bold text-white">
              {tx.resultsPodiumTitle}
            </h4>
          </div>

          <div className="grid grid-cols-3 items-end gap-2 sm:gap-5">
            {podiumOrder.map(({ rank, item, height, delay }) => {
              const title = resolveTitle(item.movie_id, item.title);
              return (
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
                        title={title}
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
                      {t.rankOrdinal(rank)}
                    </span>
                  </div>

                  <p className="line-clamp-2 font-display text-xs font-bold text-white sm:text-sm">
                    {title}
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
                      {item.total_points} {item.total_points === 1 ? t.ptSingular : t.ptPlural}
                    </span>
                    <span className="text-[10px] text-slate-300 sm:text-xs">
                      {tx.resultsPercentOfTotal(item.borda_share_pct)}
                    </span>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. DESGLOSE DE CONSENSO PEDAGÓGICO (1ª opción vs TOP K) */}
      <section className="rounded-3xl border border-white/15 bg-[#10162c] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-sky-400" />
            <h4 className="font-display text-lg font-bold text-white">
              {tx.resultsPedagogicalTitle}
            </h4>
          </div>
          {pedagogical_comparison.diverged && (
            <span className="rounded-full border border-amber-400/40 bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-300">
              {tx.resultsDivergenceBadge}
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

        {/* Comparativa gráfica 1ª Opción vs Presencia en TOP */}
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-rose-400/25 bg-rose-950/15 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-300">
              {tx.resultsFptpCardLabel}
            </p>
            {pedagogical_comparison.fptp_winner ? (
              <div className="mt-3 flex items-center gap-3">
                <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg border border-white/15">
                  <MoviePoster
                    title={resolveTitle(
                      pedagogical_comparison.fptp_winner.movie_id,
                      pedagogical_comparison.fptp_winner.title
                    )}
                    posterUrl={pedagogical_comparison.fptp_winner.poster_url}
                    palette={pedagogical_comparison.fptp_winner.palette}
                    compact
                    className="h-full w-full"
                  />
                </div>
                <div>
                  <p className="font-display font-bold text-white">
                    {resolveTitle(
                      pedagogical_comparison.fptp_winner.movie_id,
                      pedagogical_comparison.fptp_winner.title
                    )}
                  </p>
                  <p className="font-mono text-xs text-rose-200">
                    {tx.resultsFirstChoiceVotes(
                      pedagogical_comparison.fptp_winner.first_choice_votes,
                      pedagogical_comparison.fptp_winner.first_choice_pct
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {tx.resultsPresenceInTop(
                      settings.top_k,
                      pedagogical_comparison.fptp_winner.top_k_pct
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-400">{tx.resultsNoDataShort}</p>
            )}
          </div>

          <div className="rounded-2xl border border-emerald-400/35 bg-emerald-950/15 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
              {tx.resultsBordaCardLabel(settings.top_k)}
            </p>
            {pedagogical_comparison.borda_winner ? (
              <div className="mt-3 flex items-center gap-3">
                <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg border border-white/15">
                  <MoviePoster
                    title={resolveTitle(
                      pedagogical_comparison.borda_winner.movie_id,
                      pedagogical_comparison.borda_winner.title
                    )}
                    posterUrl={pedagogical_comparison.borda_winner.poster_url}
                    palette={pedagogical_comparison.borda_winner.palette}
                    compact
                    className="h-full w-full"
                  />
                </div>
                <div>
                  <p className="font-display font-bold text-white">
                    {resolveTitle(
                      pedagogical_comparison.borda_winner.movie_id,
                      pedagogical_comparison.borda_winner.title
                    )}
                  </p>
                  <p className="font-mono text-xs text-emerald-200">
                    {tx.resultsBordaWinnerStats(
                      pedagogical_comparison.borda_winner.total_points,
                      settings.top_k,
                      pedagogical_comparison.borda_winner.top_k_pct
                    )}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {tx.resultsVotesAsFirst(
                      pedagogical_comparison.borda_winner.first_choice_votes,
                      pedagogical_comparison.borda_winner.first_choice_pct
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-400">{tx.resultsNoDataShort}</p>
            )}
          </div>
        </div>

        {/* Gráfico comparativo doble por película */}
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              {tx.resultsLegendFirst}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              {tx.resultsLegendTopK(settings.top_k)}
            </span>
          </div>

          {leaderboard.map((item) => (
            <div key={`cmp-${item.movie_id}`} className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-white">
                  {resolveTitle(item.movie_id, item.title)}
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  {t.rankOrdinal(1)}: {item.first_choice_pct}% · TOP {settings.top_k}:{' '}
                  {item.top_k_pct}%
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
        <section className="rounded-3xl border border-white/15 bg-white/[0.02] p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-amber-400" />
            <h4 className="font-display text-base font-bold text-white">
              {tx.resultsWeightedTitle}
            </h4>
          </div>
          <div className="space-y-3.5">
            {leaderboard.map((item, idx) => {
              const widthPct = Math.round((item.total_points / maxPoints) * 100);
              return (
                <div key={item.movie_id} className="space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="truncate font-semibold text-white">
                      {idx + 1}. {resolveTitle(item.movie_id, item.title)}
                    </span>
                    <span className="shrink-0 font-mono font-bold text-amber-300">
                      {item.total_points}{' '}
                      {item.total_points === 1 ? t.ptSingular : t.ptPlural}
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
                        {t.rankOrdinal(pos)}: {item.rank_breakdown[pos] ?? 0}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-white/15 bg-white/[0.02] p-5">
          <div className="mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-sky-400" />
            <h4 className="font-display text-base font-bold text-white">
              {tx.resultsClassTitle}
            </h4>
          </div>
          <div className="space-y-3">
            {participation_by_class.map((cls) => {
              const barPct = Math.round((cls.count / maxClassVotes) * 100);
              return (
                <div key={cls.curso} className="space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-200">{cls.curso}</span>
                    <span className="font-mono text-slate-300">
                      {t.standingsVotesLabel(cls.count)} ({cls.percentage}%)
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
              {tx.resultsVotesLogTitle(results.votes_log?.length ?? 0)}
            </h4>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              {showIdentities ? t.identitiesMaskedNotice : t.maskedSearchHint}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowIdentities((prev) => !prev)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10"
            >
              {showIdentities ? (
                <>
                  <EyeOff className="h-3.5 w-3.5 text-amber-300" />
                  {t.hideIdentitiesBtn}
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5 text-sky-300" />
                  {t.showIdentitiesBtn}
                </>
              )}
            </button>
            <div className="relative w-full sm:w-60">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="search"
                aria-label={tx.resultsSearchAria}
                value={voteSearch}
                onChange={(e) => setVoteSearch(e.target.value)}
                placeholder={showIdentities ? tx.resultsSearchPh : tx.resultsSearchMaskedPh}
                className="w-full rounded-xl border border-white/15 bg-black/40 py-2 pl-8 pr-3 text-xs text-white placeholder:text-slate-400 focus:border-sky-400"
              />
            </div>
          </div>
        </div>

        {!results.votes_log || results.votes_log.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-400">
            {tx.resultsEmptyBallotBox}
          </p>
        ) : (
          <div className="mt-4 space-y-2.5">
            {results.votes_log
              .filter((v) => {
                const q = voteSearch.trim().toLowerCase();
                if (!q) return true;
                const matchPublicFields =
                  v.curso.toLowerCase().includes(q) ||
                  v.choices.some((ch) =>
                    resolveTitle(ch.movie_id, ch.title).toLowerCase().includes(q)
                  );
                if (!showIdentities) return matchPublicFields;
                return (
                  matchPublicFields ||
                  v.nombre.toLowerCase().includes(q) ||
                  v.apellidos.toLowerCase().includes(q) ||
                  v.email.toLowerCase().includes(q)
                );
              })
              .map((vote) => (
                <div
                  key={vote.id}
                  className="cv-auto flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-black/30 p-3.5 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-sm font-bold capitalize text-white">
                        {showIdentities
                          ? `${vote.nombre} ${vote.apellidos}`
                          : `${maskNamePart(vote.nombre)} ${maskNamePart(vote.apellidos)}`}
                      </span>
                      <span className="rounded-lg bg-sky-500/20 px-2 py-0.5 text-[11px] font-bold text-sky-300">
                        {vote.curso}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {showIdentities ? vote.email : maskEmailAddress(vote.email)}
                      </span>
                      <span
                        title={tx.censusColAuditHash}
                        className="inline-flex items-center gap-1 rounded-md border border-indigo-400/25 bg-indigo-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-indigo-200"
                      >
                        <Fingerprint className="h-3 w-3 text-indigo-300" />
                        {vote.audit_hash || computeVoteAuditHash(vote.id, vote.curso)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-300">
                      {vote.choices.map((ch) => (
                        <span
                          key={ch.rank_position}
                          className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5"
                        >
                          <strong className="text-amber-300">
                            {t.rankOrdinal(ch.rank_position)}
                          </strong>{' '}
                          {resolveTitle(ch.movie_id, ch.title)}
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
                      {tx.resultsEditVoteBtn}
                    </button>
                    {confirmDeleteVoteId === vote.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={async () => {
                            setConfirmDeleteVoteId(null);
                            await onDeleteVote(vote.id);
                          }}
                          className="rounded-xl bg-rose-600 px-2.5 py-1.5 text-xs font-extrabold text-white hover:bg-rose-500"
                        >
                          {tx.resultsDeleteVoteBtn}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteVoteId(null)}
                          className="rounded-xl border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10"
                        >
                          {t.cancelBtn}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteVoteId(vote.id)}
                        className="inline-flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-200 hover:bg-rose-500/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {tx.resultsDeleteVoteBtn}
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>

      {/* Modal de confirmación para Vaciar Urna a cero */}
      {confirmResetOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setConfirmResetOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-ballot-title"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto overscroll-contain rounded-3xl border border-rose-500/40 bg-[#181224] p-6 shadow-2xl"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-300">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <h4 id="reset-ballot-title" className="font-display text-lg font-extrabold text-white">
                  {tx.resultsConfirmResetTitle}
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-slate-300">
                  {tx.resultsConfirmResetBody(total_votes)}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/10"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmResetOpen(false);
                  await onResetVotes();
                }}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-rose-500"
              >
                {tx.resultsConfirmResetBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal gráfico para modificar un voto concreto */}
      {editingVote && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setEditingVote(null)}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-vote-title"
            onClick={(e) => e.stopPropagation()}
            onSubmit={async (e) => {
              e.preventDefault();
              if (new Set(editMovieIds).size !== editMovieIds.length) {
                setVoteEditError(tx.resultsDuplicateMovieErr);
                return;
              }
              setVoteEditError(null);
              await onUpdateVote(editingVote.id, {
                curso: editCurso,
                ranked_movie_ids: editMovieIds,
              });
              setEditingVote(null);
            }}
            className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto overscroll-contain rounded-3xl border border-white/20 bg-[#12172e] p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h4 id="edit-vote-title" className="font-display text-lg font-bold capitalize text-white">
                {tx.resultsEditVoteModalTitle(
                  showIdentities
                    ? `${editingVote.nombre} ${editingVote.apellidos}`
                    : `${maskNamePart(editingVote.nombre)} ${maskNamePart(editingVote.apellidos)}`
                )}
              </h4>
              <button
                type="button"
                aria-label={t.closeBtn}
                onClick={() => setEditingVote(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label
                htmlFor="edit-vote-curso"
                className="mb-1 block text-xs font-semibold text-slate-300"
              >
                {tx.resultsCourseLabel}
              </label>
              <select
                id="edit-vote-curso"
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
                {tx.resultsChosenOrderLabel}
              </p>
              {editMovieIds.map((movieId, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <label
                    htmlFor={`edit-vote-movie-${idx}`}
                    className="w-10 font-mono text-xs font-bold text-amber-300"
                  >
                    {t.rankOrdinal(idx + 1)}
                  </label>
                  <select
                    id={`edit-vote-movie-${idx}`}
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
                          {getLocalizedMovie(m, lang).title}
                        </option>
                      ))}
                  </select>
                </div>
              ))}
            </div>

            {voteEditError && (
              <p
                role="alert"
                className="rounded-xl border border-rose-500/40 bg-rose-500/15 p-2.5 text-xs text-rose-200"
              >
                {voteEditError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingVote(null)}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300"
              >
                {t.cancelBtn}
              </button>
              <button
                type="submit"
                className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-extrabold text-slate-950 hover:bg-emerald-300"
              >
                {tx.resultsSaveVoteChangesBtn}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal generador de lista de censo (Nombres y Apellidos para el colegio, sin sentido del voto) */}
      {censusModalOpen && (() => {
        const sortedRoster = [...(results.votes_log ?? [])]
          .filter((v) => censusClassFilter === 'ALL' || v.curso === censusClassFilter)
          .sort((a, b) => {
            const cCmp = a.curso.localeCompare(b.curso, 'es');
            if (cCmp !== 0) return cCmp;
            const aCmp = a.apellidos.localeCompare(b.apellidos, 'es');
            if (aCmp !== 0) return aCmp;
            return a.nombre.localeCompare(b.nombre, 'es');
          });

        const handleDownloadCsv = () => {
          const headers = [
            tx.censusColIndex,
            tx.censusColApellidos,
            tx.censusColNombre,
            tx.censusColCurso,
            ...(censusIncludeEmail ? [tx.censusColEmail] : []),
            tx.censusColAuditHash,
            tx.censusColTimestamp,
          ];
          const rows = sortedRoster.map((v, idx) => [
            String(idx + 1),
            formatReadableName(v.apellidos),
            formatReadableName(v.nombre),
            v.curso,
            ...(censusIncludeEmail ? [v.email] : []),
            v.audit_hash || computeVoteAuditHash(v.id, v.curso),
            new Date(v.created_at).toLocaleString(),
          ]);
          const csvBody =
            '\uFEFF' +
            [headers, ...rows]
              .map((line) => line.map((cell) => escapeCsvCell(cell)).join(';'))
              .join('\r\n');
          const blob = new Blob([csvBody], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const dateTag = new Date().toISOString().slice(0, 10);
          link.download = `censo-votantes-${dateTag}.csv`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        };

        const handleCopyRoster = async () => {
          const lines = sortedRoster.map((v, idx) => {
            const auditHash = v.audit_hash || computeVoteAuditHash(v.id, v.curso);
            const base = `${idx + 1}. ${formatReadableName(v.apellidos)}, ${formatReadableName(v.nombre)} — ${v.curso} [${auditHash}]`;
            return censusIncludeEmail ? `${base} (${v.email})` : base;
          });
          await navigator.clipboard?.writeText(lines.join('\n')).catch(() => {});
          setCensusCopied(true);
          window.setTimeout(() => setCensusCopied(false), 2500);
        };

        return (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setCensusModalOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="census-modal-title"
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-emerald-400/30 bg-[#12172e] text-white shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-black/25 p-5">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-200">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {tx.censusPrivacyBadge}
                  </span>
                  <h4
                    id="census-modal-title"
                    className="mt-1.5 font-display text-lg font-extrabold text-white"
                  >
                    {tx.censusModalTitle}
                  </h4>
                  <p className="mt-0.5 text-xs text-slate-300">{tx.censusModalDesc}</p>
                </div>
                <button
                  type="button"
                  aria-label={t.closeBtn}
                  onClick={() => setCensusModalOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    aria-label={tx.resultsCourseLabel}
                    value={censusClassFilter}
                    onChange={(e) => setCensusClassFilter(e.target.value)}
                    className="rounded-xl border border-white/15 bg-[#090c16] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    <option value="ALL">{tx.censusFilterAllClasses}</option>
                    {settings.allowed_classes.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>

                  <label className="inline-flex cursor-pointer items-center gap-2 text-slate-200">
                    <input
                      type="checkbox"
                      checked={censusIncludeEmail}
                      onChange={(e) => setCensusIncludeEmail(e.target.checked)}
                      className="h-4 w-4 rounded border-white/30 bg-black/50 accent-emerald-400"
                    />
                    <span>{tx.censusIncludeEmailLabel}</span>
                  </label>
                </div>

                <span className="font-mono font-bold text-emerald-300">
                  {tx.censusTotalCount(sortedRoster.length)}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain p-5">
                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/25">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-white/10 bg-white/[0.04] text-[11px] uppercase tracking-wider text-slate-300">
                      <tr>
                        <th className="px-3 py-2.5">{tx.censusColIndex}</th>
                        <th className="px-3 py-2.5">{tx.censusColApellidos}</th>
                        <th className="px-3 py-2.5">{tx.censusColNombre}</th>
                        <th className="px-3 py-2.5">{tx.censusColCurso}</th>
                        {censusIncludeEmail && (
                          <th className="px-3 py-2.5">{tx.censusColEmail}</th>
                        )}
                        <th className="px-3 py-2.5">{tx.censusColAuditHash}</th>
                        <th className="px-3 py-2.5">{tx.censusColTimestamp}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {sortedRoster.map((v, idx) => (
                        <tr key={v.id} className="hover:bg-white/[0.03]">
                          <td className="px-3 py-2 font-mono text-slate-400">{idx + 1}</td>
                          <td className="px-3 py-2 font-semibold text-white">
                            {formatReadableName(v.apellidos)}
                          </td>
                          <td className="px-3 py-2 text-slate-100">
                            {formatReadableName(v.nombre)}
                          </td>
                          <td className="px-3 py-2">
                            <span className="rounded-md bg-sky-500/20 px-2 py-0.5 font-mono text-[11px] font-bold text-sky-300">
                              {v.curso}
                            </span>
                          </td>
                          {censusIncludeEmail && (
                            <td className="px-3 py-2 font-mono text-[11px] text-slate-300">
                              {v.email}
                            </td>
                          )}
                          <td className="px-3 py-2 font-mono text-[11px] font-bold text-indigo-200">
                            {v.audit_hash || computeVoteAuditHash(v.id, v.curso)}
                          </td>
                          <td className="px-3 py-2 font-mono text-[11px] text-slate-400">
                            {new Date(v.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 bg-black/25 px-5 py-3.5">
                <button
                  type="button"
                  onClick={() => setCensusModalOpen(false)}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10"
                >
                  {t.closeBtn}
                </button>
                <button
                  type="button"
                  onClick={handleCopyRoster}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/35 bg-sky-500/15 px-4 py-2 text-xs font-bold text-sky-100 hover:bg-sky-500/25"
                >
                  {censusCopied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-300" />
                      {tx.censusCopiedBtn}
                    </>
                  ) : (
                    <>
                      <ClipboardCheck className="h-3.5 w-3.5" />
                      {tx.censusCopyListBtn}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-extrabold text-slate-950 hover:bg-emerald-300"
                >
                  <Download className="h-3.5 w-3.5" />
                  {tx.censusDownloadCsvBtn}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
