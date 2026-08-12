// Fraud IQ: API client for the backend service.
// The API is a separate service mounted at /api, not under this app's base
// path, so requests intentionally use the root-relative /api prefix. The dev
// server proxies /api through to the API port.

import { dailyDateKey, type GameMode, type GameSummary, type PlayerProfile } from './game';

const API_BASE = '/api/fraud-iq';

export interface PlayerStats {
  bestScore: number;
  totalXp: number;
  runs: number;
  level: number;
  levelTitle: string;
  rank?: number | null;
}

export interface CreatePlayerResponse extends PlayerStats {
  id: number;
  name: string;
  token: string;
  avatar: string | null;
}

export interface SubmitScoreResponse extends PlayerStats {
  rank: number;
  isNewBest: boolean;
  leveledUp: boolean;
}

export interface MeResponse extends PlayerStats {
  id: number;
  name: string;
  avatar: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: number;
  name: string;
  avatar: string | null;
  bestScore: number;
  totalXp: number;
  level: number;
  levelTitle: string;
  runs: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  stats: {
    totalPlayers: number;
    totalRuns: number;
    totalMoneySaved: number;
  };
}

/** Error carrying the HTTP status so callers can react (e.g. 401 = stale profile). */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (data as { error?: string } | null)?.error ??
      `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return data as T;
}

/** The whole "login": a display name plus an optional avatar pick. No email, no password, no personal data. */
export function createPlayer(name: string, avatar?: string): Promise<CreatePlayerResponse> {
  return request<CreatePlayerResponse>('/players', {
    method: 'POST',
    body: JSON.stringify({ name, avatar }),
  });
}

/** Change the display name; leaderboard history follows automatically. */
export function renamePlayer(
  profile: PlayerProfile,
  name: string,
): Promise<{ id: number; name: string }> {
  return request<{ id: number; name: string }>('/players/name', {
    method: 'PATCH',
    body: JSON.stringify({ playerId: profile.id, token: profile.token, name }),
  });
}

/** Change the profile picture; the leaderboard follows automatically. */
export function setAvatar(
  profile: PlayerProfile,
  avatar: string,
): Promise<{ id: number; avatar: string | null }> {
  return request<{ id: number; avatar: string | null }>('/players/avatar', {
    method: 'PATCH',
    body: JSON.stringify({ playerId: profile.id, token: profile.token, avatar }),
  });
}

/** Restore stats for a returning player (e.g. on app load). */
export function fetchMe(profile: PlayerProfile): Promise<MeResponse> {
  const params = new URLSearchParams({
    playerId: String(profile.id),
    token: profile.token,
  });
  return request<MeResponse>(`/me?${params}`);
}

/** Submit a finished run and get back rank/level/new-best info. */
export function submitScore(
  profile: PlayerProfile,
  summary: GameSummary,
  mode: GameMode = 'classic',
  runDate?: string,
): Promise<SubmitScoreResponse> {
  return request<SubmitScoreResponse>('/scores', {
    method: 'POST',
    body: JSON.stringify({
      playerId: profile.id,
      token: profile.token,
      runId: summary.runId,
      mode,
      // Daily runs are pinned to the ET date the RUN STARTED on (passed in by
      // the caller), so a run finishing after midnight is rejected by the
      // server instead of counting as the new day's gauntlet.
      runDate: mode === 'daily' ? (runDate ?? dailyDateKey()) : undefined,
      score: summary.score,
      accuracy: Math.round(summary.accuracy * 100),
      bestStreak: summary.bestStreak,
      moneySaved: summary.moneySaved,
      moneyLost: summary.moneyLost,
      radarLevel: summary.radar.name,
      gameOver: summary.gameOver,
    }),
  });
}

export function fetchLeaderboard(
  limit = 50,
  scope: 'alltime' | 'today' = 'alltime',
): Promise<LeaderboardResponse> {
  return request<LeaderboardResponse>(`/leaderboard?limit=${limit}&scope=${scope}`);
}
