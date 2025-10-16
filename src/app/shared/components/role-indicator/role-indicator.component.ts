import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-role-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="role-indicator-banner" *ngIf="roleInfo$ | async as info" [class]="info.class">
      <div class="role-content">
        <div class="role-icon">
          <i [class]="info.icon"></i>
        </div>
        <div class="role-details">
          <div class="role-title">{{ info.title }}</div>
          <div class="role-subtitle">{{ info.subtitle }}</div>
        </div>
      </div>
      <div class="role-indicator-dot" [class]="info.dotClass"></div>
    </div>
  `,
  styles: [`
    .role-indicator-banner {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      min-width: 280px;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .role-indicator-banner.admin {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      border: 2px solid #ef4444;
    }

    .role-indicator-banner.user {
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      border: 2px solid #22c55e;
    }

    .role-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .role-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 1.25rem;
    }

    .admin .role-icon {
      background: #ef4444;
      color: white;
    }

    .user .role-icon {
      background: #22c55e;
      color: white;
    }

    .role-details {
      display: flex;
      flex-direction: column;
    }

    .role-title {
      font-weight: 700;
      font-size: 1rem;
      line-height: 1.2;
    }

    .admin .role-title {
      color: #991b1b;
    }

    .user .role-title {
      color: #166534;
    }

    .role-subtitle {
      font-size: 0.75rem;
      opacity: 0.8;
    }

    .admin .role-subtitle {
      color: #7f1d1d;
    }

    .user .role-subtitle {
      color: #14532d;
    }

    .role-indicator-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    .role-indicator-dot.admin-dot {
      background: #ef4444;
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
    }

    .role-indicator-dot.user-dot {
      background: #22c55e;
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
    }

    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
      }
      70% {
        box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
      }
    }

    @media (max-width: 768px) {
      .role-indicator-banner {
        top: 10px;
        right: 10px;
        left: 10px;
        min-width: auto;
        padding: 0.75rem 1rem;
      }

      .role-icon {
        width: 32px;
        height: 32px;
        font-size: 1rem;
      }

      .role-title {
        font-size: 0.875rem;
      }

      .role-subtitle {
        font-size: 0.7rem;
      }
    }
  `]
})
export class RoleIndicatorComponent implements OnInit {
  roleInfo$!: Observable<{
    title: string;
    subtitle: string;
    icon: string;
    class: string;
    dotClass: string;
  } | null>;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.roleInfo$ = this.authService.authState.pipe(
      map(state => {
        if (!state.isAuthenticated) return null;

        if (state.admin) {
          return {
            title: 'MODO ADMINISTRADOR',
            subtitle: `Panel de Control - ${state.admin.name}`,
            icon: 'pi pi-shield',
            class: 'admin',
            dotClass: 'admin-dot'
          };
        }

        if (state.user) {
          return {
            title: 'MODO JUGADOR',
            subtitle: `${state.user.full_name} - Nivel ${state.user.level}`,
            icon: 'pi pi-user',
            class: 'user',
            dotClass: 'user-dot'
          };
        }

        return null;
      })
    );
  }
}
