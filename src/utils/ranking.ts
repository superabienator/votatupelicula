import type { Movie } from '../types/cinema';

export function assignMovieRank(
  currentList: Movie[],
  movie: Movie,
  targetRank: number,
  topK: 3 | 5
): Movie[] {
  const targetIdx = Math.max(0, Math.min(topK - 1, targetRank - 1));
  const existingIdx = currentList.findIndex((m) => m.id === movie.id);

  // Si pulsa la posición que ya tenía asignada -> deseleccionar
  if (existingIdx === targetIdx) {
    return currentList.filter((m) => m.id !== movie.id);
  }

  // Si ya estaba en la lista en otra posición -> reubicar
  if (existingIdx !== -1) {
    const next = [...currentList];
    next.splice(existingIdx, 1);
    const insertIdx = Math.min(targetIdx, next.length);
    next.splice(insertIdx, 0, movie);
    return next;
  }

  // Si aún hay huecos -> insertar en la posición solicitada (o al final si faltan anteriores)
  if (currentList.length < topK) {
    const next = [...currentList];
    const insertIdx = Math.min(targetIdx, next.length);
    next.splice(insertIdx, 0, movie);
    return next;
  }

  // Si el TOP ya está completo -> sustituir esa posición concreta
  const next = [...currentList];
  next[targetIdx] = movie;
  return next;
}

export function moveMovieByStep(
  currentList: Movie[],
  index: number,
  delta: -1 | 1
): Movie[] {
  const nextIndex = index + delta;
  if (index < 0 || index >= currentList.length) return currentList;
  if (nextIndex < 0 || nextIndex >= currentList.length) return currentList;

  const next = [...currentList];
  const [item] = next.splice(index, 1);
  next.splice(nextIndex, 0, item);
  return next;
}
