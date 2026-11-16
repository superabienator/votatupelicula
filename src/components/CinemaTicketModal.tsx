import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Edit3, Film, Sparkles, X } from 'lucide-react';
import type { Movie, ScoringMode } from '../types/cinema';
import { formatPointsLabel, getBordaPoints, getRankMedal } from '../utils/borda';
import { MoviePoster } from './MoviePoster';

interface CinemaTicketModalProps {
  open: boolean;
  campaignTitle: string;
  rankedMovies: Movie[];
  topK: 3 | 5;
  scoringMode: ScoringMode;
  onBackToEdit: () => void;
  onProceedToAuth: () => void;
}

export function CinemaTicketModal({
  open,
  campaignTitle,
  rankedMovies,
  topK,
  scoringMode,
  onBackToEdit,
  onProceedToAuth,
}: CinemaTicketModalProps) {
  const leadPalette = rankedMovies[0]?.palette ?? {
    primary: '#6366f1',
    secondary: '#ec4899',
    accent: '#f59e0b',
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onBackToEdit}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-title"
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-[#101424] shadow-[0_30px_80px_rgba(0,0,0,0.85)]"
            initial={{ opacity: 0, scale: 0.9, rotateX: 12, y: 24 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera cinematográfica del ticket */}
            <div
              className="relative px-6 pb-5 pt-6 text-white"
              style={{
                background: `linear-gradient(135deg, ${leadPalette.primary}dd 0%, ${leadPalette.secondary}cc 100%)`,
              }}
            >
              <button
                type="button"
                onClick={onBackToEdit}
                aria-label="Cerrar resumen"
                className="absolute right-4 top-4 rounded-xl bg-black/30 p-1.5 text-white/90 transition hover:bg-black/50"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/90">
                <Film className="h-4 w-4" />
                <span>Pase Oficial · Voto Borda</span>
              </div>
              <h2
                id="ticket-title"
                className="mt-1.5 font-display text-2xl font-extrabold leading-tight"
              >
                Tu Entrada de Cine
              </h2>
              <p className="mt-0.5 text-xs text-white/85">{campaignTitle}</p>
            </div>

            {/* Cuerpo de preferencias */}
            <div className="space-y-3 px-6 py-5">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                Confirma que este es tu orden definitivo:
              </p>

              <div className="space-y-2.5">
                {rankedMovies.map((movie, idx) => {
                  const rank = idx + 1;
                  const pts = getBordaPoints(rank, topK, scoringMode);
                  const medal = getRankMedal(rank);
                  return (
                    <motion.div
                      key={movie.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-2.5"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-black/45 text-base">
                        {medal.emoji}
                      </span>
                      <div className="h-12 w-8 shrink-0 overflow-hidden rounded-md border border-white/10">
                        <MoviePoster
                          title={movie.title}
                          posterUrl={movie.poster_url}
                          palette={movie.palette}
                          compact
                          className="h-full w-full"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white">{movie.title}</p>
                        <p className="text-[11px] text-slate-400">{medal.label}</p>
                      </div>
                      <span className="rounded-lg bg-amber-400/15 px-2.5 py-1 font-mono text-xs font-bold text-amber-300">
                        +{formatPointsLabel(pts)}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Línea de corte perforada */}
            <div className="ticket-notch-left ticket-notch-right my-1 flex items-center px-4">
              <div className="w-full border-t-2 border-dashed border-white/20" />
            </div>

            {/* Talón inferior y acciones */}
            <div className="space-y-4 px-6 pb-6 pt-3">
              {/* Código de barras decorativo */}
              <div className="flex items-center justify-between rounded-xl bg-black/35 px-3 py-2">
                <div className="flex h-6 items-end gap-[2px] opacity-70" aria-hidden="true">
                  {[18, 12, 22, 10, 20, 14, 24, 10, 16, 22, 12, 20, 14, 18, 24, 12, 20].map(
                    (h, i) => (
                      <span
                        key={i}
                        className="w-[2px] rounded-full bg-slate-300"
                        style={{ height: `${h}px` }}
                      />
                    )
                  )}
                </div>
                <span className="font-mono text-[10px] tracking-widest text-slate-400">
                  TOP-{topK} · {scoringMode.toUpperCase()}
                </span>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={onBackToEdit}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-xs font-bold text-slate-200 transition hover:bg-white/10"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Cambiar orden
                </button>
                <button
                  type="button"
                  onClick={onProceedToAuth}
                  className="inline-flex flex-[1.5] items-center justify-center gap-1.5 rounded-xl px-4 py-3 text-xs font-extrabold text-slate-950 shadow-lg transition hover:brightness-110"
                  style={{
                    background: `linear-gradient(135deg, ${leadPalette.accent}, ${leadPalette.primary})`,
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar e identificarme
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
