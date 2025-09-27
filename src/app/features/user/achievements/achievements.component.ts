import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { TabViewModule } from 'primeng/tabview';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { DataViewModule } from 'primeng/dataview';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';
import { TimelineModule } from 'primeng/timeline';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Services & Models
import { MessageService } from 'primeng/api';
import { AchievementService } from '../../../core/services/achievement.service';
import { AchievementProgress, UserAchievement } from '../../../core/models/achievement';
import { User } from '../../../core/models/user';

// Interfaces locales para el componente
interface AchievementFilter {
  type: string;
  status: string;
  search: string;
}

interface AchievementGroup {
  type: string;
  label: string;
  icon: string;
  color: string;
  achievements: AchievementProgress[];
  completed: number;
  total: number;
}

@Component({
  selector: 'app-user-achievements',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    ProgressBarModule,
    BadgeModule,
    TagModule,
    TabViewModule,
    DropdownModule,
    InputTextModule,
    DataViewModule,
    DialogModule,
    TooltipModule,
    RippleModule,
    SkeletonModule,
    DividerModule,
    TimelineModule,
    OverlayPanelModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './achievements.component.html',
  styleUrls: ['./achievements.component.scss'],
  providers: [MessageService]
})
export class UserAchievementsComponent implements OnInit {
  // Data - SOLO desde servicios, nunca hardcodeado
  currentUser: User | null = null;
  achievementProgress: AchievementProgress[] = [];
  filteredAchievements: AchievementProgress[] = [];
  recentAchievements: UserAchievement[] = [];
  achievementGroups: AchievementGroup[] = [];
  selectedAchievement: AchievementProgress | null = null;

  // UI State
  loading = true;
  activeTabIndex = 0;
  showDetailDialog = false;

  // Statistics - calculadas desde datos del servicio
  completedAchievements = 0;
  totalAchievements = 0;
  overallProgress = 0;
  totalPointsEarned = 0;
  pointsRemaining = 0;

  // Filters
  filters: AchievementFilter = {
    type: '',
    status: '',
    search: ''
  };

  // Options - configuración UI, no datos
  typeOptions = [
    { label: 'Todos los tipos', value: '' },
    { label: 'Por Puntos', value: 'points' },
    { label: 'Por Partidas', value: 'games' },
    { label: 'Por Racha', value: 'streak' },
    { label: 'Por Categoría', value: 'category' }
  ];

  statusOptions = [
    { label: 'Todos los estados', value: '' },
    { label: 'Completados', value: 'completed' },
    { label: 'En Progreso', value: 'in_progress' },
    { label: 'No Iniciados', value: 'not_started' }
  ];

  tabOptions = [
    { label: 'Todos', icon: 'fas fa-list' },
    { label: 'Por Tipo', icon: 'fas fa-tags' },
    { label: 'Recientes', icon: 'fas fa-clock' }
  ];

  constructor(
    private achievementService: AchievementService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.loadUserData();
    this.loadAchievements();
  }

  // ==================== CARGA DE DATOS DESDE SERVICIOS ====================

  loadUserData(): void {
    const userData = localStorage.getItem('ecobarometro_user');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    }
  }

  loadAchievements(): void {
    console.log('Cargando logros para el usuario:', this.currentUser);
    if (!this.currentUser) {
      this.handleNoUser();
      return;
    }

    this.loading = true;

    // Cargar progreso de achievements desde servicio
    this.achievementService.getAchievementProgress(this.currentUser.id).subscribe({
      next: (progress) => {
        console.log("Progreso de logros recibido:", progress);
        
        this.achievementProgress = progress;
        this.filteredAchievements = [...progress];
        this.calculateStatistics();
        this.groupAchievementsByType();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading achievements:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los logros'
        });
        this.loading = false;
      }
    });

    // Cargar achievements recientes desde servicio
    this.achievementService.getUserAchievements(this.currentUser.id).subscribe({
      next: (userAchievements) => {
        this.recentAchievements = userAchievements.slice(0, 10);
      },
      error: (error) => {
        console.error('Error loading recent achievements:', error);
      }
    });
  }

  private handleNoUser(): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Usuario no encontrado',
      detail: 'Por favor, inicia sesión para ver tus logros'
    });
    this.loading = false;
  }

  // ==================== CÁLCULOS Y PROCESAMIENTO ====================

  calculateStatistics(): void {
    this.totalAchievements = this.achievementProgress.length;
    this.completedAchievements = this.achievementProgress.filter(a => a.is_completed).length;
    this.overallProgress = this.totalAchievements > 0
      ? (this.completedAchievements / this.totalAchievements) * 100
      : 0;

    this.totalPointsEarned = this.achievementProgress
      .filter(a => a.is_completed)
      .reduce((sum, a) => sum + a.achievement.points_required, 0);

    this.pointsRemaining = this.achievementProgress
      .filter(a => !a.is_completed)
      .reduce((sum, a) => sum + a.achievement.points_required, 0);
  }

  groupAchievementsByType(): void {
    const typeGroups = {
      points: { label: 'Por Puntos', icon: 'fas fa-star', color: '#22c55e' },
      games: { label: 'Por Partidas', icon: 'fas fa-play', color: '#3b82f6' },
      streak: { label: 'Por Racha', icon: 'fas fa-fire', color: '#f59e0b' },
      category: { label: 'Por Categoría', icon: 'fas fa-tags', color: '#8b5cf6' }
    };

    this.achievementGroups = Object.entries(typeGroups).map(([type, config]) => {
      const achievements = this.achievementProgress.filter(
        a => a.achievement.achievement_type === type
      );
      const completed = achievements.filter(a => a.is_completed).length;

      return {
        type,
        label: config.label,
        icon: config.icon,
        color: config.color,
        achievements,
        completed,
        total: achievements.length
      };
    }).filter(group => group.total > 0);
  }

  // ==================== FILTROS Y BÚSQUEDA ====================

  applyFilters(): void {
    this.filteredAchievements = this.achievementProgress.filter(achievement => {
      // Type filter
      if (this.filters.type && achievement.achievement.achievement_type !== this.filters.type) {
        return false;
      }

      // Status filter
      if (this.filters.status) {
        switch (this.filters.status) {
          case 'completed':
            if (!achievement.is_completed) return false;
            break;
          case 'in_progress':
            if (achievement.is_completed || achievement.current_progress === 0) return false;
            break;
          case 'not_started':
            if (achievement.current_progress > 0) return false;
            break;
        }
      }

      // Search filter
      if (this.filters.search) {
        const searchTerm = this.filters.search.toLowerCase();
        const matchesName = achievement.achievement.name.toLowerCase().includes(searchTerm);
        const matchesDescription = achievement.achievement.description.toLowerCase().includes(searchTerm);
        if (!matchesName && !matchesDescription) return false;
      }

      return true;
    });
  }

  // ==================== INTERACCIONES UI ====================

  showAchievementDetail(achievement: AchievementProgress): void {
    this.selectedAchievement = achievement;
    this.showDetailDialog = true;
  }

  showMoreByType(type: string): void {
    this.filters.type = type;
    this.filters.status = '';
    this.filters.search = '';
    this.applyFilters();
    this.activeTabIndex = 0; // Switch to "All" tab
  }

  checkForNewAchievements(): void {
    if (this.currentUser) {
      this.achievementService.checkAndUnlockAchievements(this.currentUser.id).subscribe({
        next: (newAchievements) => {
          if (newAchievements.length > 0) {
            this.messageService.add({
              severity: 'success',
              summary: '¡Nuevos logros desbloqueados!',
              detail: `Has desbloqueado ${newAchievements.length} nuevo(s) logro(s)`
            });
            // Recargar datos para mostrar nuevos achievements
            this.loadAchievements();
          }
        },
        error: (error) => {
          console.error('Error checking for new achievements:', error);
        }
      });
    }
  }

  refreshAchievements(): void {
    this.loadAchievements();
  }

  // ==================== UTILIDADES Y HELPERS ====================

  getTypeLabel(type: string): string {
    switch (type) {
      case 'points': return 'Puntos';
      case 'games': return 'Partidas';
      case 'streak': return 'Racha';
      case 'category': return 'Categoría';
      default: return type;
    }
  }

  getTypeColor(type: string): string {
    switch (type) {
      case 'points': return '#22c55e';
      case 'games': return '#3b82f6';
      case 'streak': return '#f59e0b';
      case 'category': return '#8b5cf6';
      default: return '#6b7280';
    }
  }

  getTypeSeverity(type: string): any {
    switch (type) {
      case 'points': return 'success';
      case 'games': return 'info';
      case 'streak': return 'warning';
      case 'category': return 'help';
      default: return 'secondary';
    }
  }

  trackByAchievement(index: number, achievement: AchievementProgress): string {
    return achievement.achievement.id;
  }

  // ==================== ACCIONES ADICIONALES ====================

  shareAchievement(achievement: AchievementProgress): void {
    if (achievement.is_completed) {
      const shareText = `¡He desbloqueado el logro "${achievement.achievement.name}" en EcoBarómetro! 🏆`;
      
      if (navigator.share) {
        navigator.share({
          title: 'Logro Desbloqueado',
          text: shareText,
          url: window.location.href
        }).catch(console.error);
      } else {
        // Fallback para navegadores sin soporte de Web Share API
        navigator.clipboard.writeText(shareText).then(() => {
          this.messageService.add({
            severity: 'success',
            summary: 'Copiado',
            detail: 'Texto copiado al portapapeles'
          });
        }).catch(console.error);
      }
    }
  }

  exportAchievements(): void {
    const achievementData = {
      user: this.currentUser?.full_name || 'Usuario',
      totalAchievements: this.totalAchievements,
      completedAchievements: this.completedAchievements,
      overallProgress: this.overallProgress,
      achievements: this.achievementProgress,
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(achievementData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `mis-logros-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }
}