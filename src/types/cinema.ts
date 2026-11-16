export type MovieStatus = 'draft' | 'published' | 'archived';

export type ScoringMode = 'classic' | 'fractional';

export type ThemeMode = 'featured' | 'blend';

export type AppLanguage = 'es' | 'va' | 'en';

export interface MovieLocalizedFields {
  title?: string;
  synopsis?: string;
  genres?: string[];
  tags?: string[];
}

export interface MovieTrailers {
  es?: string;
  va?: string;
  en?: string;
}

export interface MoviePalette {
  primary: string;
  secondary: string;
  accent: string;
  i18n?: Partial<Record<AppLanguage, MovieLocalizedFields>>;
  trailers?: MovieTrailers;
}

export interface Movie {
  id: string;
  title: string;
  original_title: string | null;
  year: number | null;
  duration_minutes: number | null;
  genres: string[];
  tags: string[];
  age_rating: string;
  synopsis: string;
  poster_url: string;
  backdrop_url: string;
  palette: MoviePalette;
  translations?: Partial<Record<AppLanguage, MovieLocalizedFields>>;
  trailers?: MovieTrailers;
  tmdb_id?: number | null;
  source_provider?: 'tmdb' | 'omdb' | 'gemini' | 'manual';
  status: MovieStatus;
  display_order: number;
  created_at?: string;
}

export interface VotingSettings {
  id: number;
  campaign_title: string;
  subtitle: string;
  top_k: 3 | 5;
  scoring_mode: ScoringMode;
  theme_mode: ThemeMode;
  featured_movie_id: string | null;
  allowed_classes: string[];
  allowed_email_domains: string[];
  voting_open: boolean;
}

export interface VoterIdentityForm {
  nombre: string;
  apellidos: string;
  curso: string;
  email: string;
}

export interface OtpChallenge {
  challenge_id: string;
  expires_in_seconds: number;
  cooldown_seconds: number;
  email: string;
  provider?: string;
  dev_otp_preview?: string;
}

export interface VoteReceipt {
  vote_id: string;
  curso: string;
  created_at: string;
  rankedMovies: Movie[];
}

export interface LeaderboardEntry {
  movie_id: string;
  title: string;
  poster_url: string;
  palette: MoviePalette;
  year: number | null;
  status: string;
  total_points: number;
  first_choice_votes: number;
  first_choice_pct: number;
  top_k_appearances: number;
  top_k_pct: number;
  borda_share_pct: number;
  rank_breakdown: Record<number, number>;
}

export interface ClassParticipation {
  curso: string;
  count: number;
  percentage: number;
}

export interface VoteLogChoice {
  rank_position: number;
  movie_id: string;
  title: string;
}

export interface VoteLogEntry {
  id: string;
  nombre: string;
  apellidos: string;
  curso: string;
  email: string;
  created_at: string;
  choices: VoteLogChoice[];
}

export interface DashboardResults {
  settings: VotingSettings;
  total_votes: number;
  grand_total_points: number;
  participation_by_class: ClassParticipation[];
  leaderboard: LeaderboardEntry[];
  votes_log: VoteLogEntry[];
  pedagogical_comparison: {
    fptp_winner: LeaderboardEntry | null;
    borda_winner: LeaderboardEntry | null;
    consensus_winner: LeaderboardEntry | null;
    diverged: boolean;
    insight_title: string;
    insight_text: string;
  };
}
