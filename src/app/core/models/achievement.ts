export interface Achievement {
  id: string;
  admin_id: string;
  name: string;
  description: string;
  icon: string;
  points_required: number;
  badge_color: string;
  achievement_type: 'points' | 'games' | 'streak' | 'category';
  is_active: boolean;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement; // Para populate
}

export interface CreateAchievementRequest {
  name: string;
  description: string;
  icon: string;
  points_required: number;
  badge_color: string;
  achievement_type: 'points' | 'games' | 'streak' | 'category';
}

export interface AchievementProgress {
  achievement: Achievement;
  current_progress: number;
  is_completed: boolean;
  completion_percentage: number;
}