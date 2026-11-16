import { Clapperboard, Film, Popcorn, Sparkles, Star, Ticket } from 'lucide-react';

/**
 * Motivos cinematográficos decorativos de fondo para dar un ambiente
 * luminoso, juvenil y festivo sin interferir con la lectura.
 */
export function CinemaDecorations() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {/* Motivo superior izquierdo: Claqueta */}
      <div className="absolute -left-6 top-24 rotate-[-14deg] text-amber-300/[0.08]">
        <Clapperboard className="h-36 w-36 sm:h-48 sm:w-48" strokeWidth={1.3} />
      </div>

      {/* Motivo superior derecho: Palomitas */}
      <div className="absolute -right-6 top-32 rotate-[16deg] text-rose-300/[0.09]">
        <Popcorn className="h-36 w-36 sm:h-48 sm:w-48" strokeWidth={1.3} />
      </div>

      {/* Motivo medio izquierdo: Carrete de cine */}
      <div className="absolute left-6 top-[54%] rotate-[12deg] text-sky-300/[0.08]">
        <Film className="h-32 w-32 sm:h-40 sm:w-40" strokeWidth={1.3} />
      </div>

      {/* Motivo inferior derecho: Entrada de cine */}
      <div className="absolute bottom-16 right-8 rotate-[-18deg] text-emerald-300/[0.08]">
        <Ticket className="h-36 w-36 sm:h-44 sm:w-44" strokeWidth={1.3} />
      </div>

      {/* Destellos y estrellas juveniles */}
      <Star className="absolute left-[22%] top-[16%] h-6 w-6 rotate-12 text-amber-300/20" />
      <Sparkles className="absolute right-[26%] top-[22%] h-7 w-7 text-sky-300/20" />
      <Star className="absolute left-[48%] bottom-[14%] h-5 w-5 -rotate-12 text-rose-300/20" />
    </div>
  );
}

/**
 * Tira perforada de celuloide 35mm para enmarcar secciones clave.
 */
export function FilmStripDivider() {
  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-between gap-2 overflow-hidden px-2 py-1.5 opacity-45"
    >
      {Array.from({ length: 24 }, (_, i) => (
        <span
          key={i}
          className="h-2 w-3.5 shrink-0 rounded-[3px] border border-white/40 bg-white/15"
        />
      ))}
    </div>
  );
}
