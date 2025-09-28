import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TabViewModule } from 'primeng/tabview';
import { DropdownModule } from 'primeng/dropdown';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { SkeletonModule } from 'primeng/skeleton';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { DividerModule } from 'primeng/divider';
import { RippleModule } from 'primeng/ripple';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

// Services
import { RankingService } from '../../../core/services/ranking.service';
import { CategoryService } from '../../../core/services/category.service';
import { UserService } from '../../../core/services/user.service';

// Models
import { User } from '../../../core/models/user';
import { CategoryRanking, LeaderboardEntry, UserRankingStats, RankingFilters } from '../../../core/models/ranking';
import { Category } from '../../../core/models/category';

interface TimeFilter {
  label: string;
  value: string;
  icon: string;
}

interface WeeklyChampion extends LeaderboardEntry {
  weekly_points: number;
}

interface RisingStar extends LeaderboardEntry {
  improvement: number;
}

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TableModule,
    TabViewModule,
    DropdownModule,
    BadgeModule,
    TagModule,
    AvatarModule,
    ProgressBarModule,
    TooltipModule,
    SkeletonModule,
    InputTextModule,
    SelectButtonModule,
    DividerModule,
    RippleModule,
    FormsModule,
    ReactiveFormsModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './leaderboard.component.html',
  styleUrls: ['./leaderboard.component.scss']
})
export class LeaderboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  currentUser: User | null = null;
  leaderboard: LeaderboardEntry[] = [];
  filteredLeaderboard: LeaderboardEntry[] = [];
  topUsers: LeaderboardEntry[] = [];
  categoryRankings: CategoryRanking[] = [];
  userStats: UserRankingStats | null = null;
  weeklyChampions: WeeklyChampion[] = [];
  risingStars: RisingStar[] = [];

  // UI State
  loading = true;
  activeTabIndex = 0;

  // Filters
  selectedTimeFilter = 'all';
  selectedCategory: string | null = null;
  searchTerm = '';

  // Options
  categoryOptions: Category[] = [];
  timeFilters: TimeFilter[] = [
    { label: 'Todo', value: 'all', icon: 'pi pi-calendar' },
    { label: 'Esta Semana', value: 'week', icon: 'pi pi-clock' },
    { label: 'Este Mes', value: 'month', icon: 'pi pi-calendar-times' },
    { label: 'Este Año', value: 'year', icon: 'pi pi-calendar-plus' }
  ];

  constructor(
    private rankingService: RankingService,
    private categoryService: CategoryService,
    private userService: UserService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCurrentUser(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    }
  }

  loadInitialData(): void {
    if (!this.currentUser) {
      this.loading = false;
      this.messageService.add({
        severity: 'warn',
        summary: 'Usuario no encontrado',
        detail: 'Por favor, inicia sesión para ver el ranking'
      });
      return;
    }

    this.loading = true;

    // Cargar datos en paralelo
    const loadTasks = {
      categories: this.categoryService.getAvailableCategories(this.currentUser.admin_id),
      globalRanking: this.rankingService.getGlobalRanking(this.currentUser.admin_id, this.buildFilters()),
      userStats: this.rankingService.getUserRankingStats(this.currentUser.id),
      weeklyChampions: this.rankingService.getTopPerformers(this.currentUser.admin_id, 'week'),
      monthlyStars: this.rankingService.getTopPerformers(this.currentUser.admin_id, 'month')
    };

    forkJoin(loadTasks)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          this.categoryOptions = results.categories;
          this.processGlobalRanking(results.globalRanking);
          this.userStats = results.userStats;
          this.processWeeklyChampions(results.weeklyChampions);
          this.processRisingStars(results.monthlyStars);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading leaderboard data:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los datos del ranking'
          });
          this.loading = false;
        }
      });
  }

  private processGlobalRanking(globalRanking: any): void {
    this.leaderboard = globalRanking.overall_rankings.map((entry: LeaderboardEntry) => ({
      ...entry,
      is_current_user: entry.user_id === this.currentUser?.id
    }));

    this.filteredLeaderboard = [...this.leaderboard];
    this.topUsers = this.leaderboard.slice(0, 3);
    this.categoryRankings = globalRanking.category_rankings;
  }

  private processWeeklyChampions(champions: LeaderboardEntry[]): void {
    this.weeklyChampions = champions.slice(0, 5).map(champion => ({
      ...champion,
      weekly_points: champion.total_points // En un contexto real, esto serían los puntos de la semana
    }));
  }

  private processRisingStars(performers: LeaderboardEntry[]): void {
    // Simular cálculo de mejora para las estrellas emergentes
    this.risingStars = performers.slice(5, 10).map(performer => ({
      ...performer,
      improvement: Math.floor(Math.random() * 50) + 10 // En un contexto real, calcular mejora real
    }));
  }

  private buildFilters(): RankingFilters {
    const filters: RankingFilters = {
      admin_id: this.currentUser?.admin_id,
      limit: 100
    };

    if (this.selectedCategory) {
      filters.category_id = this.selectedCategory;
    }

    if (this.selectedTimeFilter !== 'all') {
      filters.time_period = this.selectedTimeFilter as any;
    }

    return filters;
  }

  onTimeFilterChange(): void {
    this.loadRankingData();
  }

  onCategoryChange(): void {
    this.loadRankingData();
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredLeaderboard = [...this.leaderboard];
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredLeaderboard = this.leaderboard.filter(user =>
      user.full_name.toLowerCase().includes(searchLower) ||
      user.username.toLowerCase().includes(searchLower)
    );
  }

  private loadRankingData(): void {
    if (!this.currentUser) return;

    this.loading = true;
    const filters = this.buildFilters();

    this.rankingService.getGlobalRanking(this.currentUser.admin_id, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (globalRanking) => {
          this.processGlobalRanking(globalRanking);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading ranking data:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los datos del ranking'
          });
          this.loading = false;
        }
      });
  }

  scrollToMyPosition(): void {
    const element = document.getElementById('my-position');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      this.messageService.add({
        severity: 'info',
        summary: 'Posición no encontrada',
        detail: 'Tu posición no está visible en la página actual'
      });
    }
  }

  viewFullCategoryRanking(categoryId: string): void {
    this.selectedCategory = categoryId;
    this.activeTabIndex = 1;
    this.loadRankingData();
  }

  getPositionSeverity(position: number): any {
    if (position === 1) return 'warning';
    if (position === 2) return 'secondary';
    if (position === 3) return 'contrast';
    if (position <= 10) return 'info';
    return 'secondary';
  }

  getPositionIcon(position: number): string {
    switch (position) {
      case 1: return 'pi pi-crown';
      case 2: return 'pi pi-star';
      case 3: return 'pi pi-heart';
      default: return '';
    }
  }

  getPositionColor(position: number): string {
    switch (position) {
      case 1: return '#ffc107'; // Amarillo dorado
      case 2: return '#90a4ae'; // Gris plata
      case 3: return '#ff8f00'; // Bronce
      default: return '#6b7280';
    }
  }

  trackByCategoryRanking(index: number, categoryRanking: CategoryRanking): string {
    return categoryRanking.category.id;
  }

  trackByUser(index: number, user: LeaderboardEntry): string {
    return user.user_id;
  }

  // Métodos de utilidad para el template
  getUserRankInCategory(categoryId: string): number {
    const categoryRanking = this.categoryRankings.find(cr => cr.category.id === categoryId);
    if (!categoryRanking || !this.currentUser) return 0;

    const userEntry = categoryRanking.rankings.find(r => r.user_id === this.currentUser!.id);
    return userEntry?.rank_position || 0;
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  getImprovementIndicator(improvement: number): { icon: string; color: string; text: string } {
    if (improvement > 0) {
      return {
        icon: 'pi pi-arrow-up',
        color: '#2e7d32',
        text: `+${improvement}%`
      };
    } else if (improvement < 0) {
      return {
        icon: 'pi pi-arrow-down',
        color: '#d32f2f',
        text: `${improvement}%`
      };
    } else {
      return {
        icon: 'pi pi-minus',
        color: '#90a4ae',
        text: '0%'
      };
    }
  }

  refreshData(): void {
    this.loadInitialData();
  }

  // Navegación a perfil de usuario
  viewUserProfile(userId: string): void {
    // Implementar navegación a perfil de usuario si es necesario
    console.log('Ver perfil de usuario:', userId);
  }

  // Manejar errores de imágenes de avatar
  onAvatarError(event: any): void {
    event.target.style.display = 'none';
  }

  getInitial(name?: string): string {
    return name && name.length > 0 ? name.charAt(0) : '?';
  }
}