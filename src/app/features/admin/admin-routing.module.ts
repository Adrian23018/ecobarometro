import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminGuard } from '../../core/guards/admin.guard';

const routes: Routes = [
  {
    path: '',
    // canActivate: [AdminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Dashboard - EcoBarómetro Admin'
      },
      {
        path: 'categories',
        loadComponent: () => import('./categories-manager/categories-manager.component').then(m => m.CategoriesManagerComponent),
        title: 'Gestión de Categorías - EcoBarómetro Admin'
      },
      {
        path: 'questions',
        loadComponent: () => import('./questions-manager/questions-manager.component').then(m => m.QuestionManagerComponent),
        title: 'Gestión de Preguntas - EcoBarómetro Admin'
      },
      {
        path: 'questions/create',
        loadComponent: () => import('./question-form/question-form.component').then(m => m.QuestionFormComponent),
        title: 'Crear Pregunta - EcoBarómetro Admin'
      },
      {
        path: 'questions/edit/:id',
        loadComponent: () => import('./question-form/question-form.component').then(m => m.QuestionFormComponent),
        title: 'Editar Pregunta - EcoBarómetro Admin'
      },
      {
        path: 'users',
        loadComponent: () => import('./users-manager/users-manager.component').then(m => m.UsersManagerComponent),
        title: 'Gestión de Usuarios - EcoBarómetro Admin'
      },
      {
        path: 'users/:id',
        loadComponent: () => import('./user-detail/user-detail.component').then(m => m.UserDetailComponent),
        title: 'Detalle de Usuario - EcoBarómetro Admin'
      },
      {
        path: 'analytics',
        loadComponent: () => import('./user-analytics/user-analytics.component').then(m => m.UserAnalyticsComponent),
        title: 'Análisis de Usuarios - EcoBarómetro Admin'
      },
      {
        path: 'achievements',
        loadComponent: () => import('./achievements-manager/achievements-manager.component').then(m => m.AchievementsManagerComponent),
        title: 'Gestión de Logros - EcoBarómetro Admin'
      },
      {
        path: 'settings',
        loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent),
        title: 'Configuración - EcoBarómetro Admin'
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent),
        title: 'Mi Perfil - EcoBarómetro Admin'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }