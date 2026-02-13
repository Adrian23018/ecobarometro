// src/app/features/admin/user-analytics/user-analytics.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// PrimeNG
import { ChartModule } from 'primeng/chart';

// Services
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user';
import { FormsModule } from '@angular/forms';

interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  avgSessionTime: number;
  avgScore: number;
  topPerformers: User[];
  usersByLevel: any[];
  activityOverTime: any[];
  engagementMetrics: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    retentionRate: number;
  };
}

@Component({
  selector: 'app-user-analytics',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ChartModule,
    FormsModule
  ],
  templateUrl: './user-analytics.component.html',
  styleUrls: ['./user-analytics.component.css']
})
export class UserAnalyticsComponent implements OnInit {
  loading = true;
  analytics: UserAnalytics = {
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    avgSessionTime: 0,
    avgScore: 0,
    topPerformers: [],
    usersByLevel: [],
    activityOverTime: [],
    engagementMetrics: {
      dailyActiveUsers: 0,
      weeklyActiveUsers: 0,
      monthlyActiveUsers: 0,
      retentionRate: 0
    }
  };

  // Charts
  userLevelChart: any;
  activityChart: any;
  engagementChart: any;
  chartOptions: any;

  // Filters
  dateRange: Date[] = [];
  selectedPeriod = { label: 'Último mes', value: 30 };
  periodOptions = [
    { label: 'Última semana', value: 7 },
    { label: 'Último mes', value: 30 },
    { label: 'Últimos 3 meses', value: 90 },
    { label: 'Último año', value: 365 }
  ];

  constructor(
    private userService: UserService,
    private authService: AuthService
  ) {
    this.initializeChartOptions();
  }

  ngOnInit(): void {
    this.loadAnalytics();
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

  private loadAnalytics(): void {
    this.loading = true;
    const admin = this.authService.getCurrentAdmin();

    if (!admin) {
      this.loading = false;
      return;
    }

    // Cargar usuarios del admin
    this.userService.getUsersByAdmin(admin.id).subscribe({
      next: (users: User[]) => {
        this.processAnalytics(users);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading analytics:', error);
        this.loading = false;
      }
    });
  }

  private processAnalytics(users: User[]): void {
    // Datos básicos
    this.analytics.totalUsers = users.length;
    this.analytics.activeUsers = users.filter(u => u.is_active).length;

    // Usuarios nuevos este mes
    const thisMonth = new Date();
    thisMonth.setDate(1);
    this.analytics.newUsersThisMonth = users.filter(u =>
      new Date(u.created_at) >= thisMonth
    ).length;

    // Promedios (datos simulados por ahora)
    this.analytics.avgSessionTime = 45; // minutos
    this.analytics.avgScore = users.reduce((sum, u) => sum + (u.total_points || 0), 0) / users.length || 0;

    // Top performers
    this.analytics.topPerformers = users
      .sort((a, b) => (b.total_points || 0) - (a.total_points || 0))
      .slice(0, 10);

    // Métricas de engagement (simuladas)
    this.analytics.engagementMetrics = {
      dailyActiveUsers: Math.floor(this.analytics.activeUsers * 0.3),
      weeklyActiveUsers: Math.floor(this.analytics.activeUsers * 0.7),
      monthlyActiveUsers: this.analytics.activeUsers,
      retentionRate: 85
    };

    this.generateCharts(users);
  }

  private generateCharts(users: User[]): void {
    // Chart por niveles
    const levelCounts = Array.from({ length: 10 }, (_, i) => {
      const level = i + 1;
      return users.filter(u => u.level === level).length;
    });

    this.userLevelChart = {
      labels: Array.from({ length: 10 }, (_, i) => `Nivel ${i + 1}`),
      datasets: [{
        label: 'Usuarios por Nivel',
        data: levelCounts,
        backgroundColor: [
          '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d',
          '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'
        ],
        borderWidth: 0
      }]
    };

    // Chart de actividad en el tiempo
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const activityData = last7Days.map(() =>
      Math.floor(Math.random() * 50) + 10 // Datos simulados
    );

    this.activityChart = {
      labels: last7Days.map(date =>
        date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' })
      ),
      datasets: [{
        label: 'Usuarios Activos',
        data: activityData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };

    // Chart de engagement
    this.engagementChart = {
      labels: ['DAU', 'WAU', 'MAU'],
      datasets: [{
        label: 'Usuarios Activos',
        data: [
          this.analytics.engagementMetrics.dailyActiveUsers,
          this.analytics.engagementMetrics.weeklyActiveUsers,
          this.analytics.engagementMetrics.monthlyActiveUsers
        ],
        backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6'],
        borderWidth: 0
      }]
    };
  }

  onPeriodChange(): void {
    this.loadAnalytics();
  }

  exportAnalytics(): void {
    // Implementar exportación de analytics
    const data = {
      period: this.selectedPeriod.label,
      date: new Date().toISOString(),
      ...this.analytics
    };

    const blob = new Blob([JSON.stringify(data, null, 2)],
      { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `user-analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  getUserInitials(user: User): string {
    return user.full_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getLevelBadgeColor(level: number): string {
    if (level <= 2) return '#22c55e';
    if (level <= 5) return '#3b82f6';
    if (level <= 8) return '#f59e0b';
    return '#ef4444';
  }

  goBack(): void {
    window.history.back();
  }

  getAvatarGradient(index: number): string {
    const gradients = [
      'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',  // Gold
      'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',  // Silver
      'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',  // Bronze
      'linear-gradient(135deg, #10b981 0%, #059669 100%)',  // Green
      'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',  // Blue
      'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',  // Purple
      'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',  // Pink
      'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)',  // Teal
      'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',  // Orange
      'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'   // Cyan
    ];
    return gradients[index] || gradients[3];
  }
}