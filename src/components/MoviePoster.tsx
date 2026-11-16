import { Film } from 'lucide-react';
import { useState } from 'react';
import type { MoviePalette } from '../types/cinema';

interface MoviePosterProps {
  title: string;
  year?: number | null;
  posterUrl?: string;
  palette: MoviePalette;
  className?: string;
  compact?: boolean;
}

export function MoviePoster({
  title,
  year,
  posterUrl,
  palette,
  className = '',
  compact = false,
}: MoviePosterProps) {
  const [failed, setFailed] = useState(false);

  if (!posterUrl || failed) {
    return (
      <div
        className={`relative flex flex-col justify-between overflow-hidden p-3 text-white ${className}`}
        style={{
          background: `linear-gradient(145deg, ${palette.primary}cc 0%, #0f172a 55%, ${palette.secondary}aa 100%)`,
        }}
      >
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-35 blur-2xl"
          style={{ backgroundColor: palette.accent }}
        />
        <div className="relative flex items-center justify-between">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-black/35 backdrop-blur-sm">
            <Film className="h-4 w-4 text-white/90" />
          </span>
          {year && (
            <span className="rounded-md bg-black/40 px-1.5 py-0.5 font-mono text-[10px] text-white/80">
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
      src={posterUrl}
      alt={`Póster de ${title}`}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
