import jpeg from 'npm:jpeg-js@0.4.4';

export interface MoviePalette {
  primary: string;
  secondary: string;
  accent: string;
  i18n?: Record<string, { title?: string; synopsis?: string; genres?: string[]; tags?: string[] }>;
  trailers?: { es?: string; va?: string; en?: string };
}

const GENRE_FALLBACK_PALETTES: Record<string, MoviePalette> = {
  'ciencia ficcion': { primary: '#38bdf8', secondary: '#6366f1', accent: '#f59e0b' },
  animacion: { primary: '#f43f5e', secondary: '#8b5cf6', accent: '#22d3ee' },
  aventura: { primary: '#f59e0b', secondary: '#0ea5e9', accent: '#10b981' },
  drama: { primary: '#60a5fa', secondary: '#475569', accent: '#f59e0b' },
  comedia: { primary: '#fb923c', secondary: '#ec4899', accent: '#facc15' },
  accion: { primary: '#ef4444', secondary: '#f97316', accent: '#38bdf8' },
  fantasia: { primary: '#a855f7', secondary: '#3b82f6', accent: '#fbbf24' },
  documental: { primary: '#10b981', secondary: '#0284c7', accent: '#f59e0b' },
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => clamp(Math.round(x), 0, 255).toString(16).padStart(2, '0'))
      .join('')
  );
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h * 360, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hn = ((h % 360) + 360) % 360 / 360;
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return [
    Math.round(hue2rgb(hn + 1 / 3) * 255),
    Math.round(hue2rgb(hn) * 255),
    Math.round(hue2rgb(hn - 1 / 3) * 255),
  ];
}

function boostForDarkUi(r: number, g: number, b: number): string {
  const [h, s, l] = rgbToHsl(r, g, b);
  const boostedS = clamp(s < 0.35 ? 0.55 : s * 1.1, 0.35, 0.92);
  const boostedL = clamp(l, 0.48, 0.68);
  const [nr, ng, nb] = hslToRgb(h, boostedS, boostedL);
  return rgbToHex(nr, ng, nb);
}

export function fallbackPaletteForGenres(genres: string[]): MoviePalette {
  for (const genre of genres) {
    const key = genre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
    if (GENRE_FALLBACK_PALETTES[key]) {
      return GENRE_FALLBACK_PALETTES[key];
    }
  }
  return { primary: '#6366f1', secondary: '#ec4899', accent: '#f59e0b' };
}

/**
 * Extrae una paleta dominante de 3 colores vibrantes desde la imagen JPEG del póster.
 * Funciona 100% en Deno Edge Runtime sin dependencias externas ni costes de API.
 */
export async function extractPaletteFromPosterUrl(
  posterUrl: string,
  genres: string[] = []
): Promise<MoviePalette> {
  if (!posterUrl) return fallbackPaletteForGenres(genres);

  try {
    // Usar miniatura w185 si viene de TMDB para decodificación instantánea (~8 KB)
    const fastUrl = posterUrl.replace('/t/p/w780/', '/t/p/w185/').replace('/t/p/original/', '/t/p/w185/');
    const res = await fetch(fastUrl);
    if (!res.ok) return fallbackPaletteForGenres(genres);

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('jpeg') && !contentType.includes('jpg')) {
      return fallbackPaletteForGenres(genres);
    }

    const buffer = new Uint8Array(await res.arrayBuffer());
    const decoded = jpeg.decode(buffer, { useTArray: true });
    const data = decoded.data;

    interface Bucket {
      rSum: number;
      gSum: number;
      bSum: number;
      count: number;
      hue: number;
      score: number;
    }

    const buckets = new Map<string, Bucket>();
    // Muestreo cada 4 píxeles
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const [h, s, l] = rgbToHsl(r, g, b);
      // Descartar negros puros, blancos puros y grises apagados
      if (l < 0.14 || l > 0.88 || s < 0.18) continue;

      const rq = r >> 5;
      const gq = g >> 5;
      const bq = b >> 5;
      const key = `${rq}-${gq}-${bq}`;

      const existing = buckets.get(key) || {
        rSum: 0,
        gSum: 0,
        bSum: 0,
        count: 0,
        hue: h,
        score: 0,
      };
      existing.rSum += r;
      existing.gSum += g;
      existing.bSum += b;
      existing.count += 1;
      existing.score += 1 + s * 2.5;
      buckets.set(key, existing);
    }

    const sorted = Array.from(buckets.values()).sort((a, b) => b.score - a.score);
    if (sorted.length === 0) return fallbackPaletteForGenres(genres);

    const pickDistinct = (minHueDist: number, chosen: Bucket[]): Bucket | null => {
      for (const candidate of sorted) {
        const farEnough = chosen.every((c) => {
          const rawDist = Math.abs(c.hue - candidate.hue);
          const hueDist = Math.min(rawDist, 360 - rawDist);
          return hueDist >= minHueDist;
        });
        if (farEnough) return candidate;
      }
      return null;
    };

    const primaryBucket = sorted[0];
    const secondaryBucket = pickDistinct(38, [primaryBucket]) || sorted[1] || primaryBucket;
    const accentBucket =
      pickDistinct(55, [primaryBucket, secondaryBucket]) ||
      sorted[2] ||
      secondaryBucket;

    const toHex = (b: Bucket) =>
      boostForDarkUi(b.rSum / b.count, b.gSum / b.count, b.bSum / b.count);

    const primary = toHex(primaryBucket);
    const secondary = toHex(secondaryBucket);
    let accent = toHex(accentBucket);

    // Si los 3 colores quedaron demasiado parecidos, generamos acento complementario cálido/luminoso
    if (accent === primary || accent === secondary) {
      const [h] = rgbToHsl(
        primaryBucket.rSum / primaryBucket.count,
        primaryBucket.gSum / primaryBucket.count,
        primaryBucket.bSum / primaryBucket.count
      );
      const [ar, ag, ab] = hslToRgb((h + 150) % 360, 0.85, 0.6);
      accent = rgbToHex(ar, ag, ab);
    }

    return { primary, secondary, accent };
  } catch {
    return fallbackPaletteForGenres(genres);
  }
}
