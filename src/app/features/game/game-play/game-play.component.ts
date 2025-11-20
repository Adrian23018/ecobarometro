import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, timer, interval } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { MessageService, ConfirmationService } from 'primeng/api';

// Models
import { Question, QuestionOption, GameQuestion } from '../../../core/models/question';
import { User, UserResponse } from '../../../core/models/user';
import { GameSession, ActiveGameSession } from '../../../core/models/game-session';

// Services
import { GameSessionService } from '../../../core/services/game-session.service';
import { QuestionsService } from '../../../core/services/questions.service';
import { UserService } from '../../../core/services/user.service';
import { FilterPipe } from '../../../shared/pipes/filter.pipe';

// Components
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

interface GameStats {
  currentQuestionNumber: number;
  totalQuestions: number;
  correctAnswers: number;
  totalPoints: number;
  timeRemaining: number;
  streakCount: number;
}

@Component({
  selector: 'app-game-play',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    ProgressBarModule,
    BadgeModule,
    TagModule,
    DialogModule,
    ToastModule,
    SkeletonModule,
    DividerModule,
    TooltipModule,
    RippleModule,
    AvatarModule,
    ConfirmDialogModule,
    FilterPipe,
    BackButtonComponent
  ],
  templateUrl: './game-play.component.html',
  styleUrls: ['./game-play.component.css'],
  providers: [ConfirmationService]
})
export class GamePlayComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  sessionId!: string;
  currentUser: User | null = null;
  gameSession: ActiveGameSession | null = null;
  currentQuestion: GameQuestion | null = null;
  selectedOption: QuestionOption | null = null;


  // Game State
  gameStats: GameStats = {
    currentQuestionNumber: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    totalPoints: 0,
    timeRemaining: 0,
    streakCount: 0
  };

  // UI State
  isLoading = true;
  isSubmitting = false;
  showResults = false;
  gameCompleted = false;
  isPaused = false;

  // Timer
  timeLimit = 30; // segundos por pregunta
  timer$ = new Subject<void>();

  // Animation states
  questionTransition = false;
  showFeedback = false;
  feedbackType: 'correct' | 'incorrect' | null = null;

  // Make String available in template
  String = String;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gameSessionService: GameSessionService,
    private questionsService: QuestionsService,
    private userService: UserService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.sessionId = params['sessionId'];
      this.initializeGame();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.timer$.next();
    this.timer$.complete();
  }

  loadUserData(): void {
    const userData = localStorage.getItem('ecobarometro_user');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    }
  }

  async initializeGame(): Promise<void> {
    try {
      this.isLoading = true;
      console.log('Inicializando juego con sessionId:', this.sessionId);

      // Cargar sesión de juego
      const session = await this.gameSessionService.getGameSession(this.sessionId).toPromise();
      console.log('Sesión cargada:', session);

      if (!session) {
        this.handleGameError('Sesión de juego no encontrada');
        return;
      }

      // Obtener el admin_id del usuario actual
      const userData = localStorage.getItem('ecobarometro_user');
      if (!userData) {
        this.handleGameError('Usuario no encontrado');
        return;
      }

      const user = JSON.parse(userData);
      console.log('Usuario para obtener preguntas:', user);
      console.log('admin_id del usuario:', user.admin_id);

      if (!user.admin_id) {
        this.handleGameError('Usuario no tiene admin_id asignado');
        return;
      }

      // Verificar primero si existen preguntas
      console.log('🔍 Verificando existencia de preguntas para admin_id:', user.admin_id);
      const questionCount = await this.questionsService.checkQuestionsExist(user.admin_id).toPromise();
      console.log('📊 Total de preguntas ACTIVAS disponibles:', questionCount);

      if (questionCount === 0) {
        console.error('❌ No existen preguntas para este admin_id en la base de datos');
        this.handleGameError(`No se encontraron preguntas para el administrador. Admin ID: ${user.admin_id}`);
        return;
      }

      // Cargar preguntas aleatorias directamente del admin desde la base de datos
      console.log('📋 Consultando base de datos para obtener preguntas...');
      console.log('📋 Parámetros: admin_id =', user.admin_id, ', límite = 15 preguntas');
      const gameQuestions = await this.questionsService.getRandomQuestions(
        user.admin_id,
        undefined, // Sin filtro de categorías
        15 // 15 preguntas
      ).toPromise();

      console.log('✅ Total de preguntas obtenidas de la BD:', gameQuestions?.length || 0);
      console.log('📝 Detalles de preguntas obtenidas:', gameQuestions);

      if (!gameQuestions || gameQuestions.length === 0) {
        console.error('❌ No se pudieron cargar preguntas de la base de datos');
        this.handleGameError('No se pudieron cargar las preguntas. Verifica que existan preguntas activas para este administrador.');
        return;
      }

      if (gameQuestions.length < 15) {
        console.warn(`⚠️ ATENCIÓN: Se solicitaron 15 preguntas pero solo se obtuvieron ${gameQuestions.length}`);
        console.warn('⚠️ Esto puede deberse a:');
        console.warn('   1. Solo hay ' + gameQuestions.length + ' preguntas activas (is_active=true)');
        console.warn('   2. Algunas preguntas no tienen opciones válidas');
        console.warn('   3. El admin_id no coincide con todas las preguntas');
      }

      // Convertir GameQuestion[] a Question[]
      const questions = gameQuestions.map(gq => gq.question);
      console.log('✅ Preguntas convertidas exitosamente:', questions.length);

      this.gameSession = {
        session,
        current_question_index: 0,
        questions: questions,
        responses: [],
        start_time: new Date()
      };

      this.gameStats = {
        currentQuestionNumber: 1,
        totalQuestions: this.gameSession.questions.length,
        correctAnswers: 0,
        totalPoints: 0,
        timeRemaining: this.timeLimit,
        streakCount: 0
      };

      console.log('GameSession inicializada:', this.gameSession);
      console.log('GameStats inicializadas:', this.gameStats);

      this.loadCurrentQuestion();
      this.startTimer();

    } catch (error) {
      console.error('Error initializing game:', error);
      this.handleGameError('Error al inicializar el juego: ' + error);
    } finally {
      this.isLoading = false;
    }
  }

  loadCurrentQuestion(): void {
    console.log('Cargando pregunta actual...');
    console.log('gameSession:', this.gameSession);
    console.log('current_question_index:', this.gameSession?.current_question_index);
    console.log('total questions:', this.gameSession?.questions.length);

    if (!this.gameSession || this.gameSession.current_question_index >= this.gameSession.questions.length) {
      console.log('No hay más preguntas, completando juego...');
      this.completeGame();
      return;
    }

    const question = this.gameSession.questions[this.gameSession.current_question_index];
    console.log('Pregunta actual:', question);

    this.currentQuestion = {
      question,
      options: question.options || [],
      time_limit: this.timeLimit,
      bonus_points: this.calculateBonusPoints(question)
    };

    console.log('currentQuestion configurada:', this.currentQuestion);

    this.selectedOption = null;
    this.gameStats.timeRemaining = this.timeLimit;
    this.gameStats.currentQuestionNumber = this.gameSession.current_question_index + 1;

    console.log('gameStats actualizadas:', this.gameStats);
  }

  calculateBonusPoints(question: Question): number {
    // Bonus points basado en dificultad y racha
    const difficultyBonus = question.difficulty_level * 10;
    const streakBonus = this.gameStats.streakCount * 5;
    return difficultyBonus + streakBonus;
  }

  startTimer(): void {
    this.timer$.next();

    interval(1000)
      .pipe(takeUntil(this.timer$), takeUntil(this.destroy$))
      .subscribe(() => {
        if (!this.isPaused && this.gameStats.timeRemaining > 0) {
          this.gameStats.timeRemaining--;
        } else if (this.gameStats.timeRemaining === 0) {
          this.timeUp();
        }
      });
  }

  selectOption(option: QuestionOption): void {
    if (this.isSubmitting || this.showFeedback) return;
    this.selectedOption = option;
  }

  async submitAnswer(): Promise<void> {
    if (!this.selectedOption || !this.currentQuestion || !this.gameSession) return;

    this.isSubmitting = true;
    this.timer$.next(); // Stop timer

    const response: UserResponse = {
      id: '',
      user_id: this.currentUser?.id || '',
      question_id: this.currentQuestion.question.id,
      session_id: this.sessionId,
      selected_option_id: this.selectedOption.id,
      is_correct: this.selectedOption.is_correct,
      points_earned: this.selectedOption.is_correct ? this.calculatePointsEarned() : 0,
      time_taken: this.timeLimit - this.gameStats.timeRemaining,
      created_at: new Date().toISOString()
    };

    // Update local stats
    if (response.is_correct) {
      this.gameStats.correctAnswers++;
      this.gameStats.streakCount++;
      this.feedbackType = 'correct';
    } else {
      this.gameStats.streakCount = 0;
      this.feedbackType = 'incorrect';
    }

    this.gameStats.totalPoints += response.points_earned;
    this.gameSession.responses.push(response);

    // Show feedback
    this.showFeedback = true;

    // Save response to backend
    try {
      await this.gameSessionService.submitResponse(response).toPromise();
    } catch (error) {
      console.error('Error saving response:', error);
    }

    // Move to next question after delay
    setTimeout(() => {
      this.nextQuestion();
    }, 2000);
  }

  calculatePointsEarned(): number {
    if (!this.currentQuestion) return 0;

    const basePoints = this.currentQuestion.question.points;
    const timeBonus = Math.floor(this.gameStats.timeRemaining / 5) * 2; // 2 puntos por cada 5 segundos restantes
    const bonusPoints = this.currentQuestion.bonus_points || 0;

    return basePoints + timeBonus + bonusPoints;
  }

  timeUp(): void {
    if (this.showFeedback) return;

    this.feedbackType = 'incorrect';
    this.showFeedback = true;
    this.gameStats.streakCount = 0;

    // Save empty response
    if (this.currentQuestion && this.gameSession) {
      const response: UserResponse = {
        id: '',
        user_id: this.currentUser?.id || '',
        question_id: this.currentQuestion.question.id,
        session_id: this.sessionId,
        selected_option_id: '',
        is_correct: false,
        points_earned: 0,
        time_taken: this.timeLimit,
        created_at: new Date().toISOString()
      };

      this.gameSession.responses.push(response);
      this.gameSessionService.submitResponse(response).subscribe();
    }

    setTimeout(() => {
      this.nextQuestion();
    }, 2000);
  }

  nextQuestion(): void {
    this.showFeedback = false;
    this.feedbackType = null;
    this.questionTransition = true;

    if (this.gameSession) {
      this.gameSession.current_question_index++;
    }

    setTimeout(() => {
      this.questionTransition = false;
      this.loadCurrentQuestion();
      this.startTimer();
      this.isSubmitting = false;
    }, 500);
  }

  pauseGame(): void {
    this.isPaused = true;
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres pausar el juego?',
      header: 'Pausar Juego',
      icon: 'pi pi-pause',
      acceptLabel: 'Sí, pausar',
      rejectLabel: 'Continuar',
      accept: () => {
        // Game remains paused
      },
      reject: () => {
        this.isPaused = false;
      }
    });
  }

  quitGame(): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres abandonar el juego? Perderás todo el progreso.',
      header: 'Abandonar Juego',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, abandonar',
      rejectLabel: 'Continuar jugando',
      accept: () => {
        this.abandonGame();
      }
    });
  }

  async abandonGame(): Promise<void> {
    try {
      if (this.gameSession) {
        await this.gameSessionService.abandonSession(this.sessionId).toPromise();
      }
      this.router.navigate(['/user/dashboard']);
    } catch (error) {
      console.error('Error abandoning game:', error);
      this.router.navigate(['/user/dashboard']);
    }
  }

  async completeGame(): Promise<void> {
    if (!this.gameSession) return;

    try {
      this.gameCompleted = true;

      // Calculate final stats
      const completionData = {
        total_questions: this.gameStats.totalQuestions,
        correct_answers: this.gameStats.correctAnswers,
        total_points: this.gameStats.totalPoints,
        time_spent: Math.floor((new Date().getTime() - this.gameSession.start_time.getTime()) / 1000),
        completion_percentage: (this.gameStats.correctAnswers / this.gameStats.totalQuestions) * 100
      };

      // Save completion to backend
      await this.gameSessionService.completeSession(this.sessionId, completionData).toPromise();

      // Show success message
      this.messageService.add({
        severity: 'success',
        summary: '¡Juego Completado!',
        detail: `Has obtenido ${this.gameStats.totalPoints} puntos`,
        life: 4000
      });

      // Navigate to results after delay
      setTimeout(() => {
        this.router.navigate(['/game/result', this.sessionId]);
      }, 3000);

    } catch (error) {
      console.error('Error completing game:', error);
      this.handleGameError('Error al completar el juego');
    }
  }

  private handleGameError(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 5000
    });

    setTimeout(() => {
      this.router.navigate(['/user/dashboard']);
    }, 2000);
  }

  // Getters for template
  get progressPercentage(): number {
    return (this.gameStats.currentQuestionNumber / this.gameStats.totalQuestions) * 100;
  }

  get timePercentage(): number {
    return (this.gameStats.timeRemaining / this.timeLimit) * 100;
  }

  get canSubmit(): boolean {
    return !!this.selectedOption && !this.isSubmitting && !this.showFeedback;
  }

  get difficultyLabel(): string {
    if (!this.currentQuestion) return '';
    const level = this.currentQuestion.question.difficulty_level;
    return level === 1 ? 'Fácil' : level === 2 ? 'Medio' : 'Difícil';
  }

  get difficultyClass(): any {
    if (!this.currentQuestion) return '';
    const level = this.currentQuestion.question.difficulty_level;
    return level === 1 ? 'success' : level === 2 ? 'warning' : 'danger';
  }

  get streakMessage(): string {
    if (this.gameStats.streakCount === 0) return '';
    if (this.gameStats.streakCount < 3) return `¡${this.gameStats.streakCount} seguidas!`;
    if (this.gameStats.streakCount < 5) return `¡Excelente! ${this.gameStats.streakCount} seguidas`;
    return `¡Increíble! ${this.gameStats.streakCount} respuestas correctas seguidas`;
  }

  getAccuracyPercentage(): number {
    if (this.gameStats.totalQuestions === 0) return 0;
    return Math.round((this.gameStats.correctAnswers / this.gameStats.totalQuestions) * 100);
  }

  // Método para crear preguntas de ejemplo (para testing)
  createSampleQuestions(): Question[] {
    return [
      {
        id: 'sample-1',
        admin_id: 'sample-admin',
        category_id: 'sample-category',
        question_text: '¿Cuál es la principal causa del cambio climático?',
        question_type: 'multiple_choice',
        points: 10,
        difficulty_level: 1,
        order_index: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        options: [
          {
            id: 'opt-1',
            question_id: 'sample-1',
            option_text: 'Las emisiones de gases de efecto invernadero',
            is_correct: true,
            points: 10,
            order_index: 1,
            created_at: new Date().toISOString()
          },
          {
            id: 'opt-2',
            question_id: 'sample-1',
            option_text: 'La deforestación únicamente',
            is_correct: false,
            points: 0,
            order_index: 2,
            created_at: new Date().toISOString()
          },
          {
            id: 'opt-3',
            question_id: 'sample-1',
            option_text: 'Los volcanes',
            is_correct: false,
            points: 0,
            order_index: 3,
            created_at: new Date().toISOString()
          },
          {
            id: 'opt-4',
            question_id: 'sample-1',
            option_text: 'Las manchas solares',
            is_correct: false,
            points: 0,
            order_index: 4,
            created_at: new Date().toISOString()
          }
        ]
      },
      {
        id: 'sample-2',
        admin_id: 'sample-admin',
        category_id: 'sample-category',
        question_text: '¿Qué significa "desarrollo sostenible"?',
        question_type: 'multiple_choice',
        points: 15,
        difficulty_level: 2,
        order_index: 2,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        options: [
          {
            id: 'opt-5',
            question_id: 'sample-2',
            option_text: 'Crecimiento económico sin límites',
            is_correct: false,
            points: 0,
            order_index: 1,
            created_at: new Date().toISOString()
          },
          {
            id: 'opt-6',
            question_id: 'sample-2',
            option_text: 'Satisfacer necesidades actuales sin comprometer futuras generaciones',
            is_correct: true,
            points: 15,
            order_index: 2,
            created_at: new Date().toISOString()
          },
          {
            id: 'opt-7',
            question_id: 'sample-2',
            option_text: 'Solo proteger el medio ambiente',
            is_correct: false,
            points: 0,
            order_index: 3,
            created_at: new Date().toISOString()
          },
          {
            id: 'opt-8',
            question_id: 'sample-2',
            option_text: 'Usar solo energías renovables',
            is_correct: false,
            points: 0,
            order_index: 4,
            created_at: new Date().toISOString()
          }
        ]
      },
      {
        id: 'sample-3',
        admin_id: 'sample-admin',
        category_id: 'sample-category',
        question_text: '¿Cuál es el principal gas de efecto invernadero?',
        question_type: 'multiple_choice',
        points: 20,
        difficulty_level: 3,
        order_index: 3,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        options: [
          {
            id: 'opt-9',
            question_id: 'sample-3',
            option_text: 'Oxígeno (O2)',
            is_correct: false,
            points: 0,
            order_index: 1,
            created_at: new Date().toISOString()
          },
          {
            id: 'opt-10',
            question_id: 'sample-3',
            option_text: 'Dióxido de carbono (CO2)',
            is_correct: true,
            points: 20,
            order_index: 2,
            created_at: new Date().toISOString()
          },
          {
            id: 'opt-11',
            question_id: 'sample-3',
            option_text: 'Nitrógeno (N2)',
            is_correct: false,
            points: 0,
            order_index: 3,
            created_at: new Date().toISOString()
          },
          {
            id: 'opt-12',
            question_id: 'sample-3',
            option_text: 'Hidrógeno (H2)',
            is_correct: false,
            points: 0,
            order_index: 4,
            created_at: new Date().toISOString()
          }
        ]
      }
    ];
  }
}