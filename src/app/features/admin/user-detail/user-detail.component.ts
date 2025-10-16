// src/app/features/admin/user-detail/user-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { TabViewModule } from 'primeng/tabview';
import { ChartModule } from 'primeng/chart';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';

// Services and Models
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user';

interface UserStats {
  totalGames: number;
  totalPoints: number;
  avgScore: number;
  timeSpent: number;
  achievements: number;
  level: number;
  experiencePoints: number;
  rank: number;
  lastActivity: Date;
  favoriteCategory: string;
  bestStreak: number;
  correctAnswers: number;
  totalAnswers: number;
}

interface GameHistory {
  id: string;
  date: Date;
  category: string;
  score: number;
  questions: number;
  duration: number;
  completed: boolean;
}

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    DropdownModule,
    CheckboxModule,
    ProgressBarModule,
    BadgeModule,
    TagModule,
    AvatarModule,
    TabViewModule,
    ChartModule,
    TableModule,
    ToastModule,
    DividerModule,
    TooltipModule
  ],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css']
})
export class UserDetailComponent implements OnInit {
  userId: string = '';
  user: User | null = null;
  userForm!: FormGroup;
  userStats: UserStats | null = null;
  gameHistory: GameHistory[] = [];
  isLoading = true;
  isEditing = false;
  isSaving = false;

  // Charts
  progressChart: any;
  categoryChart: any;
  chartOptions: any;

  // Tab management
  activeTab = 0;

  // Level options
  levelOptions = Array.from({ length: 10 }, (_, i) => ({
    label: `Nivel ${i + 1}`,
    value: i + 1
  }));

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private messageService: MessageService
  ) {
    this.initializeForm();
    this.initializeChartOptions();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.userId = params['id'];
      if (this.userId) {
        this.loadUserDetails();
      }
    });
  }

  private initializeForm(): void {
    this.userForm = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      level: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
      total_points: [0, [Validators.required, Validators.min(0)]],
      experience_points: [0, [Validators.required, Validators.min(0)]],
      is_active: [true]
    });
  }

  private initializeChartOptions(): void {
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: '#e5e7eb'
          }
        },
        x: {
          grid: {
            color: '#e5e7eb'
          }
        }
      }
    };
  }

  private loadUserDetails(): void {
    this.isLoading = true;

    this.userService.getUserById(this.userId).subscribe({
      next: (user) => {
        this.user = user;
        this.populateForm(user);
        this.loadUserStats();
        this.loadGameHistory();
        this.generateCharts();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la información del usuario'
        });
        this.isLoading = false;
      }
    });
  }

  private populateForm(user: User): void {
    this.userForm.patchValue({
      full_name: user.full_name,
      username: user.username,
      email: user.email,
      level: user.level,
      total_points: user.total_points,
      experience_points: user.experience_points,
      is_active: user.is_active
    });
  }

  private loadUserStats(): void {
    if (!this.user) return;

    // Generar estadísticas simuladas
    this.userStats = {
      totalGames: Math.floor(Math.random() * 50) + 10,
      totalPoints: this.user.total_points || 0,
      avgScore: Math.floor(Math.random() * 40) + 60,
      timeSpent: Math.floor(Math.random() * 200) + 100,
      achievements: Math.floor(Math.random() * 15) + 5,
      level: this.user.level,
      experiencePoints: this.user.experience_points || 0,
      rank: Math.floor(Math.random() * 100) + 1,
      lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      favoriteCategory: ['Energía', 'Agua', 'Reciclaje', 'Transporte'][Math.floor(Math.random() * 4)],
      bestStreak: Math.floor(Math.random() * 20) + 5,
      correctAnswers: Math.floor(Math.random() * 300) + 100,
      totalAnswers: Math.floor(Math.random() * 400) + 200
    };
  }

  private loadGameHistory(): void {
    // Generar historial simulado
    this.gameHistory = Array.from({ length: 15 }, (_, i) => ({
      id: `game-${i + 1}`,
      date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      category: ['Energía', 'Agua', 'Reciclaje', 'Transporte'][Math.floor(Math.random() * 4)],
      score: Math.floor(Math.random() * 100),
      questions: Math.floor(Math.random() * 10) + 5,
      duration: Math.floor(Math.random() * 600) + 180, // 3-13 minutos
      completed: Math.random() > 0.1 // 90% completed
    }));

    // Ordenar por fecha descendente
    this.gameHistory.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  private generateCharts(): void {
    if (!this.userStats) return;

    // Progress Chart (últimos 7 días)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const progressData = last7Days.map(() =>
      Math.floor(Math.random() * 100) // Datos simulados
    );

    this.progressChart = {
      labels: last7Days.map(date =>
        date.toLocaleDateString('es-ES', { weekday: 'short' })
      ),
      datasets: [{
        label: 'Puntos Ganados',
        data: progressData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };

    // Category Performance Chart
    const categories = ['Energía', 'Agua', 'Reciclaje', 'Transporte'];
    const categoryData = categories.map(() => Math.floor(Math.random() * 100));

    this.categoryChart = {
      labels: categories,
      datasets: [{
        label: 'Rendimiento por Categoría',
        data: categoryData,
        backgroundColor: [
          '#f59e0b', '#3b82f6', '#22c55e', '#8b5cf6'
        ],
        borderWidth: 0
      }]
    };
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing && this.user) {
      // Si cancela la edición, restaurar valores originales
      this.populateForm(this.user);
    }
  }

  onSubmit(): void {
    if (!this.userForm.valid || !this.user) return;

    this.isSaving = true;
    const formData = this.userForm.value;

    this.userService.updateUser(this.user.id, formData).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.isEditing = false;
        this.isSaving = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Usuario actualizado correctamente'
        });
      },
      error: (error) => {
        console.error('Error updating user:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el usuario'
        });
        this.isSaving = false;
      }
    });
  }

  resetProgress(): void {
    if (!this.user) return;

    this.userService.resetUserProgress(this.user.id).subscribe({
      next: () => {
        // Actualizar datos localmente
        if (this.user) {
          this.user.total_points = 0;
          this.user.level = 1;
          this.user.experience_points = 0;
          this.populateForm(this.user);
          this.loadUserStats();
          this.generateCharts();
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Progreso del usuario reiniciado'
        });
      },
      error: (error) => {
        console.error('Error resetting progress:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo reiniciar el progreso'
        });
      }
    });
  }

  getUserInitials(): string {
    if (!this.user) return 'U';
    return this.user.full_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getLevelColor(level: number): string {
    if (level <= 2) return '#22c55e';
    if (level <= 5) return '#3b82f6';
    if (level <= 8) return '#f59e0b';
    return '#ef4444';
  }

  getAccuracyPercentage(): number {
    if (!this.userStats || this.userStats.totalAnswers === 0) return 0;
    return (this.userStats.correctAnswers / this.userStats.totalAnswers) * 100;
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  goBack(): void {
    this.router.navigate(['/admin/users']);
  }
}