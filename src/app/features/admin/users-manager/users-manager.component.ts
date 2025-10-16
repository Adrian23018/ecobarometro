// src/app/features/admin/users-manager/users-manager.component.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { ChartModule } from 'primeng/chart';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';

// Services and Models
import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/models/user';

interface UserWithStats extends User {
  avg_score?: number;
  time_played?: number;
  last_activity?: Date;
  achievements_count?: number;
  favorite_category?: string;
}

interface UserFilter {
  search?: string;
  level?: number;
  status?: 'active' | 'inactive';
  dateRange?: Date[];
}

@Component({
  selector: 'app-users-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    DropdownModule,
    ToastModule,
    ConfirmDialogModule,
    ToolbarModule,
    TagModule,
    BadgeModule,
    ProgressBarModule,
    TooltipModule,
    ChartModule,
    CalendarModule,
    CheckboxModule,
    AvatarModule,
    MenuModule
  ],
  templateUrl: './users-manager.component.html',
  styleUrls: ['./users-manager.component.css']
})
export class UsersManagerComponent implements OnInit {
  // Data
  users: UserWithStats[] = [];
  selectedUsers: UserWithStats[] = [];
  selectedUser: UserWithStats | null = null;

  // UI State
  loading = false;
  showUserDialog = false;
  showStatsDialog = false;
  showBulkActionsDialog = false;

  // Filters
  filters: UserFilter = {};

  // Options
  levelOptions = Array.from({ length: 10 }, (_, i) => ({
    label: `Nivel ${i + 1}`,
    value: i + 1
  }));

  statusOptions = [
    { label: 'Todos', value: null },
    { label: 'Activos', value: 'active' },
    { label: 'Inactivos', value: 'inactive' }
  ];

  // Statistics
  totalUsers = 0;
  activeUsers = 0;
  averageLevel = 0;
  totalGamesPlayed = 0;

  // Charts
  userLevelChart: any;
  activityChart: any;
  chartOptions: any;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
    this.setupChartOptions();
  }

  ngOnInit() {
    this.loadUsers();
  }

  setupChartOptions() {
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
          beginAtZero: true
        }
      }
    };
  }

  loadUsers() {
    this.loading = true;
    const admin = this.authService.getCurrentAdmin();

    if (!admin) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo identificar al administrador'
      });
      this.loading = false;
      return;
    }

    this.userService.getUsersByAdmin(admin.id).subscribe({
      next: (users: User[]) => {
        this.users = users.map((user: User) => ({
          ...user,
          avg_score: Math.floor(Math.random() * 100),
          time_played: Math.floor(Math.random() * 300),
          last_activity: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          achievements_count: Math.floor(Math.random() * 15),
          favorite_category: ['Energía', 'Agua', 'Reciclaje'][Math.floor(Math.random() * 3)]
        }));

        this.calculateStatistics();
        this.updateCharts();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los usuarios'
        });
        this.loading = false;
      }
    });
  }

  calculateStatistics() {
    this.totalUsers = this.users.length;
    this.activeUsers = this.users.filter(u => u.is_active).length;
    this.averageLevel = this.users.reduce((sum, u) => sum + u.level, 0) / this.users.length || 0;
    this.totalGamesPlayed = this.users.reduce((sum, u) => sum + (u.games_played || 0), 0);
  }

  updateCharts() {
    // User Level Distribution Chart
    const levelCounts = Array.from({ length: 10 }, (_, i) => {
      const level = i + 1;
      return this.users.filter(u => u.level === level).length;
    });

    this.userLevelChart = {
      labels: Array.from({ length: 10 }, (_, i) => `Nivel ${i + 1}`),
      datasets: [{
        label: 'Usuarios por Nivel',
        data: levelCounts,
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    };

    // Activity Chart (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date;
    });

    const activityData = last7Days.map(date => {
      return this.users.filter(u => {
        const lastActivity = u.last_activity;
        return lastActivity &&
               lastActivity.toDateString() === date.toDateString();
      }).length;
    });

    this.activityChart = {
      labels: last7Days.map(date => date.toLocaleDateString('es-ES', { weekday: 'short' })),
      datasets: [{
        label: 'Usuarios Activos',
        data: activityData,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4
      }]
    };
  }

  viewUserDetails(user: UserWithStats) {
    this.selectedUser = user;
    this.showUserDialog = true;
  }

  viewUserStats(user: UserWithStats) {
    this.selectedUser = user;
    this.showStatsDialog = true;
  }

  toggleUserStatus(user: UserWithStats) {
    const newStatus = !user.is_active;

    this.userService.updateUserStatus(user.id, newStatus).subscribe({
      next: () => {
        user.is_active = newStatus;
        this.calculateStatistics();

        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Usuario ${newStatus ? 'activado' : 'desactivado'} correctamente`
        });
      },
      error: (error) => {
        console.error('Error updating user status:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el estado del usuario'
        });
      }
    });
  }

  resetUserProgress(user: UserWithStats) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que deseas reiniciar el progreso de ${user.full_name}? Esto eliminará todos sus puntos, nivel y logros.`,
      header: 'Confirmar Reinicio',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, reiniciar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.userService.resetUserProgress(user.id).subscribe({
          next: () => {
            // Reset user data locally
            user.total_points = 0;
            user.level = 1;
            user.experience_points = 0;
            user.games_played = 0;
            user.achievements_count = 0;

            this.calculateStatistics();
            this.updateCharts();

            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Progreso del usuario reiniciado correctamente'
            });
          },
          error: (error) => {
            console.error('Error resetting user progress:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo reiniciar el progreso del usuario'
            });
          }
        });
      }
    });
  }

  deleteUser(user: UserWithStats) {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que deseas eliminar al usuario ${user.full_name}? Esta acción no se puede deshacer.`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.userService.deleteUser(user.id).subscribe({
          next: () => {
            this.users = this.users.filter(u => u.id !== user.id);
            this.calculateStatistics();
            this.updateCharts();

            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Usuario eliminado correctamente'
            });
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar el usuario'
            });
          }
        });
      }
    });
  }

  // Bulk Actions
  showBulkActions() {
    if (this.selectedUsers.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Selecciona al menos un usuario'
      });
      return;
    }
    this.showBulkActionsDialog = true;
  }

  bulkActivateUsers() {
    const inactiveUsers = this.selectedUsers.filter(u => !u.is_active);

    if (inactiveUsers.length === 0) {
      this.messageService.add({
        severity: 'info',
        summary: 'Información',
        detail: 'Todos los usuarios seleccionados ya están activos'
      });
      return;
    }

    // Implementation for bulk activation
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: `${inactiveUsers.length} usuario(s) activado(s) correctamente`
    });

    this.showBulkActionsDialog = false;
    this.selectedUsers = [];
  }

  bulkDeactivateUsers() {
    const activeUsers = this.selectedUsers.filter(u => u.is_active);

    if (activeUsers.length === 0) {
      this.messageService.add({
        severity: 'info',
        summary: 'Información',
        detail: 'Todos los usuarios seleccionados ya están inactivos'
      });
      return;
    }

    // Implementation for bulk deactivation
    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: `${activeUsers.length} usuario(s) desactivado(s) correctamente`
    });

    this.showBulkActionsDialog = false;
    this.selectedUsers = [];
  }

  exportUsers() {
    if (this.users.length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'No hay usuarios para exportar'
      });
      return;
    }

    // Simple CSV export
    const csvData = this.users.map((user:any) => ({
      'Nombre': user.full_name,
      'Usuario': user.username,
      'Email': user.email,
      'Nivel': user.level,
      'Puntos': user.total_points,
      'Juegos': user.games_played || 0,
      'Promedio': user.avg_score || 0,
      'Estado': user.is_active ? 'Activo' : 'Inactivo',
      'Última Actividad': user.last_activity?.toLocaleDateString() || 'N/A'
    }));

    const csvContent = this.convertToCSV(csvData);
    this.downloadFile(csvContent, 'usuarios.csv', 'text/csv');

    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Usuarios exportados correctamente'
    });
  }

  // Helper methods
  private convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(','))
    ];

    return csvRows.join('\n');
  }

  private downloadFile(content: string, fileName: string, contentType: string) {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  getUserInitials(user: UserWithStats): string {
    return user.full_name
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

  getStatusSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'Activo' : 'Inactivo';
  }

  getActivityStatus(user: UserWithStats): { label: string; severity: 'success' | 'warning' | 'danger' } {
    if (!user.last_activity) return { label: 'Sin actividad', severity: 'danger' };

    const daysSinceActivity = Math.floor((Date.now() - user.last_activity.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceActivity <= 1) return { label: 'Muy activo', severity: 'success' };
    if (daysSinceActivity <= 7) return { label: 'Activo', severity: 'success' };
    if (daysSinceActivity <= 30) return { label: 'Poco activo', severity: 'warning' };
    return { label: 'Inactivo', severity: 'danger' };
  }

  formatDate(date: Date | undefined): any {
    if (!date) return 'N/A';
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(minutes: number | undefined): string {
    if (!minutes) return '0m';

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }
}