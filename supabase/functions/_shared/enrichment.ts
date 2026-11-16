import {
  extractPaletteFromPosterUrl,
  fallbackPaletteForGenres,
  type MoviePalette,
} from './colorExtractor.ts';

export interface EnrichedMovieDraft {
  title: string;
  original_title: string | null;
  year: number | null;
  duration_minutes: number | null;
  genres: string[];
  tags: string[];
  age_rating: string;
  synopsis: string;
  poster_url: string;
  backdrop_url: string;
  palette: MoviePalette;
  tmdb_id: number | null;
  source_provider: 'tmdb' | 'omdb' | 'gemini' | 'manual';
}

function mapCertificationToEs(cert: string, country: string): string {
  const c = cert.trim().toUpperCase();
  if (!c) return 'TP';
  if (country === 'ES') {
    if (c === 'APTA' || c === 'TP' || c === 'A') return 'TP';
    if (c === '7' || c === '+7') return '+7';
    if (c === '12' || c === '+12') return '+12';
    if (c === '16' || c === '+16') return '+16';
    if (c === '18' || c === '+18') return '+18';
    return c;
  }
  // Mapeo aproximado desde clasificación estadounidense MPAA
  if (c === 'G') return 'TP';
  if (c === 'PG') return '+7';
  if (c === 'PG-13') return '+12';
  if (c === 'R') return '+16';
  if (c === 'NC-17') return '+18';
  return 'TP';
}

function trimSynopsisForTeens(raw: string): string {
  const clean = (raw || '').trim().replace(/\s+/g, ' ');
  if (!clean) {
    return 'Una historia seleccionada para debatir en clase sobre sus valores, personajes y dilemas.';
  }
  if (clean.length <= 260) return clean;
  const sliced = clean.slice(0, 255);
  const lastPeriod = sliced.lastIndexOf('.');
  if (lastPeriod > 140) return sliced.slice(0, lastPeriod + 1);
  return `${sliced.replace(/\s+\S*$/, '')}…`;
}

async function fetchFromTmdb(queryTitle: string): Promise<EnrichedMovieDraft | null> {
  const tmdbKey = Deno.env.get('TMDB_API_KEY')?.trim();
  if (!tmdbKey) return null;

  const headers: Record<string, string> = {};
  const isBearer = tmdbKey.length > 60;
  const authQuery = isBearer ? '' : `&api_key=${encodeURIComponent(tmdbKey)}`;
  if (isBearer) {
    headers.Authorization = `Bearer ${tmdbKey}`;
  }

  const searchUrl =
    `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(queryTitle)}&language=es-ES&include_adult=false${authQuery}`;
  const searchRes = await fetch(searchUrl, { headers });
  if (!searchRes.ok) return null;

  const searchData = await searchRes.json();
  const topHit = searchData?.results?.[0];
  if (!topHit?.id) return null;

  const detailUrl =
    `https://api.themoviedb.org/3/movie/${topHit.id}?language=es-ES&append_to_response=release_dates,keywords${authQuery}`;
  const detailRes = await fetch(detailUrl, { headers });
  if (!detailRes.ok) return null;

  const movie = await detailRes.json();

  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
    : '';
  const backdropUrl = movie.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
    : '';

  const genres: string[] = Array.isArray(movie.genres)
    ? movie.genres.map((g: { name: string }) => g.name).slice(0, 4)
    : [];

  const rawKeywords: string[] = Array.isArray(movie.keywords?.keywords)
    ? movie.keywords.keywords.map((k: { name: string }) => k.name).slice(0, 4)
    : [];

  // Calificación por edades priorizando España (ES) y luego US
  let ageRating = 'TP';
  const releaseEntries = Array.isArray(movie.release_dates?.results)
    ? movie.release_dates.results
    : [];
  const esEntry = releaseEntries.find((r: { iso_3166_1: string }) => r.iso_3166_1 === 'ES');
  const usEntry = releaseEntries.find((r: { iso_3166_1: string }) => r.iso_3166_1 === 'US');
  const chosenEntry = esEntry || usEntry;
  if (chosenEntry?.release_dates) {
    const certObj = chosenEntry.release_dates.find(
      (rd: { certification?: string }) => rd.certification && rd.certification.trim() !== ''
    );
    if (certObj?.certification) {
      ageRating = mapCertificationToEs(certObj.certification, chosenEntry.iso_3166_1);
    }
  }

  const releaseYear = movie.release_date
    ? Number.parseInt(String(movie.release_date).slice(0, 4), 10)
    : null;

  const palette = await extractPaletteFromPosterUrl(posterUrl, genres);

  const tags =
    rawKeywords.length > 0
      ? rawKeywords.map((k) => k.charAt(0).toUpperCase() + k.slice(1))
      : genres.slice(0, 3);

  return {
    title: movie.title || queryTitle,
    original_title: movie.original_title || null,
    year: Number.isFinite(releaseYear) ? releaseYear : null,
    duration_minutes: typeof movie.runtime === 'number' && movie.runtime > 0 ? movie.runtime : null,
    genres,
    tags,
    age_rating: ageRating,
    synopsis: trimSynopsisForTeens(movie.overview || ''),
    poster_url: posterUrl,
    backdrop_url: backdropUrl,
    palette,
    tmdb_id: movie.id,
    source_provider: 'tmdb',
  };
}

async function fetchFromOmdb(queryTitle: string): Promise<EnrichedMovieDraft | null> {
  const omdbKey = Deno.env.get('OMDB_API_KEY')?.trim();
  if (!omdbKey) return null;

  const url = `https://www.omdbapi.com/?t=${encodeURIComponent(queryTitle)}&plot=short&apikey=${encodeURIComponent(omdbKey)}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = await res.json();
  if (data.Response === 'False') return null;

  const year = Number.parseInt(String(data.Year || ''), 10);
  const runtimeMatch = String(data.Runtime || '').match(/\d+/);
  const duration = runtimeMatch ? Number.parseInt(runtimeMatch[0], 10) : null;
  const genres = String(data.Genre || '')
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean)
    .slice(0, 4);
  const posterUrl = data.Poster && data.Poster !== 'N/A' ? String(data.Poster) : '';
  const palette = await extractPaletteFromPosterUrl(posterUrl, genres);

  return {
    title: data.Title || queryTitle,
    original_title: data.Title || null,
    year: Number.isFinite(year) ? year : null,
    duration_minutes: duration,
    genres,
    tags: genres.slice(0, 3),
    age_rating: mapCertificationToEs(String(data.Rated || 'PG-13'), 'US'),
    synopsis: trimSynopsisForTeens(data.Plot && data.Plot !== 'N/A' ? data.Plot : ''),
    poster_url: posterUrl,
    backdrop_url: '',
    palette,
    tmdb_id: null,
    source_provider: 'omdb',
  };
}

function isValidHex(color: unknown): color is string {
  return typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color);
}

async function enhanceWithGemini(
  draft: EnrichedMovieDraft,
  hasBaseMetadata: boolean
): Promise<EnrichedMovieDraft> {
  const geminiKey = Deno.env.get('GEMINI_API_KEY')?.trim();
  if (!geminiKey) return draft;

  try {
    const prompt = hasBaseMetadata
      ? `Eres un editor educativo de CineFórum para alumnado de ESO (12 a 16 años) en España.
Dada esta película:
- Título: ${draft.title} (${draft.year ?? 'N/D'})
- Géneros: ${draft.genres.join(', ') || 'Cine'}
- Sinopsis base: ${draft.synopsis}

Devuelve EXCLUSIVAMENTE un JSON válido con:
{
  "synopsis": "Sinopsis atractiva, cercana y sin spoilers adaptada a público adolescente de ESO (máximo 240 caracteres, en español)",
  "tags": ["Etiqueta 1", "Etiqueta 2", "Etiqueta 3"],
  "palette": { "primary": "#RRGGBB", "secondary": "#RRGGBB", "accent": "#RRGGBB" }
}
Los colores deben combinar con la atmósfera visual de la película y destacar bien sobre fondo oscuro (#09090f).`
      : `Eres un editor educativo de CineFórum para alumnado de ESO (12 a 16 años).
Para la película titulada "${draft.title}", devuelve EXCLUSIVAMENTE un JSON válido en español con su ficha real aproximada:
{
  "title": "Título oficial en español",
  "year": 2014,
  "duration_minutes": 120,
  "genres": ["Género 1", "Género 2"],
  "age_rating": "+12",
  "synopsis": "Sinopsis juvenil sin spoilers (máx 240 caracteres)",
  "tags": ["Etiqueta temática 1", "Etiqueta 2", "Etiqueta 3"],
  "palette": { "primary": "#RRGGBB", "secondary": "#RRGGBB", "accent": "#RRGGBB" }
}`;

    const parts: Array<Record<string, unknown>> = [{ text: prompt }];

    // Si hay póster JPEG de TMDB, lo adjuntamos en modo multimodal (w185 ligero)
    if (draft.poster_url) {
      try {
        const smallPoster = draft.poster_url.replace('/t/p/w780/', '/t/p/w185/');
        const imgRes = await fetch(smallPoster);
        if (imgRes.ok) {
          const buf = new Uint8Array(await imgRes.arrayBuffer());
          let binary = '';
          for (let i = 0; i < buf.length; i++) {
            binary += String.fromCharCode(buf[i]);
          }
          parts.push({
            inlineData: {
              mimeType: imgRes.headers.get('content-type') || 'image/jpeg',
              data: btoa(binary),
            },
          });
        }
      } catch {
        // Continuamos solo con texto si falla la descarga de imagen
      }
    }

    const endpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
      }),
    });

    if (!res.ok) return draft;
    const payload = await res.json();
    const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return draft;

    const parsed = JSON.parse(rawText);

    return {
      ...draft,
      title: !hasBaseMetadata && typeof parsed.title === 'string' ? parsed.title : draft.title,
      year: !hasBaseMetadata && typeof parsed.year === 'number' ? parsed.year : draft.year,
      duration_minutes:
        !hasBaseMetadata && typeof parsed.duration_minutes === 'number'
          ? parsed.duration_minutes
          : draft.duration_minutes,
      genres:
        !hasBaseMetadata && Array.isArray(parsed.genres)
          ? parsed.genres.slice(0, 4).map(String)
          : draft.genres,
      age_rating:
        !hasBaseMetadata && typeof parsed.age_rating === 'string'
          ? parsed.age_rating
          : draft.age_rating,
      synopsis:
        typeof parsed.synopsis === 'string' && parsed.synopsis.trim()
          ? trimSynopsisForTeens(parsed.synopsis)
          : draft.synopsis,
      tags:
        Array.isArray(parsed.tags) && parsed.tags.length > 0
          ? parsed.tags.slice(0, 4).map((t: unknown) => String(t).trim()).filter(Boolean)
          : draft.tags,
      palette:
        parsed.palette &&
        isValidHex(parsed.palette.primary) &&
        isValidHex(parsed.palette.secondary) &&
        isValidHex(parsed.palette.accent)
          ? parsed.palette
          : draft.palette,
      source_provider: hasBaseMetadata ? draft.source_provider : 'gemini',
    };
  } catch {
    return draft;
  }
}

export async function enrichMovieTitle(rawTitle: string): Promise<EnrichedMovieDraft> {
  const queryTitle = rawTitle.trim();

  // 1. Intentar TMDB -> OMDb
  let baseDraft = await fetchFromTmdb(queryTitle);
  if (!baseDraft) {
    baseDraft = await fetchFromOmdb(queryTitle);
  }

  const hasBaseMetadata = baseDraft !== null;

  if (!baseDraft) {
    baseDraft = {
      title: queryTitle,
      original_title: null,
      year: null,
      duration_minutes: null,
      genres: ['CineFórum'],
      tags: ['Debate en aula', 'ESO'],
      age_rating: '+12',
      synopsis:
        'Ficha creada en borrador. Añade o ajusta la sinopsis y las URLs de póster antes de publicar.',
      poster_url: '',
      backdrop_url: '',
      palette: fallbackPaletteForGenres(['aventura']),
      tmdb_id: null,
      source_provider: 'manual',
    };
  }

  // 2. Enriquecer con Gemini (sinopsis juvenil + etiquetas + paleta multimodal) si hay API key
  return await enhanceWithGemini(baseDraft, hasBaseMetadata);
}
