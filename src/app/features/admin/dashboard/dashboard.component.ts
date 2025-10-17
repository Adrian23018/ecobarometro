import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { AdminService } from '../../../core/services/admin.service';
import { User } from '../../../core/models/user';
import { CategoryService } from '../../../core/services/category.service';
import { UserService } from '../../../core/services/user.service';
import { QuestionsService } from '../../../core/services/questions.service';
import { AuthService } from '../../../core/services/auth.service';
import { Admin } from '../../../core/models/admin';


interface DashboardStats {
  totalUsers: number;
  totalQuestions: number;
  totalCategories: number;
  totalSessions: number;
  activeUsers: number;
  avgScore: number;
  completionRate: number;
  totalPoints: number;
}

interface RecentActivity {
  type: 'user_registered' | 'game_completed' | 'question_created';
  user?: User;
  timestamp: Date;
  description: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    ChartModule,
    ProgressBarModule,
    BadgeModule,
    TableModule,
    TagModule,
    AvatarModule,
    SkeletonModule,
    DividerModule,
    TooltipModule,
    ToastModule,
    ConfirmDialogModule,
    DecimalPipe
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  loading = true;
  currentAdmin: Admin | any = null;
  
  stats: DashboardStats = {
    totalUsers: 0,
    totalQuestions: 0,
    totalCategories: 0,
    totalSessions: 0,
    activeUsers: 0,
    avgScore: 0,
    completionRate: 0,
    totalPoints: 0
  };

  recentActivity: RecentActivity[] = [];
  topUsers: User[] = [];

  // Chart Data
  userActivityChart: any;
  categoryChart: any;
  chartOptions: any;
  doughnutOptions: any;

  constructor(
    private adminService: AdminService,
    private userService: UserService,
    private categoryService: CategoryService,
    private questionService: QuestionsService,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.initializeChartOptions();
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    this.loading = true;

    // Obtener admin actual
    this.currentAdmin = this.authService.getCurrentAdmin();
    if (this.currentAdmin) {
      this.loadStats();
      this.loadRecentActivity();
      this.loadTopUsers();
      this.loadChartData();
    }
  }

  private loadStats(): void {
    if (!this.currentAdmin) return;

    // Cargar usuarios del admin
    this.userService.getUsersByAdmin(this.currentAdmin.id).subscribe({
      next: (users) => {
        this.stats.totalUsers = users.length;
        this.stats.activeUsers = users.filter(u => u.is_active).length;
        this.stats.totalPoints = users.reduce((sum, u) => sum + (u.total_points || 0), 0);
        this.stats.avgScore = users.length > 0
          ? Math.round(users.reduce((sum, u) => sum + (u.total_points || 0), 0) / users.length / 10)
          : 0;
      },
      error: (err) => console.error('Error loading users:', err)
    });

    // Cargar categorías
    this.categoryService.getCategoriesByAdmin(this.currentAdmin.id).subscribe({
      next: (categories) => {
        this.stats.totalCategories = categories.length;
      },
      error: (err) => console.error('Error loading categories:', err)
    });

    // Cargar preguntas
    this.questionService.getQuestionsByAdmin(this.currentAdmin.id).subscribe({
      next: (questions) => {
        this.stats.totalQuestions = questions.length;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading questions:', err);
        this.loading = false;
      }
    });

    // Datos simulados para sesiones
    this.stats.totalSessions = Math.floor(Math.random() * 200) + 150;
    this.stats.completionRate = Math.floor(Math.random() * 30) + 70;
  }

  private loadRecentActivity(): void {
    // Datos de ejemplo para actividad reciente
    this.recentActivity = [
      {
        type: 'user_registered',
        description: 'Nuevo usuario registrado: Ana García',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
        icon: '👤',
        color: '#22c55e'
      },
      {
        type: 'game_completed',
        description: 'Carlos López completó el EcoChallenge',
        timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        icon: '✅',
        color: '#3b82f6'
      },
      {
        type: 'question_created',
        description: 'Nueva pregunta creada en Energía',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        icon: '➕',
        color: '#f59e0b'
      },
      {
        type: 'user_registered',
        description: 'María Rodríguez se unió al EcoBarómetro',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
        icon: '👤',
        color: '#22c55e'
      },
      {
        type: 'game_completed',
        description: 'Pedro Sánchez alcanzó nivel 5',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
        icon: '🎯',
        color: '#8b5cf6'
      }
    ];
  }

  private loadTopUsers(): void {
    if (!this.currentAdmin) return;

    // Cargar usuarios reales y ordenar por puntos
    this.userService.getUsersByAdmin(this.currentAdmin.id).subscribe({
      next: (users) => {
        this.topUsers = users
          .filter(u => u.total_points && u.total_points > 0)
          .sort((a, b) => (b.total_points || 0) - (a.total_points || 0))
          .slice(0, 5);
      },
      error: (err) => console.error('Error loading top users:', err)
    });
  }

  private loadChartData(): void {
    if (!this.currentAdmin) return;

    // Datos simulados realistas para la última semana
    const today = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d.toLocaleDateString('es-ES', { weekday: 'short' }));
    }

    this.userActivityChart = {
      labels: days,
      datasets: [
        {
          label: 'Usuarios Activos',
          data: this.generateRealisticData(7, 5, 25),
          fill: true,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          borderWidth: 3
        },
        {
          label: 'Partidas Completadas',
          data: this.generateRealisticData(7, 8, 35),
          fill: true,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          borderWidth: 3
        }
      ]
    };

    // Cargar categorías reales para el chart
    this.categoryService.getCategoriesByAdmin(this.currentAdmin.id).subscribe({
      next: (categories) => {
        const colors = ['#f59e0b', '#3b82f6', '#22c55e', '#8b5cf6', '#ec4899', '#14b8a6'];

        this.categoryChart = {
          labels: categories.map(c => c.name),
          datasets: [
            {
              data: categories.map(() => Math.floor(Math.random() * 40) + 10),
              backgroundColor: colors.slice(0, categories.length),
              borderWidth: 0,
              hoverOffset: 10
            }
          ]
        };
      },
      error: (err) => {
        console.error('Error loading categories for chart:', err);
        // Fallback si falla
        this.categoryChart = {
          labels: ['Sin categorías'],
          datasets: [{
            data: [100],
            backgroundColor: ['#94a3b8'],
            borderWidth: 0
          }]
        };
      }
    });
  }

  private generateRealisticData(length: number, min: number, max: number): number[] {
    const data: number[] = [];
    let lastValue = Math.floor(Math.random() * (max - min)) + min;

    for (let i = 0; i < length; i++) {
      // Variación suave entre valores
      const change = Math.floor(Math.random() * 8) - 4;
      lastValue = Math.max(min, Math.min(max, lastValue + change));
      data.push(lastValue);
    }

    return data;
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

    this.doughnutOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    };
  }

  shareAdminCode(): void {
    if (this.currentAdmin?.admin_code) {
      navigator.clipboard.writeText(this.currentAdmin.admin_code).then(() => {
        this.messageService.add({
          severity: 'success',
          summary: '¡Código copiado!',
          detail: `Código ${this.currentAdmin.admin_code} copiado al portapapeles`,
          life: 3000
        });
      }).catch(() => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo copiar el código',
          life: 3000
        });
      });
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No hay código de administrador disponible',
        life: 3000
      });
    }
  }

  trackByActivity(index: number, activity: RecentActivity): string {
    return `${activity.type}-${activity.timestamp.getTime()}`;
  }

  logout(): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que deseas cerrar sesión?',
      header: 'Confirmar Cierre de Sesión',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, cerrar sesión',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-secondary',
      accept: () => {
        this.authService.logoutAdmin();
        this.messageService.add({
          severity: 'success',
          summary: 'Sesión Cerrada',
          detail: 'Has cerrado sesión exitosamente',
          life: 3000
        });
      }
    });
  }
}