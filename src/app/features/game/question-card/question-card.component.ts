// src/app/features/game/components/question-card/question-card.component.ts
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { DecimalPipe } from '@angular/common';

export interface Question {
  id: string;
  questionText: string;
  options: QuestionOption[];
  category: {
    name: string;
    icon: string;
    color: string;
  };
  points: number;
  difficultyLevel: number;
}

export interface QuestionOption {
  id: string;
  optionText: string;
  isCorrect: boolean;
  points: number;
}

@Component({
  selector: 'app-question-card',
  templateUrl: './question-card.component.html',
  styleUrls: ['./question-card.component.css'],
  imports: [DecimalPipe],
  standalone: true,
  animations: [
    trigger('cardFlip', [
      state('front', style({ transform: 'rotateY(0deg)' })),
      state('back', style({ transform: 'rotateY(180deg)' })),
      transition('front => back', animate('600ms ease-in-out')),
      transition('back => front', animate('600ms ease-in-out'))
    ]),
    trigger('optionSelect', [
      state('normal', style({ transform: 'scale(1)', backgroundColor: '#ffffff' })),
      state('selected', style({ transform: 'scale(1.05)', backgroundColor: '#dcfce7' })),
      state('correct', style({ transform: 'scale(1.05)', backgroundColor: '#bbf7d0' })),
      state('incorrect', style({ transform: 'scale(0.95)', backgroundColor: '#fecaca' })),
      transition('* => *', animate('300ms ease-in-out'))
    ]),
    trigger('scoreAnimation', [
      state('hidden', style({ opacity: 0, transform: 'translateY(-20px) scale(0.5)' })),
      state('visible', style({ opacity: 1, transform: 'translateY(0) scale(1)' })),
      transition('hidden => visible', animate('500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)'))
    ])
  ]
})
export class QuestionCardComponent implements OnInit {
  @Input() question!: Question;
  @Input() currentQuestionNumber: number = 1;
  @Input() totalQuestions: number = 10;
  @Input() timeRemaining: number = 30;
  @Input() userLevel: number = 1;
  @Input() currentScore: number = 0;

  @Output() optionSelected = new EventEmitter<QuestionOption>();
  @Output() timeExpired = new EventEmitter<void>();

  selectedOption: QuestionOption | any = null;
  showResult: boolean = false;
  cardState: string = 'front';
  scoreState: string = 'hidden';
  timeProgress: number = 100;
  
  private timer: any;
  private initialTime: number = 30;
String: any;

  ngOnInit() {
    this.initialTime = this.timeRemaining;
    this.startTimer();
  }

  ngOnDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  selectOption(option: QuestionOption) {
    if (this.selectedOption || this.showResult) return;

    this.selectedOption = option;
    this.showResult = true;
    this.scoreState = 'visible';
    
    // Detener el timer
    if (this.timer) {
      clearInterval(this.timer);
    }

    // Emitir la opción seleccionada después de una breve pausa
    setTimeout(() => {
      this.optionSelected.emit(option);
    }, 2000); // 2 segundos para mostrar el resultado
  }

  private startTimer() {
    this.timer = setInterval(() => {
      this.timeRemaining--;
      this.timeProgress = (this.timeRemaining / this.initialTime) * 100;
      
      if (this.timeRemaining <= 0) {
        this.timeExpired.emit();
        clearInterval(this.timer);
      }
    }, 1000);
  }

  getOptionState(option: QuestionOption): string {
    if (!this.showResult) {
      return this.selectedOption === option ? 'selected' : 'normal';
    }
    
    if (option === this.selectedOption) {
      return option.isCorrect ? 'correct' : 'incorrect';
    }
    
    if (option.isCorrect) {
      return 'correct';
    }
    
    return 'normal';
  }

  getDifficultyStars(): string[] {
    return Array(this.question.difficultyLevel).fill('star');
  }

  getDifficultyColor(): string {
    switch (this.question.difficultyLevel) {
      case 1: return '#22c55e'; // Verde - Fácil
      case 2: return '#f59e0b'; // Amarillo - Medio
      case 3: return '#ef4444'; // Rojo - Difícil
      default: return '#6b7280';
    }
  }

  getProgressColor(): string {
    if (this.timeProgress > 60) return '#22c55e';
    if (this.timeProgress > 30) return '#f59e0b';
    return '#ef4444';
  }

  getLevelBadgeColor(): string {
    const levelColors = [
      '#84cc16', '#22c55e', '#10b981', '#06b6d4', 
      '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', 
      '#d946ef', '#ec4899'
    ];
    return levelColors[Math.min(this.userLevel - 1, levelColors.length - 1)];
  }
}