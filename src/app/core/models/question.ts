import { Category } from "./category";

export interface Question {
  id: string;
  admin_id: string;
  category_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'scale';
  points: number;
  difficulty_level: 1 | 2 | 3; // 1=fácil, 2=medio, 3=difícil
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: Category; // Para populate
  options?: QuestionOption[]; // Para populate
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  points: number;
  order_index: number;
  created_at: string;
}

export interface CreateQuestionRequest {
  category_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'scale';
  points: number;
  difficulty_level: 1 | 2 | 3;
  options: CreateQuestionOptionRequest[];
}

export interface CreateQuestionOptionRequest {
  option_text: string;
  is_correct: boolean;
  points: number;
  order_index?: number;
}

export interface UpdateQuestionRequest {
  category_id?: string;
  question_text?: string;
  question_type?: 'multiple_choice' | 'true_false' | 'scale';
  points?: number;
  difficulty_level?: 1 | 2 | 3;
  is_active?: boolean;
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