// src/app/core/guards/admin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const currentRole = this.getCurrentRole();

    console.log('🛡️ AdminGuard verificando acceso:', { role: currentRole });

    if (currentRole === 'admin') {
      console.log('✅ AdminGuard: Acceso permitido - Es admin');
      return true;
    } else {
      if (currentRole === 'user') {
        console.log('🚫 AdminGuard: Acceso denegado - Es usuario, redirigiendo a /user/dashboard');
        return this.router.createUrlTree(['/user/dashboard']);
      } else {
        console.log('🚫 AdminGuard: No autenticado, redirigiendo a /auth/login');
        return this.router.createUrlTree(['/auth/login']);
      }
    }
  }

  private getCurrentRole(): 'admin' | 'user' | null {
    try {
      const authToken = localStorage.getItem('ecobarometro_token');
      const adminProfile = localStorage.getItem('ecobarometro_admin');
      const userProfile = localStorage.getItem('ecobarometro_user');

      // Si no hay token, no está autenticado
      if (!authToken) {
        return null;
      }

      // Si tiene ecobarometro_admin, es admin
      if (adminProfile) {
        return 'admin';
      }

      // Si tiene ecobarometro_user, es user
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