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

interface TmdbVideo {
  site?: string;
  type?: string;
  key?: string;
  official?: boolean;
}

function pickYoutubeTrailer(videosPayload: { results?: TmdbVideo[] } | undefined): string {
  const list = Array.isArray(videosPayload?.results) ? videosPayload.results : [];
  const yt = list.filter(
    (v) => v.site === 'YouTube' && typeof v.key === 'string' && v.key.trim() !== ''
  );
  if (yt.length === 0) return '';

  const officialTrailer = yt.find((v) => v.type === 'Trailer' && v.official);
  const anyTrailer = yt.find((v) => v.type === 'Trailer');
  const teaser = yt.find((v) => v.type === 'Teaser');
  const chosen = officialTrailer || anyTrailer || teaser || yt[0];
  return chosen?.key ? `https://www.youtube.com/watch?v=${chosen.key}` : '';
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
  if (c === 'G') return 'TP';
  if (c === 'PG') return '+7';
  if (c === 'PG-13') return '+12';
  if (c === 'R') return '+16';
  if (c === 'NC-17') return '+18';
  return 'TP';
}

function trimSynopsisForTeens(raw: string, fallback = ''): string {
  const clean = (raw || '').trim().replace(/\s+/g, ' ');
  if (!clean) {
    return (
      fallback ||
      'Una historia seleccionada para debatir en clase sobre sus valores, personajes y dilemas.'
    );
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

  // Consultas paralelas en Castellano (es-ES), Valencià/Català (ca-ES) e Inglés (en-US)
  const [resEs, resCa, resEn] = await Promise.all([
    fetch(
      `https://api.themoviedb.org/3/movie/${topHit.id}?language=es-ES&append_to_response=release_dates,keywords,videos${authQuery}`,
      { headers }
    ),
    fetch(
      `https://api.themoviedb.org/3/movie/${topHit.id}?language=ca-ES&append_to_response=videos${authQuery}`,
      { headers }
    ),
    fetch(
      `https://api.themoviedb.org/3/movie/${topHit.id}?language=en-US&append_to_response=keywords,videos${authQuery}`,
      { headers }
    ),
  ]);

  if (!resEs.ok) return null;

  const movieEs = await resEs.json();
  const movieCa = resCa.ok ? await resCa.json() : null;
  const movieEn = resEn.ok ? await resEn.json() : null;

  const posterUrl = movieEs.poster_path
    ? `https://image.tmdb.org/t/p/w780${movieEs.poster_path}`
    : '';
  const backdropUrl = movieEs.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${movieEs.backdrop_path}`
    : '';

  const genresEs: string[] = Array.isArray(movieEs.genres)
    ? movieEs.genres.map((g: { name: string }) => g.name).slice(0, 4)
    : [];
  const genresCa: string[] = Array.isArray(movieCa?.genres)
    ? movieCa.genres.map((g: { name: string }) => g.name).slice(0, 4)
    : genresEs;
  const genresEn: string[] = Array.isArray(movieEn?.genres)
    ? movieEn.genres.map((g: { name: string }) => g.name).slice(0, 4)
    : genresEs;

  const rawKeywordsEs: string[] = Array.isArray(movieEs.keywords?.keywords)
    ? movieEs.keywords.keywords.map((k: { name: string }) => k.name).slice(0, 4)
    : [];
  const rawKeywordsEn: string[] = Array.isArray(movieEn?.keywords?.keywords)
    ? movieEn.keywords.keywords.map((k: { name: string }) => k.name).slice(0, 4)
    : rawKeywordsEs;

  // Calificación por edades priorizando España (ES) y luego US
  let ageRating = 'TP';
  const releaseEntries = Array.isArray(movieEs.release_dates?.results)
    ? movieEs.release_dates.results
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

  const releaseYear = movieEs.release_date
    ? Number.parseInt(String(movieEs.release_date).slice(0, 4), 10)
    : null;

  const basePalette = await extractPaletteFromPosterUrl(posterUrl, genresEs);

  const tagsEs =
    rawKeywordsEs.length > 0
      ? rawKeywordsEs.map((k) => k.charAt(0).toUpperCase() + k.slice(1))
      : genresEs.slice(0, 3);
  const tagsEn =
    rawKeywordsEn.length > 0
      ? rawKeywordsEn.map((k) => k.charAt(0).toUpperCase() + k.slice(1))
      : genresEn.slice(0, 3);

  const trailerEs = pickYoutubeTrailer(movieEs.videos);
  const trailerVa = pickYoutubeTrailer(movieCa?.videos);
  const trailerEn = pickYoutubeTrailer(movieEn?.videos);

  const synopsisEs = trimSynopsisForTeens(movieEs.overview || '');
  const synopsisCa = trimSynopsisForTeens(movieCa?.overview || '', synopsisEs);
  const synopsisEn = trimSynopsisForTeens(
    movieEn?.overview || '',
    'A story selected to inspire classroom discussion on its characters, values, and dilemmas.'
  );

  const palette: MoviePalette = {
    ...basePalette,
    i18n: {
      es: {
        title: movieEs.title || queryTitle,
        synopsis: synopsisEs,
        genres: genresEs,
        tags: tagsEs,
      },
      va: {
        title: movieCa?.title || movieEs.title || queryTitle,
        synopsis: synopsisCa,
        genres: genresCa,
        tags: tagsEs,
      },
      en: {
        title: movieEn?.title || movieEs.original_title || queryTitle,
        synopsis: synopsisEn,
        genres: genresEn,
        tags: tagsEn,
      },
    },
    trailers: {
      ...(trailerEs ? { es: trailerEs } : {}),
      ...(trailerVa ? { va: trailerVa } : {}),
      ...(trailerEn ? { en: trailerEn } : {}),
    },
  };

  return {
    title: movieEs.title || queryTitle,
    original_title: movieEs.original_title || null,
    year: Number.isFinite(releaseYear) ? releaseYear : null,
    duration_minutes:
      typeof movieEs.runtime === 'number' && movieEs.runtime > 0 ? movieEs.runtime : null,
    genres: genresEs,
    tags: tagsEs,
    age_rating: ageRating,
    synopsis: synopsisEs,
    poster_url: posterUrl,
    backdrop_url: backdropUrl,
    palette,
    tmdb_id: movieEs.id,
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
  const basePalette = await extractPaletteFromPosterUrl(posterUrl, genres);
  const plotEn = trimSynopsisForTeens(data.Plot && data.Plot !== 'N/A' ? data.Plot : '');

  return {
    title: data.Title || queryTitle,
    original_title: data.Title || null,
    year: Number.isFinite(year) ? year : null,
    duration_minutes: duration,
    genres,
    tags: genres.slice(0, 3),
    age_rating: mapCertificationToEs(String(data.Rated || 'PG-13'), 'US'),
    synopsis: plotEn,
    poster_url: posterUrl,
    backdrop_url: '',
    palette: {
      ...basePalette,
      i18n: {
        en: {
          title: data.Title || queryTitle,
          synopsis: plotEn,
          genres,
          tags: genres.slice(0, 3),
        },
      },
    },
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
    const prompt = `Eres un editor educativo de CineFórum para alumnado de ESO (12 a 16 años).
Dada esta película:
- Título: ${draft.title} (${draft.year ?? 'N/D'})
- Géneros: ${draft.genres.join(', ') || 'Cine'}
- Sinopsis base: ${draft.synopsis}
- Tags base: ${draft.tags.join(', ')}

Devuelve EXCLUSIVAMENTE un JSON válido con textos juveniles sin spoilers (máximo 240 caracteres cada sinopsis) y 3 etiquetas temáticas traducidas a los tres idiomas (castellano "es", valencià "va" e inglés "en"):
{
  ${hasBaseMetadata ? '' : '"title": "Título oficial",\n  "year": 2014,\n  "duration_minutes": 120,\n  "age_rating": "+12",'}
  "palette": { "primary": "#RRGGBB", "secondary": "#RRGGBB", "accent": "#RRGGBB" },
  "i18n": {
    "es": { "title": "Título en castellano", "synopsis": "Sinopsis en castellano", "genres": ["Género"], "tags": ["Tag 1", "Tag 2", "Tag 3"] },
    "va": { "title": "Títol en valencià", "synopsis": "Sinopsi en valencià", "genres": ["Gènere"], "tags": ["Etiqueta 1", "Etiqueta 2", "Etiqueta 3"] },
    "en": { "title": "Title in English", "synopsis": "Synopsis in English", "genres": ["Genre"], "tags": ["Tag 1", "Tag 2", "Tag 3"] }
  }
}`;

    const parts: Array<Record<string, unknown>> = [{ text: prompt }];

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
        // Continuamos solo con texto si falla la descarga
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
          temperature: 0.35,
        },
      }),
    });

    if (!res.ok) return draft;
    const payload = await res.json();
    const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return draft;

    const parsed = JSON.parse(rawText);
    const esNode = parsed?.i18n?.es;
    const vaNode = parsed?.i18n?.va;
    const enNode = parsed?.i18n?.en;

    const mergedI18n = {
      ...(draft.palette.i18n ?? {}),
      ...(esNode
        ? {
            es: {
              title: typeof esNode.title === 'string' ? esNode.title : draft.title,
              synopsis:
                typeof esNode.synopsis === 'string'
                  ? trimSynopsisForTeens(esNode.synopsis)
                  : draft.synopsis,
              genres: Array.isArray(esNode.genres)
                ? esNode.genres.slice(0, 4).map(String)
                : draft.genres,
              tags: Array.isArray(esNode.tags)
                ? esNode.tags.slice(0, 4).map(String)
                : draft.tags,
            },
          }
        : {}),
      ...(vaNode
        ? {
            va: {
              title: typeof vaNode.title === 'string' ? vaNode.title : draft.title,
              synopsis:
                typeof vaNode.synopsis === 'string'
                  ? trimSynopsisForTeens(vaNode.synopsis)
                  : draft.synopsis,
              genres: Array.isArray(vaNode.genres)
                ? vaNode.genres.slice(0, 4).map(String)
                : draft.genres,
              tags: Array.isArray(vaNode.tags)
                ? vaNode.tags.slice(0, 4).map(String)
                : draft.tags,
            },
          }
        : {}),
      ...(enNode
        ? {
            en: {
              title: typeof enNode.title === 'string' ? enNode.title : draft.title,
              synopsis:
                typeof enNode.synopsis === 'string'
                  ? trimSynopsisForTeens(enNode.synopsis)
                  : draft.synopsis,
              genres: Array.isArray(enNode.genres)
                ? enNode.genres.slice(0, 4).map(String)
                : draft.genres,
              tags: Array.isArray(enNode.tags)
                ? enNode.tags.slice(0, 4).map(String)
                : draft.tags,
            },
          }
        : {}),
    };

    const nextPalette: MoviePalette = {
      primary:
        parsed.palette && isValidHex(parsed.palette.primary)
          ? parsed.palette.primary
          : draft.palette.primary,
      secondary:
        parsed.palette && isValidHex(parsed.palette.secondary)
          ? parsed.palette.secondary
          : draft.palette.secondary,
      accent:
        parsed.palette && isValidHex(parsed.palette.accent)
          ? parsed.palette.accent
          : draft.palette.accent,
      i18n: mergedI18n,
      trailers: draft.palette.trailers,
    };

    return {
      ...draft,
      title: !hasBaseMetadata && typeof parsed.title === 'string' ? parsed.title : draft.title,
      year: !hasBaseMetadata && typeof parsed.year === 'number' ? parsed.year : draft.year,
      duration_minutes:
        !hasBaseMetadata && typeof parsed.duration_minutes === 'number'
          ? parsed.duration_minutes
          : draft.duration_minutes,
      genres: mergedI18n.es?.genres ?? draft.genres,
      age_rating:
        !hasBaseMetadata && typeof parsed.age_rating === 'string'
          ? parsed.age_rating
          : draft.age_rating,
      synopsis: mergedI18n.es?.synopsis ?? draft.synopsis,
      tags: mergedI18n.es?.tags ?? draft.tags,
      palette: nextPalette,
      source_provider: hasBaseMetadata ? draft.source_provider : 'gemini',
    };
  } catch {
    return draft;
  }
}

export async function enrichMovieTitle(rawTitle: string): Promise<EnrichedMovieDraft> {
  const queryTitle = rawTitle.trim();

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

  return await enhanceWithGemini(baseDraft, hasBaseMetadata);
}
