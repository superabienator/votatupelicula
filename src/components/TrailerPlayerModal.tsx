import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, Film, PlayCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import {
  LANGUAGE_LABELS,
  getLocalizedMovie,
  getMovieTrailersMap,
  resolveMovieTrailer,
  toYouTubeEmbedUrl,
} from '../i18n/translations';
import type { AppLanguage, Movie } from '../types/cinema';
import { sanitizeSafeHttpUrl } from '../utils/urlSafety';
import { useEscapeKey } from '../utils/useEscapeKey';

interface TrailerPlayerModalProps {
  movie: Movie | null;
  onClose: () => void;
}

export function TrailerPlayerModal({ movie, onClose }: TrailerPlayerModalProps) {
  const { lang, t } = useI18n();
  const [selectedTrailerLang, setSelectedTrailerLang] = useState<AppLanguage>(lang);

  useEscapeKey(Boolean(movie), onClose);

  useEffect(() => {
    if (!movie) return;
    const resolved = resolveMovieTrailer(movie, lang);
    setSelectedTrailerLang(resolved.activeLang ?? lang);
  }, [movie, lang]);

  const localized = movie ? getLocalizedMovie(movie, lang) : null;
  const trailersMap = movie ? getMovieTrailersMap(movie) : {};
  const resolved = movie ? resolveMovieTrailer(movie, selectedTrailerLang) : null;
  const directUrl =
    sanitizeSafeHttpUrl(trailersMap[selectedTrailerLang]) ||
    sanitizeSafeHttpUrl(resolved?.url) ||
    '';
  const embedUrl = directUrl ? toYouTubeEmbedUrl(directUrl) : null;
  const isDirectVideoFile = /\.(mp4|webm|ogg)(\?|$)/i.test(directUrl);
  const showFallbackNote = Boolean(
    movie && !trailersMap[lang]?.trim() && selectedTrailerLang !== lang && directUrl
  );

  return (
    <AnimatePresence>
      {movie && localized && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="trailer-modal-title"
            className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto overscroll-contain rounded-3xl border border-white/20 bg-[#12172e] text-white shadow-2xl"
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 px-5 py-4">
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
                  <PlayCircle className="h-3.5 w-3.5" />
                  {t.trailerPlayerTitle}
                </span>
                <h2
                  id="trailer-modal-title"
                  className="truncate font-display text-lg font-extrabold text-white sm:text-xl"
                >
                  {localized.title}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {directUrl && (
                  <a
                    href={directUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-sky-300" />
                    <span>{t.watchExternally}</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t.closeTrailerAria}
                  className="rounded-xl border border-white/15 bg-white/10 p-2 text-slate-200 transition hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Selector de idioma del tráiler */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-black/25 px-5 py-2.5">
              <span className="text-xs font-semibold text-slate-300">
                {t.trailerLanguageSelect}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(['es', 'va', 'en'] as AppLanguage[]).map((code) => {
                  const hasTrailer = Boolean(trailersMap[code]?.trim());
                  const active = selectedTrailerLang === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      disabled={!hasTrailer}
                      onClick={() => setSelectedTrailerLang(code)}
                      className={`rounded-xl border px-3 py-1 text-xs font-bold transition ${
                        active
                          ? 'border-amber-300 bg-amber-300 text-slate-950'
                          : hasTrailer
                            ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                            : 'cursor-not-allowed border-white/10 bg-white/5 text-slate-500 opacity-50'
                      }`}
                    >
                      {LANGUAGE_LABELS[code].code} · {LANGUAGE_LABELS[code].name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Aviso de idioma alternativo si no existe en el idioma preferido */}
            {showFallbackNote && (
              <div className="border-b border-amber-300/20 bg-amber-400/10 px-5 py-2 text-xs text-amber-200">
                {t.trailerFallbackNote(
                  LANGUAGE_LABELS[lang].name,
                  LANGUAGE_LABELS[selectedTrailerLang].name
                )}
              </div>
            )}

            {/* Reproductor 16:9 integrado */}
            <div className="aspect-video w-full bg-black">
              {embedUrl ? (
                <iframe
                  key={embedUrl}
                  src={embedUrl}
                  title={`${t.trailerPlayerTitle} - ${localized.title}`}
                  referrerPolicy="strict-origin-when-cross-origin"
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : isDirectVideoFile ? (
                <video
                  key={directUrl}
                  src={directUrl}
                  controls
                  className="h-full w-full"
                />
              ) : directUrl ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                  <Film className="h-10 w-10 text-amber-300" />
                  <a
                    href={directUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-amber-300 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-amber-200"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t.openTrailerExternal}
                  </a>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-sm text-slate-400">
                  <Film className="h-9 w-9 text-slate-500" />
                  <p>{t.trailerNoSourceMsg}</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
