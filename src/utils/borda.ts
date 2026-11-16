import type { ScoringMode } from '../types/cinema';

export function getBordaPoints(
  rankPosition: number,
  topK: 3 | 5,
  scoringMode: ScoringMode
): number {
  if (rankPosition < 1 || rankPosition > topK) return 0;
  if (scoringMode === 'fractional') {
    const table: Record<number, number> = {
      1: 1,
      2: 0.5,
      3: 0.25,
      4: 0.15,
      5: 0.1,
    };
    return table[rankPosition] ?? 0;
  }
  return topK - rankPosition + 1;
}

export function getScoringWeightsList(
  topK: 3 | 5,
  scoringMode: ScoringMode
): Array<{ rank: number; points: number }> {
  return Array.from({ length: topK }, (_, idx) => {
    const rank = idx + 1;
    return { rank, points: getBordaPoints(rank, topK, scoringMode) };
  });
}

export function formatPointsLabel(points: number): string {
  const formatted = Number.isInteger(points) ? String(points) : String(points);
  return `${formatted} ${points === 1 ? 'pt' : 'pts'}`;
}

export function formatDuration(minutes: number | null): string {
  if (!minutes || minutes <= 0) return 'N/D';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function getRankMedal(rank: number): {
  emoji: string;
  label: string;
  ringClass: string;
  badgeClass: string;
} {
  switch (rank) {
    case 1:
      return {
        emoji: '🥇',
        label: '1ª opción',
        ringClass: 'ring-amber-400/70',
        badgeClass: 'bg-amber-400/20 text-amber-300 border-amber-400/50',
      };
    case 2:
      return {
        emoji: '🥈',
        label: '2ª opción',
        ringClass: 'ring-slate-300/60',
        badgeClass: 'bg-slate-300/20 text-slate-200 border-slate-300/50',
      };
    case 3:
      return {
        emoji: '🥉',
        label: '3ª opción',
        ringClass: 'ring-orange-400/60',
        badgeClass: 'bg-orange-400/20 text-orange-300 border-orange-400/50',
      };
    default:
      return {
        emoji: `${rank}º`,
        label: `${rank}ª opción`,
        ringClass: 'ring-sky-400/60',
        badgeClass: 'bg-sky-400/20 text-sky-300 border-sky-400/50',
      };
  }
}
