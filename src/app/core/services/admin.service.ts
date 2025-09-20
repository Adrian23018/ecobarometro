// src/app/core/services/admin.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, BehaviorSubject, combineLatest } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalQuestions: number;
  totalCategories: number;
  totalGamesPlayed: number;
  averageScore: number;
  completionRate: number;
  topPerformers: any[];
  categoryPerformance: any[];
  recentActivity: any[];
}

export interface QuestionData {
  id?: string;
  admin_id: string;
  category_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'scale';
  points: number;
  difficulty_level: 1 | 2 | 3;
  order_index: number;
  is_active: boolean;
  options: QuestionOptionData[];
}

export interface QuestionOptionData {
  id?: string;
  question_id?: string;
  option_text: string;
  is_correct: boolean;
  points: number;
  order_index: number;
}

export interface CategoryData {
  id?: string;
  admin_id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order_index: number;
  is_active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  
  private dashboardStatsSubject = new BehaviorSubject<AdminDashboardStats | null>(null);
  private categoriesSubject = new BehaviorSubject<CategoryData[]>([]);
  private questionsSubject = new BehaviorSubject<QuestionData[]>([]);
  private usersSubject = new BehaviorSubject<any[]>([]);

  public dashboardStats$ = this.dashboardStatsSubject.asObservable();
  public categories$ = this.categoriesSubject.asObservable();
  public questions$ = this.questionsSubject.asObservable();
  public users$ = this.usersSubject.asObservable();

  constructor(private supabase: SupabaseService) {}

  // ==================== DASHBOARD Y ESTADÍSTICAS ====================

  loadDashboardStats(adminId: string): Observable<AdminDashboardStats> {
    return from(this.supabase.getAdminAnalytics(adminId)).pipe(
      map(data => this.calculateDashboardStats(data)),
      tap(stats => this.dashboardStatsSubject.next(stats))
    );
  }

  private calculateDashboardStats(analyticsData: any): AdminDashboardStats {
    const { users, sessions, questions, categories } = analyticsData;

    const totalUsers = users.length;
    const activeUsers = users.filter((u: any) => u.games_played > 0).length;
    const totalQuestions = questions.length;
    const totalCategories = categories.length;
    const totalGamesPlayed = sessions.length;
    
    const completedSessions = sessions.filter((s: any) => s.status === 'completed');
    const averageScore = completedSessions.length > 0 
      ? completedSessions.reduce((sum: number, s: any) => sum + s.total_points, 0) / completedSessions.length 
      : 0;
    
    const completionRate = sessions.length > 0 
      ? (completedSessions.length / sessions.length) * 100 
      : 0;

    // Top performers
    const topPerformers = users
      .sort((a: any, b: any) => b.total_points - a.total_points)
      .slice(0, 5)
      .map((user: any) => ({
        id: user.id,
        name: user.full_name || user.username,
        points: user.total_points,
        gamesPlayed: user.games_played
      }));

    // Performance por categoría
    const categoryPerformance = categories.map((cat: any) => {
      const categoryQuestions = questions.filter((q: any) => q.category_id === cat.id);
      return {
        id: cat.id,
        name: cat.name,
        totalQuestions: categoryQuestions.length,
        averageScore: 0 // Se calcularía con más datos
      };
    });

    // Actividad reciente (últimas 10 sesiones)
    const recentActivity = sessions
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map((session: any) => ({
        id: session.id,
        userId: session.user_id,
        score: session.total_points,
        status: session.status,
        date: session.created_at
      }));

    return {
      totalUsers,
      activeUsers,
      totalQuestions,
      totalCategories,
      totalGamesPlayed,
      averageScore: Math.round(averageScore),
      completionRate: Math.round(completionRate),
      topPerformers,
      categoryPerformance,
      recentActivity
    };
  }

  // ==================== GESTIÓN DE CATEGORÍAS ====================

  loadCategories(adminId: string): Observable<CategoryData[]> {
    return from(this.supabase.getCategoriesByAdmin(adminId)).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data || [];
      }),
      tap(categories => this.categoriesSubject.next(categories))
    );
  }

  createCategory(categoryData: Omit<CategoryData, 'id'>): Observable<CategoryData> {
    return from(this.supabase.createCategory(categoryData)).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data;
      }),
      tap(() => this.refreshCategories(categoryData.admin_id))
    );
  }

  updateCategory(categoryId: string, updates: Partial<CategoryData>): Observable<CategoryData> {
    return from(this.supabase.updateCategory(categoryId, updates)).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data;
      }),
      tap((category) => this.refreshCategories(category.admin_id))
    );
  }

  deleteCategory(categoryId: string, adminId: string): Observable<void> {
    return from(this.supabase.deleteCategory(categoryId)).pipe(
      map(response => {
        if (response.error) throw response.error;
        return void 0;
      }),
      tap(() => this.refreshCategories(adminId))
    );
  }

  private refreshCategories(adminId: string): void {
    this.loadCategories(adminId).subscribe();
  }

  // ==================== GESTIÓN DE PREGUNTAS ====================

  loadQuestions(adminId: string): Observable<QuestionData[]> {
    return from(this.supabase.getQuestionsByAdmin(adminId)).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data || [];
      }),
      tap(questions => this.questionsSubject.next(questions))
    );
  }

  loadQuestionsByCategory(adminId: string, categoryId: string): Observable<QuestionData[]> {
    return from(this.supabase.getQuestionsByCategory(adminId, categoryId)).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data || [];
      })
    );
  }

  createQuestion(questionData: Omit<QuestionData, 'id'>): Observable<QuestionData> {
    return from(this.supabase.createQuestion(questionData)).pipe(
      switchMap(response => {
        if (response.error) throw response.error;
        
        const question = response.data;
        
        // Crear opciones de respuesta
        const optionsData = questionData.options.map(option => ({
          ...option,
          question_id: question.id
        }));
        
        return from(this.supabase.createQuestionOptions(optionsData)).pipe(
          map(optionsResponse => {
            if (optionsResponse.error) throw optionsResponse.error;
            return { ...question, options: optionsResponse.data };
          })
        );
      }),
      tap(() => this.refreshQuestions(questionData.admin_id))
    );
  }

  updateQuestion(questionId: string, updates: Partial<QuestionData>): Observable<QuestionData> {
    return from(this.supabase.updateQuestion(questionId, updates)).pipe(
      switchMap(response => {
        if (response.error) throw response.error;
        
        const question = response.data;
        
        // Si hay opciones para actualizar
        if (updates.options) {
          // Eliminar opciones existentes
          return from(this.supabase.deleteQuestionOptions(questionId)).pipe(
            switchMap(() => {
              // Crear nuevas opciones
              const optionsData = updates.options!.map(option => ({
                ...option,
                question_id: questionId
              }));
              
              return from(this.supabase.createQuestionOptions(optionsData)).pipe(
                map(optionsResponse => {
                  if (optionsResponse.error) throw optionsResponse.error;
                  return { ...question, options: optionsResponse.data };
                })
              );
            })
          );
        }
        
        return new BehaviorSubject(question).asObservable();
      }),
      tap((question) => this.refreshQuestions(question.admin_id))
    );
  }

  deleteQuestion(questionId: string, adminId: string): Observable<void> {
    return from(this.supabase.deleteQuestion(questionId)).pipe(
      map(response => {
        if (response.error) throw response.error;
        return void 0;
      }),
      tap(() => this.refreshQuestions(adminId))
    );
  }

  duplicateQuestion(questionId: string, adminId: string): Observable<QuestionData> {
    return this.questions$.pipe(
      map(questions => questions.find(q => q.id === questionId)),
      switchMap(originalQuestion => {
        if (!originalQuestion) throw new Error('Pregunta no encontrada');
        
        const duplicatedQuestion: Omit<QuestionData, 'id'> = {
          ...originalQuestion,
          question_text: `${originalQuestion.question_text} (Copia)`,
          options: originalQuestion.options.map(option => ({
            ...option,
            id: undefined,
            question_id: undefined
          }))
        };
        
        // Remover el ID para crear una nueva
        delete (duplicatedQuestion as any).id;
        
        return this.createQuestion(duplicatedQuestion);
      })
    );
  }

  private refreshQuestions(adminId: string): void {
    this.loadQuestions(adminId).subscribe();
  }

  // ==================== GESTIÓN DE USUARIOS ====================

  loadUsers(adminId: string): Observable<any[]> {
    return from(this.supabase.getUsersByAdmin(adminId)).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data || [];
      }),
      tap(users => this.usersSubject.next(users))
    );
  }

  updateUserStatus(userId: string, isActive: boolean, adminId: string): Observable<any> {
    return from(this.supabase.updateUser(userId, { is_active: isActive })).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data;
      }),
      tap(() => this.refreshUsers(adminId))
    );
  }

  resetUserProgress(userId: string, adminId: string): Observable<any> {
    const resetData = {
      total_points: 0,
      level: 1,
      experience_points: 0,
      games_played: 0
    };
    
    return from(this.supabase.updateUser(userId, resetData)).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data;
      }),
      tap(() => this.refreshUsers(adminId))
    );
  }

  private refreshUsers(adminId: string): void {
    this.loadUsers(adminId).subscribe();
  }

  // ==================== REPORTES Y ANALYTICS ====================

  generateCategoryReport(adminId: string, categoryId: string): Observable<any> {
    return combineLatest([
      from(this.supabase.getQuestionsByCategory(adminId, categoryId)),
      from(this.supabase.getRankingByCategory(adminId, categoryId, 50))
    ]).pipe(
      map(([questionsResponse, rankingResponse]) => {
        const questions = questionsResponse.data || [];
        const rankings = rankingResponse.data || [];
        
        return {
          categoryId,
          totalQuestions: questions.length,
          totalParticipants: rankings.length,
          averageScore: rankings.length > 0 
            ? rankings.reduce((sum, r) => sum + r.points, 0) / rankings.length 
            : 0,
          topPerformers: rankings.slice(0, 10),
          questionAnalysis: questions.map(q => ({
            id: q.id,
            text: q.question_text,
            difficulty: q.difficulty_level,
            points: q.points
          }))
        };
      })
    );
  }

  generateUserReport(adminId: string, userId: string): Observable<any> {
    return combineLatest([
      from(this.supabase.getGameSessionsByUser(userId)),
      from(this.supabase.getUserAchievements(userId))
    ]).pipe(
      map(([sessionsResponse, achievementsResponse]) => {
        const sessions = sessionsResponse.data || [];
        const achievements = achievementsResponse.data || [];
        
        const completedSessions = sessions.filter(s => s.status === 'completed');
        
        return {
          userId,
          totalSessions: sessions.length,
          completedSessions: completedSessions.length,
          totalPoints: completedSessions.reduce((sum, s) => sum + s.total_points, 0),
          averageScore: completedSessions.length > 0 
            ? completedSessions.reduce((sum, s) => sum + s.total_points, 0) / completedSessions.length 
            : 0,
          achievements: achievements.length,
          sessionHistory: sessions.slice(-10), // Últimas 10 sesiones
          progressOverTime: this.calculateProgressOverTime(completedSessions)
        };
      })
    );
  }

  private calculateProgressOverTime(sessions: any[]): any[] {
    return sessions
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((session, index) => ({
        sessionNumber: index + 1,
        score: session.total_points,
        date: session.created_at,
        completionPercentage: session.completion_percentage
      }));
  }

  exportData(adminId: string, format: 'csv' | 'json' = 'json'): Observable<string> {
    return combineLatest([
      this.loadUsers(adminId),
      this.loadQuestions(adminId),
      this.loadCategories(adminId),
      this.loadDashboardStats(adminId)
    ]).pipe(
      map(([users, questions, categories, stats]) => {
        const exportData = {
          adminId,
          exportDate: new Date().toISOString(),
          summary: stats,
          categories,
          questions,
          users,
          metadata: {
            totalRecords: users.length + questions.length + categories.length,
            version: '1.0',
            format
          }
        };
        
        if (format === 'csv') {
          return this.convertToCSV(exportData);
        }
        
        return JSON.stringify(exportData, null, 2);
      })
    );
  }

  private convertToCSV(data: any): string {
    // Implementación básica de conversión a CSV
    // En un caso real, usarías una librería como PapaParse
    let csv = 'Tipo,ID,Nombre,Detalles\n';
    
    data.categories.forEach((cat: any) => {
      csv += `Categoría,${cat.id},${cat.name},"${cat.description}"\n`;
    });
    
    data.questions.forEach((q: any) => {
      csv += `Pregunta,${q.id},"${q.question_text}",${q.points} puntos\n`;
    });
    
    data.users.forEach((user: any) => {
      csv += `Usuario,${user.id},${user.full_name},${user.total_points} puntos\n`;
    });
    
    return csv;
  }

  // ==================== UTILIDADES ====================

  getCurrentCategories(): CategoryData[] {
    return this.categoriesSubject.value;
  }

  getCurrentQuestions(): QuestionData[] {
    return this.questionsSubject.value;
  }

  getCurrentUsers(): any[] {
    return this.usersSubject.value;
  }

  validateQuestionData(question: Partial<QuestionData>): string[] {
    const errors: string[] = [];
    
    if (!question.question_text?.trim()) {
      errors.push('El texto de la pregunta es requerido');
    }
    
    if (!question.category_id) {
      errors.push('Debe seleccionar una categoría');
    }
    
    if (!question.points || question.points < 1) {
      errors.push('Los puntos deben ser mayor a 0');
    }
    
    if (!question.options || question.options.length < 2) {
      errors.push('Debe tener al menos 2 opciones');
    }
    
    if (question.options && !question.options.some(opt => opt.is_correct)) {
      errors.push('Debe marcar al menos una opción como correcta');
    }
    
    return errors;
  }

  validateCategoryData(category: Partial<CategoryData>): string[] {
    const errors: string[] = [];
    
    if (!category.name?.trim()) {
      errors.push('El nombre de la categoría es requerido');
    }
    
    if (!category.icon?.trim()) {
      errors.push('Debe seleccionar un icono');
    }
    
    if (!category.color?.trim()) {
      errors.push('Debe seleccionar un color');
    }
    
    return errors;
  }
}