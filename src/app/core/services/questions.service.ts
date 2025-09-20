// src/app/core/services/questions.service.ts
import { Injectable } from '@angular/core';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { map, tap, switchMap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { LocalStorageService } from './local-storage.service';

export interface Question {
  id: string;
  admin_id: string;
  category_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'scale';
  points: number;
  difficulty_level: 1 | 2 | 3;
  order_index: number;
  is_active: boolean;
  category?: Category;
  options?: QuestionOption[];
  created_at?: string;
  updated_at?: string;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  points: number;
  order_index: number;
}

export interface Category {
  id: string;
  admin_id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order_index: number;
  is_active: boolean;
}

export interface QuestionSet {
  id: string;
  questions: Question[];
  totalQuestions: number;
  estimatedTime: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  categories: string[];
  maxPoints: number;
}

export interface QuestionFilter {
  categoryId?: string;
  difficulty?: number;
  questionType?: string;
  searchText?: string;
  shuffle?: boolean;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class QuestionsService {

  private questionsSubject = new BehaviorSubject<Question[]>([]);
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  private currentSetSubject = new BehaviorSubject<QuestionSet | null>(null);

  public questions$ = this.questionsSubject.asObservable();
  public categories$ = this.categoriesSubject.asObservable();
  public currentSet$ = this.currentSetSubject.asObservable();

  constructor(
    private supabase: SupabaseService,
    private localStorage: LocalStorageService
  ) {}

  // ==================== CARGA DE PREGUNTAS ====================

  loadQuestionsByAdmin(adminId: string, filter?: QuestionFilter): Observable<Question[]> {
    return from(this.supabase.getQuestionsByAdmin(adminId)).pipe(
      map(response => {
        if (response.error) throw response.error;
        let questions = response.data || [];
        
        // Aplicar filtros
        if (filter) {
          questions = this.applyFilters(questions, filter);
        }
        
        return questions;
      }),
      tap(questions => this.questionsSubject.next(questions))
    );
  }

  loadQuestionsByCategory(adminId: string, categoryId: string, filter?: QuestionFilter): Observable<Question[]> {
    return from(this.supabase.getQuestionsByCategory(adminId, categoryId)).pipe(
      map(response => {
        if (response.error) throw response.error;
        let questions = response.data || [];
        
        // Aplicar filtros
        if (filter) {
          questions = this.applyFilters(questions, filter);
        }
        
        return questions;
      })
    );
  }

  loadCategories(adminId: string): Observable<Category[]> {
    return from(this.supabase.getCategoriesByAdmin(adminId)).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data || [];
      }),
      tap(categories => this.categoriesSubject.next(categories))
    );
  }

  private applyFilters(questions: Question[], filter: QuestionFilter): Question[] {
    let filtered = [...questions];

    // Filtrar por categoría
    if (filter.categoryId) {
      filtered = filtered.filter(q => q.category_id === filter.categoryId);
    }

    // Filtrar por dificultad
    if (filter.difficulty) {
      filtered = filtered.filter(q => q.difficulty_level === filter.difficulty);
    }

    // Filtrar por tipo de pregunta
    if (filter.questionType) {
      filtered = filtered.filter(q => q.question_type === filter.questionType);
    }

    // Filtrar por texto de búsqueda
    if (filter.searchText) {
      const searchLower = filter.searchText.toLowerCase();
      filtered = filtered.filter(q => 
        q.question_text.toLowerCase().includes(searchLower) ||
        q.options?.some(opt => opt.option_text.toLowerCase().includes(searchLower))
      );
    }

    // Mezclar si se solicita
    if (filter.shuffle) {
      filtered = this.shuffleArray(filtered);
    }

    // Limitar cantidad
    if (filter.limit && filter.limit > 0) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  // ==================== GENERACIÓN DE SETS DE PREGUNTAS ====================

  generateQuestionSet(
    adminId: string, 
    config: {
      categoryIds?: string[];
      difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
      questionCount: number;
      includeAllCategories?: boolean;
      timeLimit?: number;
    }
  ): Observable<QuestionSet> {
    return this.loadQuestionsByAdmin(adminId).pipe(
      map(allQuestions => {
        let selectedQuestions: Question[] = [];
        let categories: string[] = [];

        if (config.includeAllCategories) {
          // Incluir preguntas de todas las categorías disponibles
          const categoriesMap = new Map<string, Question[]>();
          
          allQuestions.forEach(q => {
            if (!categoriesMap.has(q.category_id)) {
              categoriesMap.set(q.category_id, []);
            }
            categoriesMap.get(q.category_id)!.push(q);
          });

          const questionsPerCategory = Math.floor(config.questionCount / categoriesMap.size);
          const remainder = config.questionCount % categoriesMap.size;
          
          let currentIndex = 0;
          categoriesMap.forEach((questions, categoryId) => {
            categories.push(categoryId);
            let take = questionsPerCategory;
            if (currentIndex < remainder) take++; // Distribuir resto
            
            const filtered = this.filterByDifficulty(questions, config.difficulty);
            const shuffled = this.shuffleArray(filtered);
            selectedQuestions.push(...shuffled.slice(0, take));
            currentIndex++;
          });
          
        } else if (config.categoryIds && config.categoryIds.length > 0) {
          // Usar categorías específicas
          categories = config.categoryIds;
          const questionsPerCategory = Math.floor(config.questionCount / config.categoryIds.length);
          
          config.categoryIds.forEach(categoryId => {
            const categoryQuestions = allQuestions.filter(q => q.category_id === categoryId);
            const filtered = this.filterByDifficulty(categoryQuestions, config.difficulty);
            const shuffled = this.shuffleArray(filtered);
            selectedQuestions.push(...shuffled.slice(0, questionsPerCategory));
          });
          
        } else {
          // Selección general
          const filtered = this.filterByDifficulty(allQuestions, config.difficulty);
          const shuffled = this.shuffleArray(filtered);
          selectedQuestions = shuffled.slice(0, config.questionCount);
          categories = [...new Set(selectedQuestions.map(q => q.category_id))];
        }

        // Mezclar orden final
        selectedQuestions = this.shuffleArray(selectedQuestions);

        const questionSet: QuestionSet = {
          id: this.generateSetId(),
          questions: selectedQuestions,
          totalQuestions: selectedQuestions.length,
          estimatedTime: this.calculateEstimatedTime(selectedQuestions, config.timeLimit),
          difficulty: config.difficulty || 'mixed',
          categories,
          maxPoints: selectedQuestions.reduce((sum, q) => sum + q.points, 0)
        };

        this.currentSetSubject.next(questionSet);
        return questionSet;
      })
    );
  }

  private filterByDifficulty(questions: Question[], difficulty?: string): Question[] {
    if (!difficulty || difficulty === 'mixed') {
      return questions;
    }

    const difficultyMap = {
      'easy': 1,
      'medium': 2,
      'hard': 3
    };

    const targetLevel = difficultyMap[difficulty as keyof typeof difficultyMap];
    return questions.filter(q => q.difficulty_level === targetLevel);
  }

  private calculateEstimatedTime(questions: Question[], timeLimit?: number): number {
    if (timeLimit) return timeLimit;
    
    // Tiempo estimado basado en dificultad
    const baseTime = 30; // segundos por pregunta
    const totalTime = questions.reduce((time, q) => {
      const multiplier = q.difficulty_level === 1 ? 0.8 : q.difficulty_level === 3 ? 1.3 : 1;
      return time + (baseTime * multiplier);
    }, 0);
    
    return Math.round(totalTime);
  }

  // ==================== SETS PREDEFINIDOS ====================

  generateQuickGame(adminId: string): Observable<QuestionSet> {
    return this.generateQuestionSet(adminId, {
      questionCount: 10,
      difficulty: 'mixed',
      includeAllCategories: true,
      timeLimit: 300 // 5 minutos
    });
  }

  generateChallengeMode(adminId: string): Observable<QuestionSet> {
    return this.generateQuestionSet(adminId, {
      questionCount: 20,
      difficulty: 'hard',
      includeAllCategories: true,
      timeLimit: 900 // 15 minutos
    });
  }

  generatePracticeMode(adminId: string, categoryId: string): Observable<QuestionSet> {
    return this.generateQuestionSet(adminId, {
      categoryIds: [categoryId],
      questionCount: 15,
      difficulty: 'mixed'
    });
  }

  generateSpeedRound(adminId: string): Observable<QuestionSet> {
    return this.generateQuestionSet(adminId, {
      questionCount: 5,
      difficulty: 'easy',
      timeLimit: 60 // 1 minuto
    });
  }

  // ==================== GESTIÓN DE PREGUNTAS EN JUEGO ====================

  getNextQuestion(currentIndex: number): Question | null {
    const currentSet = this.currentSetSubject.value;
    if (!currentSet || currentIndex >= currentSet.questions.length) {
      return null;
    }
    return currentSet.questions[currentIndex];
  }

  getCurrentSet(): QuestionSet | null {
    return this.currentSetSubject.value;
  }

  isLastQuestion(currentIndex: number): boolean {
    const currentSet = this.currentSetSubject.value;
    return currentSet ? currentIndex >= currentSet.questions.length - 1 : true;
  }

  getProgress(currentIndex: number): { completed: number, total: number, percentage: number } {
    const currentSet = this.currentSetSubject.value;
    if (!currentSet) {
      return { completed: 0, total: 0, percentage: 0 };
    }
    
    const completed = currentIndex + 1;
    const total = currentSet.totalQuestions;
    const percentage = Math.round((completed / total) * 100);
    
    return { completed, total, percentage };
  }

  // ==================== VALIDACIÓN DE RESPUESTAS ====================

  validateAnswer(questionId: string, selectedOptionId: string): {
    isCorrect: boolean;
    correctOptionId: string;
    points: number;
    explanation?: string;
  } {
    const currentSet = this.currentSetSubject.value;
    if (!currentSet) {
      throw new Error('No hay set de preguntas activo');
    }

    const question = currentSet.questions.find(q => q.id === questionId);
    if (!question) {
      throw new Error('Pregunta no encontrada');
    }

    const selectedOption = question.options?.find(opt => opt.id === selectedOptionId);
    const correctOption = question.options?.find(opt => opt.is_correct);

    if (!selectedOption || !correctOption) {
      throw new Error('Opciones de respuesta no válidas');
    }

    return {
      isCorrect: selectedOption.is_correct,
      correctOptionId: correctOption.id,
      points: selectedOption.is_correct ? selectedOption.points : 0,
      explanation: this.generateExplanation(question, selectedOption.is_correct)
    };
  }

  private generateExplanation(question: Question, isCorrect: boolean): string {
    if (isCorrect) {
      return `¡Correcto! Has demostrado conocimiento sobre ${question.category?.name || 'este tema'}.`;
    } else {
      const correctOption = question.options?.find(opt => opt.is_correct);
      return `La respuesta correcta era: "${correctOption?.option_text}". Sigue practicando para mejorar en ${question.category?.name || 'este tema'}.`;
    }
  }

  // ==================== ESTADÍSTICAS DE PREGUNTAS ====================

  getQuestionStats(questionId: string): Observable<{
    totalAttempts: number;
    correctAttempts: number;
    accuracy: number;
    averageTime: number;
    difficultyRating: number;
  }> {
    return from(this.supabase.client
      .from('user_responses')
      .select('is_correct, time_taken')
      .eq('question_id', questionId)
    ).pipe(
      map(response => {
        const responses = response.data || [];
        const totalAttempts = responses.length;
        const correctAttempts = responses.filter(r => r.is_correct).length;
        const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;
        const averageTime = totalAttempts > 0 
          ? responses.reduce((sum, r) => sum + r.time_taken, 0) / totalAttempts 
          : 0;
        
        // Calcular dificultad percibida basada en estadísticas
        const difficultyRating = this.calculatePerceivedDifficulty(accuracy, averageTime);

        return {
          totalAttempts,
          correctAttempts,
          accuracy: Math.round(accuracy),
          averageTime: Math.round(averageTime),
          difficultyRating
        };
      })
    );
  }

  private calculatePerceivedDifficulty(accuracy: number, averageTime: number): number {
    // Algoritmo simple para calcular dificultad percibida
    // 1 = muy fácil, 5 = muy difícil
    let difficulty = 3; // neutral
    
    if (accuracy > 80) difficulty -= 1;
    if (accuracy < 40) difficulty += 1;
    if (averageTime > 45) difficulty += 0.5;
    if (averageTime < 15) difficulty -= 0.5;
    
    return Math.max(1, Math.min(5, Math.round(difficulty)));
  }

  // ==================== UTILIDADES ====================

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private generateSetId(): string {
    return `set_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ==================== CACHÉ LOCAL ====================

  cacheQuestions(adminId: string): Observable<void> {
    return this.loadQuestionsByAdmin(adminId).pipe(
      tap(questions => {
        this.localStorage.setOfflineData({
          questions,
          categories: this.categoriesSubject.value,
          cachedAt: Date.now()
        });
      }),
      map(() => void 0)
    );
  }

  loadQuestionsFromCache(): Question[] {
    const cached = this.localStorage.getOfflineData();
    return cached?.questions || [];
  }

  isCacheValid(maxAge: number = 24 * 60 * 60 * 1000): boolean {
    const cached = this.localStorage.getOfflineData();
    if (!cached || !cached.cachedAt) return false;
    
    return (Date.now() - cached.cachedAt) < maxAge;
  }

  // ==================== BÚSQUEDA Y FILTRADO AVANZADO ====================

  searchQuestions(query: string, adminId: string): Observable<Question[]> {
    return this.questions$.pipe(
      map(questions => {
        if (!query.trim()) return questions;
        
        const searchTerms = query.toLowerCase().split(' ');
        
        return questions.filter(question => {
          const searchableText = [
            question.question_text,
            question.category?.name,
            ...(question.options?.map(opt => opt.option_text) || [])
          ].join(' ').toLowerCase();
          
          return searchTerms.every(term => searchableText.includes(term));
        });
      })
    );
  }

  getRecommendedQuestions(userId: string, adminId: string, limit: number = 10): Observable<Question[]> {
    // Implementar algoritmo de recomendación basado en:
    // - Categorías con menor puntuación
    // - Preguntas no respondidas
    // - Dificultad apropiada para el nivel del usuario
    
    return this.loadQuestionsByAdmin(adminId).pipe(
      map(questions => {
        // Por ahora, retornar preguntas aleatorias
        // En una implementación real, usarías ML o reglas más complejas
        const shuffled = this.shuffleArray(questions);
        return shuffled.slice(0, limit);
      })
    );
  }

  // ==================== LIMPIEZA ====================

  clearCurrentSet(): void {
    this.currentSetSubject.next(null);
  }

  getCurrentQuestions(): Question[] {
    return this.questionsSubject.value;
  }

  getCurrentCategories(): Category[] {
    return this.categoriesSubject.value;
  }
}