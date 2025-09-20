// src/app/shared/components/level-progress/level-progress.component.ts
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-level-progress',
  templateUrl: './level-progress.component.html',
  styleUrls: ['./level-progress.component.css'],
  animations: [
    trigger('levelUp', [
      state('normal', style({ transform: 'scale(1)' })),
      state('celebration', style({ transform: 'scale(1.1)' })),
      transition('normal => celebration', [
        animate('200ms ease-out', style({ transform: 'scale(1.2)' })),
        animate('300ms ease-in-out', style({ transform: 'scale(1.1)' }))
      ]),
      transition('celebration => normal', animate('500ms ease-out'))
    ]),
    trigger('progressFill', [
      transition(':enter', [
        style({ width: '0%' }),
        animate('1000ms ease-out', style({ width: '*' }))
      ])
    ]),
    trigger('sparkle', [
      state('hidden', style({ opacity: 0, transform: 'scale(0.5)' })),
      state('visible', style({ opacity: 1, transform: 'scale(1)' })),
      transition('hidden => visible', animate('300ms ease-out')),
      transition('visible => hidden', animate('300ms ease-in'))
    ])
  ]
})
export class LevelProgressComponent implements OnInit, OnChanges {
  @Input() currentLevel: number = 1;
  @Input() currentExp: number = 0;
  @Input() expToNext: number = 1000;
  @Input() totalExp?: number;
  @Input() showDetails: boolean = true;
  @Input() showLevelName: boolean = true;
  @Input() animated: boolean = true;
  @Input() variant: 'default' | 'compact' | 'circular' | 'card' = 'default';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() theme: 'eco' | 'gaming' | 'professional' = 'eco';

  progressPercentage: number = 0;
  displayExp: number = 0;
  animationState: string = 'normal';
  showSparkles: boolean = false;
  previousLevel: number = 1;

  private animationFrame?: number;

  // Configuración de niveles
  private levelThresholds = [
    { min: 1, max: 5, name: 'Explorador Eco', icon: '🌱', color: '#22c55e', bgColor: '#dcfce7' },
    { min: 6, max: 10, name: 'Guardián Verde', icon: '🌿', color: '#16a34a', bgColor: '#bbf7d0' },
    { min: 11, max: 15, name: 'Protector Natural', icon: '🌳', color: '#15803d', bgColor: '#86efac' },
    { min: 16, max: 25, name: 'Eco Guerrero', icon: '🦎', color: '#166534', bgColor: '#4ade80' },
    { min: 26, max: 35, name: 'Maestro Ambiental', icon: '🦅', color: '#14532d', bgColor: '#22c55e' },
    { min: 36, max: 50, name: 'Sabio de la Tierra', icon: '🌍', color: '#052e16', bgColor: '#16a34a' },
    { min: 51, max: 75, name: 'Campeón Ecológico', icon: '🏆', color: '#fbbf24', bgColor: '#fef3c7' },
    { min: 76, max: 100, name: 'Leyenda Verde', icon: '👑', color: '#f59e0b', bgColor: '#fed7aa' },
    { min: 101, max: 999, name: 'Dios de la Naturaleza', icon: '⚡', color: '#d97706', bgColor: '#fdba74' }
  ];
Math: any;

  ngOnInit() {
    this.previousLevel = this.currentLevel;
    this.calculateProgress();
    if (this.animated) {
      this.animateExpGain();
    } else {
      this.displayExp = this.currentExp;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['currentLevel'] && !changes['currentLevel'].firstChange) {
      const newLevel = changes['currentLevel'].currentValue;
      const oldLevel = changes['currentLevel'].previousValue;
      
      if (newLevel > oldLevel) {
        this.triggerLevelUpAnimation();
      }
      this.previousLevel = oldLevel;
    }

    if (changes['currentExp'] || changes['expToNext']) {
      this.calculateProgress();
      if (this.animated && changes['currentExp']) {
        this.animateExpGain();
      }
    }
  }

  private calculateProgress() {
    this.progressPercentage = this.expToNext > 0 ? (this.currentExp / this.expToNext) * 100 : 0;
    this.progressPercentage = Math.min(100, Math.max(0, this.progressPercentage));
  }

  private animateExpGain() {
    const startExp = this.displayExp;
    const endExp = this.currentExp;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      this.displayExp = Math.round(startExp + (endExp - startExp) * easeOutCubic);
      
      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.displayExp = endExp;
      }
    };

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    this.animationFrame = requestAnimationFrame(animate);
  }

  private triggerLevelUpAnimation() {
    this.animationState = 'celebration';
    this.showSparkles = true;

    setTimeout(() => {
      this.animationState = 'normal';
    }, 1000);

    setTimeout(() => {
      this.showSparkles = false;
    }, 2000);
  }

  getLevelInfo() {
    return this.levelThresholds.find(level => 
      this.currentLevel >= level.min && this.currentLevel <= level.max
    ) || this.levelThresholds[this.levelThresholds.length - 1];
  }

  getNextLevelInfo() {
    const nextLevel = this.currentLevel + 1;
    return this.levelThresholds.find(level => 
      nextLevel >= level.min && nextLevel <= level.max
    ) || this.levelThresholds[this.levelThresholds.length - 1];
  }

  get containerClasses(): string {
    const classes = ['level-progress-container'];
    
    classes.push(`variant-${this.variant}`);
    classes.push(`size-${this.size}`);
    classes.push(`theme-${this.theme}`);
    
    if (this.animated) {
      classes.push('animated');
    }
    
    return classes.join(' ');
  }

  get progressBarClasses(): string {
    const classes = ['progress-bar'];
    const levelInfo = this.getLevelInfo();
    
    if (this.theme === 'eco') {
      classes.push('eco-gradient');
    } else if (this.theme === 'gaming') {
      classes.push('gaming-gradient');
    } else {
      classes.push('professional-gradient');
    }
    
    return classes.join(' ');
  }

  getExpToNextLevel(): number {
    return this.expToNext - this.currentExp;
  }

  getEstimatedGamesToNext(): number {
    const avgExpPerGame = 150; // Estimación
    return Math.ceil(this.getExpToNextLevel() / avgExpPerGame);
  }

  ngOnDestroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}