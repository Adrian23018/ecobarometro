// src/app/core/services/supabase.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );
  }

  // Getter para acceso directo al cliente
  get client() {
    return this.supabase;
  }

  // ==================== AUTHENTICATION ====================
  
  async signUp(email: string, password: string) {
    return await this.supabase.auth.signUp({
      email,
      password
    });
  }

  async signIn(email: string, password: string) {
    return await this.supabase.auth.signInWithPassword({
      email,
      password
    });
  }

  async signOut() {
    return await this.supabase.auth.signOut();
  }

  async getCurrentUser() {
    return await this.supabase.auth.getUser();
  }

  // ==================== ADMINS ====================

  async createAdmin(adminData: any) {
    return await this.supabase
      .from('admins')
      .insert([adminData])
      .select()
      .single();
  }

  async getAdminByEmail(email: string) {
    return await this.supabase
      .from('admins')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();
  }

  async getAdminByCode(adminCode: string) {
    return await this.supabase
      .from('admins')
      .select('*')
      .eq('admin_code', adminCode)
      .eq('is_active', true)
      .single();
  }

  async updateAdmin(adminId: string, updates: any) {
    return await this.supabase
      .from('admins')
      .update(updates)
      .eq('id', adminId)
      .select()
      .single();
  }

  // ==================== USERS ====================

  async createUser(userData: any) {
    return await this.supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
  }

  async getUserByEmail(email: string) {
    return await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();
  }

  async getUsersByAdmin(adminId: string) {
    return await this.supabase
      .from('users')
      .select('*')
      .eq('admin_id', adminId)
      .eq('is_active', true)
      .order('total_points', { ascending: false });
  }

  async updateUser(userId: string, updates: any) {
    return await this.supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
  }

  // ==================== CATEGORIES ====================

  async createCategory(categoryData: any) {
    return await this.supabase
      .from('categories')
      .insert([categoryData])
      .select()
      .single();
  }

  async getCategoriesByAdmin(adminId: string) {
    return await this.supabase
      .from('categories')
      .select('*')
      .eq('admin_id', adminId)
      .eq('is_active', true)
      .order('order_index');
  }

  async updateCategory(categoryId: string, updates: any) {
    return await this.supabase
      .from('categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single();
  }

  async deleteCategory(categoryId: string) {
    return await this.supabase
      .from('categories')
      .update({ is_active: false })
      .eq('id', categoryId);
  }

  // ==================== QUESTIONS ====================

  async createQuestion(questionData: any) {
    return await this.supabase
      .from('questions')
      .insert([questionData])
      .select()
      .single();
  }

  async getQuestionsByAdmin(adminId: string) {
    return await this.supabase
      .from('questions')
      .select(`
        *,
        category:categories(*),
        options:question_options(*)
      `)
      .eq('admin_id', adminId)
      .eq('is_active', true)
      .order('order_index');
  }

  async getQuestionsByCategory(adminId: string, categoryId: string) {
    return await this.supabase
      .from('questions')
      .select(`
        *,
        category:categories(*),
        options:question_options(*)
      `)
      .eq('admin_id', adminId)
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('order_index');
  }

  async updateQuestion(questionId: string, updates: any) {
    return await this.supabase
      .from('questions')
      .update(updates)
      .eq('id', questionId)
      .select()
      .single();
  }

  async deleteQuestion(questionId: string) {
    return await this.supabase
      .from('questions')
      .update({ is_active: false })
      .eq('id', questionId);
  }

  // ==================== QUESTION OPTIONS ====================

  async createQuestionOptions(optionsData: any[]) {
    return await this.supabase
      .from('question_options')
      .insert(optionsData)
      .select();
  }

  async updateQuestionOption(optionId: string, updates: any) {
    return await this.supabase
      .from('question_options')
      .update(updates)
      .eq('id', optionId)
      .select()
      .single();
  }

  async deleteQuestionOptions(questionId: string) {
    return await this.supabase
      .from('question_options')
      .delete()
      .eq('question_id', questionId);
  }

  // ==================== GAME SESSIONS ====================

  async createGameSession(sessionData: any) {
    return await this.supabase
      .from('game_sessions')
      .insert([sessionData])
      .select()
      .single();
  }

  async getGameSession(sessionId: string) {
    return await this.supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
  }

  async updateGameSession(sessionId: string, updates: any) {
    return await this.supabase
      .from('game_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();
  }

  async getGameSessionsByUser(userId: string) {
    return await this.supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
  }

  // ==================== USER RESPONSES ====================

  async createUserResponse(responseData: any) {
    return await this.supabase
      .from('user_responses')
      .insert([responseData])
      .select()
      .single();
  }

  async getUserResponsesBySession(sessionId: string) {
    return await this.supabase
      .from('user_responses')
      .select(`
        *,
        question:questions(*),
        selected_option:question_options(*)
      `)
      .eq('game_session_id', sessionId)
      .order('created_at');
  }

  // ==================== RANKINGS ====================

  async getRankingByAdmin(adminId: string, limit: number = 10) {
    return await this.supabase
      .from('rankings')
      .select(`
        *,
        user:users(username, full_name, avatar_url)
      `)
      .eq('admin_id', adminId)
      .order('points', { ascending: false })
      .limit(limit);
  }

  async getRankingByCategory(adminId: string, categoryId: string, limit: number = 10) {
    return await this.supabase
      .from('rankings')
      .select(`
        *,
        user:users(username, full_name, avatar_url),
        category:categories(name, icon, color)
      `)
      .eq('admin_id', adminId)
      .eq('category_id', categoryId)
      .order('points', { ascending: false })
      .limit(limit);
  }

  async updateRanking(rankingData: any) {
    return await this.supabase
      .from('rankings')
      .upsert([rankingData], { 
        onConflict: 'admin_id,user_id,category_id'
      })
      .select();
  }

  // ==================== ACHIEVEMENTS ====================

  async getAchievementsByAdmin(adminId: string) {
    return await this.supabase
      .from('achievements')
      .select('*')
      .eq('admin_id', adminId)
      .eq('is_active', true)
      .order('points_required');
  }

  async getUserAchievements(userId: string) {
    return await this.supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq('user_id', userId)
      .order('earned_at', { ascending: false });
  }

  async createUserAchievement(achievementData: any) {
    return await this.supabase
      .from('user_achievements')
      .upsert([achievementData], {
        onConflict: 'user_id,achievement_id'
      })
      .select();
  }

  // ==================== ANALYTICS ====================

  async getAdminAnalytics(adminId: string) {
    const [users, sessions, questions, categories] = await Promise.all([
      this.supabase
        .from('users')
        .select('id, total_points, games_played')
        .eq('admin_id', adminId)
        .eq('is_active', true),
      
      this.supabase
        .from('game_sessions')
        .select('id, total_points, completion_percentage, status')
        .eq('admin_id', adminId),
      
      this.supabase
        .from('questions')
        .select('id, category_id')
        .eq('admin_id', adminId)
        .eq('is_active', true),
      
      this.supabase
        .from('categories')
        .select('id, name')
        .eq('admin_id', adminId)
        .eq('is_active', true)
    ]);

    return {
      users: users.data || [],
      sessions: sessions.data || [],
      questions: questions.data || [],
      categories: categories.data || []
    };
  }

  // ==================== UTILS ====================

  async generateUniqueAdminCode(): Promise<string> {
    let code = '';
    let isUnique = false;
    
    while (!isUnique) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { data } = await this.supabase
        .from('admins')
        .select('admin_code')
        .eq('admin_code', code)
        .single();
      
      isUnique = !data;
    }
    
    return code;
  }

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  subscribeToRankingUpdates(adminId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel('ranking-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rankings',
        filter: `admin_id=eq.${adminId}`
      }, callback)
      .subscribe();
  }

  subscribeToUserResponses(sessionId: string, callback: (payload: any) => void) {
    return this.supabase
      .channel('user-responses')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_responses',
        filter: `game_session_id=eq.${sessionId}`
      }, callback)
      .subscribe();
  }
}