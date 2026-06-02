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

import { MessageService } from 'primeng/api';

// Models
import { Question, QuestionOption, GameQuestion } from '../../../core/models/question';
import { User, UserResponse } from '../../../core/models/user';
import { GameSession, ActiveGameSession } from '../../../core/models/game-session';
import { EducationalVideo, VideoHelpResult } from '../../../core/models/educational-video';

// Services
import { GameSessionService } from '../../../core/services/game-session.service';
import { QuestionsService } from '../../../core/services/questions.service';
import { UserService } from '../../../core/services/user.service';
import { VideoService } from '../../../core/services/video.service';
import { FilterPipe } from '../../../shared/pipes/filter.pipe';

// Components
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';
import { VideoHelpComponent } from '../../../shared/components/video-help/video-help.component';

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
    BackButtonComponent,
    VideoHelpComponent
  ],
  templateUrl: './game-play.component.html',
  styleUrls: ['./game-play.component.css'],
  providers: []
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
  showQuitDialog = false;
  showPauseDialog = false;

  // Timer
  timeLimit = 30; // segundos por pregunta
  timer$ = new Subject<void>();

  // Offset de preguntas ya respondidas (usado en recuperación desde Supabase)
  private questionOffset = 0;

  // Animation states
  questionTransition = false;
  showFeedback = false;
  feedbackType: 'correct' | 'incorrect' | null = null;

  // Video Help
  showVideoHelp = false;
  currentVideo: EducationalVideo | null = null;
  canUseVideoHelp = true; // Siempre disponible
  videoHelpUsedForCurrentQuestion = false; // Se resetea con cada pregunta

  // Make String available in template
  String = String;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gameSessionService: GameSessionService,
    private questionsService: QuestionsService,
    private userService: UserService,
    private videoService: VideoService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.sessionId = params['sessionId'];
      this.initializeGame();
    });
  }

  ngOnDestroy(): void {
    // Guardar progreso al salir (cubre botón atrás del navegador, cierre de pestaña, etc.)
    if (!this.gameCompleted && this.gameSession) {
      this.saveProgress();
    }
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

  private static readonly ACTIVE_KEY = 'eco_active_session_id';
  private get saveKey(): string { return `eco_session_${this.sessionId}`; }

  private saveProgress(): void {
    if (!this.gameSession || !this.sessionId) return;
    try {
      const snapshot = {
        sessionId:      this.sessionId,
        currentIndex:   this.gameSession.current_question_index,
        questionOffset: this.questionOffset,
        totalQuestions: this.gameStats.totalQuestions,
        correctAnswers: this.gameStats.correctAnswers,
        totalPoints:    this.gameStats.totalPoints,
        streakCount:    this.gameStats.streakCount,
        startTime:      this.gameSession.start_time.toISOString(),
        questions:      this.gameSession.questions
      };
      localStorage.setItem(this.saveKey, JSON.stringify(snapshot));
      localStorage.setItem(GamePlayComponent.ACTIVE_KEY, this.sessionId);
    } catch (e) {
      console.warn('saveProgress: could not serialize state', e);
    }
  }

  private clearSavedProgress(): void {
    localStorage.removeItem(this.saveKey);
    localStorage.removeItem(GamePlayComponent.ACTIVE_KEY);
  }

  static getActiveSessionId(): string | null {
    return localStorage.getItem(GamePlayComponent.ACTIVE_KEY);
  }

  static clearActiveSession(): void {
    localStorage.removeItem(GamePlayComponent.ACTIVE_KEY);
  }

  async initializeGame(): Promise<void> {
    try {
      this.isLoading = true;

      const session = await this.gameSessionService.getGameSession(this.sessionId).toPromise();
      if (!session) { this.handleGameError('Sesión de juego no encontrada'); return; }
      console.log('[EcoChallenge] Sesión cargada - total_questions:', session.total_questions, '| session_id:', this.sessionId);

      if (session.status === 'completed') {
        this.router.navigate(['/game/result', this.sessionId]);
        return;
      }

      const userData = localStorage.getItem('ecobarometro_user');
      if (!userData) { this.handleGameError('Usuario no encontrado'); return; }
      const user = JSON.parse(userData);
      if (!user.admin_id) { this.handleGameError('Usuario no tiene admin_id asignado'); return; }

      // ── Capa 1: Reanudar desde localStorage (solo si el conteo de preguntas coincide con el admin) ──
      const saved = localStorage.getItem(this.saveKey);
      if (saved) {
        try {
          const snapshot = JSON.parse(saved);
          const savedQuestions = snapshot.questions;
          const idx = snapshot.currentIndex ?? 0;

          if (Array.isArray(savedQuestions) && savedQuestions.length > 0) {
            // Verificar que las preguntas guardadas coincidan con el total actual del admin
            const allCurrentQ = await this.questionsService.getOrderedQuestions(user.admin_id, undefined, 1000).toPromise() || [];
            const actualTotal = allCurrentQ.length;

            if (savedQuestions.length === actualTotal) {
              // El conteo coincide → reanudar desde localStorage
              this.questionOffset = snapshot.questionOffset ?? 0;
              this.gameSession = {
                session,
                current_question_index: idx,
                questions: savedQuestions,
                responses: [],
                start_time: new Date(snapshot.startTime || Date.now())
              };
              this.gameStats = {
                currentQuestionNumber: idx + 1 + this.questionOffset,
                totalQuestions:  actualTotal,
                correctAnswers:  snapshot.correctAnswers ?? 0,
                totalPoints:     snapshot.totalPoints    ?? 0,
                timeRemaining:   this.timeLimit,
                streakCount:     snapshot.streakCount    ?? 0
              };
              this.loadCurrentQuestion();
              this.startTimer();
              return;
            } else {
              // Conteo desactualizado → limpiar localStorage y recargar desde DB
              console.log('[EcoChallenge] Snapshot desactualizado (' + savedQuestions.length + ' vs ' + actualTotal + '), recargando desde DB');
              this.clearSavedProgress();
              // Usar las preguntas ya cargadas para continuar con Capa 3
              const questions = allCurrentQ.map(gq => gq.question);
              this.questionOffset = 0;
              this.gameSession = { session, current_question_index: 0, questions, responses: [], start_time: new Date() };
              this.gameStats = {
                currentQuestionNumber: 1,
                totalQuestions: questions.length,
                correctAnswers: 0,
                totalPoints: 0,
                timeRemaining: this.timeLimit,
                streakCount: 0
              };
              this.saveProgress();
              this.loadCurrentQuestion();
              this.startTimer();
              return;
            }
          }
        } catch (e) {
          console.warn('initializeGame: localStorage restore failed, trying Supabase fallback', e);
          this.clearSavedProgress();
        }
      }

      // ── Capa 2: Fallback desde Supabase (localStorage vacío, pero hay respuestas guardadas) ──
      // Con preguntas en orden FIJO, podemos saber exactamente dónde quedó el usuario.
      const prevResponses = await this.gameSessionService
        .getSessionResponses(this.sessionId).toPromise() || [];

      if (prevResponses.length > 0) {
        const answeredIds  = new Set(prevResponses.map((r: any) => r.question_id));
        const correctCount = prevResponses.filter((r: any) => r.is_correct).length;
        const totalPts     = prevResponses.reduce((s: number, r: any) => s + (r.points_earned || 0), 0);

        // Preguntas en ORDEN FIJO — las respondidas son siempre las primeras N
        const allGameQ = await this.questionsService.getOrderedQuestions(user.admin_id, undefined, 1000).toPromise() || [];
        const remaining = allGameQ.filter(gq => !answeredIds.has(gq.question.id));

        if (remaining.length > 0) {
          const questions = remaining.map(gq => gq.question);
          this.questionOffset = prevResponses.length;

          this.gameSession = {
            session,
            current_question_index: 0,
            questions,
            responses: [],
            start_time: new Date(session.started_at || Date.now())
          };
          this.gameStats = {
            currentQuestionNumber: prevResponses.length + 1,
            totalQuestions:  prevResponses.length + remaining.length,
            correctAnswers:  correctCount,
            totalPoints:     totalPts,
            timeRemaining:   this.timeLimit,
            streakCount:     0
          };

          this.saveProgress();
          this.loadCurrentQuestion();
          this.startTimer();
          return;
        }
      }

      // ── Capa 3: Primera vez — cargar preguntas en orden fijo ──
      const questionCount = await this.questionsService.checkQuestionsExist(user.admin_id).toPromise();
      if (questionCount === 0) {
        this.handleGameError('No se encontraron preguntas para el administrador.');
        return;
      }

      // Usar getOrderedQuestions para que el orden sea siempre determinista
      const gameQuestions = await this.questionsService.getOrderedQuestions(user.admin_id, undefined, 1000).toPromise();

      if (!gameQuestions || gameQuestions.length === 0) {
        this.handleGameError('No se pudieron cargar las preguntas.');
        return;
      }

      const questions = gameQuestions.map(gq => gq.question);
      this.questionOffset = 0;

      this.gameSession = {
        session,
        current_question_index: 0,
        questions,
        responses: [],
        start_time: new Date()
      };

      this.gameStats = {
        currentQuestionNumber: 1,
        totalQuestions: questions.length,
        correctAnswers: 0,
        totalPoints:    0,
        timeRemaining:  this.timeLimit,
        streakCount:    0
      };

      this.saveProgress();
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
    this.gameStats.currentQuestionNumber = this.gameSession.current_question_index + 1 + this.questionOffset;

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

      // Si es incorrecta Y puede usar video help (y no lo ha usado para esta pregunta), NO avanzar automáticamente
      if (this.canUseVideoHelp && !this.videoHelpUsedForCurrentQuestion) {
        this.showFeedback = true;
        this.isSubmitting = false;

        // Save response to backend
        try {
          await this.gameSessionService.submitResponse(response).toPromise();
        } catch (error) {
          console.error('Error saving response:', error);
        }

        this.gameSession.responses.push(response);

        // Mostrar opción de ayuda en lugar de avanzar
        return; // Salir temprano
      }
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

    this.isSubmitting = false;

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

    // Save empty response (time expired — no option selected, 0 points)
    if (this.currentQuestion && this.gameSession) {
      const response: UserResponse = {
        id: '',
        user_id: this.currentUser?.id || '',
        question_id: this.currentQuestion.question.id,
        session_id: this.sessionId,
        selected_option_id: null as any,
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
    this.videoHelpUsedForCurrentQuestion = false;

    if (this.gameSession) {
      this.gameSession.current_question_index++;
      this.saveProgress(); // persistir progreso después de cada pregunta
    }

    setTimeout(() => {
      this.questionTransition = false;
      this.loadCurrentQuestion();
      this.startTimer();
      this.isSubmitting = false;
    }, 500);
  }

  pauseGame(): void {
    this.timer$.next();
    this.isPaused = true;
    this.showPauseDialog = true;
  }

  resumeGame(): void {
    this.showPauseDialog = false;
    this.isPaused = false;
    this.startTimer();
  }

  quitGame(): void {
    this.timer$.next(); // detener timer mientras está el modal
    this.isPaused = true;
    this.showQuitDialog = true;
  }

  cancelQuit(): void {
    this.showQuitDialog = false;
    this.isPaused = false;
    this.startTimer(); // reanudar timer
  }

  saveAndQuit(): void {
    this.showQuitDialog = false;
    this.saveProgress(); // asegura que el último estado queda guardado
    // NO llamamos abandonSession() — la sesión queda in_progress para poder reanudar
    this.router.navigate(['/user/dashboard']);
  }

  async abandonGame(): Promise<void> {
    // Solo se llama si en el futuro se quiere abandonar definitivamente
    try {
      if (this.gameSession) {
        await this.gameSessionService.abandonSession(this.sessionId).toPromise();
      }
      this.clearSavedProgress();
      this.router.navigate(['/user/dashboard']);
    } catch (error) {
      this.clearSavedProgress();
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

      // Limpiar progreso guardado — la partida ya terminó
      this.clearSavedProgress();

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

  get questionSegments(): number[] {
    return Array.from({ length: this.gameStats.totalQuestions }, (_, i) => i);
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

  // ==================== VIDEO HELP METHODS ====================

  /**
   * Abrir modal de ayuda con video educativo
   */
  openVideoHelp(): void {
    if (!this.canUseVideoHelp || this.videoHelpUsedForCurrentQuestion) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Ayuda no disponible',
        detail: 'Ya has usado la ayuda de video para esta pregunta',
        life: 3000
      });
      return;
    }

    const userData = localStorage.getItem('ecobarometro_user');
    if (!userData) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo obtener la información del usuario',
        life: 3000
      });
      return;
    }

    const user = JSON.parse(userData);

    // Obtener video aleatorio
    this.videoService.getRandomVideo(user.admin_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (video) => {
          this.currentVideo = video;
          this.showVideoHelp = true;
        },
        error: (err) => {
          console.error('Error loading video:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar el video educativo. Es posible que no haya videos disponibles.',
            life: 4000
          });
        }
      });
  }

  /**
   * Manejar completación exitosa del video help
   */
  onVideoHelpCompleted(result: VideoHelpResult): void {
    // Aplicar bonificaciones
    this.gameStats.timeRemaining += result.time_bonus; // +30s
    this.gameStats.totalPoints += result.points_bonus; // +10 puntos

    // Marcar como usado solo para esta pregunta
    this.videoHelpUsedForCurrentQuestion = true;

    // Mostrar mensaje de éxito
    this.messageService.add({
      severity: 'success',
      summary: '¡Bonificación aplicada!',
      detail: `+${result.time_bonus}s de tiempo y +${result.points_bonus} puntos ganados`,
      life: 5000
    });

    // Cerrar modal
    this.showVideoHelp = false;
    this.currentVideo = null;

    // Continuar con siguiente pregunta después de un breve delay
    setTimeout(() => {
      this.nextQuestion();
    }, 1500);
  }

  /**
   * Manejar cancelación del video help
   */
  onVideoHelpCancelled(): void {
    this.showVideoHelp = false;
    this.currentVideo = null;

    // Continuar con siguiente pregunta
    setTimeout(() => {
      this.nextQuestion();
    }, 500);
  }

  /**
   * Continuar sin usar la ayuda de video
   */
  continueWithoutHelp(): void {
    setTimeout(() => {
      this.nextQuestion();
    }, 500);
  }
}