import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { ChartModule } from 'primeng/chart';
import { KnobModule } from 'primeng/knob';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { TabViewModule } from 'primeng/tabview';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { SkeletonModule } from 'primeng/skeleton';
import { TimelineModule } from 'primeng/timeline';
import { RatingModule } from 'primeng/rating';
import { OverlayPanelModule } from 'primeng/overlaypanel';

// Services
import { MessageService } from 'primeng/api';
import { Category } from '../../../core/models/category';
import { LeaderboardEntry, UserRankingStats } from '../../../core/models/ranking';
import { User } from '../../../core/models/user';
import { RankingService } from '../../../core/services/ranking.service';
import { CategoryService } from '../../../core/services/category.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Models

interface RankingComparison {
  category: Category;
  myPosition: number;
  myScore: number;
  topUsers: LeaderboardEntry[];
  improvement: number;
  trend: 'up' | 'down' | 'stable';
}

interface GoalProgress {
  title: string;
  description: string;
  current: number;
  target: number;
  progress: number;
  icon: string;
  color: string;
  timeframe: string;
}

@Component({
  selector: 'app-user-ranking',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    ProgressBarModule,
    BadgeModule,
    TagModule,
    AvatarModule,
    ChartModule,
    KnobModule,
    DividerModule,
    TooltipModule,
    TabViewModule,
    TableModule,
    DropdownModule,
    SkeletonModule,
    TimelineModule,
    RatingModule,
    OverlayPanelModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule
  ],
  templateUrl: './ranking.component.html',
  styleUrls: ['./ranking.component.scss'],
  providers: [MessageService]
})
export class UserRankingComponent implements OnInit {
  // Data
  currentUser: User | null = null;
  userStats: UserRankingStats | null = null;
  categoryComparisons: RankingComparison[] = [];
  progressGoals: GoalProgress[] = [];

  // UI State
  activeTabIndex = 0;
  loading = true;

  // Achievements
  achievementCompletionRate = 0;
  completedAchievements = 0;
  totalAchievements = 0;
  recentAchievements: any[] = [];

  // Charts
  rankingEvolutionChart: any;
  comparisonChart: any;
  chartOptions: any;
  radarOptions: any;

  constructor(
    private rankingService: RankingService,
    private categoryService: CategoryService,
    private messageService: MessageService
  ) {
    this.initializeChartOptions();
  }

  ngOnInit(): void {
    this.loadUserData();
    this.loadRankingData();
  }

  loadUserData(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    }
  }

  loadRankingData(): void {
    if (!this.currentUser) return;

    this.loading = true;

    // Load user ranking stats
    this.rankingService.getUserRankingStats(this.currentUser.id).subscribe({
      next: (stats:any) => {
        this.userStats = stats;
        this.generateCategoryComparisons();
        this.loading = false;
      },
      error: (error:any) => {
        console.error('Error loading ranking stats:', error);
        this.loading = false;
      }
    });

    this.loadProgressGoals();
    this.loadAchievementData();
    this.loadChartData();
  }

  generateCategoryComparisons(): void {
    if (!this.userStats) return;

    // Mock category comparisons data
    this.categoryComparisons = this.userStats.category_positions.map(position => ({
      category: position.category,
      myPosition: position.position,
      myScore: position.percentage_score,
      topUsers: this.generateMockTopUsers(position.category.id),
      improvement: Math.floor(Math.random() * 20) - 10, // -10 to +10
      trend: this.getRandomTrend()
    }));
  }

  generateMockTopUsers(categoryId: string): LeaderboardEntry[] {
    return Array.from({ length: 3 }, (_, i) => ({
      user_id: `user_${i + 1}`,
      username: `user${i + 1}`,
      full_name: `Usuario ${i + 1}`,
      avatar_url: '',
      total_points: 1000 - (i * 100),
      rank_position: i + 1,
      games_played: 20,
      avg_score: 90 - (i * 5),
      level: 5 - i,
      achievements_count: 10 - i,
      is_current_user: i === 1 && Math.random() > 0.5 // Sometimes current user is in top 3
    }));
  }

  getRandomTrend(): 'up' | 'down' | 'stable' {
    const rand = Math.random();
    if (rand < 0.4) return 'up';
    if (rand < 0.7) return 'stable';
    return 'down';
  }

  loadProgressGoals(): void {
    this.progressGoals = [
      {
        title: 'Alcanzar Top 50',
        description: 'Llega a estar entre los 50 mejores usuarios',
        current: this.userStats?.overall_position || 100,
        target: 50,
        progress: Math.min(((100 - (this.userStats?.overall_position || 100)) / 50) * 100, 100),
        icon: 'pi pi-trophy',
        color: '#f59e0b',
        timeframe: 'Este mes'
      },
      {
        title: 'Conseguir 1000 Puntos',
        description: 'Acumula 1000 puntos en total',
        current: this.currentUser?.total_points || 0,
        target: 1000,
        progress: Math.min(((this.currentUser?.total_points || 0) / 1000) * 100, 100),
        icon: 'pi pi-star',
        color: '#22c55e',
        timeframe: 'Sin límite'
      },
      {
        title: 'Jugar 50 Partidas',
        description: 'Completa 50 partidas del EcoBarómetro',
        current: this.currentUser?.games_played || 0,
        target: 50,
        progress: Math.min(((this.currentUser?.games_played || 0) / 50) * 100, 100),
        icon: 'pi pi-play',
        color: '#3b82f6',
        timeframe: 'Este trimestre'
      },
      {
        title: 'Mejorar Promedio a 85%',
        description: 'Alcanza un 85% de promedio en todas las categorías',
        current: 78, // Mock current average
        target: 85,
        progress: (78 / 85) * 100,
        icon: 'pi pi-chart-line',
        color: '#8b5cf6',
        timeframe: 'Próximos 3 meses'
      }
    ];
  }

  loadAchievementData(): void {
    // Mock achievement data
    this.completedAchievements = 8;
    this.totalAchievements = 15;
    this.achievementCompletionRate = (this.completedAchievements / this.totalAchievements) * 100;

    this.recentAchievements = [
      {
        name: 'Eco Warrior',
        description: 'Completaste 10 partidas',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24),
        icon: 'pi pi-star',
        color: '#22c55e',
        rankingImpact: 3
      },
      {
        name: 'Speed Demon',
        description: 'Respuesta rápida en 5 preguntas consecutivas',
        date: new Date(Date.now() - 1000 * 60 * 60 * 48),
        icon: 'pi pi-bolt',
        color: '#f59e0b',
        rankingImpact: 2
      }
    ];
  }

  loadChartData(): void {
    // Ranking Evolution Chart
    this.rankingEvolutionChart = {
      labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
      datasets: [
        {
          label: 'Mi Posición',
          data: [85, 72, 68, this.userStats?.overall_position || 65],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };

    // Comparison Radar Chart
    this.comparisonChart = {
      labels: ['Energía', 'Agua', 'Residuos', 'Transporte', 'Biodiversidad'],
      datasets: [
        {
          label: 'Mi Rendimiento',
          data: [78, 85, 72, 68, 81],
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: '#3b82f6',
          borderWidth: 2
        },
        {
          label: 'Promedio de Usuarios Similares',
          data: [70, 75, 68, 72, 74],
          backgroundColor: 'rgba(156, 163, 175, 0.2)',
          borderColor: '#9ca3af',
          borderWidth: 2
        }
      ]
    };
  }

  initializeChartOptions(): void {
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        }
      },
      scales: {
        y: {
          reverse: true, // Lower numbers (better positions) at top
          beginAtZero: false,
          grid: {
            color: '#e5e7eb'
          },
          title: {
            display: true,
            text: 'Posición en Ranking'
          }
        },
        x: {
          grid: {
            color: '#e5e7eb'
          }
        }
      }
    };

    this.radarOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          grid: {
            color: '#e5e7eb'
          }
        }
      }
    };
  }

  getTopPercentage(): number {
    if (!this.userStats) return 0;
    return Math.round((this.userStats.overall_position / this.userStats.total_participants) * 100);
  }

  getProgressToNext(): number {
    if (!this.userStats || this.userStats.points_to_next_rank === 0) return 100;
    
    // Estimate based on average points needed (this could be more sophisticated)
    const estimatedPointsForOnePosition = 50;
    return Math.min(
      ((estimatedPointsForOnePosition - this.userStats.points_to_next_rank) / estimatedPointsForOnePosition) * 100,
      100
    );
  }

  getTrendIcon(trend: 'up' | 'down' | 'stable'): any {
    switch (trend) {
      case 'up': return 'pi pi-arrow-up';
      case 'down': return 'pi pi-arrow-down';
      case 'stable': return 'pi pi-minus';
    }
  }

  getTrendColor(trend: 'up' | 'down' | 'stable'): any {
    switch (trend) {
      case 'up': return '#22c55e';
      case 'down': return '#ef4444';
      case 'stable': return '#6b7280';
    }
  }

  getPositionSeverity(position: number): any {
    if (position === 1) return 'warning';
    if (position === 2) return 'secondary';
    if (position === 3) return 'contrast';
    return 'info';
  }

  getGoalUnit(goalTitle: string): any {
    if (goalTitle.includes('Puntos')) return 'puntos';
    if (goalTitle.includes('Partidas')) return 'partidas';
    if (goalTitle.includes('Top')) return 'posiciones';
    if (goalTitle.includes('Promedio')) return '%';
    return 'unidades';
  }

  trackByCategory(index: number, comparison: RankingComparison): any {
    return comparison.category.id;
  }
}