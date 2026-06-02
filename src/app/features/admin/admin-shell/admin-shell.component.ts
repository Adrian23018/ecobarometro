import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  exact?: boolean;
}

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-shell.component.html',
  styleUrls: ['./admin-shell.component.css']
})
export class AdminShellComponent implements OnInit, OnDestroy {
  currentAdmin: any = null;
  sidebarCollapsed = false;
  currentPageTitle = 'Dashboard';
  private destroy$ = new Subject<void>();

  navItems: NavItem[] = [
    { label: 'Dashboard',   icon: 'pi pi-home',          route: '/admin/dashboard', exact: true },
    { label: 'Usuarios',    icon: 'pi pi-users',         route: '/admin/users' },
    { label: 'Preguntas',   icon: 'pi pi-question-circle', route: '/admin/questions' },
    { label: 'Categorías',  icon: 'pi pi-tag',           route: '/admin/categories' },
    { label: 'Analíticas',  icon: 'pi pi-chart-bar',     route: '/admin/analytics' },
    { label: 'Logros',      icon: 'pi pi-trophy',        route: '/admin/achievements' },
    { label: 'Videos',      icon: 'pi pi-video',         route: '/admin/videos' },
    { label: 'Mi Perfil',   icon: 'pi pi-user',          route: '/admin/profile' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.authState
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.currentAdmin = state.admin;
      });

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe(() => {
        this.updatePageTitle();
      });

    this.updatePageTitle();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updatePageTitle() {
    const url = this.router.url;
    const match = this.navItems.find(n => url.startsWith(n.route) && n.route !== '/admin/dashboard')
      || this.navItems.find(n => url === n.route || url.startsWith(n.route + '/'));
    this.currentPageTitle = match ? match.label : 'Dashboard';
  }

  get avatarLabel(): string {
    return this.currentAdmin?.name
      ? this.currentAdmin.name.charAt(0).toUpperCase()
      : 'A';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login-admin']);
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}
