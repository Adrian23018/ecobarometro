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
  explanation?: string; // Explicación de la respuesta
  time_limit?: number; // Tiempo límite en segundos
  scale_min?: number; // Para preguntas tipo scale
  scale_max?: number; // Para preguntas tipo scale
  scale_min_label?: string; // Etiqueta del valor mínimo
  scale_max_label?: string; // Etiqueta del valor máximo
  scale_correct_value?: number; // Valor correcto para scale
  correct_answer?: boolean; // Para true/false
  created_at: string;
  updated_at: string;
  category?: Category; // Para populate
  options?: QuestionOption[]; // Para populate
  total_responses?: number; // Para estadísticas
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