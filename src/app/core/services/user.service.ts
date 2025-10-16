// src/app/core/services/user.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, BehaviorSubject, combineLatest, of, throwError } from 'rxjs';
import { map, switchMap, tap, catchError } from 'rxjs/operators';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { User } from '../models/user';

// Re-export User interface for components

// Interfaces para el UserService
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

export interface UpdateUserRequest {
  full_name?: string;
  username?: string;
  email?: string;
  bio?: string;
  avatar_url?: string;
}


@Injectable({
  providedIn: 'root'
})
export class UserService {
  private supabase: SupabaseClient;
  private userStatsSubject = new BehaviorSubject<UserStats | null>(null);
  private achievementsSubject = new BehaviorSubject<UserAchievement[]>([]);
  private gameHistorySubject = new BehaviorSubject<GameHistory[]>([]);

  public userStats$ = this.userStatsSubject.asObservable();
  public achievements$ = this.achievementsSubject.asObservable();
  public gameHistory$ = this.gameHistorySubject.asObservable();

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // ==================== GESTIÓN DE USUARIO ====================

  /**
   * Actualizar datos del usuario
   */
  updateUser(userId: string, updateData: UpdateUserRequest): Observable<User> {
    return from(this.performUserUpdate(userId, updateData)).pipe(
      tap(updatedUser => {
        // Actualizar localStorage
        this.updateLocalStorageUser(updatedUser);
      }),
      catchError(error => {
        console.error('Error updating user:', error);
        return throwError(() => new Error('Error al actualizar el usuario'));
      })
    );
  }

  private async performUserUpdate(userId: string, updateData: UpdateUserRequest): Promise<User> {
    // Validar username único si se está actualizando
    if (updateData.username) {
      const { data: existingUser } = await this.supabase
        .from('users')
        .select('id')
        .eq('username', updateData.username)
        .neq('id', userId)
        .single();

      if (existingUser) {
        throw new Error('El nombre de usuario ya está en uso');
      }
    }

    // Validar email único si se está actualizando
    if (updateData.email) {
      const { data: existingUser } = await this.supabase
        .from('users')
        .select('id')
        .eq('email', updateData.email)
        .neq('id', userId)
        .single();

      if (existingUser) {
        throw new Error('El email ya está en uso');
      }
    }

    // Actualizar usuario
    const { data: updatedUser, error } = await this.supabase
      .from('users')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return updatedUser;
  }

  /**
   * Obtener usuario por ID
   */
  getUserById(userId: string): Observable<User> {
    return from(this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    ).pipe(
      map(response => {
        if (response.error) throw new Error(response.error.message);
        return response.data;
      })
    );
  }

  /**
   * Cambiar contraseña del usuario
   */
  changePassword(userId: string, currentPassword: string, newPassword: string): Observable<boolean> {
    return from(this.performPasswordChange(userId, currentPassword, newPassword));
  }

  private async performPasswordChange(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // En un caso real, aquí validarías la contraseña actual
      // Por ahora simularemos la validación
      
      // Hash de la nueva contraseña (simplificado)
      const hashedPassword = btoa(newPassword + 'salt');

      const { error } = await this.supabase
        .from('users')
        .update({ 
          password_hash: hashedPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw new Error(error.message);
      
      return true;
    } catch (error) {
      throw new Error('Error al cambiar la contraseña');
    }
  }

  /**
   * Subir avatar del usuario
   */
  uploadAvatar(userId: string, file: File): Observable<string> {
    return from(this.performAvatarUpload(userId, file));
  }

  private async performAvatarUpload(userId: string, file: File): Promise<string> {
    try {
      // Subir archivo a Supabase Storage
      const fileName = `${userId}-${Date.now()}.${file.name.split('.').pop()}`;
      const filePath = `avatars/${fileName}`;

      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from('user-avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data: urlData } = this.supabase.storage
        .from('user-avatars')
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;

      // Actualizar usuario con nueva URL
      await this.updateUser(userId, { avatar_url: avatarUrl }).toPromise();

      return avatarUrl;
    } catch (error: any) {
      throw new Error('Error al subir el avatar: ' + error.message);
    }
  }

  // ==================== ESTADÍSTICAS DE USUARIO ====================

  loadUserStats(userId: string): Observable<UserStats> {
    return from(this.calculateUserStats(userId)).pipe(
      tap(stats => {
        this.userStatsSubject.next(stats);
        // Actualizar datos locales
        this.updateLocalStorageProgress({
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
        this.supabase.from('users').select('*').eq('id', userId).single(),
        this.supabase.from('game_sessions').select('*').eq('user_id', userId),
        this.supabase.from('user_responses').select('*, questions(category_id)').eq('user_id', userId),
        this.supabase.from('rankings').select('*').eq('user_id', userId)
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
        responses.filter(r => r.is_correct && r.questions?.category_id).map(r => r.questions.category_id)
      ).size;

      // Calcular ranking
      const userRanking = rankings.find(r => r.category_id === null); // Ranking general
      const rank = userRanking?.rank_position || 0;

      // Contar logros
      const achievementsResponse = await this.supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId);
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
    return from(this.loadAchievementsData(userId)).pipe(
      tap(achievements => {
        this.achievementsSubject.next(achievements);
        // Guardar en caché local
        this.setAchievementsCache(achievements);
      })
    );
  }

  private async loadAchievementsData(userId: string): Promise<UserAchievement[]> {
    try {
      const adminId = this.getCurrentAdminId();

      const [userAchievementsResponse, allAchievementsResponse] = await Promise.all([
        this.supabase
          .from('user_achievements')
          .select('*, achievements(*)')
          .eq('user_id', userId),
        this.supabase
          .from('achievements')
          .select('*')
          .eq('admin_id', adminId)
      ]);

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
    } catch (error) {
      console.error('Error loading achievements:', error);
      return [];
    }
  }

  // ==================== HISTORIAL DE JUEGOS ====================

  loadGameHistory(userId: string, limit: number = 20): Observable<GameHistory[]> {
    return from(this.buildGameHistory(userId, limit)).pipe(
      tap(history => this.gameHistorySubject.next(history))
    );
  }

  private async buildGameHistory(userId: string, limit: number): Promise<GameHistory[]> {
    try {
      const { data: sessions } = await this.supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (!sessions) return [];

      // Obtener detalles de cada sesión
      return await Promise.all(
        sessions.map(session => this.buildGameHistoryItem(session))
      );
    } catch (error) {
      console.error('Error loading game history:', error);
      return [];
    }
  }

  private async buildGameHistoryItem(session: any): Promise<GameHistory> {
    try {
      // Obtener respuestas de la sesión
      const { data: responses } = await this.supabase
        .from('user_responses')
        .select('*, questions(category_id, categories(name))')
        .eq('game_session_id', session.id);
      
      // Agrupar por categoría
      const categoryBreakdown = this.groupResponsesByCategory(responses || []);
      
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
      const categoryId = response.questions?.category_id;
      const categoryName = response.questions?.categories?.name;
      
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

  // ==================== PROGRESO Y NIVELES ====================

  calculateLevelProgress(experiencePoints: number): { currentLevel: number, nextLevel: number, progress: number, pointsNeeded: number } {
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
    return from(this.supabase
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
        
        return this.updateUser(userId, updates);
      }),
      tap(() => {
        this.addExperienceToLocalStorage(experience);
      })
    );
  }

  // ==================== MÉTODOS DE LOCALSTORAGE ====================

  private updateLocalStorageUser(user: User): void {
    localStorage.setItem('ecobarometro_user', JSON.stringify(user));
  }

  private updateLocalStorageProgress(progress: any): void {
    localStorage.setItem('ecobarometro_progress', JSON.stringify(progress));
  }

  private setAchievementsCache(achievements: UserAchievement[]): void {
    localStorage.setItem('ecobarometro_achievements', JSON.stringify(achievements));
  }

  private addExperienceToLocalStorage(experience: number): void {
    const stored = localStorage.getItem('ecobarometro_progress');
    if (stored) {
      const progress = JSON.parse(stored);
      progress.totalExperience = (progress.totalExperience || 0) + experience;
      localStorage.setItem('ecobarometro_progress', JSON.stringify(progress));
    }
  }

  private getCurrentAdminId(): string {
    const userData = localStorage.getItem('ecobarometro_user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.admin_id || '';
    }
    return '';
  }

  getUserProfile(): User | null {
    const userData = localStorage.getItem('ecobarometro_user');
    return userData ? JSON.parse(userData) : null;
  }

  getGameSettings(): Observable<any> {
    const settings = localStorage.getItem('ecobarometro_settings');
    return of(settings ? JSON.parse(settings) : {
      soundEnabled: true,
      animationsEnabled: true,
      theme: 'light',
      difficulty: 'medium'
    });
  }

  setGameSettings(settings: any): void {
    localStorage.setItem('ecobarometro_settings', JSON.stringify(settings));
  }

  // ==================== MÉTODOS ADICIONALES ====================

  getCurrentStats(): UserStats | null {
    return this.userStatsSubject.value;
  }

  getCurrentAchievements(): UserAchievement[] {
    return this.achievementsSubject.value;
  }

  getCurrentGameHistory(): GameHistory[] {
    return this.gameHistorySubject.value;
  }

  /**
   * Exportar datos del usuario
   */
  exportUserData(): Observable<string> {
    const userData = {
      profile: this.getUserProfile(),
      stats: this.getCurrentStats(),
      achievements: this.getCurrentAchievements(),
      gameHistory: this.getCurrentGameHistory(),
      settings: JSON.parse(localStorage.getItem('ecobarometro_settings') || '{}'),
      progress: JSON.parse(localStorage.getItem('ecobarometro_progress') || '{}'),
      exportDate: new Date().toISOString()
    };
    
    return of(JSON.stringify(userData, null, 2));
  }

  /**
   * Verificar disponibilidad de username
   */
  checkUsernameAvailability(username: string, currentUserId?: string): Observable<boolean> {
    let query = this.supabase
      .from('users')
      .select('id')
      .eq('username', username);

    if (currentUserId) {
      query = query.neq('id', currentUserId);
    }

    return from(query.single()).pipe(
      map(response => !!response.error) // Si hay error, el username está disponible
    );
  }

  /**
   * Verificar disponibilidad de email
   */
  checkEmailAvailability(email: string, currentUserId?: string): Observable<boolean> {
    let query = this.supabase
      .from('users')
      .select('id')
      .eq('email', email);

    if (currentUserId) {
      query = query.neq('id', currentUserId);
    }

    return from(query.single()).pipe(
      map(response => !!response.error) // Si hay error, el email está disponible
    );
  }

  /**
   * Eliminar cuenta de usuario
   */
  deleteUserAccount(userId: string): Observable<boolean> {
    return from(this.performAccountDeletion(userId));
  }

  private async performAccountDeletion(userId: string): Promise<boolean> {
    try {
      // En orden: eliminar respuestas, sesiones, logros, rankings y finalmente el usuario
      await Promise.all([
        this.supabase.from('user_responses').delete().eq('user_id', userId),
        this.supabase.from('game_sessions').delete().eq('user_id', userId),
        this.supabase.from('user_achievements').delete().eq('user_id', userId),
        this.supabase.from('rankings').delete().eq('user_id', userId)
      ]);

      const { error } = await this.supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      // Limpiar localStorage
      localStorage.clear();

      return true;
    } catch (error) {
      console.error('Error deleting account:', error);
      throw new Error('Error al eliminar la cuenta');
    }
  }

  // ==================== MÉTODOS PARA ADMIN ====================

  /**
   * Obtener usuarios por administrador
   */
  getUsersByAdmin(adminId: string): Observable<User[]> {
    return from(this.supabase
      .from('users')
      .select('*')
      .eq('admin_id', adminId)
      .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) {
          console.error('Error fetching users:', response.error);
          throw new Error(response.error.message);
        }
        return response.data || [];
      }),
      catchError(error => {
        console.error('Error in getUsersByAdmin:', error);
        return throwError(() => new Error('Error al cargar los usuarios'));
      })
    );
  }

  /**
   * Actualizar estado activo/inactivo del usuario
   */
  updateUserStatus(userId: string, isActive: boolean): Observable<User> {
    return from(this.supabase
      .from('users')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()
    ).pipe(
      map(response => {
        if (response.error) {
          throw new Error(response.error.message);
        }
        return response.data;
      }),
      catchError(error => {
        console.error('Error updating user status:', error);
        return throwError(() => new Error('Error al actualizar el estado del usuario'));
      })
    );
  }

  /**
   * Reiniciar progreso del usuario
   */
  resetUserProgress(userId: string): Observable<User> {
    return from(this.performProgressReset(userId));
  }

  private async performProgressReset(userId: string): Promise<User> {
    try {
      // Eliminar datos de progreso
      await Promise.all([
        this.supabase.from('user_responses').delete().eq('user_id', userId),
        this.supabase.from('game_sessions').delete().eq('user_id', userId),
        this.supabase.from('user_achievements').delete().eq('user_id', userId),
        this.supabase.from('rankings').delete().eq('user_id', userId)
      ]);

      // Resetear estadísticas del usuario
      const { data: updatedUser, error } = await this.supabase
        .from('users')
        .update({
          total_points: 0,
          level: 1,
          experience_points: 0,
          games_played: 0,
          last_game_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return updatedUser;
    } catch (error: any) {
      console.error('Error resetting user progress:', error);
      throw new Error('Error al reiniciar el progreso del usuario: ' + error.message);
    }
  }

  /**
   * Eliminar usuario (para admins)
   */
  deleteUser(userId: string): Observable<boolean> {
    return from(this.performUserDeletion(userId));
  }

  private async performUserDeletion(userId: string): Promise<boolean> {
    try {
      // Eliminar todos los datos relacionados
      await Promise.all([
        this.supabase.from('user_responses').delete().eq('user_id', userId),
        this.supabase.from('game_sessions').delete().eq('user_id', userId),
        this.supabase.from('user_achievements').delete().eq('user_id', userId),
        this.supabase.from('rankings').delete().eq('user_id', userId)
      ]);

      // Eliminar el usuario
      const { error } = await this.supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        throw new Error(error.message);
      }

      return true;
    } catch (error: any) {
      console.error('Error deleting user:', error);
      throw new Error('Error al eliminar el usuario: ' + error.message);
    }
  }
}