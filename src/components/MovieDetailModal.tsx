import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Film, ShieldCheck, X } from 'lucide-react';
import type { Movie, ScoringMode } from '../types/cinema';
import { formatDuration, getBordaPoints } from '../utils/borda';
import { hexToRgba } from '../utils/colorExtractor';
import { useEscapeKey } from '../utils/useEscapeKey';
import { MoviePoster } from './MoviePoster';

interface MovieDetailModalProps {
  movie: Movie | null;
  topK: 3 | 5;
  scoringMode: ScoringMode;
  assignedRank: number | null;
  onAssignRank: (movieId: string, rank: number) => void;
  onClose: () => void;
}

export function MovieDetailModal({
  movie,
  topK,
  scoringMode,
  assignedRank,
  onAssignRank,
  onClose,
}: MovieDetailModalProps) {
  useEscapeKey(Boolean(movie), onClose);
  return (
    <AnimatePresence>
      {movie && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/15 bg-[#0d101b] shadow-2xl"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera Backdrop */}
            <div className="relative h-48 w-full overflow-hidden sm:h-60">
              {movie.backdrop_url ? (
                <img
                  src={movie.backdrop_url}
                  alt={movie.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="h-full w-full"
                  style={{
                    background: `linear-gradient(135deg, ${movie.palette.primary}, ${movie.palette.secondary})`,
                  }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d101b] via-[#0d101b]/55 to-transparent" />
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar ficha"
                className="absolute right-4 top-4 rounded-xl border border-white/15 bg-black/55 p-2 text-white backdrop-blur-md transition hover:bg-black/80"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="-mt-16 relative px-6 pb-6">
              <div className="flex flex-col gap-5 sm:flex-row">
                <div className="h-48 w-32 shrink-0 overflow-hidden rounded-2xl border border-white/20 shadow-2xl">
                  <MoviePoster
                    title={movie.title}
                    year={movie.year}
                    posterUrl={movie.poster_url}
                    palette={movie.palette}
                    className="h-full w-full"
                  />
                </div>

                <div className="pt-2 sm:pt-14">
                  <h2 className="font-display text-2xl font-extrabold text-white">
                    {movie.title}
                  </h2>
                  {movie.original_title && movie.original_title !== movie.title && (
                    <p className="text-xs italic text-slate-400">
                      Título original: {movie.original_title}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    {movie.year && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 font-mono text-slate-200">
                        <Film className="h-3.5 w-3.5" />
                        {movie.year}
                      </span>
                    )}
                    {movie.duration_minutes && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-slate-200">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDuration(movie.duration_minutes)}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-lg border border-amber-400/30 bg-amber-400/15 px-2 py-1 font-mono font-bold text-amber-300">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {movie.age_rating}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Sinopsis para CineFórum
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-200">
                    {movie.synopsis}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {movie.genres.map((g) => (
                    <span
                      key={g}
                      className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-200"
                    >
                      {g}
                    </span>
                  ))}
                  {movie.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full px-2.5 py-1 text-xs font-semibold text-white"
                      style={{
                        backgroundColor: hexToRgba(movie.palette.primary, 0.22),
                        border: `1px solid ${hexToRgba(movie.palette.primary, 0.45)}`,
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Botonera rápida de voto */}
                <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
                  <p className="mb-2.5 text-xs font-semibold text-slate-300">
                    Asignar posición en tu TOP {topK}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: topK }, (_, i) => i + 1).map((rank) => {
                      const active = assignedRank === rank;
                      return (
                        <button
                          key={rank}
                          type="button"
                          onClick={() => {
                            onAssignRank(movie.id, rank);
                            onClose();
                          }}
                          className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                            active
                              ? 'text-slate-950'
                              : 'border-white/15 bg-white/5 text-white hover:bg-white/10'
                          }`}
                          style={
                            active
                              ? {
                                  backgroundColor: movie.palette.accent,
                                  borderColor: movie.palette.accent,
                                }
                              : undefined
                          }
                        >
                          {rank}ª opción ({getBordaPoints(rank, topK, scoringMode)} pts)
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
