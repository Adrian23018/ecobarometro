import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { BadgeModule } from 'primeng/badge';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { ChartModule } from 'primeng/chart';
import { KnobModule } from 'primeng/knob';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { RippleModule } from 'primeng/ripple';
import { TimelineModule } from 'primeng/timeline';
import { RatingModule } from 'primeng/rating';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';

// Services

import { MessageService } from 'primeng/api';
import { GameSessionSummary } from '../../../core/models/game-session';
import { GameSessionService } from '../../../core/services/game-session.service';
import { AchievementService } from '../../../core/services/achievement.service';
import { RankingService } from '../../../core/services/ranking.service';
import { Achievement } from '../../../core/models/user';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Models


interface PerformanceInsight {
  type: 'excellent' | 'good' | 'needs_improvement';
  category: string;
  message: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-game-result',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    ProgressBarModule,
    BadgeModule,
    TagModule,
    AvatarModule,
    ChartModule,
    KnobModule,
    DividerModule,
    TooltipModule,
    RippleModule,
    TimelineModule,
    RatingModule,
    ToastModule,
    DialogModule,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './game-results.component.html',
  styleUrls: ['./game-results.component.css'],
  providers: [MessageService]
})
export class GameResultComponent implements OnInit {
  sessionSummary: GameSessionSummary | null = null;
  performanceInsights: PerformanceInsight[] = [];
  categoryChart: any;
  chartOptions: any;
  particles: any[] = Array(20).fill({});

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gameSessionService: GameSessionService,
    private achievementService: AchievementService,
    private rankingService: RankingService,
    private messageService: MessageService
  ) {
    this.initializeChartOptions();
  }

  ngOnInit(): void {
    const sessionId = this.route.snapshot.paramMap.get('sessionId');
    if (sessionId) {
      this.loadSessionResults(sessionId);
    } else {
      this.router.navigate(['/game/lobby']);
    }
  }

  loadSessionResults(sessionId: string): void {
    // Mock data for now - would load from actual service
    this.sessionSummary = {
      session: {
        id: sessionId,
        user_id: '',
        admin_id: '',
        session_name: 'EcoChallenge',
        total_questions: 15,
        correct_answers: 12,
        total_points: 480,
        time_spent: 720, // 12 minutes
        completion_percentage: 80,
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      },
      category_scores: [
        {
          category: { id: '1', name: 'Energía', icon: 'pi pi-bolt', color: '#f59e0b' } as any,
          correct_answers: 4,
          total_questions: 5,
          points_earned: 160,
          percentage: 80
        },
        {
          category: { id: '2', name: 'Agua', icon: 'pi pi-tint', color: '#3b82f6' } as any,
          correct_answers: 3,
          total_questions: 4,
          points_earned: 120,
          percentage: 75
        },
        {
          category: { id: '3', name: 'Residuos', icon: 'pi pi-refresh', color: '#22c55e' } as any,
          correct_answers: 5,
          total_questions: 6,
          points_earned: 200,
          percentage: 83
        }
      ],
      achievements_earned: [
        {
          id: '1',
          name: 'Eco Warrior',
          description: 'Completa tu primer EcoChallenge',
          icon: 'pi pi-star',
          badge_color: '#22c55e',
          points_required: 100
        } as Achievement
      ],
      ranking_position: 3,
      improvement_percentage: 15
    };

    this.generatePerformanceInsights();
    this.updateCategoryChart();
  }

  generatePerformanceInsights(): void {
    if (!this.sessionSummary) return;

    this.performanceInsights = [];

    // Analyze performance by category
    this.sessionSummary.category_scores.forEach(score => {
      let insight: PerformanceInsight;

      if (score.percentage >= 80) {
        insight = {
          type: 'excellent',
          category: score.category.name,
          message: '¡Excelente conocimiento!',
          icon: 'pi pi-star',
          color: '#22c55e'
        };
      } else if (score.percentage >= 60) {
        insight = {
          type: 'good',
          category: score.category.name,
          message: 'Buen rendimiento',
          icon: 'pi pi-thumbs-up',
          color: '#3b82f6'
        };
      } else {
        insight = {
          type: 'needs_improvement',
          category: score.category.name,
          message: 'Área de mejora',
          icon: 'pi pi-exclamation-triangle',
          color: '#f59e0b'
        };
      }

      this.performanceInsights.push(insight);
    });
  }

  updateCategoryChart(): void {
    if (!this.sessionSummary) return;

    this.categoryChart = {
      labels: this.sessionSummary.category_scores.map(score => score.category.name),
      datasets: [{
        data: this.sessionSummary.category_scores.map(score => score.points_earned),
        backgroundColor: this.sessionSummary.category_scores.map(score => score.category.color),
        borderWidth: 0
      }]
    };
  }

  initializeChartOptions(): void {
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            padding: 20
          }
        }
      }
    };
  }

  getCelebrationEmoji(): string {
    if (!this.sessionSummary) return '🎉';
    
    const percentage = this.sessionSummary.session.completion_percentage;
    if (percentage >= 90) return '🏆';
    if (percentage >= 80) return '🎉';
    if (percentage >= 70) return '👏';
    if (percentage >= 60) return '👍';
    return '💪';
  }

  getPerformanceTitle(): string {
    if (!this.sessionSummary) return 'Completado';
    
    const percentage = this.sessionSummary.session.completion_percentage;
    if (percentage >= 90) return 'Increíble';
    if (percentage >= 80) return 'Excelente';
    if (percentage >= 70) return 'Muy Bien';
    if (percentage >= 60) return 'Bien Hecho';
    return 'Buen Intento';
  }

  getScoreColor(): string {
    if (!this.sessionSummary) return '#3b82f6';
    
    const percentage = this.sessionSummary.session.completion_percentage;
    if (percentage >= 80) return '#22c55e';
    if (percentage >= 60) return '#3b82f6';
    if (percentage >= 40) return '#f59e0b';
    return '#ef4444';
  }

  getPerformanceColor(percentage: number): string {
    if (percentage >= 80) return '#22c55e';
    if (percentage >= 60) return '#3b82f6';
    if (percentage >= 40) return '#f59e0b';
    return '#ef4444';
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getAvgTimePerQuestion(): number {
    if (!this.sessionSummary) return 0;
    return Math.round(this.sessionSummary.session.time_spent / this.sessionSummary.session.total_questions);
  }

  playAgain(): void {
    this.router.navigate(['/game/lobby']);
  }

  shareOnTwitter(): void {
    const text = `¡Completé mi EcoChallenge con ${this.sessionSummary?.session.completion_percentage}% de aciertos! 🌱 #EcoBarómetro #Sostenibilidad`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  shareOnFacebook(): void {
    // Implementar compartir en Facebook
    this.messageService.add({
      severity: 'info',
      summary: 'Compartir',
      detail: 'Funcionalidad de Facebook próximamente'
    });
  }

  shareOnLinkedIn(): void {
    // Implementar compartir en LinkedIn
    this.messageService.add({
      severity: 'info',
      summary: 'Compartir',
      detail: 'Funcionalidad de LinkedIn próximamente'
    });
  }

  copyResults(): void {
    const text = `¡Completé mi EcoChallenge con ${this.sessionSummary?.session.completion_percentage}% de aciertos y ${this.sessionSummary?.session.total_points} puntos!`;
    navigator.clipboard.writeText(text).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copiado',
        detail: 'Resultados copiados al portapapeles'
      });
    });
  }
}