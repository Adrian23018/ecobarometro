// src/app/core/services/local-storage.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface GameSettings {
  soundEnabled: boolean;
  animationsEnabled: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  theme: 'light' | 'dark' | 'auto';
  language: 'es' | 'en';
}

export interface GameProgress {
  currentLevel: number;
  totalExperience: number;
  completedCategories: string[];
  unlockedAchievements: string[];
  bestScores: { [categoryId: string]: number };
  totalGamesPlayed: number;
  streak: number;
}

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  
  // Keys para localStorage
  private readonly KEYS = {
    AUTH_TOKEN: 'ecobarometro_auth_token',
    USER_PROFILE: 'ecobarometro_user_profile',
    USER_ROLE: 'ecobarometro_user_role',
    GAME_SETTINGS: 'ecobarometro_game_settings',
    GAME_PROGRESS: 'ecobarometro_game_progress',
    OFFLINE_DATA: 'ecobarometro_offline_data',
    LAST_SYNC: 'ecobarometro_last_sync',
    APP_VERSION: 'ecobarometro_app_version',
    THEME_PREFERENCE: 'ecobarometro_theme',
    TUTORIAL_COMPLETED: 'ecobarometro_tutorial',
    HIGH_SCORES: 'ecobarometro_high_scores',
    ACHIEVEMENTS_CACHE: 'ecobarometro_achievements'
  };

  // Configuración por defecto
  private readonly DEFAULT_SETTINGS: GameSettings = {
    soundEnabled: true,
    animationsEnabled: true,
    difficulty: 'medium',
    theme: 'auto',
    language: 'es'
  };

  private readonly DEFAULT_PROGRESS: GameProgress = {
    currentLevel: 1,
    totalExperience: 0,
    completedCategories: [],
    unlockedAchievements: [],
    bestScores: {},
    totalGamesPlayed: 0,
    streak: 0
  };

  // Subjects para cambios reactivos
  private settingsSubject = new BehaviorSubject<GameSettings>(this.DEFAULT_SETTINGS);
  private progressSubject = new BehaviorSubject<GameProgress>(this.DEFAULT_PROGRESS);

  public settings$ = this.settingsSubject.asObservable();
  public progress$ = this.progressSubject.asObservable();

  constructor() {
    this.initializeData();
  }

  // ==================== INICIALIZACIÓN ====================

  private initializeData() {
    const settings = this.getGameSettings();
    const progress = this.getGameProgress();
    
    this.settingsSubject.next(settings);
    this.progressSubject.next(progress);
  }

  // ==================== AUTENTICACIÓN ====================

  setAuthToken(token: string): void {
    this.setItem(this.KEYS.AUTH_TOKEN, token);
  }

  getAuthToken(): string | null {
    return this.getItem(this.KEYS.AUTH_TOKEN);
  }

  setUserProfile(profile: any): void {
    this.setItem(this.KEYS.USER_PROFILE, profile);
  }

  getUserProfile(): any | null {
    return this.getItem(this.KEYS.USER_PROFILE);
  }

  setUserRole(role: 'admin' | 'user'): void {
    this.setItem(this.KEYS.USER_ROLE, role);
  }

  getUserRole(): 'admin' | 'user' | null {
    return this.getItem(this.KEYS.USER_ROLE);
  }

  clearAuthData(): void {
    this.removeItem(this.KEYS.AUTH_TOKEN);
    this.removeItem(this.KEYS.USER_PROFILE);
    this.removeItem(this.KEYS.USER_ROLE);
  }

  // ==================== CONFIGURACIONES DEL JUEGO ====================

  setGameSettings(settings: Partial<GameSettings>): void {
    const currentSettings = this.getGameSettings();
    const newSettings = { ...currentSettings, ...settings };
    
    this.setItem(this.KEYS.GAME_SETTINGS, newSettings);
    this.settingsSubject.next(newSettings);
  }

  getGameSettings(): GameSettings {
    const stored = this.getItem(this.KEYS.GAME_SETTINGS);
    return stored ? { ...this.DEFAULT_SETTINGS, ...stored } : this.DEFAULT_SETTINGS;
  }

  updateSetting<K extends keyof GameSettings>(key: K, value: GameSettings[K]): void {
    const settings = this.getGameSettings();
    settings[key] = value;
    this.setGameSettings(settings);
  }

  // ==================== PROGRESO DEL JUEGO ====================

  setGameProgress(progress: Partial<GameProgress>): void {
    const currentProgress = this.getGameProgress();
    const newProgress = { ...currentProgress, ...progress };
    
    this.setItem(this.KEYS.GAME_PROGRESS, newProgress);
    this.progressSubject.next(newProgress);
  }

  getGameProgress(): GameProgress {
    const stored = this.getItem(this.KEYS.GAME_PROGRESS);
    return stored ? { ...this.DEFAULT_PROGRESS, ...stored } : this.DEFAULT_PROGRESS;
  }

  updateLevel(newLevel: number): void {
    const progress = this.getGameProgress();
    progress.currentLevel = Math.max(progress.currentLevel, newLevel);
    this.setGameProgress(progress);
  }

  addExperience(experience: number): void {
    const progress = this.getGameProgress();
    progress.totalExperience += experience;
    this.setGameProgress(progress);
  }

  completeCategory(categoryId: string): void {
    const progress = this.getGameProgress();
    if (!progress.completedCategories.includes(categoryId)) {
      progress.completedCategories.push(categoryId);
      this.setGameProgress(progress);
    }
  }

  unlockAchievement(achievementId: string): void {
    const progress = this.getGameProgress();
    if (!progress.unlockedAchievements.includes(achievementId)) {
      progress.unlockedAchievements.push(achievementId);
      this.setGameProgress(progress);
    }
  }

  updateBestScore(categoryId: string, score: number): void {
    const progress = this.getGameProgress();
    const currentBest = progress.bestScores[categoryId] || 0;
    
    if (score > currentBest) {
      progress.bestScores[categoryId] = score;
      this.setGameProgress(progress);
    }
  }

  incrementGamesPlayed(): void {
    const progress = this.getGameProgress();
    progress.totalGamesPlayed += 1;
    this.setGameProgress(progress);
  }

  updateStreak(newStreak: number): void {
    const progress = this.getGameProgress();
    progress.streak = newStreak;
    this.setGameProgress(progress);
  }

  // ==================== DATOS OFFLINE ====================

  setOfflineData(data: any): void {
    this.setItem(this.KEYS.OFFLINE_DATA, data);
  }

  getOfflineData(): any | null {
    return this.getItem(this.KEYS.OFFLINE_DATA);
  }

  clearOfflineData(): void {
    this.removeItem(this.KEYS.OFFLINE_DATA);
  }

  setLastSync(timestamp: number): void {
    this.setItem(this.KEYS.LAST_SYNC, timestamp);
  }

  getLastSync(): number | null {
    return this.getItem(this.KEYS.LAST_SYNC);
  }

  // ==================== TEMA Y PREFERENCIAS ====================

  setThemePreference(theme: 'light' | 'dark' | 'auto'): void {
    this.setItem(this.KEYS.THEME_PREFERENCE, theme);
    this.updateSetting('theme', theme);
  }

  getThemePreference(): 'light' | 'dark' | 'auto' {
    return this.getItem(this.KEYS.THEME_PREFERENCE) || 'auto';
  }

  setTutorialCompleted(completed: boolean): void {
    this.setItem(this.KEYS.TUTORIAL_COMPLETED, completed);
  }

  isTutorialCompleted(): boolean {
    return this.getItem(this.KEYS.TUTORIAL_COMPLETED) || false;
  }

  // ==================== PUNTUACIONES ALTAS ====================

  setHighScores(scores: any): void {
    this.setItem(this.KEYS.HIGH_SCORES, scores);
  }

  getHighScores(): any | null {
    return this.getItem(this.KEYS.HIGH_SCORES);
  }

  addHighScore(categoryId: string, score: number, playerName: string): void {
    const highScores = this.getHighScores() || {};
    
    if (!highScores[categoryId]) {
      highScores[categoryId] = [];
    }
    
    highScores[categoryId].push({
      score,
      playerName,
      date: new Date().toISOString()
    });
    
    // Mantener solo los top 10
    highScores[categoryId] = highScores[categoryId]
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 10);
    
    this.setHighScores(highScores);
  }

  // ==================== CACHÉ DE LOGROS ====================

  setAchievementsCache(achievements: any[]): void {
    this.setItem(this.KEYS.ACHIEVEMENTS_CACHE, {
      data: achievements,
      timestamp: Date.now()
    });
  }

  getAchievementsCache(): { data: any[], timestamp: number } | null {
    return this.getItem(this.KEYS.ACHIEVEMENTS_CACHE);
  }

  clearAchievementsCache(): void {
    this.removeItem(this.KEYS.ACHIEVEMENTS_CACHE);
  }

  // ==================== VERSIÓN DE LA APP ====================

  setAppVersion(version: string): void {
    this.setItem(this.KEYS.APP_VERSION, version);
  }

  getAppVersion(): string | null {
    return this.getItem(this.KEYS.APP_VERSION);
  }

  // ==================== UTILIDADES GENERALES ====================

  public setItem(key: string, value: any): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Error guardando ${key} en localStorage:`, error);
    }
  }

  public getItem(key: string): any | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error leyendo ${key} de localStorage:`, error);
      return null;
    }
  }

  private removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error eliminando ${key} de localStorage:`, error);
    }
  }

  // ==================== GESTIÓN DE ESPACIO ====================

  getStorageUsage(): { used: number, available: number, percentage: number } {
    let used = 0;
    
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }
    
    // Estimación del espacio disponible (5MB típico)
    const available = 5 * 1024 * 1024; // 5MB en bytes
    const percentage = (used / available) * 100;
    
    return { used, available, percentage };
  }

  clearAllData(): void {
    Object.values(this.KEYS).forEach(key => {
      this.removeItem(key);
    });
    
    // Resetear subjects
    this.settingsSubject.next(this.DEFAULT_SETTINGS);
    this.progressSubject.next(this.DEFAULT_PROGRESS);
  }

  // ==================== EXPORTAR/IMPORTAR DATOS ====================

  exportUserData(): string {
    const userData = {
      profile: this.getUserProfile(),
      settings: this.getGameSettings(),
      progress: this.getGameProgress(),
      highScores: this.getHighScores(),
      exportDate: new Date().toISOString()
    };
    
    return JSON.stringify(userData, null, 2);
  }

  importUserData(jsonData: string): boolean {
    try {
      const userData = JSON.parse(jsonData);
      
      if (userData.settings) {
        this.setGameSettings(userData.settings);
      }
      
      if (userData.progress) {
        this.setGameProgress(userData.progress);
      }
      
      if (userData.highScores) {
        this.setHighScores(userData.highScores);
      }
      
      return true;
    } catch (error) {
      console.error('Error importando datos de usuario:', error);
      return false;
    }
  }

  // ==================== OBSERVABLES ====================

  getSettings(): Observable<GameSettings> {
    return this.settings$;
  }

  getProgress(): Observable<GameProgress> {
    return this.progress$;
  }

  // ==================== VALIDACIÓN ====================

  isStorageAvailable(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (error) {
      return false;
    }
  }

  needsDataMigration(): boolean {
    const currentVersion = this.getAppVersion();
    // Aquí puedes definir lógica de migración basada en versiones
    return !currentVersion;
  }
}