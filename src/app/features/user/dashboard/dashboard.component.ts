import { Component, OnInit } from '@angular/core';
import { CommonModule,Location  } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { IconPipe } from '../../../shared/pipes/icon.pipe';

// Models
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
    IconPipe
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
      route: '/game/play', // Cambiado para identificación
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
    private location: Location, // Añadido para el botón atrás
    private router: Router // Añadido para navegación
  ) { }

  ngOnInit(): void {
    console.log('Iniciando dashboard...');
    console.log('Estado inicial del localStorage ecobarometro_user:', localStorage.getItem('ecobarometro_user'));

    this.loadUserData();
    this.loadDashboardData();
  }

  loadUserData(): void {
    const userData = localStorage.getItem('ecobarometro_user');
    console.log('Datos del localStorage:', userData);

    if (userData) {
      this.currentUser = JSON.parse(userData);
      console.log('Usuario cargado:', this.currentUser);
      this.calculateLevelProgress();
    } else {
      console.error('No se encontró usuario en localStorage con clave ecobarometro_user');
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
    if (!this.currentUser) return;

    this.userService.getUserRecentActivity(this.currentUser.id, 10).subscribe({
      next: (activities) => {
        this.recentActivity = activities;
        console.log('Actividad reciente cargada:', this.recentActivity);
      },
      error: (error) => {
        console.error('Error loading recent activity:', error);
        // Mantener array vacío en caso de error
        this.recentActivity = [];
      }
    });
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

  getSafeIcon(icon: string | null | undefined): string {
    if (!icon || icon.startsWith('fas ') || icon.startsWith('far ') || icon.startsWith('fab ')) {
      return 'pi pi-trophy';
    }
    return icon;
  }

  isPiIcon(icon: string | null | undefined): boolean {
    return !!icon && icon.startsWith('pi ');
  }

   // Método para el botón atrás
  goBack(): void {
    this.location.back();
  }

  // Método para ir directo al juego
  goToGame(): void {
    // Volver a cargar usuario por si acaso
    this.loadUserData();

    console.log('Creando sesión de juego y navegando...', this.currentUser);

    if (!this.currentUser) {
      console.error('No hay usuario logueado');
      // Intentar cargar directamente del localStorage como respaldo
      const userData = localStorage.getItem('ecobarometro_user');
      if (userData) {
        this.currentUser = JSON.parse(userData);
        console.log('Usuario cargado como respaldo:', this.currentUser);
      } else {
        console.error('No se puede encontrar usuario en ecobarometro_user');
        return;
      }
    }

    // Crear una sesión de juego directamente
    const gameRequest = {
      session_name: 'EcoChallenge Rápido',
      categories: [], // Sin filtros de categoría
      total_questions: 15
    };

    this.gameSessionService.createGameSession(this.currentUser?.id, gameRequest).subscribe({
      next: (session: any) => {
        console.log('Sesión creada:', session);
        // Navegar directo al juego
        this.router.navigate(['/game/play', session.id]).then(
          (success) => {
            if (success) {
              console.log('Navegación exitosa al juego');
            } else {
              console.error('Error en la navegación al juego');
            }
          }
        );
      },
      error: (error: any) => {
        console.error('Error creando sesión de juego:', error);
        // Si falla, ir al lobby como respaldo
        this.router.navigate(['/game/lobby']);
      }
    });
  }

  // Método para manejar clics en acciones rápidas
  onQuickActionClick(action: QuickAction): void {
    console.log('Acción seleccionada:', action.label, '- Ruta:', action.route);

    if (action.route === '/game/play') {
      // Ir directo al juego
      this.goToGame();
    } else {
      // Para otras rutas usar navegación normal
      this.router.navigate([action.route]);
    }
  }

  // Método para obtener PrimeIcon según la acción
  getActionIcon(label: string): string {
    const iconMap: { [key: string]: string } = {
      'Jugar EcoChallenge': 'pi pi-play',
      'Ver Ranking': 'pi pi-trophy',
      'Mis Logros': 'pi pi-star',
      'Mi Perfil': 'pi pi-user'
    };
    return iconMap[label] || 'pi pi-bolt';
  }

  // Legacy: kept for backward compatibility, returns PrimeIcon class
  getAchievementEmoji(icon: string): string { return icon || 'pi pi-trophy'; }
  getTipEmoji(icon: string): string { return icon || 'pi pi-lightbulb'; }
}