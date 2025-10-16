import { Component, OnInit, ViewChild } from '@angular/core';
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
import { PanelModule } from 'primeng/panel';
import { ChipModule } from 'primeng/chip';
import { MenuItem, ConfirmationService, MessageService } from 'primeng/api';
import { Menu } from 'primeng/menu';

// Forms
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Servicios y modelos
import { Question, QuestionWithStats } from '../../../core/models/question';
import { Category } from '../../../core/models/category';
import { CategoryService } from '../../../core/services/category.service';
import { QuestionsService } from '../../../core/services/questions.service';
import { AuthService } from '../../../core/services/auth.service';

// Componentes
import { QuestionFormComponent } from '../question-form/question-form.component';

interface QuestionFilter {
  category?: any | null;
  difficulty?: any | null;
  type?: any | null;
  search?: any;
}

@Component({
  selector: 'app-question-manager',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    // PrimeNG
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
    PanelModule,
    ChipModule,
    // Forms
    FormsModule,
    ReactiveFormsModule,
    // Formulario
    QuestionFormComponent
  ],
  templateUrl: './questions-manager.component.html',
  styleUrls: ['./questions-manager.component.css']
})
export class QuestionManagerComponent implements OnInit {
  // Referencia al menú contextual
  @ViewChild('questionMenu') questionMenu!: Menu;

  // Datos
  questions: Question[] = [];
  categories: Category[] = [];
  filteredQuestions: Question[] = [];
  selectedQuestions: Question[] = [];
  selectedQuestion: Question | null = null;
  selectedQuestionStats: QuestionWithStats | null = null;

  // UI
  loading = false;
  activeTabIndex = 0;
  showPreviewDialog = false;
  showStatsDialog = false;
  showImportDialog = false;
  showQuestionForm = false;
  editingQuestion: Question | null = null;

  // Filtros
  filters: QuestionFilter = {
    category: null,
    difficulty: null,
    type: null,
    search: ''
  };

  // Opciones de selects
  categoryOptions: Array<{ label: string; value: string | null }> = [];
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

  // Menú contextual
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

  // Para usar String.fromCharCode en template
  public String = String;

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

  // ---------- Carga de datos ----------
  loadData(): void {
    this.loading = true;
    const admin = this.authService.getCurrentAdmin();
    if (!admin) {
      this.loading = false;
      return;
    }

    // 1) Categorías
    this.categoryService.getCategoriesByAdmin(admin.id).subscribe({
      next: (categories: Category[]) => {
        this.categories = categories || [];
        this.setupCategoryOptions();

        // 2) Preguntas
        this.questionService.getQuestionsByAdmin(admin.id).subscribe({
          next: (questions: Question[]) => {
            this.questions = questions || [];
            this.applyFilters();
            this.calculateStats();
            this.updateCharts();
            this.loading = false;
          },
          error: (err) => {
            console.error('Error loading questions:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudieron cargar las preguntas'
            });
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.loading = false;
      }
    });
  }

  setupCategoryOptions(): void {
    this.categoryOptions = [
      { label: 'Todas las categorías', value: null },
      ...this.categories.map((c) => ({ label: c.name, value: c.id }))
    ];
  }

  // ---------- Filtros ----------
  applyFilters(): void {
    this.filteredQuestions = this.questions.filter((q) => {
      if (this.filters.category && q.category_id !== this.filters.category) return false;
      if (this.filters.difficulty && q.difficulty_level !== this.filters.difficulty) return false;
      if (this.filters.type && q.question_type !== this.filters.type) return false;
      if (this.filters.search) {
        const s = this.filters.search.toLowerCase();
        return (q.question_text || '').toLowerCase().includes(s);
      }
      return true;
    });
  }

  // ---------- Estadísticas y charts ----------
  calculateStats(): void {
    this.totalQuestions = this.questions.length;
    // Mock de estadísticas; sustituye por datos reales del backend si los tienes
    this.avgCorrectRate = 75;
    this.avgResponseTime = 25;
    this.totalResponses = 1250;
  }

  updateCharts(): void {
    // Por categoría
    const catCounts = this.categories.map((cat) => ({
      cat,
      count: this.questions.filter((q) => q.category_id === cat.id).length
    }));

    this.questionsByCategoryChart = {
      labels: catCounts.map((c) => c.cat.name),
      datasets: [
        {
          data: catCounts.map((c) => c.count),
          backgroundColor: catCounts.map((c) => c.cat.color || '#94a3b8')
        }
      ]
    };

    // Por dificultad
    const diffs = [1, 2, 3].map((lvl) => this.questions.filter((q) => q.difficulty_level === lvl).length);
    this.questionsByDifficultyChart = {
      labels: ['Fácil', 'Medio', 'Difícil'],
      datasets: [
        {
          label: 'Número de Preguntas',
          data: diffs,
          backgroundColor: ['#22c55e', '#f59e0b', '#ef4444']
        }
      ]
    };
  }

  setupChartOptions(): void {
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom' } }
    };
  }

  // ---------- Menú contextual ----------
  setupMenuItems(): void {
    this.menuItems = [
      {
        label: 'Duplicar',
        icon: 'pi pi-copy',
        command: () => this.selectedQuestion && this.duplicateQuestion(this.selectedQuestion)
      },
      {
        label: 'Ver estadísticas',
        icon: 'pi pi-chart-bar',
        command: () => this.selectedQuestion && this.showQuestionStats(this.selectedQuestion)
      },
      { separator: true },
      {
        label: 'Eliminar',
        icon: 'pi pi-trash',
        command: () => this.selectedQuestion && this.deleteQuestion(this.selectedQuestion)
      }
    ];
  }

  showQuestionMenu(event: Event, question: Question): void {
    this.selectedQuestion = question;
    if (this.questionMenu) {
      this.questionMenu.toggle(event);
    }
  }

  // ---------- Acciones de fila ----------
  previewQuestion(question: Question): void {
    this.selectedQuestion = question;
    this.showPreviewDialog = true;
  }

  showQuestionStats(question: Question): void {
    // Demo de stats; reemplaza por fetch real si lo tienes
    this.selectedQuestionStats = {
      question,
      total_responses: 45,
      correct_responses: 34,
      avg_time: 28,
      difficulty_rating: question.difficulty_level
    };
    this.showStatsDialog = true;
  }

  // ---------- Formulario (QuestionFormComponent) ----------
  openQuestionForm(): void {
    this.editingQuestion = null;
    this.showQuestionForm = true;
  }

  editQuestion(question: Question): void {
    this.editingQuestion = question;
    this.showQuestionForm = true;
  }

  onQuestionSaved(saved: Question): void {
    if (this.editingQuestion) {
      const idx = this.questions.findIndex((q) => q.id === saved.id);
      if (idx !== -1) this.questions[idx] = saved;
    } else {
      this.questions = [saved, ...this.questions];
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

  // ---------- Duplicar / Eliminar ----------
  duplicateQuestion(question: Question): void {
    const admin = this.authService.getCurrentAdmin();
    if (!admin) return;

    this.questionService.duplicateQuestion(question.id, admin.id).subscribe({
      next: (dup: Question) => {
        this.questions = [dup, ...this.questions];
        this.applyFilters();
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Pregunta duplicada' });
      },
      error: (err) => {
        console.error('duplicateQuestion error', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo duplicar' });
      }
    });
  }

  deleteQuestion(question: Question): void {
    this.confirmationService.confirm({
      message: '¿Eliminar definitivamente esta pregunta?',
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.questionService.deleteQuestion(question.id).subscribe({
          next: () => {
            this.questions = this.questions.filter((q) => q.id !== question.id);
            this.applyFilters();
            this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Pregunta eliminada' });
          },
          error: (err) => {
            console.error('deleteQuestion error', err);
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar' });
          }
        });
      }
    });
  }

  // ---------- Acciones masivas (demo) ----------
  duplicateSelected(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'En desarrollo',
      detail: 'Duplicación masiva próximamente'
    });
  }

  deleteSelected(): void {
    if (!this.selectedQuestions?.length) return;
    this.confirmationService.confirm({
      message: `¿Eliminar ${this.selectedQuestions.length} pregunta(s)?`,
      header: 'Eliminación masiva',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        // Implementa la eliminación masiva si la tienes en tu API
        this.messageService.add({
          severity: 'info',
          summary: 'En desarrollo',
          detail: 'Eliminación masiva próximamente'
        });
      }
    });
  }

  exportSelected(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'En desarrollo',
      detail: 'Exportación próximamente'
    });
  }

  // ---------- Helpers ----------
  getTypeLabel(type: string): string {
    switch (type) {
      case 'multiple_choice':
        return 'Opción Múltiple';
      case 'true_false':
        return 'V/F';
      case 'scale':
        return 'Escala';
      default:
        return type;
    }
  }

  getTypeSeverity(type: string): 'info' | 'success' | 'warning' | 'secondary' {
    switch (type) {
      case 'multiple_choice':
        return 'info';
      case 'true_false':
        return 'success';
      case 'scale':
        return 'warning';
      default:
        return 'secondary';
    }
  }

  getDifficultyLabel(level: number): string {
    switch (level) {
      case 1:
        return 'Fácil';
      case 2:
        return 'Medio';
      case 3:
        return 'Difícil';
      default:
        return 'N/A';
    }
  }

  getDifficultySeverity(level: number): 'success' | 'warning' | 'danger' | 'secondary' {
    switch (level) {
      case 1:
        return 'success';
      case 2:
        return 'warning';
      case 3:
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getSuccessRate(stats: QuestionWithStats): number {
    if (!stats?.total_responses) return 0;
    return Math.round((stats.correct_responses / stats.total_responses) * 100);
    }
}
