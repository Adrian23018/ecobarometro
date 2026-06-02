// src/app/core/services/game-session.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, BehaviorSubject, combineLatest } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

// ===========================
// INTERFACES Y MODELOS
// ===========================

export interface GameSession {
  id: string;
  user_id: string;
  admin_id: string;
  session_name: string;
  total_questions: number;
  correct_answers: number;
  total_points: number;
  time_spent: number;
  completion_percentage: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  started_at: string;
  completed_at?: string;
  created_at: string;
}

export interface GameSessionStats {
  total_sessions: number;
  completed_sessions: number;
  abandoned_sessions: number;
  in_progress_sessions: number;
  avg_score: number;
  avg_time: number;
  best_score: number;
  worst_score: number;
  total_points_earned: number;
  avg_completion_percentage: number;
  total_questions_answered: number;
  total_correct_answers: number;
  overall_accuracy: number;
  avg_questions_per_session: number;
  improvement_rate: number;
  last_session_date?: string;
  streak_days: number;
}

export interface CreateGameSessionRequest {
  user_id: string;
  admin_id: string;
  session_name?: string;
  total_questions: number;
}

export interface UpdateGameSessionRequest {
  correct_answers?: number;
  total_points?: number;
  time_spent?: number;
  completion_percentage?: number;
  status?: 'in_progress' | 'completed' | 'abandoned';
  completed_at?: string;
}

export interface GameSessionWithDetails extends GameSession {
  user?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  responses?: UserResponse[];
  category_breakdown?: CategoryBreakdown[];
}

export interface UserResponse {
  id: string;
  game_session_id: string;
  user_id: string;
  question_id: string;
  selected_option_id?: string;
  custom_answer?: string;
  is_correct: boolean;
  points_earned: number;
  time_taken: number;
  created_at: string;
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

export interface CategoryBreakdown {
  category_id: string;
  category_name: string;
  category_icon?: string;
  category_color?: string;
  total_questions: number;
  correct_answers: number;
  points_earned: number;
  accuracy_percentage: number;
  avg_time_per_question: number;
}

export interface SessionPerformanceMetrics {
  session_id: string;
  accuracy: number;
  speed_score: number;
  consistency_score: number;
  difficulty_handled: number;
  overall_performance: number;
  strengths: string[];
  areas_for_improvement: string[];
}

@Injectable({
  providedIn: 'root'
})
export class GameSessionService {
  private supabase: SupabaseClient;
  private currentSessionSubject = new BehaviorSubject<GameSession | null>(null);
  private userStatsSubject = new BehaviorSubject<GameSessionStats | null>(null);

  public currentSession$ = this.currentSessionSubject.asObservable();
  public userStats$ = this.userStatsSubject.asObservable();

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // ==================== GESTIÓN DE SESIONES ====================

  /**
   * Crear nueva sesión de juego
   */
  createGameSession(userId: string, gameRequest: any): Observable<GameSession> {
    const sessionData: CreateGameSessionRequest = {
      user_id: userId,
      admin_id: this.getCurrentAdminId(),
      session_name: gameRequest.sessionName || 'EcoChallenge',
      total_questions: gameRequest.totalQuestions || gameRequest.total_questions || 10
    };

    return from(this.performCreateSession(sessionData)).pipe(
      tap(session => {
        this.currentSessionSubject.next(session);
      })
    );
  }

  private async performCreateSession(sessionData: CreateGameSessionRequest): Promise<GameSession> {
    try {
      const { data: session, error } = await this.supabase
        .from('game_sessions')
        .insert([{
          user_id: sessionData.user_id,
          admin_id: sessionData.admin_id,
          session_name: sessionData.session_name || 'EcoChallenge',
          total_questions: sessionData.total_questions,
          correct_answers: 0,
          total_points: 0,
          time_spent: 0,
          completion_percentage: 0,
          status: 'in_progress',
          started_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return session;
    } catch (error: any) {
      throw new Error('Error al crear la sesión de juego: ' + error.message);
    }
  }

  /**
   * Actualizar sesión de juego
   */
  updateGameSession(sessionId: string, updateData: UpdateGameSessionRequest): Observable<GameSession> {
    return from(this.performUpdateSession(sessionId, updateData)).pipe(
      tap(session => {
        if (session) {
          this.currentSessionSubject.next(session);
        }
      })
    );
  }

  private async performUpdateSession(sessionId: string, updateData: UpdateGameSessionRequest): Promise<GameSession> {
    try {
      const updates = { ...updateData };

      // Solo agregar completed_at si aplica (updated_at se omite — puede no existir en la tabla)
      if (updateData.status === 'completed' && !updateData.completed_at) {
        (updates as any).completed_at = new Date().toISOString();
      }

      const { data: session, error } = await this.supabase
        .from('game_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return session;
    } catch (error: any) {
      throw new Error('Error al actualizar la sesión: ' + error.message);
    }
  }

  /**
   * Obtener sesión actual del usuario
   */
  getCurrentSession(userId: string): Observable<GameSession | null> {
    return from(this.supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
    ).pipe(
      map(response => {
        if (response.error || !response.data || response.data.length === 0) {
          return null;
        }
        return response.data[0];
      }),
      tap(session => {
        this.currentSessionSubject.next(session);
      })
    );
  }

  /**
   * Finalizar sesión de juego
   */
  completeGameSession(sessionId: string, finalData: UpdateGameSessionRequest): Observable<GameSession> {
    const completionData: UpdateGameSessionRequest = {
      ...finalData,
      status: 'completed',
      completed_at: new Date().toISOString()
    };

    return this.updateGameSession(sessionId, completionData).pipe(
      switchMap(session => {
        // Actualizar estadísticas del usuario después de completar
        return this.updateUserExperienceAndLevel(session.user_id, session.total_points).pipe(
          map(() => session)
        );
      })
    );
  }

  // ==================== ESTADÍSTICAS DEL USUARIO ====================

  /**
   * Obtener estadísticas de sesiones del usuario
   */
  getUserSessionStats(userId: string): Observable<GameSessionStats> {
    return from(this.calculateUserSessionStats(userId)).pipe(
      tap(stats => {
        this.userStatsSubject.next(stats);
      })
    );
  }

  private async calculateUserSessionStats(userId: string): Promise<GameSessionStats> {
    try {
      // Obtener todas las sesiones del usuario
      const { data: sessions, error } = await this.supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);

      const allSessions = sessions || [];
      const completedSessions = allSessions.filter(s => s.status === 'completed');
      const abandonedSessions = allSessions.filter(s => s.status === 'abandoned');
      const inProgressSessions = allSessions.filter(s => s.status === 'in_progress');

      // Cálculos básicos
      const totalSessions = allSessions.length;
      const totalCompleted = completedSessions.length;
      const totalPoints = completedSessions.reduce((sum, s) => sum + (s.total_points || 0), 0);
      const totalQuestions = completedSessions.reduce((sum, s) => sum + (s.total_questions || 0), 0);
      const totalCorrect = completedSessions.reduce((sum, s) => sum + (s.correct_answers || 0), 0);
      const totalTime = completedSessions.reduce((sum, s) => sum + (s.time_spent || 0), 0);

      // Promedios
      const avgScore = totalCompleted > 0 ? totalPoints / totalCompleted : 0;
      const avgTime = totalCompleted > 0 ? totalTime / totalCompleted : 0;
      const avgCompletion = totalCompleted > 0 
        ? completedSessions.reduce((sum, s) => sum + (s.completion_percentage || 0), 0) / totalCompleted 
        : 0;
      const avgQuestionsPerSession = totalCompleted > 0 ? totalQuestions / totalCompleted : 0;
      const overallAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

      // Mejores y peores puntuaciones
      const scores = completedSessions.map(s => s.total_points || 0);
      const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
      const worstScore = scores.length > 0 ? Math.min(...scores) : 0;

      // Tasa de mejora (comparar últimas 5 sesiones con primeras 5)
      const improvementRate = this.calculateImprovementRate(completedSessions);

      // Racha de días consecutivos
      const streakDays = this.calculateStreakDays(completedSessions);

      // Última sesión
      const lastSessionDate = completedSessions.length > 0 ? completedSessions[0].completed_at : undefined;

      return {
        total_sessions: totalSessions,
        completed_sessions: totalCompleted,
        abandoned_sessions: abandonedSessions.length,
        in_progress_sessions: inProgressSessions.length,
        avg_score: Math.round(avgScore),
        avg_time: Math.round(avgTime),
        best_score: bestScore,
        worst_score: worstScore,
        total_points_earned: totalPoints,
        avg_completion_percentage: Math.round(avgCompletion),
        total_questions_answered: totalQuestions,
        total_correct_answers: totalCorrect,
        overall_accuracy: Math.round(overallAccuracy),
        avg_questions_per_session: Math.round(avgQuestionsPerSession),
        improvement_rate: improvementRate,
        last_session_date: lastSessionDate,
        streak_days: streakDays
      };
    } catch (error: any) {
      throw new Error('Error al calcular estadísticas: ' + error.message);
    }
  }

  private calculateImprovementRate(sessions: GameSession[]): number {
    if (sessions.length < 10) return 0;

    const sortedSessions = sessions.sort((a, b) => 
      new Date(a.completed_at || a.created_at).getTime() - new Date(b.completed_at || b.created_at).getTime()
    );

    const firstHalf = sortedSessions.slice(0, Math.floor(sessions.length / 2));
    const secondHalf = sortedSessions.slice(Math.floor(sessions.length / 2));

    const firstHalfAvg = firstHalf.reduce((sum, s) => sum + (s.total_points || 0), 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, s) => sum + (s.total_points || 0), 0) / secondHalf.length;

    if (firstHalfAvg === 0) return 0;
    return Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100);
  }

  private calculateStreakDays(sessions: GameSession[]): number {
    if (sessions.length === 0) return 0;

    const completedSessions = sessions
      .filter(s => s.completed_at && s.completion_percentage >= 80)
      .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime());

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const session of completedSessions) {
      const sessionDate = new Date(session.completed_at!);
      sessionDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff <= 1) {
        streak++;
        currentDate = sessionDate;
      } else {
        break;
      }
    }

    return streak;
  }

  // ==================== SESIONES DETALLADAS ====================

  /**
   * Obtener sesión con detalles completos
   */
  getSessionWithDetails(sessionId: string): Observable<GameSessionWithDetails> {
    return from(this.buildSessionWithDetails(sessionId));
  }

  private async buildSessionWithDetails(sessionId: string): Promise<GameSessionWithDetails> {
    try {
      // Obtener sesión básica
      const { data: session, error: sessionError } = await this.supabase
        .from('game_sessions')
        .select(`
          *,
          users(id, username, full_name, avatar_url)
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) throw new Error(sessionError.message);

      // Obtener respuestas con detalles
      const { data: responses, error: responsesError } = await this.supabase
        .from('user_responses')
        .select(`
          *,
          questions(
            id,
            question_text,
            category_id,
            categories(name, color, icon)
          )
        `)
        .eq('game_session_id', sessionId)
        .order('created_at', { ascending: true });

      if (responsesError) throw new Error(responsesError.message);

      // Calcular breakdown por categoría
      const categoryBreakdown = this.calculateCategoryBreakdown(responses || []);

      return {
        ...session,
        user: session.users,
        responses: responses || [],
        category_breakdown: categoryBreakdown
      };
    } catch (error: any) {
      throw new Error('Error al obtener detalles de la sesión: ' + error.message);
    }
  }

  private calculateCategoryBreakdown(responses: any[]): CategoryBreakdown[] {
    const categoryMap = new Map<string, any>();

    responses.forEach(response => {
      const categoryId = response.questions?.category_id;
      const categoryName = response.questions?.categories?.name;
      const categoryIcon = response.questions?.categories?.icon;
      const categoryColor = response.questions?.categories?.color;

      if (!categoryId) return;

      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          category_id: categoryId,
          category_name: categoryName || 'Sin categoría',
          category_icon: categoryIcon,
          category_color: categoryColor,
          total_questions: 0,
          correct_answers: 0,
          points_earned: 0,
          total_time: 0
        });
      }

      const category = categoryMap.get(categoryId);
      category.total_questions++;
      if (response.is_correct) category.correct_answers++;
      category.points_earned += response.points_earned || 0;
      category.total_time += response.time_taken || 0;
    });

    return Array.from(categoryMap.values()).map(category => ({
      ...category,
      accuracy_percentage: category.total_questions > 0 
        ? Math.round((category.correct_answers / category.total_questions) * 100) 
        : 0,
      avg_time_per_question: category.total_questions > 0 
        ? Math.round(category.total_time / category.total_questions) 
        : 0
    }));
  }

  // ==================== HISTORIAL Y BÚSQUEDAS ====================

  /**
   * Obtener historial de sesiones del usuario
   */
  getUserSessionHistory(userId: string, limit: number = 20, offset: number = 0): Observable<GameSession[]> {
    return from(this.supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    ).pipe(
      map(response => {
        if (response.error) throw new Error(response.error.message);
        return response.data || [];
      })
    );
  }

  /**
   * Buscar sesiones por filtros
   */
  searchSessions(filters: {
    userId?: string;
    adminId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    minScore?: number;
    maxScore?: number;
  }): Observable<GameSession[]> {
    return from(this.performSessionSearch(filters));
  }

  private async performSessionSearch(filters: any): Promise<GameSession[]> {
    let query = this.supabase.from('game_sessions').select('*');

    if (filters.userId) query = query.eq('user_id', filters.userId);
    if (filters.adminId) query = query.eq('admin_id', filters.adminId);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
    if (filters.dateTo) query = query.lte('created_at', filters.dateTo);
    if (filters.minScore) query = query.gte('total_points', filters.minScore);
    if (filters.maxScore) query = query.lte('total_points', filters.maxScore);

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  // ==================== UTILIDADES Y HELPERS ====================

  /**
   * Actualizar experiencia y nivel del usuario tras completar sesión
   */
  private updateUserExperienceAndLevel(userId: string, pointsEarned: number): Observable<any> {
    const experienceGained = Math.round(pointsEarned * 0.1); // 10% de los puntos como experiencia

    return from(this.supabase
      .from('users')
      .select('experience_points, level, total_points, games_played')
      .eq('id', userId)
      .single()
    ).pipe(
      switchMap(response => {
        const currentData = response.data;
        const newExperience = (currentData?.experience_points || 0) + experienceGained;
        const newTotalPoints = (currentData?.total_points || 0) + pointsEarned;
        const newGamesPlayed = (currentData?.games_played || 0) + 1;
        
        // Calcular nuevo nivel (cada 1000 XP = 1 nivel)
        const newLevel = Math.floor(newExperience / 1000) + 1;

        return from(this.supabase
          .from('users')
          .update({
            experience_points: newExperience,
            level: Math.max(newLevel, currentData?.level || 1),
            total_points: newTotalPoints,
            games_played: newGamesPlayed,
            last_game_at: new Date().toISOString()
          })
          .eq('id', userId)
        );
      })
    );
  }

  /**
   * Obtener estadísticas del usuario actual desde localStorage
   */
  getCurrentUserStats(): GameSessionStats | null {
    return this.userStatsSubject.value;
  }

  /**
   * Obtener sesión actual desde BehaviorSubject
   */
  getCurrentSessionValue(): GameSession | null {
    return this.currentSessionSubject.value;
  }

  /**
   * Limpiar sesión actual
   */
  clearCurrentSession(): void {
    this.currentSessionSubject.next(null);
  }

  /**
   * Obtener ID del administrador desde localStorage
   */
  private getCurrentAdminId(): string {
    const userData = localStorage.getItem('ecobarometro_user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.admin_id || '';
    }
    return '';
  }

  /**
   * Verifica si el usuario ya completó al menos una sesión de EcoChallenge
   */
  hasCompletedChallenge(userId: string, adminId: string): Observable<boolean> {
    return from(this.supabase
      .from('game_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('admin_id', adminId)
      .eq('status', 'completed')
    ).pipe(
      map(response => (response.count ?? 0) > 0)
    );
  }

  /**
   * Obtiene la sesión en curso (in_progress) del usuario para reanudar
   */
  getInProgressSession(userId: string, adminId: string): Observable<GameSession | null> {
    return from(this.supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('admin_id', adminId)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    ).pipe(
      map(response => response.data as GameSession | null)
    );
  }

  /**
   * Obtiene la última sesión completada para mostrar datos al usuario
   */
  getLastCompletedSession(userId: string, adminId: string): Observable<GameSession | null> {
    return from(this.supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('admin_id', adminId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    ).pipe(
      map(response => response.data as GameSession | null)
    );
  }

  /**
   * Obtener sesión por ID
   */
  getGameSession(sessionId: string): Observable<GameSession> {
    return from(this.supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    ).pipe(
      map(response => {
        if (response.error) throw new Error(response.error.message);
        return response.data;
      })
    );
  }

  /**
   * Abandonar sesión de juego
   */
  abandonSession(sessionId: string): Observable<GameSession> {
    return this.updateGameSession(sessionId, {
      status: 'abandoned',
      completed_at: new Date().toISOString()
    });
  }

  /**
   * Completar sesión con datos finales
   */
  completeSession(sessionId: string, completionData: any): Observable<GameSession> {
    return this.updateGameSession(sessionId, {
      ...completionData,
      status: 'completed',
      completed_at: new Date().toISOString()
    });
  }

  /**
   * Obtiene las respuestas ya guardadas de una sesión (para recuperación de estado)
   */
  getSessionResponses(sessionId: string): Observable<{ question_id: string; is_correct: boolean; points_earned: number }[]> {
    return from(this.supabase
      .from('user_responses')
      .select('question_id, is_correct, points_earned')
      .eq('game_session_id', sessionId)
      .order('created_at', { ascending: true })
    ).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Guardar respuesta del usuario
   */
  submitResponse(response: any): Observable<any> {
    const payload: any = {
      game_session_id: response.session_id,
      user_id: response.user_id,
      question_id: response.question_id,
      is_correct: response.is_correct,
      points_earned: response.points_earned,
      time_taken: response.time_taken
    };

    // Only include selected_option_id when it's a valid non-empty value (UUID column rejects empty string)
    if (response.selected_option_id) {
      payload.selected_option_id = response.selected_option_id;
    }

    return from(this.supabase
      .from('user_responses')
      .insert([payload])
      .select()
      .single()
    ).pipe(
      map(result => {
        if (result.error) throw new Error(result.error.message);
        return result.data;
      })
    );
  }

  /**
   * Calcular métricas de rendimiento de una sesión
   */
  calculateSessionPerformance(sessionId: string): Observable<SessionPerformanceMetrics> {
    return this.getSessionWithDetails(sessionId).pipe(
      map(sessionDetails => {
        const responses = sessionDetails.responses || [];
        const totalQuestions = responses.length;
        
        if (totalQuestions === 0) {
          return {
            session_id: sessionId,
            accuracy: 0,
            speed_score: 0,
            consistency_score: 0,
            difficulty_handled: 0,
            overall_performance: 0,
            strengths: [],
            areas_for_improvement: ['Completar más preguntas']
          };
        }

        const correctAnswers = responses.filter(r => r.is_correct).length;
        const accuracy = (correctAnswers / totalQuestions) * 100;
        
        const avgTimePerQuestion = responses.reduce((sum, r) => sum + (r.time_taken || 0), 0) / totalQuestions;
        const speedScore = Math.max(0, 100 - (avgTimePerQuestion / 30) * 100); // 30 segundos como óptimo

        // Calcular consistencia (variabilidad en tiempos de respuesta)
        const times = responses.map(r => r.time_taken || 0);
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const variance = times.reduce((sum, time) => sum + Math.pow(time - avgTime, 2), 0) / times.length;
        const consistency = Math.max(0, 100 - (Math.sqrt(variance) / avgTime) * 100);

        const overallPerformance = (accuracy + speedScore + consistency) / 3;

        // Determinar fortalezas y áreas de mejora
        const strengths = [];
        const improvements = [];

        if (accuracy >= 80) strengths.push('Excelente precisión');
        else if (accuracy < 60) improvements.push('Mejorar conocimientos');

        if (speedScore >= 70) strengths.push('Respuestas rápidas');
        else if (speedScore < 50) improvements.push('Mejorar velocidad');

        if (consistency >= 70) strengths.push('Rendimiento consistente');
        else improvements.push('Mantener consistencia');

        return {
          session_id: sessionId,
          accuracy: Math.round(accuracy),
          speed_score: Math.round(speedScore),
          consistency_score: Math.round(consistency),
          difficulty_handled: Math.round(accuracy), // Simplificado
          overall_performance: Math.round(overallPerformance),
          strengths,
          areas_for_improvement: improvements
        };
      })
    );
  }

  /**
   * Obtener resumen completo de una sesión para la pantalla de resultados
   */
  getSessionSummary(sessionId: string): Observable<any> {
    console.log('📊 Obteniendo resumen de sesión:', sessionId);

    return from(
      this.supabase
        .from('game_sessions')
        .select(`
          *,
          user:users(id, username, full_name, avatar_url)
        `)
        .eq('id', sessionId)
        .single()
    ).pipe(
      switchMap(sessionResult => {
        if (sessionResult.error) {
          console.error('Error obteniendo sesión:', sessionResult.error);
          throw new Error(sessionResult.error.message);
        }

        const session = sessionResult.data;
        console.log('✅ Sesión obtenida:', session);

        // Obtener respuestas del usuario para esta sesión
        return from(
          this.supabase
            .from('user_responses')
            .select(`
              *,
              question:questions(
                id,
                question_text,
                category_id,
                category:categories(*)
              ),
              selected_option:question_options!user_responses_selected_option_id_fkey(
                id,
                option_text,
                is_correct
              )
            `)
            .eq('game_session_id', sessionId)
        ).pipe(
          map(responsesResult => {
            if (responsesResult.error) {
              console.error('Error obteniendo respuestas:', responsesResult.error);
              throw new Error(responsesResult.error.message);
            }

            const responses = responsesResult.data || [];
            console.log('✅ Respuestas obtenidas:', responses.length);

            // Calcular puntajes por categoría
            const categoryScoresMap = new Map();

            responses.forEach((response: any) => {
              const category = response.question?.category;
              if (!category) return;

              if (!categoryScoresMap.has(category.id)) {
                categoryScoresMap.set(category.id, {
                  category: category,
                  correct_answers: 0,
                  total_questions: 0,
                  points_earned: 0,
                  percentage: 0
                });
              }

              const categoryScore = categoryScoresMap.get(category.id);
              categoryScore.total_questions++;
              if (response.is_correct) {
                categoryScore.correct_answers++;
              }
              categoryScore.points_earned += response.points_earned || 0;
              categoryScore.percentage = Math.round(
                (categoryScore.correct_answers / categoryScore.total_questions) * 100
              );
            });

            const category_scores = Array.from(categoryScoresMap.values());

            console.log('📊 Puntajes por categoría:', category_scores);

            // Por ahora, achievements y ranking son opcionales
            const summary = {
              session: session,
              category_scores: category_scores,
              achievements_earned: [],
              ranking_position: 0,
              improvement_percentage: 0,
              responses: responses // Agregar las respuestas al resumen
            };

            console.log('✅ Resumen completo:', summary);
            return summary;
          })
        );
      })
    );
  }
}