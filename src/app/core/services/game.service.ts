// src/app/core/services/game.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, from, combineLatest } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Question {
  id: string;
  admin_id: string;
  category_id: string;
  question_text: string;
  question_type: string;
  points: number;
  difficulty_level: number;
  order_index: number;
  is_active: boolean;
  category?: Category;
  options?: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  points: number;
  order_index: number;
}

export interface Category {
  id: string;
  admin_id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order_index: number;
  is_active: boolean;
}

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
}

export interface GameState {
  currentSession: GameSession | null;
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  questions: Question[];
  timeRemaining: number;
  totalScore: number;
  isGameActive: boolean;
  userResponses: UserResponse[];
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private supabase: SupabaseClient;
  private gameStateSubject = new BehaviorSubject<GameState>({
    currentSession: null,
    currentQuestion: null,
    currentQuestionIndex: 0,
    questions: [],
    timeRemaining: 30,
    totalScore: 0,
    isGameActive: false,
    userResponses: []
  });

  public gameState$ = this.gameStateSubject.asObservable();

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  // ==================== GESTIÓN DE SESIONES ====================

  /**
   * Inicia una nueva sesión de juego
   */
  startGameSession(userId: string, adminId: string, sessionName: string = 'EcoChallenge'): Observable<GameSession> {
    return from(this.getQuestionsForAdmin(adminId)).pipe(
      switchMap(questions => {
        const gameSession = {
          user_id: userId,
          admin_id: adminId,
          session_name: sessionName,
          total_questions: questions.length,
          correct_answers: 0,
          total_points: 0,
          time_spent: 0,
          completion_percentage: 0,
          status: 'in_progress' as const,
          started_at: new Date().toISOString()
        };

        return from(this.supabase
          .from('game_sessions')
          .insert([gameSession])
          .select()
          .single()
        );
      }),
      map(response => {
        if (response.error) throw response.error;
        
        const session = response.data as GameSession;
        this.updateGameState({
          currentSession: session,
          isGameActive: true,
          currentQuestionIndex: 0
        });
        
        return session;
      })
    );
  }

  /**
   * Obtiene preguntas para un administrador específico
   */
  private async getQuestionsForAdmin(adminId: string): Promise<Question[]> {
    const { data: questions, error } = await this.supabase
      .from('questions')
      .select(`
        *,
        category:categories(*),
        options:question_options(*)
      `)
      .eq('admin_id', adminId)
      .eq('is_active', true)
      .order('order_index');

    if (error) throw error;

    // Mezclar preguntas para aleatoriedad
    return this.shuffleArray(questions || []);
  }

  /**
   * Carga la siguiente pregunta
   */
  loadNextQuestion(): Observable<Question | null> {
    const currentState = this.gameStateSubject.value;
    
    if (!currentState.questions.length) {
      return from(this.getQuestionsForAdmin(currentState.currentSession?.admin_id || '')).pipe(
        map(questions => {
          this.updateGameState({ questions });
          return questions[0] || null;
        })
      );
    }

    const nextIndex = currentState.currentQuestionIndex;
    const nextQuestion = currentState.questions[nextIndex] || null;
    
    this.updateGameState({
      currentQuestion: nextQuestion,
      currentQuestionIndex: nextIndex,
      timeRemaining: 30 // Reset timer
    });

    return new BehaviorSubject(nextQuestion).asObservable();
  }

  // ==================== RESPUESTAS Y PUNTUACIÓN ====================

  /**
   * Procesa la respuesta del usuario
   */
  submitAnswer(
    gameSessionId: string,
    userId: string,
    questionId: string,
    selectedOptionId: string,
    timeTaken: number
  ): Observable<UserResponse> {
    const currentState = this.gameStateSubject.value;
    const question = currentState.currentQuestion;
    
    if (!question) throw new Error('No hay pregunta activa');

    const selectedOption = question.options?.find(opt => opt.id === selectedOptionId);
    const isCorrect = selectedOption?.is_correct || false;
    const pointsEarned = isCorrect ? (selectedOption?.points || question.points) : 0;

    const userResponse = {
      game_session_id: gameSessionId,
      user_id: userId,
      question_id: questionId,
      selected_option_id: selectedOptionId,
      is_correct: isCorrect,
      points_earned: pointsEarned,
      time_taken: timeTaken
    };

    return from(this.supabase
      .from('user_responses')
      .insert([userResponse])
      .select()
      .single()
    ).pipe(
      switchMap(response => {
        if (response.error) throw response.error;

        const savedResponse = response.data as UserResponse;
        
        // Actualizar estado del juego
        const newResponses = [...currentState.userResponses, savedResponse];
        const newTotalScore = newResponses.reduce((sum, resp) => sum + resp.points_earned, 0);
        const newCorrectAnswers = newResponses.filter(resp => resp.is_correct).length;
        
        this.updateGameState({
          userResponses: newResponses,
          totalScore: newTotalScore,
          currentQuestionIndex: currentState.currentQuestionIndex + 1
        });

        // Actualizar sesión en base de datos
        return from(this.updateGameSession(gameSessionId, {
          correct_answers: newCorrectAnswers,
          total_points: newTotalScore,
          completion_percentage: (newResponses.length / currentState.questions.length) * 100
        })).pipe(
          map(() => savedResponse)
        );
      })
    );
  }

  /**
   * Actualiza la sesión de juego
   */
  private async updateGameSession(sessionId: string, updates: Partial<GameSession>) {
    const { error } = await this.supabase
      .from('game_sessions')
      .update(updates)
      .eq('id', sessionId);

    if (error) throw error;
  }

  /**
   * Finaliza la sesión de juego
   */
  finishGameSession(sessionId: string): Observable<GameSession> {
    const currentState = this.gameStateSubject.value;
    
    const finalUpdates = {
      status: 'completed' as const,
      completed_at: new Date().toISOString(),
      completion_percentage: 100
    };

    return from(this.supabase
      .from('game_sessions')
      .update(finalUpdates)
      .eq('id', sessionId)
      .select()
      .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        
        const finishedSession = response.data as GameSession;
        this.updateGameState({
          currentSession: finishedSession,
          isGameActive: false
        });
        
        return finishedSession;
      })
    );
  }

  // ==================== RANKING Y ESTADÍSTICAS ====================

  /**
   * Obtiene el ranking de usuarios para un administrador
   */
  getRanking(adminId: string, limit: number = 10): Observable<any[]> {
    return from(this.supabase
      .from('users')
      .select(`
        id,
        username,
        full_name,
        avatar_url,
        total_points,
        level,
        games_played,
        last_game_at
      `)
      .eq('admin_id', adminId)
      .eq('is_active', true)
      .order('total_points', { ascending: false })
      .limit(limit)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data || [];
      })
    );
  }

  /**
   * Obtiene estadísticas del usuario
   */
  getUserStats(userId: string): Observable<any> {
    return combineLatest([
      from(this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      ),
      from(this.supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
      ),
      from(this.supabase
        .from('user_responses')
        .select('*')
        .eq('user_id', userId)
      )
    ]).pipe(
      map(([userResponse, sessionsResponse, responsesResponse]) => {
        const user = userResponse.data;
        const sessions = sessionsResponse.data || [];
        const responses = responsesResponse.data || [];

        const totalGames = sessions.length;
        const totalQuestions = responses.length;
        const correctAnswers = responses.filter(r => r.is_correct).length;
        const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
        const averageScore = sessions.length > 0 
          ? sessions.reduce((sum, s) => sum + s.total_points, 0) / sessions.length 
          : 0;

        return {
          user,
          stats: {
            totalGames,
            totalQuestions,
            correctAnswers,
            accuracy: Math.round(accuracy),
            averageScore: Math.round(averageScore),
            totalPoints: user.total_points,
            level: user.level
          }
        };
      })
    );
  }

  // ==================== CATEGORÍAS ====================

  /**
   * Obtiene categorías de un administrador
   */
  getCategories(adminId: string): Observable<Category[]> {
    return from(this.supabase
      .from('categories')
      .select('*')
      .eq('admin_id', adminId)
      .eq('is_active', true)
      .order('order_index')
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data || [];
      })
    );
  }

  /**
   * Obtiene preguntas por categoría
   */
  getQuestionsByCategory(adminId: string, categoryId: string): Observable<Question[]> {
    return from(this.supabase
      .from('questions')
      .select(`
        *,
        category:categories(*),
        options:question_options(*)
      `)
      .eq('admin_id', adminId)
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('order_index')
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data || [];
      })
    );
  }

  // ==================== UTILIDADES ====================

  /**
   * Actualiza el estado del juego
   */
  private updateGameState(updates: Partial<GameState>) {
    const currentState = this.gameStateSubject.value;
    this.gameStateSubject.next({ ...currentState, ...updates });
  }

  /**
   * Mezcla un array aleatoriamente
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Resetea el estado del juego
   */
  resetGameState() {
    this.gameStateSubject.next({
      currentSession: null,
      currentQuestion: null,
      currentQuestionIndex: 0,
      questions: [],
      timeRemaining: 30,
      totalScore: 0,
      isGameActive: false,
      userResponses: []
    });
  }

  /**
   * Obtiene el estado actual del juego
   */
  getCurrentGameState(): GameState {
    return this.gameStateSubject.value;
  }

  // ==================== LOGROS Y GAMIFICACIÓN ====================

  /**
   * Verifica y otorga logros al usuario
   */
  checkAndAwardAchievements(userId: string): Observable<any[]> {
    return this.getUserStats(userId).pipe(
      switchMap(userStats => {
        // Lógica para verificar logros basados en estadísticas
        const achievements = [];
        
        // Ejemplo: Logro por primera partida completada
        if (userStats.stats.totalGames === 1) {
          achievements.push({
            user_id: userId,
            achievement_id: 'first-game-achievement' // ID del logro predefinido
          });
        }

        // Ejemplo: Logro por 100% de precisión
        if (userStats.stats.accuracy === 100 && userStats.stats.totalQuestions >= 10) {
          achievements.push({
            user_id: userId,
            achievement_id: 'perfect-score-achievement'
          });
        }

        // Insertar logros en la base de datos
        if (achievements.length > 0) {
          return from(this.supabase
            .from('user_achievements')
            .upsert(achievements, { onConflict: 'user_id,achievement_id' })
            .select()
          );
        }

        return new BehaviorSubject([]).asObservable();
      }),
      map((response:any) => response.data || [])
    );
  }
}