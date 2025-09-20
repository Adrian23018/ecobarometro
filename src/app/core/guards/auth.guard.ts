// src/app/core/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Simulación básica de autenticación con localStorage
    const isAuthenticated = this.checkAuthStatus();
    
    if (isAuthenticated) {
      return true;
    } else {
      // Redirigir al login si no está autenticado
      return this.router.createUrlTree(['/auth/login']);
    }
  }

  private checkAuthStatus(): boolean {
    try {
      // Verificar si hay datos de autenticación en localStorage
      const authToken = localStorage.getItem('ecobarometro_auth_token');
      const userProfile = localStorage.getItem('ecobarometro_user_profile');
      
      return !!(authToken && userProfile);
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      return false;
    }
  }
}