// src/app/core/services/user.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, BehaviorSubject, combineLatest } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { LocalStorageService } from './local-storage.service';

export interface UserStats {
  totalPoints: number;
  level: number;
  experiencePoints: number;
  gamesPlayed: number;
  averageScore: number;
  bestScore: number;
  accuracy: number;
  streak: number;
  completedCategories: number;
  totalQuestions: number;
  correctAnswers: number;
  rank: number;
  achievements: number;
}

export interface UserAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  badgeColor: string;
  pointsRequired: number;
  earnedAt?: string;
  isUnlocked: boolean;
}

export interface GameHistory {
  id: string;
  sessionName: string;
  totalQuestions: number;
  correctAnswers: number;
  totalPoints: number;
  accuracy: number;
  timeSpent: number;
  completionPercentage: number;
  playedAt: string;
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    questions: number;
    correct: number;
    points: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private userStatsSubject = new BehaviorSubject<UserStats | null>(null);
  private achievementsSubject = new BehaviorSubject<UserAchievement[]>([]);
  private gameHistorySubject = new BehaviorSubject<GameHistory[]>([]);

  public userStats$ = this.userStatsSubject.asObservable();
  public achievements$ = this.achievementsSubject.asObservable();
  public gameHistory$ = this.gameHistorySubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private localStorage: LocalStorageService
  ) {}

  // ==================== ESTADÍSTICAS DE USUARIO ====================

  loadUserStats(userId: string): Observable<UserStats> {
    return from(this.calculateUserStats(userId)).pipe(
      tap(stats => {
        this.userStatsSubject.next(stats);
        // Actualizar datos locales
        this.localStorage.setGameProgress({
          currentLevel: stats.level,
          totalExperience: stats.experiencePoints,
          totalGamesPlayed: stats.gamesPlayed
        });
      })
    );
  }

  private async calculateUserStats(userId: string): Promise<UserStats> {
    try {
      // Obtener datos del usuario
      const [userResponse, sessionsResponse, responsesResponse, rankingResponse] = await Promise.all([
        this.supabase.client.from('users').select('*').eq('id', userId).single(),
        this.supabase.client.from('game_sessions').select('*').eq('user_id', userId),
        this.supabase.client.from('user_responses').select('*').eq('user_id', userId),
        this.supabase.client.from('rankings').select('*').eq('user_id', userId)
      ]);

      const user = userResponse.data;
      const sessions = sessionsResponse.data || [];
      const responses = responsesResponse.data || [];
      const rankings = rankingResponse.data || [];

      const completedSessions = sessions.filter(s => s.status === 'completed');
      const totalPoints = user?.total_points || 0;
      const level = user?.level || 1;
      const experiencePoints = user?.experience_points || 0;
      const gamesPlayed = completedSessions.length;
      
      const totalQuestions = responses.length;
      const correctAnswers = responses.filter(r => r.is_correct).length;
      const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
      
      const scores = completedSessions.map(s => s.total_points);
      const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

      // Calcular racha actual
      const streak = this.calculateCurrentStreak(completedSessions);

      // Obtener categorías completadas
      const completedCategories = new Set(
        responses.filter(r => r.is_correct).map(r => r.question?.category_id)
      ).size;

      // Calcular ranking
      const userRanking = rankings.find(r => r.category_id === null); // Ranking general
      const rank = userRanking?.rank_position || 0;

      // Contar logros
      const achievementsResponse = await this.supabase.getUserAchievements(userId);
      const achievements = achievementsResponse.data?.length || 0;

      return {
        totalPoints,
        level,
        experiencePoints,
        gamesPlayed,
        averageScore: Math.round(averageScore),
        bestScore,
        accuracy: Math.round(accuracy),
        streak,
        completedCategories,
        totalQuestions,
        correctAnswers,
        rank,
        achievements
      };
    } catch (error) {
      console.error('Error calculando estadísticas:', error);
      throw error;
    }
  }

  private calculateCurrentStreak(sessions: any[]): number {
    if (sessions.length === 0) return 0;
    
    // Ordenar sesiones por fecha (más reciente primero)
    const sortedSessions = sessions
      .filter(s => s.completion_percentage >= 80) // Solo sesiones bien completadas
      .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
    
    let streak = 0;
    let currentDate = new Date();
    
    for (const session of sortedSessions) {
      const sessionDate = new Date(session.completed_at);
      const daysDiff = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff <= 1) { // Mismo día o día anterior
        streak++;
        currentDate = sessionDate;
      } else {
        break;
      }
    }
    
    return streak;
  }

  // ==================== LOGROS ====================

  loadUserAchievements(userId: string): Observable<UserAchievement[]> {
    return combineLatest([
      from(this.supabase.getUserAchievements(userId)),
      from(this.supabase.getAchievementsByAdmin(this.getCurrentAdminId()))
    ]).pipe(
      map(([userAchievementsResponse, allAchievementsResponse]) => {
        const userAchievements = userAchievementsResponse.data || [];
        const allAchievements = allAchievementsResponse.data || [];
        
        return allAchievements.map(achievement => ({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          badgeColor: achievement.badge_color,
          pointsRequired: achievement.points_required,
          earnedAt: userAchievements.find(ua => ua.achievement_id === achievement.id)?.earned_at,
          isUnlocked: userAchievements.some(ua => ua.achievement_id === achievement.id)
        }));
      }),
      tap(achievements => {
        this.achievementsSubject.next(achievements);
        // Guardar en caché local
        this.localStorage.setAchievementsCache(achievements);
      })
    );
  }

  checkForNewAchievements(userId: string): Observable<UserAchievement[]> {
    return this.userStats$.pipe(
      switchMap(stats => {
        if (!stats) return new BehaviorSubject([]).asObservable();
        
        const potentialAchievements = this.identifyPotentialAchievements(stats);
        
        if (potentialAchievements.length > 0) {
          return from(this.awardAchievements(userId, potentialAchievements));
        }
        
        return new BehaviorSubject([]).asObservable();
      })
    );
  }

  private identifyPotentialAchievements(stats: UserStats): string[] {
    const achievements = [];
    
    // Logro por primera partida
    if (stats.gamesPlayed === 1) {
      achievements.push('first-game');
    }
    
    // Logro por puntuación perfecta
    if (stats.accuracy === 100 && stats.totalQuestions >= 10) {
      achievements.push('perfect-score');
    }
    
    // Logro por nivel alto
    if (stats.level >= 10) {
      achievements.push('level-master');
    }
    
    // Logro por racha
    if (stats.streak >= 7) {
      achievements.push('weekly-warrior');
    }
    
    // Logro por muchos juegos
    if (stats.gamesPlayed >= 100) {
      achievements.push('game-addict');
    }
    
    return achievements;
  }

  private async awardAchievements(userId: string, achievementIds: string[]): Promise<UserAchievement[]> {
    const newAchievements = [];
    
    for (const achievementId of achievementIds) {
      try {
        const response = await this.supabase.createUserAchievement({
          user_id: userId,
          achievement_id: achievementId
        });
        
        if (response.data) {
          newAchievements.push(response.data);
        }
      } catch (error) {
        console.error('Error otorgando logro:', error);
      }
    }
    
    return newAchievements;
  }

  // ==================== HISTORIAL DE JUEGOS ====================

  loadGameHistory(userId: string, limit: number = 20): Observable<GameHistory[]> {
    return from(this.supabase.getGameSessionsByUser(userId)).pipe(
      switchMap(response => {
        const sessions = response.data || [];
        const completedSessions = sessions
          .filter(s => s.status === 'completed')
          .slice(0, limit);
        
        // Obtener detalles de cada sesión
        return from(Promise.all(
          completedSessions.map(session => this.buildGameHistoryItem(session))
        ));
      }),
      tap(history => this.gameHistorySubject.next(history))
    );
  }

  private async buildGameHistoryItem(session: any): Promise<GameHistory> {
    try {
      // Obtener respuestas de la sesión
      const responsesResponse = await this.supabase.getUserResponsesBySession(session.id);
      const responses = responsesResponse.data || [];
      
      // Agrupar por categoría
      const categoryBreakdown = this.groupResponsesByCategory(responses);
      
      return {
        id: session.id,
        sessionName: session.session_name,
        totalQuestions: session.total_questions,
        correctAnswers: session.correct_answers,
        totalPoints: session.total_points,
        accuracy: Math.round((session.correct_answers / session.total_questions) * 100),
        timeSpent: session.time_spent,
        completionPercentage: session.completion_percentage,
        playedAt: session.completed_at,
        categoryBreakdown
      };
    } catch (error) {
      console.error('Error construyendo historial:', error);
      return {
        id: session.id,
        sessionName: session.session_name,
        totalQuestions: session.total_questions,
        correctAnswers: session.correct_answers,
        totalPoints: session.total_points,
        accuracy: 0,
        timeSpent: session.time_spent,
        completionPercentage: session.completion_percentage,
        playedAt: session.completed_at,
        categoryBreakdown: []
      };
    }
  }

  private groupResponsesByCategory(responses: any[]): any[] {
    const categories = new Map();
    
    responses.forEach(response => {
      const categoryId = response.question?.category_id;
      const categoryName = response.question?.category?.name;
      
      if (!categoryId) return;
      
      if (!categories.has(categoryId)) {
        categories.set(categoryId, {
          categoryId,
          categoryName: categoryName || 'Sin categoría',
          questions: 0,
          correct: 0,
          points: 0
        });
      }
      
      const category = categories.get(categoryId);
      category.questions++;
      if (response.is_correct) category.correct++;
      category.points += response.points_earned;
    });
    
    return Array.from(categories.values());
  }

  // ==================== PERFIL DE USUARIO ====================

  updateProfile(userId: string, profileData: any): Observable<any> {
    return from(this.supabase.updateUser(userId, profileData)).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data;
      }),
      tap(updatedUser => {
        // Actualizar localStorage
        this.localStorage.setUserProfile(updatedUser);
      })
    );
  }

  uploadAvatar(userId: string, file: File): Observable<string> {
    // Implementación para subir avatar a Supabase Storage
    return from(this.uploadToStorage(file, `avatars/${userId}`)).pipe(
      switchMap(avatarUrl => {
        return this.updateProfile(userId, { avatar_url: avatarUrl }).pipe(
          map(() => avatarUrl)
        );
      })
    );
  }

  private async uploadToStorage(file: File, path: string): Promise<string> {
    // Aquí implementarías la subida a Supabase Storage
    // Por ahora retornamos una URL de ejemplo
    return `https://example.com/storage/${path}`;
  }

  // ==================== CONFIGURACIONES ====================

  updateGameSettings(settings: any): Observable<void> {
    this.localStorage.setGameSettings(settings);
    return new BehaviorSubject(void 0).asObservable();
  }

  getGameSettings(): Observable<any> {
    return this.localStorage.getSettings();
  }

  // ==================== PROGRESO Y NIVELES ====================

  calculateLevelProgress(experiencePoints: number): { currentLevel: number, nextLevel: number, progress: number, pointsNeeded: number } {
    // Sistema de niveles exponencial
    const baseXP = 1000;
    const multiplier = 1.5;
    
    let currentLevel = 1;
    let totalXPForCurrentLevel = 0;
    
    while (true) {
      const xpForNextLevel = Math.floor(baseXP * Math.pow(multiplier, currentLevel - 1));
      
      if (totalXPForCurrentLevel + xpForNextLevel > experiencePoints) {
        break;
      }
      
      totalXPForCurrentLevel += xpForNextLevel;
      currentLevel++;
    }
    
    const xpForNextLevel = Math.floor(baseXP * Math.pow(multiplier, currentLevel - 1));
    const currentLevelXP = experiencePoints - totalXPForCurrentLevel;
    const progress = (currentLevelXP / xpForNextLevel) * 100;
    const pointsNeeded = xpForNextLevel - currentLevelXP;
    
    return {
      currentLevel,
      nextLevel: currentLevel + 1,
      progress: Math.round(progress),
      pointsNeeded
    };
  }

  addExperience(userId: string, experience: number): Observable<any> {
    return from(this.supabase.client
      .from('users')
      .select('experience_points, level')
      .eq('id', userId)
      .single()
    ).pipe(
      switchMap(response => {
        const currentXP = response.data?.experience_points || 0;
        const currentLevel = response.data?.level || 1;
        const newXP = currentXP + experience;
        
        const levelInfo = this.calculateLevelProgress(newXP);
        const updates: any = { experience_points: newXP };
        
        // Subir de nivel si es necesario
        if (levelInfo.currentLevel > currentLevel) {
          updates.level = levelInfo.currentLevel;
        }
        
        return from(this.supabase.updateUser(userId, updates));
      }),
      tap(() => {
        this.localStorage.addExperience(experience);
      })
    );
  }

  // ==================== UTILIDADES ====================

  private getCurrentAdminId(): string {
    const profile = this.localStorage.getUserProfile();
    return profile?.admin_id || '';
  }

  getCurrentStats(): UserStats | null {
    return this.userStatsSubject.value;
  }

  getCurrentAchievements(): UserAchievement[] {
    return this.achievementsSubject.value;
  }

  getCurrentGameHistory(): GameHistory[] {
    return this.gameHistorySubject.value;
  }

  // ==================== RANKING ====================

  getUserRank(userId: string): Observable<{ position: number, total: number, percentile: number }> {
    const adminId = this.getCurrentAdminId();
    
    return from(this.supabase.getRankingByAdmin(adminId, 1000)).pipe(
      map(response => {
        const rankings = response.data || [];
        const userRankIndex = rankings.findIndex(r => r.user_id === userId);
        
        return {
          position: userRankIndex + 1,
          total: rankings.length,
          percentile: rankings.length > 0 ? Math.round(((rankings.length - userRankIndex) / rankings.length) * 100) : 0
        };
      })
    );
  }

  // ==================== EXPORTAR DATOS ====================

  exportUserData(): Observable<string> {
    const userData = {
      profile: this.localStorage.getUserProfile(),
      stats: this.getCurrentStats(),
      achievements: this.getCurrentAchievements(),
      gameHistory: this.getCurrentGameHistory(),
      settings: this.localStorage.getGameSettings(),
      progress: this.localStorage.getGameProgress(),
      exportDate: new Date().toISOString()
    };
    
    return new BehaviorSubject(JSON.stringify(userData, null, 2)).asObservable();
  }
}