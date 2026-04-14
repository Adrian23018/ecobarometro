import { Category } from "./category";

export interface Question {
  id: string;
  admin_id: string;
  category_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'scale';
  points: number;
  difficulty_level: 1 | 2 | 3;
  order_index: number;
  is_active: boolean;
  explanation?: string;
  time_limit?: number;
  weighted_scoring?: boolean;   // ← modo puntaje por opción
  scale_min?: number;
  scale_max?: number;
  scale_min_label?: string;
  scale_max_label?: string;
  scale_correct_value?: number;
  correct_answer?: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  options?: QuestionOption[];
  total_responses?: number;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  points: number;
  order_index: number;
  explanation?: string; // Explicación de la opción
  created_at: string;
}

export interface CreateQuestionRequest {
  admin_id: string;
  category_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'scale';
  points: number;
  difficulty_level: 1 | 2 | 3;
  options?: CreateQuestionOptionRequest[];
  explanation?: string;
  time_limit?: number;
  weighted_scoring?: boolean;
  scale_min?: number;
  scale_max?: number;
  scale_min_label?: string;
  scale_max_label?: string;
  scale_correct_value?: number;
  scale_config?: any;
  correct_answer?: boolean;
}

export interface CreateQuestionOptionRequest {
  option_text: string;
  is_correct: boolean;
  points: number;
  order_index?: number;
  explanation?: string;
}

export interface UpdateQuestionRequest {
  category_id?: string;
  question_text?: string;
  question_type?: 'multiple_choice' | 'true_false' | 'scale';
  points?: number;
  difficulty_level?: 1 | 2 | 3;
  is_active?: boolean;
  explanation?: string;
  time_limit?: number;
  weighted_scoring?: boolean;
  scale_min?: number;
  scale_max?: number;
  scale_min_label?: string;
  scale_max_label?: string;
  scale_correct_value?: number;
  correct_answer?: boolean;
  options?: UpdateQuestionOptionRequest[];
}

export interface UpdateQuestionOptionRequest {
  id?: string;
  option_text: string;
  is_correct: boolean;
  points: number;
  order_index?: number;
}

export interface QuestionWithStats {
  question: Question;
  total_responses: number;
  correct_responses: number;
  avg_time: number;
  difficulty_rating: number;
}

export interface GameQuestion {
  question: Question;
  options: QuestionOption[];
  time_limit?: number; // en segundos
  bonus_points?: number;
}