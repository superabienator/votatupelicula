import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Fingerprint,
  Scale,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '../i18n/I18nContext';
import type { AppLanguage, ScoringMode } from '../types/cinema';
import { getScoringWeightsList } from '../utils/borda';
import { useEscapeKey } from '../utils/useEscapeKey';

interface CivicEducationModalProps {
  open: boolean;
  onClose: () => void;
  topK: 3 | 5;
  scoringMode: ScoringMode;
}

type SimSystem = 'fptp' | 'approval' | 'borda';

const SIM_MOVIES_BY_LANG: Record<
  AppLanguage,
  Array<{
    id: string;
    name: string;
    tag: string;
    color: string;
    fptpPct: number;
    approvalPct: number;
    bordaPts: number;
    note: string;
  }>
> = {
  es: [
    {
      id: 'space',
      name: 'Aventura Espacial A',
      tag: 'Ciencia ficción',
      color: '#38bdf8',
      fptpPct: 28,
      approvalPct: 68,
      bordaPts: 23,
      note: 'Gusta muchísimo como 1ª o 2ª opción a casi toda la clase.',
    },
    {
      id: 'scifi',
      name: 'Acción Sci-Fi B',
      tag: 'Parecida a la A',
      color: '#818cf8',
      fptpPct: 27,
      approvalPct: 62,
      bordaPts: 19,
      note: 'Divide votos con la peli A en Mayoría Simple.',
    },
    {
      id: 'horror',
      name: 'Terror Extremo C',
      tag: 'Polarizante',
      color: '#f43f5e',
      fptpPct: 45,
      approvalPct: 45,
      bordaPts: 18,
      note: 'El 45% la ama, pero el 55% restante NO la soportaría ver.',
    },
  ],
  va: [
    {
      id: 'space',
      name: 'Aventura Espacial A',
      tag: 'Ciència-ficció',
      color: '#38bdf8',
      fptpPct: 28,
      approvalPct: 68,
      bordaPts: 23,
      note: 'Agrada moltíssim com a 1a o 2a opció a quasi tota la classe.',
    },
    {
      id: 'scifi',
      name: 'Acció Sci-Fi B',
      tag: 'Pareguda a l’A',
      color: '#818cf8',
      fptpPct: 27,
      approvalPct: 62,
      bordaPts: 19,
      note: 'Divideix vots amb la pel·li A en Majoria Simple.',
    },
    {
      id: 'horror',
      name: 'Terror Extrem C',
      tag: 'Polaritzant',
      color: '#f43f5e',
      fptpPct: 45,
      approvalPct: 45,
      bordaPts: 18,
      note: 'El 45% l’estima, però el 55% restant NO la suportaria veure.',
    },
  ],
  en: [
    {
      id: 'space',
      name: 'Space Adventure A',
      tag: 'Science Fiction',
      color: '#38bdf8',
      fptpPct: 28,
      approvalPct: 68,
      bordaPts: 23,
      note: 'Loved as a #1 or #2 pick by almost the entire class.',
    },
    {
      id: 'scifi',
      name: 'Sci-Fi Action B',
      tag: 'Similar to A',
      color: '#818cf8',
      fptpPct: 27,
      approvalPct: 62,
      bordaPts: 19,
      note: 'Splits votes with movie A under Plurality.',
    },
    {
      id: 'horror',
      name: 'Extreme Horror C',
      tag: 'Polarizing',
      color: '#f43f5e',
      fptpPct: 45,
      approvalPct: 45,
      bordaPts: 18,
      note: '45% love it, while the remaining 55% strongly dislike it.',
    },
  ],
};

export function CivicEducationModal({
  open,
  onClose,
  topK,
  scoringMode,
}: CivicEducationModalProps) {
  const { lang, t } = useI18n();
  const [simSystem, setSimSystem] = useState<SimSystem>('borda');
  const weights = getScoringWeightsList(topK, scoringMode);
  const simMovies = SIM_MOVIES_BY_LANG[lang];
  useEscapeKey(open, onClose);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 backdrop-blur-md sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="civic-modal-title"
            className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-white/15 bg-[#0d101b] p-5 text-slate-100 shadow-2xl sm:p-8"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300">
                  <Scale className="h-3.5 w-3.5" />
                  {t.civicBadge}
                </span>
                <h2
                  id="civic-modal-title"
                  className="mt-2 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl"
                >
                  {t.civicTitle}
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  {t.civicIntro(topK)}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t.closeBtn}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Los 3 sistemas */}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {/* 1. Mayoría Simple */}
              <div className="flex flex-col rounded-2xl border border-rose-500/25 bg-rose-950/15 p-4">
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-rose-500/20 px-2.5 py-1 text-xs font-bold text-rose-300">
                    {t.civicSys1Badge}
                  </span>
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                </div>
                <h3 className="mt-3 font-display text-lg font-bold text-white">
                  {t.civicSys1Title}
                </h3>
                <p className="text-[11px] font-medium uppercase tracking-wider text-rose-300/80">
                  {t.civicSys1Sub}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  {t.civicSys1Desc}
                </p>
                <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                  <li className="flex items-start gap-1.5">
                    <span className="mt-0.5 text-rose-400">•</span>
                    <span>{t.civicSys1P1}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="mt-0.5 text-rose-400">•</span>
                    <span>{t.civicSys1P2}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="mt-0.5 text-rose-400">•</span>
                    <span>{t.civicSys1P3}</span>
                  </li>
                </ul>
              </div>

              {/* 2. Voto Aprobatorio */}
              <div className="flex flex-col rounded-2xl border border-amber-400/25 bg-amber-950/15 p-4">
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-amber-400/20 px-2.5 py-1 text-xs font-bold text-amber-300">
                    {t.civicSys2Badge}
                  </span>
                  <ThumbsUp className="h-4 w-4 text-amber-400" />
                </div>
                <h3 className="mt-3 font-display text-lg font-bold text-white">
                  {t.civicSys2Title}
                </h3>
                <p className="text-[11px] font-medium uppercase tracking-wider text-amber-300/80">
                  {t.civicSys2Sub}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  {t.civicSys2Desc}
                </p>
                <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                  <li className="flex items-start gap-1.5">
                    <span className="mt-0.5 text-emerald-400">+</span>
                    <span>{t.civicSys2P1}</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="mt-0.5 text-amber-400">–</span>
                    <span>{t.civicSys2P2}</span>
                  </li>
                </ul>
              </div>

              {/* 3. Voto Preferencial Borda (Implementado) */}
              <div
                className="flex flex-col rounded-2xl border p-4 shadow-lg"
                style={{
                  borderColor: 'color-mix(in srgb, var(--theme-primary) 55%, transparent)',
                  background:
                    'linear-gradient(155deg, rgba(16,185,129,0.14) 0%, rgba(56,189,248,0.10) 100%)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-400/20 px-2.5 py-1 text-xs font-bold text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {t.civicSys3Badge}
                  </span>
                  <Award className="h-4 w-4 text-emerald-300" />
                </div>
                <h3 className="mt-3 font-display text-lg font-bold text-white">
                  {t.civicSys3Title}
                </h3>
                <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-300/80">
                  {t.civicSys3Sub}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-200">
                  {t.civicSys3Desc(topK)}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {weights.map((w) => (
                    <span
                      key={w.rank}
                      className="rounded-lg border border-white/15 bg-black/35 px-2 py-1 font-mono text-xs font-bold text-amber-300"
                    >
                      {t.rankOrdinal(w.rank)} = {w.points} {w.points === 1 ? t.ptSingular : t.ptPlural}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-200">
                  {t.civicSys3Footer}
                </p>
              </div>
            </div>

            {/* Bloque didáctico: verificabilidad y auditoría democrática del voto */}
            <div className="mt-6 rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-indigo-500/15 via-slate-900/60 to-emerald-500/10 p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/35 bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-bold text-indigo-200">
                  <Fingerprint className="h-3.5 w-3.5 text-indigo-300" />
                  {t.civicAuditBadge}
                </span>
              </div>
              <h3 className="mt-2 font-display text-lg font-extrabold text-white">
                {t.civicAuditTitle}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                {t.civicAuditDesc}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs leading-relaxed text-slate-200">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                    <span>{t.civicAuditP1}</span>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs leading-relaxed text-slate-200">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                    <span>{t.civicAuditP2}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulador gráfico interactivo */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="flex items-center gap-2 font-display text-base font-bold text-white">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    {t.simTitle}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {t.simSubtitle}
                  </p>
                </div>

                <div
                  role="tablist"
                  aria-label={t.simTitle}
                  className="inline-flex flex-wrap rounded-xl border border-white/10 bg-black/40 p-1"
                >
                  {(
                    [
                      { id: 'fptp', label: t.simTabFptp },
                      { id: 'approval', label: t.simTabApproval },
                      { id: 'borda', label: t.simTabBorda },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={simSystem === tab.id}
                      onClick={() => setSimSystem(tab.id)}
                      className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                        simSystem === tab.id
                          ? 'bg-white text-slate-950 shadow'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {simMovies.map((movie) => {
                  const value =
                    simSystem === 'fptp'
                      ? movie.fptpPct
                      : simSystem === 'approval'
                        ? movie.approvalPct
                        : Math.round((movie.bordaPts / 25) * 100);
                  const isWinner =
                    (simSystem === 'fptp' && movie.id === 'horror') ||
                    (simSystem !== 'fptp' && movie.id === 'space');

                  return (
                    <div key={movie.id} className="space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-white">{movie.name}</span>
                          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-300">
                            {movie.tag}
                          </span>
                          {isWinner && (
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                              {t.simWinnerBadge}
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-bold text-slate-200">
                          {simSystem === 'borda'
                            ? `${movie.bordaPts} ${t.ptPlural}`
                            : `${value}%`}
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className="h-full rounded-full"
                          initial={false}
                          animate={{ width: `${value}%` }}
                          transition={{ type: 'spring', stiffness: 220, damping: 24 }}
                          style={{ backgroundColor: movie.color }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">{movie.note}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-slate-200">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
                <span>
                  {simSystem === 'fptp' &&
                    (lang === 'en'
                      ? 'Polarized outcome: Both Sci-Fi movies split the vote (28% + 27%) and Extreme Horror won even though 55% of the class did not want it.'
                      : lang === 'va'
                        ? 'Resultat polaritzat: Les dues pel·lis de Ciència-Ficció es van dividir el vot (28% + 27%) i va guanyar Terror Extrem encara que el 55% de la classe no la volia veure.'
                        : 'Resultado polarizado: Las dos pelis de Ciencia Ficción se dividieron el voto (28% + 27%) y ganó Terror Extremo aunque el 55% de la clase no quería verla.')}
                  {simSystem === 'approval' &&
                    (lang === 'en'
                      ? 'Better consensus: Approval lets students endorse multiple movies, picking Space Adventure A with 68% acceptance, though without ranking intensity.'
                      : lang === 'va'
                        ? 'Millor consens: En poder aprovar diverses opcions, Aventura Espacial A guanya amb un 68% d’acceptació, encara que sense mesurar la intensitat.'
                        : 'Mejor consenso: Al poder aprobar varias opciones, Aventura Espacial A gana con un 68% de aceptación, aunque sin medir cuál es la #1 absoluta.')}
                  {simSystem === 'borda' &&
                    (lang === 'en'
                      ? 'Consensus + Intensity (Borda): Space Adventure A wins cleanly (23 pts) by uniting #1 and #2 preferences across the class.'
                      : lang === 'va'
                        ? 'Consens + Intensitat (Borda): Aventura Espacial A guanya netament (23 pts) perquè uneix tant a qui la posa 1a com a qui la tria 2a.'
                        : 'Consenso + Intensidad (Borda): Aventura Espacial A gana limpiamente (23 pts) porque une tanto a quienes la ponen 1ª como a quienes la eligen 2ª.')}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
