import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Observable, from, map } from 'rxjs';
import { 
  Ranking, 
  LeaderboardEntry, 
  CategoryRanking, 
  GlobalRanking,
  UserRankingStats,
  CategoryPosition,
  RankingFilters,
  RankingUpdate
} from '../models/ranking';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RankingService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // Global Rankings
  getGlobalRanking(adminId: string, filters?: RankingFilters): Observable<GlobalRanking> {
    return from(this.buildGlobalRanking(adminId, filters));
  }

  private async buildGlobalRanking(adminId: string, filters?: RankingFilters): Promise<GlobalRanking> {
    console.log('🔍 buildGlobalRanking - AdminID:', adminId, 'Filters:', filters);

    // Obtener ranking general
    const overallRankings = await this.getOverallLeaderboard(adminId, filters);
    console.log('📊 Overall Rankings obtenidos:', overallRankings.length, 'usuarios');

    // Obtener rankings por categoría
    const categoryRankings = await this.getCategoryRankings(adminId, filters);
    console.log('📂 Category Rankings obtenidos:', categoryRankings.length, 'categorías');

    // Obtener estadísticas del usuario (si se especifica en los filtros)
    let userStats: UserRankingStats = {
      overall_position: 0,
      total_participants: overallRankings.length,
      points_to_next_rank: 0,
      category_positions: [],
      recent_improvement: 0
    };

    return {
      overall_rankings: overallRankings,
      category_rankings: categoryRankings,
      user_stats: userStats
    };
  }

  private async getOverallLeaderboard(adminId: string, filters?: RankingFilters): Promise<LeaderboardEntry[]> {
    console.log('👥 getOverallLeaderboard - AdminID:', adminId);

    let query = this.supabase
      .from('users')
      .select(`
        id,
        username,
        full_name,
        avatar_url,
        total_points,
        games_played,
        level,
        created_at
      `)
      .eq('admin_id', adminId)
      .eq('is_active', true)
      .order('total_points', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    } else {
      query = query.limit(100); // Límite por defecto
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1);
    }

    const { data: users, error } = await query;

    console.log('👤 Usuarios obtenidos:', users?.length || 0);
    if (error) {
      console.error('❌ Error obteniendo usuarios:', error);
      return [];
    }

    if (!users || users.length === 0) {
      console.warn('⚠️ No se encontraron usuarios activos para el admin:', adminId);
      return [];
    }

    const leaderboard: LeaderboardEntry[] = [];

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`  Processing user ${i + 1}/${users.length}: ${user.username}`);
      
      // Calcular promedio de puntuación
      const { data: sessions } = await this.supabase
        .from('game_sessions')
        .select('completion_percentage')
        .eq('user_id', user.id)
        .eq('status', 'completed');

      const avgScore = sessions && sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.completion_percentage, 0) / sessions.length
        : 0;

      // Contar logros
      const { count: achievementsCount } = await this.supabase
        .from('user_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      leaderboard.push({
        user_id: user.id,
        username: user.username,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        total_points: user.total_points,
        rank_position: i + 1 + (filters?.offset || 0),
        games_played: user.games_played,
        avg_score: Math.round(avgScore),
        level: user.level,
        achievements_count: achievementsCount || 0
      });
    }

    return leaderboard;
  }

  private async getCategoryRankings(adminId: string, filters?: RankingFilters): Promise<CategoryRanking[]> {
    // Obtener categorías
    const { data: categories } = await this.supabase
      .from('categories')
      .select('*')
      .eq('admin_id', adminId)
      .eq('is_active', true)
      .order('order_index');

    if (!categories) return [];

    const categoryRankings: CategoryRanking[] = [];

    for (const category of categories) {
      if (filters?.category_id && category.id !== filters.category_id) continue;

      const { data: rankings } = await this.supabase
        .from('rankings')
        .select(`
          *,
          user:users(
            username,
            full_name,
            avatar_url,
            games_played,
            level
          )
        `)
        .eq('admin_id', adminId)
        .eq('category_id', category.id)
        .order('points', { ascending: false })
        .limit(filters?.limit || 50);

      if (!rankings) continue;

      const entries: LeaderboardEntry[] = rankings.map((ranking, index) => ({
        user_id: ranking.user_id,
        username: ranking.user?.username || '',
        full_name: ranking.user?.full_name || '',
        avatar_url: ranking.user?.avatar_url,
        total_points: ranking.points,
        rank_position: index + 1,
        games_played: ranking.user?.games_played || 0,
        avg_score: ranking.percentage_score,
        level: ranking.user?.level || 1,
        achievements_count: 0 // Se puede calcular si es necesario
      }));

      categoryRankings.push({
        category,
        rankings: entries,
        total_participants: entries.length
      });
    }

    return categoryRankings;
  }

  // User-specific rankings
  getUserRankingStats(userId: string): Observable<UserRankingStats> {
    return from(this.calculateUserStats(userId));
  }

  private async calculateUserStats(userId: string): Promise<UserRankingStats> {
    // Obtener usuario y admin
    const { data: user } = await this.supabase
      .from('users')
      .select('admin_id, total_points')
      .eq('id', userId)
      .single();

    if (!user) throw new Error('Usuario no encontrado');

    // Posición general
    const { count: betterUsers } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('admin_id', user.admin_id)
      .gt('total_points', user.total_points);

    const overallPosition = (betterUsers || 0) + 1;

    // Total de participantes
    const { count: totalParticipants } = await this.supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('admin_id', user.admin_id)
      .eq('is_active', true);

    // Puntos para siguiente posición
    const { data: nextUser } = await this.supabase
      .from('users')
      .select('total_points')
      .eq('admin_id', user.admin_id)
      .gt('total_points', user.total_points)
      .order('total_points', { ascending: true })
      .limit(1)
      .maybeSingle();

    const pointsToNextRank = nextUser ? nextUser.total_points - user.total_points : 0;

    // Posiciones por categoría
    const categoryPositions = await this.getUserCategoryPositions(userId, user.admin_id);

    // Mejora reciente (comparar últimos 7 días)
    const recentImprovement = await this.calculateRecentImprovement(userId);

    return {
      overall_position: overallPosition,
      total_participants: totalParticipants || 0,
      points_to_next_rank: pointsToNextRank,
      category_positions: categoryPositions,
      recent_improvement: recentImprovement
    };
  }

  private async getUserCategoryPositions(userId: string, adminId: string): Promise<CategoryPosition[]> {
    const { data: userRankings } = await this.supabase
      .from('rankings')
      .select(`
        *,
        category:categories(*)
      `)
      .eq('user_id', userId)
      .eq('admin_id', adminId);

    if (!userRankings) return [];

    const positions: CategoryPosition[] = [];

    for (const ranking of userRankings) {
      // Contar usuarios con mejores puntuaciones en esta categoría
      const { count: betterUsers } = await this.supabase
        .from('rankings')
        .select('*', { count: 'exact', head: true })
        .eq('admin_id', adminId)
        .eq('category_id', ranking.category_id)
        .gt('points', ranking.points);

      const position = (betterUsers || 0) + 1;

      // Contar total de participantes en esta categoría
      const { count: totalInCategory } = await this.supabase
        .from('rankings')
        .select('*', { count: 'exact', head: true })
        .eq('admin_id', adminId)
        .eq('category_id', ranking.category_id);

      positions.push({
        category: ranking.category,
        position: position,
        total_participants: totalInCategory || 0,
        points: ranking.points,
        percentage_score: ranking.percentage_score
      });
    }

    return positions;
  }

  private async calculateRecentImprovement(userId: string): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Puntos ganados en los últimos 7 días
    const { data: recentSessions } = await this.supabase
      .from('game_sessions')
      .select('total_points')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', sevenDaysAgo.toISOString());

    const recentPoints = recentSessions?.reduce((sum, s) => sum + s.total_points, 0) || 0;

    // Puntos ganados en la semana anterior (días 8-14)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { data: previousSessions } = await this.supabase
      .from('game_sessions')
      .select('total_points')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', fourteenDaysAgo.toISOString())
      .lt('completed_at', sevenDaysAgo.toISOString());

    const previousPoints = previousSessions?.reduce((sum, s) => sum + s.total_points, 0) || 0;

    // Calcular porcentaje de mejora
    if (previousPoints === 0) return recentPoints > 0 ? 100 : 0;
    
    return Math.round(((recentPoints - previousPoints) / previousPoints) * 100);
  }

  // Category-specific rankings
  getCategoryLeaderboard(categoryId: string, limit: number = 50): Observable<LeaderboardEntry[]> {
    return from(
      this.supabase
        .from('rankings')
        .select(`
          *,
          user:users(
            username,
            full_name,
            avatar_url,
            games_played,
            level
          ),
          category:categories(admin_id)
        `)
        .eq('category_id', categoryId)
        .order('points', { ascending: false })
        .limit(limit)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return (response.data || []).map((ranking, index) => ({
          user_id: ranking.user_id,
          username: ranking.user?.username || '',
          full_name: ranking.user?.full_name || '',
          avatar_url: ranking.user?.avatar_url,
          total_points: ranking.points,
          rank_position: index + 1,
          games_played: ranking.user?.games_played || 0,
          avg_score: ranking.percentage_score,
          level: ranking.user?.level || 1,
          achievements_count: 0
        }));
      })
    );
  }

  // Updates and maintenance
  updateUserRanking(userId: string): Observable<RankingUpdate[]> {
    return from(this.recalculateUserRanking(userId));
  }

  private async recalculateUserRanking(userId: string): Promise<RankingUpdate[]> {
    // Esta función se ejecuta automáticamente con triggers en la base de datos
    // Pero se puede usar para forzar una actualización manual
    
    const updates: RankingUpdate[] = [];
    
    // Obtener admin del usuario
    const { data: user } = await this.supabase
      .from('users')
      .select('admin_id,total_points')
      .eq('id', userId)
      .single();

    if (!user) return updates;

    // Actualizar ranking general
    const { data: currentRank } = await this.supabase
      .from('users')
      .select('total_points')
      .eq('admin_id', user.admin_id)
      .order('total_points', { ascending: false });

    const newOverallPosition = (currentRank?.findIndex((u:any) => u.total_points <= user.total_points) || 0) + 1;

    // Aquí se pueden agregar más actualizaciones específicas por categoría
    
    return updates;
  }

  // Competition features
  getTopPerformers(adminId: string, timeframe: 'day' | 'week' | 'month' = 'week'): Observable<LeaderboardEntry[]> {
    return from(this.getTopPerformersInTimeframe(adminId, timeframe));
  }

  private async getTopPerformersInTimeframe(adminId: string, timeframe: string): Promise<LeaderboardEntry[]> {
    const now = new Date();
    let startDate = new Date();

    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    // Obtener puntos ganados en el período
    const { data: sessionPoints } = await this.supabase
      .from('game_sessions')
      .select(`
        user_id,
        total_points,
        user:users(
          username,
          full_name,
          avatar_url,
          level
        )
      `)
      .eq('admin_id', adminId)
      .eq('status', 'completed')
      .gte('completed_at', startDate.toISOString());

    if (!sessionPoints) return [];

    // Agrupar por usuario y sumar puntos
    const userPointsMap = new Map();
    
    sessionPoints.forEach(session => {
      const current = userPointsMap.get(session.user_id) || { points: 0, user: session.user };
      userPointsMap.set(session.user_id, {
        points: current.points + session.total_points,
        user: session.user
      });
    });

    // Convertir a array y ordenar
    const topPerformers = Array.from(userPointsMap.entries())
      .map(([userId, data]) => ({
        user_id: userId,
        username: data.user?.username || '',
        full_name: data.user?.full_name || '',
        avatar_url: data.user?.avatar_url,
        total_points: data.points,
        rank_position: 0, // Se asignará después del ordenamiento
        games_played: 0,
        avg_score: 0,
        level: data.user?.level || 1,
        achievements_count: 0
      }))
      .sort((a, b) => b.total_points - a.total_points)
      .slice(0, 10) // Top 10
      .map((entry, index) => ({
        ...entry,
        rank_position: index + 1
      }));

    return topPerformers;
  }
}