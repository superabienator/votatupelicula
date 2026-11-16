import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  CheckCircle2,
  Eye,
  Film,
  LayoutGrid,
  Loader2,
  Lock,
  LogOut,
  Palette,
  Plus,
  Rocket,
  Settings2,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import { LANGUAGE_LABELS, getLocalizedMovie, getMovieTrailersMap } from '../i18n/translations';
import { IS_SANDBOX_MODE, cinemaApi } from '../services/api';
import type {
  AppLanguage,
  DashboardResults,
  Movie,
  MovieLocalizedFields,
  VotingSettings,
} from '../types/cinema';
import { extractPaletteFromImageCanvas } from '../utils/colorExtractor';
import { formatDuration } from '../utils/borda';
import { useEscapeKey } from '../utils/useEscapeKey';
import { MoviePoster } from './MoviePoster';
import { ResultsDashboard } from './ResultsDashboard';

interface AdminPortalModalProps {
  open: boolean;
  onClose: () => void;
  onAdminLogout?: () => void;
  onPublicDataChanged: () => Promise<void>;
}

type AdminTab = 'movies' | 'settings' | 'results';

export function AdminPortalModal({
  open,
  onClose,
  onAdminLogout,
  onPublicDataChanged,
}: AdminPortalModalProps) {
  const { lang, t } = useI18n();
  const tx = t.adminExtra;
  const [adminSecret, setAdminSecret] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<AdminTab>('movies');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [settings, setSettings] = useState<VotingSettings | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [results, setResults] = useState<DashboardResults | null>(null);
  const [busyMessage, setBusyMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );
  const [resultsSubModalOpen, setResultsSubModalOpen] = useState(false);
  const [confirmDeleteMovieId, setConfirmDeleteMovieId] = useState<string | null>(null);

  // Fase 1: lista de títulos para barrido inteligente
  const [titlesInput, setTitlesInput] = useState(
    'Spider-Man: Un nuevo universo\nCoco\nWALL-E'
  );
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [editGenresText, setEditGenresText] = useState('');
  const [editTagsText, setEditTagsText] = useState('');
  const [editTrailerEs, setEditTrailerEs] = useState('');
  const [editTrailerVa, setEditTrailerVa] = useState('');
  const [editTrailerEn, setEditTrailerEn] = useState('');
  const [editLangTab, setEditLangTab] = useState<AppLanguage>('es');
  const [editI18n, setEditI18n] = useState<Partial<Record<AppLanguage, MovieLocalizedFields>>>({});
  const [extractingPalette, setExtractingPalette] = useState(false);

  const clearAdminMemorySession = useCallback(() => {
    setAuthenticated(false);
    setAdminSecret('');
    setAuthError(null);
    setMovies([]);
    setResults(null);
    setEditingMovie(null);
    setConfirmDeleteMovieId(null);
    setResultsSubModalOpen(false);
    setFeedback(null);
    setBusyMessage(null);
  }, []);

  useEffect(() => {
    if (!open) {
      clearAdminMemorySession();
    }
  }, [open, clearAdminMemorySession]);

  function handleClosePortal() {
    clearAdminMemorySession();
    onClose();
  }

  function openEditModal(movie: Movie) {
    const trailers = getMovieTrailersMap(movie);
    setEditingMovie({ ...movie });
    setEditGenresText(movie.genres.join(', '));
    setEditTagsText(movie.tags.join(', '));
    setEditTrailerEs(trailers.es || '');
    setEditTrailerVa(trailers.va || '');
    setEditTrailerEn(trailers.en || '');
    setEditLangTab('es');
    setEditI18n(movie.translations ?? movie.palette?.i18n ?? {});
  }

  // Edición de settings como texto auxiliar
  const [classesText, setClassesText] = useState('');
  const [domainsText, setDomainsText] = useState('');

  useEscapeKey(Boolean(editingMovie), () => setEditingMovie(null));
  useEscapeKey(open && !editingMovie && !resultsSubModalOpen, handleClosePortal);

  async function loadAdminData(secret: string) {
    const data = await cinemaApi.adminListMovies(secret);
    setMovies(data.movies);
    setSettings(data.settings);
    setTotalVotes(data.total_votes);
    setClassesText(data.settings.allowed_classes.join('\n'));
    setDomainsText(data.settings.allowed_email_domains.join(', '));
  }

  async function loadResults(secret: string) {
    const res = await cinemaApi.adminGetResults(secret);
    setResults(res);
  }

  useEffect(() => {
    if (open && authenticated && activeTab === 'results') {
      loadResults(adminSecret).catch((err) =>
        setFeedback({ type: 'err', text: err.message })
      );
    }
  }, [open, authenticated, activeTab, adminSecret]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      await cinemaApi.checkAdminSecret(adminSecret);
      await loadAdminData(adminSecret);
      await loadResults(adminSecret);
      setAuthenticated(true);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : tx.adminInvalidKeyErr
      );
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSmartScan() {
    const titles = titlesInput
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (titles.length === 0) {
      setFeedback({ type: 'err', text: tx.adminScanEmptyErr });
      return;
    }

    setFeedback(null);
    setBusyMessage(tx.adminBusyEnriching(titles.length));
    try {
      const created = await cinemaApi.adminEnrichBatch(adminSecret, titles);
      await loadAdminData(adminSecret);
      setTitlesInput('');
      setFeedback({
        type: 'ok',
        text: tx.adminOkEnriched(created.length),
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : tx.adminScanEmptyErr,
      });
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleAddManualDraft() {
    setBusyMessage(tx.adminBusyEnriching(1));
    try {
      const created = await cinemaApi.adminCreateManual(adminSecret, {
        title: tx.adminManualDefaultTitle,
        year: 2024,
        duration_minutes: 110,
        genres: ['CineFórum'],
        tags: ['Debate'],
        age_rating: '+12',
        synopsis: tx.adminManualDefaultSynopsis,
      });
      await loadAdminData(adminSecret);
      openEditModal(created);
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : t.loadErrorFallback,
      });
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleSaveMovieEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMovie) return;
    setBusyMessage(tx.adminBusySavingSettings);
    try {
      const parsedGenres = editGenresText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const parsedTags = editTagsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const nextTrailers = {
        ...(editTrailerEs.trim() ? { es: editTrailerEs.trim() } : {}),
        ...(editTrailerVa.trim() ? { va: editTrailerVa.trim() } : {}),
        ...(editTrailerEn.trim() ? { en: editTrailerEn.trim() } : {}),
      };

      const nextPalette = {
        ...editingMovie.palette,
        i18n: editI18n,
        trailers: nextTrailers,
      };

      await cinemaApi.adminUpdateMovie(adminSecret, editingMovie.id, {
        title: editingMovie.title,
        year: editingMovie.year,
        duration_minutes: editingMovie.duration_minutes,
        age_rating: editingMovie.age_rating,
        genres: parsedGenres,
        tags: parsedTags,
        synopsis: editingMovie.synopsis,
        poster_url: editingMovie.poster_url,
        backdrop_url: editingMovie.backdrop_url,
        palette: nextPalette,
        status: editingMovie.status,
      });
      await loadAdminData(adminSecret);
      await onPublicDataChanged();
      setEditingMovie(null);
      setFeedback({ type: 'ok', text: tx.adminOkMovieUpdated });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : t.loadErrorFallback,
      });
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleExtractEditingPalette() {
    if (!editingMovie?.poster_url) return;
    setExtractingPalette(true);
    try {
      const extracted = await extractPaletteFromImageCanvas(editingMovie.poster_url);
      setEditingMovie({
        ...editingMovie,
        palette: { ...editingMovie.palette, ...extracted },
      });
    } finally {
      setExtractingPalette(false);
    }
  }

  async function handlePublishDrafts() {
    setBusyMessage(tx.adminBusySavingSettings);
    setFeedback(null);
    try {
      const published = await cinemaApi.adminPublishBillboard(adminSecret);
      await loadAdminData(adminSecret);
      await onPublicDataChanged();
      setFeedback({
        type: 'ok',
        text: tx.adminOkPublished(published.length),
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : t.loadErrorFallback,
      });
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleToggleMovieStatus(movie: Movie) {
    const nextStatus = movie.status === 'published' ? 'draft' : 'published';
    setBusyMessage(tx.adminBusyUpdatingVote);
    try {
      await cinemaApi.adminUpdateMovie(adminSecret, movie.id, { status: nextStatus });
      await loadAdminData(adminSecret);
      await onPublicDataChanged();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : t.loadErrorFallback,
      });
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleDeleteMovie(movie: Movie) {
    setConfirmDeleteMovieId(null);
    setBusyMessage(tx.adminBusyDeletingVote);
    try {
      const res = await cinemaApi.adminDeleteMovie(adminSecret, movie.id);
      await loadAdminData(adminSecret);
      await onPublicDataChanged();
      if (res.message) {
        setFeedback({ type: 'ok', text: res.message });
      }
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : t.loadErrorFallback,
      });
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleMoveMovieOrder(index: number, delta: -1 | 1) {
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= movies.length) return;
    const currentMovie = movies[index];
    const swapMovie = movies[targetIndex];
    setBusyMessage(tx.adminBusySavingSettings);
    try {
      await Promise.all([
        cinemaApi.adminUpdateMovie(adminSecret, currentMovie.id, {
          display_order: targetIndex + 1,
        }),
        cinemaApi.adminUpdateMovie(adminSecret, swapMovie.id, {
          display_order: index + 1,
        }),
      ]);
      await loadAdminData(adminSecret);
      await onPublicDataChanged();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : t.loadErrorFallback,
      });
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleResetVotes() {
    setBusyMessage(tx.adminBusyResetting);
    setFeedback(null);
    try {
      await cinemaApi.adminResetVotes(adminSecret);
      await loadAdminData(adminSecret);
      await loadResults(adminSecret);
      await onPublicDataChanged();
      setFeedback({
        type: 'ok',
        text: tx.adminOkResetVotes,
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : t.loadErrorFallback,
      });
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleDeleteVote(voteId: string) {
    setBusyMessage(tx.adminBusyDeletingVote);
    try {
      await cinemaApi.adminDeleteVote(adminSecret, voteId);
      await loadAdminData(adminSecret);
      await loadResults(adminSecret);
      await onPublicDataChanged();
      setFeedback({ type: 'ok', text: tx.adminOkVoteDeleted });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : t.loadErrorFallback,
      });
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleUpdateVote(
    voteId: string,
    patch: { curso?: string; ranked_movie_ids?: string[] }
  ) {
    setBusyMessage(tx.adminBusyUpdatingVote);
    try {
      await cinemaApi.adminUpdateVote(adminSecret, voteId, patch);
      await loadResults(adminSecret);
      await onPublicDataChanged();
      setFeedback({ type: 'ok', text: tx.adminOkVoteUpdated });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : t.loadErrorFallback,
      });
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleSaveSettings(
    partialOverride?: Partial<VotingSettings>,
    e?: React.FormEvent
  ) {
    e?.preventDefault();
    if (!settings) return;
    setBusyMessage(tx.adminBusySavingSettings);
    try {
      const allowedClasses = classesText
        .split('\n')
        .map((c) => c.trim())
        .filter(Boolean);
      const allowedDomains = domainsText
        .split(',')
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);

      const updated = await cinemaApi.adminUpdateSettings(adminSecret, {
        ...settings,
        allowed_classes: allowedClasses,
        allowed_email_domains: allowedDomains,
        ...partialOverride,
      });
      setSettings(updated);
      await onPublicDataChanged();
      setFeedback({
        type: 'ok',
        text: tx.adminOkSettingsSaved,
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : t.loadErrorFallback,
      });
    } finally {
      setBusyMessage(null);
    }
  }

  const draftMovies = movies.filter((m) => m.status === 'draft');
  const publishedMovies = movies.filter((m) => m.status === 'published');

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 backdrop-blur-md sm:p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t.adminHeaderTitle}
            className="relative flex max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#090c16] text-slate-100 shadow-2xl"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
          >
            {/* Barra superior del panel */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-white/[0.02] px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/35">
                  <Lock className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-display text-lg font-extrabold text-white sm:text-xl">
                    {t.adminHeaderTitle}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {t.adminHeaderSub}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {authenticated && (
                  <button
                    type="button"
                    onClick={() => {
                      clearAdminMemorySession();
                      onAdminLogout?.();
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-400/35 bg-rose-500/15 px-3 py-2 text-xs font-bold text-rose-200 transition hover:bg-rose-500/25"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    {t.adminLogoutBtn}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleClosePortal}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                  {t.backToPublicBtn}
                </button>
              </div>
            </div>

            {/* LOGIN DE ADMIN */}
            {!authenticated ? (
              <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
                <form
                  onSubmit={handleLogin}
                  className="w-full max-w-md space-y-4 rounded-3xl border border-white/15 bg-white/[0.03] p-6"
                >
                  <div>
                    <h3 className="font-display text-xl font-bold text-white">
                      {t.adminLoginTitle}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {t.adminLoginDesc}
                    </p>
                  </div>

                  {IS_SANDBOX_MODE && (
                    <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-200">
                      <strong>{t.adminDemoHint}</strong>{' '}
                      <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono font-bold text-white">
                        demo1234
                      </code>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="admin-secret-input"
                      className="mb-1 block text-xs font-semibold text-slate-300"
                    >
                      {t.adminKeyLabel}
                    </label>
                    <input
                      id="admin-secret-input"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={adminSecret}
                      onChange={(e) => setAdminSecret(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-base text-white focus:border-amber-400 sm:text-sm"
                    />
                  </div>

                  {authError && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/15 p-3 text-xs text-rose-200"
                    >
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-amber-300 disabled:opacity-50"
                  >
                    {authLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t.verifyingAdminBtn}
                      </>
                    ) : (
                      t.enterAdminBtn
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <>
                {/* Pestañas */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
                  <div
                    role="tablist"
                    aria-label={t.adminHeaderTitle}
                    className="flex flex-wrap gap-2"
                  >
                    {[
                      {
                        id: 'movies' as const,
                        label: t.tabBillboard(publishedMovies.length, draftMovies.length),
                        icon: LayoutGrid,
                      },
                      {
                        id: 'results' as const,
                        label: t.tabResults(totalVotes),
                        icon: BarChart3,
                      },
                      {
                        id: 'settings' as const,
                        label: t.tabSettings,
                        icon: Settings2,
                      },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const active = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => setActiveTab(tab.id)}
                          className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                            active
                              ? 'bg-white text-slate-950 shadow'
                              : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {busyMessage && (
                    <span
                      role="status"
                      className="inline-flex items-center gap-2 text-xs font-semibold text-sky-300"
                    >
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {busyMessage}
                    </span>
                  )}
                </div>

                {/* Cuerpo con scroll */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
                  {feedback && (
                    <div
                      role={feedback.type === 'err' ? 'alert' : 'status'}
                      className={`mb-5 flex items-center justify-between gap-3 rounded-2xl border p-3.5 text-xs ${
                        feedback.type === 'ok'
                          ? 'border-emerald-400/35 bg-emerald-500/15 text-emerald-200'
                          : 'border-rose-500/40 bg-rose-500/15 text-rose-200'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {feedback.type === 'ok' ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                        )}
                        {feedback.text}
                      </span>
                      <button
                        type="button"
                        aria-label={t.closeBtn}
                        onClick={() => setFeedback(null)}
                        className="opacity-70 hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* TAB 1: GESTOR EN 2 FASES */}
                  {activeTab === 'movies' && (
                    <div className="space-y-8">
                      {/* FASE 1: BARRIDO INTELIGENTE */}
                      <section className="rounded-3xl border border-sky-400/25 bg-sky-950/15 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/20 px-2.5 py-0.5 text-[11px] font-bold text-sky-300">
                              <Wand2 className="h-3 w-3" />
                              {t.phase1Badge}
                            </span>
                            <h3 className="mt-1.5 font-display text-lg font-extrabold text-white">
                              {t.phase1Title}
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-300">
                              {t.phase1Desc}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={handleAddManualDraft}
                            disabled={Boolean(busyMessage)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            {t.addManualBtn}
                          </button>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                          <textarea
                            rows={3}
                            aria-label={t.phase1Title}
                            value={titlesInput}
                            onChange={(e) => setTitlesInput(e.target.value)}
                            placeholder={tx.adminTitlesPlaceholder}
                            className="w-full rounded-2xl border border-white/15 bg-black/45 p-3.5 text-sm text-white placeholder:text-slate-400 focus:border-sky-400"
                          />
                          <button
                            type="button"
                            onClick={handleSmartScan}
                            disabled={Boolean(busyMessage)}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-400 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg transition hover:bg-sky-300 disabled:opacity-50"
                          >
                            <Sparkles className="h-4 w-4" />
                            {t.generateDraftsBtn}
                          </button>
                        </div>
                      </section>

                      {/* FASE 2: CONSISTENCIA, TEMA Y APROBACIÓN */}
                      <section className="space-y-4 rounded-3xl border border-white/15 bg-white/[0.02] p-5">
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                          <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                              <Eye className="h-3 w-3" />
                              {t.phase2Badge}
                            </span>
                            <h3 className="mt-1.5 font-display text-lg font-extrabold text-white">
                              {t.phase2Title}
                            </h3>
                          </div>

                          <button
                            type="button"
                            disabled={draftMovies.length === 0 || Boolean(busyMessage)}
                            onClick={handlePublishDrafts}
                            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-xs font-extrabold text-slate-950 shadow-lg transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Rocket className="h-4 w-4" />
                            {t.publishBillboardBtn(draftMovies.length)}
                          </button>
                        </div>

                        {/* Selector de Tema Visual */}
                        {settings && (
                          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black/35 p-3.5">
                            <label
                              htmlFor="admin-theme-mode"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-200"
                            >
                              <Palette className="h-4 w-4 text-amber-400" />
                              {t.visualThemeLabel}
                            </label>
                            <select
                              id="admin-theme-mode"
                              value={settings.theme_mode}
                              onChange={(e) =>
                                handleSaveSettings({
                                  theme_mode: e.target.value as 'blend' | 'featured',
                                })
                              }
                              className="rounded-xl border border-white/15 bg-[#090c16] px-3 py-1.5 text-xs font-semibold text-white"
                            >
                              <option value="blend">
                                {tx.adminThemeBlendOpt}
                              </option>
                              <option value="featured">
                                {tx.adminThemeFeaturedOpt}
                              </option>
                            </select>

                            {settings.theme_mode === 'featured' && (
                              <select
                                aria-label={tx.adminThemeFeaturedOpt}
                                value={settings.featured_movie_id || ''}
                                onChange={(e) =>
                                  handleSaveSettings({
                                    featured_movie_id: e.target.value || null,
                                  })
                                }
                                className="rounded-xl border border-white/15 bg-[#090c16] px-3 py-1.5 text-xs font-semibold text-white"
                              >
                                <option value="">{tx.adminThemeSelectMovieOpt}</option>
                                {movies.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {getLocalizedMovie(m, lang).title} ({m.status})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}

                        {/* Grid de fichas Draft y Published */}
                        <div className="grid gap-4 md:grid-cols-2">
                          {movies.map((movie, idx) => {
                            const loc = getLocalizedMovie(movie, lang);
                            return (
                              <div
                                key={movie.id}
                                className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0d111e] p-4"
                              >
                                <div className="flex gap-3.5">
                                  <div className="h-28 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10">
                                    <MoviePoster
                                      title={loc.title}
                                      year={movie.year}
                                      posterUrl={movie.poster_url}
                                      palette={movie.palette}
                                      compact
                                      className="h-full w-full"
                                    />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                          movie.status === 'published'
                                            ? 'bg-emerald-500/20 text-emerald-300'
                                            : movie.status === 'draft'
                                              ? 'bg-amber-400/20 text-amber-300'
                                              : 'bg-slate-600/30 text-slate-300'
                                        }`}
                                      >
                                        {movie.status === 'published'
                                          ? tx.adminStatusPublished
                                          : movie.status === 'draft'
                                            ? tx.adminStatusDraft
                                            : tx.adminStatusArchived}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        {[
                                          movie.palette.primary,
                                          movie.palette.secondary,
                                          movie.palette.accent,
                                        ].map((hex, i) => (
                                          <span
                                            key={i}
                                            title={hex}
                                            className="h-3.5 w-3.5 rounded-full border border-white/25"
                                            style={{ backgroundColor: hex }}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                    <h4 className="mt-1 truncate font-display text-base font-bold text-white">
                                      {loc.title}
                                    </h4>
                                    <p className="text-[11px] text-slate-400">
                                      {movie.year || t.durationEmpty} ·{' '}
                                      {formatDuration(movie.duration_minutes, t.durationEmpty)} ·{' '}
                                      {movie.age_rating}
                                    </p>
                                    <p className="mt-1.5 line-clamp-2 text-xs text-slate-300">
                                      {loc.synopsis}
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                                  <div className="flex flex-wrap gap-1.5">
                                    <button
                                      type="button"
                                      disabled={idx === 0 || Boolean(busyMessage)}
                                      onClick={() => handleMoveMovieOrder(idx, -1)}
                                      title={tx.adminMoveUpAria(loc.title)}
                                      aria-label={tx.adminMoveUpAria(loc.title)}
                                      className="rounded-lg border border-white/15 bg-white/5 p-1.5 text-slate-300 hover:bg-white/10 disabled:opacity-30"
                                    >
                                      <ArrowUp className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === movies.length - 1 || Boolean(busyMessage)}
                                      onClick={() => handleMoveMovieOrder(idx, 1)}
                                      title={tx.adminMoveDownAria(loc.title)}
                                      aria-label={tx.adminMoveDownAria(loc.title)}
                                      className="rounded-lg border border-white/15 bg-white/5 p-1.5 text-slate-300 hover:bg-white/10 disabled:opacity-30"
                                    >
                                      <ArrowDown className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openEditModal(movie)}
                                      className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-white/10"
                                    >
                                      {t.editMovieBtn}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleMovieStatus(movie)}
                                      className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-sky-300 hover:bg-white/10"
                                    >
                                      {movie.status === 'published'
                                        ? t.hideDraftBtn
                                        : t.publishMovieBtn}
                                    </button>
                                  </div>

                                  {confirmDeleteMovieId === movie.id ? (
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteMovie(movie)}
                                        className="rounded-lg bg-rose-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-rose-500"
                                      >
                                        {tx.adminDeleteAria(loc.title).split(' ')[0]}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setConfirmDeleteMovieId(null)}
                                        className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-[11px] font-bold text-slate-200 hover:bg-white/10"
                                      >
                                        {t.cancelBtn}
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteMovieId(movie.id)}
                                      aria-label={tx.adminDeleteAria(loc.title)}
                                      className="rounded-lg border border-rose-500/25 bg-rose-500/10 p-1.5 text-rose-300 hover:bg-rose-500/20"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    </div>
                  )}

                  {/* TAB 2: CONFIGURACIÓN */}
                  {activeTab === 'settings' && settings && (
                    <form
                      onSubmit={(e) => handleSaveSettings(undefined, e)}
                      className="mx-auto max-w-3xl space-y-5 rounded-3xl border border-white/15 bg-white/[0.02] p-6"
                    >
                      <h3 className="font-display text-lg font-extrabold text-white">
                        {tx.adminSettingsTitle}
                      </h3>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="admin-campaign-title"
                            className="mb-1 block text-xs font-semibold text-slate-300"
                          >
                            {tx.adminCampaignTitleLabel}
                          </label>
                          <input
                            id="admin-campaign-title"
                            type="text"
                            value={settings.campaign_title}
                            onChange={(e) =>
                              setSettings({ ...settings, campaign_title: e.target.value })
                            }
                            className="w-full rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-sm text-white"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="admin-voting-status"
                            className="mb-1 block text-xs font-semibold text-slate-300"
                          >
                            {tx.adminVotingStatusLabel}
                          </label>
                          <select
                            id="admin-voting-status"
                            value={settings.voting_open ? 'open' : 'closed'}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                voting_open: e.target.value === 'open',
                              })
                            }
                            className="w-full rounded-xl border border-white/15 bg-[#090c16] px-3 py-2 text-sm text-white"
                          >
                            <option value="open">{tx.adminVotingOpenOpt}</option>
                            <option value="closed">{tx.adminVotingClosedOpt}</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="admin-campaign-subtitle"
                          className="mb-1 block text-xs font-semibold text-slate-300"
                        >
                          {tx.adminSubtitleLabel}
                        </label>
                        <input
                          id="admin-campaign-subtitle"
                          type="text"
                          value={settings.subtitle}
                          onChange={(e) =>
                            setSettings({ ...settings, subtitle: e.target.value })
                          }
                          className="w-full rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-sm text-white"
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="admin-top-k"
                            className="mb-1 block text-xs font-semibold text-slate-300"
                          >
                            {tx.adminTopKLabel}
                          </label>
                          <select
                            id="admin-top-k"
                            value={settings.top_k}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                top_k: Number(e.target.value) as 3 | 5,
                              })
                            }
                            className="w-full rounded-xl border border-white/15 bg-[#090c16] px-3 py-2 text-sm text-white"
                          >
                            <option value={3}>{tx.adminTop3Opt}</option>
                            <option value={5}>{tx.adminTop5Opt}</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="admin-scoring-mode"
                            className="mb-1 block text-xs font-semibold text-slate-300"
                          >
                            {tx.adminScoringModeLabel}
                          </label>
                          <select
                            id="admin-scoring-mode"
                            value={settings.scoring_mode}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                scoring_mode: e.target.value as 'classic' | 'fractional',
                              })
                            }
                            className="w-full rounded-xl border border-white/15 bg-[#090c16] px-3 py-2 text-sm text-white"
                          >
                            <option value="classic">
                              {tx.adminScoringClassicOpt}
                            </option>
                            <option value="fractional">
                              {tx.adminScoringFractionalOpt}
                            </option>
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="admin-allowed-classes"
                            className="mb-1 block text-xs font-semibold text-slate-300"
                          >
                            {tx.adminClassesLabel}
                          </label>
                          <textarea
                            id="admin-allowed-classes"
                            rows={6}
                            value={classesText}
                            onChange={(e) => setClassesText(e.target.value)}
                            className="w-full rounded-xl border border-white/15 bg-black/45 p-3 font-mono text-xs text-white"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="admin-allowed-domains"
                            className="mb-1 block text-xs font-semibold text-slate-300"
                          >
                            {tx.adminDomainsLabel}
                          </label>
                          <textarea
                            id="admin-allowed-domains"
                            rows={3}
                            value={domainsText}
                            onChange={(e) => setDomainsText(e.target.value)}
                            placeholder={tx.adminDomainsPh}
                            className="w-full rounded-xl border border-white/15 bg-black/45 p-3 font-mono text-xs text-white placeholder:text-slate-400"
                          />
                          <p className="mt-2 text-[11px] text-slate-400">
                            {tx.adminDisposableAlwaysOn}
                          </p>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={Boolean(busyMessage)}
                        className="rounded-2xl bg-amber-400 px-6 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-amber-300"
                      >
                        {tx.adminSaveSettingsBtn}
                      </button>
                    </form>
                  )}

                  {/* TAB 3: DASHBOARD DE RESULTADOS */}
                  {activeTab === 'results' && (
                    <ResultsDashboard
                      results={results}
                      movies={movies}
                      loading={Boolean(busyMessage)}
                      onRefresh={() => {
                        setBusyMessage(tx.adminRefreshingResultsMsg);
                        loadResults(adminSecret).finally(() => setBusyMessage(null));
                      }}
                      onResetVotes={handleResetVotes}
                      onDeleteVote={handleDeleteVote}
                      onUpdateVote={handleUpdateVote}
                      onSubModalOpenChange={setResultsSubModalOpen}
                    />
                  )}
                </div>
              </>
            )}

            {/* Sub-modal de edición de película individual */}
            {editingMovie && (
              <div
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                onClick={() => setEditingMovie(null)}
              >
                <form
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="movie-editor-modal-title"
                  onClick={(e) => e.stopPropagation()}
                  onSubmit={handleSaveMovieEdit}
                  className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto overscroll-contain rounded-3xl border border-white/20 bg-[#12172e] p-6 shadow-2xl"
                >
                  <div className="flex items-center justify-between">
                    <h4
                      id="movie-editor-modal-title"
                      className="flex items-center gap-2 font-display text-lg font-bold text-white"
                    >
                      <Film className="h-4 w-4 text-amber-400" />
                      {t.editorModalTitle}
                    </h4>
                    <button
                      type="button"
                      aria-label={t.closeBtn}
                      onClick={() => setEditingMovie(null)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Vista previa en tiempo real */}
                  <div
                    className="relative flex gap-3.5 overflow-hidden rounded-2xl border border-white/15 bg-black/45 p-3.5"
                    style={{
                      borderColor: `${editingMovie.palette.primary}88`,
                    }}
                  >
                    <div
                      className="pointer-events-none absolute inset-x-0 top-0 h-1"
                      style={{
                        background: `linear-gradient(90deg, ${editingMovie.palette.primary}, ${editingMovie.palette.secondary}, ${editingMovie.palette.accent})`,
                      }}
                    />
                    <div className="h-24 w-16 shrink-0 overflow-hidden rounded-xl border border-white/15">
                      <MoviePoster
                        title={editingMovie.title}
                        year={editingMovie.year}
                        posterUrl={editingMovie.poster_url}
                        palette={editingMovie.palette}
                        compact
                        className="h-full w-full"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                          {editingMovie.age_rating || 'TP'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {editingMovie.year || 'Año'} · {editingMovie.duration_minutes || '?'} min
                        </span>
                      </div>
                      <p className="mt-1 truncate font-display text-sm font-bold text-white">
                        {editingMovie.title || 'Sin título'}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-300">
                        {editingMovie.synopsis}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label
                        htmlFor="edit-movie-title"
                        className="mb-1 block text-xs font-semibold text-slate-300"
                      >
                        {tx.adminMovieTitleLabel}
                      </label>
                      <input
                        id="edit-movie-title"
                        type="text"
                        required
                        value={editingMovie.title}
                        onChange={(e) =>
                          setEditingMovie({ ...editingMovie, title: e.target.value })
                        }
                        className="w-full rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="edit-movie-year"
                        className="mb-1 block text-xs font-semibold text-slate-300"
                      >
                        {tx.adminMovieYearLabel}
                      </label>
                      <input
                        id="edit-movie-year"
                        type="number"
                        value={editingMovie.year ?? ''}
                        onChange={(e) =>
                          setEditingMovie({
                            ...editingMovie,
                            year: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                        className="w-full rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="edit-movie-duration"
                        className="mb-1 block text-xs font-semibold text-slate-300"
                      >
                        {tx.adminMovieDurationLabel}
                      </label>
                      <input
                        id="edit-movie-duration"
                        type="number"
                        value={editingMovie.duration_minutes ?? ''}
                        onChange={(e) =>
                          setEditingMovie({
                            ...editingMovie,
                            duration_minutes: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                        placeholder="120"
                        className="w-full rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-sm text-white"
                      />
                    </div>
                  </div>

                  {/* Selector visual de edad recomendada */}
                  <div>
                    <span className="mb-1.5 block text-xs font-semibold text-slate-300">
                      {tx.adminMovieAgeLabel}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {['TP', '+7', '+12', '+16', '+18'].map((age) => (
                        <button
                          key={age}
                          type="button"
                          onClick={() =>
                            setEditingMovie({ ...editingMovie, age_rating: age })
                          }
                          className={`rounded-xl border px-3 py-1.5 font-mono text-xs font-bold transition ${
                            editingMovie.age_rating === age
                              ? 'border-amber-400 bg-amber-400 text-slate-950'
                              : 'border-white/15 bg-white/5 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {age}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="edit-movie-synopsis"
                      className="mb-1 block text-xs font-semibold text-slate-300"
                    >
                      {tx.adminMovieSynopsisLabel}
                    </label>
                    <textarea
                      id="edit-movie-synopsis"
                      rows={3}
                      value={editingMovie.synopsis}
                      onChange={(e) =>
                        setEditingMovie({ ...editingMovie, synopsis: e.target.value })
                      }
                      className="w-full rounded-xl border border-white/15 bg-black/45 p-3 text-sm text-white"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="edit-movie-genres"
                        className="mb-1 block text-xs font-semibold text-slate-300"
                      >
                        {tx.adminMovieGenresLabel}
                      </label>
                      <input
                        id="edit-movie-genres"
                        type="text"
                        value={editGenresText}
                        onChange={(e) => setEditGenresText(e.target.value)}
                        className="w-full rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-xs text-white"
                      />
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {['Animación', 'Ciencia ficción', 'Drama', 'Comedia', 'Aventura'].map(
                          (g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => {
                                const current = editGenresText
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean);
                                if (!current.includes(g)) {
                                  setEditGenresText([...current, g].join(', '));
                                }
                              }}
                              className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300 hover:bg-white/15"
                            >
                              + {g}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="edit-movie-tags"
                        className="mb-1 block text-xs font-semibold text-slate-300"
                      >
                        {tx.adminMovieTagsLabel}
                      </label>
                      <input
                        id="edit-movie-tags"
                        type="text"
                        value={editTagsText}
                        onChange={(e) => setEditTagsText(e.target.value)}
                        className="w-full rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-xs text-white"
                      />
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {['Valores', 'Trabajo en equipo', 'Superación', 'Ecología'].map(
                          (tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                const current = editTagsText
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean);
                                if (!current.includes(tag)) {
                                  setEditTagsText([...current, tag].join(', '));
                                }
                              }}
                              className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300 hover:bg-white/15"
                            >
                              + {tag}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="edit-movie-poster"
                      className="mb-1 block text-xs font-semibold text-slate-300"
                    >
                      {tx.adminMoviePosterLabel}
                    </label>
                    <input
                      id="edit-movie-poster"
                      type="url"
                      value={editingMovie.poster_url}
                      onChange={(e) =>
                        setEditingMovie({ ...editingMovie, poster_url: e.target.value })
                      }
                      placeholder="https://image.tmdb.org/t/p/w780/..."
                      className="w-full rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-movie-backdrop"
                      className="mb-1 block text-xs font-semibold text-slate-300"
                    >
                      {tx.adminMovieBackdropLabel}
                    </label>
                    <input
                      id="edit-movie-backdrop"
                      type="url"
                      value={editingMovie.backdrop_url}
                      onChange={(e) =>
                        setEditingMovie({ ...editingMovie, backdrop_url: e.target.value })
                      }
                      placeholder="https://image.tmdb.org/t/p/w1280/..."
                      className="w-full rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-xs text-white"
                    />
                  </div>

                  {/* Tráilers por idioma (ES / VA / EN) */}
                  <div className="space-y-2.5 rounded-2xl border border-white/10 bg-black/35 p-3.5">
                    <span className="block text-xs font-bold text-slate-200">
                      {tx.adminMovieTrailersLabel}
                    </span>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div>
                        <label
                          htmlFor="edit-trailer-es"
                          className="mb-1 block text-[11px] text-slate-400"
                        >
                          Castellano (ES)
                        </label>
                        <input
                          id="edit-trailer-es"
                          type="url"
                          value={editTrailerEs}
                          onChange={(e) => setEditTrailerEs(e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                          className="w-full rounded-xl border border-white/15 bg-black/45 px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="edit-trailer-va"
                          className="mb-1 block text-[11px] text-slate-400"
                        >
                          Valencià (VA)
                        </label>
                        <input
                          id="edit-trailer-va"
                          type="url"
                          value={editTrailerVa}
                          onChange={(e) => setEditTrailerVa(e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                          className="w-full rounded-xl border border-white/15 bg-black/45 px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="edit-trailer-en"
                          className="mb-1 block text-[11px] text-slate-400"
                        >
                          English (EN)
                        </label>
                        <input
                          id="edit-trailer-en"
                          type="url"
                          value={editTrailerEn}
                          onChange={(e) => setEditTrailerEn(e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                          className="w-full rounded-xl border border-white/15 bg-black/45 px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Traducciones opcionales por idioma (ES / VA / EN) */}
                  <div className="space-y-2.5 rounded-2xl border border-white/10 bg-black/35 p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-200">
                        {tx.adminMovieI18nTitleLabel}
                      </span>
                      <div className="flex gap-1">
                        {(['es', 'va', 'en'] as AppLanguage[]).map((code) => (
                          <button
                            key={code}
                            type="button"
                            onClick={() => setEditLangTab(code)}
                            className={`rounded-lg px-2 py-1 text-[10px] font-bold ${
                              editLangTab === code
                                ? 'bg-amber-300 text-slate-950'
                                : 'bg-white/10 text-slate-300 hover:bg-white/20'
                            }`}
                          >
                            {LANGUAGE_LABELS[code].name}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="text"
                      aria-label={tx.adminMovieI18nTitlePh(LANGUAGE_LABELS[editLangTab].name)}
                      value={editI18n[editLangTab]?.title ?? ''}
                      onChange={(e) =>
                        setEditI18n({
                          ...editI18n,
                          [editLangTab]: {
                            ...editI18n[editLangTab],
                            title: e.target.value,
                          },
                        })
                      }
                      placeholder={tx.adminMovieI18nTitlePh(LANGUAGE_LABELS[editLangTab].name)}
                      className="w-full rounded-xl border border-white/15 bg-black/45 px-3 py-1.5 text-xs text-white"
                    />
                    <textarea
                      rows={2}
                      aria-label={tx.adminMovieI18nSynopsisPh(LANGUAGE_LABELS[editLangTab].name)}
                      value={editI18n[editLangTab]?.synopsis ?? ''}
                      onChange={(e) =>
                        setEditI18n({
                          ...editI18n,
                          [editLangTab]: {
                            ...editI18n[editLangTab],
                            synopsis: e.target.value,
                          },
                        })
                      }
                      placeholder={tx.adminMovieI18nSynopsisPh(LANGUAGE_LABELS[editLangTab].name)}
                      className="w-full rounded-xl border border-white/15 bg-black/45 p-2.5 text-xs text-white"
                    />
                  </div>

                  {/* Paleta de color dominante con estilos rápidos */}
                  <div className="rounded-2xl border border-white/10 bg-black/35 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-200">
                        {tx.adminMoviePaletteLabel}
                      </span>
                      <button
                        type="button"
                        disabled={!editingMovie.poster_url || extractingPalette}
                        onClick={handleExtractEditingPalette}
                        className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-sky-300 hover:bg-white/10 disabled:opacity-40"
                      >
                        {extractingPalette ? tx.adminExtractingBtn : tx.adminExtractPaletteBtn}
                      </button>
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {[
                        { name: 'Cosmic', palette: { primary: '#38bdf8', secondary: '#6366f1', accent: '#f59e0b' } },
                        { name: 'Neon', palette: { primary: '#f43f5e', secondary: '#8b5cf6', accent: '#22d3ee' } },
                        { name: 'Gold', palette: { primary: '#f59e0b', secondary: '#ea580c', accent: '#facc15' } },
                        { name: 'Forest', palette: { primary: '#10b981', secondary: '#0284c7', accent: '#fbbf24' } },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() =>
                            setEditingMovie({
                              ...editingMovie,
                              palette: { ...editingMovie.palette, ...preset.palette },
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:bg-white/15"
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: preset.palette.primary }}
                          />
                          {preset.name}
                        </button>
                      ))}
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      {(['primary', 'secondary', 'accent'] as const).map((slot) => (
                        <label key={slot} className="flex items-center gap-2 text-xs">
                          <input
                            type="color"
                            value={editingMovie.palette[slot]}
                            onChange={(e) =>
                              setEditingMovie({
                                ...editingMovie,
                                palette: {
                                  ...editingMovie.palette,
                                  [slot]: e.target.value,
                                },
                              })
                            }
                            className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
                          />
                          <span className="capitalize text-slate-300">
                            {slot === 'primary'
                              ? tx.adminPalettePrimary
                              : slot === 'secondary'
                                ? tx.adminPaletteSecondary
                                : tx.adminPaletteAccent}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingMovie(null)}
                      className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300"
                    >
                      {t.cancelBtn}
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-emerald-400 px-5 py-2 text-xs font-extrabold text-slate-950 hover:bg-emerald-300"
                    >
                      {t.saveMovieBtn}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
