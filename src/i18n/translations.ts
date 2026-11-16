import type { AppLanguage, Movie, MovieTrailers } from '../types/cinema';

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
  { es: 'Familiar', va: 'Familiar', en: 'Family' },
  { es: 'Fantasía', va: 'Fantasia', en: 'Fantasy' },
  { es: 'Historia', va: 'Història', en: 'History' },
  { es: 'Terror', va: 'Terror', en: 'Horror' },
  { es: 'Música', va: 'Música', en: 'Music' },
  { es: 'Musical', va: 'Musical', en: 'Musical' },
  { es: 'Misterio', va: 'Misteri', en: 'Mystery' },
  { es: 'Romance', va: 'Romanç', en: 'Romance' },
  { es: 'Ciencia ficción', va: 'Ciència-ficció', en: 'Science Fiction' },
  { es: 'Ciencia Ficción', va: 'Ciència-ficció', en: 'Sci-Fi' },
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
  { es: 'CineFórum', va: 'Cinefòrum', en: 'Film forum' },
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

export function translateGenreOrTag(raw: string, lang: AppLanguage): string {
  const clean = raw.trim();
  if (!clean) return '';
  const match = TAG_LOOKUP.get(normalizeKey(clean));
  if (match) return match[lang];
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
  const url = (rawUrl || '').trim();
  if (!url) return null;
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export function toYouTubeEmbedUrl(rawUrl: string): string | null {
  const id = extractYouTubeVideoId(rawUrl);
  return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0` : null;
}

export function getMovieTrailersMap(movie: Movie): MovieTrailers {
  const fromPalette = movie.palette?.trailers ?? {};
  const fromMovie = movie.trailers ?? {};
  return {
    es: fromMovie.es || fromPalette.es || '',
    va: fromMovie.va || fromPalette.va || '',
    en: fromMovie.en || fromPalette.en || '',
  };
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
    // MovieCard & Detail
    inspectMovieAria: (title: string) => `Ver ficha completa de ${title}`,
    seeFullDetails: 'Ver ficha completa',
    watchTrailer: 'Ver tráiler',
    openTrailerExternal: 'Abrir en YouTube',
    noTrailerAvailable: 'Tráiler no disponible',
    trailerAvailableIn: (langLabel: string) => `Tráiler (${langLabel})`,
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
    fieldNombre: 'Nombre *',
    fieldNombrePh: 'Ej. Lucía',
    fieldApellidos: 'Apellidos *',
    fieldApellidosPh: 'Ej. García López',
    fieldCurso: 'Curso / Grupo *',
    fieldEmail: 'Correo electrónico *',
    allowedDomainsHint: (domains: string[]) =>
      `Dominios admitidos por el centro: ${domains.join(', ')}`,
    sendOtpBtn: 'Enviar código de verificación',
    sendingOtpBtn: 'Enviando código de 4 dígitos…',
    otpInboxBadge: 'Revisa tu bandeja de entrada',
    otpTitle: 'Introduce tu código de 4 cifras',
    otpSubtitle: (email: string, time: string) =>
      `Hemos enviado el código a ${email}. Caduca en ${time} (máximo 3 intentos).`,
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
    nextVoterBtn: 'Listo · Dejar votar al siguiente compañero/a',
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
    // MovieCard & Detail
    inspectMovieAria: (title: string) => `Veure fitxa completa de ${title}`,
    seeFullDetails: 'Veure fitxa completa',
    watchTrailer: 'Veure tràiler',
    openTrailerExternal: 'Obrir en YouTube',
    noTrailerAvailable: 'Tràiler no disponible',
    trailerAvailableIn: (langLabel: string) => `Tràiler (${langLabel})`,
    rankSelectedHint: (rank: number) =>
      `La teua ${rank}a preferència (prem per canviar o llevar)`,
    rankPromptHint: 'Tria la seua posició al teu TOP:',
    rankOrdinal: (rank: number) => `${rank}r/n`,
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
    fieldNombre: 'Nom *',
    fieldNombrePh: 'Ex. Llúcia',
    fieldApellidos: 'Cognoms *',
    fieldApellidosPh: 'Ex. García López',
    fieldCurso: 'Curs / Grup *',
    fieldEmail: 'Correu electrònic *',
    allowedDomainsHint: (domains: string[]) =>
      `Dominis admesos pel centre: ${domains.join(', ')}`,
    sendOtpBtn: 'Enviar codi de verificació',
    sendingOtpBtn: 'Enviant codi de 4 dígits…',
    otpInboxBadge: 'Revisa la safata d’entrada',
    otpTitle: 'Introdueix el teu codi de 4 xifres',
    otpSubtitle: (email: string, time: string) =>
      `Hem enviat el codi a ${email}. Caduca en ${time} (màxim 3 intents).`,
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
    nextVoterBtn: 'Llest · Deixar votar el següent company/a',
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
    // MovieCard & Detail
    inspectMovieAria: (title: string) => `View full details for ${title}`,
    seeFullDetails: 'View full details',
    watchTrailer: 'Watch trailer',
    openTrailerExternal: 'Open on YouTube',
    noTrailerAvailable: 'Trailer unavailable',
    trailerAvailableIn: (langLabel: string) => `Trailer (${langLabel})`,
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
    fieldNombre: 'First name *',
    fieldNombrePh: 'e.g. Lucia',
    fieldApellidos: 'Last name *',
    fieldApellidosPh: 'e.g. Garcia Lopez',
    fieldCurso: 'Class / Group *',
    fieldEmail: 'Email address *',
    allowedDomainsHint: (domains: string[]) =>
      `Allowed school domains: ${domains.join(', ')}`,
    sendOtpBtn: 'Send verification code',
    sendingOtpBtn: 'Sending 4-digit code…',
    otpInboxBadge: 'Check your email inbox',
    otpTitle: 'Enter your 4-digit code',
    otpSubtitle: (email: string, time: string) =>
      `We sent the code to ${email}. Expires in ${time} (max 3 attempts).`,
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
    nextVoterBtn: 'Done · Let the next student vote',
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
  },
} as const;
