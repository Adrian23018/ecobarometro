import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Location } from '@angular/common';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { PasswordModule } from 'primeng/password';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { FileUploadModule } from 'primeng/fileupload';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { TabViewModule } from 'primeng/tabview';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { ChartModule } from 'primeng/chart';
import { KnobModule } from 'primeng/knob';
import { TimelineModule } from 'primeng/timeline';

// Services
import { MessageService, ConfirmationService } from 'primeng/api';
import { UserService } from '../../../core/services/user.service';
import { RankingService } from '../../../core/services/ranking.service';
import { User } from '../../../core/models/user';

// Models
export interface UpdateUserRequest {
  full_name: string;
  username: string;
  email: string;
  bio?: string;
}

interface UserStatistics {
  totalGames: number;
  avgScore: number;
  bestScore: number;
  totalPoints: number;
  hoursPlayed: number;
  streakDays: number;
  favoriteCategory: string;
  improvementRate: number;
}

interface ActivityData {
  date: string;
  games: number;
  points: number;
  avgScore: number;
}

interface BackgroundParticle {
  x: number;
  y: number;
  size: number;
  delay: number;
}

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    PasswordModule,
    AvatarModule,
    BadgeModule,
    TagModule,
    FileUploadModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    ProgressBarModule,
    DividerModule,
    TooltipModule,
    TabViewModule,
    CalendarModule,
    DropdownModule,
    CheckboxModule,
    ChartModule,
    KnobModule,
    TimelineModule,
    FormsModule,
    DatePipe
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class UserProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  currentUser: User | null = null;
  userStats: UserStatistics = {
    totalGames: 0,
    avgScore: 0,
    bestScore: 0,
    totalPoints: 0,
    hoursPlayed: 0,
    streakDays: 0,
    favoriteCategory: '',
    improvementRate: 0
  };

  // Forms
  profileForm: FormGroup;
  passwordForm: FormGroup;
  preferencesForm: FormGroup;

  // UI State
  activeTab = 'info';
  updating = false;
  changingPassword = false;
  uploadingAvatar = false;
  showAvatarDialog = false;
  showCurrentPw = false;
  showNewPw = false;
  showConfirmPw = false;

  // Avatar
  selectedAvatarFile: File | null = null;
  previewAvatar: string | null = null;

  // Progress
  levelProgress = 0;
  pointsToNextLevel = 0;

  // Ranking stats
  userRank = 0;
  totalPlayers = 0;

  // Charts
  activityChart: any;
  chartOptions: any;
  recentActivity: any[] = [];

  // Background particles
  backgroundParticles: BackgroundParticle[] = [];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private rankingService: RankingService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private router: Router,
    private location: Location
  ) {
    this.profileForm = this.createProfileForm();
    this.passwordForm = this.createPasswordForm();
    this.preferencesForm = this.createPreferencesForm();
    this.initializeChartOptions();
    this.generateBackgroundParticles();
  }

  ngOnInit(): void {
    this.loadUserData();
    this.loadUserStats();
    this.loadUserRanking();
    this.loadActivityData();
    this.startParticleAnimation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createProfileForm(): FormGroup {
    return this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      bio: ['']
    });
  }

  createPasswordForm(): FormGroup {
    return this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: [this.passwordMatchValidator] });
  }

  createPreferencesForm(): FormGroup {
    return this.fb.group({
      emailNotifications: [true],
      weeklyDigest: [true],
      achievementAlerts: [true]
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  generateBackgroundParticles(): void {
    this.backgroundParticles = [];
    for (let i = 0; i < 6; i++) {
      this.backgroundParticles.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        delay: Math.random() * 5
      });
    }
  }

  startParticleAnimation(): void {
    setInterval(() => {
      this.generateBackgroundParticles();
    }, 10000);
  }

  trackByIndex(index: number): number {
    return index;
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  loadUserData(): void {
    // Cargar desde localStorage primero
    const userData = localStorage.getItem('ecobarometro_user');
    if (userData) {
      this.currentUser = JSON.parse(userData);
      this.populateForm();
      this.calculateLevelProgress();
    } else {
      // Si no hay datos en localStorage, mostrar mensaje de error
      this.messageService.add({
        severity: 'warn',
        summary: 'Sesión no encontrada',
        detail: 'Por favor, inicia sesión nuevamente'
      });
    }
  }

  populateForm(): void {
    if (this.currentUser) {
      this.profileForm.patchValue({
        full_name: this.currentUser.full_name,
        username: this.currentUser.username,
        email: this.currentUser.email,
        bio: (this.currentUser as any).bibiografia || ''
      });
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
    
    this.levelProgress = Math.min(Math.max((progressInLevel / totalLevelExp) * 100, 0), 100);
    this.pointsToNextLevel = Math.max(nextLevelExp - currentExp, 0);
  }

  loadUserStats(): void {
    if (this.currentUser?.id) {
      // Load real stats from service
      this.userService.loadUserStats(this.currentUser.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (stats) => {
            this.userStats = {
              totalGames: stats.gamesPlayed,
              avgScore: stats.averageScore,
              bestScore: stats.bestScore,
              totalPoints: stats.totalPoints,
              hoursPlayed: Math.floor(stats.gamesPlayed * 0.25), // Estimate: 15 min per game
              streakDays: stats.streak,
              favoriteCategory: 'Energía', // TODO: Calcular categoría favorita
              improvementRate: this.calculateImprovementRate(stats)
            };

            // Actualizar currentUser con los puntos actualizados
            if (this.currentUser) {
              this.currentUser.total_points = stats.totalPoints;
              this.currentUser.level = stats.level;
              this.currentUser.experience_points = stats.experiencePoints;
              this.currentUser.games_played = stats.gamesPlayed;
              this.calculateLevelProgress();
            }
          },
          error: (error) => {
            console.error('Error loading user stats:', error);
            // Use current user data as fallback
            this.userStats = {
              totalGames: this.currentUser?.games_played || 0,
              avgScore: 0,
              bestScore: 0,
              totalPoints: this.currentUser?.total_points || 0,
              hoursPlayed: Math.floor((this.currentUser?.games_played || 0) * 0.25),
              streakDays: 0,
              favoriteCategory: 'Energía',
              improvementRate: 0
            };
          }
        });
    } else {
      // Use current user data
      this.userStats = {
        totalGames: this.currentUser?.games_played || 0,
        avgScore: 0,
        bestScore: 0,
        totalPoints: this.currentUser?.total_points || 0,
        hoursPlayed: 0,
        streakDays: 0,
        favoriteCategory: 'Energía',
        improvementRate: 0
      };
    }
  }

  private calculateImprovementRate(stats: any): number {
    // Simple calculation: if streak > 0, improvement is positive
    if (stats.streak > 3) return 15;
    if (stats.streak > 1) return 10;
    if (stats.streak === 1) return 5;
    return 0;
  }

  loadUserRanking(): void {
    if (!this.currentUser?.id) return;

    this.rankingService.getUserRankingStats(this.currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rankingStats) => {
          this.userRank = rankingStats.overall_position;
          this.totalPlayers = rankingStats.total_participants;

          // Actualizar improvement rate si está disponible
          if (rankingStats.recent_improvement) {
            this.userStats.improvementRate = rankingStats.recent_improvement;
          }
        },
        error: (error) => {
          console.error('Error loading user ranking:', error);
          this.userRank = 0;
          this.totalPlayers = 0;
        }
      });
  }

  loadActivityData(): void {
    if (!this.currentUser?.id) {
      this.loadMockActivityData();
      return;
    }

    // Load real game history
    this.userService.loadGameHistory(this.currentUser.id, 10)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (history) => {
          if (history && history.length > 0) {
            this.buildActivityChart(history);
            this.buildRecentActivity(history);
          } else {
            this.loadMockActivityData();
          }
        },
        error: (error) => {
          console.error('Error loading activity data:', error);
          this.loadMockActivityData();
        }
      });
  }

  private buildActivityChart(history: any[]): void {
    // Agrupar por semanas (últimas 4 semanas)
    const weeks = this.groupByWeeks(history, 4);

    this.activityChart = {
      labels: weeks.map((w, i) => `Sem ${i + 1}`),
      datasets: [
        {
          label: 'Partidas Jugadas',
          data: weeks.map(w => w.gamesCount),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Puntuación Promedio',
          data: weeks.map(w => w.avgAccuracy),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  }

  private groupByWeeks(history: any[], weekCount: number): any[] {
    const now = new Date();
    const weeks = [];

    for (let i = weekCount - 1; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i + 1) * 7);
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - i * 7);

      const weekGames = history.filter(game => {
        const gameDate = new Date(game.playedAt);
        return gameDate >= weekStart && gameDate < weekEnd;
      });

      weeks.push({
        gamesCount: weekGames.length,
        avgAccuracy: weekGames.length > 0
          ? Math.round(weekGames.reduce((sum, g) => sum + g.accuracy, 0) / weekGames.length)
          : 0
      });
    }

    return weeks;
  }

  private buildRecentActivity(history: any[]): void {
    this.recentActivity = [];

    // Agregar últimos juegos completados
    history.slice(0, 4).forEach(game => {
      this.recentActivity.push({
        title: 'Partida Completada',
        description: `${game.sessionName || 'EcoChallenge'} - ${game.accuracy}% aciertos`,
        timestamp: new Date(game.playedAt),
        icon: 'pi pi-check-circle',
        color: game.accuracy >= 80 ? '#22c55e' : game.accuracy >= 60 ? '#f59e0b' : '#ef4444'
      });
    });

    // Si hay racha activa, agregar actividad
    if (this.userStats.streakDays > 0) {
      this.recentActivity.unshift({
        title: `Racha de ${this.userStats.streakDays} días`,
        description: '¡Mantén el ritmo!',
        timestamp: new Date(),
        icon: 'pi pi-trophy',
        color: '#8b5cf6'
      });
    }
  }

  private loadMockActivityData(): void {
    // Mock activity chart data with dark theme colors
    this.activityChart = {
      labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
      datasets: [
        {
          label: 'Partidas Jugadas',
          data: [0, 0, 0, 0],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Puntuación Promedio',
          data: [0, 0, 0, 0],
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };

    // Mock recent activity
    this.recentActivity = [
      {
        title: 'Sin actividad reciente',
        description: '¡Comienza a jugar para ver tu actividad aquí!',
        timestamp: new Date(),
        icon: 'pi pi-info-circle',
        color: '#64748b'
      }
    ];
  }

  initializeChartOptions(): void {
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: '#94a3b8'
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#94a3b8'
          }
        },
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#94a3b8'
          }
        }
      }
    };
  }

  getTimelineIconBackground(color: string): string {
    // Convert hex to gradient
    const colorMap: { [key: string]: string } = {
      '#22c55e': 'linear-gradient(45deg, #22c55e, #16a34a)',
      '#f59e0b': 'linear-gradient(45deg, #f59e0b, #d97706)',
      '#3b82f6': 'linear-gradient(45deg, #3b82f6, #2563eb)',
      '#8b5cf6': 'linear-gradient(45deg, #8b5cf6, #7c3aed)'
    };
    return colorMap[color] || `linear-gradient(45deg, ${color}, ${color})`;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  updateProfile(): void {
    if (this.profileForm.invalid || !this.currentUser) return;

    this.updating = true;
    const formValue = this.profileForm.value;

    const updateData: UpdateUserRequest = {
      full_name: formValue.full_name,
      username: formValue.username,
      email: formValue.email,
      bio: formValue.bio
    };

    this.userService.updateUser(this.currentUser.id, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser: any) => {
          this.currentUser = updatedUser;
          localStorage.setItem('ecobarometro_user', JSON.stringify(updatedUser));
          
          this.messageService.add({
            severity: 'success',
            summary: 'Perfil Actualizado',
            detail: 'Tu información ha sido actualizada correctamente'
          });
          
          this.profileForm.markAsPristine();
          this.updating = false;
        },
        error: (error: any) => {
          console.error('Error updating profile:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar el perfil'
          });
          this.updating = false;
        }
      });
  }

  resetForm(): void {
    this.populateForm();
    this.profileForm.markAsPristine();
  }

  changePassword(): void {
    this.passwordForm.markAllAsTouched();
    if (this.passwordForm.invalid || !this.currentUser) return;

    this.changingPassword = true;
    const formValue = this.passwordForm.value;

    this.userService.changePassword(
      this.currentUser.id,
      formValue.currentPassword,
      formValue.newPassword
    ).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Contraseña Cambiada',
          detail: 'Tu contraseña ha sido actualizada correctamente'
        });
        this.passwordForm.reset();
        this.changingPassword = false;
      },
      error: (error) => {
        console.error('Error changing password:', error);
        if (error.message === 'Contraseña actual incorrecta') {
          this.passwordForm.get('currentPassword')?.setErrors({ wrongPassword: true });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'No se pudo cambiar la contraseña'
          });
        }
        this.changingPassword = false;
      }
    });
  }

  updatePreferences(): void {
    // Here you would typically save preferences to the backend
    const preferences = this.preferencesForm.value;
    
    // For now, just save to localStorage
    localStorage.setItem('user_preferences', JSON.stringify(preferences));
    
    this.messageService.add({
      severity: 'success',
      summary: 'Preferencias Actualizadas',
      detail: 'Tus preferencias han sido guardadas'
    });
  }

  onAvatarSelect(event: any): void {
    const file = event.files[0];
    if (file) {
      this.selectedAvatarFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewAvatar = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadAvatar(): void {
    if (!this.selectedAvatarFile || !this.currentUser) return;

    this.uploadingAvatar = true;
    
    this.userService.uploadAvatar(this.currentUser.id, this.selectedAvatarFile)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (avatarUrl) => {
          if (this.currentUser) {
            this.currentUser.avatar_url = avatarUrl;
            localStorage.setItem('ecobarometro_user', JSON.stringify(this.currentUser));
          }
          
          this.messageService.add({
            severity: 'success',
            summary: 'Foto Actualizada',
            detail: 'Tu foto de perfil ha sido actualizada'
          });
          
          this.closeAvatarDialog();
          this.uploadingAvatar = false;
        },
        error: (error) => {
          console.error('Error uploading avatar:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo subir la imagen'
          });
          this.uploadingAvatar = false;
        }
      });
  }

  closeAvatarDialog(): void {
    this.showAvatarDialog = false;
    this.selectedAvatarFile = null;
    this.previewAvatar = null;
  }

  getMembershipDuration(): string {
    if (!this.currentUser?.created_at) return '';
    
    const createdDate = new Date(this.currentUser.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} días`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'mes' : 'meses'}`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years} ${years === 1 ? 'año' : 'años'}`;
    }
  }

  getLastLoginInfo(): string {
    if (this.currentUser?.last_game_at) {
      const lastGame = new Date(this.currentUser.last_game_at);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - lastGame.getTime()) / (1000 * 60 * 60));
      
      if (diffHours < 1) {
        return 'Hace menos de una hora';
      } else if (diffHours < 24) {
        return `Hace ${diffHours} horas`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
      }
    }
    return 'Hoy a las 10:30 AM';
  }

  confirmDeleteAccount(): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas eliminar tu cuenta? Esta acción no se puede deshacer y perderás todos tus datos, puntos y logros.',
      header: 'Confirmar Eliminación de Cuenta',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        if (this.currentUser?.id) {
          this.userService.deleteUserAccount(this.currentUser.id)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: () => {
                this.messageService.add({
                  severity: 'success',
                  summary: 'Cuenta Eliminada',
                  detail: 'Tu cuenta ha sido eliminada correctamente'
                });
                // Redirect to login or home page
                // this.router.navigate(['/login']);
              },
              error: (error) => {
                console.error('Error deleting account:', error);
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: 'No se pudo eliminar la cuenta'
                });
              }
            });
        } else {
          this.messageService.add({
            severity: 'info',
            summary: 'Eliminación de Cuenta',
            detail: 'Funcionalidad en desarrollo'
          });
        }
      }
    });
  }

  goBack(): void {
    this.location.back();
  }
}