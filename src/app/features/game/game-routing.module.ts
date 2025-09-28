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
        redirectTo: 'lobby',
        pathMatch: 'full'
      },
      {
        path: 'lobby',
        loadComponent: () => import('./game-lobby/game-lobby.component').then(m => m.GameLobbyComponent),
        title: 'Lobby - EcoBarómetro'
      },
      {
        path: 'play/:sessionId',
        loadComponent: () => import('./game-play/game-play.component').then(m => m.GamePlayComponent),
        title: 'Jugando - EcoBarómetro'
      },
      {
        path: 'result/:sessionId',
        loadComponent: () => import('./game-results/game-results.component').then(m => m.GameResultComponent),
        title: 'Resultados - EcoBarómetro'
      },
      {
        path: 'leaderboard',
        loadComponent: () => import('./leaderboard/leaderboard.component').then(m => m.LeaderboardComponent),
        title: 'Ranking - EcoBarómetro'
      },
      // {
      //   path: 'history',
      //   loadComponent: () => import('./game-history/game-history.component').then(m => m.GameHistoryComponent),
      //   title: 'Historial - EcoBarómetro'
      // }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GameRoutingModule { }