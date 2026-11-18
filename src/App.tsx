import { MotionConfig } from 'framer-motion';
import {
  BarChart3,
  ChevronDown,
  Clapperboard,
  Film,
  HelpCircle,
  Languages,
  Popcorn,
  ShieldCheck,
  Sparkles,
  Ticket,
  X,
} from 'lucide-react';
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CinemaDecorations, FilmStripDivider } from './components/CinemaDecorations';
import { CinemaTicketModal } from './components/CinemaTicketModal';
import { MovieCard } from './components/MovieCard';
import { MovieDetailModal } from './components/MovieDetailModal';
import { RankingDock } from './components/RankingDock';
import { TrailerPlayerModal } from './components/TrailerPlayerModal';
import { VoterAuthModal } from './components/VoterAuthModal';

const AdminPortalModal = lazy(() =>
  import('./components/AdminPortalModal').then((m) => ({ default: m.AdminPortalModal }))
);
const CivicEducationModal = lazy(() =>
  import('./components/CivicEducationModal').then((m) => ({ default: m.CivicEducationModal }))
);
const PublicStandingsModal = lazy(() =>
  import('./components/PublicStandingsModal').then((m) => ({
    default: m.PublicStandingsModal,
  }))
);
import { useI18n } from './i18n/I18nContext';
import {
  LANGUAGE_LABELS,
  localizeCampaignSubtitle,
  localizeCampaignTitle,
} from './i18n/translations';
import { IS_SANDBOX_MODE, cinemaApi } from './services/api';
import type {
  AppLanguage,
  Movie,
  MoviePalette,
  PublicStandings,
  VotingSettings,
} from './types/cinema';
import { getScoringWeightsList } from './utils/borda';
import { DEFAULT_PALETTE, blendPalettes, hexToRgba } from './utils/colorExtractor';
import { assignMovieRank, moveMovieByStep } from './utils/ranking';

function isAdminUrl(): boolean {
  if (typeof window === 'undefined') return false;
  const cleanPath = window.location.pathname.replace(/\/+$/, '').toLowerCase();
  return cleanPath === '/admin' || window.location.hash.toLowerCase() === '#/admin';
}

export function App() {
  const { lang, setLang, t } = useI18n();
  const [settings, setSettings] = useState<VotingSettings | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [publicStandings, setPublicStandings] = useState<PublicStandings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Estado de votación en memoria (sin cookies / localStorage / sessionStorage)
  const [rankedMovies, setRankedMovies] = useState<Movie[]>([]);

  // Estado visual dinámico
  const [hoveredMovie, setHoveredMovie] = useState<Movie | null>(null);
  const [inspectedMovie, setInspectedMovie] = useState<Movie | null>(null);
  const [trailerMovie, setTrailerMovie] = useState<Movie | null>(null);

  // Modales y avisos
  const [civicModalOpen, setCivicModalOpen] = useState(false);
  const [standingsModalOpen, setStandingsModalOpen] = useState(false);
  const [standingsAuditHash, setStandingsAuditHash] = useState<string | undefined>(undefined);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(() => isAdminUrl());
  const [logoutNoticeMode, setLogoutNoticeMode] = useState<'voter' | 'admin' | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    const syncAdminRoute = () => setAdminModalOpen(isAdminUrl());
    window.addEventListener('popstate', syncAdminRoute);
    window.addEventListener('hashchange', syncAdminRoute);
    return () => {
      window.removeEventListener('popstate', syncAdminRoute);
      window.removeEventListener('hashchange', syncAdminRoute);
    };
  }, []);

  const dockRef = useRef<HTMLDivElement | null>(null);

  const fetchBallot = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setLoadError(null);
    }
    try {
      const data = await cinemaApi.getBallotData();
      setSettings(data.settings);
      setMovies(data.movies);
      setPublicStandings(data.public_standings);
      setLoadError(null);
      // Limpia películas que hayan pasado a borrador o excedan el top_k actualizado
      setRankedMovies((prev) =>
        prev
          .filter((p) => data.movies.some((m) => m.id === p.id))
          .slice(0, data.settings.top_k)
      );
    } catch (err) {
      if (!silent) {
        setLoadError(err instanceof Error ? err.message : '');
      }
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
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

  const anyModalOpen = Boolean(
    civicModalOpen ||
      inspectedMovie ||
      trailerMovie ||
      ticketModalOpen ||
      standingsModalOpen ||
      authModalOpen ||
      adminModalOpen
  );

  return (
    <MotionConfig reducedMotion="user">
    <div className="cinema-noise relative min-h-screen overflow-x-clip bg-[#12172e] text-white">
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
      <header
        inert={anyModalOpen}
        className="sticky top-0 z-40 border-b border-white/15 bg-[#141a34]/90 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 sm:px-6 lg:flex-nowrap lg:py-3">
          <div className="flex items-center gap-3">
            {!logoFailed ? (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/95 p-1 shadow-lg ring-2 ring-amber-300/60">
                <img
                  src="/logo.png"
                  alt={t.brandLogoAlt}
                  width={44}
                  height={44}
                  onError={() => setLogoFailed(true)}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-slate-950 shadow-lg ring-2 ring-white/25 transition-colors duration-500"
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
                    {t.demoBadge}
                  </span>
                )}
              </div>
              <p className="hidden text-[11px] text-sky-200/80 md:block">
                {t.brandSubtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Selector de idioma: Castellano, Valencià, English */}
            <div
              role="group"
              aria-label={t.languageSelectorLabel}
              className="inline-flex items-center gap-1 rounded-xl border border-white/20 bg-white/10 p-1"
            >
              <Languages className="ml-1.5 hidden h-3.5 w-3.5 text-amber-200 sm:block" />
              {(['es', 'va', 'en'] as AppLanguage[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  aria-pressed={lang === code}
                  title={LANGUAGE_LABELS[code].name}
                  className={`rounded-lg px-2 py-1 text-[11px] font-extrabold transition ${
                    lang === code
                      ? 'bg-amber-300 text-slate-950 shadow-sm'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {LANGUAGE_LABELS[code].code}
                </button>
              ))}
            </div>

            {/* Botón público del estado de la votación (100% anónimo RGPD/LOPDGDD) */}
            <button
              type="button"
              onClick={() => {
                setStandingsAuditHash(undefined);
                setStandingsModalOpen(true);
                fetchBallot({ silent: true });
              }}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-emerald-300/45 bg-emerald-400/20 px-2.5 py-2 text-xs font-bold text-emerald-100 shadow-sm transition hover:bg-emerald-400/30 sm:px-3"
            >
              <BarChart3 className="h-4 w-4 text-emerald-200" />
              <span>{t.standingsBtn}</span>
            </button>

            {/* Botón didáctico obligatorio accesible en todo momento */}
            <button
              type="button"
              onClick={() => setCivicModalOpen(true)}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-sky-300/45 bg-sky-400/20 px-2.5 py-2 text-xs font-bold text-sky-100 shadow-sm transition hover:bg-sky-400/30 sm:px-3"
            >
              <HelpCircle className="h-4 w-4 text-sky-200" />
              <span>{t.howItWorksBtn}</span>
            </button>
          </div>
        </div>
      </header>

      <main
        inert={anyModalOpen}
        className="relative z-10 mx-auto max-w-7xl px-4 pb-6 pt-6 sm:px-6 lg:pb-16"
      >
        {/* Aviso legal RGPD / LOPDGDD al cerrar sesión (logout) */}
        {logoutNoticeMode && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 flex flex-col justify-between gap-3 rounded-2xl border border-emerald-400/40 bg-emerald-950/55 p-4 text-xs text-emerald-100 shadow-xl backdrop-blur-md sm:flex-row sm:items-center"
          >
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              <div>
                <p className="font-display text-sm font-bold text-white">
                  {t.gdprTitle}
                </p>
                <p className="mt-0.5 leading-relaxed text-emerald-100/90">
                  {logoutNoticeMode === 'admin' ? t.adminLogoutNotice : t.gdprLogoutNotice}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLogoutNoticeMode(null)}
              className="inline-flex shrink-0 items-center justify-center gap-1 self-end rounded-xl border border-emerald-300/40 bg-emerald-400/20 px-3 py-1.5 font-bold text-white hover:bg-emerald-400/30 sm:self-center"
            >
              <X className="h-3.5 w-3.5" />
              {t.gdprLogoutDismissBtn}
            </button>
          </div>
        )}

        {/* HERO DE CARTELERA CON TIRA DE CINE */}
        <section className="cinema-marquee mb-8 overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-[#1d2549]/95 via-[#181f3d]/90 to-[#241b42]/95 backdrop-blur-md">
          <FilmStripDivider />

          <div className="p-5 sm:p-7">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
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
                    {t.heroBadge}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-rose-300/35 bg-rose-400/15 px-3 py-1 text-xs font-bold text-rose-200">
                    <Popcorn className="h-3.5 w-3.5" />
                    {t.heroTopBadge(topK)}
                  </span>
                  {settings && !settings.voting_open && (
                    <span className="rounded-full border border-rose-500/45 bg-rose-500/20 px-3 py-1 text-xs font-bold text-rose-200">
                      {t.votingClosedBadge}
                    </span>
                  )}
                </div>

                <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  {localizeCampaignTitle(settings?.campaign_title, lang)}
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-slate-200 sm:text-base">
                  {localizeCampaignSubtitle(settings?.subtitle, lang)}
                </p>
              </div>

              {/* Cuño circular estilo sello "approved" */}
              <div className="flex shrink-0 items-center justify-center lg:mx-auto">
                <div className="relative -rotate-12 select-none rounded-full p-1 ring-2 ring-amber-300/30 transition-transform duration-300 motion-safe:hover:-rotate-6 motion-safe:hover:scale-105">
                  <img
                    src="/vota-stamp.png"
                    alt="¡Vota! Tu voto cuenta · Hazte escuchar que se note"
                    width={144}
                    height={144}
                    className="h-24 w-24 rounded-full object-contain drop-shadow-[0_12px_28px_rgba(245,158,11,0.38)] sm:h-28 sm:w-28 lg:h-36 lg:w-36"
                  />
                </div>
              </div>

              {/* Leyenda de puntuación Borda vigente */}
              <div className="flex flex-col gap-2 rounded-2xl border border-white/15 bg-black/25 p-3.5 backdrop-blur-sm">
                <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-200">
                  <Film className="h-3.5 w-3.5" />
                  {t.topValueLabel(topK)}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {weights.map((w) => (
                    <span
                      key={w.rank}
                      className="rounded-xl border border-amber-300/30 bg-amber-400/15 px-2.5 py-1 font-mono text-xs font-bold text-amber-200"
                    >
                      {t.rankOrdinal(w.rank)} = {w.points}{' '}
                      {w.points === 1 ? t.ptSingular : t.ptPlural}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <FilmStripDivider />
        </section>

        {/* ESTADO DE CARGA / ERROR */}
        {loading && (
          <div
            role="status"
            aria-busy="true"
            className="grid items-start gap-7 lg:grid-cols-[1fr_360px]"
          >
            <div className="grid gap-4 xl:grid-cols-2">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-56 animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]"
                />
              ))}
            </div>
            <div className="h-80 animate-pulse rounded-3xl border border-white/10 bg-white/[0.03]" />
          </div>
        )}

        {!loading && loadError !== null && (
          <div
            role="alert"
            className="rounded-3xl border border-rose-500/35 bg-rose-950/20 p-8 text-center"
          >
            <p className="text-sm font-semibold text-rose-200">
              {loadError || t.loadErrorFallback}
            </p>
            <button
              type="button"
              onClick={() => fetchBallot()}
              className="mt-4 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-950"
            >
              {t.retryBtn}
            </button>
          </div>
        )}

        {/* GRID DE PELÍCULAS + DOCK DE RANKING */}
        {!loading && loadError === null && (
          <div className="grid items-start gap-7 lg:grid-cols-[1fr_360px]">
            <section aria-labelledby="billboard-section-heading">
              <h2 id="billboard-section-heading" className="sr-only">
                {t.billboardSectionHeading}
              </h2>
              {movies.length === 0 ? (
                <div className="rounded-3xl border border-white/15 bg-white/[0.04] p-10 text-center text-sm text-slate-300">
                  {t.emptyPublished}
                </div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {movies.map((movie, movieIdx) => {
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
                        onWatchTrailer={setTrailerMovie}
                        onHoverMovie={setHoveredMovie}
                        disabled={!settings?.voting_open}
                        priority={movieIdx < 4}
                      />
                    );
                  })}
                </div>
              )}
            </section>

            {/* Columna derecha / inferior: Mi TOP */}
            <div ref={dockRef} className="scroll-mt-24 lg:sticky lg:top-24">
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

      {/* Barra flotante móvil ubicada por encima del badge de Netlify para no quedar oculta */}
      {!loading && movies.length > 0 && (
        <div
          inert={anyModalOpen}
          className="fixed inset-x-3 bottom-[68px] z-30 rounded-2xl border border-white/20 bg-[#12172e]/95 px-3.5 py-2.5 shadow-2xl backdrop-blur-xl lg:hidden"
        >
          <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
            <div>
              <p className="font-display text-xs font-bold text-white">
                {t.mobileTopStatus(topK, rankedMovies.length)}
              </p>
              <p className="text-[11px] text-slate-300">
                {rankedMovies.length === topK
                  ? t.mobileTopReady
                  : t.mobileTopHint}
              </p>
            </div>
            {rankedMovies.length === topK && settings?.voting_open ? (
              <button
                type="button"
                onClick={() => setTicketModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-sky-300 px-4 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg"
              >
                <Ticket className="h-4 w-4" />
                {t.voteNowBtn}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  const prefersReduced =
                    typeof window !== 'undefined' &&
                    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
                  dockRef.current?.scrollIntoView({
                    behavior: prefersReduced ? 'auto' : 'smooth',
                    block: 'start',
                  });
                }}
                className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-bold text-white"
              >
                <ChevronDown className="h-4 w-4" />
                {t.seeMyTopBtn}
              </button>
            )}
          </div>
        </div>
      )}

      {/* MODALES */}
      <Suspense fallback={null}>
        <CivicEducationModal
          open={civicModalOpen}
          onClose={() => setCivicModalOpen(false)}
          topK={topK}
          scoringMode={scoringMode}
        />
      </Suspense>

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
        onWatchTrailer={setTrailerMovie}
        onClose={() => setInspectedMovie(null)}
      />

      <TrailerPlayerModal
        movie={trailerMovie}
        onClose={() => setTrailerMovie(null)}
      />

      <CinemaTicketModal
        open={ticketModalOpen}
        campaignTitle={localizeCampaignTitle(settings?.campaign_title, lang)}
        rankedMovies={rankedMovies}
        topK={topK}
        scoringMode={scoringMode}
        onBackToEdit={() => setTicketModalOpen(false)}
        onProceedToAuth={() => {
          setTicketModalOpen(false);
          setAuthModalOpen(true);
        }}
      />

      <Suspense fallback={null}>
        <PublicStandingsModal
          open={standingsModalOpen}
          onClose={() => {
            setStandingsModalOpen(false);
            setStandingsAuditHash(undefined);
          }}
          standings={publicStandings}
          movies={movies}
          settings={settings}
          loading={loading || refreshing}
          onRefresh={() => fetchBallot({ silent: true })}
          initialAuditHash={standingsAuditHash}
        />
      </Suspense>

      {settings && (
        <VoterAuthModal
          open={authModalOpen}
          settings={settings}
          rankedMovies={rankedMovies}
          onClose={handleCloseAuthAndResetIfDone}
          onVoteCompleted={() => {
            // Reinicia la papeleta en memoria y refresca los resultados agregados públicos
            setRankedMovies([]);
            fetchBallot({ silent: true });
          }}
          onVoterLogout={() => {
            setAuthModalOpen(false);
            setRankedMovies([]);
            setLogoutNoticeMode('voter');
          }}
          onViewStandings={(hash) => {
            setStandingsAuditHash(hash);
            setStandingsModalOpen(true);
            fetchBallot({ silent: true });
          }}
        />
      )}

      <Suspense fallback={null}>
        <AdminPortalModal
          open={adminModalOpen}
          onClose={() => {
            setAdminModalOpen(false);
            if (isAdminUrl()) {
              window.history.replaceState({}, '', '/');
            }
          }}
          onAdminLogout={() => {
            setAdminModalOpen(false);
            if (isAdminUrl()) {
              window.history.replaceState({}, '', '/');
            }
            setLogoutNoticeMode('admin');
          }}
          onPublicDataChanged={() => fetchBallot({ silent: true })}
        />
      </Suspense>

      <footer
        inert={anyModalOpen}
        className="relative z-10 mx-auto max-w-7xl px-4 pb-36 pt-2 text-center sm:px-6 lg:pb-10"
      >
        <p className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-white/10 bg-black/25 px-4 py-2 text-[11px] text-slate-300">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
          <span>{t.gdprFooterShort}</span>
        </p>
      </footer>
    </div>
    </MotionConfig>
  );
}

export default App;
