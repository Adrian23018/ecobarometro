import { Category } from "./category";
import { Question } from "./question";
import { Achievement, User, UserResponse } from "./user";

export interface GameSession {
  id: string;
  user_id: string;
  admin_id: string;
  session_name: string;
  total_questions: number;
  correct_answers: number;
  total_points: number;
  time_spent: number; // en segundos
  completion_percentage: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  started_at: string;
  completed_at?: string;
  created_at: string;
  user?: User; // Para populate
}

export interface CreateGameSessionRequest {
  session_name?: string;
  categories?: string[]; // IDs de categorías para filtrar preguntas
}

export interface GameSessionStats {
  total_sessions: number;
  completed_sessions: number;
  avg_score: number;
  avg_time: number;
  best_score: number;
  total_points_earned: number;
}

export interface ActiveGameSession {
  session: GameSession;
  current_question_index: number;
  questions: Question[];
  responses: UserResponse[];
  start_time: Date;
}

export interface GameSessionSummary {
  session: GameSession;
  category_scores: CategoryScore[];
  achievements_earned: Achievement[];
  ranking_position: number;
  improvement_percentage: number;
}

export interface CategoryScore {
  category: Category;
  correct_answers: number;
  total_questions: number;
  points_earned: number;
  percentage: number;
}