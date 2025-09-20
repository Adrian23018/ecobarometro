import { User } from "@supabase/supabase-js";
import { Category } from "./category";

export interface Ranking {
  id: string;
  admin_id: string;
  user_id: string;
  category_id?: string;
  points: number;
  rank_position: number;
  percentage_score: number;
  last_updated: string;
  created_at: string;
  user?: User; // Para populate
  category?: Category; // Para populate
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  total_points: number;
  rank_position: number;
  games_played: number;
  avg_score: number;
  level: number;
  achievements_count: number;
  is_current_user?: boolean;
}

export interface CategoryRanking {
  category: Category;
  rankings: LeaderboardEntry[];
  user_position?: number;
  total_participants: number;
}

export interface GlobalRanking {
  overall_rankings: LeaderboardEntry[];
  category_rankings: CategoryRanking[];
  user_stats: UserRankingStats;
}

export interface UserRankingStats {
  overall_position: number;
  total_participants: number;
  points_to_next_rank: number;
  category_positions: CategoryPosition[];
  recent_improvement: number; // porcentaje de mejora
}

export interface CategoryPosition {
  category: Category;
  position: number;
  total_participants: number;
  points: number;
  percentage_score: number;
}

export interface RankingFilters {
  category_id?: string;
  time_period?: 'week' | 'month' | 'quarter' | 'year' | 'all';
  admin_id?: string;
  limit?: number;
  offset?: number;
}

export interface RankingUpdate {
  user_id: string;
  category_id?: string;
  points_change: number;
  new_position: number;
  previous_position: number;
}