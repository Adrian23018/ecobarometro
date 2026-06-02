import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Observable, from, map } from 'rxjs';
import { 
  Question, 
  QuestionOption, 
  CreateQuestionRequest, 
  UpdateQuestionRequest,
  QuestionWithStats,
  GameQuestion
} from '../models/question';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class QuestionsService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // CRUD Operations
  createQuestion(adminId: string, questionData: CreateQuestionRequest): Observable<Question> {
    return from(this.createQuestionWithOptions(adminId, questionData));
  }

  private async createQuestionWithOptions(adminId: string, questionData: CreateQuestionRequest): Promise<Question> {
    // Crear la pregunta
    const { data: question, error: questionError } = await this.supabase
      .from('questions')
      .insert([{
        admin_id: adminId,
        category_id: questionData.category_id,
        question_text: questionData.question_text,
        question_type: questionData.question_type,
        points: questionData.points,
        difficulty_level: questionData.difficulty_level,
        order_index: 0,
        explanation: questionData.explanation ?? null,
        time_limit: questionData.time_limit ?? 30,
        weighted_scoring: questionData.weighted_scoring ?? false,
        scale_min: questionData.scale_config?.min_value ?? questionData.scale_min ?? null,
        scale_max: questionData.scale_config?.max_value ?? questionData.scale_max ?? null,
        scale_min_label: questionData.scale_config?.min_label ?? questionData.scale_min_label ?? null,
        scale_max_label: questionData.scale_config?.max_label ?? questionData.scale_max_label ?? null,
        scale_correct_value: questionData.scale_config?.correct_value ?? questionData.scale_correct_value ?? null,
        correct_answer: questionData.correct_answer ?? null
      }])
      .select()
      .single();

    if (questionError) throw questionError;

    // Crear las opciones
    const optionsToInsert = (questionData.options || []).map((option, index) => ({
      question_id: question.id,
      option_text: option.option_text,
      is_correct: option.is_correct,
      points: option.points,
      order_index: option.order_index ?? index,
      explanation: option.explanation ?? null
    }));

    const { data: options, error: optionsError } = await this.supabase
      .from('question_options')
      .insert(optionsToInsert)
      .select();

    if (optionsError) throw optionsError;

    return {
      ...question,
      options: options
    };
  }

  getQuestionsByAdmin(adminId: string): Observable<Question[]> {
    return from(
      this.supabase
        .from('questions')
        .select(`
          *,
          category:categories(*),
          options:question_options(*)
        `)
        .eq('admin_id', adminId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data || [];
      })
    );
  }

  getQuestionsByCategory(categoryId: string): Observable<Question[]> {
    return from(
      this.supabase
        .from('questions')
        .select(`
          *,
          category:categories(*),
          options:question_options(*)
        `)
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('order_index', { ascending: true })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data || [];
      })
    );
  }

  getQuestionById(id: string): Observable<Question> {
    return from(
      this.supabase
        .from('questions')
        .select(`
          *,
          category:categories(*),
          options:question_options(*)
        `)
        .eq('id', id)
        .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data;
      })
    );
  }

  updateQuestion(id: string, updates: UpdateQuestionRequest): Observable<Question> {
    return from(this.updateQuestionWithOptions(id, updates));
  }

  private async updateQuestionWithOptions(id: string, updates: UpdateQuestionRequest): Promise<Question> {
    // Actualizar la pregunta
    const questionUpdates: any = { ...updates };
    delete questionUpdates.options;

    const { data: question, error: questionError } = await this.supabase
      .from('questions')
      .update(questionUpdates)
      .eq('id', id)
      .select()
      .single();

    if (questionError) throw questionError;

    // Si hay opciones para actualizar
    if (updates.options) {
      // Eliminar opciones existentes
      await this.supabase
        .from('question_options')
        .delete()
        .eq('question_id', id);

      // Crear nuevas opciones
      const optionsToInsert = (updates.options || []).map((option, index) => ({
        question_id: id,
        option_text: option.option_text,
        is_correct: option.is_correct,
        points: option.points,
        order_index: option.order_index ?? index,
        explanation: (option as any).explanation ?? null
      }));

      const { data: options } = await this.supabase
        .from('question_options')
        .insert(optionsToInsert)
        .select();

      return {
        ...question,
        options: options || []
      };
    }

    return question;
  }

  deleteQuestion(id: string): Observable<void> {
    return from(
      this.supabase
        .from('questions')
        .update({ is_active: false })
        .eq('id', id)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return;
      })
    );
  }

  // Game-specific methods
  getRandomQuestions(adminId: string, categoryIds?: string[], limit: number = 20): Observable<GameQuestion[]> {
    return from(this.fetchRandomQuestions(adminId, categoryIds, limit));
  }

  /**
   * Carga preguntas en orden FIJO (order_index ASC) — necesario para restaurar progreso correctamente.
   * Con orden determinista, siempre la pregunta N es la misma, sin importar cuántas veces se cargue.
   */
  getOrderedQuestions(adminId: string, categoryIds?: string[], limit: number = 1000): Observable<GameQuestion[]> {
    return from(this.fetchOrderedQuestions(adminId, categoryIds, limit));
  }

  private async fetchOrderedQuestions(adminId: string, categoryIds?: string[], limit: number = 1000): Promise<GameQuestion[]> {
    let query = this.supabase
      .from('questions')
      .select(`*, category:categories(*), options:question_options(*)`)
      .eq('admin_id', adminId)
      .eq('is_active', true)
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true })
      .limit(limit);

    if (categoryIds && categoryIds.length > 0) {
      query = query.in('category_id', categoryIds);
    }

    const { data: questions, error } = await query;
    if (error) throw new Error(error.message);
    if (!questions || questions.length === 0) return [];

    console.log('[EcoChallenge] Preguntas traídas de DB:', questions.length, '| limit usado:', limit);
    const withOptions = questions.filter(q => (q.options?.length || 0) > 0);
    console.log('[EcoChallenge] Preguntas con opciones:', withOptions.length);

    return withOptions.map(q => ({
      question: {
        ...q,
        options: (q.options || []).sort((a: any, b: any) => a.order_index - b.order_index)
      } as Question,
      options: (q.options || []).sort((a: any, b: any) => a.order_index - b.order_index),
      time_limit: this.getTimeLimitByDifficulty(q.difficulty_level),
      bonus_points: this.getBonusPointsByDifficulty(q.difficulty_level)
    }));
  }

  getQuestionsForSession(sessionId: string): Observable<Question[]> {
    return from(this.fetchSessionQuestions(sessionId));
  }

  private async fetchSessionQuestions(sessionId: string): Promise<Question[]> {
    // Obtener la información de la sesión para saber qué categorías y admin
    const { data: session } = await this.supabase
      .from('game_sessions')
      .select('admin_id, total_questions')
      .eq('id', sessionId)
      .single();

    if (!session) throw new Error('Sesión no encontrada');

    // Para simplificar, obtenemos preguntas aleatorias del admin
    // En una implementación más avanzada, podrías guardar las preguntas específicas por sesión
    const questions = await this.fetchRandomQuestions(session.admin_id, undefined, session.total_questions);

    return questions.map(gq => gq.question);
  }

  private async fetchRandomQuestions(adminId: string, categoryIds?: string[], limit: number = 20): Promise<GameQuestion[]> {
    try {
      console.log('🔍 Buscando preguntas en la base de datos...');
      console.log('📊 Parámetros de búsqueda:', { adminId, categoryIds, limit });

      let query = this.supabase
        .from('questions')
        .select(`
          *,
          category:categories(*),
          options:question_options(*)
        `)
        .eq('admin_id', adminId)
        .eq('is_active', true);

      if (categoryIds && categoryIds.length > 0) {
        query = query.in('category_id', categoryIds);
      }

      console.log('🚀 Ejecutando consulta SQL...');
      const { data: questions, error } = await query;

      if (error) {
        console.error('❌ Error en consulta SQL:', error);
        throw new Error(`Error consultando preguntas: ${error.message}`);
      }

      console.log('📋 Preguntas encontradas:', questions?.length || 0);
      console.log('📝 Preguntas completas:', questions);

      if (!questions || questions.length === 0) {
        console.warn('⚠️ No se encontraron preguntas para admin_id:', adminId);
        return [];
      }

      // DEBUG: Verificar cuántas preguntas tienen opciones
      console.log('🔍 ANÁLISIS DE OPCIONES:');
      console.log('Total de preguntas obtenidas:', questions.length);

      const questionsWithoutOptions: any[] = [];
      const questionsWithOptions: any[] = [];

      questions.forEach((q, index) => {
        const optionsCount = q.options?.length || 0;
        console.log(`   Pregunta ${index + 1}: "${q.question_text?.substring(0, 50)}..." - Opciones: ${optionsCount}`);

        if (optionsCount === 0) {
          console.error(`   ❌ PREGUNTA SIN OPCIONES (ID: ${q.id})`);
          questionsWithoutOptions.push(q);
        } else {
          questionsWithOptions.push(q);
        }
      });

      console.log('✅ Preguntas CON opciones:', questionsWithOptions.length);
      console.log('❌ Preguntas SIN opciones:', questionsWithoutOptions.length);

      if (questionsWithoutOptions.length > 0) {
        console.error('🚨 PROBLEMA DETECTADO: Tienes preguntas sin opciones de respuesta.');
        console.error('🚨 Necesitas agregar opciones a estas preguntas en el panel de administrador:');
        questionsWithoutOptions.forEach(q => {
          console.error(`   - "${q.question_text}" (ID: ${q.id})`);
        });
      }

      if (questionsWithOptions.length === 0) {
        console.warn('⚠️ No se encontraron preguntas con opciones válidas');
        return [];
      }

      // Mezclar preguntas aleatoriamente (solo las que tienen opciones)
      const shuffled = questionsWithOptions.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, limit);

      console.log('🎯 Preguntas seleccionadas:', selected.length);

      return selected.map(question => ({
        question: question as Question,
        options: (question.options || []).sort(() => Math.random() - 0.5), // Mezclar opciones
        time_limit: this.getTimeLimitByDifficulty(question.difficulty_level),
        bonus_points: this.getBonusPointsByDifficulty(question.difficulty_level)
      }));

    } catch (error) {
      console.error('💥 Error completo en fetchRandomQuestions:', error);
      throw error;
    }
  }

  private getTimeLimitByDifficulty(difficulty: number): number {
    switch (difficulty) {
      case 1: return 30; // 30 segundos para fácil
      case 2: return 45; // 45 segundos para medio
      case 3: return 60; // 60 segundos para difícil
      default: return 30;
    }
  }

  private getBonusPointsByDifficulty(difficulty: number): number {
    switch (difficulty) {
      case 1: return 5;
      case 2: return 10;
      case 3: return 15;
      default: return 5;
    }
  }

  // Analytics
  getQuestionsWithStats(adminId: string): Observable<QuestionWithStats[]> {
    return from(this.calculateQuestionStats(adminId));
  }

  private async calculateQuestionStats(adminId: string): Promise<QuestionWithStats[]> {
    const { data: questions } = await this.supabase
      .from('questions')
      .select(`
        *,
        category:categories(*),
        options:question_options(*)
      `)
      .eq('admin_id', adminId)
      .eq('is_active', true);

    if (!questions) return [];

    const questionsWithStats: QuestionWithStats[] = [];

    for (const question of questions) {
      // Obtener estadísticas de respuestas
      const { data: responses } = await this.supabase
        .from('user_responses')
        .select('*')
        .eq('question_id', question.id);

      const totalResponses = responses?.length || 0;
      const correctResponses = responses?.filter(r => r.is_correct).length || 0;
      const avgTime = totalResponses > 0 
        ? responses!.reduce((sum, r) => sum + r.time_taken, 0) / totalResponses 
        : 0;

      // Calcular dificultad percibida (basada en tasa de aciertos)
      let difficultyRating = question.difficulty_level;
      if (totalResponses >= 10) { // Solo si hay suficientes respuestas
        const successRate = correctResponses / totalResponses;
        if (successRate > 0.8) difficultyRating = 1; // Fácil
        else if (successRate > 0.5) difficultyRating = 2; // Medio
        else difficultyRating = 3; // Difícil
      }

      questionsWithStats.push({
        question: question as Question,
        total_responses: totalResponses,
        correct_responses: correctResponses,
        avg_time: Math.round(avgTime),
        difficulty_rating: difficultyRating
      });
    }

    return questionsWithStats;
  }

  // Validation
  validateQuestionOwnership(questionId: string, adminId: string): Observable<boolean> {
    return from(
      this.supabase
        .from('questions')
        .select('id')
        .eq('id', questionId)
        .eq('admin_id', adminId)
        .single()
    ).pipe(
      map(response => {
        return !response.error && !!response.data;
      })
    );
  }

  // Duplicate question
  duplicateQuestion(questionId: string, adminId: string): Observable<Question> {
    return from(this.cloneQuestion(questionId, adminId));
  }

  private async cloneQuestion(questionId: string, adminId: string): Promise<Question> {
    // Obtener pregunta original
    const { data: originalQuestion } = await this.supabase
      .from('questions')
      .select(`
        *,
        options:question_options(*)
      `)
      .eq('id', questionId)
      .eq('admin_id', adminId)
      .single();

    if (!originalQuestion) throw new Error('Pregunta no encontrada');

    // Crear nueva pregunta
    const { data: newQuestion, error } = await this.supabase
      .from('questions')
      .insert([{
        admin_id: adminId,
        category_id: originalQuestion.category_id,
        question_text: `${originalQuestion.question_text} (Copia)`,
        question_type: originalQuestion.question_type,
        points: originalQuestion.points,
        difficulty_level: originalQuestion.difficulty_level,
        order_index: originalQuestion.order_index
      }])
      .select()
      .single();

    if (error) throw error;

    // Copiar opciones
    if (originalQuestion.options && originalQuestion.options.length > 0) {
      const optionsToInsert = originalQuestion.options.map((option: any) => ({
        question_id: newQuestion.id,
        option_text: option.option_text,
        is_correct: option.is_correct,
        points: option.points,
        order_index: option.order_index
      }));

      const { data: newOptions } = await this.supabase
        .from('question_options')
        .insert(optionsToInsert)
        .select();

      return {
        ...newQuestion,
        options: newOptions || []
      };
    }

    return newQuestion;
  }

  // Método para verificar existencia de preguntas
  checkQuestionsExist(adminId: string): Observable<number> {
    return from(this.supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('admin_id', adminId)
      .eq('is_active', true)
    ).pipe(
      map(response => {
        console.log('📊 Conteo de preguntas:', response);
        return response.count || 0;
      })
    );
  }

  // Método para obtener preguntas de prueba para debugging
  getTestQuestions(adminId: string): Observable<Question[]> {
    return from(this.supabase
      .from('questions')
      .select(`
        *,
        options:question_options(*)
      `)
      .eq('admin_id', adminId)
      .eq('is_active', true)
      .limit(5)
    ).pipe(
      map(response => {
        console.log('🧪 Preguntas de prueba:', response);
        if (response.error) throw response.error;
        return response.data || [];
      })
    );
  }

  // Bulk operations
  bulkUpdateQuestions(updates: { id: string, updates: Partial<Question> }[]): Observable<void> {
    return from(this.processBulkUpdates(updates));
  }

  private async processBulkUpdates(updates: { id: string, updates: Partial<Question> }[]): Promise<void> {
    for (const update of updates) {
      await this.supabase
        .from('questions')
        .update(update.updates)
        .eq('id', update.id);
    }
  }
}