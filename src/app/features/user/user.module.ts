// src/app/features/user/user.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../shared/shared.module';

import { UserRoutingModule } from './user-routing.module';

// Componentes principales
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { GameLobbyComponent } from './game-lobby/game-lobby.component';
import { AchievementsComponent } from './achievements/achievements.component';
import { RankingComponent } from './ranking/ranking.component';
import { SettingsComponent } from './settings/settings.component';

// Componentes específicos del juego
import { QuickGameComponent } from './components/quick-game/quick-game.component';
import { CategorySelectComponent } from './components/category-select/category-select.component';
import { StatsCardComponent } from './components/stats-card/stats-card.component';
import { RecentGamesComponent } from './components/recent-games/recent-games.component';
import { LeaderboardMiniComponent } from './components/leaderboard-mini/leaderboard-mini.component';
import { AchievementCardComponent } from './components/achievement-card/achievement-card.component';
import { ProgressChartComponent } from './components/progress-chart/progress-chart.component';
import { EcoTipsComponent } from './components/eco-tips/eco-tips.component';

// Layout components
import { UserLayoutComponent } from './layout/user-layout.component';
import { SidebarComponent } from './layout/sidebar/sidebar.component';

@NgModule({
  declarations: [
    // Páginas principales
    DashboardComponent,
    ProfileComponent,
    GameLobbyComponent,
    AchievementsComponent,
    RankingComponent,
    SettingsComponent,
    
    // Componentes específicos
    QuickGameComponent,
    CategorySelectComponent,
    StatsCardComponent,
    RecentGamesComponent,
    LeaderboardMiniComponent,
    AchievementCardComponent,
    ProgressChartComponent,
    EcoTipsComponent,
    
    // Layout
    UserLayoutComponent,
    SidebarComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    UserRoutingModule
  ]
})
export class UserModule { }