import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Scale,
  Sparkles,
  ThumbsUp,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import type { ScoringMode } from '../types/cinema';
import { getScoringWeightsList } from '../utils/borda';
import { useEscapeKey } from '../utils/useEscapeKey';

interface CivicEducationModalProps {
  open: boolean;
  onClose: () => void;
  topK: 3 | 5;
  scoringMode: ScoringMode;
}

type SimSystem = 'fptp' | 'approval' | 'borda';

const SIM_MOVIES = [
  {
    name: 'Aventura Espacial A',
    tag: 'Ciencia ficción',
    color: '#38bdf8',
    fptpPct: 28,
    approvalPct: 68,
    bordaPts: 23,
    note: 'Gusta muchísimo como 1ª o 2ª opción a casi toda la clase.',
  },
  {
    name: 'Acción Sci-Fi B',
    tag: 'Parecida a la A',
    color: '#818cf8',
    fptpPct: 27,
    approvalPct: 62,
    bordaPts: 19,
    note: 'Divide votos con la peli A en Mayoría Simple.',
  },
  {
    name: 'Terror Extremo C',
    tag: 'Polarizante',
    color: '#f43f5e',
    fptpPct: 45,
    approvalPct: 45,
    bordaPts: 18,
    note: 'El 45% la ama, pero el 55% restante NO la soportaría ver.',
  },
];

export function CivicEducationModal({
  open,
  onClose,
  topK,
  scoringMode,
}: CivicEducationModalProps) {
  const [simSystem, setSimSystem] = useState<SimSystem>('borda');
  const weights = getScoringWeightsList(topK, scoringMode);
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
                  Educación Cívica y Democrática
                </span>
                <h2
                  id="civic-modal-title"
                  className="mt-2 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl"
                >
                  ¿Cómo funciona tu voto?
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  No todos los sistemas de votación eligen igual. Descubre por qué aquí
                  ordenamos un <strong>TOP {topK}</strong> en lugar de marcar solo una casilla.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar explicación"
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
                    Tradicional
                  </span>
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                </div>
                <h3 className="mt-3 font-display text-lg font-bold text-white">
                  1. Mayoría Simple
                </h3>
                <p className="text-[11px] font-medium uppercase tracking-wider text-rose-300/80">
                  First-Past-The-Post
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  El clásico «una persona, una X». Gana quien suma más votos individuales,
                  aunque sea con menos del 50%.
                </p>
                <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                  <li className="flex items-start gap-1.5">
                    <span className="mt-0.5 text-rose-400">•</span>
                    <span>
                      <strong>Polarización:</strong> Puede ganar una película que la mayoría
                      rechaza si sus fans se concentran.
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="mt-0.5 text-rose-400">•</span>
                    <span>
                      <strong>División del voto:</strong> Dos pelis parecidas se «roban»
                      votos entre sí y pierden ambas.
                    </span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="mt-0.5 text-rose-400">•</span>
                    <span>
                      <strong>Voto «tirado»:</strong> Si votas a tu favorita minoritaria,
                      sientes que tu voto no sirve y acabas votando «por miedo».
                    </span>
                  </li>
                </ul>
              </div>

              {/* 2. Voto Aprobatorio */}
              <div className="flex flex-col rounded-2xl border border-amber-400/25 bg-amber-950/15 p-4">
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-amber-400/20 px-2.5 py-1 text-xs font-bold text-amber-300">
                    Intermedio
                  </span>
                  <ThumbsUp className="h-4 w-4 text-amber-400" />
                </div>
                <h3 className="mt-3 font-display text-lg font-bold text-white">
                  2. Voto Aprobatorio
                </h3>
                <p className="text-[11px] font-medium uppercase tracking-wider text-amber-300/80">
                  Approval Voting
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  Marcas con «me vale» todas las películas que aceptarías ver en el aula, sin
                  límite de opciones.
                </p>
                <ul className="mt-3 space-y-1.5 text-xs text-slate-300">
                  <li className="flex items-start gap-1.5">
                    <span className="mt-0.5 text-emerald-400">+</span>
                    <span>Reduce la división del voto entre películas parecidas.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="mt-0.5 text-amber-400">–</span>
                    <span>
                      <strong>Sin matices:</strong> No distingue entre la película que te
                      flipa (#1) y una que simplemente «tolerarías».
                    </span>
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
                    Usado en esta app
                  </span>
                  <Award className="h-4 w-4 text-emerald-300" />
                </div>
                <h3 className="mt-3 font-display text-lg font-bold text-white">
                  3. Voto Preferencial
                </h3>
                <p className="text-[11px] font-medium uppercase tracking-wider text-emerald-300/80">
                  Ranked-Choice · Recuento Borda
                </p>
                <p className="mt-2 text-xs leading-relaxed text-slate-200">
                  Ordenas tu <strong>TOP {topK}</strong> de mayor a menor preferencia. Cada
                  posición reparte puntos:
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {weights.map((w) => (
                    <span
                      key={w.rank}
                      className="rounded-lg border border-white/15 bg-black/35 px-2 py-1 font-mono text-xs font-bold text-amber-300"
                    >
                      {w.rank}º = {w.points} {w.points === 1 ? 'pt' : 'pts'}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-slate-200">
                  <strong>¿Por qué es más justo?</strong> Premia el{' '}
                  <span className="text-emerald-300">consenso general</span> y garantiza que{' '}
                  <span className="text-sky-300">todas tus opciones ponderen</span>, incluso si
                  tu favorita no gana.
                </p>
              </div>
            </div>

            {/* Simulador gráfico interactivo */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="flex items-center gap-2 font-display text-base font-bold text-white">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    Experimento en directo: Una clase de 20 alumnos vota 3 pelis
                  </h4>
                  <p className="text-xs text-slate-400">
                    Cambia el sistema de recuento con los mismos gustos del alumnado y mira quién
                    gana:
                  </p>
                </div>

                <div className="inline-flex rounded-xl border border-white/10 bg-black/40 p-1">
                  {(
                    [
                      { id: 'fptp', label: 'Mayoría Simple' },
                      { id: 'approval', label: 'Aprobatorio' },
                      { id: 'borda', label: 'Borda (Esta app)' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
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
                {SIM_MOVIES.map((movie) => {
                  const value =
                    simSystem === 'fptp'
                      ? movie.fptpPct
                      : simSystem === 'approval'
                        ? movie.approvalPct
                        : Math.round((movie.bordaPts / 25) * 100);
                  const isWinner =
                    (simSystem === 'fptp' && movie.name.includes('Terror')) ||
                    (simSystem !== 'fptp' && movie.name.includes('Espacial'));

                  return (
                    <div key={movie.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{movie.name}</span>
                          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-slate-300">
                            {movie.tag}
                          </span>
                          {isWinner && (
                            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                              Ganadora
                            </span>
                          )}
                        </div>
                        <span className="font-mono font-bold text-slate-200">
                          {simSystem === 'borda'
                            ? `${movie.bordaPts} pts Borda`
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
                  {simSystem === 'fptp' && (
                    <>
                      <strong>Resultado polarizado:</strong> Las dos pelis de Ciencia Ficción
                      se dividieron el voto (28% + 27%) y ganó <em>Terror Extremo</em> aunque el{' '}
                      <strong>55% de la clase no quería verla</strong>.
                    </>
                  )}
                  {simSystem === 'approval' && (
                    <>
                      <strong>Mejor consenso:</strong> Al poder aprobar varias opciones,{' '}
                      <em>Aventura Espacial A</em> gana con un 68% de aceptación, aunque no
                      sabemos cuánta gente la quería como su #1 absoluta.
                    </>
                  )}
                  {simSystem === 'borda' && (
                    <>
                      <strong>Consenso + Intensidad (Borda):</strong> <em>Aventura Espacial A</em>{' '}
                      gana limpiamente (23 pts) porque une tanto a quienes la ponen 1ª como a
                      quienes la eligen 2ª, logrando que la clase disfrute junta.
                    </>
                  )}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
