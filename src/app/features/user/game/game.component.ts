import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { RadioButtonModule } from 'primeng/radiobutton';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SkeletonModule } from 'primeng/skeleton';
import { DialogModule } from 'primeng/dialog';

// Services
import { QuestionsService } from '../../../core/services/questions.service';
import { GameSessionService } from '../../../core/services/game-session.service';

// Models
import { GameQuestion } from '../../../core/models/question';
import { GameSession } from '../../../core/services/game-session.service';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    CardModule,
    ButtonModule,
    ProgressBarModule,
    RadioButtonModule,
    ToastModule,
    SkeletonModule,
    DialogModule
  ],
  providers: [MessageService],
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // State
  loading = true;
  gameSession: GameSession | null = null;
  questions: GameQuestion[] = [];
  currentQuestionIndex = 0;
  selectedOptionId: string | null = null;
  timeRemaining = 30;
  timerInterval: any;
  score = 0;
  correctAnswers = 0;
  startTime = Date.now();

  // Flags
  isAnswerSubmitted = false;
  showResults = false;
  noQuestionsAvailable = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private questionsService: QuestionsService,
    private gameSessionService: GameSessionService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    const sessionId = this.route.snapshot.paramMap.get('id');

    if (sessionId) {
      this.loadGameSession(sessionId);
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se encontró la sesión de juego'
      });
      this.router.navigate(['/user/dashboard']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  loadGameSession(sessionId: string): void {
    this.loading = true;

    this.gameSessionService.getGameSession(sessionId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (session) => {
          this.gameSession = session;
          this.loadQuestions(session.admin_id);
        },
        error: (error) => {
          console.error('Error loading game session:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar la sesión de juego'
          });
          this.loading = false;
          this.router.navigate(['/user/dashboard']);
        }
      });
  }

  loadQuestions(adminId: string): void {
    console.log('🎮 Cargando preguntas para admin:', adminId);

    // Verificar primero si hay preguntas
    this.questionsService.checkQuestionsExist(adminId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (count) => {
          console.log(`📊 Total de preguntas encontradas: ${count}`);

          if (count === 0) {
            this.noQuestionsAvailable = true;
            this.loading = false;
            this.messageService.add({
              severity: 'warn',
              summary: 'Sin Preguntas',
              detail: 'No hay preguntas disponibles. Por favor, contacta al administrador para que agregue preguntas.'
            });
            return;
          }

          // Si hay preguntas, cargarlas
          this.questionsService.getRandomQuestions(adminId, undefined, this.gameSession?.total_questions || 10)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (questions) => {
                console.log('✅ Preguntas cargadas:', questions.length);

                if (questions.length === 0) {
                  this.noQuestionsAvailable = true;
                  this.messageService.add({
                    severity: 'warn',
                    summary: 'Sin Preguntas',
                    detail: 'No se pudieron cargar preguntas para el juego'
                  });
                } else {
                  this.questions = questions;
                  this.startTimer();
                }

                this.loading = false;
              },
              error: (error) => {
                console.error('Error loading questions:', error);
                this.noQuestionsAvailable = true;
                this.loading = false;
                this.messageService.add({
                  severity: 'error',
                  summary: 'Error',
                  detail: 'Error al cargar las preguntas'
                });
              }
            });
        },
        error: (error) => {
          console.error('Error checking questions:', error);
          this.loading = false;
        }
      });
  }

  startTimer(): void {
    const question = this.currentQuestion;
    if (question) {
      // Usar time_limit de la pregunta si existe, o 30 segundos por defecto
      this.timeRemaining = question.question.time_limit || 30;

      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }

      this.timerInterval = setInterval(() => {
        this.timeRemaining--;

        if (this.timeRemaining <= 0) {
          clearInterval(this.timerInterval);
          this.submitAnswer();
        }
      }, 1000);
    }
  }

  submitAnswer(): void {
    if (this.isAnswerSubmitted) return;

    this.isAnswerSubmitted = true;
    clearInterval(this.timerInterval);

    const question = this.currentQuestion;
    if (!question) return;

    // Verificar si la respuesta es correcta
    const correctOption = question.options.find(opt => opt.is_correct);
    const isCorrect = this.selectedOptionId === correctOption?.id;

    if (isCorrect) {
      this.correctAnswers++;
      const points = (question.question.points || 10) + (question.bonus_points || 0);
      this.score += points;

      this.messageService.add({
        severity: 'success',
        summary: '¡Correcto!',
        detail: `+${points} puntos`
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Incorrecto',
        detail: `La respuesta correcta era: ${correctOption?.option_text}`
      });
    }

    // Guardar respuesta en la BD
    if (this.gameSession) {
      this.gameSessionService.submitResponse({
        session_id: this.gameSession.id,
        user_id: this.gameSession.user_id,
        question_id: question.question.id,
        selected_option_id: this.selectedOptionId,
        is_correct: isCorrect,
        points_earned: isCorrect ? (question.question.points || 10) : 0,
        time_taken: (question.time_limit || 30) - this.timeRemaining
      }).pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (error) => console.error('Error saving response:', error)
      });
    }

    // Esperar 2 segundos antes de avanzar a la siguiente pregunta
    setTimeout(() => {
      this.nextQuestion();
    }, 2000);
  }

  nextQuestion(): void {
    this.isAnswerSubmitted = false;
    this.selectedOptionId = null;

    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
      this.startTimer();
    } else {
      this.finishGame();
    }
  }

  finishGame(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    if (!this.gameSession) return;

    const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
    const completionPercentage = Math.round((this.correctAnswers / this.questions.length) * 100);

    // Actualizar sesión de juego
    this.gameSessionService.completeGameSession(this.gameSession.id, {
      correct_answers: this.correctAnswers,
      total_points: this.score,
      time_spent: timeSpent,
      completion_percentage: completionPercentage,
      status: 'completed'
    }).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        console.log('✅ Sesión de juego completada');
        this.showResults = true;
      },
      error: (error) => {
        console.error('Error completing game session:', error);
        this.showResults = true;
      }
    });
  }

  goToResults(): void {
    if (this.gameSession) {
      this.router.navigate(['/game/results', this.gameSession.id]);
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/user/dashboard']);
  }

  get currentQuestion(): GameQuestion | null {
    return this.questions[this.currentQuestionIndex] || null;
  }

  get progress(): number {
    if (this.questions.length === 0) return 0;
    return ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
  }

  get progressLabel(): string {
    return `${this.currentQuestionIndex + 1} / ${this.questions.length}`;
  }

  get timePercentage(): number {
    if (!this.currentQuestion) return 100;
    return (this.timeRemaining / (this.currentQuestion.question.time_limit || 30)) * 100;
  }

  get timeColor(): string {
    if (this.timePercentage > 50) return '#22c55e';
    if (this.timePercentage > 25) return '#f59e0b';
    return '#ef4444';
  }

  getDifficultyLabel(level: number): string {
    switch (level) {
      case 1: return 'Fácil';
      case 2: return 'Medio';
      case 3: return 'Difícil';
      default: return 'Medio';
    }
  }

  getDifficultyText(level: number): string {
    switch (level) {
      case 1: return 'easy';
      case 2: return 'medium';
      case 3: return 'hard';
      default: return 'medium';
    }
  }
}
