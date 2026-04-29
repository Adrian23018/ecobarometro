import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { GamePlayComponent } from '../game-play/game-play.component';
import { IconPipe } from '../../../shared/pipes/icon.pipe';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { SelectButtonModule } from 'primeng/selectbutton';
import { KnobModule } from 'primeng/knob';
import { User } from '../../../core/models/user';
import { CategoryWithStats } from '../../../core/models/category';
import { CategoryService } from '../../../core/services/category.service';
import { UserService } from '../../../core/services/user.service';
import { MessageService } from 'primeng/api';
import { CreateGameSessionRequest } from '../../../core/models/game-session';
import { GameSessionService } from '../../../core/services/game-session.service';

// Components
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

// Services


interface DifficultyOption {
  label: string;
  value: string;
  icon: string;
  color: string;
  description: string;
}

@Component({
  selector: 'app-game-lobby',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    CheckboxModule,
    ProgressBarModule,
    BadgeModule,
    TagModule,
    AvatarModule,
    DialogModule,
    ToastModule,
    SkeletonModule,
    DividerModule,
    TooltipModule,
    RippleModule,
    SelectButtonModule,
    KnobModule,
    FormsModule,
    ReactiveFormsModule,
    BackButtonComponent,
    IconPipe
  ],
  templateUrl: './game-lobby.component.html',
  styleUrls: ['./game-lobby.component.css']
})
export class GameLobbyComponent implements OnInit {
  // Form
  gameForm: FormGroup;

  // Data
  currentUser: User | null = null;
  categories: CategoryWithStats[] = [];
  recentAchievements: any[] = [];

  // UI State
  loadingCategories = true;
  startingGame = false;
  accessBlocked = false;
  checkingAccess = true;
  lastSession: any = null;

  // Stats
  userStats = {
    avgScore: 0,
    bestScore: 0,
    totalGames: 0
  };

  // Configuration
  difficultyOptions: DifficultyOption[] = [
    {
      label: 'Rápido',
      value: 'quick',
      icon: 'pi pi-forward',
      color: '#22c55e',
      description: '10 preguntas'
    },
    {
      label: 'Normal',
      value: 'normal',
      icon: 'pi pi-play',
      color: '#3b82f6',
      description: '15 preguntas'
    },
    {
      label: 'Completo',
      value: 'complete',
      icon: 'pi pi-star',
      color: '#f59e0b',
      description: '20 preguntas'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private categoryService: CategoryService,
    private gameSessionService: GameSessionService,
    private userService: UserService,
    private messageService: MessageService
  ) {
    this.gameForm = this.createForm();
  }

  ngOnInit(): void {



    this.loadUserData();
    this.loadCategories();
    this.loadRecentAchievements();
  }

  createForm(): FormGroup {
    return this.fb.group({
      selectedCategories: [[]],
      difficulty: ['normal'],
      timeChallenge: [false]
    });
  }

  loadUserData(): void {
    const userData = localStorage.getItem('ecobarometro_user');
    if (userData) {
      this.currentUser = JSON.parse(userData);
      this.checkGameAccess();
      this.loadUserStats();
    }
  }

  checkGameAccess(): void {
    if (!this.currentUser) {
      this.checkingAccess = false;
      return;
    }

    const adminId = (this.currentUser as any).admin_id;
    if (!adminId) {
      this.checkingAccess = false;
      return;
    }

    // 1. Verificar si ya completó
    this.gameSessionService.hasCompletedChallenge(this.currentUser.id, adminId).subscribe({
      next: (completed) => {
        if (completed) {
          this.accessBlocked = true;
          this.gameSessionService.getLastCompletedSession(this.currentUser!.id, adminId).subscribe({
            next: (session) => { this.lastSession = session; },
            error: () => {}
          });
          this.checkingAccess = false;
          return;
        }

        // 2. Si no completó, verificar si tiene una sesión en curso
        this.gameSessionService.getInProgressSession(this.currentUser!.id, adminId).subscribe({
          next: (inProgress) => {
            if (inProgress) {
              // Redirigir directamente a continuar la partida
              this.router.navigate(['/game/play', inProgress.id]);
            }
            this.checkingAccess = false;
          },
          error: () => { this.checkingAccess = false; }
        });
      },
      error: () => {
        this.accessBlocked = false;
        this.checkingAccess = false;
      }
    });
  }

  loadUserStats(): void {
    if (this.currentUser) {
      this.gameSessionService.getUserSessionStats(this.currentUser.id).subscribe({
        next: (stats: any) => {
          this.userStats = {
            avgScore: stats.avg_score,
            bestScore: stats.best_score,
            totalGames: stats.total_sessions
          };
        },
        error: (error: any) => {
          console.error('Error loading user stats:', error);
        }
      });
    }
  }

  loadCategories(): void {

    console.log("llega aqui ");

    if (!localStorage.getItem('ecobarometro_user') && localStorage.getItem('ecobarometro_token')) {
      return;
    }

    let userLogin = localStorage.getItem('ecobarometro_user');
    const userLoginData = userLogin ? JSON.parse(userLogin) : null;
    console.log("userLoginData", userLoginData);
    

    this.categoryService.getAvailableCategories(userLoginData.admin_id).subscribe({
      next: (categories) => {
        // Convert to CategoryWithStats (mock stats for now)
        console.log("CATEGORIES", categories);

        this.categories = categories.map(cat => ({
          ...cat,
          questions_count: Math.floor(Math.random() * 20) + 5,
          avg_score: Math.floor(Math.random() * 40) + 60,
          user_best_score: Math.floor(Math.random() * 50) + 50,
          completion_rate: Math.floor(Math.random() * 30) + 70
        }));
        this.loadingCategories = false;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las categorías'
        });
        this.loadingCategories = false;
      }
    });
  }

  loadRecentAchievements(): void {
    // Mock data for now
    this.recentAchievements = [
      {
        name: 'Eco Warrior',
        icon: 'pi pi-star',
        badge_color: '#22c55e',
        earned_at: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
      },
      {
        name: 'Speed Demon',
        icon: 'pi pi-bolt',
        badge_color: '#f59e0b',
        earned_at: new Date(Date.now() - 1000 * 60 * 60 * 48) // 2 days ago
      }
    ];
  }

  get selectedCategoriesCount(): number {
    return this.gameForm.get('selectedCategories')?.value?.length || 0;
  }

  get canStartGame(): boolean {
    return this.selectedCategoriesCount > 0;
  }

  get estimatedDuration(): number {
    const difficulty = this.gameForm.get('difficulty')?.value;
    const baseTime = difficulty === 'quick' ? 8 : difficulty === 'normal' ? 12 : 16;
    return Math.ceil(baseTime * this.selectedCategoriesCount / this.categories.length);
  }

  get totalQuestions(): number {
    const difficulty = this.gameForm.get('difficulty')?.value;
    return difficulty === 'quick' ? 10 : difficulty === 'normal' ? 15 : 20;
  }

  isCategorySelected(categoryId: string): boolean {
    const selected = this.gameForm.get('selectedCategories')?.value || [];
    return selected.includes(categoryId);
  }

  toggleCategory(categoryId: string): void {
    const currentSelected = this.gameForm.get('selectedCategories')?.value || [];
    let newSelected;

    if (currentSelected.includes(categoryId)) {
      newSelected = currentSelected.filter((id: string) => id !== categoryId);
    } else {
      newSelected = [...currentSelected, categoryId];
    }

    this.gameForm.patchValue({ selectedCategories: newSelected });
  }

  selectAllCategories(): void {
    const allCategoryIds = this.categories.map(cat => cat.id);
    this.gameForm.patchValue({ selectedCategories: allCategoryIds });
  }

  clearAllCategories(): void {
    this.gameForm.patchValue({ selectedCategories: [] });
  }

  startGame(): void {
    if (!this.canStartGame || !this.currentUser) return;

    // Guard 1: localStorage
    const activeId = GamePlayComponent.getActiveSessionId();
    if (activeId) {
      this.router.navigate(['/game/play', activeId]);
      return;
    }

    // Guard 2: Supabase — verificar antes de crear para evitar sesiones duplicadas
    this.startingGame = true;
    const adminId = (this.currentUser as any).admin_id;

    this.gameSessionService.getInProgressSession(this.currentUser.id, adminId).subscribe({
      next: (inProgress) => {
        if (inProgress) {
          // Hay una sesión en curso → reanudar
          this.router.navigate(['/game/play', inProgress.id]);
          return;
        }
        // No hay sesión en curso → crear nueva
        this.doCreateGame();
      },
      error: () => this.doCreateGame() // Si falla el check, intentar crear
    });
  }

  private doCreateGame(): void {
    const formValue = this.gameForm.value;
    const gameRequest: CreateGameSessionRequest = {
      session_name: 'EcoChallenge',
      categories: formValue.selectedCategories
    };

    this.gameSessionService.createGameSession(this.currentUser!.id, gameRequest).subscribe({
      next: (session: any) => {
        this.messageService.add({
          severity: 'success',
          summary: '¡Comenzando!',
          detail: 'Tu EcoChallenge ha comenzado',
          life: 2000
        });
        setTimeout(() => this.router.navigate(['/game/play', session.id]), 1000);
      },
      error: (error: any) => {
        console.error('Error starting game:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo iniciar el juego. Intenta de nuevo.'
        });
        this.startingGame = false;
      }
    });
  }

  trackByCategory(index: number, category: CategoryWithStats): string {
    return category.id;
  }

  toggleTimeChallenge(): void {
    const currentValue = this.gameForm.get('timeChallenge')?.value;
    this.gameForm.patchValue({ timeChallenge: !currentValue });
  }

  startQuickTest(): void {
    if (!this.currentUser) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No hay usuario logueado' });
      return;
    }

    const activeId = GamePlayComponent.getActiveSessionId();
    if (activeId) {
      this.router.navigate(['/game/play', activeId]);
      return;
    }

    this.startingGame = true;
    const adminId = (this.currentUser as any).admin_id;

    this.gameSessionService.getInProgressSession(this.currentUser.id, adminId).subscribe({
      next: (inProgress) => {
        if (inProgress) {
          this.router.navigate(['/game/play', inProgress.id]);
          return;
        }
        this.doCreateQuickTest();
      },
      error: () => this.doCreateQuickTest()
    });
  }

  private doCreateQuickTest(): void {
    const gameRequest: CreateGameSessionRequest = {
      session_name: 'Test Rápido',
      categories: []
    };

    this.gameSessionService.createGameSession(this.currentUser!.id, gameRequest).subscribe({
      next: (session: any) => {
        this.messageService.add({
          severity: 'success',
          summary: '¡Comenzando!',
          detail: 'Tu EcoChallenge ha comenzado',
          life: 2000
        });
        setTimeout(() => this.router.navigate(['/game/play', session.id]), 1000);
      },
      error: (error: any) => {
        console.error('Error starting quick test:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo iniciar el juego. Intenta de nuevo.'
        });
        this.startingGame = false;
      }
    });
  }
}