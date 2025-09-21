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

// Services
import { MessageService } from 'primeng/api';
import { AchievementProgress } from '../../../core/models/achievement';
import { User } from '../../../core/models/user';
import { UserAchievement } from '../../../core/services/user.service';
import { AchievementService } from '../../../core/services/achievement.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Models


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
  // Data
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

  // Statistics
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

  // Options
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

  constructor(
    private achievementService: AchievementService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.loadUserData();
    this.loadAchievements();
  }

  loadUserData(): void {
    const userData = localStorage.getItem('user');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    }
  }

  loadAchievements(): void {
    if (!this.currentUser) return;

    this.loading = true;

    // Load achievement progress
    this.achievementService.getAchievementProgress(this.currentUser.id).subscribe({
      next: (progress) => {
        this.achievementProgress = progress;
        this.filteredAchievements = [...progress];
        this.calculateStatistics();
        this.groupAchievementsByType();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading achievements:', error);
        this.loading = false;
      }
    });

    // Load recent achievements
    this.achievementService.getUserAchievements(this.currentUser.id).subscribe({
      next: (userAchievements:any) => {
        this.recentAchievements = userAchievements.slice(0, 10);
      },
      error: (error) => {
        console.error('Error loading recent achievements:', error);
      }
    });
  }

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
      points: { label: 'Por Puntos', icon: 'pi pi-star', color: '#22c55e' },
      games: { label: 'Por Partidas', icon: 'pi pi-play', color: '#3b82f6' },
      streak: { label: 'Por Racha', icon: 'pi pi-forward', color: '#f59e0b' },
      category: { label: 'Por Categoría', icon: 'pi pi-tags', color: '#8b5cf6' }
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

  getTypeLabel(type: string): any {
    switch (type) {
      case 'points': return 'Puntos';
      case 'games': return 'Partidas';
      case 'streak': return 'Racha';
      case 'category': return 'Categoría';
      default: return type;
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
}