// core/models/achievement.ts

export interface Achievement {
  id: string;
  admin_id?: string;
  name: string;
  description: string;
  icon: string;
  badge_color: string;
  achievement_type: 'points' | 'games' | 'streak' | 'category';
  points_required: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement: Achievement;
}

export interface AchievementProgress {
  achievement: Achievement;
  current_progress: number;
  completion_percentage: number;
  is_completed: boolean;
}

export interface CreateAchievementRequest {
  name: string;
  description: string;
  icon?: string;
  badge_color?: string;
  achievement_type: 'points' | 'games' | 'streak' | 'category';
  points_required: number;
}

export interface AchievementStats {
  total_achievements: number;
  completed_achievements: number;
  completion_percentage: number;
  points_earned: number;
  points_remaining: number;
}