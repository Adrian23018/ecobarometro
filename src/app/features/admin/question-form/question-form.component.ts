// src/app/features/admin/question-form/question-form.component.ts
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';

// PrimeNG
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SliderModule } from 'primeng/slider';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { TabViewModule } from 'primeng/tabview';
import { TooltipModule } from 'primeng/tooltip';

// Services / Models (ajusta rutas según tu proyecto)
import { QuestionsService } from '../../../core/services/questions.service';
import { CategoryService } from '../../../core/services/category.service';
import { AuthService } from '../../../core/services/auth.service';
import { Question } from '../../../core/models/question';
import { Category } from '../../../core/models/category';

@Component({
  selector: 'app-question-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,       // <-- solo reactivo (sin FormsModule)
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    DropdownModule,
    RadioButtonModule,
    SliderModule,
    ToastModule,
    TagModule,
    DividerModule,
    TabViewModule,
    TooltipModule,
    FormsModule,
  ],
  providers: [MessageService],
  templateUrl: './question-form.component.html',
  styleUrls: ['./question-form.component.css']
})
export class QuestionFormComponent implements OnInit {
  @Input() editQuestion: any | null = null;
  @Input() visible = false;
  @Output() questionSaved = new EventEmitter<Question>();
  @Output() formClosed = new EventEmitter<void>();

  questionForm!: FormGroup;
  categories: Category[] = [];
  isLoading = false;
  isEditMode = false;
  activeTab = 0;

  // Para template
  String = String;

  // Catálogos
  questionTypes = [
    { label: 'Opción Múltiple', value: 'multiple_choice', emoji: '📋' },
    { label: 'Verdadero/Falso',  value: 'true_false',       emoji: '✅' },
    { label: 'Escala',           value: 'scale',             emoji: '📊' }
  ];

  difficultyLevels = [
    { label: 'Fácil',   value: 1, color: '#22c55e', description: 'Básico',       emoji: '🟢' },
    { label: 'Medio',   value: 2, color: '#f59e0b', description: 'Intermedio',   emoji: '🟡' },
    { label: 'Difícil', value: 3, color: '#ef4444', description: 'Avanzado',     emoji: '🔴' }
  ];

  // Reglas
  validationRules = {
    questionText: { min: 10, max: 500 },
    explanation: { max: 1000 },
    optionText: { min: 1, max: 200 },
    minOptions: 2,
    maxOptions: 5
  };

  currentUser: any;

  /** Modo puntaje: cada opción tiene su propio valor en puntos */
  isWeightedMode = false;

  constructor(
    private fb: FormBuilder,
    private questionsService: QuestionsService,
    private categoryService: CategoryService,
    private authService: AuthService,
    private messageService: MessageService
  ) {
    this.initForm();
    const userData = localStorage.getItem('ecobarometro_user');
    if (userData) this.currentUser = JSON.parse(userData);
  }

  ngOnInit() {
    this.loadCategories();
    if (this.editQuestion) {
      this.loadQuestionForEdit();
    }
  }

  /* ---------- FORM SETUP ---------- */
  initForm() {
    this.questionForm = this.fb.group({
      question_text: ['', [Validators.required, Validators.minLength(this.validationRules.questionText.min), Validators.maxLength(this.validationRules.questionText.max)]],
      category_id: ['', Validators.required],
      question_type: ['multiple_choice', Validators.required],
      difficulty_level: [1, Validators.required],
      explanation: ['', [Validators.maxLength(this.validationRules.explanation.max)]],
      points: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
      time_limit: [30, [Validators.required, Validators.min(5), Validators.max(300)]],
      options: this.fb.array([]),          // <-- FormArray
      correct_index: [0],                  // <-- índice de opción correcta (reactivo)
      // True/False
      correct_answer: [''],
      // Escala
      scale_min: [1],
      scale_max: [5],
      scale_min_label: [''],
      scale_max_label: [''],
      scale_correct_value: [3]
    });

    // Reaccionar a cambios de tipo
    this.questionForm.get('question_type')?.valueChanges.subscribe(type => this.onQuestionTypeChange(type));

    // Si cambia el índice correcto, marcar is_correct en el array
    this.questionForm.get('correct_index')?.valueChanges.subscribe((i: number) => {
      this.optionsArray.controls.forEach((c, idx) => c.get('is_correct')?.setValue(idx === i));
    });

    // Inicializar opciones por defecto
    this.initializeDefaultOptions();
  }

  get optionsArray(): FormArray {
    return this.questionForm.get('options') as FormArray;
  }

  initializeDefaultOptions() {
    const arr = this.optionsArray;
    while (arr.length) arr.removeAt(0);
    for (let i = 0; i < 4; i++) this.addOption();
    this.questionForm.get('correct_index')?.setValue(0); // A por defecto
  }

  onQuestionTypeChange(type: string) {
    const arr = this.optionsArray;

    switch (type) {
      case 'multiple_choice':
        if (arr.length === 0) this.initializeDefaultOptions();
        this.questionForm.get('correct_answer')?.setValue('');
        if (arr.length) this.questionForm.get('correct_index')?.setValue(0);
        break;

      case 'true_false':
        arr.clear();
        this.questionForm.get('correct_answer')?.setValue('true');
        break;

      case 'scale':
        arr.clear();
        this.questionForm.patchValue({ scale_min: 1, scale_max: 5, scale_correct_value: 3 });
        break;
    }
  }

  addOption() {
    const g = this.fb.group({
      option_text: ['', [Validators.required, Validators.minLength(this.validationRules.optionText.min), Validators.maxLength(this.validationRules.optionText.max)]],
      is_correct: [false],
      explanation: [''],
      option_points: [0, [Validators.min(0), Validators.max(9999)]]
    });
    this.optionsArray.push(g);
  }

  toggleWeightedMode() {
    this.isWeightedMode = !this.isWeightedMode;
    const maxPts = this.questionForm.get('points')?.value ?? 10;

    if (this.isWeightedMode) {
      // Al activar: la opción correcta actual recibe todos los puntos, las demás 0
      const correctIdx = this.questionForm.get('correct_index')?.value ?? 0;
      this.optionsArray.controls.forEach((c, i) => {
        c.get('option_points')?.setValue(i === correctIdx ? maxPts : 0);
      });
    } else {
      // Al desactivar: la opción con más puntos pasa a ser la correcta
      let bestIdx = 0;
      let bestPts = -1;
      this.optionsArray.controls.forEach((c, i) => {
        const pts = c.get('option_points')?.value ?? 0;
        if (pts > bestPts) { bestPts = pts; bestIdx = i; }
      });
      this.questionForm.get('correct_index')?.setValue(bestIdx);
    }
  }

  removeOption(index: number) {
    if (this.optionsArray.length > this.validationRules.minOptions) {
      this.optionsArray.removeAt(index);
      // reajustar correct_index si hiciera falta
      const current = this.questionForm.get('correct_index')?.value ?? 0;
      if (current >= this.optionsArray.length) {
        this.questionForm.get('correct_index')?.setValue(Math.max(0, this.optionsArray.length - 1));
      }
    } else {
      this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: `Se requieren al menos ${this.validationRules.minOptions} opciones` });
    }
  }

  canAddOption(): boolean {
    return this.optionsArray.length < this.validationRules.maxOptions;
  }

  canRemoveOption(): boolean {
    return this.optionsArray.length > this.validationRules.minOptions;
  }

  /* ---------- DATA ---------- */
  loadCategories() {
    const admin = this.authService.getCurrentAdmin();
    if (!admin) return;

    this.categoryService.getCategoriesByAdmin(admin.id).subscribe({
      next: (cats) => this.categories = cats,
      error: (err) => {
        console.error('Error loading categories:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las categorías' });
      }
    });
  }

  loadQuestionForEdit() {
    if (!this.editQuestion) return;
    this.isEditMode = true;

    this.questionForm.patchValue({
      question_text: this.editQuestion.question_text,
      category_id: this.editQuestion.category_id,
      question_type: this.editQuestion.question_type,
      difficulty_level: this.editQuestion.difficulty_level,
      explanation: this.editQuestion.explanation,
      points: this.editQuestion.points,
      time_limit: this.editQuestion.time_limit
    });

    this.onQuestionTypeChange(this.editQuestion.question_type);

    if (this.editQuestion.question_type === 'multiple_choice' && this.editQuestion.options) {
      const arr = this.optionsArray;
      arr.clear();

      // Detectar modo weighted: la pregunta tiene weighted_scoring=true
      // o tiene múltiples opciones con puntos distintos entre sí
      this.isWeightedMode = !!this.editQuestion.weighted_scoring;

      this.editQuestion.options.forEach((o: any) => {
        arr.push(this.fb.group({
          option_text: [o.option_text, [Validators.required]],
          is_correct: [o.is_correct],
          explanation: [o.explanation || ''],
          option_points: [o.points ?? 0, [Validators.min(0), Validators.max(9999)]]
        }));
      });

      if (!this.isWeightedMode) {
        const idx = this.editQuestion.options.findIndex((o: any) => !!o.is_correct);
        this.questionForm.get('correct_index')?.setValue(Math.max(0, idx));
      }
    }
  }

  /* ---------- VALIDACIÓN Y ENVÍO ---------- */
  validateForm(): boolean {
    const v = this.questionForm.value;

    switch (v.question_type) {
      case 'multiple_choice':
        if (this.isWeightedMode) {
          const hasAnyPoints = v.options?.some((o: any) => (o.option_points ?? 0) > 0);
          if (!hasAnyPoints) {
            this.messageService.add({ severity: 'error', summary: 'Error de Validación', detail: 'Al menos una opción debe tener puntos mayores a 0' });
            return false;
          }
        } else {
          if (!v.options?.some((o: any) => o.is_correct)) {
            this.messageService.add({ severity: 'error', summary: 'Error de Validación', detail: 'Debe seleccionar al menos una opción correcta' });
            return false;
          }
        }
        break;
      case 'scale':
        if (v.scale_min >= v.scale_max) {
          this.messageService.add({ severity: 'error', summary: 'Error de Validación', detail: 'El valor mínimo debe ser menor que el máximo' });
          return false;
        }
        break;
    }
    return this.questionForm.valid;
  }

  onSubmit() {
    if (!this.validateForm()) return;

    this.isLoading = true;
    const admin = this.authService.getCurrentAdmin();
    if (!admin) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo identificar al administrador' });
      this.isLoading = false;
      return;
    }

    const v = this.questionForm.value;
    const payload: any = {
      admin_id: admin.id,
      question_text: v.question_text,
      category_id: v.category_id,
      question_type: v.question_type,
      difficulty_level: v.difficulty_level,
      points: v.points,
      options: []
    };

    switch (v.question_type) {
      case 'multiple_choice':
        if (this.isWeightedMode) {
          payload.options = v.options.map((opt: any, i: number) => ({
            option_text: opt.option_text,
            is_correct: (opt.option_points ?? 0) > 0,
            points: opt.option_points ?? 0,
            explanation: opt.explanation || null,
            order_index: i
          }));
          payload.weighted_scoring = true;
        } else {
          payload.options = v.options.map((opt: any, i: number) => ({
            option_text: opt.option_text,
            is_correct: opt.is_correct,
            points: opt.is_correct ? v.points : 0,
            explanation: opt.explanation || null,
            order_index: i
          }));
          payload.weighted_scoring = false;
        }
        break;

      case 'true_false':
        payload.options = [
          { option_text: 'Verdadero', is_correct: v.correct_answer === 'true', points: v.correct_answer === 'true' ? v.points : 0, order_index: 0 },
          { option_text: 'Falso', is_correct: v.correct_answer === 'false', points: v.correct_answer === 'false' ? v.points : 0, order_index: 1 }
        ];
        break;

      case 'scale':
        payload.scale_config = {
          min_value: v.scale_min,
          max_value: v.scale_max,
          min_label: v.scale_min_label,
          max_label: v.scale_max_label,
          correct_value: v.scale_correct_value
        };
        break;
    }

    const op = this.isEditMode
      ? this.questionsService.updateQuestion(this.editQuestion!.id, payload)
      : this.questionsService.createQuestion(admin.id, payload);

    op.subscribe({
      next: (saved) => {
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: this.isEditMode ? 'Pregunta actualizada' : 'Pregunta creada' });
        this.questionSaved.emit(saved);
        this.resetForm();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error saving question:', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la pregunta. Intenta nuevamente.' });
        this.isLoading = false;
      }
    });
  }

  resetForm() {
    this.questionForm.reset();
    this.initForm();
    this.editQuestion = null;
    this.isEditMode = false;
  }

  closeForm() {
    this.resetForm();
    this.formClosed.emit();
  }

  /* ---------- Helpers UI ---------- */
  getCharacterCount(name: string): number {
    const c = this.questionForm.get(name);
    return c?.value?.length || 0;
  }

  getMaxCharacters(field: string): number {
    switch (field) {
      case 'question_text': return this.validationRules.questionText.max;
      case 'explanation': return this.validationRules.explanation.max;
      case 'option_text': return this.validationRules.optionText.max;
      default: return 0;
    }
  }

  isFieldInvalid(name: string): boolean {
    const f = this.questionForm.get(name);
    return !!(f && f.invalid && (f.dirty || f.touched));
  }

  getFieldError(name: string): string {
    const f = this.questionForm.get(name);
    if (f?.errors) {
      if (f.errors['required']) return 'Este campo es requerido';
      if (f.errors['minlength']) return `Mínimo ${f.errors['minlength'].requiredLength} caracteres`;
      if (f.errors['maxlength']) return `Máximo ${f.errors['maxlength'].requiredLength} caracteres`;
      if (f.errors['min']) return `Valor mínimo: ${f.errors['min'].min}`;
      if (f.errors['max']) return `Valor máximo: ${f.errors['max'].max}`;
    }
    return '';
  }

  previewQuestion() {
    if (!this.questionForm.valid) {
      this.messageService.add({ severity: 'warn', summary: 'Advertencia', detail: 'Complete todos los campos requeridos para previsualizar' });
    }
  }

  get previewData(): any {
    const v = this.questionForm.value;
    return {
      question_text: v.question_text,
      question_type: v.question_type,
      difficulty_level: v.difficulty_level,
      points: v.points,
      time_limit: v.time_limit,
      options: v.options,
      correct_answer: v.correct_answer,
      scale_min: v.scale_min,
      scale_max: v.scale_max,
      scale_min_label: v.scale_min_label,
      scale_max_label: v.scale_max_label,
      scale_correct_value: v.scale_correct_value,
      explanation: v.explanation
    };
  }

  getDifficultyLabel(level: number): string {
    const d = this.difficultyLevels.find(l => l.value === level);
    return d ? d.label : '';
  }

  getDifficultySeverity(level: number): 'success' | 'warning' | 'danger' | 'info' {
    switch (level) {
      case 1: return 'success';
      case 2: return 'warning';
      case 3: return 'danger';
      default: return 'info';
    }
  }

  get correctIndexCtrl(): FormControl {
    return this.questionForm.get('correct_index') as FormControl;
  }
}
