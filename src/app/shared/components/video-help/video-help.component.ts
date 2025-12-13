// src/app/shared/components/video-help/video-help.component.ts

import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { ChipModule } from 'primeng/chip';
import { MessageService } from 'primeng/api';

// Models & Services
import { EducationalVideo, VideoStep, VideoHelpResult, CreateVideoHelpSessionRequest } from '../../../core/models/educational-video';
import { VideoService } from '../../../core/services/video.service';

// Declaración global para YouTube
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

@Component({
  selector: 'app-video-help',
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    ProgressBarModule,
    CardModule,
    ToastModule,
    ChipModule,
    DragDropModule
  ],
  providers: [MessageService],
  templateUrl: './video-help.component.html',
  styleUrls: ['./video-help.component.css']
})
export class VideoHelpComponent implements OnInit, OnDestroy {
  @Input() visible = false;
  @Input() video: EducationalVideo | null = null;
  @Input() gameSessionId = '';
  @Input() userId = '';

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() completed = new EventEmitter<VideoHelpResult>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('youtubePlayerContainer', { static: false }) youtubePlayerContainer!: ElementRef;

  // YouTube Player
  private player: any = null;
  private playerReady = false;
  private progressCheckInterval: any = null;

  // State
  watchProgress = 0;
  miniGameEnabled = false;
  miniGameCompleted = false;
  shuffledSteps: VideoStep[] = [];
  attempts = 0;
  attemptedSubmit = false;
  isSubmitting = false;

  // Session tracking
  private videoHelpSessionId = '';

  private destroy$ = new Subject<void>();

  constructor(
    private videoService: VideoService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    if (this.video) {
      this.loadYouTubeAPI();
      this.initializeVideo();
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========== YOUTUBE API ==========

  loadYouTubeAPI(): void {
    // Verificar si ya está cargado
    if (window.YT && window.YT.Player) {
      this.initializePlayer();
      return;
    }

    // Cargar script si no existe
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Configurar callback global
    window.onYouTubeIframeAPIReady = () => {
      this.initializePlayer();
    };
  }

  initializePlayer(): void {
    if (!this.video?.youtube_video_id) {
      console.error('No se puede inicializar player: video_id faltante');
      return;
    }

    // Esperar a que el contenedor esté disponible
    setTimeout(() => {
      try {
        this.player = new window.YT.Player('youtube-player', {
          height: '100%',
          width: '100%',
          videoId: this.video!.youtube_video_id,
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            fs: 1
          },
          events: {
            onReady: (event: any) => this.onPlayerReady(event),
            onStateChange: (event: any) => this.onPlayerStateChange(event)
          }
        });
      } catch (error) {
        console.error('Error al inicializar YouTube player:', error);
      }
    }, 500);
  }

  onPlayerReady(event: any): void {
    this.playerReady = true;
    console.log('YouTube player ready');
  }

  onPlayerStateChange(event: any): void {
    const YT = window.YT;

    if (event.data === YT.PlayerState.PLAYING) {
      this.startProgressTracking();
    } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
      this.stopProgressTracking();
    }
  }

  startProgressTracking(): void {
    if (this.progressCheckInterval) return;

    this.progressCheckInterval = setInterval(() => {
      if (this.player && this.playerReady) {
        try {
          const currentTime = this.player.getCurrentTime();
          const duration = this.player.getDuration();

          if (duration > 0) {
            const progress = Math.floor((currentTime / duration) * 100);

            if (progress > this.watchProgress) {
              this.watchProgress = Math.min(progress, 100);
              this.updateWatchProgress(this.watchProgress);

              // Desbloquear mini-juego al 50%
              if (this.watchProgress >= 50 && !this.miniGameEnabled) {
                this.enableMiniGame();
              }
            }
          }
        } catch (error) {
          console.error('Error tracking progress:', error);
        }
      }
    }, 1000);
  }

  stopProgressTracking(): void {
    if (this.progressCheckInterval) {
      clearInterval(this.progressCheckInterval);
      this.progressCheckInterval = null;
    }
  }

  // ========== SESSION TRACKING ==========

  initializeVideo(): void {
    if (!this.video || !this.gameSessionId || !this.userId) {
      console.error('Faltan datos para inicializar video');
      return;
    }

    // Crear sesión de ayuda
    const sessionData: CreateVideoHelpSessionRequest = {
      user_id: this.userId,
      game_session_id: this.gameSessionId,
      video_id: this.video.id,
      watch_percentage: 0
    };

    this.videoService.createVideoHelpSession(sessionData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (session) => {
          this.videoHelpSessionId = session.id;
          // Incrementar contador de vistas
          this.videoService.incrementViewCount(this.video!.id).subscribe();
        },
        error: (err) => {
          console.error('Error creating video help session:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear la sesión de ayuda',
            life: 3000
          });
        }
      });
  }

  updateWatchProgress(percentage: number): void {
    if (!this.videoHelpSessionId) return;

    this.videoService.updateVideoProgress(this.videoHelpSessionId, percentage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => console.error('Error updating progress:', err)
      });
  }

  // ========== MINI-GAME ==========

  enableMiniGame(): void {
    this.miniGameEnabled = true;
    this.shuffleSteps();

    this.messageService.add({
      severity: 'success',
      summary: '¡Mini-juego desbloqueado!',
      detail: 'Ahora puedes ordenar los pasos para ganar recompensas',
      life: 4000
    });

    // Pausar el video automáticamente
    if (this.player && this.playerReady) {
      try {
        this.player.pauseVideo();
      } catch (error) {
        console.error('Error pausando video:', error);
      }
    }
  }

  shuffleSteps(): void {
    if (!this.video?.steps || this.video.steps.length === 0) {
      console.error('No hay pasos para mezclar');
      return;
    }

    // Copiar y mezclar pasos
    this.shuffledSteps = [...this.video.steps].sort(() => Math.random() - 0.5);
  }

  onStepDrop(event: CdkDragDrop<VideoStep[]>): void {
    moveItemInArray(this.shuffledSteps, event.previousIndex, event.currentIndex);
  }

  isStepInCorrectPosition(currentIndex: number): boolean {
    if (!this.shuffledSteps || this.shuffledSteps.length === 0) return false;

    const currentStep = this.shuffledSteps[currentIndex];
    return currentStep.order_index === (currentIndex + 1);
  }

  checkOrder(): void {
    this.attempts++;
    this.attemptedSubmit = true;

    // Verificar si todos los pasos están en orden correcto
    const allCorrect = this.shuffledSteps.every((step, index) =>
      step.order_index === (index + 1)
    );

    if (allCorrect) {
      this.completeMiniGameSuccess();
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Orden incorrecto',
        detail: `Intento ${this.attempts}. Revisa el orden de los pasos.`,
        life: 3000
      });

      // Resetear el indicador de intento después de 2 segundos
      setTimeout(() => {
        this.attemptedSubmit = false;
      }, 2000);
    }
  }

  completeMiniGameSuccess(): void {
    this.isSubmitting = true;

    this.videoService.completeMiniGame(this.videoHelpSessionId, this.attempts)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.miniGameCompleted = true;
          this.isSubmitting = false;

          this.messageService.add({
            severity: 'success',
            summary: '¡Correcto!',
            detail: `Has ganado ${result.time_bonus}s y ${result.points_bonus} puntos`,
            life: 5000
          });

          // Emitir resultado después de un breve delay
          setTimeout(() => {
            this.completed.emit(result);
          }, 2000);
        },
        error: (err) => {
          console.error('Error completing mini-game:', err);
          this.isSubmitting = false;

          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo guardar el resultado',
            life: 3000
          });
        }
      });
  }

  // ========== ACTIONS ==========

  closeAndApplyRewards(): void {
    this.close();
  }

  cancel(): void {
    this.cancelled.emit();
    this.close();
  }

  close(): void {
    this.cleanup();
    this.visible = false;
    this.visibleChange.emit(false);
  }

  cleanup(): void {
    this.stopProgressTracking();

    if (this.player) {
      try {
        this.player.destroy();
      } catch (error) {
        console.error('Error destroying player:', error);
      }
      this.player = null;
    }

    this.playerReady = false;
    this.watchProgress = 0;
    this.miniGameEnabled = false;
    this.miniGameCompleted = false;
    this.shuffledSteps = [];
    this.attempts = 0;
    this.attemptedSubmit = false;
    this.videoHelpSessionId = '';
  }
}
