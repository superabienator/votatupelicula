import {
  ChevronUp,
  Clapperboard,
  Film,
  HelpCircle,
  Lock,
  Popcorn,
  Search,
  Sparkles,
  Ticket,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminPortalModal } from './components/AdminPortalModal';
import { CinemaDecorations, FilmStripDivider } from './components/CinemaDecorations';
import { CinemaTicketModal } from './components/CinemaTicketModal';
import { CivicEducationModal } from './components/CivicEducationModal';
import { MovieCard } from './components/MovieCard';
import { MovieDetailModal } from './components/MovieDetailModal';
import { RankingDock } from './components/RankingDock';
import { VoterAuthModal } from './components/VoterAuthModal';
import { IS_SANDBOX_MODE, cinemaApi } from './services/api';
import type { Movie, MoviePalette, VotingSettings } from './types/cinema';
import { getScoringWeightsList } from './utils/borda';
import { DEFAULT_PALETTE, blendPalettes, hexToRgba } from './utils/colorExtractor';
import { assignMovieRank, moveMovieByStep } from './utils/ranking';

export function App() {
  const [settings, setSettings] = useState<VotingSettings | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Estado de votación en memoria (sin cookies / localStorage / sessionStorage)
  const [rankedMovies, setRankedMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState<string>('Todas');

  // Estado visual dinámico
  const [hoveredMovie, setHoveredMovie] = useState<Movie | null>(null);
  const [inspectedMovie, setInspectedMovie] = useState<Movie | null>(null);

  // Modales
  const [civicModalOpen, setCivicModalOpen] = useState(false);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const dockRef = useRef<HTMLDivElement | null>(null);

  const fetchBallot = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await cinemaApi.getBallotData();
      setSettings(data.settings);
      setMovies(data.movies);
      // Limpia películas que hayan pasado a borrador o excedan el top_k actualizado
      setRankedMovies((prev) =>
        prev
          .filter((p) => data.movies.some((m) => m.id === p.id))
          .slice(0, data.settings.top_k)
      );
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'No se pudo cargar la cartelera.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBallot();
  }, [fetchBallot]);

  // Motor de tematización dinámica (película principal o blend dinámico)
  const activePalette: MoviePalette = useMemo(() => {
    if (!settings || movies.length === 0) return DEFAULT_PALETTE;

    if (settings.theme_mode === 'featured' && settings.featured_movie_id) {
      const featured = movies.find((m) => m.id === settings.featured_movie_id);
      if (featured) return featured.palette;
    }

    if (hoveredMovie) return hoveredMovie.palette;
    if (rankedMovies[0]) return rankedMovies[0].palette;

    return blendPalettes(movies.map((m) => m.palette));
  }, [settings, movies, hoveredMovie, rankedMovies]);

  // Aplicar paleta dinámica a CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', activePalette.primary);
    root.style.setProperty('--theme-secondary', activePalette.secondary);
    root.style.setProperty('--theme-accent', activePalette.accent);
  }, [activePalette]);

  const allGenres = useMemo(() => {
    const set = new Set<string>(['Todas']);
    movies.forEach((m) => m.genres.forEach((g) => set.add(g)));
    return Array.from(set);
  }, [movies]);

  const filteredMovies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return movies.filter((m) => {
      const matchesGenre =
        selectedGenre === 'Todas' || m.genres.includes(selectedGenre);
      const matchesQuery =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.synopsis.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q));
      return matchesGenre && matchesQuery;
    });
  }, [movies, searchQuery, selectedGenre]);

  const topK = settings?.top_k ?? 3;
  const scoringMode = settings?.scoring_mode ?? 'classic';
  const weights = getScoringWeightsList(topK, scoringMode);

  function handleAssignRank(movieId: string, rank: number) {
    const movie = movies.find((m) => m.id === movieId);
    if (!movie) return;
    setRankedMovies((prev) => assignMovieRank(prev, movie, rank, topK));
  }

  function handleMoveStep(index: number, delta: -1 | 1) {
    setRankedMovies((prev) => moveMovieByStep(prev, index, delta));
  }

  function handleRemoveMovie(movieId: string) {
    setRankedMovies((prev) => prev.filter((m) => m.id !== movieId));
  }

  function handleCloseAuthAndResetIfDone() {
    setAuthModalOpen(false);
  }

  return (
    <div className="cinema-noise relative min-h-screen overflow-x-hidden bg-[#12172e] text-white">
      {/* Iluminación ambiental luminosa y dinámica derivada de la cartelera */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 transition-all duration-700"
        style={{
          background: `
            radial-gradient(circle at 14% 12%, ${hexToRgba(activePalette.primary, 0.34)} 0%, transparent 48%),
            radial-gradient(circle at 86% 18%, ${hexToRgba(activePalette.secondary, 0.28)} 0%, transparent 45%),
            radial-gradient(circle at 50% 88%, ${hexToRgba(activePalette.accent, 0.20)} 0%, transparent 50%)
          `,
        }}
      />

      {/* Motivos cinematográficos decorativos */}
      <CinemaDecorations />

      {/* BARRA SUPERIOR SIEMPRE ACCESIBLE */}
      <header className="sticky top-0 z-40 border-b border-white/15 bg-[#141a34]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            {!logoFailed ? (
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white/95 p-1 shadow-lg ring-2 ring-amber-300/60">
                <img
                  src="./logo.png"
                  alt="Logo VotaTuPelícula"
                  onError={() => setLogoFailed(true)}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-slate-950 shadow-lg ring-2 ring-white/25 transition-colors duration-500"
                style={{
                  background: `linear-gradient(135deg, ${activePalette.accent}, ${activePalette.primary})`,
                }}
              >
                <Clapperboard className="h-5 w-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-extrabold tracking-tight text-white sm:text-lg">
                  VotaTuPelícula
                </span>
                {IS_SANDBOX_MODE && (
                  <span className="hidden rounded-full border border-amber-300/45 bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-200 sm:inline-block">
                    Modo Demo Local
                  </span>
                )}
              </div>
              <p className="hidden text-[11px] text-sky-200/80 sm:block">
                🎬 CineFórum Democrático · Educación Secundaria (ESO)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón didáctico obligatorio accesible en todo momento */}
            <button
              type="button"
              onClick={() => setCivicModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-300/45 bg-sky-400/20 px-3 py-2 text-xs font-bold text-sky-100 shadow-sm transition hover:bg-sky-400/30"
            >
              <HelpCircle className="h-4 w-4 text-sky-200" />
              <span>¿Cómo funciona tu voto?</span>
            </button>

            <button
              type="button"
              onClick={() => setAdminModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20"
            >
              <Lock className="h-3.5 w-3.5 text-amber-300" />
              <span className="hidden sm:inline">Profesorado / Resultados</span>
              <span className="sm:hidden">Admin</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:pb-16">
        {/* HERO DE CARTELERA CON TIRA DE CINE */}
        <section className="cinema-marquee mb-8 overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-[#1d2549]/95 via-[#181f3d]/90 to-[#241b42]/95 backdrop-blur-md">
          <FilmStripDivider />

          <div className="p-5 sm:p-7">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold"
                    style={{
                      borderColor: hexToRgba(activePalette.accent, 0.55),
                      backgroundColor: hexToRgba(activePalette.accent, 0.2),
                      color: '#fef08a',
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Voto Preferencial · Recuento Borda
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-rose-300/35 bg-rose-400/15 px-3 py-1 text-xs font-bold text-rose-200">
                    <Popcorn className="h-3.5 w-3.5" />
                    ¡Elige tu TOP {topK}!
                  </span>
                  {settings && !settings.voting_open && (
                    <span className="rounded-full border border-rose-500/45 bg-rose-500/20 px-3 py-1 text-xs font-bold text-rose-200">
                      Urna cerrada
                    </span>
                  )}
                </div>

                <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  {settings?.campaign_title || 'CineFórum ESO · Votación de Cartelera'}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-200 sm:text-base">
                  {settings?.subtitle ||
                    'Elige y ordena tus películas favoritas. Todas tus preferencias suman puntos.'}
                </p>
              </div>

              {/* Leyenda de puntuación Borda vigente */}
              <div className="flex flex-col gap-2 rounded-2xl border border-white/15 bg-black/25 p-3.5 backdrop-blur-sm">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-200">
                  <Film className="h-3.5 w-3.5" />
                  Valor de tu TOP {topK}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {weights.map((w) => (
                    <span
                      key={w.rank}
                      className="rounded-xl border border-amber-300/30 bg-amber-400/15 px-2.5 py-1 font-mono text-xs font-bold text-amber-200"
                    >
                      {w.rank}º = {w.points} {w.points === 1 ? 'pt' : 'pts'}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Barra de filtro rápido */}
            {movies.length > 0 && (
              <div className="mt-6 flex flex-col gap-3 border-t border-white/15 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-sky-200/70" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar título, género o tema…"
                    className="w-full rounded-xl border border-white/20 bg-white/10 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-300 focus:border-amber-300 focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {allGenres.map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => setSelectedGenre(genre)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                        selectedGenre === genre
                          ? 'bg-amber-300 text-slate-950 shadow'
                          : 'border border-white/15 bg-white/10 text-slate-100 hover:bg-white/20'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <FilmStripDivider />
        </section>

        {/* ESTADO DE CARGA / ERROR */}
        {loading && (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-56 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]"
              />
            ))}
          </div>
        )}

        {!loading && loadError && (
          <div className="rounded-3xl border border-rose-500/35 bg-rose-950/20 p-8 text-center">
            <p className="text-sm font-semibold text-rose-200">{loadError}</p>
            <button
              type="button"
              onClick={fetchBallot}
              className="mt-4 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-950"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* GRID DE PELÍCULAS + DOCK DE RANKING */}
        {!loading && !loadError && (
          <div className="grid items-start gap-7 lg:grid-cols-[1fr_360px]">
            <div>
              {filteredMovies.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center text-sm text-slate-400">
                  {movies.length === 0
                    ? 'Aún no hay películas publicadas en la cartelera. El profesorado puede publicarlas desde "Profesorado / Resultados".'
                    : 'No hay películas que coincidan con tu búsqueda.'}
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {filteredMovies.map((movie) => {
                    const idx = rankedMovies.findIndex((m) => m.id === movie.id);
                    return (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        topK={topK}
                        scoringMode={scoringMode}
                        assignedRank={idx === -1 ? null : idx + 1}
                        onAssignRank={handleAssignRank}
                        onInspectMovie={setInspectedMovie}
                        onHoverMovie={setHoveredMovie}
                        disabled={!settings?.voting_open}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Columna derecha / inferior: Mi TOP */}
            <div ref={dockRef} className="lg:sticky lg:top-20">
              <RankingDock
                rankedMovies={rankedMovies}
                topK={topK}
                scoringMode={scoringMode}
                votingOpen={Boolean(settings?.voting_open)}
                onReorder={setRankedMovies}
                onMoveStep={handleMoveStep}
                onRemove={handleRemoveMovie}
                onClearAll={() => setRankedMovies([])}
                onConfirmOrder={() => setTicketModalOpen(true)}
              />
            </div>
          </div>
        )}
      </main>

      {/* Barra flotante móvil para saltar rápido a "Mi TOP" o abrir la entrada */}
      {!loading && movies.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/15 bg-[#090c16]/95 px-4 py-3 backdrop-blur-xl lg:hidden">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
            <div>
              <p className="font-display text-xs font-bold text-white">
                Tu TOP {topK}: {rankedMovies.length} / {topK} elegidas
              </p>
              <p className="text-[11px] text-slate-400">
                {rankedMovies.length === topK
                  ? '¡Lista completa! Revisa tu entrada.'
                  : 'Toca 1º, 2º, 3º en cada película.'}
              </p>
            </div>
            {rankedMovies.length === topK && settings?.voting_open ? (
              <button
                type="button"
                onClick={() => setTicketModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${activePalette.accent}, ${activePalette.primary})`,
                }}
              >
                <Ticket className="h-4 w-4" />
                Votar ahora
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  dockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
                className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-bold text-white"
              >
                <ChevronUp className="h-4 w-4" />
                Ver mi TOP
              </button>
            )}
          </div>
        </div>
      )}

      {/* MODALES */}
      <CivicEducationModal
        open={civicModalOpen}
        onClose={() => setCivicModalOpen(false)}
        topK={topK}
        scoringMode={scoringMode}
      />

      <MovieDetailModal
        movie={inspectedMovie}
        topK={topK}
        scoringMode={scoringMode}
        assignedRank={
          inspectedMovie
            ? (() => {
                const i = rankedMovies.findIndex((m) => m.id === inspectedMovie.id);
                return i === -1 ? null : i + 1;
              })()
            : null
        }
        onAssignRank={handleAssignRank}
        onClose={() => setInspectedMovie(null)}
      />

      <CinemaTicketModal
        open={ticketModalOpen}
        campaignTitle={settings?.campaign_title || 'CineFórum ESO'}
        rankedMovies={rankedMovies}
        topK={topK}
        scoringMode={scoringMode}
        onBackToEdit={() => setTicketModalOpen(false)}
        onProceedToAuth={() => {
          setTicketModalOpen(false);
          setAuthModalOpen(true);
        }}
      />

      {settings && (
        <VoterAuthModal
          open={authModalOpen}
          settings={settings}
          rankedMovies={rankedMovies}
          onClose={handleCloseAuthAndResetIfDone}
          onVoteCompleted={() => {
            // Reinicia la papeleta en memoria para el siguiente compañero en el mismo equipo
            setRankedMovies([]);
          }}
        />
      )}

      <AdminPortalModal
        open={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        onPublicDataChanged={fetchBallot}
      />
    </div>
  );
}

export default App;
