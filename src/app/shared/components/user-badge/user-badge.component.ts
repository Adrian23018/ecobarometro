import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// PrimeNG
import { BadgeModule } from 'primeng/badge';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

interface UserDisplay {
  name: string;
  role: 'admin' | 'user';
  roleLabel: string;
  roleColor: string;
  roleIcon: string;
  email?: string;
}

@Component({
  selector: 'app-user-badge',
  standalone: true,
  imports: [CommonModule, BadgeModule, AvatarModule, MenuModule],
  template: `
    <div class="user-badge" *ngIf="userDisplay$ | async as user">
      <div class="user-info" (click)="menu.toggle($event)">
        <div class="role-indicator" [style.background-color]="user.roleColor">
          <i [class]="user.roleIcon"></i>
          <span class="role-text">{{ user.roleLabel }}</span>
        </div>

        <div class="user-details">
          <span class="user-name">{{ user.name }}</span>
          <span class="user-email">{{ user.email }}</span>
        </div>

        <i class="pi pi-chevron-down"></i>
      </div>

      <p-menu #menu [model]="menuItems" [popup]="true"></p-menu>
    </div>

    <div class="user-badge-mobile" *ngIf="userDisplay$ | async as user">
      <p-badge
        [value]="user.roleLabel"
        [severity]="user.role === 'admin' ? 'danger' : 'success'"
        size="large"
      />
    </div>
  `,
  styles: [`
    .user-badge {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 1rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .user-badge:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .role-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      color: white;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .role-indicator i {
      font-size: 1rem;
    }

    .role-text {
      white-space: nowrap;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .user-name {
      font-weight: 600;
      color: #1a202c;
      font-size: 0.95rem;
    }

    .user-email {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .user-badge-mobile {
      display: none;
    }

    @media (max-width: 768px) {
      .user-badge {
        display: none;
      }

      .user-badge-mobile {
        display: flex;
        justify-content: center;
        padding: 0.5rem;
      }
    }
  `]
})
export class UserBadgeComponent implements OnInit {
  userDisplay$!: Observable<UserDisplay | null>;
  menuItems: MenuItem[] = [];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userDisplay$ = this.authService.authState.pipe(
      map(state => {
        if (!state.isAuthenticated) return null;

        if (state.admin) {
          return {
            name: state.admin.name,
            role: 'admin' as const,
            roleLabel: 'ADMINISTRADOR',
            roleColor: '#ef4444',
            roleIcon: 'pi pi-shield',
            email: state.admin.email
          };
        }

        if (state.user) {
          return {
            name: state.user.full_name,
            role: 'user' as const,
            roleLabel: 'JUGADOR',
            roleColor: '#22c55e',
            roleIcon: 'pi pi-user',
            email: state.user.email
          };
        }

        return null;
      })
    );

    this.setupMenu();
  }

  setupMenu(): void {
    this.authService.authState.subscribe(state => {
      if (state.userType === 'admin') {
        this.menuItems = [
          {
            label: 'Dashboard',
            icon: 'pi pi-th-large',
            command: () => this.router.navigate(['/admin/dashboard'])
          },
          {
            label: 'Categorías',
            icon: 'pi pi-folder',
            command: () => this.router.navigate(['/admin/categories'])
          },
          {
            label: 'Preguntas',
            icon: 'pi pi-question-circle',
            command: () => this.router.navigate(['/admin/questions'])
          },
          {
            label: 'Usuarios',
            icon: 'pi pi-users',
            command: () => this.router.navigate(['/admin/users'])
          },
          {
            separator: true
          },
          {
            label: 'Mi Perfil',
            icon: 'pi pi-user-edit',
            command: () => this.router.navigate(['/admin/profile'])
          },
          {
            label: 'Cerrar Sesión',
            icon: 'pi pi-sign-out',
            command: () => this.logout()
          }
        ];
      } else if (state.userType === 'user') {
        this.menuItems = [
          {
            label: 'Dashboard',
            icon: 'pi pi-th-large',
            command: () => this.router.navigate(['/user/dashboard'])
          },
          {
            label: 'Jugar',
            icon: 'pi pi-play',
            command: () => this.router.navigate(['/game/lobby'])
          },
          {
            label: 'Mis Logros',
            icon: 'pi pi-star',
            command: () => this.router.navigate(['/user/achievements'])
          },
          {
            label: 'Ranking',
            icon: 'pi pi-trophy',
            command: () => this.router.navigate(['/user/ranking'])
          },
          {
            separator: true
          },
          {
            label: 'Mi Perfil',
            icon: 'pi pi-user-edit',
            command: () => this.router.navigate(['/user/profile'])
          },
          {
            label: 'Cerrar Sesión',
            icon: 'pi pi-sign-out',
            command: () => this.logout()
          }
        ];
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
