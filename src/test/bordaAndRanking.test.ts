import { describe, expect, it } from 'vitest';
import type { Movie } from '../types/cinema';
import { formatDuration, getBordaPoints } from '../utils/borda';
import { assignMovieRank, moveMovieByStep } from '../utils/ranking';

const makeMovie = (id: string, title: string): Movie => ({
  id,
  title,
  original_title: title,
  year: 2024,
  duration_minutes: 120,
  genres: ['Cine'],
  tags: [],
  age_rating: 'TP',
  synopsis: 'Sinopsis',
  poster_url: '',
  backdrop_url: '',
  palette: { primary: '#6366f1', secondary: '#ec4899', accent: '#f59e0b' },
  status: 'published',
  display_order: 1,
});

describe('Puntuación Borda y mecánica de ordenamiento', () => {
  it('calcula puntos Borda clásicos y fraccionales', () => {
    expect(getBordaPoints(1, 3, 'classic')).toBe(3);
    expect(getBordaPoints(2, 3, 'classic')).toBe(2);
    expect(getBordaPoints(3, 3, 'classic')).toBe(1);

    expect(getBordaPoints(1, 5, 'classic')).toBe(5);
    expect(getBordaPoints(5, 5, 'classic')).toBe(1);

    expect(getBordaPoints(1, 3, 'fractional')).toBe(1);
    expect(getBordaPoints(2, 3, 'fractional')).toBe(0.5);
    expect(getBordaPoints(3, 3, 'fractional')).toBe(0.25);
  });

  it('asigna, intercambia, deselecciona y sustituye posiciones correctamente', () => {
    const a = makeMovie('a', 'Película A');
    const b = makeMovie('b', 'Película B');
    const c = makeMovie('c', 'Película C');
    const d = makeMovie('d', 'Película D');

    let list = assignMovieRank([], a, 1, 3);
    list = assignMovieRank(list, b, 2, 3);
    list = assignMovieRank(list, c, 1, 3); // C entra 1ª, desplaza A->2ª, B->3ª
    expect(list.map((m) => m.id)).toEqual(['c', 'a', 'b']);

    // Con TOP 3 completo, asignar D en 2º sustituye a 'a'
    list = assignMovieRank(list, d, 2, 3);
    expect(list.map((m) => m.id)).toEqual(['c', 'd', 'b']);

    // Pulsar el mismo rango activo (2º en D) lo quita
    list = assignMovieRank(list, d, 2, 3);
    expect(list.map((m) => m.id)).toEqual(['c', 'b']);

    // Mover con flecha
    list = moveMovieByStep(list, 1, -1);
    expect(list.map((m) => m.id)).toEqual(['b', 'c']);
  });

  it('formatea duraciones correctamente', () => {
    expect(formatDuration(169)).toBe('2h 49m');
    expect(formatDuration(120)).toBe('2h');
    expect(formatDuration(45)).toBe('45 min');
  });
});
