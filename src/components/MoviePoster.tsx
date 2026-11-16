import { Film } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import type { MoviePalette } from '../types/cinema';
import { sanitizeSafeHttpUrl } from '../utils/urlSafety';

interface MoviePosterProps {
  title: string;
  year?: number | null;
  posterUrl?: string;
  palette: MoviePalette;
  className?: string;
  compact?: boolean;
  priority?: boolean;
}

export function MoviePoster({
  title,
  year,
  posterUrl,
  palette,
  className = '',
  compact = false,
  priority = false,
}: MoviePosterProps) {
  const { t } = useI18n();
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const safePosterUrl = sanitizeSafeHttpUrl(posterUrl);
  const failed = !safePosterUrl || failedUrl === safePosterUrl;

  if (failed) {
    return (
      <div
        className={`relative flex flex-col justify-between overflow-hidden p-3 text-white ${className}`}
        style={{
          background: `linear-gradient(145deg, ${palette.primary}cc 0%, #0f172a 55%, ${palette.secondary}aa 100%)`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-transparent"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-35 blur-2xl"
          style={{ backgroundColor: palette.accent }}
        />
        <div className="relative flex items-center justify-between">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-black/45 backdrop-blur-sm">
            <Film className="h-4 w-4 text-white/90" />
          </span>
          {year && (
            <span className="rounded-md bg-black/50 px-1.5 py-0.5 font-mono text-[10px] text-white/90">
              {year}
            </span>
          )}
        </div>
        <div className="relative mt-auto">
          <p
            className={`font-display font-bold leading-tight text-white drop-shadow ${
              compact ? 'line-clamp-2 text-xs' : 'line-clamp-3 text-base'
            }`}
          >
            {title}
          </p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={safePosterUrl}
      alt={t.posterAlt(title)}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      onError={() => setFailedUrl(safePosterUrl)}
      className={`bg-slate-900/60 object-cover ${className}`}
    />
  );
}
