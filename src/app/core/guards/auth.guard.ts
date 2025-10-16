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
    const isAuthenticated = this.checkAuthStatus();

    if (isAuthenticated) {
      return true;
    } else {
      console.log('🚫 AuthGuard: Usuario no autenticado, redirigiendo a login');
      return this.router.createUrlTree(['/auth/login']);
    }
  }

  private checkAuthStatus(): boolean {
    try {
      const authToken = localStorage.getItem('ecobarometro_token');
      const userProfile = localStorage.getItem('ecobarometro_user');
      const adminProfile = localStorage.getItem('ecobarometro_admin');

      // Usuario está autenticado si tiene token Y (es user O es admin)
      const isAuthenticated = !!(authToken && (userProfile || adminProfile));

      console.log('🔐 AuthGuard verificando:', {
        hasToken: !!authToken,
        hasUser: !!userProfile,
        hasAdmin: !!adminProfile,
        isAuthenticated
      });

      return isAuthenticated;
    } catch (error) {
      console.error('❌ Error verificando autenticación:', error);
      return false;
    }
  }
}


// import { Injectable } from '@angular/core';
// import { 
//   CanActivate, 
//   CanActivateChild, 
//   ActivatedRouteSnapshot, 
//   RouterStateSnapshot, 
//   Router 
// } from '@angular/router';
// import { Observable } from 'rxjs';
// import { AuthService } from '../services/auth.service';
// import { MessageService } from 'primeng/api';

// @Injectable({
//   providedIn: 'root'
// })
// export class AdminGuard implements CanActivate, CanActivateChild {

//   constructor(
//     private authService: AuthService,
//     private router: Router,
//     private messageService: MessageService
//   ) {}

//   canActivate(
//     route: ActivatedRouteSnapshot,
//     state: RouterStateSnapshot
//   ): Observable<boolean> | Promise<boolean> | boolean {
//     return this.checkAdminAccess(state.url);
//   }

//   canActivateChild(
//     childRoute: ActivatedRouteSnapshot,
//     state: RouterStateSnapshot
//   ): Observable<boolean> | Promise<boolean> | boolean {
//     return this.checkAdminAccess(state.url);
//   }

//   private checkAdminAccess(url: string): boolean {
//     // Check if user is authenticated
//     if (!this.authService.isAuthenticated()) {
//       this.messageService.add({
//         severity: 'warn',
//         summary: 'Acceso Denegado',
//         detail: 'Debes iniciar sesión como administrador para acceder a esta página'
//       });
//       this.router.navigate(['/auth/admin-login']);
//       return false;
//     }

//     // Check if the authenticated user is actually an admin
//     if (!this.authService.isAdmin()) {
//       this.messageService.add({
//         severity: 'warn',
//         summary: 'Acceso Denegado',
//         detail: 'Esta área es solo para administradores'
//       });
      
//       // If it's a user, redirect to user area
//       if (this.authService.isUser()) {
//         this.router.navigate(['/user/dashboard']);
//       } else {
//         this.router.navigate(['/auth/admin-login']);
//       }
//       return false;
//     }

//     // Check if admin account is active
//     const currentAdmin = this.authService.getCurrentAdmin();
//     if (currentAdmin && !currentAdmin.is_active) {
//       this.messageService.add({
//         severity: 'error',
//         summary: 'Cuenta Inactiva',
//         detail: 'Tu cuenta de administrador está desactivada. Contacta al soporte.'
//       });
//       this.authService.logout();
//       this.router.navigate(['/auth/admin-login']);
//       return false;
//     }

//     return true;
//   }
// }