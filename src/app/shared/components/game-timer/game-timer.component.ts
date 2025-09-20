// src/app/shared/components/game-timer/game-timer.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-game-timer',
  templateUrl: './game-timer.component.html',
  styleUrls: ['./game-timer.component.css'],
  animations: [
    trigger('timerPulse', [
      state('normal', style({ transform: 'scale(1)' })),
      state('warning', style({ transform: 'scale(1.05)' })),
      state('critical', style({ transform: 'scale(1.1)' })),
      transition('normal => warning', animate('300ms ease-out')),
      transition('warning => critical', animate('200ms ease-out')),
      transition('* => normal', animate('300ms ease-in'))
    ]),
    trigger('timeAlert', [
      state('hidden', style({ opacity: 0, transform: 'scale(0.8)' })),
      state('visible', style({ opacity: 1, transform: 'scale(1)' })),
      transition('hidden => visible', animate('200ms ease-out')),
      transition('visible => hidden', animate('200ms ease-in'))
    ])
  ]
})
export class GameTimerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() totalTime: number = 30; // Tiempo total en segundos
  @Input() autoStart: boolean = true;
  @Input() showProgress: boolean = true;
  @Input() variant: 'circular' | 'linear' | 'digital' | 'minimal' = 'circular';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() warningTime: number = 10; // Segundos para mostrar advertencia
  @Input() criticalTime: number = 5; // Segundos para mostrar estado crítico
  @Input() showMilliseconds: boolean = false;
  @Input() pauseOnHover: boolean = false;
  @Input() playSound: boolean = true;

  @Output() timeUp = new EventEmitter<void>();
  @Output() timeWarning = new EventEmitter<number>();
  @Output() timeCritical = new EventEmitter<number>();
  @Output() tick = new EventEmitter<number>();
  @Output() pause = new EventEmitter<void>();
  @Output() resume = new EventEmitter<void>();

  currentTime: number = 0;
  isRunning: boolean = false;
  isPaused: boolean = false;
  animationState: string = 'normal';
  showAlert: boolean = false;

  private intervalId?: number;
  private lastTickTime: number = 0;

  ngOnInit() {
    this.currentTime = this.totalTime;
    if (this.autoStart) {
      this.start();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['totalTime'] && !changes['totalTime'].firstChange) {
      this.reset();
    }
  }

  ngOnDestroy() {
    this.stop();
  }

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.isPaused = false;
    this.lastTickTime = Date.now();
    
    this.intervalId = window.setInterval(() => {
      if (!this.isPaused) {
        this.updateTimer();
      }
    }, this.showMilliseconds ? 100 : 1000);
  }

  pause() {
    if (!this.isRunning || this.isPaused) return;
    
    this.isPaused = true;
    this.pause.emit();
  }

  resume() {
    if (!this.isRunning || !this.isPaused) return;
    
    this.isPaused = false;
    this.lastTickTime = Date.now();
    this.resume.emit();
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  reset() {
    this.stop();
    this.currentTime = this.totalTime;
    this.animationState = 'normal';
    this.showAlert = false;
  }

  restart() {
    this.reset();
    this.start();
  }

  private updateTimer() {
    const now = Date.now();
    const deltaTime = this.showMilliseconds ? 0.1 : 1;
    
    this.currentTime = Math.max(0, this.currentTime - deltaTime);
    this.lastTickTime = now;
    
    // Emitir eventos
    this.tick.emit(this.currentTime);
    this.checkTimeStates();
    
    // Verificar si el tiempo se agotó
    if (this.currentTime <= 0) {
      this.stop();
      this.timeUp.emit();
      this.playTimeUpSound();
    }
  }

  private checkTimeStates() {
    const prevState = this.animationState;
    
    if (this.currentTime <= this.criticalTime && this.currentTime > 0) {
      this.animationState = 'critical';
      if (prevState !== 'critical') {
        this.timeCritical.emit(this.currentTime);
        this.showAlert = true;
        this.playCriticalSound();
      }
    } else if (this.currentTime <= this.warningTime) {
      this.animationState = 'warning';
      if (prevState === 'normal') {
        this.timeWarning.emit(this.currentTime);
        this.playWarningSound();
      }
    } else {
      this.animationState = 'normal';
      this.showAlert = false;
    }
  }

  private playWarningSound() {
    if (this.playSound) {
      this.playBeep(800, 200);
    }
  }

  private playCriticalSound() {
    if (this.playSound) {
      this.playBeep(1000, 100);
      setTimeout(() => this.playBeep(1000, 100), 200);
    }
  }

  private playTimeUpSound() {
    if (this.playSound) {
      this.playBeep(400, 500);
    }
  }

  private playBeep(frequency: number, duration: number) {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      console.warn('Audio not supported:', error);
    }
  }

  get progressPercentage(): number {
    return ((this.totalTime - this.currentTime) / this.totalTime) * 100;
  }

  get remainingPercentage(): number {
    return (this.currentTime / this.totalTime) * 100;
  }

  get formattedTime(): string {
    if (this.showMilliseconds) {
      const seconds = Math.floor(this.currentTime);
      const milliseconds = Math.floor((this.currentTime % 1) * 10);
      return `${this.formatSeconds(seconds)}.${milliseconds}`;
    }
    return this.formatSeconds(Math.ceil(this.currentTime));
  }

  private formatSeconds(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return secs.toString();
  }

  get timerClasses(): string {
    const classes = ['timer-container'];
    
    // Tamaño
    switch (this.size) {
      case 'small':
        classes.push('timer-small');
        break;
      case 'large':
        classes.push('timer-large');
        break;
      default:
        classes.push('timer-medium');
    }
    
    // Estado
    classes.push(`timer-${this.animationState}`);
    
    // Variante
    classes.push(`timer-${this.variant}`);
    
    if (this.isPaused) {
      classes.push('timer-paused');
    }
    
    return classes.join(' ');
  }

  get strokeColor(): string {
    switch (this.animationState) {
      case 'critical':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      default:
        return '#22c55e';
    }
  }

  get textColor(): string {
    switch (this.animationState) {
      case 'critical':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-green-600';
    }
  }

  // Métodos para control externo
  onMouseEnter() {
    if (this.pauseOnHover && this.isRunning && !this.isPaused) {
      this.pause();
    }
  }

  onMouseLeave() {
    if (this.pauseOnHover && this.isRunning && this.isPaused) {
      this.resume();
    }
  }

  togglePause() {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  addTime(seconds: number) {
    this.currentTime = Math.min(this.totalTime, this.currentTime + seconds);
  }

  subtractTime(seconds: number) {
    this.currentTime = Math.max(0, this.currentTime - seconds);
  }
}