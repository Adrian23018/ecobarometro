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
    FilterPipe
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
String: any;

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

      // Cargar sesión de juego
      const session = await this.gameSessionService.getGameSession(this.sessionId).toPromise();

      if (!session) {
        this.handleGameError('Sesión de juego no encontrada');
        return;
      }

      // Cargar preguntas para la sesión
      const questions = await this.questionsService.getQuestionsForSession(this.sessionId).toPromise();

      this.gameSession = {
        session,
        current_question_index: 0,
        questions: questions || [],
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

      this.loadCurrentQuestion();
      this.startTimer();

    } catch (error) {
      console.error('Error initializing game:', error);
      this.handleGameError('Error al inicializar el juego');
    } finally {
      this.isLoading = false;
    }
  }

  loadCurrentQuestion(): void {
    if (!this.gameSession || this.gameSession.current_question_index >= this.gameSession.questions.length) {
      this.completeGame();
      return;
    }

    const question = this.gameSession.questions[this.gameSession.current_question_index];

    this.currentQuestion = {
      question,
      options: question.options || [],
      time_limit: this.timeLimit,
      bonus_points: this.calculateBonusPoints(question)
    };

    this.selectedOption = null;
    this.gameStats.timeRemaining = this.timeLimit;
    this.gameStats.currentQuestionNumber = this.gameSession.current_question_index + 1;
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
      responded_at: new Date().toISOString(),
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
        responded_at: new Date().toISOString(),
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
}