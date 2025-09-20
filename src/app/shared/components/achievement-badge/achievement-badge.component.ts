// src/app/shared/components/achievement-badge/achievement-badge.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  badgeColor: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  pointsRequired: number;
  earnedAt?: string;
  isUnlocked: boolean;
  progress?: number; // 0-100
  category?: string;
}

@Component({
  selector: 'app-achievement-badge',
  templateUrl: './achievement-badge.component.html',
  styleUrls: ['./achievement-badge.component.css'],
  animations: [
    trigger('badgeUnlock', [
      state('locked', style({
        transform: 'scale(1)',
        filter: 'grayscale(100%) brightness(0.6)'
      })),
      state('unlocked', style({
        transform: 'scale(1)',
        filter: 'grayscale(0%) brightness(1)'
      })),
      state('celebrating', style({
        transform: 'scale(1.1)',
        filter: 'grayscale(0%) brightness(1.2)'
      })),
      transition('locked => unlocked', [
        animate('300ms ease-out', style({ transform: 'scale(1.2)', filter: 'grayscale(0%) brightness(1.3)' })),
        animate('200ms ease-in', style({ transform: 'scale(1)', filter: 'grayscale(0%) brightness(1)' }))
      ]),
      transition('unlocked => celebrating', animate('200ms ease-out')),
      transition('celebrating => unlocked', animate('200ms ease-in'))
    ]),
    trigger('progressPulse', [
      state('normal', style({ transform: 'scale(1)' })),
      state('updated', style({ transform: 'scale(1.05)' })),
      transition('normal => updated', animate('300ms ease-out')),
      transition('updated => normal', animate('300ms ease-in'))
    ]),
    trigger('shine', [
      state('off', style({ opacity: 0 })),
      state('on', style({ opacity: 1 })),
      transition('off => on', animate('500ms ease-in')),
      transition('on => off', animate('500ms ease-out'))
    ])
  ]
})
export class AchievementBadgeComponent {
  @Input() achievement!: Achievement;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() variant: 'badge' | 'card' | 'minimal' | 'detailed' = 'badge';
  @Input() showProgress: boolean = true;
  @Input() showTooltip: boolean = true;
  @Input() clickable: boolean = true;
  @Input() animated: boolean = true;

  @Output() achievementClick = new EventEmitter<Achievement>();
  @Output() achievementHover = new EventEmitter<Achievement>();

  animationState: string = 'locked';
  showShine: boolean = false;
  progressState: string = 'normal';

  ngOnInit() {
    this.updateAnimationState();
  }

  ngOnChanges() {
    this.updateAnimationState();
  }

  private updateAnimationState() {
    if (this.achievement.isUnlocked) {
      this.animationState = 'unlocked';
      if (this.animated) {
        this.triggerShineEffect();
      }
    } else {
      this.animationState = 'locked';
    }
  }

  private triggerShineEffect() {
    this.showShine = true;
    setTimeout(() => {
      this.showShine = false;
    }, 1000);
  }

  onBadgeClick() {
    if (this.clickable) {
      this.achievementClick.emit(this.achievement);

      if (this.achievement.isUnlocked && this.animated) {
        this.animationState = 'celebrating';
        setTimeout(() => {
          this.animationState = 'unlocked';
        }, 400);
      }
    }
  }

  onBadgeHover() {
    this.achievementHover.emit(this.achievement);
  }

  get rarityConfig() {
    const configs = {
      common: {
        borderColor: '#6b7280',
        bgGradient: 'from-gray-400 to-gray-500',
        glowColor: '#9ca3af',
        textColor: 'text-gray-700'
      },
      rare: {
        borderColor: '#3b82f6',
        bgGradient: 'from-blue-400 to-blue-600',
        glowColor: '#60a5fa',
        textColor: 'text-blue-700'
      },
      epic: {
        borderColor: '#8b5cf6',
        bgGradient: 'from-purple-400 to-purple-600',
        glowColor: '#a78bfa',
        textColor: 'text-purple-700'
      },
      legendary: {
        borderColor: '#f59e0b',
        bgGradient: 'from-yellow-400 to-orange-500',
        glowColor: '#fbbf24',
        textColor: 'text-yellow-700'
      }
    };

    return configs[this.achievement.rarity] || configs.common;
  }

  get badgeClasses(): string {
    const classes = ['achievement-badge'];

    // Tamaño
    classes.push(`size-${this.size}`);

    // Variante
    classes.push(`variant-${this.variant}`);

    // Rareza
    classes.push(`rarity-${this.achievement.rarity}`);

    // Estado
    if (this.achievement.isUnlocked) {
      classes.push('unlocked');
    } else {
      classes.push('locked');
    }

    // Clickeable
    if (this.clickable) {
      classes.push('clickable');
    }

    return classes.join(' ');
  }

  get progressPercentage(): number {
    return this.achievement.progress || 0;
  }

  get isNearCompletion(): boolean {
    return this.progressPercentage >= 80 && !this.achievement.isUnlocked;
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  getRarityLabel(): string {
    const labels = {
      common: 'Común',
      rare: 'Raro',
      epic: 'Épico',
      legendary: 'Legendario'
    };

    return labels[this.achievement.rarity] || 'Común';
  }

  getProgressText(): string {
    if (this.achievement.isUnlocked) {
      return '¡Completado!';
    }

    if (this.achievement.progress !== undefined) {
      return `${this.progressPercentage.toFixed(0)}% completado`;
    }

    return 'No iniciado';
  }

  getRarityStars(): number {
    const starMap = {
      common: 1,
      rare: 2,
      epic: 3,
      legendary: 4
    };
    return starMap[this.achievement.rarity] || 1;
  }

  isRecentlyUnlocked(): boolean {
    if (!this.achievement.earnedAt) return false;

    const earnedDate = new Date(this.achievement.earnedAt);
    const now = new Date();
    const daysDiff = (now.getTime() - earnedDate.getTime()) / (1000 * 60 * 60 * 24);

    return daysDiff <= 7; // Consideramos "nuevo" si se desbloqueó en los últimos 7 días
  }

}