// src/app/shared/components/score-display/score-display.component.ts
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-score-display',
  templateUrl: './score-display.component.html',
  styleUrls: ['./score-display.component.css'],
  animations: [
    trigger('scoreChange', [
      transition(':increment', [
        style({ transform: 'scale(1.2)', color: '#22c55e' }),
        animate('300ms ease-out', style({ transform: 'scale(1)', color: '*' }))
      ]),
      transition(':decrement', [
        style({ transform: 'scale(0.8)', color: '#ef4444' }),
        animate('300ms ease-out', style({ transform: 'scale(1)', color: '*' }))
      ])
    ]),
    trigger('pointsEarned', [
      state('hidden', style({ opacity: 0, transform: 'translateY(-20px) scale(0.5)' })),
      state('visible', style({ opacity: 1, transform: 'translateY(0) scale(1)' })),
      transition('hidden => visible', animate('500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)')),
      transition('visible => hidden', animate('300ms ease-in'))
    ]),
    trigger('levelUp', [
      state('normal', style({ transform: 'scale(1)' })),
      state('celebration', style({ transform: 'scale(1.1)' })),
      transition('normal => celebration', [
        animate('200ms ease-out', style({ transform: 'scale(1.2)' })),
        animate('200ms ease-in', style({ transform: 'scale(1.1)' }))
      ]),
      transition('celebration => normal', animate('300ms ease-out'))
    ])
  ]
})
export class ScoreDisplayComponent implements OnInit, OnChanges {
  @Input() score: number = 0;
  @Input() maxScore?: number;
  @Input() showProgress: boolean = false;
  @Input() variant: 'default' | 'compact' | 'detailed' | 'game' = 'default';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() animated: boolean = true;
  @Input() showTrend: boolean = false;
  @Input() previousScore?: number;
  @Input() level?: number;
  @Input() experience?: number;
  @Input() experienceToNext?: number;
  @Input() recentPoints?: number;
  @Input() showRecentPoints: boolean = false;

  displayScore: number = 0;
  previousDisplayScore: number = 0;
  animationState: string = 'normal';
  showPointsAnimation: boolean = false;
  trend: 'up' | 'down' | 'same' = 'same';

  private animationFrame?: number;
  private targetScore: number = 0;

  ngOnInit() {
    this.initializeScore();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['score'] && !changes['score'].firstChange) {
      this.updateScore(changes['score'].currentValue, changes['score'].previousValue);
    }
    
    if (changes['recentPoints'] && this.showRecentPoints && changes['recentPoints'].currentValue > 0) {
      this.triggerPointsAnimation();
    }

    if (changes['previousScore'] && this.showTrend) {
      this.calculateTrend();
    }
  }

  private initializeScore() {
    this.displayScore = this.score;
    this.targetScore = this.score;
    this.calculateTrend();
  }

  private updateScore(newScore: number, oldScore: number) {
    this.previousDisplayScore = this.displayScore;
    this.targetScore = newScore;
    
    if (this.animated) {
      this.animateScoreChange();
    } else {
      this.displayScore = newScore;
    }
  }

  private animateScoreChange() {
    const startScore = this.displayScore;
    const endScore = this.targetScore;
    const duration = 1000; // 1 segundo
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Función de easing
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      this.displayScore = Math.round(startScore + (endScore - startScore) * easeOutQuart);
      
      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        this.displayScore = endScore;
      }
    };

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    this.animationFrame = requestAnimationFrame(animate);
  }

  private calculateTrend() {
    if (this.previousScore !== undefined) {
      if (this.score > this.previousScore) {
        this.trend = 'up';
      } else if (this.score < this.previousScore) {
        this.trend = 'down';
      } else {
        this.trend = 'same';
      }
    }
  }

  private triggerPointsAnimation() {
    this.showPointsAnimation = true;
    setTimeout(() => {
      this.showPointsAnimation = false;
    }, 2000);
  }

  get progressPercentage(): number {
    if (!this.maxScore) return 0;
    return Math.min((this.score / this.maxScore) * 100, 100);
  }

  get experiencePercentage(): number {
    if (!this.experience || !this.experienceToNext) return 0;
    return Math.min((this.experience / this.experienceToNext) * 100, 100);
  }

  get scoreClasses(): string {
    const classes = ['score-value'];
    
    // Tamaño
    switch (this.size) {
      case 'small':
        classes.push('text-lg');
        break;
      case 'large':
        classes.push('text-4xl');
        break;
      default:
        classes.push('text-2xl');
    }
    
    // Variante
    switch (this.variant) {
      case 'game':
        classes.push('font-bold', 'text-yellow-600');
        break;
      case 'compact':
        classes.push('font-semibold', 'text-gray-800');
        break;
      default:
        classes.push('font-bold', 'text-blue-600');
    }
    
    return classes.join(' ');
  }

  get containerClasses(): string {
    const classes = ['score-container'];
    
    switch (this.variant) {
      case 'game':
        classes.push('game-style');
        break;
      case 'compact':
        classes.push('compact-style');
        break;
      case 'detailed':
        classes.push('detailed-style');
        break;
      default:
        classes.push('default-style');
    }
    
    return classes.join(' ');
  }

  getTrendIcon(): string {
    switch (this.trend) {
      case 'up':
        return 'pi-arrow-up';
      case 'down':
        return 'pi-arrow-down';
      default:
        return 'pi-minus';
    }
  }

  getTrendColor(): string {
    switch (this.trend) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  }

  getTrendText(): string {
    if (!this.previousScore) return '';
    
    const difference = this.score - this.previousScore;
    if (difference === 0) return 'Sin cambios';
    
    const sign = difference > 0 ? '+' : '';
    return `${sign}${difference}`;
  }

  formatScore(score: number): string {
    if (score >= 1000000) {
      return (score / 1000000).toFixed(1) + 'M';
    }
    if (score >= 1000) {
      return (score / 1000).toFixed(1) + 'K';
    }
    return score.toString();
  }

  getRankSuffix(rank: number): string {
    if (rank === 1) return 'er';
    if (rank === 2) return 'do';
    if (rank === 3) return 'er';
    return 'to';
  }

  ngOnDestroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}