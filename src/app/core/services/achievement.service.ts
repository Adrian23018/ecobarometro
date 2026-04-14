import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Observable, from, map, catchError, of } from 'rxjs';
import { 
  Achievement, 
  UserAchievement, 
  CreateAchievementRequest, 
  AchievementProgress 
} from '../models/achievement';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AchievementService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // ==================== OBTENER PROGRESO DE ACHIEVEMENTS DESDE BD ====================

  getAchievementProgress(userId: string): Observable<AchievementProgress[]> {
    return from(this.loadAchievementProgressFromDB(userId)).pipe(
      catchError(error => {
        console.error('Error loading achievement progress from DB:', error);
        // Si falla la BD, devolver datos por defecto desde el servicio
        return of(this.getDefaultAchievementProgress());
      })
    );
  }

  private async loadAchievementProgressFromDB(userId: string): Promise<AchievementProgress[]> {
    try {
      // Opción 1: Usar la función de PostgreSQL que ya calcula el progreso
      const { data: progressData, error: functionError } = await this.supabase
        .rpc('get_user_achievement_progress', { p_user_id: userId });

      if (!functionError && progressData && progressData.length > 0) {
        return this.mapProgressDataToAchievementProgress(progressData);
      }

      // Opción 2: Si la función falla, usar la vista achievement_progress
      const { data: viewData, error: viewError } = await this.supabase
        .from('achievement_progress')
        .select('*')
        .or(`user_id.eq.${userId},user_id.is.null`);

      if (!viewError && viewData && viewData.length > 0) {
        return this.mapViewDataToAchievementProgress(viewData, userId);
      }

      // Opción 3: Si todo falla, consultar directamente las tablas
      return await this.loadProgressDirectly(userId);

    } catch (error) {
      console.error('Error in loadAchievementProgressFromDB:', error);
      throw error;
    }
  }

  private mapProgressDataToAchievementProgress(progressData: any[]): AchievementProgress[] {
    return progressData.map(item => ({
      achievement: {
        id: item.achievement_id,
        name: item.name,
        description: item.description,
        icon: item.icon || 'pi pi-trophy',
        badge_color: item.badge_color || '#22c55e',
        achievement_type: item.achievement_type,
        points_required: item.points_required
      },
      current_progress: item.current_progress || 0,
      completion_percentage: item.completion_percentage || 0,
      is_completed: item.is_completed || false
    }));
  }

  private mapViewDataToAchievementProgress(viewData: any[], userId: string): AchievementProgress[] {
    return viewData.map(item => {
      const isUserAchievement = item.user_id === userId;
      return {
        achievement: {
          id: item.achievement_id,
          name: item.name,
          description: item.description,
          icon: item.icon || 'pi pi-trophy',
          badge_color: item.badge_color || '#22c55e',
          achievement_type: item.achievement_type,
          points_required: item.points_required
        },
        current_progress: isUserAchievement ? item.current_progress : 0,
        completion_percentage: isUserAchievement ? item.completion_percentage : 0,
        is_completed: isUserAchievement ? item.is_completed : false
      };
    });
  }

  private async loadProgressDirectly(userId: string): Promise<AchievementProgress[]> {
    // Obtener el admin_id del usuario
    const { data: user, error: userError } = await this.supabase
      .from('users')
      .select('admin_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error('Usuario no encontrado');
    }

    // Obtener todos los achievements del admin
    const { data: achievements, error: achievementsError } = await this.supabase
      .from('achievements')
      .select('*')
      .eq('admin_id', user.admin_id)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (achievementsError) {
      throw achievementsError;
    }

    if (!achievements || achievements.length === 0) {
      return this.getDefaultAchievementProgress();
    }

    // Obtener achievements ya obtenidos por el usuario
    const { data: userAchievements } = await this.supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    const earnedIds = userAchievements?.map(ua => ua.achievement_id) || [];

    // Obtener estadísticas del usuario para calcular progreso actual
    const userStats = await this.getUserStatsForProgress(userId);

    return achievements.map(achievement => {
      const isCompleted = earnedIds.includes(achievement.id);
      const currentProgress = isCompleted ? 
        achievement.points_required : 
        this.calculateCurrentProgress(achievement.achievement_type, achievement.points_required, userStats);

      const completionPercentage = Math.min(
        (currentProgress / achievement.points_required) * 100, 
        100
      );

      return {
        achievement: {
          id: achievement.id,
          admin_id: achievement.admin_id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon || 'pi pi-trophy',
          badge_color: achievement.badge_color || '#22c55e',
          achievement_type: achievement.achievement_type,
          points_required: achievement.points_required,
          is_active: achievement.is_active,
          created_at: achievement.created_at
        },
        current_progress: currentProgress,
        is_completed: isCompleted,
        completion_percentage: Math.round(completionPercentage)
      };
    });
  }

  // ==================== USER ACHIEVEMENTS DESDE BD ====================

  getUserAchievements(userId: string): Observable<UserAchievement[]> {
    return from(
      this.supabase
        .from('user_achievements')
        .select(`
          id,
          user_id,
          achievement_id,
          earned_at,
          achievements (
            id,
            name,
            description,
            icon,
            badge_color,
            achievement_type,
            points_required,
            admin_id,
            is_active,
            created_at
          )
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        
        if (!response.data || response.data.length === 0) {
          return this.getDefaultRecentAchievements();
        }

        return response.data.map((ua: any) => ({
          id: ua.id,
          user_id: ua.user_id,
          achievement_id: ua.achievement_id,
          earned_at: ua.earned_at,
          achievement: ua.achievements
        }));
      }),
      catchError(error => {
        console.error('Error loading user achievements:', error);
        return of(this.getDefaultRecentAchievements());
      })
    );
  }

  // ==================== VERIFICAR Y DESBLOQUEAR ACHIEVEMENTS ====================

  checkAndUnlockAchievements(userId: string): Observable<Achievement[]> {
    return from(this.checkAchievementsInDB(userId)).pipe(
      catchError(error => {
        console.error('Error checking achievements:', error);
        return of([]);
      })
    );
  }

  private async checkAchievementsInDB(userId: string): Promise<Achievement[]> {
    try {
      // Obtener estadísticas actuales del usuario
      const userStats = await this.getUserStatsForProgress(userId);
      
      // Obtener el admin_id del usuario
      const { data: user } = await this.supabase
        .from('users')
        .select('admin_id')
        .eq('id', userId)
        .single();

      if (!user) return [];

      // Obtener achievements disponibles que no ha obtenido
      const { data: availableAchievements } = await this.supabase
        .from('achievements')
        .select('*')
        .eq('admin_id', user.admin_id)
        .eq('is_active', true)
        .not('id', 'in', `(
          SELECT achievement_id 
          FROM user_achievements 
          WHERE user_id = '${userId}'
        )`);

      if (!availableAchievements) return [];

      const newAchievements: Achievement[] = [];
      
      for (const achievement of availableAchievements) {
        let unlocked = false;
        
        switch (achievement.achievement_type) {
          case 'points':
            unlocked = userStats.total_points >= achievement.points_required;
            break;
          case 'games':
            unlocked = userStats.games_played >= achievement.points_required;
            break;
          case 'streak':
            unlocked = userStats.streak >= achievement.points_required;
            break;
          case 'category':
            unlocked = userStats.categories_completed >= achievement.points_required;
            break;
        }
        
        if (unlocked) {
          // Insertar en user_achievements
          const { error: insertError } = await this.supabase
            .from('user_achievements')
            .insert({
              user_id: userId,
              achievement_id: achievement.id
            });
          
          if (!insertError) {
            newAchievements.push(achievement);
          }
        }
      }
      
      return newAchievements;
    } catch (error) {
      console.error('Error checking achievements in DB:', error);
      return [];
    }
  }

  // ==================== ESTADÍSTICAS DE USUARIO ====================

  private async getUserStatsForProgress(userId: string): Promise<any> {
    try {
      // Obtener datos básicos del usuario
      const { data: user } = await this.supabase
        .from('users')
        .select('total_points, games_played')
        .eq('id', userId)
        .single();
      
      // Obtener sesiones completadas para calcular racha
      const { data: sessions } = await this.supabase
        .from('game_sessions')
        .select('completion_percentage, completed_at')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      // Obtener respuestas para calcular categorías completadas
      const { data: responses } = await this.supabase
        .from('user_responses')
        .select('is_correct, questions(category_id)')
        .eq('user_id', userId);

      // Calcular racha actual
      const streak = this.calculateStreakFromSessions(sessions || []);
      
      // Calcular categorías dominadas (con alto porcentaje de aciertos)
      const categoriesCompleted = this.calculateCompletedCategories(responses || []);

      return {
        total_points: user?.total_points || 0,
        games_played: user?.games_played || 0,
        streak,
        categories_completed: categoriesCompleted
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return { 
        total_points: 0, 
        games_played: 0, 
        streak: 0, 
        categories_completed: 0 
      };
    }
  }

  private calculateCurrentProgress(achievementType: string, pointsRequired: number, userStats: any): number {
    switch (achievementType) {
      case 'points':
        return Math.min(userStats.total_points, pointsRequired);
      case 'games':
        return Math.min(userStats.games_played, pointsRequired);
      case 'streak':
        return Math.min(userStats.streak || 0, pointsRequired);
      case 'category':
        return Math.min(userStats.categories_completed || 0, pointsRequired);
      default:
        return 0;
    }
  }

  private calculateStreakFromSessions(sessions: any[]): number {
    if (!sessions || sessions.length === 0) return 0;
    
    const goodSessions = sessions.filter(s => s.completion_percentage >= 80);
    let streak = 0;
    let currentDate = new Date();
    
    for (const session of goodSessions) {
      const sessionDate = new Date(session.completed_at);
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

  private calculateCompletedCategories(responses: any[]): number {
    const categoryStats = new Map();
    
    responses.forEach(response => {
      const categoryId = response.questions?.category_id;
      if (!categoryId) return;
      
      if (!categoryStats.has(categoryId)) {
        categoryStats.set(categoryId, { total: 0, correct: 0 });
      }
      
      const stats = categoryStats.get(categoryId);
      stats.total++;
      if (response.is_correct) stats.correct++;
    });
    
    // Contar categorías con más del 80% de aciertos y al menos 5 respuestas
    let completedCategories = 0;
    categoryStats.forEach(stats => {
      if (stats.total >= 5 && (stats.correct / stats.total) >= 0.8) {
        completedCategories++;
      }
    });
    
    return completedCategories;
  }

  // ==================== CRUD ACHIEVEMENTS (ADMIN) ====================

  createAchievement(adminId: string, achievementData: CreateAchievementRequest): Observable<Achievement> {
    return from(
      this.supabase
        .from('achievements')
        .insert([{ 
          ...achievementData, 
          admin_id: adminId,
          icon: achievementData.icon || 'pi pi-trophy',
          badge_color: achievementData.badge_color || '#22c55e'
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

  getAchievementsByAdmin(adminId: string): Observable<Achievement[]> {
    return from(
      this.supabase
        .from('achievements')
        .select('*')
        .eq('admin_id', adminId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data || [];
      })
    );
  }

  updateAchievement(id: string, updates: Partial<Achievement>): Observable<Achievement> {
    return from(
      this.supabase
        .from('achievements')
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

  deleteAchievement(id: string): Observable<void> {
    return from(
      this.supabase
        .from('achievements')
        .update({ is_active: false })
        .eq('id', id)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return;
      })
    );
  }

  // ==================== DATOS POR DEFECTO (SOLO COMO FALLBACK) ====================

  private getDefaultAchievementProgress(): AchievementProgress[] {
    return [
      {
        achievement: {
          id: 'default-1',
          name: 'Eco Novato',
          description: 'Gana tus primeros 100 puntos',
          icon: 'pi pi-leaf',
          badge_color: '#10b981',
          achievement_type: 'points',
          points_required: 100
        },
        current_progress: 75,
        completion_percentage: 75,
        is_completed: false
      },
      {
        achievement: {
          id: 'default-2',
          name: 'Primera Partida',
          description: 'Completa tu primera partida',
          icon: 'pi pi-play',
          badge_color: '#3b82f6',
          achievement_type: 'games',
          points_required: 1
        },
        current_progress: 1,
        completion_percentage: 100,
        is_completed: true
      }
    ];
  }

  private getDefaultRecentAchievements(): UserAchievement[] {
    return [
      {
        id: 'recent-1',
        user_id: 'default-user',
        achievement_id: 'default-2',
        earned_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        achievement: {
          id: 'default-2',
          name: 'Primera Partida',
          description: 'Completa tu primera partida',
          icon: 'pi pi-play',
          badge_color: '#3b82f6',
          achievement_type: 'games',
          points_required: 1
        }
      }
    ];
  }
}