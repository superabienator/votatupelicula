import type { MoviePalette } from '../types/cinema';

export const DEFAULT_PALETTE: MoviePalette = {
  primary: '#6366f1',
  secondary: '#ec4899',
  accent: '#f59e0b',
};

export function hexToRgba(hex: string, alpha: number): string {
  const clean = (hex || '#6366f1').replace('#', '');
  const normalized =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);

  const r = Number.parseInt(normalized.slice(0, 2), 16) || 99;
  const g = Number.parseInt(normalized.slice(2, 4), 16) || 102;
  const b = Number.parseInt(normalized.slice(4, 6), 16) || 241;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Calcula color de texto legible (#020617 o #ffffff) con contraste WCAG AA sobre un fondo hex.
 */
export function getReadableTextColor(hex?: string | null): '#020617' | '#ffffff' {
  const clean = (hex || '#6366f1').replace('#', '');
  const normalized =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);

  const channels = [0, 2, 4].map((i) => {
    const v = Number.parseInt(normalized.slice(i, i + 2), 16);
    const channel = (Number.isFinite(v) ? v : 128) / 255;
    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  return luminance > 0.179 ? '#020617' : '#ffffff';
}

export function blendPalettes(palettes: MoviePalette[]): MoviePalette {
  if (!palettes || palettes.length === 0) return DEFAULT_PALETTE;
  if (palettes.length === 1) return palettes[0];

  const primary = palettes[0].primary;
  const secondary = palettes[Math.min(1, palettes.length - 1)].secondary;
  const accent = palettes[Math.min(2, palettes.length - 1)].accent || palettes[0].accent;
  return { primary, secondary, accent };
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0'))
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

/**
 * Extrae 3 colores dominantes reales desde el póster usando Canvas HTML5 en navegador.
 */
export async function extractPaletteFromImageCanvas(
  imageUrl: string
): Promise<MoviePalette> {
  if (!imageUrl) return DEFAULT_PALETTE;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 48;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(DEFAULT_PALETTE);
          return;
        }
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        interface Bucket {
          r: number;
          g: number;
          b: number;
          count: number;
          hue: number;
          score: number;
        }
        const buckets = new Map<string, Bucket>();

        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 128) continue;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const [h, s, l] = rgbToHsl(r, g, b);
          if (l < 0.14 || l > 0.88 || s < 0.18) continue;

          const key = `${r >> 5}-${g >> 5}-${b >> 5}`;
          const cur = buckets.get(key) || { r: 0, g: 0, b: 0, count: 0, hue: h, score: 0 };
          cur.r += r;
          cur.g += g;
          cur.b += b;
          cur.count += 1;
          cur.score += 1 + s * 2.5;
          buckets.set(key, cur);
        }

        const sorted = Array.from(buckets.values()).sort((a, b) => b.score - a.score);
        if (sorted.length === 0) {
          resolve(DEFAULT_PALETTE);
          return;
        }

        const boost = (b: Bucket) => {
          const [h, s, l] = rgbToHsl(b.r / b.count, b.g / b.count, b.b / b.count);
          const [nr, ng, nb] = hslToRgb(
            h,
            Math.max(0.45, Math.min(0.92, s * 1.1)),
            Math.max(0.48, Math.min(0.68, l))
          );
          return rgbToHex(nr, ng, nb);
        };

        const p = sorted[0];
        const sec =
          sorted.find((c) => {
            const d = Math.abs(c.hue - p.hue);
            return Math.min(d, 360 - d) >= 40;
          }) ||
          sorted[1] ||
          p;
        const acc =
          sorted.find((c) => {
            const d1 = Math.abs(c.hue - p.hue);
            const d2 = Math.abs(c.hue - sec.hue);
            return Math.min(d1, 360 - d1) >= 55 && Math.min(d2, 360 - d2) >= 40;
          }) ||
          sorted[2] ||
          sec;

        resolve({
          primary: boost(p),
          secondary: boost(sec),
          accent: boost(acc),
        });
      } catch {
        resolve(DEFAULT_PALETTE);
      }
    };

    img.onerror = () => resolve(DEFAULT_PALETTE);
    img.src = imageUrl;
  });
}
