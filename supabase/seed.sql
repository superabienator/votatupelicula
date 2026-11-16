-- ============================================================================
-- Seed opcional de ejemplo para probar la cartelera en Supabase inmediatamente
-- ============================================================================

INSERT INTO public.movies (
  title,
  original_title,
  year,
  duration_minutes,
  genres,
  tags,
  age_rating,
  synopsis,
  poster_url,
  backdrop_url,
  palette,
  tmdb_id,
  source_provider,
  status,
  display_order
) VALUES
(
  'Interstellar',
  'Interstellar',
  2014,
  169,
  ARRAY['Ciencia ficción', 'Aventura', 'Drama'],
  ARRAY['Viaje espacial', 'Relatividad', 'Familia'],
  '+12',
  'Cuando la Tierra se vuelve inhabitable, un equipo de exploradores atraviesa un agujero de gusano para buscar un nuevo hogar para la humanidad.',
  'https://image.tmdb.org/t/p/w780/nrSaXF39nDfAAeLKksRCyvSzI2a.jpg',
  'https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK5VQsXEG.jpg',
  '{"primary":"#38bdf8","secondary":"#f59e0b","accent":"#6366f1"}'::jsonb,
  157336,
  'tmdb',
  'published',
  1
),
(
  'Spider-Man: Cruzando el Multiverso',
  'Spider-Man: Across the Spider-Verse',
  2023,
  140,
  ARRAY['Animación', 'Acción', 'Aventura'],
  ARRAY['Multiverso', 'Identidad', 'Arte visual'],
  '+7',
  'Miles Morales salta entre universos junto a Gwen Stacy y descubre una sociedad de Spider-Héroes que pondrá a prueba su propio destino.',
  'https://image.tmdb.org/t/p/w780/37WcNMg5leBhGMM6n3M0G4R1l9l.jpg',
  'https://image.tmdb.org/t/p/w1280/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
  '{"primary":"#f43f5e","secondary":"#8b5cf6","accent":"#22d3ee"}'::jsonb,
  569094,
  'tmdb',
  'published',
  2
),
(
  'La sociedad de la nieve',
  'La sociedad de la nieve',
  2023,
  144,
  ARRAY['Drama', 'Supervivencia', 'Historia'],
  ARRAY['Trabajo en equipo', 'Superación', 'Hechos reales'],
  '+16',
  'En 1972, el vuelo 571 se estrella en los Andes. Los supervivientes deberán unirse más allá de lo imaginable para resistir al frío extremo.',
  'https://image.tmdb.org/t/p/w780/k7rEpSRHermico35FF93592020.jpg',
  'https://image.tmdb.org/t/p/w1280/vdpE5pjJVql5aD6pnzRqlFmgxXf.jpg',
  '{"primary":"#60a5fa","secondary":"#0284c7","accent":"#f97316"}'::jsonb,
  906126,
  'tmdb',
  'published',
  3
)
ON CONFLICT DO NOTHING;
