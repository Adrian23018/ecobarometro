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
    console.log('👤 UserGuard verificando acceso a:', url);

    // Verificar rol desde localStorage
    const currentRole = this.getCurrentRole();

    if (!currentRole) {
      console.log('🚫 UserGuard: No autenticado');
      this.messageService.add({
        severity: 'warn',
        summary: 'Acceso Denegado',
        detail: 'Debes iniciar sesión para acceder a esta página'
      });
      this.router.navigate(['/auth/login']);
      return false;
    }

    // Si es admin, redirigir a admin dashboard
    if (currentRole === 'admin') {
      console.log('🚫 UserGuard: Es admin, redirigiendo a admin dashboard');
      this.messageService.add({
        severity: 'warn',
        summary: 'Acceso Denegado',
        detail: 'Esta área es solo para usuarios'
      });
      this.router.navigate(['/admin/dashboard']);
      return false;
    }

    // Si es user, permitir acceso
    console.log('✅ UserGuard: Acceso permitido - Es usuario');
    return true;
  }

  private getCurrentRole(): 'admin' | 'user' | null {
    try {
      const authToken = localStorage.getItem('ecobarometro_token');
      const adminProfile = localStorage.getItem('ecobarometro_admin');
      const userProfile = localStorage.getItem('ecobarometro_user');

      if (!authToken) {
        return null;
      }

      if (adminProfile) {
        return 'admin';
      }

      if (userProfile) {
        return 'user';
      }

      return null;
    } catch (error) {
      console.error('❌ Error verificando rol:', error);
      return null;
    }
  }
}