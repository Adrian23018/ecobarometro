export interface Category {
  id: string;
  admin_id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  questions_count?: number; // Para mostrar cuántas preguntas tiene
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
  icon: string;
  color: string;
  order_index?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  order_index?: number;
  is_active?: boolean;
}

export interface CategoryWithStats {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  questions_count: number;
  avg_score: number;
  user_best_score: number;
  completion_rate: number;
}