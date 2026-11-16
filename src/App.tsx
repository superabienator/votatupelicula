import {
  ChevronUp,
  Clapperboard,
  HelpCircle,
  Lock,
  Search,
  Sparkles,
  Ticket,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AdminPortalModal } from './components/AdminPortalModal';
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
    <div className="cinema-noise relative min-h-screen overflow-x-hidden bg-[#07070d] text-slate-100">
      {/* Iluminación ambiental dinámica derivada de la cartelera */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 transition-all duration-700"
        style={{
          background: `
            radial-gradient(circle at 15% 12%, ${hexToRgba(activePalette.primary, 0.22)} 0%, transparent 45%),
            radial-gradient(circle at 88% 18%, ${hexToRgba(activePalette.secondary, 0.18)} 0%, transparent 42%),
            radial-gradient(circle at 50% 90%, ${hexToRgba(activePalette.accent, 0.12)} 0%, transparent 48%)
          `,
        }}
      />

      {/* BARRA SUPERIOR SIEMPRE ACCESIBLE */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07070d]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-950 shadow-lg transition-colors duration-500"
              style={{
                background: `linear-gradient(135deg, ${activePalette.accent}, ${activePalette.primary})`,
              }}
            >
              <Clapperboard className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-base font-extrabold tracking-tight text-white sm:text-lg">
                  VotaTuPelícula
                </span>
                {IS_SANDBOX_MODE && (
                  <span className="hidden rounded-full border border-amber-400/35 bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold text-amber-300 sm:inline-block">
                    Modo Demo Local
                  </span>
                )}
              </div>
              <p className="hidden text-[11px] text-slate-400 sm:block">
                CineFórum Democrático · Educación Secundaria (ESO)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Botón didáctico obligatorio accesible en todo momento */}
            <button
              type="button"
              onClick={() => setCivicModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-sky-400/35 bg-sky-500/15 px-3 py-2 text-xs font-bold text-sky-200 transition hover:bg-sky-500/25"
            >
              <HelpCircle className="h-4 w-4 text-sky-300" />
              <span>¿Cómo funciona tu voto?</span>
            </button>

            <button
              type="button"
              onClick={() => setAdminModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10"
            >
              <Lock className="h-3.5 w-3.5 text-amber-300" />
              <span className="hidden sm:inline">Profesorado / Resultados</span>
              <span className="sm:hidden">Admin</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:pb-16">
        {/* HERO DE CARTELERA */}
        <section className="mb-8 rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md sm:p-7">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold"
                  style={{
                    borderColor: hexToRgba(activePalette.accent, 0.45),
                    backgroundColor: hexToRgba(activePalette.accent, 0.14),
                    color: '#fde68a',
                  }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Voto Preferencial · Recuento Borda
                </span>
                {settings && !settings.voting_open && (
                  <span className="rounded-full border border-rose-500/40 bg-rose-500/15 px-3 py-1 text-xs font-bold text-rose-300">
                    Urna cerrada
                  </span>
                )}
              </div>

              <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                {settings?.campaign_title || 'CineFórum ESO · Votación de Cartelera'}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-300 sm:text-base">
                {settings?.subtitle ||
                  'Elige y ordena tus películas favoritas. Todas tus preferencias suman puntos.'}
              </p>
            </div>

            {/* Leyenda de puntuación Borda vigente */}
            <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-black/35 p-3.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Valor de tu TOP {topK}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {weights.map((w) => (
                  <span
                    key={w.rank}
                    className="rounded-xl border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-xs font-bold text-amber-300"
                  >
                    {w.rank}º = {w.points} {w.points === 1 ? 'pt' : 'pts'}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Barra de filtro rápido */}
          {movies.length > 0 && (
            <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar título, género o tema…"
                  className="w-full rounded-xl border border-white/15 bg-black/40 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {allGenres.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => setSelectedGenre(genre)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      selectedGenre === genre
                        ? 'bg-white text-slate-950'
                        : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          )}
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
