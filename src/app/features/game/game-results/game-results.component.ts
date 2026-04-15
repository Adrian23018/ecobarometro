import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { IconPipe } from '../../../shared/pipes/icon.pipe';

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

// Components
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

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
    ReactiveFormsModule,
    BackButtonComponent,
    IconPipe
  ],
  templateUrl: './game-results.component.html',
  styleUrls: ['./game-results.component.css'],
  providers: [MessageService]
})
export class GameResultComponent implements OnInit {
  sessionSummary: GameSessionSummary | any = null;
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
    console.log('📊 Cargando resultados de la sesión:', sessionId);

    // Cargar datos reales desde el servicio
    this.gameSessionService.getSessionSummary(sessionId).subscribe({
      next: (summary) => {
        console.log('✅ Resumen de sesión cargado:', summary);
        this.sessionSummary = summary;
        this.generatePerformanceInsights();
        this.updateCategoryChart();
      },
      error: (error) => {
        console.error('❌ Error cargando resultados:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los resultados del juego',
          life: 3000
        });
        // Redirigir al dashboard después de mostrar el error
        setTimeout(() => {
          this.router.navigate(['/user/dashboard']);
        }, 2000);
      }
    });
  }

  generatePerformanceInsights(): void {
    if (!this.sessionSummary) return;

    this.performanceInsights = [];

    // Analyze performance by category
    this.sessionSummary.category_scores.forEach((score:any) => {
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
      labels: this.sessionSummary.category_scores.map((score:any) => score.category.name),
      datasets: [{
        data: this.sessionSummary.category_scores.map((score:any) => score.points_earned),
        backgroundColor: this.sessionSummary.category_scores.map((score:any) => score.category.color),
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

  getCelebrationEmoji(): string { return this.getCelebrationIcon(); }

  getCelebrationIcon(): string {
    if (!this.sessionSummary) return 'pi pi-star';

    const percentage = this.sessionSummary.session.completion_percentage;
    if (percentage >= 90) return 'pi pi-trophy';
    if (percentage >= 80) return 'pi pi-star';
    if (percentage >= 70) return 'pi pi-thumbs-up';
    if (percentage >= 60) return 'pi pi-check';
    return 'pi pi-bolt';
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

  isPiIcon(icon: string | null | undefined): boolean {
    return !!icon && icon.startsWith('pi ');
  }

  getSafeIcon(icon: string | null | undefined): string {
    if (!icon || icon.startsWith('fas ') || icon.startsWith('far ') || icon.startsWith('fab ')) {
      return 'pi pi-trophy';
    }
    return icon;
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