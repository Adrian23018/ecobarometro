import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

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
  styleUrls: ['./profile.component.scss']
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

  // Avatar
  selectedAvatarFile: File | null = null;
  previewAvatar: string | null = null;

  // Progress
  levelProgress = 0;
  pointsToNextLevel = 0;

  // Charts
  activityChart: any;
  chartOptions: any;
  recentActivity: any[] = [];

  // Background particles
  backgroundParticles: BackgroundParticle[] = [];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
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
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
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
    const userData = localStorage.getItem('user');
    if (userData) {
      this.currentUser = JSON.parse(userData);
      this.populateForm();
      this.calculateLevelProgress();
    }
  }

  populateForm(): void {
    if (this.currentUser) {
      this.profileForm.patchValue({
        full_name: this.currentUser.full_name,
        username: this.currentUser.username,
        email: this.currentUser.email,
        bio: '' // Add bio field to User model if needed
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
              hoursPlayed: Math.floor(stats.gamesPlayed * 0.25), // Estimate
              streakDays: stats.streak,
              favoriteCategory: 'Energía',
              improvementRate: 15
            };
          },
          error: (error) => {
            console.error('Error loading user stats:', error);
            // Use mock data as fallback
            this.userStats = {
              totalGames: 45,
              avgScore: 78,
              bestScore: 96,
              totalPoints: this.currentUser?.total_points || 0,
              hoursPlayed: 12,
              streakDays: 7,
              favoriteCategory: 'Energía',
              improvementRate: 15
            };
          }
        });
    } else {
      // Mock data - fallback
      this.userStats = {
        totalGames: 45,
        avgScore: 78,
        bestScore: 96,
        totalPoints: this.currentUser?.total_points || 0,
        hoursPlayed: 12,
        streakDays: 7,
        favoriteCategory: 'Energía',
        improvementRate: 15
      };
    }
  }

  loadActivityData(): void {
    // Mock activity chart data with dark theme colors
    this.activityChart = {
      labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
      datasets: [
        {
          label: 'Partidas Jugadas',
          data: [8, 12, 15, 10],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Puntuación Promedio',
          data: [65, 72, 78, 85],
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
        title: 'EcoChallenge Completado',
        description: 'Energía Renovable - 85% aciertos',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        icon: 'pi pi-check-circle',
        color: '#22c55e'
      },
      {
        title: 'Nuevo Logro',
        description: 'Eco Warrior desbloqueado',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        icon: 'pi pi-star',
        color: '#f59e0b'
      },
      {
        title: 'Subida de Nivel',
        description: '¡Alcanzaste el Nivel 5!',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
        icon: 'pi pi-arrow-up',
        color: '#3b82f6'
      },
      {
        title: 'Racha de 7 días',
        description: '¡Mantén el ritmo!',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
        icon: 'pi pi-trophy',
        color: '#8b5cf6'
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
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
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
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cambiar la contraseña'
        });
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
            localStorage.setItem('user', JSON.stringify(this.currentUser));
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
}