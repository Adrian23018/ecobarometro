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
import { AdminService } from '../../../core/services/admin.service';
import { User } from '../../../core/models/user';
import { CategoryService } from '../../../core/services/category.service';
import { UserService } from '../../../core/services/user.service';
import { QuestionsService } from '../../../core/services/questions.service';
import { AuthService } from '../../../core/services/auth.service';
import { Admin } from '../../../core/models/admin';

// Services


// Models


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
    DecimalPipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  loading = true;
  currentAdmin: Admin | null = null;
  
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
    private authService: AuthService
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
    
    this.loading = false;
  }

  private loadStats(): void {
    if (!this.currentAdmin) return;

    // Aquí cargarías las estadísticas reales
    // Por ahora, datos de ejemplo
    this.stats = {
      totalUsers: 156,
      totalQuestions: 89,
      totalCategories: 4,
      totalSessions: 342,
      activeUsers: 23,
      avgScore: 78,
      completionRate: 85,
      totalPoints: 15420
    };
  }

  private loadRecentActivity(): void {
    // Datos de ejemplo para actividad reciente
    this.recentActivity = [
      {
        type: 'user_registered',
        description: 'Nuevo usuario registrado: Ana García',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
        icon: 'pi pi-user-plus',
        color: '#22c55e'
      },
      {
        type: 'game_completed',
        description: 'Carlos López completó el EcoChallenge',
        timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
        icon: 'pi pi-check-circle',
        color: '#3b82f6'
      },
      {
        type: 'question_created',
        description: 'Nueva pregunta creada en Energía',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        icon: 'pi pi-plus-circle',
        color: '#f59e0b'
      }
    ];
  }

  private loadTopUsers(): void {
    // Datos de ejemplo para top usuarios
    this.topUsers = [
      {
        id: '1',
        username: 'eco_warrior',
        full_name: 'María Rodríguez',
        total_points: 1250,
        level: 5,
        admin_id: '1',
        admin_code: 'ABC123',
        email: 'maria@example.com',
        avatar_url: '',
        experience_points: 1250,
        games_played: 15,
        is_active: true,
        created_at: '',
        updated_at: ''
      }
      // Más usuarios...
    ];
  }

  private loadChartData(): void {
    // User Activity Chart
    this.userActivityChart = {
      labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      datasets: [
        {
          label: 'Usuarios Activos',
          data: [12, 19, 3, 5, 2, 3, 9],
          fill: true,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        },
        {
          label: 'Partidas Completadas',
          data: [8, 15, 12, 18, 14, 10, 16],
          fill: true,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4
        }
      ]
    };

    // Category Performance Chart
    this.categoryChart = {
      labels: ['Energía', 'Agua', 'Residuos', 'Transporte'],
      datasets: [
        {
          data: [35, 25, 25, 15],
          backgroundColor: ['#f59e0b', '#3b82f6', '#22c55e', '#8b5cf6'],
          borderWidth: 0
        }
      ]
    };
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
      navigator.clipboard.writeText(this.currentAdmin.admin_code);
      // Aquí mostrarías un toast de confirmación
    }
  }

  trackByActivity(index: number, activity: RecentActivity): string {
    return `${activity.type}-${activity.timestamp.getTime()}`;
  }
}