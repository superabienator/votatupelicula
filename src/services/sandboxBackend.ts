import type {
  DashboardResults,
  Movie,
  OtpChallenge,
  VoteReceipt,
  VotingSettings,
} from '../types/cinema';
import { getBordaPoints } from '../utils/borda';
import { validateVoterForm } from '../utils/normalization';

/**
 * Motor en memoria para Modo Demo Local (cuando no hay variables VITE_SUPABASE_*).
 * CERO uso de localStorage, sessionStorage o cookies para garantizar compatibilidad
 * con dispositivos compartidos en aula.
 */

const DEMO_ADMIN_SECRET = 'demo1234';

let settings: VotingSettings = {
  id: 1,
  campaign_title: 'CineFórum ESO · Cartelera de Trimestre',
  subtitle:
    'Ordena tus 3 películas favoritas. Tu 2ª y 3ª elección también suman puntos para encontrar la peli que más une a la clase.',
  top_k: 3,
  scoring_mode: 'classic',
  theme_mode: 'blend',
  featured_movie_id: '11111111-1111-4111-8111-111111111102',
  allowed_classes: [
    '1º ESO A',
    '1º ESO B',
    '2º ESO A',
    '2º ESO B',
    '3º ESO A',
    '3º ESO B',
    '4º ESO A',
    '4º ESO B',
  ],
  allowed_email_domains: [],
  voting_open: true,
};

let movies: Movie[] = [
  {
    id: '11111111-1111-4111-8111-111111111101',
    title: 'Interstellar',
    original_title: 'Interstellar',
    year: 2014,
    duration_minutes: 169,
    genres: ['Ciencia ficción', 'Aventura', 'Drama'],
    tags: ['Viaje espacial', 'Relatividad', 'Familia'],
    age_rating: '+12',
    synopsis:
      'Cuando la Tierra se vuelve inhabitable, un equipo de exploradores atraviesa un agujero de gusano para buscar un nuevo hogar para la humanidad.',
    poster_url: 'https://image.tmdb.org/t/p/w780/nrSaXF39nDfAAeLKksRCyvSzI2a.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
    palette: { primary: '#38bdf8', secondary: '#f59e0b', accent: '#6366f1' },
    tmdb_id: 157336,
    source_provider: 'tmdb',
    status: 'published',
    display_order: 1,
  },
  {
    id: '11111111-1111-4111-8111-111111111102',
    title: 'Spider-Man: Cruzando el Multiverso',
    original_title: 'Spider-Man: Across the Spider-Verse',
    year: 2023,
    duration_minutes: 140,
    genres: ['Animación', 'Acción', 'Aventura'],
    tags: ['Multiverso', 'Identidad', 'Arte visual'],
    age_rating: '+7',
    synopsis:
      'Miles Morales salta entre universos junto a Gwen Stacy y descubre una sociedad de Spider-Héroes que pondrá a prueba su propio destino.',
    poster_url: 'https://image.tmdb.org/t/p/w780/37WcNMg5leBhGMM6n3M0G4R1l9l.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
    palette: { primary: '#f43f5e', secondary: '#8b5cf6', accent: '#22d3ee' },
    tmdb_id: 569094,
    source_provider: 'tmdb',
    status: 'published',
    display_order: 2,
  },
  {
    id: '11111111-1111-4111-8111-111111111103',
    title: 'La sociedad de la nieve',
    original_title: 'La sociedad de la nieve',
    year: 2023,
    duration_minutes: 144,
    genres: ['Drama', 'Supervivencia', 'Historia'],
    tags: ['Trabajo en equipo', 'Superación', 'Hechos reales'],
    age_rating: '+16',
    synopsis:
      'En 1972, el vuelo 571 se estrella en los Andes. Los supervivientes deberán unirse más allá de lo imaginable para resistir al frío extremo.',
    poster_url: 'https://image.tmdb.org/t/p/w780/k7rEpSRHermico35FF93592020.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/vdpE5pjJVql5aD6pnzRqlFmgxXf.jpg',
    palette: { primary: '#60a5fa', secondary: '#0284c7', accent: '#f97316' },
    tmdb_id: 906126,
    source_provider: 'tmdb',
    status: 'published',
    display_order: 3,
  },
  {
    id: '11111111-1111-4111-8111-111111111104',
    title: 'Del revés 2 (Inside Out 2)',
    original_title: 'Inside Out 2',
    year: 2024,
    duration_minutes: 96,
    genres: ['Animación', 'Comedia', 'Familiar'],
    tags: ['Emociones', 'Adolescencia', 'Salud mental'],
    age_rating: 'TP',
    synopsis:
      'Riley entra en la adolescencia y la sede central de su mente recibe una visita inesperada: Ansiedad, Envidia, Vergüenza y Ennui.',
    poster_url: 'https://image.tmdb.org/t/p/w780/x2L3j2W2wX5e6yV6bH6rM7j3c0z.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/stKGOm8UyhuLPR9sZLjs5AkmncA.jpg',
    palette: { primary: '#fb923c', secondary: '#ec4899', accent: '#facc15' },
    tmdb_id: 1022789,
    source_provider: 'tmdb',
    status: 'published',
    display_order: 4,
  },
  {
    id: '11111111-1111-4111-8111-111111111105',
    title: 'El viaje de Chihiro',
    original_title: 'Sen to Chihiro no kamikakushi',
    year: 2001,
    duration_minutes: 125,
    genres: ['Animación', 'Fantasía', 'Aventura'],
    tags: ['Studio Ghibli', 'Crecimiento', 'Ecología'],
    age_rating: 'TP',
    synopsis:
      'Chihiro queda atrapada en un mundo mágico habitado por espíritus y dioses. Con valentía e ingenio luchará por liberar a su familia.',
    poster_url: 'https://image.tmdb.org/t/p/w780/vlsi5iZcfDChK54kK0yW2N9u8bK.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/Ab8mkHmkYADjU7wQiOkia9BzGvS.jpg',
    palette: { primary: '#10b981', secondary: '#ec4899', accent: '#fbbf24' },
    tmdb_id: 129,
    source_provider: 'tmdb',
    status: 'published',
    display_order: 5,
  },
  {
    id: '11111111-1111-4111-8111-111111111106',
    title: 'El chico y la garza',
    original_title: 'Kimitachi wa dô ikiru ka',
    year: 2023,
    duration_minutes: 124,
    genres: ['Animación', 'Fantasía', 'Drama'],
    tags: ['Duelo', 'Imaginación', 'Ghibli'],
    age_rating: '+12',
    synopsis:
      'Tras una pérdida familiar, Mahito sigue a una misteriosa garza parlante hacia una torre abandonada que conecta dos mundos.',
    poster_url: 'https://image.tmdb.org/t/p/w780/f4oZTcfGrVTXKTWg157AwikXqmP.jpg',
    backdrop_url: 'https://image.tmdb.org/t/p/w1280/75nSb1fbWooipNPx5bU454X2D6I.jpg',
    palette: { primary: '#0ea5e9', secondary: '#14b8a6', accent: '#f59e0b' },
    tmdb_id: 508883,
    source_provider: 'tmdb',
    status: 'draft',
    display_order: 6,
  },
];

interface StoredVote {
  id: string;
  nombre: string;
  apellidos: string;
  curso: string;
  email: string;
  huella_alumno: string;
  rankedMovieIds: string[];
  created_at: string;
}

interface StoredOtp {
  id: string;
  email: string;
  nombre: string;
  apellidos: string;
  curso: string;
  huella_alumno: string;
  code: string;
  pending_movie_ids: string[];
  attempts: number;
  expires_at: number;
  last_sent_at: number;
  used: boolean;
}

// Votos iniciales realistas diseñados para demostrar divergencia Mayoría Simple vs Borda
const M1 = '11111111-1111-4111-8111-111111111101'; // Interstellar
const M2 = '11111111-1111-4111-8111-111111111102'; // Spider-Man (Consenso)
const M3 = '11111111-1111-4111-8111-111111111103'; // La sociedad de la nieve (1ª opción polarizante)
const M4 = '11111111-1111-4111-8111-111111111104'; // Del revés 2
const M5 = '11111111-1111-4111-8111-111111111105'; // Chihiro

let votes: StoredVote[] = [
  { id: 'v01', nombre: 'lucia', apellidos: 'martinez', curso: '1º ESO A', email: 'lucia.m@demo.es', huella_alumno: 'lucia_martinez_1º ESO A', rankedMovieIds: [M3, M2, M4], created_at: '2026-11-15T09:10:00Z' },
  { id: 'v02', nombre: 'hugo', apellidos: 'sanchez', curso: '1º ESO A', email: 'hugo.s@demo.es', huella_alumno: 'hugo_sanchez_1º ESO A', rankedMovieIds: [M3, M2, M1], created_at: '2026-11-15T09:14:00Z' },
  { id: 'v03', nombre: 'sofia', apellidos: 'ruiz', curso: '1º ESO B', email: 'sofia.r@demo.es', huella_alumno: 'sofia_ruiz_1º ESO B', rankedMovieIds: [M3, M4, M2], created_at: '2026-11-15T09:20:00Z' },
  { id: 'v04', nombre: 'mateo', apellidos: 'gomez', curso: '1º ESO B', email: 'mateo.g@demo.es', huella_alumno: 'mateo_gomez_1º ESO B', rankedMovieIds: [M3, M1, M2], created_at: '2026-11-15T09:25:00Z' },
  { id: 'v05', nombre: 'valeria', apellidos: 'diaz', curso: '2º ESO A', email: 'valeria.d@demo.es', huella_alumno: 'valeria_diaz_2º ESO A', rankedMovieIds: [M3, M2, M5], created_at: '2026-11-15T09:30:00Z' },
  { id: 'v06', nombre: 'daniel', apellidos: 'moreno', curso: '2º ESO A', email: 'daniel.m@demo.es', huella_alumno: 'daniel_moreno_2º ESO A', rankedMovieIds: [M3, M2, M1], created_at: '2026-11-15T09:35:00Z' },
  { id: 'v07', nombre: 'paula', apellidos: 'alvarez', curso: '2º ESO B', email: 'paula.a@demo.es', huella_alumno: 'paula_alvarez_2º ESO B', rankedMovieIds: [M3, M4, M2], created_at: '2026-11-15T09:42:00Z' },
  { id: 'v08', nombre: 'leo', apellidos: 'navarro', curso: '2º ESO B', email: 'leo.n@demo.es', huella_alumno: 'leo_navarro_2º ESO B', rankedMovieIds: [M2, M1, M4], created_at: '2026-11-15T10:02:00Z' },
  { id: 'v09', nombre: 'claudia', apellidos: 'torres', curso: '3º ESO A', email: 'claudia.t@demo.es', huella_alumno: 'claudia_torres_3º ESO A', rankedMovieIds: [M2, M4, M5], created_at: '2026-11-15T10:12:00Z' },
  { id: 'v10', nombre: 'pablo', apellidos: 'romero', curso: '3º ESO A', email: 'pablo.r@demo.es', huella_alumno: 'pablo_romero_3º ESO A', rankedMovieIds: [M2, M1, M5], created_at: '2026-11-15T10:18:00Z' },
  { id: 'v11', nombre: 'alba', apellidos: 'serrano', curso: '3º ESO B', email: 'alba.s@demo.es', huella_alumno: 'alba_serrano_3º ESO B', rankedMovieIds: [M2, M5, M4], created_at: '2026-11-15T10:22:00Z' },
  { id: 'v12', nombre: 'adrian', apellidos: 'molina', curso: '3º ESO B', email: 'adrian.m@demo.es', huella_alumno: 'adrian_molina_3º ESO B', rankedMovieIds: [M2, M1, M4], created_at: '2026-11-15T10:30:00Z' },
  { id: 'v13', nombre: 'julia', apellidos: 'castro', curso: '4º ESO A', email: 'julia.c@demo.es', huella_alumno: 'julia_castro_4º ESO A', rankedMovieIds: [M1, M2, M5], created_at: '2026-11-15T11:05:00Z' },
  { id: 'v14', nombre: 'marcos', apellidos: 'ortega', curso: '4º ESO A', email: 'marcos.o@demo.es', huella_alumno: 'marcos_ortega_4º ESO A', rankedMovieIds: [M1, M2, M4], created_at: '2026-11-15T11:12:00Z' },
  { id: 'v15', nombre: 'elena', apellidos: 'rubio', curso: '4º ESO B', email: 'elena.r@demo.es', huella_alumno: 'elena_rubio_4º ESO B', rankedMovieIds: [M4, M2, M5], created_at: '2026-11-15T11:20:00Z' },
  { id: 'v16', nombre: 'diego', apellidos: 'marin', curso: '4º ESO B', email: 'diego.m@demo.es', huella_alumno: 'diego_marin_4º ESO B', rankedMovieIds: [M5, M2, M1], created_at: '2026-11-15T11:30:00Z' },
];

const otpStore = new Map<string, StoredOtp>();

const CATALOG_ENRICH_PRESETS: Record<string, Partial<Movie>> = {
  'spider-man: un nuevo universo': {
    title: 'Spider-Man: Un nuevo universo',
    year: 2018,
    duration_minutes: 117,
    genres: ['Animación', 'Acción', 'Aventura'],
    tags: ['Cómics', 'Superación', 'Multiverso'],
    age_rating: '+7',
    synopsis:
      'Miles Morales descubre que no es el único Spider-Man y debe aprender a dominar sus poderes junto a héroes de otras dimensiones.',
    poster_url: 'https://image.tmdb.org/t/p/w780/x7h8Y4Q5t9gN5oJ2nV5lP4w9w9Q.jpg',
    palette: { primary: '#ef4444', secondary: '#3b82f6', accent: '#facc15' },
  },
  'coco': {
    title: 'Coco',
    year: 2017,
    duration_minutes: 105,
    genres: ['Animación', 'Música', 'Familiar'],
    tags: ['Familia', 'Cultura', 'Sueños'],
    age_rating: 'TP',
    synopsis:
      'Miguel sueña con ser músico a pesar de la prohibición familiar y acaba viajando a la colorida Tierra de los Muertos para descubrir su historia.',
    poster_url: 'https://image.tmdb.org/t/p/w780/lUZZh46L3b76K2sI4vK1d9E0xL.jpg',
    palette: { primary: '#f97316', secondary: '#a855f7', accent: '#22d3ee' },
  },
  'campeones': {
    title: 'Campeones',
    year: 2018,
    duration_minutes: 124,
    genres: ['Comedia', 'Drama', 'Deportes'],
    tags: ['Inclusión', 'Empatía', 'Baloncesto'],
    age_rating: 'TP',
    synopsis:
      'Un entrenador profesional en horas bajas termina dirigiendo un equipo de baloncesto formado por personas con discapacidad intelectual que cambiará su vida.',
    palette: { primary: '#f59e0b', secondary: '#0ea5e9', accent: '#10b981' },
  },
  'wall-e': {
    title: 'WALL·E',
    year: 2008,
    duration_minutes: 98,
    genres: ['Animación', 'Ciencia ficción'],
    tags: ['Ecología', 'Robótica', 'Futuro'],
    age_rating: 'TP',
    synopsis:
      'Un pequeño robot compactador de basura en una Tierra abandonada emprende una aventura espacial que decidirá el futuro de la humanidad.',
    palette: { primary: '#f59e0b', secondary: '#38bdf8', accent: '#34d399' },
  },
};

function makeUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function assertAdmin(secret: string): void {
  if (secret.trim() !== DEMO_ADMIN_SECRET) {
    throw new Error('Clave de administración incorrecta (en Modo Demo usa: demo1234).');
  }
}

export const sandboxBackend = {
  async getBallotData(): Promise<{ settings: VotingSettings; movies: Movie[] }> {
    return {
      settings: { ...settings },
      movies: movies
        .filter((m) => m.status === 'published')
        .sort((a, b) => a.display_order - b.display_order),
    };
  },

  async requestOtp(payload: {
    nombre: string;
    apellidos: string;
    curso: string;
    email: string;
    movie_ids: string[];
  }): Promise<OtpChallenge> {
    if (!settings.voting_open) {
      throw new Error('La votación está cerrada en este momento.');
    }

    if (payload.movie_ids.length !== settings.top_k) {
      throw new Error(`Debes ordenar exactamente ${settings.top_k} películas.`);
    }

    const identity = validateVoterForm(
      payload,
      settings.allowed_classes,
      settings.allowed_email_domains
    );
    if (!identity.valid || !identity.normalized) {
      throw new Error(identity.error || 'Datos inválidos.');
    }

    const { nombre, apellidos, curso, email, huellaAlumno } = identity.normalized;

    if (votes.some((v) => v.email === email)) {
      throw new Error('Ya existe un voto confirmado con este correo electrónico.');
    }
    if (votes.some((v) => v.huella_alumno === huellaAlumno)) {
      throw new Error(
        'Este alumno o alumna ya ha emitido su voto en este curso (huella duplicada aunque uses otro correo).'
      );
    }

    // Rate limit 60s
    const activeRecent = Array.from(otpStore.values())
      .filter(
        (t) =>
          !t.used &&
          (t.email === email || t.huella_alumno === huellaAlumno)
      )
      .sort((a, b) => b.last_sent_at - a.last_sent_at)[0];

    if (activeRecent) {
      const elapsed = Math.floor((Date.now() - activeRecent.last_sent_at) / 1000);
      if (elapsed < 60) {
        throw new Error(
          `Debes esperar ${60 - elapsed} segundos antes de solicitar otro código.`
        );
      }
    }

    const code = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    const challengeId = makeUuid();
    otpStore.set(challengeId, {
      id: challengeId,
      email,
      nombre,
      apellidos,
      curso,
      huella_alumno: huellaAlumno,
      code,
      pending_movie_ids: [...payload.movie_ids],
      attempts: 0,
      expires_at: Date.now() + 10 * 60 * 1000,
      last_sent_at: Date.now(),
      used: false,
    });

    return {
      challenge_id: challengeId,
      expires_in_seconds: 600,
      cooldown_seconds: 60,
      email,
      provider: 'demo-sandbox',
      dev_otp_preview: code,
    };
  },

  async verifyOtp(payload: {
    challenge_id: string;
    code: string;
  }): Promise<Omit<VoteReceipt, 'rankedMovies'>> {
    const token = otpStore.get(payload.challenge_id);
    if (!token) throw new Error('Solicitud de verificación no encontrada.');
    if (token.used) throw new Error('Este código ya fue utilizado.');
    if (Date.now() > token.expires_at) {
      throw new Error('El código ha caducado (10 min). Solicita uno nuevo.');
    }
    if (token.attempts >= 3) {
      throw new Error('Has superado el máximo de 3 intentos. Solicita un código nuevo.');
    }

    if (token.code !== payload.code.trim()) {
      token.attempts += 1;
      const remaining = Math.max(0, 3 - token.attempts);
      throw new Error(
        remaining === 0
          ? 'Código incorrecto. Has agotado los 3 intentos; solicita un nuevo código.'
          : `Código incorrecto. Te quedan ${remaining} intento(s).`
      );
    }

    if (votes.some((v) => v.email === token.email)) {
      token.used = true;
      throw new Error('Ya existe un voto confirmado con este correo electrónico.');
    }
    if (votes.some((v) => v.huella_alumno === token.huella_alumno)) {
      token.used = true;
      throw new Error('Este alumno o alumna ya ha emitido su voto en este curso.');
    }

    const voteId = makeUuid();
    const createdAt = new Date().toISOString();
    votes.push({
      id: voteId,
      nombre: token.nombre,
      apellidos: token.apellidos,
      curso: token.curso,
      email: token.email,
      huella_alumno: token.huella_alumno,
      rankedMovieIds: token.pending_movie_ids,
      created_at: createdAt,
    });
    token.used = true;

    return {
      vote_id: voteId,
      curso: token.curso,
      created_at: createdAt,
    };
  },

  async checkAdminSecret(secret: string): Promise<boolean> {
    assertAdmin(secret);
    return true;
  },

  async adminListMovies(secret: string): Promise<{
    movies: Movie[];
    settings: VotingSettings;
    total_votes: number;
  }> {
    assertAdmin(secret);
    return {
      movies: [...movies].sort((a, b) => a.display_order - b.display_order),
      settings: { ...settings },
      total_votes: votes.length,
    };
  },

  async adminEnrichBatch(secret: string, titles: string[]): Promise<Movie[]> {
    assertAdmin(secret);
    await new Promise((r) => setTimeout(r, 650));

    const created: Movie[] = titles
      .map((t) => t.trim())
      .filter(Boolean)
      .map((rawTitle, i) => {
        const preset = CATALOG_ENRICH_PRESETS[rawTitle.toLowerCase()];
        const palettes = [
          { primary: '#38bdf8', secondary: '#8b5cf6', accent: '#f59e0b' },
          { primary: '#f43f5e', secondary: '#fb923c', accent: '#22d3ee' },
          { primary: '#10b981', secondary: '#0284c7', accent: '#facc15' },
        ];
        const newMovie: Movie = {
          id: makeUuid(),
          title: preset?.title ?? rawTitle,
          original_title: preset?.title ?? rawTitle,
          year: preset?.year ?? 2024,
          duration_minutes: preset?.duration_minutes ?? 115,
          genres: preset?.genres ?? ['CineFórum', 'Drama'],
          tags: preset?.tags ?? ['Debate ESO', 'Valores'],
          age_rating: preset?.age_rating ?? '+12',
          synopsis:
            preset?.synopsis ??
            `Ficha generada automáticamente en borrador para "${rawTitle}". Conecta TMDB_API_KEY en Supabase para descargar su póster oficial HD.`,
          poster_url: preset?.poster_url ?? '',
          backdrop_url: preset?.backdrop_url ?? '',
          palette: preset?.palette ?? palettes[i % palettes.length],
          source_provider: 'gemini',
          status: 'draft',
          display_order: movies.length + i + 1,
        };
        return newMovie;
      });

    movies = [...created, ...movies];
    return created;
  },

  async adminUpdateMovie(
    secret: string,
    id: string,
    patch: Partial<Movie>
  ): Promise<Movie> {
    assertAdmin(secret);
    const idx = movies.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error('Película no encontrada.');
    movies[idx] = { ...movies[idx], ...patch };
    return movies[idx];
  },

  async adminPublishBillboard(
    secret: string,
    movieIds?: string[]
  ): Promise<Movie[]> {
    assertAdmin(secret);
    const targetSet = movieIds && movieIds.length > 0 ? new Set(movieIds) : null;
    const updated: Movie[] = [];
    movies = movies.map((m) => {
      if ((targetSet && targetSet.has(m.id)) || (!targetSet && m.status === 'draft')) {
        const pub = { ...m, status: 'published' as const };
        updated.push(pub);
        return pub;
      }
      return m;
    });
    return updated;
  },

  async adminDeleteMovie(secret: string, id: string): Promise<{ archived?: boolean }> {
    assertAdmin(secret);
    const hasVotes = votes.some((v) => v.rankedMovieIds.includes(id));
    if (hasVotes) {
      movies = movies.map((m) => (m.id === id ? { ...m, status: 'archived' } : m));
      return { archived: true };
    }
    movies = movies.filter((m) => m.id !== id);
    return { archived: false };
  },

  async adminUpdateSettings(
    secret: string,
    patch: Partial<VotingSettings>
  ): Promise<VotingSettings> {
    assertAdmin(secret);
    settings = { ...settings, ...patch };
    return { ...settings };
  },

  async adminResetVotes(secret: string): Promise<void> {
    assertAdmin(secret);
    votes = [];
    otpStore.clear();
  },

  async adminDeleteVote(secret: string, voteId: string): Promise<void> {
    assertAdmin(secret);
    votes = votes.filter((v) => v.id !== voteId);
  },

  async adminUpdateVote(
    secret: string,
    voteId: string,
    patch: { curso?: string; ranked_movie_ids?: string[] }
  ): Promise<void> {
    assertAdmin(secret);
    const idx = votes.findIndex((v) => v.id === voteId);
    if (idx === -1) throw new Error('Voto no encontrado.');
    const current = votes[idx];
    const nextCurso = patch.curso ? patch.curso.trim() : current.curso;
    const nextRanked = patch.ranked_movie_ids ?? current.rankedMovieIds;
    votes[idx] = {
      ...current,
      curso: nextCurso,
      huella_alumno: `${current.nombre}_${current.apellidos}_${nextCurso}`,
      rankedMovieIds: nextRanked,
    };
  },

  async adminGetResults(secret: string): Promise<DashboardResults> {
    assertAdmin(secret);
    const totalVotes = votes.length;

    const classMap = new Map<string, number>();
    for (const c of settings.allowed_classes) classMap.set(c, 0);
    for (const v of votes) {
      classMap.set(v.curso, (classMap.get(v.curso) ?? 0) + 1);
    }

    const participationByClass = Array.from(classMap.entries()).map(([curso, count]) => ({
      curso,
      count,
      percentage: totalVotes > 0 ? Math.round((count / totalVotes) * 1000) / 10 : 0,
    }));

    const activeMovies = movies.filter(
      (m) => m.status === 'published' || m.status === 'archived'
    );

    const statsMap = new Map(
      activeMovies.map((m) => [
        m.id,
        {
          movie_id: m.id,
          title: m.title,
          poster_url: m.poster_url,
          palette: m.palette,
          year: m.year,
          status: m.status,
          total_points: 0,
          first_choice_votes: 0,
          top_k_appearances: 0,
          rank_breakdown: {} as Record<number, number>,
        },
      ])
    );

    let grandTotalPoints = 0;
    for (const v of votes) {
      v.rankedMovieIds.slice(0, settings.top_k).forEach((movieId, idx) => {
        const entry = statsMap.get(movieId);
        if (!entry) return;
        const rank = idx + 1;
        const pts = getBordaPoints(rank, settings.top_k, settings.scoring_mode);
        entry.total_points = Math.round((entry.total_points + pts) * 100) / 100;
        grandTotalPoints = Math.round((grandTotalPoints + pts) * 100) / 100;
        entry.top_k_appearances += 1;
        if (rank === 1) entry.first_choice_votes += 1;
        entry.rank_breakdown[rank] = (entry.rank_breakdown[rank] ?? 0) + 1;
      });
    }

    const leaderboard = Array.from(statsMap.values())
      .map((item) => ({
        ...item,
        first_choice_pct:
          totalVotes > 0
            ? Math.round((item.first_choice_votes / totalVotes) * 1000) / 10
            : 0,
        top_k_pct:
          totalVotes > 0
            ? Math.round((item.top_k_appearances / totalVotes) * 1000) / 10
            : 0,
        borda_share_pct:
          grandTotalPoints > 0
            ? Math.round((item.total_points / grandTotalPoints) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => {
        if (b.total_points !== a.total_points) return b.total_points - a.total_points;
        if (b.first_choice_votes !== a.first_choice_votes) {
          return b.first_choice_votes - a.first_choice_votes;
        }
        return b.top_k_appearances - a.top_k_appearances;
      });

    const fptpWinner =
      [...leaderboard].sort((a, b) => b.first_choice_votes - a.first_choice_votes)[0] ??
      null;
    const bordaWinner = leaderboard[0] ?? null;
    const consensusWinner =
      [...leaderboard].sort((a, b) => b.top_k_appearances - a.top_k_appearances)[0] ??
      null;

    const diverged = Boolean(
      bordaWinner && fptpWinner && bordaWinner.movie_id !== fptpWinner.movie_id
    );

    const insightTitle =
      totalVotes === 0
        ? 'Sin votos todavía'
        : diverged
          ? '¡El Voto Preferencial ha evitado la polarización!'
          : 'Consenso sólido y primera opción alineada';

    const insightText =
      totalVotes === 0
        ? 'Emite un voto de prueba para actualizar las métricas en tiempo real.'
        : diverged && fptpWinner && bordaWinner
          ? `Con Mayoría Simple habría ganado "${fptpWinner.title}" con solo un ${fptpWinner.first_choice_pct}% de primeras opciones. Sin embargo, el Recuento Borda premia a "${bordaWinner.title}" porque aparece en el TOP ${settings.top_k} del ${bordaWinner.top_k_pct}% del alumnado, logrando mayor consenso real en el aula.`
          : bordaWinner
            ? `"${bordaWinner.title}" lidera tanto en primeras elecciones (${bordaWinner.first_choice_pct}%) como en presencia global dentro del TOP ${settings.top_k} (${bordaWinner.top_k_pct}%).`
            : '';

    const movieTitleMap = new Map(movies.map((m) => [m.id, m.title]));
    const votesLog = [...votes]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((v) => ({
        id: v.id,
        nombre: v.nombre,
        apellidos: v.apellidos,
        curso: v.curso,
        email: v.email,
        created_at: v.created_at,
        choices: v.rankedMovieIds.slice(0, settings.top_k).map((movieId, idx) => ({
          rank_position: idx + 1,
          movie_id: movieId,
          title: movieTitleMap.get(movieId) ?? 'Película',
        })),
      }));

    return {
      settings: { ...settings },
      total_votes: totalVotes,
      grand_total_points: grandTotalPoints,
      participation_by_class: participationByClass,
      leaderboard,
      votes_log: votesLog,
      pedagogical_comparison: {
        fptp_winner: fptpWinner,
        borda_winner: bordaWinner,
        consensus_winner: consensusWinner,
        diverged,
        insight_title: insightTitle,
        insight_text: insightText,
      },
    };
  },
};
