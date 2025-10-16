// src/app/features/admin/question-form/question-form.component.ts
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CheckboxModule } from 'primeng/checkbox';
import { SliderModule } from 'primeng/slider';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { TagModule } from 'primeng/tag';
import { DividerModule } from 'primeng/divider';
import { AccordionModule } from 'primeng/accordion';
import { TabViewModule } from 'primeng/tabview';

// Services and Models
import { QuestionsService } from '../../../core/services/questions.service';
import { CategoryService } from '../../../core/services/category.service';
import { AuthService } from '../../../core/services/auth.service';
import { Question, CreateQuestionRequest, QuestionOption } from '../../../core/models/question';
import { Category } from '../../../core/models/category';

@Component({
  selector: 'app-question-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    DropdownModule,
    RadioButtonModule,
    CheckboxModule,
    SliderModule,
    ToastModule,
    ProgressBarModule,
    TagModule,
    DividerModule,
    AccordionModule,
    TabViewModule,
    FormsModule,
  ],
  templateUrl: './question-form.component.html',
  styleUrls: ['./question-form.component.css']
})
export class QuestionFormComponent implements OnInit {
  @Input() editQuestion: any | null = null;
  @Input() visible: boolean = false;
  @Output() questionSaved = new EventEmitter<Question>();
  @Output() formClosed = new EventEmitter<void>();

  correctOption: any;

  questionForm!: FormGroup;
  categories: Category[] = [];
  isLoading = false;
  isEditMode = false;
  activeTab = 0;

  // Options
  questionTypes = [
    { label: 'Opción Múltiple', value: 'multiple_choice', icon: 'pi pi-list' },
    { label: 'Verdadero/Falso', value: 'true_false', icon: 'pi pi-check-circle' },
    { label: 'Escala de Valoración', value: 'scale', icon: 'pi pi-sliders-h' }
  ];

  difficultyLevels = [
    { label: 'Fácil', value: 1, color: '#22c55e', description: 'Conocimiento básico' },
    { label: 'Medio', value: 2, color: '#f59e0b', description: 'Conocimiento intermedio' },
    { label: 'Difícil', value: 3, color: '#ef4444', description: 'Conocimiento avanzado' }
  ];

  // Validation rules
  validationRules = {
    questionText: { min: 10, max: 500 },
    explanation: { max: 1000 },
    optionText: { min: 1, max: 200 },
    minOptions: 2,
    maxOptions: 6
  };

  currentUser: any;

  // Make String available to template
  String = String;

  constructor(
    private fb: FormBuilder,
    private questionsService: QuestionsService,
    private categoryService: CategoryService,
    private authService: AuthService,
    private messageService: MessageService
  ) {
    this.initForm();

    const userData = localStorage.getItem('ecobarometro_user');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    }
  }

  ngOnInit() {
    this.loadCategories();
    if (this.editQuestion) {
      this.loadQuestionForEdit();
    }
  }

  initForm() {
    this.questionForm = this.fb.group({
      question_text: ['', [
        Validators.required,
        Validators.minLength(this.validationRules.questionText.min),
        Validators.maxLength(this.validationRules.questionText.max)
      ]],
      category_id: ['', Validators.required],
      question_type: ['multiple_choice', Validators.required],
      difficulty_level: [1, Validators.required],
      explanation: ['', [Validators.maxLength(this.validationRules.explanation.max)]],
      points: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
      time_limit: [30, [Validators.required, Validators.min(5), Validators.max(300)]],
      options: this.fb.array([]),
      // For true/false questions
      correct_answer: [''],
      // For scale questions
      scale_min: [1],
      scale_max: [5],
      scale_min_label: [''],
      scale_max_label: [''],
      scale_correct_value: [3]
    });

    // Watch question type changes
    this.questionForm.get('question_type')?.valueChanges.subscribe(type => {
      this.onQuestionTypeChange(type);
    });

    // Initialize with default options for multiple choice
    this.initializeDefaultOptions();
  }

  initializeDefaultOptions() {
    const optionsArray = this.questionForm.get('options') as FormArray;
    // Clear existing options
    while (optionsArray.length) {
      optionsArray.removeAt(0);
    }

    // Add default 4 options for multiple choice
    for (let i = 0; i < 4; i++) {
      this.addOption();
    }
  }

  onQuestionTypeChange(type: string) {
    const optionsArray = this.questionForm.get('options') as FormArray;

    switch (type) {
      case 'multiple_choice':
        // Enable options, ensure at least 2 options
        if (optionsArray.length === 0) {
          this.initializeDefaultOptions();
        }
        this.questionForm.get('correct_answer')?.setValue('');
        break;

      case 'true_false':
        // Clear options, use correct_answer field
        optionsArray.clear();
        this.questionForm.get('correct_answer')?.setValue('true');
        break;

      case 'scale':
        // Clear options, use scale fields
        optionsArray.clear();
        this.questionForm.get('scale_min')?.setValue(1);
        this.questionForm.get('scale_max')?.setValue(5);
        this.questionForm.get('scale_correct_value')?.setValue(3);
        break;
    }
  }

  get optionsArray(): FormArray {
    return this.questionForm.get('options') as FormArray;
  }

  addOption() {
    const optionGroup = this.fb.group({
      option_text: ['', [
        Validators.required,
        Validators.minLength(this.validationRules.optionText.min),
        Validators.maxLength(this.validationRules.optionText.max)
      ]],
      is_correct: [false],
      explanation: ['']
    });

    this.optionsArray.push(optionGroup);
  }

  removeOption(index: number) {
    if (this.optionsArray.length > this.validationRules.minOptions) {
      this.optionsArray.removeAt(index);
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: `Se requieren al menos ${this.validationRules.minOptions} opciones`
      });
    }
  }

  canAddOption(): boolean {
    return this.optionsArray.length < this.validationRules.maxOptions;
  }

  canRemoveOption(): boolean {
    return this.optionsArray.length > this.validationRules.minOptions;
  }

  setCorrectOption(index: number) {
    // Uncheck all options first
    for (let i = 0; i < this.optionsArray.length; i++) {
      this.optionsArray.at(i).get('is_correct')?.setValue(false);
    }
    // Set the selected option as correct
    this.optionsArray.at(index).get('is_correct')?.setValue(true);
  }

  loadCategories() {
    const admin = this.authService.getCurrentAdmin();
    if (!admin) return;

    this.categoryService.getCategoriesByAdmin(admin.id).subscribe({
      next: (categories) => {
        this.categories = categories;
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar las categorías'
        });
      }
    });
  }

  loadQuestionForEdit() {
    if (!this.editQuestion) return;

    this.isEditMode = true;

    // Load basic question data
    this.questionForm.patchValue({
      question_text: this.editQuestion.question_text,
      category_id: this.editQuestion.category_id,
      question_type: this.editQuestion.question_type,
      difficulty_level: this.editQuestion.difficulty_level,
      explanation: this.editQuestion.explanation,
      points: this.editQuestion.points,
      time_limit: this.editQuestion.time_limit
    });

    // Load question-specific data
    this.onQuestionTypeChange(this.editQuestion.question_type);

    if (this.editQuestion.question_type === 'multiple_choice' && this.editQuestion.options) {
      // Load options for multiple choice
      const optionsArray = this.questionForm.get('options') as FormArray;
      optionsArray.clear();

      this.editQuestion.options.forEach((option: any) => {
        const optionGroup = this.fb.group({
          option_text: [option.option_text, [Validators.required]],
          is_correct: [option.is_correct],
          explanation: [option.explanation || '']
        });
        optionsArray.push(optionGroup);
      });
    }
  }

  validateForm(): boolean {
    const formValue = this.questionForm.value;

    // Validate based on question type
    switch (formValue.question_type) {
      case 'multiple_choice':
        const hasCorrectOption = formValue.options.some((opt: any) => opt.is_correct);
        if (!hasCorrectOption) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error de Validación',
            detail: 'Debe seleccionar al menos una opción correcta'
          });
          return false;
        }
        break;

      case 'scale':
        if (formValue.scale_min >= formValue.scale_max) {
          this.messageService.add({
            severity: 'error',
            summary: 'Error de Validación',
            detail: 'El valor mínimo debe ser menor que el máximo'
          });
          return false;
        }
        break;
    }

    return this.questionForm.valid;
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    const admin = this.authService.getCurrentAdmin();
    if (!admin) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo identificar al administrador'
      });
      this.isLoading = false;
      return;
    }

    const formValue = this.questionForm.value;
    const questionData: any = {
      admin_id: admin.id,
      question_text: formValue.question_text,
      category_id: formValue.category_id,
      question_type: formValue.question_type,
      difficulty_level: formValue.difficulty_level,
      explanation: formValue.explanation,
      points: formValue.points,
      time_limit: formValue.time_limit,
      options: []
    };

    // Prepare options based on question type
    switch (formValue.question_type) {
      case 'multiple_choice':
        questionData.options = formValue.options.map((opt: any, index: number) => ({
          option_text: opt.option_text,
          is_correct: opt.is_correct,
          points: opt.is_correct ? formValue.points : 0,
          explanation: opt.explanation || null,
          order_index: index
        }));
        break;

      case 'true_false':
        questionData.options = [
          {
            option_text: 'Verdadero',
            is_correct: formValue.correct_answer === 'true',
            points: formValue.correct_answer === 'true' ? formValue.points : 0,
            order_index: 0
          },
          {
            option_text: 'Falso',
            is_correct: formValue.correct_answer === 'false',
            points: formValue.correct_answer === 'false' ? formValue.points : 0,
            order_index: 1
          }
        ];
        break;

      case 'scale':
        // For scale questions, we store the scale configuration
        questionData.scale_config = {
          min_value: formValue.scale_min,
          max_value: formValue.scale_max,
          min_label: formValue.scale_min_label,
          max_label: formValue.scale_max_label,
          correct_value: formValue.scale_correct_value
        };
        break;
    }

    // Save question
    const saveOperation = this.isEditMode
      ? this.questionsService.updateQuestion(this.editQuestion!.id, questionData)
      : this.questionsService.createQuestion(admin.id, questionData);

    saveOperation.subscribe({
      next: (savedQuestion) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: this.isEditMode ? 'Pregunta actualizada correctamente' : 'Pregunta creada correctamente'
        });

        this.questionSaved.emit(savedQuestion);
        this.resetForm();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error saving question:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo guardar la pregunta. Intenta nuevamente.'
        });
        this.isLoading = false;
      }
    });
  }

  resetForm() {
    this.questionForm.reset();
    this.initForm();
    this.editQuestion = null;
    this.isEditMode = false;
    this.activeTab = 0;
  }

  closeForm() {
    this.resetForm();
    this.formClosed.emit();
  }

  // Helper methods
  getCharacterCount(controlName: string): number {
    const control = this.questionForm.get(controlName);
    return control?.value?.length || 0;
  }

  getMaxCharacters(field: string): number {
    switch (field) {
      case 'question_text': return this.validationRules.questionText.max;
      case 'explanation': return this.validationRules.explanation.max;
      case 'option_text': return this.validationRules.optionText.max;
      default: return 0;
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.questionForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.questionForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return 'Este campo es requerido';
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['maxlength']) return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      if (field.errors['min']) return `Valor mínimo: ${field.errors['min'].min}`;
      if (field.errors['max']) return `Valor máximo: ${field.errors['max'].max}`;
    }
    return '';
  }

  previewQuestion() {
    if (!this.questionForm.valid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Advertencia',
        detail: 'Complete todos los campos requeridos para previsualizar'
      });
      return;
    }

    // Switch to preview tab
    this.activeTab = 2;
  }

  get previewData(): any {
    const formValue = this.questionForm.value;
    return {
      question_text: formValue.question_text,
      question_type: formValue.question_type,
      difficulty_level: formValue.difficulty_level,
      points: formValue.points,
      time_limit: formValue.time_limit,
      options: formValue.options,
      correct_answer: formValue.correct_answer,
      scale_min: formValue.scale_min,
      scale_max: formValue.scale_max,
      scale_min_label: formValue.scale_min_label,
      scale_max_label: formValue.scale_max_label,
      scale_correct_value: formValue.scale_correct_value,
      explanation: formValue.explanation
    };
  }

  getDifficultyLabel(level: string): string {
    const difficulty = this.difficultyLevels.find((l: any) => l.value === level);
    return difficulty ? difficulty.label : '';
  }

  getDifficultySeverity(level: number): any {
    switch (level) {
      case 1: return 'success';
      case 2: return 'warning';
      case 3: return 'danger';
      default: return 'info';
    }
  }
}