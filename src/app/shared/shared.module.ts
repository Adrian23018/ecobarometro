// src/app/shared/shared.module.ts
import { NgModule, Pipe } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { ChipModule } from 'primeng/chip';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CalendarModule } from 'primeng/calendar';
import { SliderModule } from 'primeng/slider';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { MenuModule } from 'primeng/menu';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { PanelMenuModule } from 'primeng/panelmenu';
import { TabViewModule } from 'primeng/tabview';
import { AccordionModule } from 'primeng/accordion';
import { FieldsetModule } from 'primeng/fieldset';
import { ToolbarModule } from 'primeng/toolbar';
import { SplitButtonModule } from 'primeng/splitbutton';
import { SpeedDialModule } from 'primeng/speeddial';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { SidebarModule } from 'primeng/sidebar';
import { ImageModule } from 'primeng/image';
import { GalleriaModule } from 'primeng/galleria';
import { CarouselModule } from 'primeng/carousel';
import { DividerModule } from 'primeng/divider';
import { ScrollTopModule } from 'primeng/scrolltop';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { ChartModule } from 'primeng/chart';
import { KnobModule } from 'primeng/knob';
import { RatingModule } from 'primeng/rating';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { MessageModule } from 'primeng/message';
import { MessagesModule } from 'primeng/messages';
import { InplaceModule } from 'primeng/inplace';
import { BlockUIModule } from 'primeng/blockui';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

// Shared Components
import { HeaderComponent } from './components/header/header.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';
import { ScoreDisplayComponent } from './components/score-display/score-display.component';
import { LevelProgressComponent } from './components/level-progress/level-progress.component';
import { AchievementBadgeComponent } from './components/achievement-badge/achievement-badge.component';
import { GameTimerComponent } from './components/game-timer/game-timer.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';

// Shared Pipes
import { TimeFormatPipe } from './pipes/time-format.pipe';
import { ScoreFormatPipe } from './pipes/score-format.pipe';
import { LevelNamePipe } from './pipes/level-name.pipe';

// Shared Directives (si las hubiera)
// import { EcoHoverDirective } from './directives/eco-hover.directive';

// Definir arrays para organizar mejor
const PRIMENG_MODULES = [
  ButtonModule,
  CardModule,
  InputTextModule,
  PasswordModule,
  ToastModule,
  ProgressBarModule,
  TableModule,
  DialogModule,
  ConfirmDialogModule,
  AvatarModule,
  BadgeModule,
  ChipModule,
  RippleModule,
  TooltipModule,
  DropdownModule,
  CheckboxModule,
  RadioButtonModule,
  CalendarModule,
  SliderModule,
  ToggleButtonModule,
  MenuModule,
  TieredMenuModule,
  PanelMenuModule,
  TabViewModule,
  AccordionModule,
  FieldsetModule,
  ToolbarModule,
  SplitButtonModule,
  SpeedDialModule,
  OverlayPanelModule,
  SidebarModule,
  ImageModule,
  GalleriaModule,
  CarouselModule,
  DividerModule,
  ScrollTopModule,
  SkeletonModule,
  TagModule,
  ChartModule,
  KnobModule,
  RatingModule,
  ScrollPanelModule,
  MessageModule,
  MessagesModule,
  InplaceModule,
  BlockUIModule,
  ProgressSpinnerModule
];

const SHARED_COMPONENTS = [
  HeaderComponent,
  NavbarComponent,
  FooterComponent,
  LoadingSpinnerComponent,
  ScoreDisplayComponent,
  LevelProgressComponent,
  AchievementBadgeComponent,
  GameTimerComponent,
  ConfirmDialogComponent,
];

const SHARED_PIPES = [
  TimeFormatPipe,
  ScoreFormatPipe,
  LevelNamePipe
];

// Shared Directives
import { EcoHoverDirective } from './directives/eco-hover.directive';

const SHARED_DIRECTIVES = [
  EcoHoverDirective
];

@NgModule({
  declarations: [
    ...SHARED_COMPONENTS,
    ...SHARED_PIPES,
    ...SHARED_DIRECTIVES
  ],
  imports: [
    DecimalPipe,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ...PRIMENG_MODULES
  ],
  exports: [
    // Angular Common Modules
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    
    // PrimeNG Modules
    ...PRIMENG_MODULES,
    
    // Shared Components
    ...SHARED_COMPONENTS,
    
    // Shared Pipes
    ...SHARED_PIPES,
    
    // Shared Directives
    ...SHARED_DIRECTIVES
  ]
})
export class SharedModule { }

/**
 * Módulo compartido que contiene:
 * 
 * COMPONENTES:
 * - HeaderComponent: Barra de navegación principal con usuario, notificaciones y búsqueda
 * - FooterComponent: Pie de página con enlaces, redes sociales y información
 * - LoadingSpinnerComponent: Indicadores de carga con múltiples variantes y temas
 * - ScoreDisplayComponent: Visualización de puntuaciones con animaciones
 * - LevelProgressComponent: Barra de progreso de nivel con información detallada
 * - AchievementBadgeComponent: Insignias de logros con diferentes rareza y estados
 * - GameTimerComponent: Temporizador para juegos con múltiples formatos
 * - ConfirmDialogComponent: Diálogo de confirmación personalizable
 * 
 * PIPES:
 * - TimeFormatPipe: Formateo de tiempo (segundos a formato legible)
 * - ScoreFormatPipe: Formateo de puntuaciones (compacto, porcentaje, etc.)
 * - LevelNamePipe: Conversión de niveles a nombres descriptivos
 * DIRECTIVAS:
 * - EcoHoverDirective: Efectos de hover ecológicos y gamificados
 * 
 * CARACTERÍSTICAS:
 * - Todos los módulos de PrimeNG más utilizados
 * - Componentes gamificados y temáticos
 * - Animaciones y efectos visuales
 * - Responsive design
 * - Accesibilidad
 * - Temas personalizables
 * 
 * USO:
 * Importar SharedModule en cualquier módulo de funcionalidad que necesite
 * acceso a los componentes, pipes y módulos compartidos.
 * 
 * Ejemplo:
 * ```typescript
 * @NgModule({
 *   imports: [SharedModule],
 *   // ...
 * })
 * export class FeatureModule { }
 * ```
 */