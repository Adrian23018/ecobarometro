import { Component, OnInit } from '@angular/core';
import { CommonModule,Location  } from '@angular/common';
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
import { TimelineModule } from 'primeng/timeline';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { SkeletonModule } from 'primeng/skeleton';
import { CarouselModule } from 'primeng/carousel';
import { TableModule } from 'primeng/table';
import { RatingModule } from 'primeng/rating';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { User } from '../../../core/models/user';
import { GameSessionStats } from '../../../core/models/game-session';
import { AchievementProgress } from '../../../core/models/achievement';
import { UserRankingStats } from '../../../core/models/ranking';
import { CategoryWithStats } from '../../../core/models/category';
import { UserService } from '../../../core/services/user.service';
import { AchievementService } from '../../../core/services/achievement.service';
import { RankingService } from '../../../core/services/ranking.service';
import { CategoryService } from '../../../core/services/category.service';
import { GameSessionService } from '../../../core/services/game-session.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Services


// Models


interface QuickAction {
  label: string;
  icon: string;
  color: string;
  route: string;
  description: string;
}

interface EcoTip {
  title: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

@Component({
  selector: 'app-user-dashboard',
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
    TimelineModule,
    DividerModule,
    TooltipModule,
    RippleModule,
    SkeletonModule,
    CarouselModule,
    TableModule,
    RatingModule,
    OverlayPanelModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class UserDashboardComponent implements OnInit {
  // Data
  currentUser: User | null = null;
  sessionStats: GameSessionStats = {
    total_sessions: 0,
    completed_sessions: 0,
    avg_score: 0,
    avg_time: 0,
    best_score: 0,
    total_points_earned: 0
  };
  achievementProgress: AchievementProgress[] = [];
  rankingStats: UserRankingStats | null = null;
  categoryPerformance: CategoryWithStats[] = [];
  recentActivity: any[] = [];

  // UI
  levelProgress = 0;
  pointsToNextLevel = 0;
  tipCarouselResponsive = [
    {
      breakpoint: '1024px',
      numVisible: 2,
      numScroll: 1
    },
    {
      breakpoint: '768px',
      numVisible: 1,
      numScroll: 1
    }
  ];

  // Quick Actions
  quickActions: QuickAction[] = [
    {
      label: 'Jugar EcoChallenge',
      icon: 'pi pi-play',
      color: '#22c55e',
      route: '/game/lobby',
      description: 'Pon a prueba tus conocimientos'
    },
    {
      label: 'Ver Ranking',
      icon: 'pi pi-trophy',
      color: '#f59e0b',
      route: '/game/leaderboard',
      description: 'Compite con otros usuarios'
    },
    {
      label: 'Mis Logros',
      icon: 'pi pi-star',
      color: '#8b5cf6',
      route: '/user/achievements',
      description: 'Descubre tus logros'
    },
    {
      label: 'Mi Perfil',
      icon: 'pi pi-user',
      color: '#3b82f6',
      route: '/user/profile',
      description: 'Gestiona tu información'
    }
  ];

  // Eco Tips
  ecoTips: EcoTip[] = [
    {
      title: 'Ahorra Agua en Casa',
      description: 'Cierra el grifo mientras te cepillas los dientes. Puedes ahorrar hasta 6 litros por minuto.',
      category: 'Agua',
      icon: 'pi pi-tint',
      color: '#3b82f6',
      difficulty: 'easy'
    },
    {
      title: 'Usa Transporte Sostenible',
      description: 'Camina, usa bicicleta o transporte público. Reduce tu huella de carbono significativamente.',
      category: 'Transporte',
      icon: 'pi pi-car',
      color: '#22c55e',
      difficulty: 'medium'
    },
    {
      title: 'Separa tus Residuos',
      description: 'Clasifica orgánicos, reciclables y no reciclables. Facilitas el proceso de reciclaje.',
      category: 'Residuos',
      icon: 'pi pi-refresh',
      color: '#f59e0b',
      difficulty: 'easy'
    },
    {
      title: 'Energía Solar Casera',
      description: 'Considera instalar paneles solares. Es una inversión a largo plazo muy rentable.',
      category: 'Energía',
      icon: 'pi pi-sun',
      color: '#ff6b35',
      difficulty: 'hard'
    }
  ];

  constructor(
    private userService: UserService,
    private gameSessionService: GameSessionService,
    private achievementService: AchievementService,
    private rankingService: RankingService,
    private categoryService: CategoryService,
    private location: Location // Añadido para el botón atrás
  ) { }

  ngOnInit(): void {
    this.loadUserData();
    this.loadDashboardData();
  }

  loadUserData(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.currentUser = JSON.parse(userData);
      this.calculateLevelProgress();
    }
  }

  calculateLevelProgress(): void {
    if (!this.currentUser) return;

    const currentLevel = this.currentUser.level;
    const currentExp = this.currentUser.experience_points;
    const currentLevelExp = (currentLevel - 1) * 1000;
    const nextLevelExp = currentLevel * 1000;

    const progressInLevel = currentExp - currentLevelExp;
    const totalLevelExp = nextLevelExp - currentLevelExp;

    this.levelProgress = (progressInLevel / totalLevelExp) * 100;
    this.pointsToNextLevel = nextLevelExp - currentExp;
  }

  loadDashboardData(): void {
    if (!this.currentUser) return;

    // Load session stats
    this.gameSessionService.getUserSessionStats(this.currentUser.id).subscribe({
      next: (stats: any) => {
        this.sessionStats = stats;
      },
      error: (error: any) => {
        console.error('Error loading session stats:', error);
      }
    });

    // Load achievement progress
    this.achievementService.getAchievementProgress(this.currentUser.id).subscribe({
      next: (progress) => {
        this.achievementProgress = progress;
      },
      error: (error) => {
        console.error('Error loading achievement progress:', error);
      }
    });

    // Load ranking stats
    this.rankingService.getUserRankingStats(this.currentUser.id).subscribe({
      next: (stats) => {
        this.rankingStats = stats;
      },
      error: (error) => {
        console.error('Error loading ranking stats:', error);
      }
    });

    // Load category performance
    this.categoryService.getCategoriesWithStats(this.currentUser.admin_id, this.currentUser.id).subscribe({
      next: (categories) => {
        this.categoryPerformance = categories;
      },
      error: (error) => {
        console.error('Error loading category performance:', error);
      }
    });

    // Load recent activity
    this.loadRecentActivity();
  }

  loadRecentActivity(): void {
    // Mock data for recent activity
    this.recentActivity = [
      {
        title: 'EcoChallenge Completado',
        description: 'Completaste un desafío de Energía con 85% de aciertos',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
        icon: 'pi pi-check-circle',
        color: '#22c55e',
        points: 120
      },
      {
        title: 'Nuevo Logro',
        description: 'Desbloqueaste el logro "Eco Warrior"',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        icon: 'pi pi-star',
        color: '#f59e0b',
        points: 50
      },
      {
        title: 'Subiste de Nivel',
        description: 'Alcanzaste el Nivel 3 en el EcoBarómetro',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        icon: 'pi pi-arrow-up',
        color: '#8b5cf6',
        points: 100
      }
    ];
  }

  getDifficultyLabel(difficulty: 'easy' | 'medium' | 'hard'): string {
    switch (difficulty) {
      case 'easy': return 'Fácil';
      case 'medium': return 'Medio';
      case 'hard': return 'Difícil';
      default: return difficulty;
    }
  }

  getDifficultySeverity(difficulty: 'easy' | 'medium' | 'hard'): any {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'danger';
      default: return 'secondary';
    }
  }

  getDifficultyRating(difficulty: 'easy' | 'medium' | 'hard'): any {
    switch (difficulty) {
      case 'easy': return 1;
      case 'medium': return 2;
      case 'hard': return 3;
      default: return 1;
    }
  }

  get completedAchievements(): number {
    return this.achievementProgress.filter(a => a.is_completed).length;
  }

  get pendingAchievements(): number {
    return this.achievementProgress.length - this.completedAchievements;
  }

   // Método para el botón atrás
  goBack(): void {
    this.location.back();
  }
}