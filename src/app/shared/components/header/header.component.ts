// src/app/shared/components/header/header.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { Observable } from 'rxjs';

export interface HeaderUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  level: number;
  points: number;
  role: 'user' | 'admin';
}

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  @Input() user: HeaderUser | null = null;
  @Input() showNotifications: boolean = true;
  @Input() showSearch: boolean = true;
  @Input() variant: 'default' | 'game' | 'admin' = 'default';
  
  @Output() menuToggle = new EventEmitter<void>();
  @Output() searchQuery = new EventEmitter<string>();
  @Output() notificationClick = new EventEmitter<void>();
  @Output() profileClick = new EventEmitter<void>();

  notifications: any[] = [];
  unreadCount: number = 0;
  searchText: string = '';
  showUserMenu: boolean = false;
  showNotificationPanel: boolean = false;

  userStats$: Observable<any> | undefined;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    public router: Router
  ) {}

  ngOnInit() {
    this.loadNotifications();
    if (this.user?.role === 'user') {
      this.userStats$ = this.userService.userStats$;
    }
  }

  private loadNotifications() {
    // Simular notificaciones
    this.notifications = [
      {
        id: '1',
        type: 'achievement',
        title: '¡Nuevo logro desbloqueado!',
        message: 'Has obtenido el logro "Eco Explorador"',
        time: '2 min',
        read: false,
        icon: 'pi-trophy',
        color: '#f59e0b'
      },
      {
        id: '2',
        type: 'level',
        title: '¡Subiste de nivel!',
        message: 'Ahora eres Nivel 5 - Guardián Verde',
        time: '1 hora',
        read: false,
        icon: 'pi-star',
        color: '#22c55e'
      },
      {
        id: '3',
        type: 'challenge',
        title: 'Nuevo desafío disponible',
        message: 'El desafío semanal de Energía Renovable ya está activo',
        time: '3 horas',
        read: true,
        icon: 'pi-bolt',
        color: '#3b82f6'
      }
    ];
    
    this.unreadCount = this.notifications.filter(n => !n.read).length;
  }

  onSearch() {
    if (this.searchText.trim()) {
      this.searchQuery.emit(this.searchText.trim());
    }
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
    this.showNotificationPanel = false;
  }

  toggleNotifications() {
    this.showNotificationPanel = !this.showNotificationPanel;
    this.showUserMenu = false;
    this.notificationClick.emit();
  }

  onNotificationClick(notification: any) {
    if (!notification.read) {
      notification.read = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
    }
    
    // Navegar según el tipo de notificación
    switch (notification.type) {
      case 'achievement':
        this.router.navigate(['/user/achievements']);
        break;
      case 'level':
        this.router.navigate(['/user/profile']);
        break;
      case 'challenge':
        this.router.navigate(['/user/challenges']);
        break;
    }
    
    this.showNotificationPanel = false;
  }

  navigateToProfile() {
    this.profileClick.emit();
    if (this.user?.role === 'admin') {
      this.router.navigate(['/admin/profile']);
    } else {
      this.router.navigate(['/user/profile']);
    }
    this.showUserMenu = false;
  }

  navigateToSettings() {
    if (this.user?.role === 'admin') {
      this.router.navigate(['/admin/settings']);
    } else {
      this.router.navigate(['/user/settings']);
    }
    this.showUserMenu = false;
  }

  navigateToDashboard() {
    if (this.user?.role === 'admin') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/user/dashboard']);
    }
    this.showUserMenu = false;
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/auth/login']);
    });
    this.showUserMenu = false;
  }

  getLevelColor(level: number): string {
    if (level < 5) return '#22c55e';
    if (level < 10) return '#16a34a';
    if (level < 20) return '#15803d';
    if (level < 50) return '#fbbf24';
    return '#f59e0b';
  }

  getAvatarInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  closeMenus() {
    this.showUserMenu = false;
    this.showNotificationPanel = false;
  }
}