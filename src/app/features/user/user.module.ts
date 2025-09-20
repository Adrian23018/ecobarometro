// src/app/features/user/user.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';

import { UserRoutingModule } from './user-routing.module';

// Componentes principales
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { GameLobbyComponent } from '../game/game-lobby/game-lobby.component';
import { AchievementsComponent } from './achievements/achievements.component';
import { RankingComponent } from './ranking/ranking.component';


// Layout components


@NgModule({
  declarations: [
    // Páginas principales
    DashboardComponent,
    ProfileComponent,
    GameLobbyComponent,
    AchievementsComponent,
    RankingComponent,
    // SettingsComponent,
    
    // Componentes específicos
    // QuickGameComponent,
    // CategorySelectComponent,
    // StatsCardComponent,
    // RecentGamesComponent,
    // LeaderboardMiniComponent,
    // AchievementCardComponent,
    // ProgressChartComponent,
    // EcoTipsComponent,
    
    // // Layout
    // UserLayoutComponent,
    // SidebarComponent
  ],
  imports: [
    CommonModule,
    // SharedModule,
    UserRoutingModule
  ]
})
export class UserModule { }