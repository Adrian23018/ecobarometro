import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

// PrimeNG
import { ChartModule } from 'primeng/chart';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Services
import { UserService } from '../../../core/services/user.service';
import { CategoryService } from '../../../core/services/category.service';
import { QuestionsService } from '../../../core/services/questions.service';
import { GameSessionService } from '../../../core/services/game-session.service';
import { AuthService } from '../../../core/services/auth.service';

// Models
import { User } from '../../../core/models/user';
import { Category } from '../../../core/models/category';

interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  completionRate: number;
  avgScore: number;
  totalPoints: number;
  avgSessionDuration: number;
}

interface LevelDistribution {
  level: number;
  count: number;
  percentage: number;
  color: string;
}

interface CategoryStats {
  id: string;
  name: string;
  icon: string;
  totalQuestions: number;
  totalSessions: number;
  avgScore: number;
  completionRate: number;
}

interface RecentActivity {
  type: 'user_registered' | 'game_completed';
  description: string;
  timestamp: Date;
  icon: string;
}

interface UserEngagement {
  champions: number;
  active: number;
  casual: number;
  atRisk: number;
}

@Component({
  selector: 'app-user-analytics',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ChartModule,
    ToastModule,
    DecimalPipe
  ],
  providers: [MessageService],
  templateUrl: './users-analytics.component.html',
  styleUrls: ['./users-analytics.component.css']
})
export class UserAnalyticsComponent implements OnInit {
  loading = true;
  timeframe: '7d' | '30d' | '90d' | 'all' = '30d';

  // Data
  metrics: UserMetrics = {
    totalUsers: 0,
    activeUsers: 0,
    totalSessions: 0,
    completionRate: 0,
    avgScore: 0,
    totalPoints: 0,
    avgSessionDuration: 0
  };

  levelDistribution: LevelDistribution[] = [];
  topUsers: User[] = [];
  categoryStats: CategoryStats[] = [];
  recentActivity: RecentActivity[] = [];
  engagement: UserEngagement = {
    champions: 0,
    active: 0,
    casual: 0,
    atRisk: 0
  };

  // Charts
  userActivityChart: any;
  lineChartOptions: any;

  // Raw data
  private allUsers: User[] = [];
  private allSessions: any[] = [];
  private allCategories: Category[] = [];
  private currentAdminId: string = '';

  constructor(
    private userService: UserService,
    private categoryService: CategoryService,
    private questionService: QuestionsService,
    private gameSessionService: GameSessionService,
    private authService: AuthService,
    private messageService: MessageService
  ) {
    this.initializeChartOptions();
  }

  ngOnInit(): void {
    const admin = this.authService.getCurrentAdmin();
    if (admin) {
      this.currentAdminId = admin.id;
      this.loadAnalyticsData();
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo identificar al administrador'
      });
      this.loading = false;
    }
  }

  loadAnalyticsData(): void {
    this.loading = true;

    forkJoin({
      users: this.userService.getUsersByAdmin(this.currentAdminId),
      sessions: this.gameSessionService.searchSessions({ adminId: this.currentAdminId }),
      categories: this.categoryService.getCategoriesByAdmin(this.currentAdminId)
    }).subscribe({
      next: ({ users, sessions, categories }) => {
        this.allUsers = users;
        this.allSessions = sessions;
        this.allCategories = categories;

        this.calculateMetrics();
        this.calculateLevelDistribution();
        this.calculateTopUsers();
        this.calculateCategoryStats();
        this.calculateRecentActivity();
        this.calculateEngagement();
        this.generateUserActivityChart();

        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading analytics data:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las analíticas'
        });
        this.loading = false;
      }
    });
  }

  calculateMetrics(): void {
    const users = this.allUsers;
    const sessions = this.allSessions;

    this.metrics.totalUsers = users.length;
    this.metrics.activeUsers = users.filter(u => u.is_active).length;
    this.metrics.totalSessions = sessions.length;

    // Completion rate
    const completedSessions = sessions.filter((s: any) => s.status === 'completed').length;
    this.metrics.completionRate = sessions.length > 0
      ? Math.round((completedSessions / sessions.length) * 100)
      : 0;

    // Average score
    const sessionsWithScore = sessions.filter((s: any) => s.total_questions && s.total_questions > 0);
    if (sessionsWithScore.length > 0) {
      const totalScore = sessionsWithScore.reduce((sum: number, s: any) => {
        const score = (s.correct_answers || 0) / (s.total_questions || 1) * 100;
        return sum + score;
      }, 0);
      this.metrics.avgScore = Math.round(totalScore / sessionsWithScore.length);
    }

    // Total points
    this.metrics.totalPoints = users.reduce((sum, u) => sum + (u.total_points || 0), 0);

    // Average session duration (in minutes)
    const sessionsWithDuration = sessions.filter((s: any) => s.started_at && s.completed_at);
    if (sessionsWithDuration.length > 0) {
      const totalDuration = sessionsWithDuration.reduce((sum: number, s: any) => {
        const start = new Date(s.started_at).getTime();
        const end = new Date(s.completed_at).getTime();
        const durationMinutes = (end - start) / (1000 * 60);
        return sum + durationMinutes;
      }, 0);
      this.metrics.avgSessionDuration = Math.round(totalDuration / sessionsWithDuration.length);
    }
  }

  calculateLevelDistribution(): void {
    const levelCounts: { [key: number]: number } = {};
    const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#a855f7'];

    this.allUsers.forEach(u => {
      const level = u.level || 1;
      levelCounts[level] = (levelCounts[level] || 0) + 1;
    });

    const total = this.allUsers.length || 1;
    this.levelDistribution = Object.entries(levelCounts)
      .map(([level, count]) => ({
        level: parseInt(level),
        count: count,
        percentage: Math.round((count / total) * 100),
        color: colors[parseInt(level) - 1] || colors[0]
      }))
      .sort((a, b) => a.level - b.level)
      .slice(0, 10);
  }

  calculateTopUsers(): void {
    this.topUsers = [...this.allUsers]
      .filter(u => u.total_points && u.total_points > 0)
      .sort((a, b) => (b.total_points || 0) - (a.total_points || 0))
      .slice(0, 10);
  }

  calculateCategoryStats(): void {
    this.categoryStats = this.allCategories.map(cat => {
      // Count questions per category
      const categoryQuestions = this.allSessions.filter((s: any) => s.category_id === cat.id);

      const completedSessions = categoryQuestions.filter((s: any) => s.status === 'completed');
      const completionRate = categoryQuestions.length > 0
        ? Math.round((completedSessions.length / categoryQuestions.length) * 100)
        : 0;

      // Calculate avg score for this category
      const sessionsWithScore = categoryQuestions.filter((s: any) => s.total_questions && s.total_questions > 0);
      let avgScore = 0;
      if (sessionsWithScore.length > 0) {
        const totalScore = sessionsWithScore.reduce((sum: number, s: any) => {
          const score = (s.correct_answers || 0) / (s.total_questions || 1) * 100;
          return sum + score;
        }, 0);
        avgScore = Math.round(totalScore / sessionsWithScore.length);
      }

      return {
        id: cat.id,
        name: cat.name,
        icon: cat.icon || '📚',
        totalQuestions: cat.question_count || 0,
        totalSessions: categoryQuestions.length,
        avgScore: avgScore,
        completionRate: completionRate
      };
    });
  }

  calculateRecentActivity(): void {
    const activities: RecentActivity[] = [];

    // Recent user registrations
    this.allUsers
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .forEach(user => {
        activities.push({
          type: 'user_registered',
          description: `${user.full_name || user.username} se unió al EcoBarómetro`,
          timestamp: new Date(user.created_at),
          icon: '👤'
        });
      });

    // Recent completed sessions
    this.allSessions
      .filter((s: any) => s.status === 'completed')
      .sort((a: any, b: any) => new Date(b.completed_at || b.created_at).getTime() - new Date(a.completed_at || a.created_at).getTime())
      .slice(0, 5)
      .forEach((session: any) => {
        activities.push({
          type: 'game_completed',
          description: `Partida completada · ${session.correct_answers ?? 0}/${session.total_questions ?? 0} correctas · ${session.total_points ?? 0} pts`,
          timestamp: new Date(session.completed_at || session.created_at),
          icon: '🎮'
        });
      });

    // Sort all activities by timestamp and take top 10
    this.recentActivity = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
  }

  calculateEngagement(): void {
    // Segment users by average score performance
    const usersWithScores = this.allUsers.filter(u => u.total_points && u.total_points > 0);

    usersWithScores.forEach(user => {
      // Calculate average score percentage for this user
      const userSessions = this.allSessions.filter((s: any) => s.user_id === user.id && s.total_questions > 0);
      if (userSessions.length > 0) {
        const avgScorePct = userSessions.reduce((sum: number, s: any) => {
          const score = (s.correct_answers || 0) / (s.total_questions || 1) * 100;
          return sum + score;
        }, 0) / userSessions.length;

        if (avgScorePct > 80) {
          this.engagement.champions++;
        } else if (avgScorePct >= 60) {
          this.engagement.active++;
        } else if (avgScorePct >= 40) {
          this.engagement.casual++;
        } else {
          this.engagement.atRisk++;
        }
      }
    });
  }

  generateUserActivityChart(): void {
    // Generate last 30 days of data
    const days: string[] = [];
    const userActivityData: number[] = [];
    const sessionsData: number[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      days.push(dateStr);

      // Count users created on this day
      const usersOnDay = this.allUsers.filter(u => {
        const createdDate = new Date(u.created_at);
        return createdDate.toDateString() === date.toDateString();
      }).length;
      userActivityData.push(usersOnDay);

      // Count sessions completed on this day
      const sessionsOnDay = this.allSessions.filter((s: any) => {
        const sessionDate = new Date(s.completed_at || s.created_at);
        return sessionDate.toDateString() === date.toDateString();
      }).length;
      sessionsData.push(sessionsOnDay);
    }

    this.userActivityChart = {
      labels: days,
      datasets: [
        {
          label: 'Nuevos Usuarios',
          data: userActivityData,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 3
        },
        {
          label: 'Partidas Completadas',
          data: sessionsData,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true,
          borderWidth: 3
        }
      ]
    };
  }

  initializeChartOptions(): void {
    this.lineChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: { size: 11 }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f0ede8' },
          ticks: { font: { size: 10 } }
        },
        x: {
          grid: { color: '#f0ede8' },
          ticks: { font: { size: 10 } }
        }
      }
    };
  }

  setTimeframe(timeframe: '7d' | '30d' | '90d' | 'all'): void {
    this.timeframe = timeframe;
    // Could filter data based on timeframe here
    this.messageService.add({
      severity: 'info',
      summary: 'Filtro Aplicado',
      detail: `Mostrando datos de: ${this.getTimeframeLabel(timeframe)}`
    });
  }

  getTimeframeLabel(timeframe: string): string {
    switch (timeframe) {
      case '7d': return 'Última semana';
      case '30d': return 'Último mes';
      case '90d': return 'Últimos 3 meses';
      case 'all': return 'Todo el tiempo';
      default: return '';
    }
  }

  exportReport(): void {
    // Create CSV report
    const csvData = [
      ['Métrica', 'Valor'],
      ['Total Usuarios', this.metrics.totalUsers.toString()],
      ['Usuarios Activos', this.metrics.activeUsers.toString()],
      ['Total Partidas', this.metrics.totalSessions.toString()],
      ['Tasa de Finalización', `${this.metrics.completionRate}%`],
      ['Puntuación Media', `${this.metrics.avgScore}%`],
      ['Puntos Totales', this.metrics.totalPoints.toString()],
      ['Duración Media Sesión', `${this.metrics.avgSessionDuration}m`],
      ['', ''],
      ['Top 10 Usuarios', ''],
      ['Posición', 'Nombre', 'Usuario', 'Puntos', 'Nivel'],
      ...this.topUsers.map((u, i) => [
        (i + 1).toString(),
        u.full_name || '',
        u.username || '',
        (u.total_points || 0).toString(),
        (u.level || 1).toString()
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ecobarometro-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.messageService.add({
      severity: 'success',
      summary: 'Exportado',
      detail: 'Reporte descargado correctamente'
    });
  }
}
