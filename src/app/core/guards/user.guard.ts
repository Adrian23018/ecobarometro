import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  CanActivateChild, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Router 
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class UserGuard implements CanActivate, CanActivateChild {

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkUserAccess(state.url);
  }

  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkUserAccess(state.url);
  }

  private checkUserAccess(url: string): boolean {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acceso Denegado',
        detail: 'Debes iniciar sesión para acceder a esta página'
      });
      this.router.navigate(['/auth/user-login']);
      return false;
    }

    // Check if the authenticated user is actually a user (not admin)
    if (!this.authService.isUser()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Acceso Denegado',
        detail: 'Esta área es solo para usuarios'
      });
      
      // If it's an admin, redirect to admin area
      if (this.authService.isAdmin()) {
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.router.navigate(['/auth/user-login']);
      }
      return false;
    }

    // Check if user account is active
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && !currentUser.is_active) {
      this.messageService.add({
        severity: 'error',
        summary: 'Cuenta Inactiva',
        detail: 'Tu cuenta está desactivada. Contacta al administrador.'
      });
      this.authService.logout();
      this.router.navigate(['/auth/user-login']);
      return false;
    }

    return true;
  }
}