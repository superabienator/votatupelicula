import type {
  DashboardResults,
  Movie,
  OtpChallenge,
  PublicStandings,
  VoteReceipt,
  VotingSettings,
} from '../types/cinema';
import { sandboxBackend } from './sandboxBackend';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim().replace(/\/+$/, '');
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const IS_SANDBOX_MODE = !SUPABASE_URL || !SUPABASE_ANON_KEY;

async function callEdgeFunction<T>(
  functionName: string,
  options: {
    method?: 'GET' | 'POST';
    body?: unknown;
    adminSecret?: string;
  } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };

  if (options.adminSecret) {
    headers['x-admin-secret'] = options.adminSecret;
  }

  const res = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: options.method || 'POST',
    headers,
    body: options.method === 'GET' ? undefined : JSON.stringify(options.body ?? {}),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const err = new Error(data?.error || `Error de servidor (${res.status})`) as Error & {
      code?: string;
    };
    if (typeof data?.error_code === 'string') {
      err.code = data.error_code;
    }
    throw err;
  }
  return data as T;
}

export const cinemaApi = {
  async getBallotData(): Promise<{
    settings: VotingSettings;
    movies: Movie[];
    public_standings: PublicStandings;
  }> {
    if (IS_SANDBOX_MODE) return sandboxBackend.getBallotData();
    const res = await callEdgeFunction<{
      ok: true;
      settings: VotingSettings;
      movies: Movie[];
      public_standings: PublicStandings;
    }>('get-ballot-data', { method: 'GET' });
    return {
      settings: res.settings,
      movies: res.movies,
      public_standings: res.public_standings,
    };
  },

  async requestOtp(payload: {
    nombre: string;
    apellidos: string;
    curso: string;
    email: string;
    movie_ids: string[];
  }): Promise<OtpChallenge> {
    if (IS_SANDBOX_MODE) return sandboxBackend.requestOtp(payload);
    return callEdgeFunction<OtpChallenge>('request-otp', {
      method: 'POST',
      body: payload,
    });
  },

  async verifyOtp(payload: {
    challenge_id: string;
    code: string;
  }): Promise<Omit<VoteReceipt, 'rankedMovies'>> {
    if (IS_SANDBOX_MODE) return sandboxBackend.verifyOtp(payload);
    return callEdgeFunction<Omit<VoteReceipt, 'rankedMovies'>>('verify-otp', {
      method: 'POST',
      body: payload,
    });
  },

  async checkAdminSecret(adminSecret: string): Promise<boolean> {
    if (IS_SANDBOX_MODE) return sandboxBackend.checkAdminSecret(adminSecret);
    await callEdgeFunction<{ ok: true }>('admin-auth-check', {
      method: 'POST',
      adminSecret,
    });
    return true;
  },

  async adminListMovies(adminSecret: string): Promise<{
    movies: Movie[];
    settings: VotingSettings;
    total_votes: number;
  }> {
    if (IS_SANDBOX_MODE) return sandboxBackend.adminListMovies(adminSecret);
    return callEdgeFunction('admin-movies', {
      method: 'POST',
      adminSecret,
      body: { action: 'list' },
    });
  },

  async adminEnrichBatch(adminSecret: string, titles: string[]): Promise<Movie[]> {
    if (IS_SANDBOX_MODE) return sandboxBackend.adminEnrichBatch(adminSecret, titles);
    const res = await callEdgeFunction<{ ok: true; movies: Movie[] }>('admin-movies', {
      method: 'POST',
      adminSecret,
      body: { action: 'enrich_batch', titles },
    });
    return res.movies;
  },

  async adminCreateManual(
    adminSecret: string,
    movie: Partial<Movie>
  ): Promise<Movie> {
    if (IS_SANDBOX_MODE) {
      const [created] = await sandboxBackend.adminEnrichBatch(adminSecret, [
        movie.title || 'Nueva película',
      ]);
      return sandboxBackend.adminUpdateMovie(adminSecret, created.id, movie);
    }
    const res = await callEdgeFunction<{ ok: true; movie: Movie }>('admin-movies', {
      method: 'POST',
      adminSecret,
      body: { action: 'create_manual', movie },
    });
    return res.movie;
  },

  async adminUpdateMovie(
    adminSecret: string,
    id: string,
    patch: Partial<Movie>
  ): Promise<Movie> {
    if (IS_SANDBOX_MODE) return sandboxBackend.adminUpdateMovie(adminSecret, id, patch);
    const res = await callEdgeFunction<{ ok: true; movie: Movie }>('admin-movies', {
      method: 'POST',
      adminSecret,
      body: { action: 'update', id, patch },
    });
    return res.movie;
  },

  async adminPublishBillboard(
    adminSecret: string,
    movieIds?: string[]
  ): Promise<Movie[]> {
    if (IS_SANDBOX_MODE) return sandboxBackend.adminPublishBillboard(adminSecret, movieIds);
    const res = await callEdgeFunction<{ ok: true; movies: Movie[] }>('admin-movies', {
      method: 'POST',
      adminSecret,
      body: { action: 'publish_billboard', movie_ids: movieIds },
    });
    return res.movies;
  },

  async adminDeleteMovie(
    adminSecret: string,
    id: string
  ): Promise<{ archived?: boolean; message?: string }> {
    if (IS_SANDBOX_MODE) return sandboxBackend.adminDeleteMovie(adminSecret, id);
    return callEdgeFunction('admin-movies', {
      method: 'POST',
      adminSecret,
      body: { action: 'delete', id },
    });
  },

  async adminUpdateSettings(
    adminSecret: string,
    patch: Partial<VotingSettings>
  ): Promise<VotingSettings> {
    if (IS_SANDBOX_MODE) return sandboxBackend.adminUpdateSettings(adminSecret, patch);
    const res = await callEdgeFunction<{ ok: true; settings: VotingSettings }>(
      'admin-movies',
      {
        method: 'POST',
        adminSecret,
        body: { action: 'update_settings', settings: patch },
      }
    );
    return res.settings;
  },

  async adminResetVotes(adminSecret: string): Promise<void> {
    if (IS_SANDBOX_MODE) return sandboxBackend.adminResetVotes(adminSecret);
    await callEdgeFunction('admin-movies', {
      method: 'POST',
      adminSecret,
      body: { action: 'reset_votes' },
    });
  },

  async adminDeleteVote(adminSecret: string, voteId: string): Promise<void> {
    if (IS_SANDBOX_MODE) return sandboxBackend.adminDeleteVote(adminSecret, voteId);
    await callEdgeFunction('admin-movies', {
      method: 'POST',
      adminSecret,
      body: { action: 'delete_vote', vote_id: voteId },
    });
  },

  async adminUpdateVote(
    adminSecret: string,
    voteId: string,
    patch: { curso?: string; ranked_movie_ids?: string[] }
  ): Promise<void> {
    if (IS_SANDBOX_MODE) return sandboxBackend.adminUpdateVote(adminSecret, voteId, patch);
    await callEdgeFunction('admin-movies', {
      method: 'POST',
      adminSecret,
      body: { action: 'update_vote', vote_id: voteId, ...patch },
    });
  },

  async adminGetResults(adminSecret: string): Promise<DashboardResults> {
    if (IS_SANDBOX_MODE) return sandboxBackend.adminGetResults(adminSecret);
    return callEdgeFunction<DashboardResults>('admin-results', {
      method: 'POST',
      adminSecret,
    });
  },
};
