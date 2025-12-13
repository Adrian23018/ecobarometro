// src/app/core/models/educational-video.ts

import { Achievement } from './achievement';

/**
 * Modelo principal de video educativo
 */
export interface EducationalVideo {
  id: string;
  admin_id: string;
  title: string;
  description: string;
  youtube_url: string; // URL completa de YouTube
  youtube_video_id: string; // ID extraído (ej: "dQw4w9WgXcQ")
  thumbnail_url?: string; // Auto-generado desde YouTube
  duration_seconds?: number; // Duración del video
  completion_threshold: number; // Porcentaje requerido (default: 50)
  is_active: boolean;
  view_count: number; // Contador de vistas
  success_count: number; // Contador de completaciones exitosas
  created_at: string;
  updated_at: string;
  steps?: VideoStep[]; // Pasos para el mini-juego
}

/**
 * Paso individual del mini-juego
 */
export interface VideoStep {
  id: string;
  video_id: string;
  order_index: number; // Orden correcto (1, 2, 3, ...)
  step_text: string; // Descripción del paso
  hint?: string; // Pista opcional
  created_at: string;
}

/**
 * Request para crear un nuevo video
 */
export interface CreateVideoRequest {
  admin_id: string;
  title: string;
  description: string;
  youtube_url?: string;
  youtube_video_id?: string;
  completion_threshold?: number;
  steps: CreateVideoStepRequest[];
}

/**
 * Request para crear un paso del video
 */
export interface CreateVideoStepRequest {
  order_index: number;
  step_text: string;
  hint?: string;
}

/**
 * Request para actualizar un video
 */
export interface UpdateVideoRequest {
  title?: string;
  description?: string;
  youtube_url?: string;
  youtube_video_id?: string;
  completion_threshold?: number;
  is_active?: boolean;
  steps?: UpdateVideoStepRequest[];
}

/**
 * Request para actualizar un paso
 */
export interface UpdateVideoStepRequest {
  id?: string; // Si existe, se actualiza; si no, se crea
  order_index: number;
  step_text: string;
  hint?: string;
}

/**
 * Sesión de uso del sistema de ayuda con video
 */
export interface VideoHelpSession {
  id: string;
  user_id: string;
  game_session_id: string;
  video_id: string;
  started_at: string;
  completed_at?: string;
  watch_percentage: number; // % del video visto (0-100)
  mini_game_completed: boolean;
  mini_game_attempts: number;
  time_bonus_earned: number; // 30 segundos
  points_bonus_earned: number; // 10 puntos
  created_at: string;
}

/**
 * Request para crear una sesión de ayuda
 */
export interface CreateVideoHelpSessionRequest {
  user_id: string;
  game_session_id: string;
  video_id: string;
  watch_percentage: number;
}

/**
 * Resultado de completar el sistema de ayuda
 */
export interface VideoHelpResult {
  success: boolean;
  time_bonus: number; // 30
  points_bonus: number; // 10
  achievement_unlocked?: Achievement; // "Aprendiz Visual" si es la primera vez
  session: VideoHelpSession;
}

/**
 * Estadísticas de un video
 */
export interface VideoStats {
  video_id: string;
  total_views: number;
  total_completions: number;
  completion_rate: number; // Porcentaje
  avg_attempts: number; // Promedio de intentos en el mini-juego
  unique_users: number; // Usuarios únicos que lo vieron
}

/**
 * Video con estadísticas
 */
export interface VideoWithStats extends EducationalVideo {
  stats: VideoStats;
}
