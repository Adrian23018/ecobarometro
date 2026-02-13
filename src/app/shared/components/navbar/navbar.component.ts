// src/app/shared/components/navbar/navbar.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { MessageService } from 'primeng/api';

interface NavbarUser {
  id: string;
  name?: string;
  username?: string;
  full_name?: string;
  email: string;
  role: 'user' | 'admin';
  level?: number;
  points?: number;
  total_points?: number;
  avatar_url?: string;
}

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class NavbarComponent implements OnInit, OnDestroy {
  @ViewChild('hamburgerMenu', { static: false }) hamburgerMenu!: ElementRef;

  currentUser: NavbarUser | null = null;
  isMenuOpen = false;
  private destroy$ = new Subject<void>();

  // Menu items for different user types
  userMenuItems = [
    { label: 'Dashboard',         icon: 'pi pi-home',      route: '/user/dashboard',     roles: ['user'] },
    { label: 'Jugar EcoChallenge',icon: 'pi pi-play',      route: '/game/lobby',         roles: ['user'] },
    { label: 'Ranking Global',    icon: 'pi pi-chart-bar', route: '/game/leaderboard',   roles: ['user'] },
    { label: 'Mi Ranking',        icon: 'pi pi-trophy',    route: '/user/ranking',       roles: ['user'] },
    { label: 'Mis Logros',        icon: 'pi pi-star',      route: '/user/achievements',  roles: ['user'] },
    { label: 'Mi Perfil',         icon: 'pi pi-user',      route: '/user/profile',       roles: ['user'] },
  ];

  adminMenuItems = [
    { label: 'Panel Admin',       icon: 'pi pi-desktop',        route: '/admin/dashboard',    roles: ['admin'] },
    { label: 'Categorías',        icon: 'pi pi-tags',           route: '/admin/categories',   roles: ['admin'] },
    { label: 'Preguntas',         icon: 'pi pi-question-circle',route: '/admin/questions',    roles: ['admin'] },
    { label: 'Usuarios',          icon: 'pi pi-users',          route: '/admin/users',        roles: ['admin'] },
    { label: 'Analíticas',        icon: 'pi pi-chart-bar',      route: '/admin/analytics',    roles: ['admin'] },
    { label: 'Logros',            icon: 'pi pi-star',           route: '/admin/achievements', roles: ['admin'] },
    { label: 'Videos',            icon: 'pi pi-video',          route: '/admin/videos',       roles: ['admin'] },
    { label: 'Mi Perfil',         icon: 'pi pi-user',           route: '/admin/profile',      roles: ['admin'] },
    { label: 'Configuración',     icon: 'pi pi-cog',            route: '/admin/settings',     roles: ['admin'] },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadCurrentUser();
    this.setupClickOutsideListener();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCurrentUser() {
    this.authService.authState
      .pipe(takeUntil(this.destroy$))
      .subscribe(authState => {
        if (authState.isAuthenticated) {
          if (authState.user) {
            this.currentUser = {
              id: authState.user.id,
              name: authState.user.full_name,
              username: authState.user.username,
              email: authState.user.email,
              role: 'user',
              level: authState.user.level,
              points: authState.user.total_points,
              avatar_url: authState.user.avatar_url
            };
          } else if (authState.admin) {
            this.currentUser = {
              id: authState.admin.id,
              name: authState.admin.name,
              email: authState.admin.email,
              role: 'admin',
              avatar_url: authState.admin.avatar_url
            };
          }
        } else {
          this.currentUser = null;
        }
      });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  private setupClickOutsideListener() {
    document.addEventListener('click', (event) => {
      if (this.hamburgerMenu && !this.hamburgerMenu.nativeElement.contains(event.target)) {
        this.closeMenu();
      }
    });
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
    this.closeMenu();
  }

  logout() {
    // Show confirmation message
    this.messageService.add({
      severity: 'info',
      summary: 'Cerrando Sesión',
      detail: 'Hasta pronto! Tu progreso se ha guardado.',
      life: 2000
    });

    // Close menu
    this.closeMenu();

    // Logout after brief delay to show message
    setTimeout(() => {
      console.log('🚪 Cerrando sesión desde navbar...');
      this.cleanupStorageKeepingProgress();
      this.authService.logout();
    }, 1000);
  }

  private cleanupStorageKeepingProgress() {
    // Guardar el progreso antes de limpiar
    const progress = localStorage.getItem('ecobarometro_progress');

    console.log('💾 Guardando progreso antes de logout:', progress);

    // Limpiar localStorage (excepto progreso)
    const keysToRemove = [
      'ecobarometro_token',
      'ecobarometro_user',
      'ecobarometro_admin',
      'ecobarometro_remember',
      'sb-vxnfosrtarscqbdrethl-auth-token'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ Removido: ${key}`);
    });

    // Limpiar sessionStorage completamente
    sessionStorage.clear();
    console.log('🗑️ SessionStorage limpiado');

    // Restaurar el progreso
    if (progress) {
      localStorage.setItem('ecobarometro_progress', progress);
      console.log('✅ Progreso restaurado');
    }
  }

  get displayName(): string {
    if (!this.currentUser) return '';

    if (this.currentUser.role === 'admin') {
      return this.currentUser.name || this.currentUser.email;
    } else {
      return this.currentUser.name || this.currentUser.username || this.currentUser.email;
    }
  }

  get userInitials(): string {
    if (!this.currentUser) return '??';

    const name = this.displayName;
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  get availableMenuItems() {
    if (!this.currentUser) return [];

    return this.currentUser.role === 'admin' ? this.adminMenuItems : this.userMenuItems;
  }

  get userTypeLabel(): string {
    if (!this.currentUser) return '';
    return this.currentUser.role === 'admin' ? 'Administrador' : 'Jugador';
  }

  get userStats(): string {
    if (!this.currentUser || this.currentUser.role === 'admin') return '';

    const level = this.currentUser.level || 1;
    const points = this.currentUser.points || 0;
    return `Nivel ${level} • ${points} puntos`;
  }

  // Navigate to home based on user type
  navigateToHome() {
    if (this.currentUser?.role === 'admin') {
      this.navigateTo('/admin/dashboard');
    } else {
      this.navigateTo('/user/dashboard');
    }
  }

  // Quick actions
  quickPlay() {
    if (this.currentUser?.role === 'user') {
      this.navigateTo('/game/play');
    }
  }

  viewProfile() {
    if (this.currentUser?.role === 'admin') {
      this.navigateTo('/admin/profile');
    } else {
      this.navigateTo('/user/profile');
    }
  }
}