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
    <!-- <div class="role-indicator-float" *ngIf="roleInfo$ | async as info" [class]="info.class" [title]="info.tooltip">
      <i [class]="info.icon"></i>
    </div> -->
  `,
  styles: [`
    .role-indicator-float {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      cursor: pointer;
      transition: all 0.3s ease;
      animation: fadeIn 0.3s ease-out;
    }

    .role-indicator-float:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: scale(0.8);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .role-indicator-float.admin {
      background: #ef4444;
      border: 2px solid #dc2626;
    }

    .role-indicator-float.user {
      background: #22c55e;
      border: 2px solid #16a34a;
    }

    .role-indicator-float i {
      color: white;
      font-size: 1.25rem;
    }

    @media (max-width: 768px) {
      .role-indicator-float {
        bottom: 15px;
        right: 15px;
        width: 36px;
        height: 36px;
      }

      .role-indicator-float i {
        font-size: 1.1rem;
      }
    }
  `]
})
export class RoleIndicatorComponent implements OnInit {
  roleInfo$!: Observable<{
    icon: string;
    class: string;
    tooltip: string;
  } | null>;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.roleInfo$ = this.authService.authState.pipe(
      map(state => {
        if (!state.isAuthenticated) return null;

        if (state.admin) {
          return {
            icon: 'pi pi-shield',
            class: 'admin',
            tooltip: `Administrador: ${state.admin.name}`
          };
        }

        if (state.user) {
          return {
            icon: 'pi pi-user',
            class: 'user',
            tooltip: `Usuario: ${state.user.full_name} - Nivel ${state.user.level}`
          };
        }

        return null;
      })
    );
  }
}
