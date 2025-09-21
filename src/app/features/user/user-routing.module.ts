import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserGuard } from '../../core/guards/user.guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [UserGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/dashboard.component').then(m => m.UserDashboardComponent),
        title: 'Mi Dashboard - EcoBarómetro'
      },
      {
        path: 'profile',
        loadComponent: () => import('./profile/profile.component').then(m => m.UserProfileComponent),
        title: 'Mi Perfil - EcoBarómetro'
      },
      {
        path: 'achievements',
        loadComponent: () => import('./achievements/achievements.component').then(m => m.UserAchievementsComponent),
        title: 'Mis Logros - EcoBarómetro'
      },
      {
        path: 'ranking',
        loadComponent: () => import('./ranking/ranking.component').then(m => m.UserRankingComponent),
        title: 'Mi Ranking - EcoBarómetro'
      },
      {
        path: 'game',
        loadChildren: () => import('../game/game.module').then(m => m.GameModule)
      },
      // {
      //   path: 'statistics',
      //   loadComponent: () => import('./statistics/').then(m => m.UserStatisticsComponent),
      //   title: 'Mis Estadísticas - EcoBarómetro'
      // },
      // {
      //   path: 'settings',
      //   loadComponent: () => import('./settings/settings.component').then(m => m.UserSettingsComponent),
      //   title: 'Configuración - EcoBarómetro'
      // }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }