import type { AppLanguage, Movie, MovieTrailers } from '../types/cinema';
import { sanitizeSafeHttpUrl } from '../utils/urlSafety';

export interface TrilingualText {
  es: string;
  va: string;
  en: string;
}

export const LANGUAGE_LABELS: Record<AppLanguage, { code: string; name: string }> = {
  es: { code: 'ES', name: 'Castellano' },
  va: { code: 'VA', name: 'Valencià' },
  en: { code: 'EN', name: 'English' },
};

/**
 * Diccionario de géneros y etiquetas temáticas frecuentes de TMDB / IMDb
 * normalizadas en Castellano (es), Valencià (va) e Inglés (en).
 */
const TAG_DICTIONARY: Array<TrilingualText> = [
  { es: 'Acción', va: 'Acció', en: 'Action' },
  { es: 'Aventura', va: 'Aventura', en: 'Adventure' },
  { es: 'Animación', va: 'Animació', en: 'Animation' },
  { es: 'Comedia', va: 'Comèdia', en: 'Comedy' },
  { es: 'Crimen', va: 'Crim', en: 'Crime' },
  { es: 'Documental', va: 'Documental', en: 'Documentary' },
  { es: 'Drama', va: 'Drama', en: 'Drama' },
  { es: 'Familia', va: 'Família', en: 'Family' },
  { es: 'Familiar', va: 'Familiar', en: 'Family-friendly' },
  { es: 'Fantasía', va: 'Fantasia', en: 'Fantasy' },
  { es: 'Historia', va: 'Història', en: 'History' },
  { es: 'Terror', va: 'Terror', en: 'Horror' },
  { es: 'Música', va: 'Música', en: 'Music' },
  { es: 'Musical', va: 'Musical', en: 'Musical' },
  { es: 'Misterio', va: 'Misteri', en: 'Mystery' },
  { es: 'Romance', va: 'Romanç', en: 'Romance' },
  { es: 'Ciencia ficción', va: 'Ciència-ficció', en: 'Science Fiction' },
  { es: 'Película de TV', va: 'Pel·lícula de TV', en: 'TV Movie' },
  { es: 'Suspense', va: 'Suspens', en: 'Thriller' },
  { es: 'Bélica', va: 'Bèl·lica', en: 'War' },
  { es: 'Western', va: 'Western', en: 'Western' },
  { es: 'Supervivencia', va: 'Supervivència', en: 'Survival' },
  { es: 'Deportes', va: 'Esports', en: 'Sports' },
  { es: 'Biografía', va: 'Biografia', en: 'Biography' },
  { es: 'Viaje espacial', va: 'Viatge espacial', en: 'Space travel' },
  { es: 'Viajes espaciales', va: 'Viatges espacials', en: 'Space exploration' },
  { es: 'Espacio', va: 'Espai', en: 'Space' },
  { es: 'Relatividad', va: 'Relativitat', en: 'Relativity' },
  { es: 'Multiverso', va: 'Multivers', en: 'Multiverse' },
  { es: 'Identidad', va: 'Identitat', en: 'Identity' },
  { es: 'Arte visual', va: 'Art visual', en: 'Visual art' },
  { es: 'Trabajo en equipo', va: 'Treball en equip', en: 'Teamwork' },
  { es: 'Superación', va: 'Superació', en: 'Overcoming adversity' },
  { es: 'Hechos reales', va: 'Fets reals', en: 'Based on a true story' },
  { es: 'Emociones', va: 'Emocions', en: 'Emotions' },
  { es: 'Adolescencia', va: 'Adolescència', en: 'Adolescence' },
  { es: 'Salud mental', va: 'Salut mental', en: 'Mental health' },
  { es: 'Crecimiento', va: 'Creixement', en: 'Coming of age' },
  { es: 'Madurez', va: 'Maduresa', en: 'Coming-of-age' },
  { es: 'Ecología', va: 'Ecologia', en: 'Ecology' },
  { es: 'Medio ambiente', va: 'Medi ambient', en: 'Environment' },
  { es: 'Amistad', va: 'Amistat', en: 'Friendship' },
  { es: 'Valentía', va: 'Valentia', en: 'Courage' },
  { es: 'Valores', va: 'Valors', en: 'Values' },
  { es: 'Inclusión', va: 'Inclusió', en: 'Inclusion' },
  { es: 'Empatía', va: 'Empatia', en: 'Empathy' },
  { es: 'Robótica', va: 'Robòtica', en: 'Robotics' },
  { es: 'Futuro', va: 'Futur', en: 'Future' },
  { es: 'Distopía', va: 'Distopia', en: 'Dystopia' },
  { es: 'Inteligencia artificial', va: 'Intel·ligència artificial', en: 'Artificial intelligence' },
  { es: 'Viaje en el tiempo', va: 'Viatge en el temps', en: 'Time travel' },
  { es: 'Agujero negro', va: 'Forat negre', en: 'Black hole' },
  { es: 'Superhéroe', va: 'Superheroi', en: 'Superhero' },
  { es: 'Cómics', va: 'Còmics', en: 'Comic book' },
  { es: 'Magia', va: 'Màgia', en: 'Magic' },
  { es: 'Espíritus', va: 'Esperits', en: 'Spirits' },
  { es: 'Cultura', va: 'Cultura', en: 'Culture' },
  { es: 'Sueños', va: 'Somnis', en: 'Dreams' },
  { es: 'Duelo', va: 'Dol', en: 'Grief' },
  { es: 'Imaginación', va: 'Imaginació', en: 'Imagination' },
  { es: 'Justicia', va: 'Justícia', en: 'Justice' },
  { es: 'Libertad', va: 'Llibertat', en: 'Freedom' },
  { es: 'Esperanza', va: 'Esperança', en: 'Hope' },
  { es: 'Solidaridad', va: 'Solidaritat', en: 'Solidarity' },
  { es: 'Resiliencia', va: 'Resiliència', en: 'Resilience' },
  { es: 'Naturaleza', va: 'Naturalesa', en: 'Nature' },
  { es: 'Tecnología', va: 'Tecnologia', en: 'Technology' },
  { es: 'Instituto', va: 'Institut', en: 'High school' },
  { es: 'Estudiantes', va: 'Estudiants', en: 'Students' },
  { es: 'Educación', va: 'Educació', en: 'Education' },
  { es: 'Sociedad', va: 'Societat', en: 'Society' },
  { es: 'Debate en aula', va: 'Debat a l’aula', en: 'Classroom debate' },
  { es: 'Debate ESO', va: 'Debat ESO', en: 'School debate' },
  { es: 'Debate', va: 'Debat', en: 'Debate' },
  { es: 'ESO', va: 'ESO', en: 'Secondary school' },
  { es: 'CineFórum', va: 'Cinefòrum', en: 'Film forum' },
  { es: 'Ghibli', va: 'Ghibli', en: 'Ghibli' },
  { es: 'Astronauta', va: 'Astronauta', en: 'Astronaut' },
  { es: 'Expedición', va: 'Expedició', en: 'Expedition' },
  { es: 'Rescate', va: 'Rescat', en: 'Rescue' },
  { es: 'Montaña', va: 'Muntanya', en: 'Mountain' },
  { es: 'Accidente aéreo', va: 'Accident aeri', en: 'Plane crash' },
  { es: 'Anime', va: 'Anime', en: 'Anime' },
  { es: 'Studio Ghibli', va: 'Studio Ghibli', en: 'Studio Ghibli' },
  { es: 'Nueva York', va: 'Nova York', en: 'New York' },
  { es: 'Universo paralelo', va: 'Univers paral·lel', en: 'Parallel universe' },
  { es: 'Memoria', va: 'Memòria', en: 'Memory' },
  { es: 'Crecimiento personal', va: 'Creixement personal', en: 'Personal growth' },
  { es: 'Diversidad', va: 'Diversitat', en: 'Diversity' },
  { es: 'Cooperación', va: 'Cooperació', en: 'Cooperation' },
  { es: 'Liderazgo', va: 'Lideratge', en: 'Leadership' },
  { es: 'Humor', va: 'Humor', en: 'Humor' },
  { es: 'Intriga', va: 'Intriga', en: 'Suspense' },
  { es: 'Emotiva', va: 'Emotiva', en: 'Heartwarming' },
  { es: 'Épica', va: 'Èpica', en: 'Epic' },
  { es: 'Secuela', va: 'Seqüela', en: 'Sequel' },
  { es: 'Clásico', va: 'Clàssic', en: 'Classic' },
  { es: 'Infancia', va: 'Infància', en: 'Childhood' },
  { es: 'Arte', va: 'Art', en: 'Art' },
  { es: 'Baloncesto', va: 'Bàsquet', en: 'Basketball' },
  { es: 'Fútbol', va: 'Futbol', en: 'Football' },
  { es: 'Guerra', va: 'Guerra', en: 'War' },
  { es: 'Paz', va: 'Pau', en: 'Peace' },
  { es: 'Misterio juvenil', va: 'Misteri juvenil', en: 'Teen mystery' },
  { es: 'Descubrimiento', va: 'Descobriment', en: 'Discovery' },
  // Keywords frecuentes de TMDB / IMDb
  { es: 'Basada en un libro', va: 'Basada en un llibre', en: 'Based on novel or book' },
  { es: 'Basada en un cómic', va: 'Basada en un còmic', en: 'Based on comic' },
  { es: 'Basada en un videojuego', va: 'Basada en un videojoc', en: 'Based on video game' },
  { es: 'Basada en una obra teatral', va: 'Basada en una obra teatral', en: 'Based on play or musical' },
  { es: 'Caballos', va: 'Cavalls', en: 'Horse' },
  { es: 'Festividades', va: 'Festivitats', en: 'Holiday' },
  { es: 'Navidad', va: 'Nadal', en: 'Christmas' },
  { es: 'Nochebuena', va: 'Nit de Nadal', en: 'Christmas Eve' },
  { es: 'Halloween', va: 'Halloween', en: 'Halloween' },
  { es: 'Año Nuevo', va: 'Cap d’Any', en: 'New Year' },
  { es: 'Portland (Oregón)', va: 'Portland (Oregon)', en: 'Portland, Oregon' },
  { es: 'Londres (Inglaterra)', va: 'Londres (Anglaterra)', en: 'London, England' },
  { es: 'París (Francia)', va: 'París (França)', en: 'Paris, France' },
  { es: 'Tokio (Japón)', va: 'Tòquio (Japó)', en: 'Tokyo, Japan' },
  { es: 'Los Ángeles (California)', va: 'Los Angeles (Califòrnia)', en: 'Los Angeles, California' },
  { es: 'Nueva York (EE. UU.)', va: 'Nova York (EUA)', en: 'New York City' },
  { es: 'Madrid (España)', va: 'Madrid (Espanya)', en: 'Madrid, Spain' },
  { es: 'Bosque', va: 'Bosc', en: 'Forest' },
  { es: 'Venganza', va: 'Venjança', en: 'Revenge' },
  { es: 'Fantasmas', va: 'Fantasmes', en: 'Ghost' },
  { es: 'Monstruos', va: 'Monstres', en: 'Monster' },
  { es: 'Extraterrestres', va: 'Extraterrestres', en: 'Alien' },
  { es: 'Dragones', va: 'Dracs', en: 'Dragon' },
  { es: 'Piratas', va: 'Pirates', en: 'Pirate' },
  { es: 'Tesoro', va: 'Tresor', en: 'Treasure' },
  { es: 'Detective', va: 'Detectiu', en: 'Detective' },
  { es: 'Escuela', va: 'Escola', en: 'School' },
  { es: 'Profesorado', va: 'Professorat', en: 'Teacher' },
  { es: 'Acoso escolar', va: 'Assetjament escolar', en: 'Bullying' },
  { es: 'Cambio climático', va: 'Canvi climàtic', en: 'Climate change' },
  { es: 'Relaciones familiares', va: 'Relacions familiars', en: 'Family relationships' },
  { es: 'Perdidos', va: 'Perduts', en: 'Lost' },
  { es: 'Aventura épica', va: 'Aventura èpica', en: 'Quest' },
  { es: 'Futuro postapocalíptico', va: 'Futur postapocalíptic', en: 'Post-apocalyptic future' },
  { es: 'Juvenil', va: 'Juvenil', en: 'Young adult' },
  { es: 'Adolescente', va: 'Adolescent', en: 'Teenager' },
  { es: 'Stop motion', va: 'Stop-motion', en: 'Stop motion' },
  { es: 'Precuela', va: 'Preqüela', en: 'Prequel' },
  { es: 'Reinicio', va: 'Reinici', en: 'Reboot' },
  { es: 'Nueva versión', va: 'Nova versió', en: 'Remake' },
  { es: 'Escena poscréditos', va: 'Escena postcrèdits', en: 'Aftercreditsstinger' },
  { es: 'Escena entre créditos', va: 'Escena entre crèdits', en: 'Duringcreditsstinger' },
  { es: 'Directora de cine', va: 'Directora de cinema', en: 'Woman director' },
  { es: 'Redención', va: 'Redempció', en: 'Redemption' },
  { es: 'Codicia', va: 'Cobdícia', en: 'Greed' },
  { es: 'Generosidad', va: 'Generositat', en: 'Generosity' },
  { es: 'Criaturas mágicas', va: 'Criatures màgiques', en: 'Magical creature' },
  { es: 'Mundo paralelo', va: 'Món paral·lel', en: 'Alternate universe' },
  { es: 'Superpoderes', va: 'Superpoders', en: 'Superpower' },
  { es: 'Batalla final', va: 'Batalla final', en: 'Final battle' },
  { es: 'Juegos de supervivencia', va: 'Jocs de supervivència', en: 'Death game' },
  { es: 'Rebelión', va: 'Rebel·lió', en: 'Rebellion' },
  { es: 'Autoritarismo', va: 'Autoritarisme', en: 'Totalitarianism' },
  { es: 'Perro', va: 'Gos', en: 'Dog' },
  { es: 'Gato', va: 'Gat', en: 'Cat' },
  { es: 'Océano', va: 'Oceà', en: 'Ocean' },
  { es: 'Isla', va: 'Illa', en: 'Island' },
  { es: 'Música en vivo', va: 'Música en directe', en: 'Concert' },
  { es: 'Salud', va: 'Salut', en: 'Health' },
  { es: 'Superviviente', va: 'Supervivent', en: 'Survivor' },
  { es: 'Mitología', va: 'Mitologia', en: 'Mythology' },
  { es: 'Leyenda', va: 'Llegenda', en: 'Legend' },
  { es: 'Robots', va: 'Robots', en: 'Robot' },
  { es: 'Ciborg', va: 'Cíborg', en: 'Cyborg' },
];

function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const TAG_LOOKUP = new Map<string, TrilingualText>();
for (const entry of TAG_DICTIONARY) {
  TAG_LOOKUP.set(normalizeKey(entry.es), entry);
  TAG_LOOKUP.set(normalizeKey(entry.va), entry);
  TAG_LOOKUP.set(normalizeKey(entry.en), entry);
}
TAG_LOOKUP.set('sci-fi', {
  es: 'Ciencia ficción',
  va: 'Ciència-ficció',
  en: 'Science Fiction',
});
TAG_LOOKUP.set('based on novel', {
  es: 'Basada en un libro',
  va: 'Basada en un llibre',
  en: 'Based on novel or book',
});
TAG_LOOKUP.set('based on book', {
  es: 'Basada en un libro',
  va: 'Basada en un llibre',
  en: 'Based on novel or book',
});
TAG_LOOKUP.set('based on true story', {
  es: 'Hechos reales',
  va: 'Fets reals',
  en: 'Based on a true story',
});
TAG_LOOKUP.set('based on comic book', {
  es: 'Basada en un cómic',
  va: 'Basada en un còmic',
  en: 'Based on comic',
});
TAG_LOOKUP.set('horses', {
  es: 'Caballos',
  va: 'Cavalls',
  en: 'Horse',
});
TAG_LOOKUP.set('holidays', {
  es: 'Festividades',
  va: 'Festivitats',
  en: 'Holiday',
});
TAG_LOOKUP.set('dystopian', {
  es: 'Distopía',
  va: 'Distopia',
  en: 'Dystopia',
});

const PLACE_SUFFIX_MAP: Record<string, TrilingualText> = {
  england: { es: 'Inglaterra', va: 'Anglaterra', en: 'England' },
  uk: { es: 'Reino Unido', va: 'Regne Unit', en: 'UK' },
  'united kingdom': { es: 'Reino Unido', va: 'Regne Unit', en: 'United Kingdom' },
  usa: { es: 'EE. UU.', va: 'EUA', en: 'USA' },
  france: { es: 'Francia', va: 'França', en: 'France' },
  spain: { es: 'España', va: 'Espanya', en: 'Spain' },
  japan: { es: 'Japón', va: 'Japó', en: 'Japan' },
  italy: { es: 'Italia', va: 'Itàlia', en: 'Italy' },
  germany: { es: 'Alemania', va: 'Alemanya', en: 'Germany' },
  oregon: { es: 'Oregón', va: 'Oregon', en: 'Oregon' },
  california: { es: 'California', va: 'Califòrnia', en: 'California' },
  texas: { es: 'Texas', va: 'Texas', en: 'Texas' },
  scotland: { es: 'Escocia', va: 'Escòcia', en: 'Scotland' },
  ireland: { es: 'Irlanda', va: 'Irlanda', en: 'Ireland' },
};

function capitalizeWords(text: string): string {
  return text
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ');
}

export function translateGenreOrTag(raw: string, lang: AppLanguage): string {
  const clean = raw.trim();
  if (!clean) return '';
  const norm = normalizeKey(clean);
  const match = TAG_LOOKUP.get(norm);
  if (match) return match[lang];

  // Patrón "based on <X>" de TMDB / IMDb
  if (norm.startsWith('based on ')) {
    const rest = clean.slice(9).trim();
    const translatedRest = translateGenreOrTag(rest, lang);
    if (lang === 'es') return `Basada en ${translatedRest.toLowerCase()}`;
    if (lang === 'va') return `Basada en ${translatedRest.toLowerCase()}`;
    return `Based on ${rest}`;
  }

  // Patrón "ciudad, país/estado" (ej. "Portland, oregon", "London, england")
  if (clean.includes(',')) {
    const parts = clean.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length === 2) {
      const city = capitalizeWords(parts[0]);
      const regionNorm = normalizeKey(parts[1]);
      const regionMatch = PLACE_SUFFIX_MAP[regionNorm];
      const regionText = regionMatch ? regionMatch[lang] : capitalizeWords(parts[1]);
      return lang === 'en' ? `${city}, ${regionText}` : `${city} (${regionText})`;
    }
  }

  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function getLocalizedMovie(
  movie: Movie,
  lang: AppLanguage
): {
  title: string;
  synopsis: string;
  genres: string[];
  tags: string[];
} {
  const i18nSource = movie.translations?.[lang] ?? movie.palette?.i18n?.[lang];

  const title = i18nSource?.title?.trim() || movie.title;
  const synopsis = i18nSource?.synopsis?.trim() || movie.synopsis;

  const rawGenres =
    i18nSource?.genres && i18nSource.genres.length > 0
      ? i18nSource.genres
      : movie.genres;
  const rawTags =
    i18nSource?.tags && i18nSource.tags.length > 0 ? i18nSource.tags : movie.tags;

  return {
    title,
    synopsis,
    genres: rawGenres.map((g) => translateGenreOrTag(g, lang)),
    tags: rawTags.map((t) => translateGenreOrTag(t, lang)),
  };
}

export function extractYouTubeVideoId(rawUrl: string): string | null {
  const safe = sanitizeSafeHttpUrl(rawUrl);
  if (!safe) return null;
  try {
    const parsed = new URL(safe);
    const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtu.be') {
      const seg = parsed.pathname.split('/').filter(Boolean)[0];
      return seg && /^[A-Za-z0-9_-]{11}$/.test(seg) ? seg : null;
    }
    if (
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'youtube-nocookie.com'
    ) {
      const vParam = parsed.searchParams.get('v');
      if (vParam && /^[A-Za-z0-9_-]{11}$/.test(vParam)) return vParam;
      const parts = parsed.pathname.split('/').filter(Boolean);
      if ((parts[0] === 'embed' || parts[0] === 'shorts') && /^[A-Za-z0-9_-]{11}$/.test(parts[1] || '')) {
        return parts[1];
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function toYouTubeEmbedUrl(rawUrl: string): string | null {
  const id = extractYouTubeVideoId(rawUrl);
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
}

export function getMovieTrailersMap(movie: Movie): MovieTrailers {
  const fromPalette = movie.palette?.trailers ?? {};
  const fromMovie = movie.trailers ?? {};
  return {
    es: sanitizeSafeHttpUrl(fromMovie.es) || sanitizeSafeHttpUrl(fromPalette.es) || '',
    va: sanitizeSafeHttpUrl(fromMovie.va) || sanitizeSafeHttpUrl(fromPalette.va) || '',
    en: sanitizeSafeHttpUrl(fromMovie.en) || sanitizeSafeHttpUrl(fromPalette.en) || '',
  };
}

export function localizeCampaignTitle(
  rawTitle: string | null | undefined,
  lang: AppLanguage
): string {
  const clean = (rawTitle || '').trim();
  if (!clean) return UI_TEXT[lang].defaultCampaignTitle;

  const norm = normalizeKey(clean);
  if (
    norm === 'cineforum eso · votacion de cartelera' ||
    norm === 'cineforum eso - votacion de cartelera' ||
    norm === 'cine eso · votacion de cartelera'
  ) {
    if (norm.startsWith('cine eso')) {
      return lang === 'va'
        ? 'Cine ESO · Votació de Cartellera'
        : lang === 'en'
          ? 'School Cinema · Official Selection'
          : clean;
    }
    return UI_TEXT[lang].defaultCampaignTitle;
  }

  if (lang === 'va') {
    return clean
      .replace(/votación de cartelera/gi, 'Votació de Cartellera')
      .replace(/selección oficial/gi, 'Selecció Oficial');
  }
  if (lang === 'en') {
    return clean
      .replace(/votación de cartelera/gi, 'Official Selection')
      .replace(/cartelera/gi, 'Lineup');
  }
  return clean;
}

export function localizeCampaignSubtitle(
  rawSubtitle: string | null | undefined,
  lang: AppLanguage
): string {
  const clean = (rawSubtitle || '').trim();
  if (!clean) return UI_TEXT[lang].defaultCampaignSubtitle;

  const norm = normalizeKey(clean);
  if (
    norm === 'elige y ordena tus peliculas favoritas. todas tus preferencias suman puntos.' ||
    norm === 'ordena tus peliculas favoritas. en este sistema todas tus preferencias cuentan.' ||
    norm === 'ordena tus peliculas favoritas. todas tus preferencias suman puntos.'
  ) {
    return UI_TEXT[lang].defaultCampaignSubtitle;
  }
  return clean;
}

export function resolveMovieTrailer(
  movie: Movie,
  preferredLang: AppLanguage
): {
  url: string | null;
  embedUrl: string | null;
  activeLang: AppLanguage | null;
  availableLangs: AppLanguage[];
  isFallback: boolean;
} {
  const trailers = getMovieTrailersMap(movie);
  const order: AppLanguage[] =
    preferredLang === 'va'
      ? ['va', 'es', 'en']
      : preferredLang === 'en'
        ? ['en', 'es', 'va']
        : ['es', 'en', 'va'];

  const availableLangs = (['es', 'va', 'en'] as AppLanguage[]).filter(
    (l) => Boolean(trailers[l]?.trim())
  );

  for (const candidate of order) {
    const raw = trailers[candidate]?.trim();
    if (raw) {
      return {
        url: raw,
        embedUrl: toYouTubeEmbedUrl(raw),
        activeLang: candidate,
        availableLangs,
        isFallback: candidate !== preferredLang,
      };
    }
  }

  return {
    url: null,
    embedUrl: null,
    activeLang: null,
    availableLangs,
    isFallback: false,
  };
}

export const UI_TEXT = {
  es: {
    brandSubtitle: '🎬 CineFórum Democrático · Educación Secundaria (ESO)',
    demoBadge: 'Modo Demo Local',
    howItWorksBtn: '¿Cómo funciona tu voto?',
    heroBadge: 'Voto Preferencial · Recuento Borda',
    heroTopBadge: (k: number) => `¡Elige tu TOP ${k}!`,
    votingClosedBadge: 'Urna cerrada',
    defaultCampaignTitle: 'CineFórum ESO · Votación de Cartelera',
    defaultCampaignSubtitle:
      'Elige y ordena tus películas favoritas. Todas tus preferencias suman puntos.',
    topValueLabel: (k: number) => `Valor de tu TOP ${k}`,
    ptSingular: 'pt',
    ptPlural: 'pts',
    emptyPublished: 'Aún no hay películas publicadas en la cartelera.',
    retryBtn: 'Reintentar',
    mobileTopStatus: (k: number, count: number) =>
      `Tu TOP ${k}: ${count} / ${k} elegidas`,
    mobileTopReady: '¡Lista completa! Revisa tu entrada.',
    mobileTopHint: 'Toca 1º, 2º, 3º en cada película.',
    voteNowBtn: 'Votar ahora',
    seeMyTopBtn: 'Ver mi TOP',
    loadErrorFallback: 'No se pudo cargar la cartelera.',
    brandLogoAlt: 'Logo AFA Colegio Mercurio',
    languageSelectorLabel: 'Selector de idioma',
    closeBtn: 'Cerrar',
    footerBrand: 'CineFórum ESO',
    posterAlt: (title: string) => `Póster de ${title}`,
    // MovieCard & Detail
    inspectMovieAria: (title: string) => `Ver ficha completa de ${title}`,
    seeFullDetails: 'Ver ficha completa',
    watchTrailer: 'Ver tráiler',
    openTrailerExternal: 'Abrir en YouTube',
    rankSelectedHint: (rank: number) =>
      `Tu ${rank}ª preferencia (pulsa para cambiar o quitar)`,
    rankPromptHint: 'Elige su posición en tu TOP:',
    rankOrdinal: (rank: number) => `${rank}º`,
    rankOptionLabel: (rank: number) => `${rank}ª opción`,
    originalTitleLabel: 'Título original:',
    synopsisTitle: 'Sinopsis para CineFórum',
    assignPositionTitle: (k: number) => `Asignar posición en tu TOP ${k}:`,
    // TrailerPlayerModal
    trailerPlayerTitle: 'Reproductor de Tráiler',
    trailerLanguageSelect: 'Idioma del tráiler:',
    trailerFallbackNote: (requested: string, actual: string) =>
      `No hay tráiler en ${requested}; reproduciendo versión en ${actual}.`,
    trailerNoSourceMsg:
      'Esta película todavía no tiene un tráiler enlazado en ninguno de los idiomas.',
    closeTrailerAria: 'Cerrar reproductor de tráiler',
    watchExternally: 'Ver en ventana externa',
    // RankingDock
    dockTitle: 'Ordena tus favoritas',
    dockTopPrefix: (k: number) => `Tu TOP ${k} Preferencial`,
    dockSubtitle: 'Arrastra para reordenar o usa las flechas ↑ ↓',
    clearSelectionAria: 'Vaciar selección',
    moveUpMovie: (title: string) => `Subir ${title}`,
    moveDownMovie: (title: string) => `Bajar ${title}`,
    removeMovie: (title: string) => `Quitar ${title}`,
    emptySlotLabel: (rank: number) => `Espacio libre para tu ${rank}ª opción`,
    closedByAdmin: 'Votación cerrada por administración',
    reviewTicketBtn: 'Revisar Entrada de Cine y Votar →',
    pickMoreMovies: (n: number) =>
      `Elige ${n} película${n === 1 ? '' : 's'} más`,
    // CinemaTicketModal
    ticketHeaderTag: 'Pase Oficial · Voto Borda',
    ticketTitle: 'Tu Entrada de Cine',
    ticketConfirmOrder: 'Confirma que este es tu orden definitivo:',
    ticketChangeOrder: 'Cambiar orden',
    ticketProceedAuth: 'Confirmar e identificarme',
    // VoterAuthModal
    authAntiFraudBadge: 'Control antifraude · 1 alumno = 1 voto',
    authTitle: 'Identifícate para validar tu voto',
    authNoticeBefore: 'Te enviaremos un código de 4 dígitos al correo. ',
    authNoticeBold: 'No guardamos cookies ni bloqueamos el navegador',
    authNoticeAfter:
      ': otro compañero podrá votar después en este mismo dispositivo.',
    gdprPreCollectionNotice:
      'Información RGPD / LOPDGDD (art. 13 RGPD y arts. 7 y 11 LOPDGDD): el centro trata tu nombre, curso y correo únicamente por interés educativo y para verificar tu identidad mediante OTP (1 alumno = 1 voto). No usamos cookies ni rastreadores, tu papeleta queda disociada de los resultados públicos y los datos se eliminarán tras el cierre del escrutinio.',
    fieldNombre: 'Nombre *',
    fieldNombrePh: 'Ej. Lucía',
    fieldApellidos: 'Apellidos *',
    fieldApellidosPh: 'Ej. García López',
    fieldCurso: 'Curso / Grupo *',
    fieldEmail: 'Correo electrónico *',
    emailPlaceholder: 'tu.correo@ejemplo.es',
    allowedDomainsHint: (domains: string[]) =>
      `Dominios admitidos por el centro: ${domains.join(', ')}`,
    sendOtpBtn: 'Enviar código de verificación',
    sendingOtpBtn: 'Enviando código de 4 dígitos…',
    otpInboxBadge: 'Revisa tu bandeja de entrada',
    otpTitle: 'Introduce tu código de 4 cifras',
    otpSubtitle: (email: string, time: string) =>
      `Hemos enviado el código a ${email}. Caduca en ${time} (máximo 3 intentos).`,
    otpDigitAriaLabel: (n: number) => `Dígito ${n}`,
    otpExpiredError:
      'El código ha caducado tras 10 minutos. Pulsa «Reenviar nuevo código» para recibir otro.',
    otpDemoTitle: 'Bandeja simulada (Modo Demo / Dev)',
    otpDemoBody: 'Tu código de verificación generado es:',
    verifyOtpBtn: 'Validar y registrar voto',
    verifyingOtpBtn: 'Verificando código…',
    changeDataBtn: '← Cambiar datos',
    resendInBtn: (s: number) => `Reenviar en ${s}s`,
    resendBtn: 'Reenviar nuevo código',
    voteSuccessTitle: '¡Voto registrado con éxito!',
    voteSuccessSubtitle: (curso: string) =>
      `Tu voto preferencial de ${curso} ya forma parte del escrutinio.`,
    receiptPrefix: 'Recibo #',
    savedOrderTitle: 'Tu orden guardado',
    // CivicEducationModal
    civicBadge: 'Educación Cívica y Democrática',
    civicTitle: '¿Cómo funciona tu voto?',
    civicIntro: (k: number) =>
      `No todos los sistemas de votación eligen igual. Descubre por qué aquí ordenamos un TOP ${k} en lugar de marcar solo una casilla.`,
    civicSys1Badge: 'Tradicional',
    civicSys1Title: '1. Mayoría Simple',
    civicSys1Sub: 'First-Past-The-Post',
    civicSys1Desc:
      'El clásico «una persona, una X». Gana quien suma más votos individuales, aunque sea con menos del 50%.',
    civicSys1P1:
      'Polarización: Puede ganar una película que la mayoría rechaza si sus fans se concentran.',
    civicSys1P2:
      'División del voto: Dos pelis parecidas se «roban» votos entre sí y pierden ambas.',
    civicSys1P3:
      'Voto «tirado»: Si votas a tu favorita minoritaria, sientes que tu voto no sirve y acabas votando «por miedo».',
    civicSys2Badge: 'Intermedio',
    civicSys2Title: '2. Voto Aprobatorio',
    civicSys2Sub: 'Approval Voting',
    civicSys2Desc:
      'Marcas con «me vale» todas las películas que aceptarías ver en el aula, sin límite de opciones.',
    civicSys2P1: 'Reduce la división del voto entre películas parecidas.',
    civicSys2P2:
      'Sin matices: No distingue entre la película que te flipa (#1) y una que simplemente «tolerarías».',
    civicSys3Badge: 'Usado en esta app',
    civicSys3Title: '3. Voto Preferencial',
    civicSys3Sub: 'Ranked-Choice · Recuento Borda',
    civicSys3Desc: (k: number) =>
      `Ordenas tu TOP ${k} de mayor a menor preferencia. Cada posición reparte puntos:`,
    civicSys3Footer:
      '¿Por qué es más justo? Premia el consenso general y garantiza que todas tus opciones ponderen, incluso si tu favorita no gana.',
    simTitle: 'Experimento en directo: Una clase de 20 alumnos vota 3 pelis',
    simSubtitle:
      'Cambia el sistema de recuento con los mismos gustos del alumnado y mira quién gana:',
    simWinnerBadge: 'Ganadora',
    simTabFptp: 'Mayoría Simple',
    simTabApproval: 'Aprobatorio',
    simTabBorda: 'Borda (Esta app)',
    // AdminPortalModal (Usuario Administrador, NO profesorado)
    adminHeaderTitle: 'Panel de Administración · Usuario Administrador',
    adminHeaderSub:
      'Gestión de cartelera en 2 fases, tráilers por idioma y escrutinio Borda',
    backToPublicBtn: 'Volver a Cartelera Pública',
    adminLoginTitle: 'Acceso de Administrador',
    adminLoginDesc:
      'Introduce la clave de administración (ADMIN_SECRET) para gestionar la cartelera, los tráilers y consultar los resultados.',
    adminKeyLabel: 'Clave de usuario administrador',
    enterAdminBtn: 'Entrar al Panel de Administración',
    verifyingAdminBtn: 'Verificando…',
    adminDemoHint: 'Modo Demo Local: usa la clave',
    tabBillboard: (pub: number, draft: number) =>
      `Cartelera (${pub} pub · ${draft} borrador)`,
    tabResults: (votes: number) => `Dashboard de Resultados (${votes} votos)`,
    tabSettings: 'Configuración y Reglas',
    phase1Badge: 'Fase 1 · Generación de Borradores',
    phase1Title: 'Barrido inteligente por títulos',
    phase1Desc:
      'Escribe una lista de películas (una por línea). El sistema descarga pósters, sinopsis, etiquetas y tráilers en Castellano, Valencià e Inglés en estado draft.',
    addManualBtn: 'Añadir ficha manual',
    generateDraftsBtn: 'Generar borradores',
    phase2Badge: 'Fase 2 · Consistencia y Aprobación',
    phase2Title: 'Previsualización, tema visual y publicación',
    publishBillboardBtn: (n: number) =>
      `Aprobar y Publicar Cartelera (${n} borrador${n === 1 ? '' : 'es'})`,
    visualThemeLabel: 'Tema visual público:',
    editMovieBtn: 'Modificar ficha',
    hideDraftBtn: 'Ocultar (Borrador)',
    publishMovieBtn: 'Publicar',
    editorModalTitle: 'Editor gráfico de película (ES / VA / EN)',
    saveMovieBtn: 'Guardar ficha',
    cancelBtn: 'Cancelar',
    // Estado público de la votación + Protección de Datos (RGPD / LOPDGDD)
    standingsBtn: 'Estado de la votación',
    standingsModalTitle: 'Estado en vivo de la votación',
    standingsSubtitle:
      'Resultados agregados y anónimos en tiempo real del recuento Borda.',
    standingsPrivacyBadge: 'Identidades 100% protegidas (RGPD / LOPDGDD)',
    standingsTotalVotes: 'Votos verificados',
    standingsPointsDistributed: 'Puntos Borda repartidos',
    standingsConsensusLeader: 'Consenso de la líder',
    standingsPodiumTitle: 'Podio provisional',
    standingsLeaderboardTitle: 'Clasificación actual (Puntuación Borda)',
    standingsClassParticipationTitle: 'Participación por Curso / Grupo',
    standingsConsensusTitle: 'Comparativa cívica en vivo',
    standingsFptpLabel: 'Mayoría Simple (solo 1ª opción)',
    standingsBordaLabel: 'Consenso Borda (TOP completo)',
    standingsDivergedBadge: '¡El Voto Borda está premiando el consenso!',
    standingsNoVotesYet: 'Aún no hay votos verificados. ¡Sé el primero en votar!',
    standingsRefreshBtn: 'Actualizar datos',
    standingsCloseAria: 'Cerrar estado de la votación',
    standingsVotesLabel: (count: number) => `${count} ${count === 1 ? 'voto' : 'votos'}`,
    viewStandingsAfterVoteBtn: 'Ver estado de la votación',
    logoutVoterBtn: 'Cerrar sesión y finalizar (Siguiente alumno/a)',
    adminLogoutBtn: 'Cerrar sesión (Logout)',
    adminLogoutNotice:
      'Sesión de administración cerrada con seguridad. Las credenciales en memoria y los listados de identidades han sido eliminados del navegador.',
    gdprTitle: 'Aviso de Protección de Datos y Anonimato (RGPD / LOPDGDD)',
    gdprLogoutNotice:
      'Sesión cerrada correctamente y memoria del dispositivo limpiada para el siguiente usuario. En cumplimiento del Reglamento (UE) 2016/679 (RGPD) y la Ley Orgánica 3/2018 (LOPDGDD), tus datos identificativos (nombre, apellidos, curso y correo) se tratan únicamente para evitar duplicidades mediante verificación OTP y quedan estrictamente disociados del escrutinio público, sin almacenarse cookies ni rastreadores en el navegador.',
    gdprLogoutDismissBtn: 'Entendido',
    gdprFooterShort:
      'Protección de datos (RGPD UE 2016/679 y LOPDGDD LO 3/2018): votos públicos 100% anónimos y disociados; sin cookies ni almacenamiento local en el dispositivo.',
    showIdentitiesBtn: 'Mostrar identidades (RGPD)',
    hideIdentitiesBtn: 'Ocultar identidades (Protección pantalla)',
    identitiesMaskedNotice:
      'Identidades protegidas por defecto para proyectar o revisar con privacidad.',
    maskedSearchHint: 'Con identidades ocultas, la búsqueda filtra por curso o película.',
    standingsRefreshing: 'Actualizando datos…',
    durationEmpty: 'N/D',
    errorCodes: {
      INVALID_FIRST_NAME: 'Introduce tu nombre real (al menos 2 letras).',
      INVALID_LAST_NAME: 'Introduce tus apellidos reales (al menos 2 letras).',
      INVALID_NAME_CHARS: 'Nombre y apellidos solo deben incluir letras, espacios o guiones.',
      INVALID_CLASS: 'Selecciona tu Curso / Grupo de la lista.',
      INVALID_EMAIL_FORMAT: 'El formato del correo electrónico no es válido (RFC 5322).',
      DISPOSABLE_EMAIL: 'No se permiten dominios de correo temporal o desechable.',
      DOMAIN_NOT_ALLOWED: 'Este correo no pertenece a un dominio permitido por el centro.',
      VOTING_CLOSED: 'La votación está cerrada en este momento.',
      DUPLICATE_EMAIL: 'Ya existe un voto confirmado con este correo electrónico.',
      DUPLICATE_STUDENT: 'Este alumno o alumna ya ha emitido su voto en este curso.',
      RATE_LIMITED: 'Espera unos segundos antes de solicitar otro código OTP.',
      INVALID_OTP: 'Código OTP incorrecto. Revisa tu correo y vuelve a intentarlo.',
      OTP_EXPIRED: 'El código ha caducado (10 min). Solicita uno nuevo.',
      OTP_MAX_ATTEMPTS: 'Has superado el máximo de 3 intentos. Solicita un código nuevo.',
      OTP_NOT_FOUND: 'Solicitud de verificación no encontrada. Pide un nuevo código.',
      OTP_ALREADY_USED: 'Este código ya fue utilizado.',
    } as Record<string, string>,
    adminExtra: {
      resultsCalcLoading: 'Calculando escrutinio Borda y métricas de consenso…',
      resultsNoData: 'Sin datos disponibles.',
      resultsTitle: 'Escrutinio en Directo & Análisis Cívico',
      resultsSubtitle: (topK: number, isClassic: boolean) =>
        `Recuento ponderado TOP ${topK} (${isClassic ? 'Borda Clásico' : 'Borda Fraccional'})`,
      resultsRefreshBtn: 'Actualizar escrutinio',
      resultsResetBtn: 'Vaciar urna a cero',
      resultsTotalVotesLabel: 'Votos válidos verificados',
      resultsOtpVerified: '100% autenticados con OTP',
      resultsBordaPointsLabel: 'Puntos Borda repartidos',
      resultsMoviesCount: (n: number) => `${n} películas en cartelera`,
      resultsLeaderConsensusLabel: 'Consenso de la ganadora',
      resultsTopKPresence: (k: number) => `Presente en el TOP ${k} del alumnado`,
      resultsPodiumTitle: 'Podio de Cartelera',
      resultsPercentOfTotal: (pct: number) => `${pct}% del total`,
      resultsPedagogicalTitle: 'Desglose de Consenso Pedagógico',
      resultsDivergenceBadge: '¡Divergencia detectada entre sistemas!',
      resultsFptpCardLabel: 'Si solo contase la 1ª opción (Mayoría Simple)',
      resultsFirstChoiceVotes: (n: number, pct: number) => `${n} votos #1 (${pct}%)`,
      resultsPresenceInTop: (k: number, pct: number) => `Presencia en TOP ${k}: ${pct}%`,
      resultsBordaCardLabel: (k: number) => `Con Voto Preferencial Borda (Consenso TOP ${k})`,
      resultsBordaWinnerStats: (pts: number, k: number, pct: number) =>
        `${pts} pts · en TOP ${k} del ${pct}%`,
      resultsVotesAsFirst: (n: number, pct: number) => `Votos como 1ª opción: ${n} (${pct}%)`,
      resultsNoDataShort: 'Sin datos',
      resultsLegendFirst: '% votos como 1ª opción',
      resultsLegendTopK: (k: number) => `% alumnos que la incluyen en su TOP ${k} (consenso)`,
      resultsWeightedTitle: 'Puntuación Borda Ponderada',
      resultsClassTitle: 'Participación por Curso / Grupo',
      resultsVotesLogTitle: (n: number) => `Votos registrados (${n})`,
      resultsSearchPh: 'Buscar alumno, correo o curso…',
      resultsSearchMaskedPh: 'Buscar curso o película…',
      resultsSearchAria: 'Filtrar votos registrados',
      resultsEmptyBallotBox: 'La urna está vacía (0 votos).',
      resultsEditVoteBtn: 'Modificar',
      resultsDeleteVoteBtn: 'Anular',
      resultsConfirmResetTitle: '¿Vaciar toda la urna a cero?',
      resultsConfirmResetBody: (n: number) =>
        `Se borrarán los ${n} votos y los códigos OTP temporales para empezar una votación limpia desde 0. Las películas y ajustes NO se borrarán.`,
      resultsConfirmResetBtn: 'Sí, vaciar urna a cero',
      resultsEditVoteModalTitle: (name: string) => `Modificar voto de ${name}`,
      resultsCourseLabel: 'Curso / Grupo',
      resultsChosenOrderLabel: 'Orden de películas elegido:',
      resultsDuplicateMovieErr: 'No puedes repetir la misma película en dos puestos.',
      resultsSaveVoteChangesBtn: 'Guardar cambios',
      adminInvalidKeyErr: 'Clave de administración inválida.',
      adminTitlesPlaceholder: 'Interstellar\nSpider-Man: Un nuevo universo\nLa sociedad de la nieve',
      adminScanEmptyErr: 'Escribe al menos un título de película.',
      adminThemeBlendOpt: 'Blend dinámico (cambia según las pelis publicadas y hover)',
      adminThemeFeaturedOpt: 'Película principal fija (seleccionar abajo)',
      adminThemeSelectMovieOpt: 'Selecciona película tema…',
      adminStatusPublished: 'Visible al alumnado',
      adminStatusDraft: 'Borrador oculto',
      adminStatusArchived: 'Archivada',
      adminMoveUpAria: (title: string) => `Subir ${title}`,
      adminMoveDownAria: (title: string) => `Bajar ${title}`,
      adminDeleteAria: (title: string) => `Eliminar ${title}`,
      adminConfirmDeleteMovie: (title: string) => `¿Eliminar o archivar "${title}"?`,
      adminSettingsTitle: 'Parámetros de la Votación y Seguridad Escolar',
      adminCampaignTitleLabel: 'Título de campaña',
      adminVotingStatusLabel: 'Estado de la urna',
      adminVotingOpenOpt: 'Abierta (alumnado puede votar)',
      adminVotingClosedOpt: 'Cerrada (solo lectura)',
      adminSubtitleLabel: 'Subtítulo educativo',
      adminTopKLabel: 'Número de preferencias a ordenar',
      adminTop3Opt: 'TOP 3 (recomendado)',
      adminTop5Opt: 'TOP 5',
      adminScoringModeLabel: 'Escala de puntuación Borda',
      adminScoringClassicOpt: 'Clásico (3 pts, 2 pts, 1 pt)',
      adminScoringFractionalOpt: 'Decreciente (1 pt, 0.5 pts, 0.25 pts)',
      adminClassesLabel: 'Cursos / Grupos permitidos (uno por línea)',
      adminDomainsLabel: 'Dominios de correo del centro (opcional, separados por coma)',
      adminDomainsPh: 'Ej: iesejemplo.es, educa.madrid.org (vacío = cualquier correo válido no desechable)',
      adminDisposableAlwaysOn:
        'La lista negra de dominios temporales/desechables (mailinator, yopmail, 10minutemail…) siempre permanece activa.',
      adminSaveSettingsBtn: 'Guardar configuración',
      adminRefreshingResultsMsg: 'Actualizando escrutinio…',
      adminMovieTitleLabel: 'Título de la película',
      adminMovieYearLabel: 'Año de estreno',
      adminMovieDurationLabel: 'Duración (minutos)',
      adminMovieAgeLabel: 'Edad recomendada (pulsa para elegir)',
      adminMovieSynopsisLabel: 'Sinopsis breve para el alumnado',
      adminMovieGenresLabel: 'Géneros (separados por coma)',
      adminMovieTagsLabel: 'Etiquetas temáticas (coma)',
      adminMoviePosterLabel: 'Imagen de portada (URL del póster)',
      adminMovieBackdropLabel: 'Imagen ancha de cabecera (opcional)',
      adminMovieTrailersLabel: 'Tráilers por idioma (YouTube o MP4)',
      adminMovieI18nTitleLabel: 'Textos por idioma (opcional)',
      adminMovieI18nTitlePh: (l: string) => `Título en ${l} (opcional)`,
      adminMovieI18nSynopsisPh: (l: string) => `Sinopsis en ${l} (opcional)`,
      adminMoviePaletteLabel: 'Colores de ambiente de esta película',
      adminExtractPaletteBtn: 'Extraer del póster',
      adminExtractingBtn: 'Extrayendo…',
      adminPalettePrimary: 'Principal',
      adminPaletteSecondary: 'Secundario',
      adminPaletteAccent: 'Acento',
      adminBusyEnriching: (n: number) =>
        `Ejecutando barrido inteligente para ${n} título(s) y extrayendo paletas…`,
      adminBusySavingSettings: 'Guardando configuración de votación y tema visual…',
      adminBusyResetting: 'Vaciando urna y reiniciando votos a cero…',
      adminBusyDeletingVote: 'Anulando voto seleccionado…',
      adminBusyUpdatingVote: 'Actualizando voto…',
      adminOkResetVotes: 'Urna vaciada a cero. Todos los votos y códigos OTP se han borrado.',
      adminOkSettingsSaved: 'Configuración y tematización visual actualizadas.',
      adminOkMovieUpdated: 'Ficha actualizada correctamente.',
      adminOkPublished: (n: number) =>
        `¡Cartelera publicada! ${n} borrador(es) pasaron a estado publicado y ya son visibles.`,
      adminOkEnriched: (n: number) =>
        `Fase 1 completada: ${n} ficha(s) generada(s) en estado Borrador (draft) listas para revisar.`,
      adminOkVoteDeleted: 'Voto anulado correctamente.',
      adminOkVoteUpdated: 'Voto modificado y escrutinio recalculado.',
      adminManualDefaultTitle: 'Nueva película',
      adminManualDefaultSynopsis: 'Escribe aquí una sinopsis atractiva para el alumnado.',
      censusBtn: 'Generar lista censo (Colegio)',
      censusModalTitle: 'Lista oficial de votantes verificados (Censo)',
      censusModalDesc:
        'Listado ordenado alfabéticamente por curso y apellidos para cotejar la legitimidad de los votos con el centro escolar. NO incluye las películas elegidas para preservar el secreto del voto.',
      censusPrivacyBadge: 'Secreto del voto garantizado · Sin preferencias de películas',
      censusFilterAllClasses: 'Todos los cursos / grupos',
      censusIncludeEmailLabel: 'Incluir correo de verificación OTP (para desambiguar nombres)',
      censusDownloadCsvBtn: 'Descargar CSV (Excel)',
      censusCopyListBtn: 'Copiar listado',
      censusCopiedBtn: '¡Copiado!',
      censusColIndex: '#',
      censusColApellidos: 'Apellidos',
      censusColNombre: 'Nombre',
      censusColCurso: 'Curso / Grupo',
      censusColEmail: 'Correo OTP',
      censusColTimestamp: 'Fecha verificación',
      censusTotalCount: (n: number) => `${n} votante${n === 1 ? '' : 's'} en el listado`,
    },
  },
  va: {
    brandSubtitle: '🎬 Cinefòrum Democràtic · Educació Secundària (ESO)',
    demoBadge: 'Mode Demo Local',
    howItWorksBtn: 'Com funciona el teu vot?',
    heroBadge: 'Vot Preferencial · Recompte Borda',
    heroTopBadge: (k: number) => `Tria el teu TOP ${k}!`,
    votingClosedBadge: 'Urna tancada',
    defaultCampaignTitle: 'Cinefòrum ESO · Votació de Cartellera',
    defaultCampaignSubtitle:
      'Tria i ordena les teues pel·lícules favorites. Totes les teues preferències sumen punts.',
    topValueLabel: (k: number) => `Valor del teu TOP ${k}`,
    ptSingular: 'pt',
    ptPlural: 'pts',
    emptyPublished: 'Encara no hi ha pel·lícules publicades a la cartellera.',
    retryBtn: 'Reintentar',
    mobileTopStatus: (k: number, count: number) =>
      `El teu TOP ${k}: ${count} / ${k} triades`,
    mobileTopReady: 'Llista completa! Revisa la teua entrada.',
    mobileTopHint: 'Toca 1r, 2n, 3r en cada pel·lícula.',
    voteNowBtn: 'Votar ara',
    seeMyTopBtn: 'Veure el meu TOP',
    loadErrorFallback: 'No s’ha pogut carregar la cartellera.',
    brandLogoAlt: 'Logo AFA Col·legi Mercuri',
    languageSelectorLabel: 'Selector d’idioma',
    closeBtn: 'Tancar',
    footerBrand: 'Cinefòrum ESO',
    posterAlt: (title: string) => `Pòster de ${title}`,
    // MovieCard & Detail
    inspectMovieAria: (title: string) => `Veure fitxa completa de ${title}`,
    seeFullDetails: 'Veure fitxa completa',
    watchTrailer: 'Veure tràiler',
    openTrailerExternal: 'Obrir en YouTube',
    rankSelectedHint: (rank: number) =>
      `La teua ${rank}a preferència (prem per canviar o llevar)`,
    rankPromptHint: 'Tria la seua posició al teu TOP:',
    rankOrdinal: (rank: number) =>
      rank === 1 ? '1r' : rank === 2 ? '2n' : rank === 3 ? '3r' : rank === 4 ? '4t' : `${rank}è`,
    rankOptionLabel: (rank: number) => `${rank}a opció`,
    originalTitleLabel: 'Títol original:',
    synopsisTitle: 'Sinopsi per a Cinefòrum',
    assignPositionTitle: (k: number) => `Assignar posició al teu TOP ${k}:`,
    // TrailerPlayerModal
    trailerPlayerTitle: 'Reproductor de Tràiler',
    trailerLanguageSelect: 'Idioma del tràiler:',
    trailerFallbackNote: (requested: string, actual: string) =>
      `No hi ha tràiler en ${requested}; reproduint versió en ${actual}.`,
    trailerNoSourceMsg:
      'Aquesta pel·lícula encara no té cap tràiler enllaçat en cap idioma.',
    closeTrailerAria: 'Tancar reproductor de tràiler',
    watchExternally: 'Veure en finestra externa',
    // RankingDock
    dockTitle: 'Ordena les teues favorites',
    dockTopPrefix: (k: number) => `El teu TOP ${k} Preferencial`,
    dockSubtitle: 'Arrossega per reordenar o usa les fletxes ↑ ↓',
    clearSelectionAria: 'Buidar selecció',
    moveUpMovie: (title: string) => `Pujar ${title}`,
    moveDownMovie: (title: string) => `Baixar ${title}`,
    removeMovie: (title: string) => `Llevar ${title}`,
    emptySlotLabel: (rank: number) => `Espai lliure per a la teua ${rank}a opció`,
    closedByAdmin: 'Votació tancada per administració',
    reviewTicketBtn: 'Revisar Entrada de Cinema i Votar →',
    pickMoreMovies: (n: number) =>
      `Tria ${n} pel·lícula${n === 1 ? '' : 'es'} més`,
    // CinemaTicketModal
    ticketHeaderTag: 'Passi Oficial · Vot Borda',
    ticketTitle: 'La Teua Entrada de Cinema',
    ticketConfirmOrder: 'Confirma que aquest és el teu ordre definitiu:',
    ticketChangeOrder: 'Canviar ordre',
    ticketProceedAuth: 'Confirmar i identificar-me',
    // VoterAuthModal
    authAntiFraudBadge: 'Control antifrau · 1 alumne/a = 1 vot',
    authTitle: 'Identifica’t per validar el teu vot',
    authNoticeBefore: 'T’enviarem un codi de 4 dígits al correu. ',
    authNoticeBold: 'No guardem cookies ni bloquegem el navegador',
    authNoticeAfter:
      ': un altre company podrà votar després en aquest mateix dispositiu.',
    gdprPreCollectionNotice:
      'Informació RGPD / LOPDGDD (art. 13 RGPD i arts. 7 i 11 LOPDGDD): el centre tracta el teu nom, curs i correu únicament per interés educatiu i per verificar la teua identitat mitjançant OTP (1 alumne = 1 vot). No usem cookies ni rastrejadors, el teu vot resta dissociat dels resultats públics i les dades s’eliminaran en tancar l’escrutini.',
    fieldNombre: 'Nom *',
    fieldNombrePh: 'Ex. Llúcia',
    fieldApellidos: 'Cognoms *',
    fieldApellidosPh: 'Ex. García López',
    fieldCurso: 'Curs / Grup *',
    fieldEmail: 'Correu electrònic *',
    emailPlaceholder: 'el.teu.correu@exemple.es',
    allowedDomainsHint: (domains: string[]) =>
      `Dominis admesos pel centre: ${domains.join(', ')}`,
    sendOtpBtn: 'Enviar codi de verificació',
    sendingOtpBtn: 'Enviant codi de 4 dígits…',
    otpInboxBadge: 'Revisa la safata d’entrada',
    otpTitle: 'Introdueix el teu codi de 4 xifres',
    otpSubtitle: (email: string, time: string) =>
      `Hem enviat el codi a ${email}. Caduca en ${time} (màxim 3 intents).`,
    otpDigitAriaLabel: (n: number) => `Dígit ${n}`,
    otpExpiredError:
      'El codi ha caducat després de 10 minuts. Prem «Reenviar nou codi» per rebre’n un altre.',
    otpDemoTitle: 'Safata simulada (Mode Demo / Dev)',
    otpDemoBody: 'El teu codi de verificació generat és:',
    verifyOtpBtn: 'Validar i registrar vot',
    verifyingOtpBtn: 'Verificant codi…',
    changeDataBtn: '← Canviar dades',
    resendInBtn: (s: number) => `Reenviar en ${s}s`,
    resendBtn: 'Reenviar nou codi',
    voteSuccessTitle: 'Vot registrat amb èxit!',
    voteSuccessSubtitle: (curso: string) =>
      `El teu vot preferencial de ${curso} ja forma part de l’escrutini.`,
    receiptPrefix: 'Rebut #',
    savedOrderTitle: 'El teu ordre guardat',
    // CivicEducationModal
    civicBadge: 'Educació Cívica i Democràtica',
    civicTitle: 'Com funciona el teu vot?',
    civicIntro: (k: number) =>
      `No tots els sistemes de votació trien igual. Descobreix per què ací ordenem un TOP ${k} en lloc de marcar només una casella.`,
    civicSys1Badge: 'Tradicional',
    civicSys1Title: '1. Majoria Simple',
    civicSys1Sub: 'First-Past-The-Post',
    civicSys1Desc:
      'El clàssic «una persona, una X». Guanya qui suma més vots individuals, encara que siga amb menys del 50%.',
    civicSys1P1:
      'Polarització: Pot guanyar una pel·lícula que la majoria rebutja si els seus fans es concentren.',
    civicSys1P2:
      'Divisió del vot: Dues pel·lis paregudes es «roben» vots entre si i perden ambdues.',
    civicSys1P3:
      'Vot «perdut»: Si votes la teua favorita minoritària, sents que el vot no serveix i acabes votant «per por».',
    civicSys2Badge: 'Intermedi',
    civicSys2Title: '2. Vot Aprovatori',
    civicSys2Sub: 'Approval Voting',
    civicSys2Desc:
      'Marques amb «em val» totes les pel·lícules que acceptaries veure a l’aula, sense límit d’opcions.',
    civicSys2P1: 'Redueix la divisió del vot entre pel·lícules paregudes.',
    civicSys2P2:
      'Sense matisos: No distingeix entre la pel·lícula que t’encanta (#1) i una que simplement «toleraries».',
    civicSys3Badge: 'Usat en aquesta app',
    civicSys3Title: '3. Vot Preferencial',
    civicSys3Sub: 'Ranked-Choice · Recompte Borda',
    civicSys3Desc: (k: number) =>
      `Ordenes el teu TOP ${k} de major a menor preferència. Cada posició reparteix punts:`,
    civicSys3Footer:
      'Per què és més just? Premia el consens general i garanteix que totes les teues opcions ponderen, encara que la teua favorita no guanye.',
    simTitle: 'Experiment en directe: Una classe de 20 alumnes vota 3 pel·lis',
    simSubtitle:
      'Canvia el sistema de recompte amb els mateixos gustos de l’alumnat i mira qui guanya:',
    simWinnerBadge: 'Guanyadora',
    simTabFptp: 'Majoria Simple',
    simTabApproval: 'Aprovatori',
    simTabBorda: 'Borda (Aquesta app)',
    // AdminPortalModal
    adminHeaderTitle: 'Panell d’Administració · Usuari Administrador',
    adminHeaderSub:
      'Gestió de cartellera en 2 fases, tràilers per idioma i escrutini Borda',
    backToPublicBtn: 'Tornar a la Cartellera Pública',
    adminLoginTitle: 'Accés d’Administrador',
    adminLoginDesc:
      'Introdueix la clau d’administració (ADMIN_SECRET) per gestionar la cartellera, els tràilers i consultar els resultats.',
    adminKeyLabel: 'Clau d’usuari administrador',
    enterAdminBtn: 'Entrar al Panell d’Administració',
    verifyingAdminBtn: 'Verificant…',
    adminDemoHint: 'Mode Demo Local: usa la clau',
    tabBillboard: (pub: number, draft: number) =>
      `Cartellera (${pub} pub · ${draft} esborrany)`,
    tabResults: (votes: number) => `Tauler de Resultats (${votes} vots)`,
    tabSettings: 'Configuració i Regles',
    phase1Badge: 'Fase 1 · Generació d’Esborranys',
    phase1Title: 'Rastreig intel·ligent per títols',
    phase1Desc:
      'Escriu una llista de pel·lícules (una per línia). El sistema descarrega pòsters, sinopsis, etiquetes i tràilers en Castellà, Valencià i Anglés en estat draft.',
    addManualBtn: 'Afegir fitxa manual',
    generateDraftsBtn: 'Generar esborranys',
    phase2Badge: 'Fase 2 · Consistència i Aprovació',
    phase2Title: 'Previsualització, tema visual i publicació',
    publishBillboardBtn: (n: number) =>
      `Aprovar i Publicar Cartellera (${n} esborrany${n === 1 ? '' : 's'})`,
    visualThemeLabel: 'Tema visual públic:',
    editMovieBtn: 'Modificar fitxa',
    hideDraftBtn: 'Ocultar (Esborrany)',
    publishMovieBtn: 'Publicar',
    editorModalTitle: 'Editor gràfic de pel·lícula (ES / VA / EN)',
    saveMovieBtn: 'Guardar fitxa',
    cancelBtn: 'Cancel·lar',
    // Estat públic de la votació + Protecció de Dades (RGPD / LOPDGDD)
    standingsBtn: 'Estat de la votació',
    standingsModalTitle: 'Estat en directe de la votació',
    standingsSubtitle:
      'Resultats agregats i anònims en temps real del recompte Borda.',
    standingsPrivacyBadge: 'Identitats 100% protegides (RGPD / LOPDGDD)',
    standingsTotalVotes: 'Vots verificats',
    standingsPointsDistributed: 'Punts Borda repartits',
    standingsConsensusLeader: 'Consens de la líder',
    standingsPodiumTitle: 'Podi provisional',
    standingsLeaderboardTitle: 'Classificació actual (Puntuació Borda)',
    standingsClassParticipationTitle: 'Participació per Curs / Grup',
    standingsConsensusTitle: 'Comparativa cívica en directe',
    standingsFptpLabel: 'Majoria Simple (només 1a opció)',
    standingsBordaLabel: 'Consens Borda (TOP complet)',
    standingsDivergedBadge: 'El Vot Borda està premiant el consens!',
    standingsNoVotesYet: 'Encara no hi ha vots verificats. Sigues el primer a votar!',
    standingsRefreshBtn: 'Actualitzar dades',
    standingsCloseAria: 'Tancar estat de la votació',
    standingsVotesLabel: (count: number) => `${count} ${count === 1 ? 'vot' : 'vots'}`,
    viewStandingsAfterVoteBtn: 'Veure estat de la votació',
    logoutVoterBtn: 'Tancar sessió i finalitzar (Següent alumne/a)',
    adminLogoutBtn: 'Tancar sessió (Logout)',
    adminLogoutNotice:
      'Sessió d’administració tancada amb seguretat. Les credencials en memòria i els llistats d’identitats s’han eliminat del navegador.',
    gdprTitle: 'Avís de Protecció de Dades i Anonimat (RGPD / LOPDGDD)',
    gdprLogoutNotice:
      'Sessió tancada correctament i memòria del dispositiu netejada per al següent usuari. En compliment del Reglament (UE) 2016/679 (RGPD) i la Llei Orgànica 3/2018 (LOPDGDD), les teues dades identificatives (nom, cognoms, curs i correu) es tracten únicament per evitar duplicitats mitjançant verificació OTP i romanen estrictament dissociades de l’escrutini públic, sense cookies ni rastrejadors al navegador.',
    gdprLogoutDismissBtn: 'Entés',
    gdprFooterShort:
      'Protecció de dades (RGPD UE 2016/679 i LOPDGDD LO 3/2018): vots públics 100% anònims i dissociats; sense cookies ni emmagatzematge local al dispositiu.',
    showIdentitiesBtn: 'Mostrar identitats (RGPD)',
    hideIdentitiesBtn: 'Ocultar identitats (Protecció pantalla)',
    identitiesMaskedNotice:
      'Identitats protegides per defecte per a projectar o revisar amb privacitat.',
    maskedSearchHint: 'Amb identitats ocultes, la cerca filtra per curs o pel·lícula.',
    standingsRefreshing: 'Actualitzant dades…',
    durationEmpty: 'N/D',
    errorCodes: {
      INVALID_FIRST_NAME: 'Introdueix el teu nom real (almenys 2 lletres).',
      INVALID_LAST_NAME: 'Introdueix els teus cognoms reals (almenys 2 lletres).',
      INVALID_NAME_CHARS: 'El nom i els cognoms només han d’incloure lletres, espais o guions.',
      INVALID_CLASS: 'Selecciona el teu Curs / Grup de la llista.',
      INVALID_EMAIL_FORMAT: 'El format del correu electrònic no és vàlid (RFC 5322).',
      DISPOSABLE_EMAIL: 'No es permeten dominis de correu temporal o d’un sol ús.',
      DOMAIN_NOT_ALLOWED: 'Aquest correu no pertany a un domini admés pel centre.',
      VOTING_CLOSED: 'La votació està tancada en aquest moment.',
      DUPLICATE_EMAIL: 'Ja existeix un vot confirmat amb aquest correu electrònic.',
      DUPLICATE_STUDENT: 'Aquest alumne o alumna ja ha emés el seu vot en aquest curs.',
      RATE_LIMITED: 'Espera uns segons abans de sol·licitar un altre codi OTP.',
      INVALID_OTP: 'Codi OTP incorrecte. Revisa el teu correu i torna-ho a provar.',
      OTP_EXPIRED: 'El codi ha caducat (10 min). Sol·licita’n un de nou.',
      OTP_MAX_ATTEMPTS: 'Has superat el màxim de 3 intents. Sol·licita un codi nou.',
      OTP_NOT_FOUND: 'Sol·licitud de verificació no trobada. Demana un codi nou.',
      OTP_ALREADY_USED: 'Aquest codi ja ha sigut utilitzat.',
    } as Record<string, string>,
    adminExtra: {
      resultsCalcLoading: 'Calculant escrutini Borda i mètriques de consens…',
      resultsNoData: 'Sense dades disponibles.',
      resultsTitle: 'Escrutini en Directe & Anàlisi Cívica',
      resultsSubtitle: (topK: number, isClassic: boolean) =>
        `Recompte ponderat TOP ${topK} (${isClassic ? 'Borda Clàssic' : 'Borda Fraccional'})`,
      resultsRefreshBtn: 'Actualitzar escrutini',
      resultsResetBtn: 'Buidar urna a zero',
      resultsTotalVotesLabel: 'Vots vàlids verificats',
      resultsOtpVerified: '100% autenticats amb OTP',
      resultsBordaPointsLabel: 'Punts Borda repartits',
      resultsMoviesCount: (n: number) => `${n} pel·lícules en cartellera`,
      resultsLeaderConsensusLabel: 'Consens de la guanyadora',
      resultsTopKPresence: (k: number) => `Present al TOP ${k} de l’alumnat`,
      resultsPodiumTitle: 'Podi de Cartellera',
      resultsPercentOfTotal: (pct: number) => `${pct}% del total`,
      resultsPedagogicalTitle: 'Desglossament de Consens Pedagògic',
      resultsDivergenceBadge: 'Divergència detectada entre sistemes!',
      resultsFptpCardLabel: 'Si només comptara la 1a opció (Majoria Simple)',
      resultsFirstChoiceVotes: (n: number, pct: number) => `${n} vots #1 (${pct}%)`,
      resultsPresenceInTop: (k: number, pct: number) => `Presència al TOP ${k}: ${pct}%`,
      resultsBordaCardLabel: (k: number) => `Amb Vot Preferencial Borda (Consens TOP ${k})`,
      resultsBordaWinnerStats: (pts: number, k: number, pct: number) =>
        `${pts} pts · al TOP ${k} del ${pct}%`,
      resultsVotesAsFirst: (n: number, pct: number) => `Vots com a 1a opció: ${n} (${pct}%)`,
      resultsNoDataShort: 'Sense dades',
      resultsLegendFirst: '% vots com a 1a opció',
      resultsLegendTopK: (k: number) => `% alumnes que la inclouen al seu TOP ${k} (consens)`,
      resultsWeightedTitle: 'Puntuació Borda Ponderada',
      resultsClassTitle: 'Participació per Curs / Grup',
      resultsVotesLogTitle: (n: number) => `Vots registrats (${n})`,
      resultsSearchPh: 'Cercar alumne, correu o curs…',
      resultsSearchMaskedPh: 'Cercar curs o pel·lícula…',
      resultsSearchAria: 'Filtrar vots registrats',
      resultsEmptyBallotBox: 'L’urna està buida (0 vots).',
      resultsEditVoteBtn: 'Modificar',
      resultsDeleteVoteBtn: 'Anul·lar',
      resultsConfirmResetTitle: 'Buidar tota l’urna a zero?',
      resultsConfirmResetBody: (n: number) =>
        `S’esborraran els ${n} vots i els codis OTP temporals per començar una votació neta des de 0. Les pel·lícules i ajustos NO s’esborraran.`,
      resultsConfirmResetBtn: 'Sí, buidar urna a zero',
      resultsEditVoteModalTitle: (name: string) => `Modificar vot de ${name}`,
      resultsCourseLabel: 'Curs / Grup',
      resultsChosenOrderLabel: 'Ordre de pel·lícules triat:',
      resultsDuplicateMovieErr: 'No pots repetir la mateixa pel·lícula en dos llocs.',
      resultsSaveVoteChangesBtn: 'Guardar canvis',
      adminInvalidKeyErr: 'Clau d’administració invàlida.',
      adminTitlesPlaceholder: 'Interstellar\nSpider-Man: Un nou univers\nLa societat de la neu',
      adminScanEmptyErr: 'Escriu almenys un títol de pel·lícula.',
      adminThemeBlendOpt: 'Blend dinàmic (canvia segons les pel·lis publicades i hover)',
      adminThemeFeaturedOpt: 'Pel·lícula principal fixa (seleccionar avall)',
      adminThemeSelectMovieOpt: 'Selecciona pel·lícula tema…',
      adminStatusPublished: 'Visible a l’alumnat',
      adminStatusDraft: 'Esborrany ocult',
      adminStatusArchived: 'Arxivada',
      adminMoveUpAria: (title: string) => `Pujar ${title}`,
      adminMoveDownAria: (title: string) => `Baixar ${title}`,
      adminDeleteAria: (title: string) => `Eliminar ${title}`,
      adminConfirmDeleteMovie: (title: string) => `Eliminar o arxivar "${title}"?`,
      adminSettingsTitle: 'Paràmetres de la Votació i Seguretat Escolar',
      adminCampaignTitleLabel: 'Títol de campanya',
      adminVotingStatusLabel: 'Estat de l’urna',
      adminVotingOpenOpt: 'Oberta (l’alumnat pot votar)',
      adminVotingClosedOpt: 'Tancada (només lectura)',
      adminSubtitleLabel: 'Subtítol educatiu',
      adminTopKLabel: 'Nombre de preferències a ordenar',
      adminTop3Opt: 'TOP 3 (recomanat)',
      adminTop5Opt: 'TOP 5',
      adminScoringModeLabel: 'Escala de puntuació Borda',
      adminScoringClassicOpt: 'Clàssic (3 pts, 2 pts, 1 pt)',
      adminScoringFractionalOpt: 'Decreixent (1 pt, 0.5 pts, 0.25 pts)',
      adminClassesLabel: 'Cursos / Grups permesos (un per línia)',
      adminDomainsLabel: 'Dominis de correu del centre (opcional, separats per coma)',
      adminDomainsPh: 'Ex: iesexemple.es (buit = qualsevol correu vàlid)',
      adminDisposableAlwaysOn:
        'La llista negra de dominis temporals (mailinator, yopmail, 10minutemail…) sempre roman activa.',
      adminSaveSettingsBtn: 'Guardar configuració',
      adminRefreshingResultsMsg: 'Actualitzant escrutini…',
      adminMovieTitleLabel: 'Títol de la pel·lícula',
      adminMovieYearLabel: 'Any d’estrena',
      adminMovieDurationLabel: 'Durada (minuts)',
      adminMovieAgeLabel: 'Edat recomanada (prem per triar)',
      adminMovieSynopsisLabel: 'Sinopsi breu per a l’alumnat',
      adminMovieGenresLabel: 'Gèneres (separats per coma)',
      adminMovieTagsLabel: 'Etiquetes temàtiques (coma)',
      adminMoviePosterLabel: 'Imatge de portada (URL del pòster)',
      adminMovieBackdropLabel: 'Imatge ampla de capçalera (opcional)',
      adminMovieTrailersLabel: 'Tràilers per idioma (YouTube o MP4)',
      adminMovieI18nTitleLabel: 'Textos per idioma (opcional)',
      adminMovieI18nTitlePh: (l: string) => `Títol en ${l} (opcional)`,
      adminMovieI18nSynopsisPh: (l: string) => `Sinopsi en ${l} (opcional)`,
      adminMoviePaletteLabel: 'Colors d’ambient d’aquesta pel·lícula',
      adminExtractPaletteBtn: 'Extraure del pòster',
      adminExtractingBtn: 'Extraient…',
      adminPalettePrimary: 'Principal',
      adminPaletteSecondary: 'Secundari',
      adminPaletteAccent: 'Accent',
      adminBusyEnriching: (n: number) =>
        `Executant rastreig intel·ligent per a ${n} títol(s) i extraient paletes…`,
      adminBusySavingSettings: 'Guardant configuració de votació i tema visual…',
      adminBusyResetting: 'Buidant urna i reiniciant vots a zero…',
      adminBusyDeletingVote: 'Anul·lant vot seleccionat…',
      adminBusyUpdatingVote: 'Actualitzant vot…',
      adminOkResetVotes: 'Urna buidada a zero. Tots els vots i codis OTP s’han esborrat.',
      adminOkSettingsSaved: 'Configuració i tematització visual actualitzades.',
      adminOkMovieUpdated: 'Fitxa actualitzada correctament.',
      adminOkPublished: (n: number) =>
        `Cartellera publicada! ${n} esborrany(s) han passat a estat publicat.`,
      adminOkEnriched: (n: number) =>
        `Fase 1 completada: ${n} fitxa(es) generada(es) en estat Esborrany (draft).`,
      adminOkVoteDeleted: 'Vot anul·lat correctament.',
      adminOkVoteUpdated: 'Vot modificat i escrutini recalculat.',
      adminManualDefaultTitle: 'Nova pel·lícula',
      adminManualDefaultSynopsis: 'Escriu ací una sinopsi atractiva per a l’alumnat.',
      censusBtn: 'Generar llista cens (Col·legi)',
      censusModalTitle: 'Llista oficial de votants verificats (Cens)',
      censusModalDesc:
        'Llistat ordenat alfabèticament per curs i cognoms per acarar la legitimitat dels vots amb el centre escolar. NO inclou les pel·lícules triades per preservar el secret del vot.',
      censusPrivacyBadge: 'Secret del vot garantit · Sense preferències de pel·lícules',
      censusFilterAllClasses: 'Tots els cursos / grups',
      censusIncludeEmailLabel: 'Incloure correu de verificació OTP (per desambiguar noms)',
      censusDownloadCsvBtn: 'Descarregar CSV (Excel)',
      censusCopyListBtn: 'Copiar llistat',
      censusCopiedBtn: 'Copiat!',
      censusColIndex: '#',
      censusColApellidos: 'Cognoms',
      censusColNombre: 'Nom',
      censusColCurso: 'Curs / Grup',
      censusColEmail: 'Correu OTP',
      censusColTimestamp: 'Data verificació',
      censusTotalCount: (n: number) => `${n} votant${n === 1 ? '' : 's'} al llistat`,
    },
  },
  en: {
    brandSubtitle: '🎬 Democratic Film Forum · Secondary Education',
    demoBadge: 'Local Demo Mode',
    howItWorksBtn: 'How does your vote work?',
    heroBadge: 'Ranked-Choice Voting · Borda Count',
    heroTopBadge: (k: number) => `Pick your TOP ${k}!`,
    votingClosedBadge: 'Voting closed',
    defaultCampaignTitle: 'School Film Forum · Official Selection',
    defaultCampaignSubtitle:
      'Pick and rank your favorite movies. Every single preference adds points.',
    topValueLabel: (k: number) => `Your TOP ${k} points`,
    ptSingular: 'pt',
    ptPlural: 'pts',
    emptyPublished: 'No movies are published in the lineup yet.',
    retryBtn: 'Retry',
    mobileTopStatus: (k: number, count: number) =>
      `Your TOP ${k}: ${count} / ${k} picked`,
    mobileTopReady: 'List complete! Review your ticket.',
    mobileTopHint: 'Tap 1st, 2nd, 3rd on each movie.',
    voteNowBtn: 'Vote now',
    seeMyTopBtn: 'View my TOP',
    loadErrorFallback: 'Could not load the movie lineup.',
    brandLogoAlt: 'AFA Colegio Mercurio logo',
    languageSelectorLabel: 'Language selector',
    closeBtn: 'Close',
    footerBrand: 'School Film Forum',
    posterAlt: (title: string) => `Poster of ${title}`,
    // MovieCard & Detail
    inspectMovieAria: (title: string) => `View full details for ${title}`,
    seeFullDetails: 'View full details',
    watchTrailer: 'Watch trailer',
    openTrailerExternal: 'Open on YouTube',
    rankSelectedHint: (rank: number) =>
      `Your #${rank} pick (tap to swap or remove)`,
    rankPromptHint: 'Choose its rank in your TOP:',
    rankOrdinal: (rank: number) => `#${rank}`,
    rankOptionLabel: (rank: number) => `#${rank} choice`,
    originalTitleLabel: 'Original title:',
    synopsisTitle: 'Film Forum Synopsis',
    assignPositionTitle: (k: number) => `Assign rank in your TOP ${k}:`,
    // TrailerPlayerModal
    trailerPlayerTitle: 'Trailer Player',
    trailerLanguageSelect: 'Trailer language:',
    trailerFallbackNote: (requested: string, actual: string) =>
      `No trailer available in ${requested}; playing the ${actual} version.`,
    trailerNoSourceMsg:
      'This movie does not have a linked trailer in any language yet.',
    closeTrailerAria: 'Close trailer player',
    watchExternally: 'Open externally',
    // RankingDock
    dockTitle: 'Rank your favorites',
    dockTopPrefix: (k: number) => `Your Ranked TOP ${k}`,
    dockSubtitle: 'Drag to reorder or use the ↑ ↓ arrows',
    clearSelectionAria: 'Clear selection',
    moveUpMovie: (title: string) => `Move ${title} up`,
    moveDownMovie: (title: string) => `Move ${title} down`,
    removeMovie: (title: string) => `Remove ${title}`,
    emptySlotLabel: (rank: number) => `Open slot for your #${rank} choice`,
    closedByAdmin: 'Voting closed by administrator',
    reviewTicketBtn: 'Review Cinema Ticket & Vote →',
    pickMoreMovies: (n: number) =>
      `Pick ${n} more movie${n === 1 ? '' : 's'}`,
    // CinemaTicketModal
    ticketHeaderTag: 'Official Pass · Borda Vote',
    ticketTitle: 'Your Cinema Ticket',
    ticketConfirmOrder: 'Confirm that this is your final ranking:',
    ticketChangeOrder: 'Change order',
    ticketProceedAuth: 'Confirm & identify yourself',
    // VoterAuthModal
    authAntiFraudBadge: 'Anti-fraud control · 1 student = 1 vote',
    authTitle: 'Verify your identity to cast your vote',
    authNoticeBefore: 'We will email you a 4-digit code. ',
    authNoticeBold: 'We do not store cookies or lock the browser',
    authNoticeAfter: ': another classmate can vote right after on this shared device.',
    gdprPreCollectionNotice:
      'GDPR / LOPDGDD Privacy Notice (GDPR Art. 13 & Spanish LOPDGDD Arts. 7, 11): the school processes your name, class, and email strictly for educational administration and one-student-one-vote OTP verification. Zero cookies or trackers are used, ballots stay dissociated from public standings, and personal data is erased after tally closure.',
    fieldNombre: 'First name *',
    fieldNombrePh: 'e.g. Lucia',
    fieldApellidos: 'Last name *',
    fieldApellidosPh: 'e.g. Garcia Lopez',
    fieldCurso: 'Class / Group *',
    fieldEmail: 'Email address *',
    emailPlaceholder: 'your.email@example.org',
    allowedDomainsHint: (domains: string[]) =>
      `Allowed school domains: ${domains.join(', ')}`,
    sendOtpBtn: 'Send verification code',
    sendingOtpBtn: 'Sending 4-digit code…',
    otpInboxBadge: 'Check your email inbox',
    otpTitle: 'Enter your 4-digit code',
    otpSubtitle: (email: string, time: string) =>
      `We sent the code to ${email}. Expires in ${time} (max 3 attempts).`,
    otpDigitAriaLabel: (n: number) => `Digit ${n}`,
    otpExpiredError:
      'This code expired after 10 minutes. Click "Send new code" to request another.',
    otpDemoTitle: 'Simulated Inbox (Demo / Dev Mode)',
    otpDemoBody: 'Your generated verification code is:',
    verifyOtpBtn: 'Verify & submit vote',
    verifyingOtpBtn: 'Verifying code…',
    changeDataBtn: '← Edit details',
    resendInBtn: (s: number) => `Resend in ${s}s`,
    resendBtn: 'Send new code',
    voteSuccessTitle: 'Vote recorded successfully!',
    voteSuccessSubtitle: (curso: string) =>
      `Your ranked vote from ${curso} is now counted.`,
    receiptPrefix: 'Receipt #',
    savedOrderTitle: 'Your saved ranking',
    // CivicEducationModal
    civicBadge: 'Civic & Democratic Education',
    civicTitle: 'How does your vote work?',
    civicIntro: (k: number) =>
      `Not all voting systems pick the same winner. Learn why we rank a TOP ${k} here instead of ticking a single box.`,
    civicSys1Badge: 'Traditional',
    civicSys1Title: '1. Plurality (First-Past-The-Post)',
    civicSys1Sub: 'First-Past-The-Post',
    civicSys1Desc:
      'The classic "one person, one X". Whoever gets the most individual votes wins, even with under 50%.',
    civicSys1P1:
      'Polarization: A movie rejected by the majority can win if its fans concentrate.',
    civicSys1P2:
      'Vote splitting: Two similar movies split the vote and both lose.',
    civicSys1P3:
      'Wasted vote: Supporting an underdog feels pointless, pushing people into tactical voting.',
    civicSys2Badge: 'Intermediate',
    civicSys2Title: '2. Approval Voting',
    civicSys2Sub: 'Approval Voting',
    civicSys2Desc:
      'You tick every movie you would be happy watching in class, with no limit.',
    civicSys2P1: 'Reduces vote splitting between similar movies.',
    civicSys2P2:
      'No intensity: Cannot tell your #1 favorite apart from a movie you merely tolerate.',
    civicSys3Badge: 'Used in this app',
    civicSys3Title: '3. Ranked-Choice Voting',
    civicSys3Sub: 'Ranked-Choice · Borda Count',
    civicSys3Desc: (k: number) =>
      `You rank your TOP ${k} from highest to lowest preference. Each rank awards points:`,
    civicSys3Footer:
      'Why is it fairer? It rewards broad consensus and ensures every choice carries weight, even if your #1 pick does not win.',
    simTitle: 'Live experiment: 20 students vote on 3 movies',
    simSubtitle:
      'Switch the counting rule with the exact same student preferences and see who wins:',
    simWinnerBadge: 'Winner',
    simTabFptp: 'Plurality',
    simTabApproval: 'Approval',
    simTabBorda: 'Borda (This app)',
    // AdminPortalModal
    adminHeaderTitle: 'Administration Panel · Admin User',
    adminHeaderSub:
      '2-phase lineup management, multilingual trailers, and Borda results',
    backToPublicBtn: 'Back to Public Lineup',
    adminLoginTitle: 'Administrator Access',
    adminLoginDesc:
      'Enter the administrator secret (ADMIN_SECRET) to manage movies, trailers, and view voting results.',
    adminKeyLabel: 'Administrator key',
    enterAdminBtn: 'Sign in as Administrator',
    verifyingAdminBtn: 'Verifying…',
    adminDemoHint: 'Local Demo Mode: use key',
    tabBillboard: (pub: number, draft: number) =>
      `Lineup (${pub} pub · ${draft} draft)`,
    tabResults: (votes: number) => `Results Dashboard (${votes} votes)`,
    tabSettings: 'Settings & Rules',
    phase1Badge: 'Phase 1 · Draft Generation',
    phase1Title: 'Smart title scan',
    phase1Desc:
      'Enter a list of movie titles (one per line). The system fetches posters, synopses, tags, and trailers in Spanish, Valencian, and English as drafts.',
    addManualBtn: 'Add manual entry',
    generateDraftsBtn: 'Generate drafts',
    phase2Badge: 'Phase 2 · Review & Approval',
    phase2Title: 'Preview, visual theme, and publishing',
    publishBillboardBtn: (n: number) =>
      `Approve & Publish Lineup (${n} draft${n === 1 ? '' : 's'})`,
    visualThemeLabel: 'Public visual theme:',
    editMovieBtn: 'Edit entry',
    hideDraftBtn: 'Hide (Draft)',
    publishMovieBtn: 'Publish',
    editorModalTitle: 'Visual Movie Editor (ES / VA / EN)',
    saveMovieBtn: 'Save entry',
    cancelBtn: 'Cancel',
    // Public Live Standings + Data Protection (GDPR / LOPDGDD)
    standingsBtn: 'Live standings',
    standingsModalTitle: 'Live Voting Standings',
    standingsSubtitle:
      'Real-time aggregated and anonymous Borda count standings.',
    standingsPrivacyBadge: 'Identities 100% protected (GDPR / LOPDGDD)',
    standingsTotalVotes: 'Verified votes',
    standingsPointsDistributed: 'Borda points awarded',
    standingsConsensusLeader: 'Leader consensus',
    standingsPodiumTitle: 'Provisional podium',
    standingsLeaderboardTitle: 'Current rankings (Borda Score)',
    standingsClassParticipationTitle: 'Participation by Class / Group',
    standingsConsensusTitle: 'Live civic comparison',
    standingsFptpLabel: 'Plurality (1st choice only)',
    standingsBordaLabel: 'Borda Consensus (Full TOP)',
    standingsDivergedBadge: 'Borda voting is rewarding broad consensus!',
    standingsNoVotesYet: 'No verified votes yet. Be the first to vote!',
    standingsRefreshBtn: 'Refresh standings',
    standingsCloseAria: 'Close live standings',
    standingsVotesLabel: (count: number) => `${count} ${count === 1 ? 'vote' : 'votes'}`,
    viewStandingsAfterVoteBtn: 'View live standings',
    logoutVoterBtn: 'Log out & finish (Next student)',
    adminLogoutBtn: 'Log out',
    adminLogoutNotice:
      'Administrator session safely signed out. In-memory credentials and identity logs have been cleared from the browser.',
    gdprTitle: 'Data Protection & Anonymity Notice (GDPR / LOPDGDD)',
    gdprLogoutNotice:
      'Session closed and shared device memory cleared for the next user. Pursuant to Regulation (EU) 2016/679 (GDPR) and Spanish Organic Law 3/2018 (LOPDGDD), your identifying details (name, surname, class, and email) are processed solely to prevent duplicate ballots via OTP verification and remain strictly dissociated and hidden from public standings, with zero cookies or browser tracking.',
    gdprLogoutDismissBtn: 'Got it',
    gdprFooterShort:
      'Data Protection (GDPR EU 2016/679 & LOPDGDD LO 3/2018): public standings are 100% anonymous and dissociated; zero cookies or local browser storage.',
    showIdentitiesBtn: 'Show identities (GDPR)',
    hideIdentitiesBtn: 'Mask identities (Screen privacy)',
    identitiesMaskedNotice:
      'Personal identities are masked by default for safe classroom display.',
    maskedSearchHint: 'While identities are masked, search filters by class or movie only.',
    standingsRefreshing: 'Refreshing standings…',
    durationEmpty: 'N/A',
    errorCodes: {
      INVALID_FIRST_NAME: 'Enter your real first name (at least 2 letters).',
      INVALID_LAST_NAME: 'Enter your real last name (at least 2 letters).',
      INVALID_NAME_CHARS: 'First and last names may only contain letters, spaces, or hyphens.',
      INVALID_CLASS: 'Select your Class / Group from the list.',
      INVALID_EMAIL_FORMAT: 'Invalid email address format (RFC 5322).',
      DISPOSABLE_EMAIL: 'Temporary or disposable email domains are not allowed.',
      DOMAIN_NOT_ALLOWED: 'This email domain is not allowed by the school.',
      VOTING_CLOSED: 'Voting is currently closed.',
      DUPLICATE_EMAIL: 'A verified vote with this email address already exists.',
      DUPLICATE_STUDENT: 'This student has already cast a vote in this class.',
      RATE_LIMITED: 'Please wait a few seconds before requesting another OTP code.',
      INVALID_OTP: 'Incorrect OTP code. Please check your inbox and try again.',
      OTP_EXPIRED: 'This code expired after 10 minutes. Request a new code.',
      OTP_MAX_ATTEMPTS: 'Maximum 3 attempts exceeded. Request a new code.',
      OTP_NOT_FOUND: 'Verification request not found. Please request a new code.',
      OTP_ALREADY_USED: 'This verification code has already been used.',
    } as Record<string, string>,
    adminExtra: {
      resultsCalcLoading: 'Computing Borda tally and consensus metrics…',
      resultsNoData: 'No data available.',
      resultsTitle: 'Live Tally & Civic Consensus Analysis',
      resultsSubtitle: (topK: number, isClassic: boolean) =>
        `Weighted TOP ${topK} count (${isClassic ? 'Classic Borda' : 'Fractional Borda'})`,
      resultsRefreshBtn: 'Refresh results',
      resultsResetBtn: 'Reset ballot box to zero',
      resultsTotalVotesLabel: 'Verified valid votes',
      resultsOtpVerified: '100% OTP verified',
      resultsBordaPointsLabel: 'Borda points distributed',
      resultsMoviesCount: (n: number) => `${n} movies in lineup`,
      resultsLeaderConsensusLabel: 'Winner consensus',
      resultsTopKPresence: (k: number) => `Appears in students' TOP ${k}`,
      resultsPodiumTitle: 'Lineup Podium',
      resultsPercentOfTotal: (pct: number) => `${pct}% of total`,
      resultsPedagogicalTitle: 'Pedagogical Consensus Breakdown',
      resultsDivergenceBadge: 'System divergence detected!',
      resultsFptpCardLabel: 'If only 1st choices counted (Plurality)',
      resultsFirstChoiceVotes: (n: number, pct: number) => `${n} #1 votes (${pct}%)`,
      resultsPresenceInTop: (k: number, pct: number) => `In TOP ${k}: ${pct}%`,
      resultsBordaCardLabel: (k: number) => `With Borda Ranked Voting (TOP ${k} Consensus)`,
      resultsBordaWinnerStats: (pts: number, k: number, pct: number) =>
        `${pts} pts · in TOP ${k} of ${pct}%`,
      resultsVotesAsFirst: (n: number, pct: number) => `1st-choice votes: ${n} (${pct}%)`,
      resultsNoDataShort: 'No data',
      resultsLegendFirst: '% votes as 1st choice',
      resultsLegendTopK: (k: number) => `% students who included it in TOP ${k} (consensus)`,
      resultsWeightedTitle: 'Weighted Borda Score',
      resultsClassTitle: 'Participation by Class / Group',
      resultsVotesLogTitle: (n: number) => `Recorded votes (${n})`,
      resultsSearchPh: 'Search student, email, or class…',
      resultsSearchMaskedPh: 'Search class or movie…',
      resultsSearchAria: 'Filter recorded votes',
      resultsEmptyBallotBox: 'Ballot box is empty (0 votes).',
      resultsEditVoteBtn: 'Edit',
      resultsDeleteVoteBtn: 'Void',
      resultsConfirmResetTitle: 'Reset all votes to zero?',
      resultsConfirmResetBody: (n: number) =>
        `This deletes all ${n} verified votes and temporary OTP codes so you can run a clean ballot from zero. Movies and settings are preserved.`,
      resultsConfirmResetBtn: 'Yes, reset all votes',
      resultsEditVoteModalTitle: (name: string) => `Edit ballot for ${name}`,
      resultsCourseLabel: 'Class / Group',
      resultsChosenOrderLabel: 'Selected movie ranking:',
      resultsDuplicateMovieErr: 'Cannot select the same movie in two ranks.',
      resultsSaveVoteChangesBtn: 'Save changes',
      adminInvalidKeyErr: 'Invalid administrator secret.',
      adminTitlesPlaceholder: 'Interstellar\nSpider-Man: Across the Spider-Verse\nInside Out 2',
      adminScanEmptyErr: 'Enter at least one movie title.',
      adminThemeBlendOpt: 'Dynamic blend (adapts to published movies and hover)',
      adminThemeFeaturedOpt: 'Fixed featured movie theme (select below)',
      adminThemeSelectMovieOpt: 'Select theme movie…',
      adminStatusPublished: 'Visible to students',
      adminStatusDraft: 'Hidden draft',
      adminStatusArchived: 'Archived',
      adminMoveUpAria: (title: string) => `Move ${title} up`,
      adminMoveDownAria: (title: string) => `Move ${title} down`,
      adminDeleteAria: (title: string) => `Delete ${title}`,
      adminConfirmDeleteMovie: (title: string) => `Delete or archive "${title}"?`,
      adminSettingsTitle: 'Voting Rules & School Security Settings',
      adminCampaignTitleLabel: 'Campaign title',
      adminVotingStatusLabel: 'Ballot box status',
      adminVotingOpenOpt: 'Open (students can vote)',
      adminVotingClosedOpt: 'Closed (read-only)',
      adminSubtitleLabel: 'Educational subtitle',
      adminTopKLabel: 'Number of preferences to rank',
      adminTop3Opt: 'TOP 3 (recommended)',
      adminTop5Opt: 'TOP 5',
      adminScoringModeLabel: 'Borda scoring scale',
      adminScoringClassicOpt: 'Classic (3 pts, 2 pts, 1 pt)',
      adminScoringFractionalOpt: 'Fractional (1 pt, 0.5 pts, 0.25 pts)',
      adminClassesLabel: 'Allowed classes / groups (one per line)',
      adminDomainsLabel: 'Allowed school email domains (optional, comma-separated)',
      adminDomainsPh: 'e.g. school.org (empty = any non-disposable valid email)',
      adminDisposableAlwaysOn:
        'Temporary/disposable domain blacklist (mailinator, yopmail, 10minutemail…) is always enforced.',
      adminSaveSettingsBtn: 'Save settings',
      adminRefreshingResultsMsg: 'Refreshing results…',
      adminMovieTitleLabel: 'Movie title',
      adminMovieYearLabel: 'Release year',
      adminMovieDurationLabel: 'Duration (minutes)',
      adminMovieAgeLabel: 'Recommended age rating',
      adminMovieSynopsisLabel: 'Short synopsis for students',
      adminMovieGenresLabel: 'Genres (comma-separated)',
      adminMovieTagsLabel: 'Thematic tags (comma-separated)',
      adminMoviePosterLabel: 'Cover poster URL',
      adminMovieBackdropLabel: 'Wide backdrop image URL (optional)',
      adminMovieTrailersLabel: 'Trailers by language (YouTube or MP4)',
      adminMovieI18nTitleLabel: 'Localized titles & synopses (optional)',
      adminMovieI18nTitlePh: (l: string) => `Title in ${l} (optional)`,
      adminMovieI18nSynopsisPh: (l: string) => `Synopsis in ${l} (optional)`,
      adminMoviePaletteLabel: 'Mood color palette for this movie',
      adminExtractPaletteBtn: 'Extract from poster',
      adminExtractingBtn: 'Extracting…',
      adminPalettePrimary: 'Primary',
      adminPaletteSecondary: 'Secondary',
      adminPaletteAccent: 'Accent',
      adminBusyEnriching: (n: number) =>
        `Running smart enrichment for ${n} title(s) and extracting palettes…`,
      adminBusySavingSettings: 'Saving voting rules and theme settings…',
      adminBusyResetting: 'Clearing votes and resetting ballot box…',
      adminBusyDeletingVote: 'Voiding selected vote…',
      adminBusyUpdatingVote: 'Updating vote…',
      adminOkResetVotes: 'Ballot box reset to zero. All votes and OTP codes were removed.',
      adminOkSettingsSaved: 'Settings and visual theme updated.',
      adminOkMovieUpdated: 'Movie entry updated.',
      adminOkPublished: (n: number) =>
        `Lineup published! ${n} draft(s) are now live for voting.`,
      adminOkEnriched: (n: number) =>
        `Phase 1 complete: ${n} draft entry/entries generated for review.`,
      adminOkVoteDeleted: 'Vote voided.',
      adminOkVoteUpdated: 'Vote updated and tally recomputed.',
      adminManualDefaultTitle: 'New movie',
      adminManualDefaultSynopsis: 'Write an engaging synopsis for students here.',
      censusBtn: 'Generate voter roster (School check)',
      censusModalTitle: 'Verified Voter Roster (School Legitimacy Check)',
      censusModalDesc:
        'Alphabetical roster sorted by class and surname to cross-check ballot legitimacy with school records. Movie preferences are strictly excluded to preserve ballot secrecy.',
      censusPrivacyBadge: 'Ballot secrecy preserved · Zero movie choices included',
      censusFilterAllClasses: 'All classes / groups',
      censusIncludeEmailLabel: 'Include OTP verification email (to disambiguate names)',
      censusDownloadCsvBtn: 'Download CSV (Excel)',
      censusCopyListBtn: 'Copy roster',
      censusCopiedBtn: 'Copied!',
      censusColIndex: '#',
      censusColApellidos: 'Last name',
      censusColNombre: 'First name',
      censusColCurso: 'Class / Group',
      censusColEmail: 'OTP Email',
      censusColTimestamp: 'Verified at',
      censusTotalCount: (n: number) => `${n} verified voter${n === 1 ? '' : 's'} listed`,
    },
  },
} as const;
