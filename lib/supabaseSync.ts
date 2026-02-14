import { supabase } from './supabase';
import { UserStats, GameSettings, LeaderboardEntry } from './types';

// ── Stats ──────────────────────────────────────────────

export async function loadStatsFromDB(userId: string): Promise<UserStats | null> {
  const { data, error } = await supabase
    .from('user_stats')
    .select('stats')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data.stats as UserStats;
}

export async function saveStatsToDB(userId: string, stats: UserStats): Promise<void> {
  await supabase
    .from('user_stats')
    .upsert({ user_id: userId, stats, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
}

// ── Settings ───────────────────────────────────────────

export async function loadSettingsFromDB(userId: string): Promise<GameSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('settings')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data.settings as GameSettings;
}

export async function saveSettingsToDB(userId: string, settings: GameSettings): Promise<void> {
  await supabase
    .from('user_settings')
    .upsert({ user_id: userId, settings, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
}

// ── Leaderboard ────────────────────────────────────────

export async function saveLeaderboardEntryToDB(
  userId: string,
  entry: LeaderboardEntry
): Promise<void> {
  await supabase.from('leaderboard').insert({
    user_id: userId,
    name: entry.name,
    score: entry.score,
    mode: entry.mode,
    date: entry.date,
  });
}

export async function loadGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('name, score, mode, date')
    .order('score', { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return data as LeaderboardEntry[];
}
