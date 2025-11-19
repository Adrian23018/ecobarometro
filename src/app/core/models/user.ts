// src/app/core/models/user.ts
export interface User {
  id?: any;
  email: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  total_points: number;
  level: number;
  experience_points: number;
  games_played: number;
  admin_code: string;
  admin_id: string;
  is_active: boolean;
  last_game_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  preferences?: UserPreferences;
  statistics?: UserStatistics;
  achievements?: UserAchievement[];
  rank?: UserRank;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'es' | 'en';
  sound_enabled: boolean;
  animations_enabled: boolean;
  notifications_enabled: boolean;
  difficulty_preference: 'easy' | 'medium' | 'hard' | 'adaptive';
  auto_advance: boolean;
  show_hints: boolean;
}

export interface UserStatistics {
  total_questions_answered: number;
  correct_answers: number;
  accuracy_percentage: number;
  average_response_time: number;
  best_score: number;
  worst_score: number;
  current_streak: number;
  longest_streak: number;
  favorite_category?: string;
  time_played: number; // en segundos
  sessions_completed: number;
  sessions_abandoned: number;
  perfect_games: number;
}

export interface UserAchievement {
  id: string;
  achievement_id: string;
  user_id: string;
  earned_at: string;
  achievement?: Achievement;
}

export interface Achievement {
  id: string;
  admin_id: string;
  name: string;
  description: string;
  icon: string;
  points_required: number;
  badge_color: string;
  achievement_type: 'points' | 'games' | 'streak' | 'category' | 'accuracy' | 'speed';
  is_active: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  created_at: string;
}

export interface UserRank {
  global_rank: number;
  global_percentile: number;
  category_ranks: CategoryRank[];
  trend: 'up' | 'down' | 'stable';
  position_change: number;
}

export interface CategoryRank {
  category_id: string;
  category_name: string;
  rank: number;
  percentile: number;
  points: number;
}

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type: 'game_completed' | 'achievement_earned' | 'level_up' | 'streak_milestone';
  description: string;
  points_earned?: number;
  metadata?: any;
  created_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  device_info?: string;
  ip_address?: string;
  user_agent?: string;
  login_at: string;
  logout_at?: string;
  is_active: boolean;
}

// DTOs para crear/actualizar usuarios
export interface CreateUserDto {
  email: string;
  username: string;
  full_name: string;
  admin_code: string;
  preferences?: Partial<UserPreferences>;
}

export interface UpdateUserDto {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  preferences?: Partial<UserPreferences>;
}

export interface UserRegistrationDto extends CreateUserDto {
  password: string;
  confirm_password: string;
  terms_accepted: boolean;
}

// Enums y tipos auxiliares
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}

export enum NotificationType {
  ACHIEVEMENT = 'achievement',
  LEVEL_UP = 'level_up',
  CHALLENGE = 'challenge',
  REMINDER = 'reminder',
  NEWS = 'news'
}

export interface UserNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  action_url?: string;
  metadata?: any;
  created_at: string;
  read_at?: string;
}

// Tipos de respuesta de API
export interface UserResponse {
  id: string;
  user_id: string;
  question_id: string;
  selected_option_id?: string;
  is_correct: boolean;
  points_earned: number;
  time_taken: number;
  session_id: string;
  created_at: string;
  custom_answer?: string;
  question?: {
    id: string;
    question_text: string;
    category_id: string;
    category?: {
      name: string;
      color: string;
      icon: string;
    };
  };
}

export interface AuthUserResponse {
  user: User;
  token?: string;
  refresh_token?: string;
  expires_at?: string;
}

export interface UsersListResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Filtros y consultas
export interface UserQuery {
  search?: string;
  admin_id?: string;
  level_min?: number;
  level_max?: number;
  points_min?: number;
  points_max?: number;
  is_active?: boolean;
  created_after?: string;
  created_before?: string;
  sort_by?: 'points' | 'level' | 'games_played' | 'created_at' | 'last_game_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Utilidades de validación
export interface UserValidationErrors {
  email?: string[];
  username?: string[];
  full_name?: string[];
  admin_code?: string[];
  password?: string[];
}

// Estadísticas comparativas
export interface UserComparison {
  user: User;
  compared_to: User;
  metrics: {
    points_difference: number;
    level_difference: number;
    accuracy_difference: number;
    games_difference: number;
    stronger_categories: string[];
    weaker_categories: string[];
  };
}

// Progreso de usuario
export interface UserProgress {
  current_level: number;
  next_level: number;
  experience_current: number;
  experience_needed: number;
  experience_total: number;
  progress_percentage: number;
  estimated_time_to_next_level?: number; // en horas
}