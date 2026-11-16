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
  Palette,
  Plus,
  Rocket,
  Settings2,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { IS_SANDBOX_MODE, cinemaApi } from '../services/api';
import type { DashboardResults, Movie, VotingSettings } from '../types/cinema';
import { extractPaletteFromImageCanvas } from '../utils/colorExtractor';
import { MoviePoster } from './MoviePoster';
import { ResultsDashboard } from './ResultsDashboard';

interface AdminPortalModalProps {
  open: boolean;
  onClose: () => void;
  onPublicDataChanged: () => Promise<void>;
}

type AdminTab = 'movies' | 'settings' | 'results';

export function AdminPortalModal({
  open,
  onClose,
  onPublicDataChanged,
}: AdminPortalModalProps) {
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

  // Fase 1: lista de títulos para barrido inteligente
  const [titlesInput, setTitlesInput] = useState(
    'Spider-Man: Un nuevo universo\nCoco\nWALL-E'
  );
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [editGenresText, setEditGenresText] = useState('');
  const [editTagsText, setEditTagsText] = useState('');
  const [extractingPalette, setExtractingPalette] = useState(false);

  function openEditModal(movie: Movie) {
    setEditingMovie({ ...movie });
    setEditGenresText(movie.genres.join(', '));
    setEditTagsText(movie.tags.join(', '));
  }

  // Edición de settings como texto auxiliar
  const [classesText, setClassesText] = useState('');
  const [domainsText, setDomainsText] = useState('');

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
        err instanceof Error ? err.message : 'Clave de administración inválida.'
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
      setFeedback({ type: 'err', text: 'Escribe al menos un título de película.' });
      return;
    }

    setFeedback(null);
    setBusyMessage(
      `Ejecutando barrido inteligente para ${titles.length} título(s) y extrayendo paletas…`
    );
    try {
      const created = await cinemaApi.adminEnrichBatch(adminSecret, titles);
      await loadAdminData(adminSecret);
      setTitlesInput('');
      setFeedback({
        type: 'ok',
        text: `Fase 1 completada: ${created.length} ficha(s) generada(s) en estado Borrador (draft) listas para revisar.`,
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Error en el barrido inteligente.',
      });
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleAddManualDraft() {
    setBusyMessage('Creando ficha en borrador…');
    try {
      const created = await cinemaApi.adminCreateManual(adminSecret, {
        title: 'Nueva película',
        year: 2024,
        duration_minutes: 110,
        genres: ['CineFórum'],
        tags: ['Debate'],
        age_rating: '+12',
        synopsis: 'Escribe aquí una sinopsis atractiva para el alumnado.',
      });
      await loadAdminData(adminSecret);
      openEditModal(created);
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Error creando ficha manual.',
      });
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleSaveMovieEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingMovie) return;
    setBusyMessage('Guardando cambios de la ficha…');
    try {
      const parsedGenres = editGenresText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const parsedTags = editTagsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

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
        palette: editingMovie.palette,
        status: editingMovie.status,
      });
      await loadAdminData(adminSecret);
      await onPublicDataChanged();
      setEditingMovie(null);
      setFeedback({ type: 'ok', text: 'Ficha actualizada correctamente.' });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'No se pudo actualizar la ficha.',
      });
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleExtractEditingPalette() {
    if (!editingMovie?.poster_url) return;
    setExtractingPalette(true);
    try {
      const palette = await extractPaletteFromImageCanvas(editingMovie.poster_url);
      setEditingMovie({ ...editingMovie, palette });
    } finally {
      setExtractingPalette(false);
    }
  }

  async function handlePublishDrafts() {
    setBusyMessage('Publicando cartelera aprobada para el alumnado…');
    setFeedback(null);
    try {
      const published = await cinemaApi.adminPublishBillboard(adminSecret);
      await loadAdminData(adminSecret);
      await onPublicDataChanged();
      setFeedback({
        type: 'ok',
        text: `¡Cartelera publicada! ${published.length} borrador(es) pasaron a estado "published" y ya son visibles para votar.`,
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'No se pudo publicar la cartelera.',
      });
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleToggleMovieStatus(movie: Movie) {
    const nextStatus = movie.status === 'published' ? 'draft' : 'published';
    setBusyMessage('Actualizando estado…');
    try {
      await cinemaApi.adminUpdateMovie(adminSecret, movie.id, { status: nextStatus });
      await loadAdminData(adminSecret);
      await onPublicDataChanged();
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Error al cambiar el estado.',
      });
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleDeleteMovie(movie: Movie) {
    setBusyMessage('Eliminando / archivando película…');
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
        text: err instanceof Error ? err.message : 'No se pudo eliminar.',
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
    setBusyMessage('Reordenando cartelera…');
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
        text: err instanceof Error ? err.message : 'No se pudo reordenar.',
      });
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleResetVotes() {
    setBusyMessage('Vaciando urna y reiniciando votos a cero…');
    setFeedback(null);
    try {
      await cinemaApi.adminResetVotes(adminSecret);
      await loadAdminData(adminSecret);
      await loadResults(adminSecret);
      setFeedback({
        type: 'ok',
        text: 'Urna vaciada a cero. Todos los votos y códigos OTP se han borrado.',
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'No se pudo vaciar la urna.',
      });
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleDeleteVote(voteId: string) {
    setBusyMessage('Anulando voto seleccionado…');
    try {
      await cinemaApi.adminDeleteVote(adminSecret, voteId);
      await loadAdminData(adminSecret);
      await loadResults(adminSecret);
      setFeedback({ type: 'ok', text: 'Voto anulado correctamente.' });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'No se pudo anular el voto.',
      });
    } finally {
      setBusyMessage(null);
    }
  }

  async function handleUpdateVote(
    voteId: string,
    patch: { curso?: string; ranked_movie_ids?: string[] }
  ) {
    setBusyMessage('Actualizando voto…');
    try {
      await cinemaApi.adminUpdateVote(adminSecret, voteId, patch);
      await loadResults(adminSecret);
      setFeedback({ type: 'ok', text: 'Voto modificado y escrutinio recalculado.' });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'No se pudo modificar el voto.',
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
    setBusyMessage('Guardando configuración de votación y tema visual…');
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
        text: 'Configuración y tematización visual actualizadas.',
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Error al guardar configuración.',
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
            aria-label="Panel del Profesorado y Resultados"
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
                    Panel de Control · Profesorado
                  </h2>
                  <p className="text-xs text-slate-400">
                    Gestión de cartelera en 2 fases, tematización dinámica y escrutinio Borda
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10"
              >
                <X className="h-4 w-4" />
                Volver a Cartelera Pública
              </button>
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
                      Acceso protegido
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Introduce la clave de administración (`ADMIN_SECRET`) para gestionar las
                      películas y consultar los resultados en directo.
                    </p>
                  </div>

                  {IS_SANDBOX_MODE && (
                    <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-200">
                      <strong>Modo Demo Local:</strong> usa la clave{' '}
                      <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono font-bold text-white">
                        demo1234
                      </code>
                    </div>
                  )}

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-300">
                      Clave del profesorado
                    </label>
                    <input
                      type="password"
                      required
                      value={adminSecret}
                      onChange={(e) => setAdminSecret(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-white/15 bg-black/50 px-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>

                  {authError && (
                    <div className="flex items-start gap-2 rounded-xl border border-rose-500/40 bg-rose-500/15 p-3 text-xs text-rose-200">
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
                        Verificando…
                      </>
                    ) : (
                      'Entrar al Panel'
                    )}
                  </button>
                </form>
              </div>
            ) : (
              <>
                {/* Pestañas */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
                  <div className="flex flex-wrap gap-2">
                    {[
                      {
                        id: 'movies' as const,
                        label: `Cartelera (${publishedMovies.length} pub · ${draftMovies.length} borrador)`,
                        icon: LayoutGrid,
                      },
                      {
                        id: 'results' as const,
                        label: `Dashboard de Resultados (${totalVotes} votos)`,
                        icon: BarChart3,
                      },
                      {
                        id: 'settings' as const,
                        label: 'Configuración y Reglas',
                        icon: Settings2,
                      },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const active = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
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
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-sky-300">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {busyMessage}
                    </span>
                  )}
                </div>

                {/* Cuerpo con scroll */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                  {feedback && (
                    <div
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
                              Fase 1 · Draft Generation
                            </span>
                            <h3 className="mt-1.5 font-display text-lg font-extrabold text-white">
                              Barrido inteligente por títulos
                            </h3>
                            <p className="mt-0.5 text-xs text-slate-300">
                              Escribe una lista de películas (una por línea). El sistema
                              recupera pósters HD, sinopsis juvenil, duración, edad y paleta
                              cromática dominante en estado{' '}
                              <code className="rounded bg-black/40 px-1 py-0.5 font-mono text-amber-300">
                                draft
                              </code>
                              .
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={handleAddManualDraft}
                            disabled={Boolean(busyMessage)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/10"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Añadir ficha manual
                          </button>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                          <textarea
                            rows={3}
                            value={titlesInput}
                            onChange={(e) => setTitlesInput(e.target.value)}
                            placeholder={'Interstellar\nSpider-Man: Un nuevo universo\nLa sociedad de la nieve'}
                            className="w-full rounded-2xl border border-white/15 bg-black/45 p-3.5 text-sm text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleSmartScan}
                            disabled={Boolean(busyMessage)}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-400 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg transition hover:bg-sky-300 disabled:opacity-50"
                          >
                            <Sparkles className="h-4 w-4" />
                            Generar borradores
                          </button>
                        </div>
                      </section>

                      {/* FASE 2: CONSISTENCIA, TEMA Y APROBACIÓN */}
                      <section className="space-y-4 rounded-3xl border border-white/15 bg-white/[0.02] p-5">
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                          <div>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                              <Eye className="h-3 w-3" />
                              Fase 2 · Consistencia y Aprobación
                            </span>
                            <h3 className="mt-1.5 font-display text-lg font-extrabold text-white">
                              Previsualización, tema visual y publicación
                            </h3>
                          </div>

                          <button
                            type="button"
                            disabled={draftMovies.length === 0 || Boolean(busyMessage)}
                            onClick={handlePublishDrafts}
                            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-xs font-extrabold text-slate-950 shadow-lg transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Rocket className="h-4 w-4" />
                            Aprobar y Publicar Cartelera ({draftMovies.length} borrador
                            {draftMovies.length === 1 ? '' : 'es'})
                          </button>
                        </div>

                        {/* Selector de Tema Visual */}
                        {settings && (
                          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-black/35 p-3.5">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-200">
                              <Palette className="h-4 w-4 text-amber-400" />
                              Tema visual público:
                            </span>
                            <select
                              value={settings.theme_mode}
                              onChange={(e) =>
                                handleSaveSettings({
                                  theme_mode: e.target.value as 'blend' | 'featured',
                                })
                              }
                              className="rounded-xl border border-white/15 bg-[#090c16] px-3 py-1.5 text-xs font-semibold text-white"
                            >
                              <option value="blend">
                                Blend dinámico (cambia según las pelis publicadas y hover)
                              </option>
                              <option value="featured">
                                Película principal fija (seleccionar abajo)
                              </option>
                            </select>

                            {settings.theme_mode === 'featured' && (
                              <select
                                value={settings.featured_movie_id || ''}
                                onChange={(e) =>
                                  handleSaveSettings({
                                    featured_movie_id: e.target.value || null,
                                  })
                                }
                                className="rounded-xl border border-white/15 bg-[#090c16] px-3 py-1.5 text-xs font-semibold text-white"
                              >
                                <option value="">Selecciona película tema…</option>
                                {movies.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.title} ({m.status})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}

                        {/* Grid de fichas Draft y Published */}
                        <div className="grid gap-4 md:grid-cols-2">
                          {movies.map((movie, idx) => (
                            <div
                              key={movie.id}
                              className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0d111e] p-4"
                            >
                              <div className="flex gap-3.5">
                                <div className="h-28 w-20 shrink-0 overflow-hidden rounded-xl border border-white/10">
                                  <MoviePoster
                                    title={movie.title}
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
                                        ? 'Visible al alumnado'
                                        : movie.status === 'draft'
                                          ? 'Borrador oculto'
                                          : 'Archivada'}
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
                                    {movie.title}
                                  </h4>
                                  <p className="text-[11px] text-slate-400">
                                    {movie.year || 'N/D'} · {movie.duration_minutes || '?'} min ·{' '}
                                    {movie.age_rating}
                                  </p>
                                  <p className="mt-1.5 line-clamp-2 text-xs text-slate-300">
                                    {movie.synopsis}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
                                <div className="flex flex-wrap gap-1.5">
                                  <button
                                    type="button"
                                    disabled={idx === 0 || Boolean(busyMessage)}
                                    onClick={() => handleMoveMovieOrder(idx, -1)}
                                    title="Subir en la cartelera"
                                    aria-label={`Subir ${movie.title}`}
                                    className="rounded-lg border border-white/15 bg-white/5 p-1.5 text-slate-300 hover:bg-white/10 disabled:opacity-30"
                                  >
                                    <ArrowUp className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === movies.length - 1 || Boolean(busyMessage)}
                                    onClick={() => handleMoveMovieOrder(idx, 1)}
                                    title="Bajar en la cartelera"
                                    aria-label={`Bajar ${movie.title}`}
                                    className="rounded-lg border border-white/15 bg-white/5 p-1.5 text-slate-300 hover:bg-white/10 disabled:opacity-30"
                                  >
                                    <ArrowDown className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(movie)}
                                    className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-white/10"
                                  >
                                    Modificar ficha
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleToggleMovieStatus(movie)}
                                    className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-sky-300 hover:bg-white/10"
                                  >
                                    {movie.status === 'published'
                                      ? 'Ocultar (Borrador)'
                                      : 'Publicar'}
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteMovie(movie)}
                                  aria-label={`Eliminar ${movie.title}`}
                                  className="rounded-lg border border-rose-500/25 bg-rose-500/10 p-1.5 text-rose-300 hover:bg-rose-500/20"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
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
                        Parámetros de la Votación y Seguridad Escolar
                      </h3>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-300">
                            Título de campaña
                          </label>
                          <input
                            type="text"
                            value={settings.campaign_title}
                            onChange={(e) =>
                              setSettings({ ...settings, campaign_title: e.target.value })
                            }
                            className="w-full rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-sm text-white"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-300">
                            Estado de la urna
                          </label>
                          <select
                            value={settings.voting_open ? 'open' : 'closed'}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                voting_open: e.target.value === 'open',
                              })
                            }
                            className="w-full rounded-xl border border-white/15 bg-[#090c16] px-3 py-2 text-sm text-white"
                          >
                            <option value="open">Abierta (alumnado puede votar)</option>
                            <option value="closed">Cerrada (solo lectura)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-300">
                          Subtítulo educativo
                        </label>
                        <input
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
                          <label className="mb-1 block text-xs font-semibold text-slate-300">
                            Número de preferencias a ordenar
                          </label>
                          <select
                            value={settings.top_k}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                top_k: Number(e.target.value) as 3 | 5,
                              })
                            }
                            className="w-full rounded-xl border border-white/15 bg-[#090c16] px-3 py-2 text-sm text-white"
                          >
                            <option value={3}>TOP 3 (recomendado)</option>
                            <option value={5}>TOP 5</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-300">
                            Escala de puntuación Borda
                          </label>
                          <select
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
                              Clásico (3 pts, 2 pts, 1 pt)
                            </option>
                            <option value="fractional">
                              Decreciente (1 pt, 0.5 pts, 0.25 pts)
                            </option>
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-300">
                            Cursos / Grupos permitidos (uno por línea)
                          </label>
                          <textarea
                            rows={6}
                            value={classesText}
                            onChange={(e) => setClassesText(e.target.value)}
                            className="w-full rounded-xl border border-white/15 bg-black/45 p-3 font-mono text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-300">
                            Dominios de correo del centro (opcional, separados por coma)
                          </label>
                          <textarea
                            rows={3}
                            value={domainsText}
                            onChange={(e) => setDomainsText(e.target.value)}
                            placeholder="Ej: iesejemplo.es, educa.madrid.org (vacío = cualquier correo válido no desechable)"
                            className="w-full rounded-xl border border-white/15 bg-black/45 p-3 font-mono text-xs text-white"
                          />
                          <p className="mt-2 text-[11px] text-slate-400">
                            La lista negra de dominios temporales/desechables (mailinator,
                            yopmail, 10minutemail…) siempre permanece activa.
                          </p>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={Boolean(busyMessage)}
                        className="rounded-2xl bg-amber-400 px-6 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-amber-300"
                      >
                        Guardar configuración
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
                        setBusyMessage('Actualizando escrutinio…');
                        loadResults(adminSecret).finally(() => setBusyMessage(null));
                      }}
                      onResetVotes={handleResetVotes}
                      onDeleteVote={handleDeleteVote}
                      onUpdateVote={handleUpdateVote}
                    />
                  )}
                </div>
              </>
            )}

            {/* Sub-modal de edición de película individual */}
            {editingMovie && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
                <form
                  onSubmit={handleSaveMovieEdit}
                  className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-3xl border border-white/20 bg-[#101526] p-6 shadow-2xl"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="flex items-center gap-2 font-display text-lg font-bold text-white">
                      <Film className="h-4 w-4 text-amber-400" />
                      Editor gráfico de película
                    </h4>
                    <button
                      type="button"
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
                      <label className="mb-1 block text-xs font-semibold text-slate-300">
                        Título de la película
                      </label>
                      <input
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
                      <label className="mb-1 block text-xs font-semibold text-slate-300">
                        Año de estreno
                      </label>
                      <input
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
                      <label className="mb-1 block text-xs font-semibold text-slate-300">
                        Duración (minutos)
                      </label>
                      <input
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
                    <label className="mb-1.5 block text-xs font-semibold text-slate-300">
                      Edad recomendada (pulsa para elegir)
                    </label>
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
                    <label className="mb-1 block text-xs font-semibold text-slate-300">
                      Sinopsis breve para el alumnado
                    </label>
                    <textarea
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
                      <label className="mb-1 block text-xs font-semibold text-slate-300">
                        Géneros (separados por coma)
                      </label>
                      <input
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
                      <label className="mb-1 block text-xs font-semibold text-slate-300">
                        Etiquetas temáticas (coma)
                      </label>
                      <input
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
                    <label className="mb-1 block text-xs font-semibold text-slate-300">
                      Imagen de portada (URL del póster)
                    </label>
                    <input
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
                    <label className="mb-1 block text-xs font-semibold text-slate-300">
                      Imagen ancha de cabecera (opcional)
                    </label>
                    <input
                      type="url"
                      value={editingMovie.backdrop_url}
                      onChange={(e) =>
                        setEditingMovie({ ...editingMovie, backdrop_url: e.target.value })
                      }
                      placeholder="https://image.tmdb.org/t/p/w1280/..."
                      className="w-full rounded-xl border border-white/15 bg-black/45 px-3 py-2 text-xs text-white"
                    />
                  </div>

                  {/* Paleta de color dominante con estilos rápidos */}
                  <div className="rounded-2xl border border-white/10 bg-black/35 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-200">
                        Colores de ambiente de esta película
                      </span>
                      <button
                        type="button"
                        disabled={!editingMovie.poster_url || extractingPalette}
                        onClick={handleExtractEditingPalette}
                        className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-sky-300 hover:bg-white/10 disabled:opacity-40"
                      >
                        {extractingPalette ? 'Extrayendo…' : 'Extraer del póster'}
                      </button>
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {[
                        { name: 'Espacial', palette: { primary: '#38bdf8', secondary: '#6366f1', accent: '#f59e0b' } },
                        { name: 'Neón', palette: { primary: '#f43f5e', secondary: '#8b5cf6', accent: '#22d3ee' } },
                        { name: 'Dorado', palette: { primary: '#f59e0b', secondary: '#ea580c', accent: '#facc15' } },
                        { name: 'Bosque', palette: { primary: '#10b981', secondary: '#0284c7', accent: '#fbbf24' } },
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() =>
                            setEditingMovie({ ...editingMovie, palette: preset.palette })
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

                    <div className="mt-3 grid grid-cols-3 gap-3">
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
                              ? 'Principal'
                              : slot === 'secondary'
                                ? 'Secundario'
                                : 'Acento'}
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
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-emerald-400 px-5 py-2 text-xs font-extrabold text-slate-950 hover:bg-emerald-300"
                    >
                      Guardar ficha
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
