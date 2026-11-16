import { Reorder } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  RotateCcw,
  Ticket,
  Trash2,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { getLocalizedMovie } from '../i18n/translations';
import type { Movie, ScoringMode } from '../types/cinema';
import { formatPointsLabel, getBordaPoints, getRankMedal } from '../utils/borda';
import { hexToRgba } from '../utils/colorExtractor';
import { MoviePoster } from './MoviePoster';

interface RankingDockProps {
  rankedMovies: Movie[];
  topK: 3 | 5;
  scoringMode: ScoringMode;
  votingOpen: boolean;
  onReorder: (newOrder: Movie[]) => void;
  onMoveStep: (index: number, delta: -1 | 1) => void;
  onRemove: (movieId: string) => void;
  onClearAll: () => void;
  onConfirmOrder: () => void;
}

export function RankingDock({
  rankedMovies,
  topK,
  scoringMode,
  votingOpen,
  onReorder,
  onMoveStep,
  onRemove,
  onClearAll,
  onConfirmOrder,
}: RankingDockProps) {
  const { lang, t } = useI18n();
  const isComplete = rankedMovies.length === topK;
  const emptySlotsCount = Math.max(0, topK - rankedMovies.length);

  return (
    <aside
      aria-label={t.dockTitle}
      className="cinema-marquee rounded-3xl border border-white/20 bg-gradient-to-b from-[#1e264a]/95 to-[#161c38]/95 p-5 shadow-2xl backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
            <Ticket className="h-3.5 w-3.5" />
            {t.dockTopPrefix(topK)}
          </span>
          <h2 className="mt-1 font-display text-xl font-extrabold text-white">
            {t.dockTitle}
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            {t.dockSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-xl border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-xs font-bold text-white">
            {rankedMovies.length} / {topK}
          </span>
          {rankedMovies.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              title={t.clearSelectionAria}
              aria-label={t.clearSelectionAria}
              className="rounded-xl border border-white/10 bg-white/5 p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Lista arrastrable con Framer Motion Reorder */}
      <div className="mt-4 space-y-2.5">
        {rankedMovies.length > 0 && (
          <Reorder.Group
            axis="y"
            values={rankedMovies}
            onReorder={onReorder}
            className="space-y-2.5"
          >
            {rankedMovies.map((movie, index) => {
              const rank = index + 1;
              const pts = getBordaPoints(rank, topK, scoringMode);
              const medal = getRankMedal(rank);
              const localized = getLocalizedMovie(movie, lang);

              return (
                <Reorder.Item
                  key={movie.id}
                  value={movie}
                  className="flex cursor-grab items-center gap-2.5 rounded-2xl border bg-white/[0.04] p-2.5 active:cursor-grabbing"
                  style={{
                    borderColor: hexToRgba(movie.palette.primary, 0.5),
                    boxShadow: `0 6px 20px -12px ${hexToRgba(movie.palette.primary, 0.6)}`,
                  }}
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-slate-500" />

                  <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-xl bg-black/45">
                    <span className="text-sm leading-none">{medal.emoji}</span>
                    <span className="mt-0.5 font-mono text-[10px] font-bold text-amber-300">
                      {formatPointsLabel(pts)}
                    </span>
                  </div>

                  <div className="h-12 w-8 shrink-0 overflow-hidden rounded-lg border border-white/10">
                    <MoviePoster
                      title={localized.title}
                      posterUrl={movie.poster_url}
                      palette={movie.palette}
                      compact
                      className="h-full w-full"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">{localized.title}</p>
                    <p className="text-[11px] text-slate-400">
                      {t.rankOptionLabel(rank)} · {formatPointsLabel(pts)}
                    </p>
                  </div>

                  {/* Controles accesibles ↑ ↓ y eliminar */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => onMoveStep(index, -1)}
                      aria-label={`Subir ${movie.title}`}
                      className="rounded-lg border border-white/10 bg-white/5 p-1 text-slate-300 transition hover:bg-white/15 disabled:opacity-25"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === rankedMovies.length - 1}
                      onClick={() => onMoveStep(index, 1)}
                      aria-label={`Bajar ${movie.title}`}
                      className="rounded-lg border border-white/10 bg-white/5 p-1 text-slate-300 transition hover:bg-white/15 disabled:opacity-25"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemove(movie.id)}
                      aria-label={`Quitar ${movie.title}`}
                      className="rounded-lg border border-white/10 bg-white/5 p-1 text-rose-300 transition hover:bg-rose-500/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Reorder.Item>
              );
            })}
          </Reorder.Group>
        )}

        {/* Huecos restantes por rellenar */}
        {Array.from({ length: emptySlotsCount }, (_, idx) => {
          const slotRank = rankedMovies.length + idx + 1;
          const pts = getBordaPoints(slotRank, topK, scoringMode);
          return (
            <div
              key={`empty-${slotRank}`}
              className="flex items-center justify-between rounded-2xl border border-dashed border-white/15 bg-black/25 px-3.5 py-3 text-xs text-slate-400"
            >
              <span>
                <strong className="text-slate-200">{t.emptySlotLabel(slotRank)}</strong>
              </span>
              <span className="font-mono text-[11px] text-slate-500">
                +{formatPointsLabel(pts)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Botón CTA */}
      <div className="mt-5">
        <button
          type="button"
          disabled={!isComplete || !votingOpen}
          onClick={onConfirmOrder}
          className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3.5 font-display text-sm font-extrabold text-slate-950 shadow-xl transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
          style={{
            background: isComplete
              ? 'linear-gradient(135deg, var(--theme-accent), var(--theme-primary))'
              : 'rgba(255, 255, 255, 0.12)',
            color: isComplete ? '#09090f' : '#94a3b8',
          }}
        >
          <Ticket className="h-4 w-4" />
          {!votingOpen
            ? t.closedByAdmin
            : isComplete
              ? t.reviewTicketBtn
              : t.pickMoreMovies(emptySlotsCount)}
        </button>
      </div>
    </aside>
  );
}
