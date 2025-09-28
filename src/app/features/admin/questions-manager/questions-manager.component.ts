import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { MenuModule } from 'primeng/menu';
import { TabViewModule } from 'primeng/tabview';
import { ChartModule } from 'primeng/chart';
import { OverlayPanelModule } from 'primeng/overlaypanel';

// Services
import { ConfirmationService, MessageService, MenuItem } from 'primeng/api';
import { Question, QuestionWithStats } from '../../../core/models/question';
import { Category } from '../../../core/models/category';
import { CategoryService } from '../../../core/services/category.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { QuestionsService } from '../../../core/services/questions.service';
import { AuthService } from '../../../core/services/auth.service';

// Components
import { QuestionFormComponent } from '../question-form/question-form.component';

// Models


interface QuestionFilter {
  category?: string;
  difficulty?: number;
  type?: string;
  search?: string;
}

@Component({
  selector: 'app-question-manager',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    DropdownModule,
    ConfirmDialogModule,
    ToastModule,
    ToolbarModule,
    TagModule,
    BadgeModule,
    ProgressBarModule,
    TooltipModule,
    MenuModule,
    TabViewModule,
    ChartModule,
    OverlayPanelModule,
    FormsModule,
    ReactiveFormsModule,
    QuestionFormComponent
  ],
  templateUrl: './questions-manager.component.html',
  styleUrls: ['./questions-manager.component.css'],
})
export class QuestionManagerComponent implements OnInit {
  // Data
  questions: Question[] = [];
  categories: Category[] = [];
  filteredQuestions: Question[] = [];
  selectedQuestions: Question[] = [];
  selectedQuestion: Question | null = null;
  selectedQuestionStats: QuestionWithStats | null = null;

  // UI State
  loading = false;
  activeTabIndex = 0;
  showPreviewDialog = false;
  showStatsDialog = false;
  showImportDialog = false;
  showQuestionForm = false;
  editingQuestion: Question | null = null;

  // Filters
  filters: QuestionFilter = {};

  // Options
  categoryOptions: any[] = [];
  difficultyOptions = [
    { label: 'Fácil', value: 1 },
    { label: 'Medio', value: 2 },
    { label: 'Difícil', value: 3 }
  ];
  typeOptions = [
    { label: 'Opción Múltiple', value: 'multiple_choice' },
    { label: 'Verdadero/Falso', value: 'true_false' },
    { label: 'Escala', value: 'scale' }
  ];

  // Menu
  menuItems: MenuItem[] = [];

  // Stats
  totalQuestions = 0;
  avgCorrectRate = 0;
  avgResponseTime = 0;
  totalResponses = 0;

  // Charts
  questionsByCategoryChart: any;
  questionsByDifficultyChart: any;
  chartOptions: any;
String: any;

  constructor(
    private questionService: QuestionsService,
    private categoryService: CategoryService,
    private authService: AuthService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
    this.setupMenuItems();
    this.setupChartOptions();
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    const admin = this.authService.getCurrentAdmin();

    if (admin) {
      
      // Load categories first
      this.categoryService.getCategoriesByAdmin(admin.id).subscribe({
        next: (categories:any) => {
          this.categories = categories;
          this.setupCategoryOptions();
          
          // Then load questions
          this.questionService.getQuestionsByAdmin(admin.id).subscribe({
            next: (questions:any) => {
              this.questions = questions;
              this.applyFilters();
              this.calculateStats();
              this.updateCharts();
              this.loading = false;
            },
            error: (error:any) => {
              console.error('Error loading questions:', error);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudieron cargar las preguntas'
              });
              this.loading = false;
            }
          });
        },
        error: (error:any) => {
          console.error('Error loading categories:', error);
          this.loading = false;
        }
      });
    }
  }

  setupCategoryOptions(): void {
    this.categoryOptions = [
      { label: 'Todas las categorías', value: null },
      ...this.categories.map(cat => ({
        label: cat.name,
        value: cat.id
      }))
    ];
  }

  applyFilters(): void {
    this.filteredQuestions = this.questions.filter(question => {
      if (this.filters.category && question.category_id !== this.filters.category) {
        return false;
      }
      if (this.filters.difficulty && question.difficulty_level !== this.filters.difficulty) {
        return false;
      }
      if (this.filters.type && question.question_type !== this.filters.type) {
        return false;
      }
      if (this.filters.search) {
        const searchTerm = this.filters.search.toLowerCase();
        return question.question_text.toLowerCase().includes(searchTerm);
      }
      return true;
    });
  }

  calculateStats(): void {
    this.totalQuestions = this.questions.length;
    // Aquí calcularías las estadísticas reales desde el backend
    this.avgCorrectRate = 75;
    this.avgResponseTime = 25;
    this.totalResponses = 1250;
  }

  updateCharts(): void {
    // Questions by category
    const categoryCounts = this.categories.map(cat => {
      const count = this.questions.filter(q => q.category_id === cat.id).length;
      return { category: cat, count };
    });

    this.questionsByCategoryChart = {
      labels: categoryCounts.map(c => c.category.name),
      datasets: [{
        data: categoryCounts.map(c => c.count),
        backgroundColor: categoryCounts.map(c => c.category.color)
      }]
    };

    // Questions by difficulty
    const difficultyCounts = [1, 2, 3].map(level => {
      const count = this.questions.filter(q => q.difficulty_level === level).length;
      return count;
    });

    this.questionsByDifficultyChart = {
      labels: ['Fácil', 'Medio', 'Difícil'],
      datasets: [{
        label: 'Número de Preguntas',
        data: difficultyCounts,
        backgroundColor: ['#22c55e', '#f59e0b', '#ef4444']
      }]
    };
  }

  setupChartOptions(): void {
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    };
  }

  setupMenuItems(): void {
    this.menuItems = [
      {
        label: 'Duplicar',
        icon: 'pi pi-copy',
        command: () => this.duplicateQuestion(this.selectedQuestion!)
      },
      {
        label: 'Ver Estadísticas',
        icon: 'pi pi-chart-bar',
        command: () => this.showQuestionStats(this.selectedQuestion!)
      },
      {
        separator: true
      },
      {
        label: 'Eliminar',
        icon: 'pi pi-trash',
        command: () => this.deleteQuestion(this.selectedQuestion!)
      }
    ];
  }

  previewQuestion(question: Question): void {
    this.selectedQuestion = question;
    this.showPreviewDialog = true;
  }

  showQuestionStats(question: Question): void {
    // Aquí cargarías las estadísticas reales de la pregunta
    this.selectedQuestionStats = {
      question: question,
      total_responses: 45,
      correct_responses: 34,
      avg_time: 28,
      difficulty_rating: question.difficulty_level
    };
    this.showStatsDialog = true;
  }

  showQuestionMenu(event: Event, question: Question): void {
    this.selectedQuestion = question;
    // Aquí mostrarías el menu contextual
  }

  // Question form methods
  openQuestionForm(): void {
    this.editingQuestion = null;
    this.showQuestionForm = true;
  }

  editQuestion(question: Question): void {
    this.editingQuestion = question;
    this.showQuestionForm = true;
  }

  onQuestionSaved(savedQuestion: Question): void {
    if (this.editingQuestion) {
      // Update existing question
      const index = this.questions.findIndex(q => q.id === savedQuestion.id);
      if (index !== -1) {
        this.questions[index] = savedQuestion;
      }
    } else {
      // Add new question
      this.questions.push(savedQuestion);
    }

    this.applyFilters();
    this.calculateStats();
    this.updateCharts();
    this.showQuestionForm = false;
    this.editingQuestion = null;
  }

  onQuestionFormClosed(): void {
    this.showQuestionForm = false;
    this.editingQuestion = null;
  }

  duplicateQuestion(question: Question): void {
    const admin = this.authService.getCurrentAdmin();
    if (!admin) return;

    this.questionService.duplicateQuestion(question.id, admin.id).subscribe({
      next: (duplicatedQuestion:any) => {
        this.questions.push(duplicatedQuestion);
        this.applyFilters();
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Pregunta duplicada correctamente'
        });
      },
      error: (error:any) => {
        console.error('Error duplicating question:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo duplicar la pregunta'
        });
      }
    });
  }

  deleteQuestion(question: Question): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que deseas eliminar esta pregunta? Esta acción no se puede deshacer.`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.questionService.deleteQuestion(question.id).subscribe({
          next: () => {
            this.questions = this.questions.filter(q => q.id !== question.id);
            this.applyFilters();
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Pregunta eliminada correctamente'
            });
          },
          error: (error:any) => {
            console.error('Error deleting question:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar la pregunta'
            });
          }
        });
      }
    });
  }

  duplicateSelected(): void {
    // Implementar duplicación masiva
    this.messageService.add({
      severity: 'info',
      summary: 'Información',
      detail: 'Funcionalidad en desarrollo'
    });
  }

  deleteSelected(): void {
    if (this.selectedQuestions.length === 0) return;

    this.confirmationService.confirm({
      message: `¿Estás seguro de que deseas eliminar ${this.selectedQuestions.length} pregunta(s)?`,
      header: 'Confirmar Eliminación Masiva',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        // Implementar eliminación masiva
        this.messageService.add({
          severity: 'info',
          summary: 'Información',
          detail: 'Funcionalidad en desarrollo'
        });
      }
    });
  }

  exportSelected(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Información',
      detail: 'Funcionalidad de exportación en desarrollo'
    });
  }

  // Helper methods
  getTypeLabel(type: string): string {
    switch (type) {
      case 'multiple_choice': return 'Opción Múltiple';
      case 'true_false': return 'V/F';
      case 'scale': return 'Escala';
      default: return type;
    }
  }

  getTypeSeverity(type: string): any {
    switch (type) {
      case 'multiple_choice': return 'info';
      case 'true_false': return 'success';
      case 'scale': return 'warning';
      default: return 'secondary';
    }
  }

  getDifficultyLabel(level: number): string {
    switch (level) {
      case 1: return 'Fácil';
      case 2: return 'Medio';
      case 3: return 'Difícil';
      default: return 'N/A';
    }
  }

  getDifficultySeverity(level: number): any {
    switch (level) {
      case 1: return 'success';
      case 2: return 'warning';
      case 3: return 'danger';
      default: return 'secondary';
    }
  }

  getSuccessRate(stats: QuestionWithStats): number {
    if (stats.total_responses === 0) return 0;
    return Math.round((stats.correct_responses / stats.total_responses) * 100);
  }
}