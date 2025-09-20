// src/app/core/guards/admin.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const currentRole = this.getCurrentRole();
    
    if (currentRole === 'admin') {
      return true;
    } else {
      // Redirigir según el rol
      if (currentRole === 'user') {
        return this.router.createUrlTree(['/user/dashboard']);
      } else {
        return this.router.createUrlTree(['/auth/login']);
      }
    }
  }

  private getCurrentRole(): 'admin' | 'user' | null {
    try {
      const role = localStorage.getItem('ecobarometro_user_role');
      return role as 'admin' | 'user' | null;
    } catch (error) {
      console.error('Error verificando rol:', error);
      return null;
    }
  }
}