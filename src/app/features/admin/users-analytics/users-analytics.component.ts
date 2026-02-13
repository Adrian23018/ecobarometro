import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconPipe } from '../../../shared/pipes/icon.pipe';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';
import { TabViewModule } from 'primeng/tabview';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { KnobModule } from 'primeng/knob';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { User } from '../../../core/models/user';
import { UserService } from '../../../core/services/user.service';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/category';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Services


// Models


interface AnalyticsFilters {
  dateRange: Date[];
  categories: string[];
  userStatus: string;
  timeframe: string;
}

interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  retentionRate: number;
  avgSessionDuration: number;
  avgScore: number;
  completionRate: number;
  totalGamesSessions: number;
}

interface CategoryPerformance {
  category: Category;
  totalAttempts: number;
  avgScore: number;
  completionRate: number;
  topUsers: User[];
}

@Component({
  selector: 'app-user-analytics',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TableModule,
    ChartModule,
    DropdownModule,
    CalendarModule,
    TabViewModule,
    ProgressBarModule,
    BadgeModule,
    TagModule,
    AvatarModule,
    KnobModule,
    TooltipModule,
    InputTextModule,
    MultiSelectModule,
    OverlayPanelModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IconPipe
  ],
  templateUrl: './users-analytics.component.html',
  styles: [`
    .user-analytics {
      padding: 1rem;
    }

    .surface-hover:hover {
      background-color: var(--surface-hover);
    }

    @media (max-width: 768px) {
      .user-analytics {
        padding: 0.5rem;
      }
    }
  `]
})
export class UserAnalyticsComponent implements OnInit {
  // UI State
  activeTabIndex = 0;
  loading = false;

  // Data
  metrics: UserMetrics = {
    totalUsers: 0,
    activeUsers: 0,
    newUsersThisMonth: 0,
    retentionRate: 0,
    avgSessionDuration: 0,
    avgScore: 0,
    completionRate: 0,
    totalGamesSessions: 0
  };

  categoryPerformance: CategoryPerformance[] = [];
  topPerformers: User[] = [];
  recentActivity: any[] = [];

  // Filters
  filters: AnalyticsFilters = {
    dateRange: [],
    categories: [],
    userStatus: 'all',
    timeframe: 'month'
  };

  // Options
  categoryOptions: any[] = [];
  userStatusOptions = [
    { label: 'Todos los usuarios', value: 'all' },
    { label: 'Usuarios activos', value: 'active' },
    { label: 'Usuarios nuevos', value: 'new' },
    { label: 'Usuarios inactivos', value: 'inactive' }
  ];

  timeframeOptions = [
    { label: 'Última semana', value: 'week' },
    { label: 'Último mes', value: 'month' },
    { label: 'Último trimestre', value: 'quarter' },
    { label: 'Último año', value: 'year' }
  ];

  // Charts
  userActivityChart: any;
  userLevelChart: any;
  categoryPerformanceChart: any;
  sessionDurationChart: any;
  userGrowthChart: any;
  scoreTrendsChart: any;

  // Chart Options
  lineChartOptions: any;
  doughnutChartOptions: any;
  barChartOptions: any;

  // Segments
  userSegments = {
    champions: 25,
    active: 45,
    casual: 35,
    atRisk: 15
  };

  // Predictions
  predictions = {
    newUsersNextMonth: 35,
    avgScoreImprovement: 12,
    completionRateTarget: 85
  };

  constructor(
    private userService: UserService,
    private categoryService: CategoryService,
  ) {
    this.initializeChartOptions();
    this.setDefaultDateRange();
  }

  ngOnInit(): void {
    this.loadAnalyticsData();
  }

  setDefaultDateRange(): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 1);
    this.filters.dateRange = [startDate, endDate];
  }

  loadAnalyticsData(): void {
    this.loading = true;

    // Cargar datos de ejemplo
    this.loadMetrics();
    this.loadCategoryOptions();
    this.loadCategoryPerformance();
    this.loadTopPerformers();
    this.loadRecentActivity();
    this.initializeCharts();

    this.loading = false;
  }

  loadMetrics(): void {
    // Datos de ejemplo - aquí se cargarían desde el backend
    this.metrics = {
      totalUsers: 156,
      activeUsers: 89,
      newUsersThisMonth: 23,
      retentionRate: 78,
      avgSessionDuration: 12,
      avgScore: 75,
      completionRate: 82,
      totalGamesSessions: 342
    };
  }

  loadCategoryOptions(): void {
    // Cargar desde el service real
    const adminData = localStorage.getItem('admin');
    if (adminData) {
      const admin = JSON.parse(adminData);
      this.categoryService.getCategoriesByAdmin(admin.id).subscribe({
        next: (categories) => {
          this.categoryOptions = categories.map(cat => ({
            label: cat.name,
            value: cat.id
          }));
        }
      });
    }
  }

  loadCategoryPerformance(): void {
    // Datos de ejemplo
    this.categoryPerformance = [
      {
        category: { id: '1', name: 'Energía', icon: 'pi pi-bolt', color: '#f59e0b' } as Category,
        totalAttempts: 245,
        avgScore: 78,
        completionRate: 85,
        topUsers: []
      },
      {
        category: { id: '2', name: 'Agua', icon: 'pi pi-tint', color: '#3b82f6' } as Category,
        totalAttempts: 198,
        avgScore: 82,
        completionRate: 88,
        topUsers: []
      }
    ];
  }

  loadTopPerformers(): void {
    // Datos de ejemplo
    this.topPerformers = [
      {
        id: '1',
        username: 'eco_hero',
        full_name: 'María García',
        total_points: 1580,
        level: 6,
        avatar_url: ''
      } as User
    ];
  }

  loadRecentActivity(): void {
    this.recentActivity = [
      {
        description: 'Juan Pérez completó EcoChallenge',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        type: 'game_completed',
        user: { full_name: 'Juan Pérez', avatar_url: '' }
      },
      {
        description: 'Ana López se registró',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        type: 'user_registered',
        user: { full_name: 'Ana López', avatar_url: '' }
      }
    ];
  }

  initializeCharts(): void {
    // User Activity Chart
    this.userActivityChart = {
      labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      datasets: [
        {
          label: 'Usuarios Activos',
          data: [32, 42, 38, 45, 52, 35, 28],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Partidas Completadas',
          data: [24, 35, 28, 38, 42, 28, 22],
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };

    // User Level Chart
    this.userLevelChart = {
      labels: ['Nivel 1', 'Nivel 2', 'Nivel 3', 'Nivel 4', 'Nivel 5+'],
      datasets: [{
        data: [45, 35, 25, 15, 8],
        backgroundColor: ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6']
      }]
    };

    // Category Performance Chart
    this.categoryPerformanceChart = {
      labels: ['Energía', 'Agua', 'Residuos', 'Transporte'],
      datasets: [
        {
          label: 'Puntuación Promedio (%)',
          data: [78, 82, 75, 70],
          backgroundColor: '#3b82f6'
        },
        {
          label: 'Tasa de Finalización (%)',
          data: [85, 88, 80, 76],
          backgroundColor: '#22c55e'
        }
      ]
    };

    // Session Duration Chart
    this.sessionDurationChart = {
      labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
      datasets: [{
        label: 'Duración Promedio (min)',
        data: [8, 10, 12, 11],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };

    // User Growth Chart
    this.userGrowthChart = {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      datasets: [{
        label: 'Nuevos Usuarios',
        data: [12, 19, 15, 23, 18, 25],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };

    // Score Trends Chart
    this.scoreTrendsChart = {
      labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'],
      datasets: [{
        label: 'Puntuación Promedio (%)',
        data: [68, 72, 75, 78],
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };
  }

  initializeChartOptions(): void {
    this.lineChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
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

    this.doughnutChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    };

    this.barChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
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

  updateAnalytics(): void {
    // Actualizar analytics basado en filtros
    this.loadAnalyticsData();
  }

  exportReport(): void {
    // Implementar exportación de reporte
    console.log('Exportando reporte...');
  }

  getActivitySeverity(type: string): any {
    switch (type) {
      case 'game_completed': return 'success';
      case 'user_registered': return 'info';
      case 'achievement_earned': return 'warning';
      default: return 'secondary';
    }
  }

  getRankSeverity(index: number): any {
    switch (index) {
      case 0: return 'warning'; // Gold
      case 1: return 'secondary'; // Silver
      case 2: return 'contrast'; // Bronze
      default: return 'info';
    }
  }
}