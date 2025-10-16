import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Observable, from, map } from 'rxjs';
import {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryWithStats
} from '../models/category';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // CRUD Operations
  createCategory(adminId: string, categoryData: CreateCategoryRequest): Observable<Category> {
    return from(
      this.supabase
        .from('categories')
        .insert([{
          ...categoryData,
          admin_id: adminId,
          order_index: categoryData.order_index || 0
        }])
        .select()
        .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data;
      })
    );
  }

  getCategoriesByAdmin(adminId: string): Observable<Category[]> {
    return from(this.getCategoriesWithCount(adminId));
  }

  private async getCategoriesWithCount(adminId: string): Promise<Category[]> {
    console.log("adminsss",adminId);
    
    // Primero obtenemos las categorías
    const { data: categories, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('admin_id', adminId)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) throw error;
    console.log("categories:",categories);
    
    if (!categories) return [];

    // Luego contamos las preguntas para cada categoría
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const { count } = await this.supabase
          .from('questions')
          .select('*', { count: 'exact', head: true })
          .eq('category_id', category.id)
          .eq('is_active', true);

        return {
          ...category,
          questions_count: count || 0
        };
      })
    );

    return categoriesWithCount;
  }

  getCategoryById(id: string): Observable<Category> {
    return from(
      this.supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data;
      })
    );
  }

  updateCategory(id: string, updates: UpdateCategoryRequest): Observable<Category> {
    return from(
      this.supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data;
      })
    );
  }

  deleteCategory(id: string): Observable<void> {
    return from(
      this.supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', id)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return;
      })
    );
  }

  // Reorder categories
  updateCategoryOrder(categories: { id: string, order_index: number }[]): Observable<void> {
    return from(this.updateOrder(categories));
  }

  private async updateOrder(categories: { id: string, order_index: number }[]): Promise<void> {
    for (const category of categories) {
      await this.supabase
        .from('categories')
        .update({ order_index: category.order_index })
        .eq('id', category.id);
    }
  }

  // Analytics and Stats
  getCategoriesWithStats(adminId: string, userId?: string): Observable<CategoryWithStats[]> {
    return from(this.getCategoryStats(adminId, userId));
  }

  private async getCategoryStats(adminId: string, userId?: string): Promise<CategoryWithStats[]> {
    // Obtener categorías básicas
    const { data: categories } = await this.supabase
      .from('categories')
      .select('*')
      .eq('admin_id', adminId)
      .eq('is_active', true)
      .order('order_index');

    if (!categories) return [];

    const categoriesWithStats: CategoryWithStats[] = [];

    for (const category of categories) {
      // Contar preguntas
      const { count: questionsCount } = await this.supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', category.id)
        .eq('is_active', true);

      let avgScore = 0;
      let userBestScore = 0;
      let completionRate = 0;

      if (questionsCount && questionsCount > 0) {
        // Calcular promedio general de la categoría
        const { data: responses } = await this.supabase
          .from('user_responses')
          .select(`
            points_earned,
            is_correct,
            question:questions!inner(category_id)
          `)
          .eq('question.category_id', category.id);

        if (responses && responses.length > 0) {
          const totalPoints = responses.reduce((sum, r) => sum + r.points_earned, 0);
          const correctAnswers = responses.filter(r => r.is_correct).length;
          avgScore = (correctAnswers / responses.length) * 100;
        }

        // Si hay userId, obtener estadísticas específicas del usuario
        if (userId) {
          const { data: userResponses } = await this.supabase
            .from('user_responses')
            .select(`
              points_earned,
              is_correct,
              question:questions!inner(category_id),
              game_session:game_sessions(*)
            `)
            .eq('user_id', userId)
            .eq('question.category_id', category.id);

          if (userResponses && userResponses.length > 0) {
            // Mejor puntaje del usuario en esta categoría
            const sessionScores = userResponses.reduce((acc, r: any) => {
              const sessionId = r.game_session?.id;
              if (sessionId) {
                acc[sessionId] = (acc[sessionId] || 0) + r.points_earned;
              }
              return acc;
            }, {} as Record<string, number>);

            userBestScore = Math.max(...Object.values(sessionScores));

            // Tasa de finalización
            const uniqueSessions = new Set(userResponses.map((r: any) => r.game_session?.id));
            const completedSessions = userResponses.filter((r: any) =>
              r.game_session?.status === 'completed'
            );
            completionRate = (completedSessions.length / uniqueSessions.size) * 100;
          }
        }
      }

      categoriesWithStats.push({
        id: category.id,
        name: category.name,
        description: category.description,
        icon: category.icon,
        color: category.color,
        questions_count: questionsCount || 0,
        avg_score: Math.round(avgScore),
        user_best_score: userBestScore,
        completion_rate: Math.round(completionRate)
      });
    }

    return categoriesWithStats;
  }

  // Get categories for user (for game selection)
  // getAvailableCategories(adminCode: string): Observable<Category[]> {
  //   return from(
  //     this.supabase
  //       .from('categories')
  //       .select(`
  //         *,
  //         admin:admins!inner(admin_code)
  //       `)
  //       .eq('admin.admin_code', adminCode)
  //       .eq('is_active', true)
  //       .order('order_index')
  //   ).pipe(
  //     map(response => {
  //       if (response.error) throw response.error;
  //       return response.data || [];
  //     })
  //   );
  // }

  getAvailableCategories(adminID: string): Observable<Category[]> {
    return from(
      this.supabase
        .from('categories')
        .select(`
          *
        `)
        .eq('admin_id', adminID)
        .eq('is_active', true)
        .order('order_index')
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data || [];
      })
    );
  }

  // Validate category belongs to admin
  validateCategoryOwnership(categoryId: string, adminId: string): Observable<boolean> {
    return from(
      this.supabase
        .from('categories')
        .select('id')
        .eq('id', categoryId)
        .eq('admin_id', adminId)
        .single()
    ).pipe(
      map(response => {
        return !response.error && !!response.data;
      })
    );
  }
}