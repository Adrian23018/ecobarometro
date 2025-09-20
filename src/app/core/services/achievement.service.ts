import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Observable, from, map } from 'rxjs';
import { 
  Achievement, 
  UserAchievement, 
  CreateAchievementRequest, 
  AchievementProgress 
} from '../models/achievement';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class AchievementService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabase.url, environment.supabase.anonKey);
  }

  // CRUD Achievements (Admin)
  createAchievement(adminId: string, achievementData: CreateAchievementRequest): Observable<Achievement> {
    return from(
      this.supabase
        .from('achievements')
        .insert([{ ...achievementData, admin_id: adminId }])
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

  // User Achievements
  getUserAchievements(userId: string): Observable<UserAchievement[]> {
    return from(
      this.supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data || [];
      })
    );
  }

  checkAndUnlockAchievements(userId: string): Observable<Achievement[]> {
    return from(this.checkAchievements(userId));
  }

  private async checkAchievements(userId: string): Promise<Achievement[]> {
    // Obtener estadísticas del usuario
    const userStats = await this.getUserStats(userId);
    
    // Obtener logros disponibles para el admin del usuario
    const { data: user } = await this.supabase
      .from('users')
      .select('admin_id')
      .eq('id', userId)
      .single();

    if (!user) return [];

    const { data: achievements } = await this.supabase
      .from('achievements')
      .select('*')
      .eq('admin_id', user.admin_id)
      .eq('is_active', true);

    if (!achievements) return [];

    // Obtener logros ya obtenidos
    const { data: userAchievements } = await this.supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    const earnedAchievementIds = userAchievements?.map(ua => ua.achievement_id) || [];
    
    // Verificar qué logros se pueden desbloquear
    const newAchievements: Achievement[] = [];
    
    for (const achievement of achievements) {
      if (earnedAchievementIds.includes(achievement.id)) continue;
      
      let unlocked = false;
      
      switch (achievement.achievement_type) {
        case 'points':
          unlocked = userStats.total_points >= achievement.points_required;
          break;
        case 'games':
          unlocked = userStats.games_played >= achievement.points_required;
          break;
        case 'streak':
          // Implementar lógica de racha
          break;
        case 'category':
          // Implementar lógica de categoría
          break;
      }
      
      if (unlocked) {
        // Desbloquear logro
        await this.supabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievement.id
          });
        
        newAchievements.push(achievement);
      }
    }
    
    return newAchievements;
  }

  private async getUserStats(userId: string) {
    const { data: user } = await this.supabase
      .from('users')
      .select('total_points, games_played')
      .eq('id', userId)
      .single();
    
    return user || { total_points: 0, games_played: 0 };
  }

  getAchievementProgress(userId: string): Observable<AchievementProgress[]> {
    return from(this.calculateProgress(userId));
  }

  private async calculateProgress(userId: string): Promise<AchievementProgress[]> {
    const userStats = await this.getUserStats(userId);
    
    const { data: user } = await this.supabase
      .from('users')
      .select('admin_id')
      .eq('id', userId)
      .single();

    if (!user) return [];

    const { data: achievements } = await this.supabase
      .from('achievements')
      .select('*')
      .eq('admin_id', user.admin_id)
      .eq('is_active', true);

    if (!achievements) return [];

    const { data: userAchievements } = await this.supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    const earnedIds = userAchievements?.map(ua => ua.achievement_id) || [];

    return achievements.map(achievement => {
      const isCompleted = earnedIds.includes(achievement.id);
      let currentProgress = 0;
      
      if (!isCompleted) {
        switch (achievement.achievement_type) {
          case 'points':
            currentProgress = userStats.total_points;
            break;
          case 'games':
            currentProgress = userStats.games_played;
            break;
        }
      } else {
        currentProgress = achievement.points_required;
      }

      const completionPercentage = Math.min(
        (currentProgress / achievement.points_required) * 100, 
        100
      );

      return {
        achievement,
        current_progress: currentProgress,
        is_completed: isCompleted,
        completion_percentage: completionPercentage
      };
    });
  }
}