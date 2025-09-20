// src/app/core/services/ranking.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, BehaviorSubject, combineLatest, interval } from 'rxjs';
import { map, tap, switchMap, startWith } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { LocalStorageService } from './local-storage.service';

export interface RankingEntry {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  points: number;
  rank: number;
  level: number;
  gamesPlayed: number;
  accuracy: number;
  lastGameAt?: string;
  categoryId?: string;
  categoryName?: string;
  isCurrentUser?: boolean;
  trend?: 'up' | 'down' | 'same';
  positionChange?: number;
}

export interface LeaderboardData {
  global: RankingEntry[];
  byCategory: { [categoryId: string]: RankingEntry[] };
  userPosition: {
    global: number;
    byCategory: { [categoryId: string]: number };
  };
  totalParticipants: number;
  lastUpdated: string;
}

export interface RankingPeriod {
  type: 'daily' | 'weekly' | 'monthly' | 'all-time';
  startDate: Date;
  endDate: Date;
  label: string;
}

export interface TrophyData {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  criteria: {
    type: 'points' | 'games' | 'accuracy' | 'streak' | 'category';
    value: number;
    categoryId?: string;
  };
  winnerId?: string;
  winnerName?: string;
  winnerAvatar?: string;
  awardedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RankingService {

  private leaderboardSubject = new BehaviorSubject<LeaderboardData | null>(null);
  private trophiesSubject = new BehaviorSubject<TrophyData[]>([]);
  private userRankHistorySubject = new BehaviorSubject<any[]>([]);

  public leaderboard$ = this.leaderboardSubject.asObservable();
  public trophies$ = this.trophiesSubject.asObservable();
  public userRankHistory$ = this.userRankHistorySubject.asObservable();

  // Auto-refresh del ranking cada 30 segundos
  private autoRefresh$ = interval(30000).pipe(startWith(0));

  constructor(
    private supabase: SupabaseService,
    private localStorage: LocalStorageService
  ) {}

  // ==================== CARGA DE RANKINGS ====================

  loadLeaderboard(adminId: string, period?: RankingPeriod): Observable<LeaderboardData> {
    return combineLatest([
      this.loadGlobalRanking(adminId, period),
      this.loadCategoryRankings(adminId, period),
      this.loadUserPosition(adminId, this.getCurrentUserId())
    ]).pipe(
      map(([global, byCategory, userPosition]) => {
        const leaderboardData: LeaderboardData = {
          global,
          byCategory,
          userPosition,
          totalParticipants: global.length,
          lastUpdated: new Date().toISOString()
        };
        
        return leaderboardData;
      }),
      tap(data => {
        this.leaderboardSubject.next(data);
        this.cacheLeaderboard(data);
      })
    );
  }

  private loadGlobalRanking(adminId: string, period?: RankingPeriod, limit: number = 100): Observable<RankingEntry[]> {
    return from(this.supabase.getRankingByAdmin(adminId, limit)).pipe(
      map(response => {
        if (response.error) throw response.error;
        const rankings = response.data || [];
        
        return rankings.map((ranking, index) => this.mapToRankingEntry(ranking, index + 1));
      }),
      switchMap(rankings => {
        // Enriquecer con datos adicionales
        return this.enrichRankingData(rankings, period);
      })
    );
  }

  private loadCategoryRankings(adminId: string, period?: RankingPeriod): Observable<{ [categoryId: string]: RankingEntry[] }> {
    return from(this.supabase.getCategoriesByAdmin(adminId)).pipe(
      switchMap(response => {
        const categories = response.data || [];
        
        const categoryRankings = categories.map(category =>
          from(this.supabase.getRankingByCategory(adminId, category.id, 50)).pipe(
            map(rankingResponse => ({
              categoryId: category.id,
              rankings: (rankingResponse.data || []).map((ranking, index) => 
                this.mapToRankingEntry(ranking, index + 1, category.id, category.name)
              )
            }))
          )
        );
        
        return combineLatest(categoryRankings);
      }),
      map(categoryData => {
        const result: { [categoryId: string]: RankingEntry[] } = {};
        categoryData.forEach(data => {
          result[data.categoryId] = data.rankings;
        });
        return result;
      })
    );
  }

  private loadUserPosition(adminId: string, userId: string): Observable<{ global: number; byCategory: { [categoryId: string]: number } }> {
    return combineLatest([
      from(this.supabase.getRankingByAdmin(adminId, 1000)),
      from(this.supabase.getCategoriesByAdmin(adminId))
    ]).pipe(
      switchMap(([globalResponse, categoriesResponse]) => {
        const globalRankings = globalResponse.data || [];
        const categories = categoriesResponse.data || [];
        
        const globalPosition = globalRankings.findIndex(r => r.user_id === userId) + 1;
        
        const categoryPositions = categories.map(category =>
          from(this.supabase.getRankingByCategory(adminId, category.id, 1000)).pipe(
            map(categoryResponse => ({
              categoryId: category.id,
              position: (categoryResponse.data || []).findIndex(r => r.user_id === userId) + 1
            }))
          )
        );
        
        return combineLatest(categoryPositions).pipe(
          map(positions => {
            const byCategory: { [categoryId: string]: number } = {};
            positions.forEach(pos => {
              byCategory[pos.categoryId] = pos.position;
            });
            
            return { global: globalPosition, byCategory };
          })
        );
      })
    );
  }

  private mapToRankingEntry(ranking: any, rank: number, categoryId?: string, categoryName?: string): RankingEntry {
    const user = ranking.user || {};
    
    return {
      id: ranking.id,
      userId: ranking.user_id,
      username: user.username || 'Usuario',
      fullName: user.full_name || user.username || 'Usuario',
      avatarUrl: user.avatar_url,
      points: ranking.points || 0,
      rank,
      level: user.level || 1,
      gamesPlayed: user.games_played || 0,
      accuracy: this.calculateAccuracy(user),
      lastGameAt: user.last_game_at,
      categoryId,
      categoryName,
      isCurrentUser: ranking.user_id === this.getCurrentUserId()
    };
  }

  private calculateAccuracy(user: any): number {
    // Calcular precisión basada en datos disponibles
    // En una implementación real, tendrías estos datos en la respuesta
    return Math.floor(Math.random() * 40) + 60; // Simulado entre 60-100%
  }

  private enrichRankingData(rankings: RankingEntry[], period?: RankingPeriod): Observable<RankingEntry[]> {
    // Enriquecer con tendencias y cambios de posición
    return new BehaviorSubject(rankings.map(ranking => ({
      ...ranking,
      trend: this.calculateTrend(ranking),
      positionChange: this.calculatePositionChange(ranking)
    }))).asObservable();
  }

  private calculateTrend(ranking: RankingEntry): 'up' | 'down' | 'same' {
    // Lógica para calcular tendencia basada en historial
    // Por ahora retornamos valores aleatorios
    const trends: ('up' | 'down' | 'same')[] = ['up', 'down', 'same'];
    return trends[Math.floor(Math.random() * trends.length)];
  }

  private calculatePositionChange(ranking: RankingEntry): number {
    // Calcular cambio de posición desde el período anterior
    return Math.floor(Math.random() * 10) - 5; // Entre -5 y +5
  }

  // ==================== RANKING EN TIEMPO REAL ====================

  subscribeToLiveUpdates(adminId: string): Observable<LeaderboardData> {
    return this.autoRefresh$.pipe(
      switchMap(() => this.loadLeaderboard(adminId))
    );
  }

  // ==================== TROFEOS Y LOGROS ====================

  loadTrophies(adminId: string): Observable<TrophyData[]> {
    return this.generateTrophies(adminId).pipe(
      tap(trophies => this.trophiesSubject.next(trophies))
    );
  }

  private generateTrophies(adminId: string): Observable<TrophyData[]> {
    return this.leaderboard$.pipe(
      map(leaderboard => {
        if (!leaderboard) return [];
        
        const trophies: TrophyData[] = [];
        
        // Trofeo al primer lugar global
        if (leaderboard.global.length > 0) {
          const winner = leaderboard.global[0];
          trophies.push({
            id: 'global_champion',
            name: '🏆 Campeón Global',
            description: 'El usuario con mayor puntuación total',
            icon: 'pi-trophy',
            color: '#ffd700',
            criteria: { type: 'points', value: winner.points },
            winnerId: winner.userId,
            winnerName: winner.fullName,
            winnerAvatar: winner.avatarUrl,
            awardedAt: new Date().toISOString()
          });
        }
        
        // Trofeos por categoría
        Object.entries(leaderboard.byCategory).forEach(([categoryId, rankings]) => {
          if (rankings.length > 0) {
            const winner = rankings[0];
            trophies.push({
              id: `category_${categoryId}`,
              name: `🥇 Maestro de ${winner.categoryName}`,
              description: `El mejor en la categoría ${winner.categoryName}`,
              icon: 'pi-star',
              color: '#ffd700',
              criteria: { type: 'category', value: winner.points, categoryId },
              winnerId: winner.userId,
              winnerName: winner.fullName,
              winnerAvatar: winner.avatarUrl,
              awardedAt: new Date().toISOString()
            });
          }
        });
        
        // Trofeo por mayor racha
        const streakLeader = this.findStreakLeader(leaderboard.global);
        if (streakLeader) {
          trophies.push({
            id: 'streak_master',
            name: '🔥 Maestro de la Racha',
            description: 'El usuario con la racha más larga',
            icon: 'pi-bolt',
            color: '#ff6b35',
            criteria: { type: 'streak', value: 10 }, // Valor simulado
            winnerId: streakLeader.userId,
            winnerName: streakLeader.fullName,
            winnerAvatar: streakLeader.avatarUrl,
            awardedAt: new Date().toISOString()
          });
        }
        
        return trophies;
      })
    );
  }

  private findStreakLeader(rankings: RankingEntry[]): RankingEntry | null {
    // En una implementación real, tendrías datos de racha
    return rankings.length > 0 ? rankings[Math.floor(Math.random() * Math.min(5, rankings.length))] : null;
  }

  // ==================== HISTORIAL DE USUARIO ====================

  loadUserRankHistory(userId: string, adminId: string, days: number = 30): Observable<any[]> {
    // Simular historial de ranking
    // En una implementación real, tendrías una tabla de historial
    const history = this.generateMockHistory(days);
    this.userRankHistorySubject.next(history);
    return new BehaviorSubject(history).asObservable();
  }

  private generateMockHistory(days: number): any[] {
    const history = [];
    const today = new Date();
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      history.push({
        date: date.toISOString().split('T')[0],
        rank: Math.floor(Math.random() * 20) + 1,
        points: Math.floor(Math.random() * 1000) + 500,
        gamesPlayed: Math.floor(Math.random() * 5)
      });
    }
    
    return history;
  }

  // ==================== PERÍODOS DE RANKING ====================

  getRankingPeriods(): RankingPeriod[] {
    const today = new Date();
    const periods: RankingPeriod[] = [
      {
        type: 'daily',
        startDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        label: 'Hoy'
      },
      {
        type: 'weekly',
        startDate: this.getStartOfWeek(today),
        endDate: this.getEndOfWeek(today),
        label: 'Esta Semana'
      },
      {
        type: 'monthly',
        startDate: new Date(today.getFullYear(), today.getMonth(), 1),
        endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0),
        label: 'Este Mes'
      },
      {
        type: 'all-time',
        startDate: new Date(2020, 0, 1), // Fecha de inicio arbitraria
        endDate: today,
        label: 'Todos los Tiempos'
      }
    ];
    
    return periods;
  }

  private getStartOfWeek(date: Date): Date {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
  }

  private getEndOfWeek(date: Date): Date {
    const end = new Date(date);
    end.setDate(date.getDate() + (6 - date.getDay()));
    end.setHours(23, 59, 59, 999);
    return end;
  }

  // ==================== COMPARACIONES ====================

  compareUsers(userId1: string, userId2: string, adminId: string): Observable<{
    user1: RankingEntry;
    user2: RankingEntry;
    comparison: {
      pointsDifference: number;
      rankDifference: number;
      betterCategories: { user1: string[], user2: string[] };
    };
  }> {
    return this.leaderboard$.pipe(
      map(leaderboard => {
        if (!leaderboard) throw new Error('Leaderboard no disponible');
        
        const user1 = leaderboard.global.find(u => u.userId === userId1);
        const user2 = leaderboard.global.find(u => u.userId === userId2);
        
        if (!user1 || !user2) throw new Error('Usuarios no encontrados');
        
        const pointsDifference = user1.points - user2.points;
        const rankDifference = user2.rank - user1.rank; // Menor rank es mejor
        
        // Comparar por categorías
        const betterCategories = { user1: [], user2: [] };
        Object.entries(leaderboard.byCategory).forEach(([categoryId, rankings]) => {
          const user1Rank = rankings.find(r => r.userId === userId1)?.rank || 999;
          const user2Rank = rankings.find(r => r.userId === userId2)?.rank || 999;
          
          if (user1Rank < user2Rank) {
            betterCategories.user1.push(categoryId);
          } else if (user2Rank < user1Rank) {
            betterCategories.user2.push(categoryId);
          }
        });
        
        return {
          user1,
          user2,
          comparison: {
            pointsDifference,
            rankDifference,
            betterCategories
          }
        };
      })
    );
  }

  // ==================== ESTADÍSTICAS AVANZADAS ====================

  getLeaderboardStats(adminId: string): Observable<{
    totalParticipants: number;
    averageScore: number;
    topPercentile: number;
    competitionLevel: 'low' | 'medium' | 'high';
    growthRate: number;
  }> {
    return this.leaderboard$.pipe(
      map(leaderboard => {
        if (!leaderboard) {
          return {
            totalParticipants: 0,
            averageScore: 0,
            topPercentile: 0,
            competitionLevel: 'low' as const,
            growthRate: 0
          };
        }
        
        const participants = leaderboard.global;
        const totalParticipants = participants.length;
        const averageScore = totalParticipants > 0 
          ? participants.reduce((sum, p) => sum + p.points, 0) / totalParticipants 
          : 0;
        
        const topPercentile = totalParticipants > 0 
          ? participants.slice(0, Math.ceil(totalParticipants * 0.1))[0]?.points || 0 
          : 0;
        
        const competitionLevel = this.calculateCompetitionLevel(participants);
        const growthRate = this.calculateGrowthRate(); // Simulado
        
        return {
          totalParticipants,
          averageScore: Math.round(averageScore),
          topPercentile,
          competitionLevel,
          growthRate
        };
      })
    );
  }

  private calculateCompetitionLevel(participants: RankingEntry[]): 'low' | 'medium' | 'high' {
    if (participants.length < 10) return 'low';
    if (participants.length < 50) return 'medium';
    return 'high';
  }

  private calculateGrowthRate(): number {
    // Simular tasa de crecimiento
    return Math.floor(Math.random() * 20) + 5; // 5-25%
  }

  // ==================== CACHÉ Y OPTIMIZACIÓN ====================

  private cacheLeaderboard(data: LeaderboardData): void {
    this.localStorage.setItem('cached_leaderboard', {
      data,
      timestamp: Date.now()
    });
  }

  loadCachedLeaderboard(): LeaderboardData | null {
    const cached = this.localStorage.getItem('cached_leaderboard');
    if (!cached) return null;
    
    // Verificar si el caché es válido (menos de 5 minutos)
    const fiveMinutes = 5 * 60 * 1000;
    if (Date.now() - cached.timestamp > fiveMinutes) {
      return null;
    }
    
    return cached.data;
  }

  // ==================== UTILIDADES ====================

  private getCurrentUserId(): string {
    const profile = this.localStorage.getUserProfile();
    return profile?.id || '';
  }

  getCurrentLeaderboard(): LeaderboardData | null {
    return this.leaderboardSubject.value;
  }

  getCurrentTrophies(): TrophyData[] {
    return this.trophiesSubject.value;
  }

  getUserRankInCategory(categoryId: string, userId: string): number {
    const leaderboard = this.getCurrentLeaderboard();
    if (!leaderboard) return 0;
    
    const categoryRanking = leaderboard.byCategory[categoryId];
    if (!categoryRanking) return 0;
    
    const userEntry = categoryRanking.find(entry => entry.userId === userId);
    return userEntry?.rank || 0;
  }

  getPositionSuffix(position: number): string {
    if (position === 1) return 'er';
    if (position === 2) return 'do';
    if (position === 3) return 'er';
    return 'to';
  }

  // ==================== EXPORTAR RANKING ====================

  exportRanking(format: 'csv' | 'json' = 'json'): Observable<string> {
    return this.leaderboard$.pipe(
      map(leaderboard => {
        if (!leaderboard) return '';
        
        if (format === 'csv') {
          return this.convertRankingToCSV(leaderboard.global);
        }
        
        return JSON.stringify({
          exportDate: new Date().toISOString(),
          globalRanking: leaderboard.global,
          categoryRankings: leaderboard.byCategory,
          totalParticipants: leaderboard.totalParticipants
        }, null, 2);
      })
    );
  }

  private convertRankingToCSV(rankings: RankingEntry[]): string {
    const headers = ['Posición', 'Usuario', 'Puntos', 'Nivel', 'Precisión', 'Juegos'];
    const rows = rankings.map(entry => [
      entry.rank,
      entry.fullName,
      entry.points,
      entry.level,
      `${entry.accuracy}%`,
      entry.gamesPlayed
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}