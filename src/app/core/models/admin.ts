// src/app/core/models/admin.ts
export interface Admin {
  id: string;
  email: string;
  name: string;
  company?: string;
  admin_code: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminProfile extends Admin {
  statistics?: AdminStatistics;
  subscription?: AdminSubscription;
  permissions?: AdminPermissions;
  settings?: AdminSettings;
}

export interface AdminStatistics {
  total_users: number;
  active_users: number;
  total_questions: number;
  total_categories: number;
  total_game_sessions: number;
  completed_sessions: number;
  total_points_awarded: number;
  average_session_score: number;
  user_engagement_rate: number;
  most_played_category?: string;
  peak_concurrent_users: number;
  retention_rate: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  growth_metrics: {
    new_users_this_week: number;
    new_users_this_month: number;
    sessions_this_week: number;
    sessions_this_month: number;
  };
}

export interface AdminSubscription {
  id: string;
  plan: 'free' | 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  max_users: number;
  max_questions: number;
  max_categories: number;
  features: SubscriptionFeature[];
  billing_cycle: 'monthly' | 'yearly';
  current_period_start: string;
  current_period_end: string;
  auto_renew: boolean;
  price: number;
  currency: string;
}

export interface SubscriptionFeature {
  name: string;
  description: string;
  included: boolean;
  limit?: number;
}

export interface AdminPermissions {
  can_create_questions: boolean;
  can_edit_questions: boolean;
  can_delete_questions: boolean;
  can_create_categories: boolean;
  can_edit_categories: boolean;
  can_delete_categories: boolean;
  can_manage_users: boolean;
  can_view_analytics: boolean;
  can_export_data: boolean;
  can_manage_settings: boolean;
  can_invite_admins: boolean;
  max_admin_invites: number;
}

export interface AdminSettings {
  organization_name?: string;
  logo_url?: string;
  brand_colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  game_settings: {
    default_time_per_question: number;
    allow_skip_questions: boolean;
    show_correct_answers: boolean;
    randomize_questions: boolean;
    randomize_options: boolean;
    require_all_questions: boolean;
  };
  user_settings: {
    allow_user_registration: boolean;
    require_email_verification: boolean;
    auto_approve_users: boolean;
    default_user_permissions: string[];
  };
  notification_settings: {
    email_notifications: boolean;
    achievement_notifications: boolean;
    weekly_reports: boolean;
    user_milestones: boolean;
  };
  privacy_settings: {
    collect_analytics: boolean;
    share_anonymous_data: boolean;
    data_retention_days: number;
  };
}

export interface AdminDashboardData {
  overview: {
    total_users: number;
    active_users_today: number;
    total_sessions_today: number;
    average_score_today: number;
  };
  recent_activity: AdminActivity[];
  top_performers: TopPerformer[];
  category_performance: CategoryPerformance[];
  engagement_trends: EngagementTrend[];
  alerts: AdminAlert[];
}

export interface AdminActivity {
  id: string;
  type: 'user_registered' | 'game_completed' | 'achievement_earned' | 'question_added' | 'category_created';
  description: string;
  user_name?: string;
  user_id?: string;
  metadata?: any;
  timestamp: string;
}

export interface TopPerformer {
  user_id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  total_points: number;
  level: number;
  rank: number;
  recent_improvement: number;
}

export interface CategoryPerformance {
  category_id: string;
  category_name: string;
  total_attempts: number;
  average_score: number;
  completion_rate: number;
  difficulty_rating: number;
  trending: 'up' | 'down' | 'stable';
}

export interface EngagementTrend {
  date: string;
  active_users: number;
  sessions_started: number;
  sessions_completed: number;
  average_session_duration: number;
  total_points_earned: number;
}

export interface AdminAlert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  action_required: boolean;
  action_url?: string;
  created_at: string;
  dismissed: boolean;
}

// DTOs para crear/actualizar admins
export interface CreateAdminDto {
  email: string;
  name: string;
  company?: string;
  password: string;
  subscription_plan?: string;
}

export interface UpdateAdminDto {
  name?: string;
  company?: string;
  avatar_url?: string;
  settings?: Partial<AdminSettings>;
}

export interface AdminRegistrationDto extends CreateAdminDto {
  confirm_password: string;
  terms_accepted: boolean;
  newsletter_subscription?: boolean;
}

// Tipos de respuesta de API
export interface AdminResponse {
  admin: Admin;
  token?: string;
  refresh_token?: string;
  expires_at?: string;
}

export interface AdminListResponse {
  admins: Admin[];
  total: number;
  page: number;
  limit: number;
}

// Reportes y análisis
export interface AdminReport {
  id: string;
  admin_id: string;
  report_type: 'user_engagement' | 'question_performance' | 'category_analysis' | 'growth_metrics';
  title: string;
  description: string;
  data: any;
  generated_at: string;
  period: {
    start_date: string;
    end_date: string;
  };
  format: 'json' | 'csv' | 'pdf';
}

export interface QuestionAnalytics {
  question_id: string;
  question_text: string;
  category_name: string;
  total_attempts: number;
  correct_attempts: number;
  accuracy_rate: number;
  average_response_time: number;
  difficulty_rating: number;
  skip_rate: number;
  user_feedback_score?: number;
}

export interface UserEngagementMetrics {
  user_id: string;
  username: string;
  sessions_count: number;
  total_time_played: number;
  average_session_duration: number;
  completion_rate: number;
  streak_length: number;
  last_activity: string;
  engagement_score: number;
  churn_risk: 'low' | 'medium' | 'high';
}

// Configuración de juegos
export interface GameConfiguration {
  id: string;
  admin_id: string;
  name: string;
  description: string;
  category_ids: string[];
  question_count: number;
  time_limit?: number;
  difficulty_level?: 'easy' | 'medium' | 'hard' | 'mixed';
  randomize: boolean;
  allow_retries: boolean;
  show_results_immediately: boolean;
  passing_score?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Invitaciones de administrador
export interface AdminInvitation {
  id: string;
  inviter_id: string;
  email: string;
  role: 'admin' | 'super_admin';
  permissions: Partial<AdminPermissions>;
  invitation_token: string;
  expires_at: string;
  accepted_at?: string;
  rejected_at?: string;
  created_at: string;
}

// Filtros y consultas
export interface AdminQuery {
  search?: string;
  is_active?: boolean;
  subscription_plan?: string;
  created_after?: string;
  created_before?: string;
  sort_by?: 'name' | 'email' | 'created_at' | 'total_users';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Validaciones
export interface AdminValidationErrors {
  email?: string[];
  name?: string[];
  company?: string[];
  admin_code?: string[];
  password?: string[];
}

// Enums
export enum AdminRole {
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  OWNER = 'owner'
}

export enum SubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}

export enum ReportType {
  USER_ENGAGEMENT = 'user_engagement',
  QUESTION_PERFORMANCE = 'question_performance',
  CATEGORY_ANALYSIS = 'category_analysis',
  GROWTH_METRICS = 'growth_metrics',
  REVENUE_ANALYTICS = 'revenue_analytics'
}

// Utilidades
export interface AdminCodeGenerator {
  generate(): string;
  validate(code: string): boolean;
  isUnique(code: string): Promise<boolean>;
}

export interface AdminNotification {
  id: string;
  admin_id: string;
  type: 'system' | 'user_milestone' | 'subscription' | 'security';
  title: string;
  message: string;
  is_read: boolean;
  action_url?: string;
  created_at: string;
  read_at?: string;
}