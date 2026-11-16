import { motion } from 'framer-motion';
import { Clock, Expand, Sparkles } from 'lucide-react';
import type { Movie, ScoringMode } from '../types/cinema';
import { formatDuration, formatPointsLabel, getBordaPoints, getRankMedal } from '../utils/borda';
import { hexToRgba } from '../utils/colorExtractor';
import { MoviePoster } from './MoviePoster';

interface MovieCardProps {
  movie: Movie;
  topK: 3 | 5;
  scoringMode: ScoringMode;
  assignedRank: number | null; // 1-indexed o null
  onAssignRank: (movieId: string, rank: number) => void;
  onInspectMovie: (movie: Movie) => void;
  onHoverMovie?: (movie: Movie | null) => void;
  disabled?: boolean;
}

export function MovieCard({
  movie,
  topK,
  scoringMode,
  assignedRank,
  onAssignRank,
  onInspectMovie,
  onHoverMovie,
  disabled = false,
}: MovieCardProps) {
  const medal = assignedRank ? getRankMedal(assignedRank) : null;
  const ranks = Array.from({ length: topK }, (_, i) => i + 1);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      onMouseEnter={() => onHoverMovie?.(movie)}
      onMouseLeave={() => onHoverMovie?.(null)}
      className="group relative flex flex-col overflow-hidden rounded-2xl border bg-[#0d101b]/90 backdrop-blur-md transition-all duration-300"
      style={{
        borderColor: assignedRank
          ? hexToRgba(movie.palette.primary, 0.75)
          : 'rgba(255, 255, 255, 0.1)',
        boxShadow: assignedRank
          ? `0 16px 40px -12px ${hexToRgba(movie.palette.primary, 0.45)}`
          : '0 10px 30px -15px rgba(0, 0, 0, 0.7)',
      }}
    >
      {/* Halo dinámico superior según paleta de la película */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1.5 opacity-90 transition-opacity"
        style={{
          background: `linear-gradient(90deg, ${movie.palette.primary}, ${movie.palette.secondary}, ${movie.palette.accent})`,
        }}
      />

      <div className="flex flex-1 gap-4 p-4">
        {/* Póster */}
        <button
          type="button"
          onClick={() => onInspectMovie(movie)}
          aria-label={`Ver ficha completa de ${movie.title}`}
          className="relative h-44 w-28 shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-lg transition duration-300 group-hover:scale-[1.02] sm:h-48 sm:w-32"
        >
          <MoviePoster
            title={movie.title}
            year={movie.year}
            posterUrl={movie.poster_url}
            palette={movie.palette}
            className="h-full w-full"
          />
          <span className="absolute left-2 top-2 rounded-md border border-white/20 bg-black/70 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white backdrop-blur-sm">
            {movie.age_rating}
          </span>
          <span className="absolute bottom-2 right-2 rounded-lg bg-black/65 p-1.5 text-white/80 opacity-0 transition group-hover:opacity-100">
            <Expand className="h-3.5 w-3.5" />
          </span>
        </button>

        {/* Info y metadatos */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-display text-lg font-bold leading-snug text-white sm:text-xl">
                {movie.title}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400">
                {movie.year && <span className="font-mono">{movie.year}</span>}
                {movie.duration_minutes && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(movie.duration_minutes)}
                  </span>
                )}
                {movie.genres.slice(0, 2).map((genre) => (
                  <span
                    key={genre}
                    className="rounded-md bg-white/5 px-1.5 py-0.5 text-[11px] text-slate-300"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>

            {medal && assignedRank && (
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${medal.badgeClass}`}
              >
                <span>{medal.emoji}</span>
                <span>
                  {formatPointsLabel(getBordaPoints(assignedRank, topK, scoringMode))}
                </span>
              </span>
            )}
          </div>

          <p className="mt-2.5 line-clamp-3 text-xs leading-relaxed text-slate-300 sm:text-sm">
            {movie.synopsis}
          </p>

          {/* Etiquetas temáticas */}
          {movie.tags.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {movie.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
                  style={{
                    borderColor: hexToRgba(movie.palette.accent, 0.35),
                    backgroundColor: hexToRgba(movie.palette.accent, 0.1),
                    color: '#f8fafc',
                  }}
                >
                  <Sparkles className="h-2.5 w-2.5 opacity-80" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => onInspectMovie(movie)}
            className="mt-2 self-start text-[11px] font-semibold text-sky-300 underline-offset-2 hover:underline"
          >
            Ver ficha completa
          </button>
        </div>
      </div>

      {/* Selector táctil directo 1º, 2º, 3º... */}
      <div className="border-t border-white/10 bg-black/30 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-slate-400">
            {assignedRank
              ? `Tu ${assignedRank}ª preferencia (pulsa para cambiar o quitar)`
              : 'Elige su posición en tu TOP:'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {ranks.map((rank) => {
              const isSelected = assignedRank === rank;
              const pts = getBordaPoints(rank, topK, scoringMode);
              return (
                <button
                  key={rank}
                  type="button"
                  disabled={disabled}
                  onClick={() => onAssignRank(movie.id, rank)}
                  aria-pressed={isSelected}
                  className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition active:scale-95 disabled:opacity-50 ${
                    isSelected
                      ? 'text-slate-950 shadow-md'
                      : 'border-white/15 bg-white/5 text-slate-200 hover:border-white/30 hover:bg-white/10'
                  }`}
                  style={
                    isSelected
                      ? {
                          backgroundColor: movie.palette.accent,
                          borderColor: movie.palette.accent,
                        }
                      : undefined
                  }
                >
                  <span>{rank}º</span>
                  <span
                    className={`font-mono text-[10px] ${
                      isSelected ? 'text-slate-900/80' : 'text-slate-400'
                    }`}
                  >
                    ({pts}p)
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.article>
  );
}
