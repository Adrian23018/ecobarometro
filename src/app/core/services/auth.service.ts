// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Observable, from, map, BehaviorSubject, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

// ===========================
// INTERFACES Y MODELOS
// ===========================

export interface Admin {
  id: string;
  email: string;
  password_hash?: string;
  name: string;
  company: string;
  admin_code: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  admin_id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  total_points: number;
  level: number;
  experience_points: number;
  games_played: number;
  admin_code: string;
  password_hash?: string;
  is_active: boolean;
  last_game_at?: string;
  created_at: string;
  updated_at: string;
}

// Request Interfaces
export interface CreateAdminRequest {
  email: string;
  password: string;
  name: string;
  company: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  username: string;
  full_name: string;
  admin_code: string;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface UserLoginRequest {
  email_or_username: string;
  password: string;
}

// Response Interfaces
export interface AdminLoginResponse {
  admin: Admin;
  token: string;
  admin_code: string;
}

export interface UserLoginResponse {
  user: User;
  token: string;
}

// Auth State Interface
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  admin: Admin | null;
  userType: 'user' | 'admin' | null;
}

// Generic Auth Response
export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private authState$ = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
    admin: null,
    userType: null
  });

  constructor(private router: Router) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    this.initializeAuthState();
  }

  // Observable para que los componentes puedan suscribirse a cambios de estado
  get authState(): Observable<AuthState> {
    return this.authState$.asObservable();
  }

  // Getter para compatibilidad con componentes existentes
  get currentUser$(): Observable<User | Admin | null> {
    return this.authState$.pipe(
      map(state => state.user || state.admin)
    );
  }

  private initializeAuthState(): void {
    // Check for existing session in localStorage
    const userData = localStorage.getItem('ecobarometro_user');
    const adminData = localStorage.getItem('ecobarometro_admin');
    const token = localStorage.getItem('ecobarometro_token');

    if (token) {
      if (userData) {
        const user = JSON.parse(userData);
        this.updateAuthState(true, user, null, 'user');
      } else if (adminData) {
        const admin = JSON.parse(adminData);
        this.updateAuthState(true, null, admin, 'admin');
      }
    }
  }

  // ===========================
  // MÉTODOS PARA REGISTRO
  // ===========================

  // Registro de Admin - Compatible con RegisterComponent
  async registerAdmin(adminData: CreateAdminRequest): Promise<AuthResponse> {
    try {
      // Verificar que el email no exista
      const emailExists = await this.checkEmailExists(adminData.email, 'admin');
      if (emailExists) {
        return {
          success: false,
          error: 'El email ya está registrado como administrador'
        };
      }

      // Hash password
      const hashedPassword = await this.hashPassword(adminData.password);
      
      // Generate unique admin code
      const adminCode = await this.generateAdminCode();

      // Create admin record
      const { data: admin, error } = await this.supabase
        .from('admins')
        .insert([{
          email: adminData.email,
          password_hash: hashedPassword,
          name: adminData.name,
          company: adminData.company,
          admin_code: adminCode,
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: `¡Registro exitoso! Bienvenido ${adminData.name}. Tu código de administrador es: ${adminCode}`,
        data: { admin, admin_code: adminCode }
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al crear la cuenta de administrador'
      };
    }
  }

  // Registro de Usuario - Compatible con RegisterComponent
  async registerUser(userData: CreateUserRequest): Promise<AuthResponse> {
    try {
      // Verificar que el código de admin exista
      const { data: admin, error: adminError } = await this.supabase
        .from('admins')
        .select('id')
        .eq('admin_code', userData.admin_code)
        .eq('is_active', true)
        .single();

      if (adminError || !admin) {
        return {
          success: false,
          error: 'Código de administrador no válido o inactivo'
        };
      }

      // Verificar que el email no exista
      const emailExists = await this.checkEmailExists(userData.email, 'user');
      if (emailExists) {
        return {
          success: false,
          error: 'El email ya está registrado'
        };
      }

      // Verificar que el username no exista
      const usernameExists = await this.checkUsernameExists(userData.username);
      if (usernameExists) {
        return {
          success: false,
          error: 'El nombre de usuario ya está en uso'
        };
      }

      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);

      // Create user record - coincide exactamente con tu esquema
      const userRecord = {
        admin_id: admin.id,
        email: userData.email,
        username: userData.username,
        full_name: userData.full_name,
        admin_code: userData.admin_code,
        password_hash: hashedPassword,
        total_points: 0,
        level: 1,
        experience_points: 0,
        games_played: 0,
        is_active: true,
        avatar_url: null,
        last_game_at: null
      };

      console.log('Insertando usuario:', userRecord);

      const { data: user, error } = await this.supabase
        .from('users')
        .insert([userRecord])
        .select()
        .single();

      console.log('Resultado inserción usuario:', { user, error });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: `¡Registro exitoso! Bienvenido ${userData.full_name}. Ya puedes empezar a jugar.`,
        data: { user }
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error al crear la cuenta de usuario'
      };
    }
  }

  // ===========================
  // MÉTODOS PARA LOGIN
  // ===========================

  // Login unificado - Compatible con LoginComponent
  async login(credentials: { email: string; password: string; rememberMe?: boolean }): Promise<AuthResponse> {
    try {
      // Primero intentar como admin
      const adminResult = await this.attemptAdminLogin({
        email: credentials.email,
        password: credentials.password
      });

      if (adminResult.success) {
        // Guardar sesión si rememberMe está habilitado
        if (credentials.rememberMe) {
          localStorage.setItem('ecobarometro_remember', 'true');
        }
        return adminResult;
      }

      // Si no es admin, intentar como usuario
      const userResult = await this.attemptUserLogin({
        email_or_username: credentials.email,
        password: credentials.password
      });

      if (userResult.success) {
        // Guardar sesión si rememberMe está habilitado
        if (credentials.rememberMe) {
          localStorage.setItem('ecobarometro_remember', 'true');
        }
        return userResult;
      }

      return {
        success: false,
        error: 'Credenciales incorrectas'
      };

    } catch (error: any) {
      return {
        success: false,
        error: 'Error de conexión. Intenta nuevamente.'
      };
    }
  }

  private async attemptAdminLogin(credentials: AdminLoginRequest): Promise<AuthResponse> {
    try {
      // Find admin by email
      const { data: admin, error } = await this.supabase
        .from('admins')
        .select('*')
        .eq('email', credentials.email)
        .eq('is_active', true)
        .single();

      if (error || !admin) {
        return { success: false, error: 'Admin not found' };
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(credentials.password, admin.password_hash);
      if (!isPasswordValid) {
        return { success: false, error: 'Invalid password' };
      }

      // Generate token
      const token = this.generateToken(admin.id, 'admin');
      
      // Store session
      localStorage.setItem('ecobarometro_admin', JSON.stringify(admin));
      localStorage.setItem('ecobarometro_token', token);
      
      // Update auth state
      this.updateAuthState(true, null, admin, 'admin');

      return {
        success: true,
        message: '¡Bienvenido Administrador!',
        data: { user: admin, role: 'admin' }
      };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async attemptUserLogin(credentials: UserLoginRequest): Promise<AuthResponse> {
    try {
      // Find user by email or username
      let query = this.supabase
        .from('users')
        .select('*')
        .eq('is_active', true);

      if (credentials.email_or_username.includes('@')) {
        query = query.eq('email', credentials.email_or_username);
      } else {
        query = query.eq('username', credentials.email_or_username);
      }

      const { data: user, error } = await query.single();

      if (error || !user) {
        return { success: false, error: 'User not found' };
      }

      // Verify password
      const isPasswordValid = await this.verifyPassword(credentials.password, user.password_hash || '');
      if (!isPasswordValid) {
        return { success: false, error: 'Invalid password' };
      }

      // Generate token
      const token = this.generateToken(user.id, 'user');
      
      // Store session
      localStorage.setItem('ecobarometro_user', JSON.stringify(user));
      localStorage.setItem('ecobarometro_token', token);
      
      // Update auth state
      this.updateAuthState(true, user, null, 'user');

      return {
        success: true,
        message: '¡Bienvenido Jugador!',
        data: { user, role: 'user' }
      };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ===========================
  // MÉTODOS DE VALIDACIÓN
  // ===========================

  // Verificar código de admin
  async verifyAdminCode(code: string): Promise<boolean> {
    try {
      // Limpiar el código de espacios y convertir a uppercase
      const cleanCode = code.trim().toUpperCase();
      
      console.log('Verificando código:', cleanCode);
      
      const { data, error } = await this.supabase
        .from('admins')
        .select('id, admin_code, is_active')
        .eq('admin_code', cleanCode)
        .eq('is_active', true);

      console.log('Resultado búsqueda directa:', { data, error });

      // Si encuentra resultado directo
      if (!error && data && data.length > 0) {
        return true;
      }

      // Si no encuentra, buscar todos los códigos activos para debugging
      const { data: allAdmins, error: allError } = await this.supabase
        .from('admins')
        .select('admin_code, is_active')
        .eq('is_active', true);

      if (!allError && allAdmins) {
        console.log('Todos los códigos en DB:', allAdmins);
        
        // Buscar coincidencia exacta
        const matchingAdmin = allAdmins.find(admin => 
          admin.admin_code.trim().toUpperCase() === cleanCode
        );
        
        if (matchingAdmin) {
          console.log('Encontrado por coincidencia:', matchingAdmin);
          return true;
        }
        
        console.log('No se encontró coincidencia para:', cleanCode);
        console.log('Códigos disponibles:', allAdmins.map(a => `"${a.admin_code}"`));
      }

      return false;
    } catch (error) {
      console.error('Error verificando código:', error);
      return false;
    }
  }

  // Check if email exists
  private async checkEmailExists(email: string, userType: 'user' | 'admin'): Promise<boolean> {
    const table = userType === 'admin' ? 'admins' : 'users';
    
    const { data } = await this.supabase
      .from(table)
      .select('id')
      .eq('email', email)
      .single();

    return !!data;
  }

  // Check if username exists
  private async checkUsernameExists(username: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    return !!data;
  }

  // ===========================
  // MÉTODOS DE SESIÓN
  // ===========================

  // Logout
  logout(): void {
    // Clear localStorage
    localStorage.removeItem('ecobarometro_user');
    localStorage.removeItem('ecobarometro_admin');
    localStorage.removeItem('ecobarometro_token');
    localStorage.removeItem('ecobarometro_remember');
    
    // Update auth state
    this.updateAuthState(false, null, null, null);
    
    // Redirect to login
    this.router.navigate(['/auth/login']);
  }

  // Estado de autenticación
  isAuthenticated(): boolean {
    return this.authState$.value.isAuthenticated;
  }

  isUser(): boolean {
    return this.authState$.value.userType === 'user';
  }

  isAdmin(): boolean {
    return this.authState$.value.userType === 'admin';
  }

  getCurrentUser(): User | Admin | null {
    const state = this.authState$.value;
    return state.user || state.admin;
  }

  getUserType(): 'user' | 'admin' | null {
    return this.authState$.value.userType;
  }

  getCurrentAdmin(): Admin | null {
    return this.authState$.value.admin;
  }

  // ===========================
  // MÉTODOS UTILITARIOS
  // ===========================

  private updateAuthState(
    isAuthenticated: boolean, 
    user: User | null, 
    admin: Admin | null, 
    userType: 'user' | 'admin' | null
  ): void {
    this.authState$.next({
      isAuthenticated,
      user,
      admin,
      userType
    });
  }

  private generateToken(userId: string, userType: 'user' | 'admin'): string {
    const payload = {
      userId,
      userType,
      timestamp: Date.now(),
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    };
    return btoa(JSON.stringify(payload));
  }

  private async hashPassword(password: string): Promise<string> {
    // Mejorado hash con salt único
    const salt = Math.random().toString(36).substring(2, 15);
    return btoa(password + salt) + '.' + salt;
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!hash || !hash.includes('.')) {
      return false;
    }
    
    const [hashedPassword, salt] = hash.split('.');
    const expectedHash = btoa(password + salt);
    return expectedHash === hashedPassword;
  }

  private async generateAdminCode(): Promise<string> {
    let code: string;
    let isUnique = false;

    while (!isUnique) {
      // Generate 6-character alphanumeric code
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Check if code already exists
      const { data } = await this.supabase
        .from('admins')
        .select('id')
        .eq('admin_code', code)
        .single();

      if (!data) {
        isUnique = true;
      }
    }

    return code!;
  }

  // ===========================
  // MÉTODOS OBSERVABLES PARA COMPATIBILIDAD
  // ===========================

  // Observable methods para compatibilidad con componentes existentes
  registerAdmin$(adminData: CreateAdminRequest): Observable<AuthResponse> {
    return from(this.registerAdmin(adminData));
  }

  registerUser$(userData: CreateUserRequest): Observable<AuthResponse> {
    return from(this.registerUser(userData));
  }

  login$(credentials: { email: string; password: string; rememberMe?: boolean }): Observable<AuthResponse> {
    return from(this.login(credentials));
  }

  verifyAdminCode$(code: string): Observable<boolean> {
    return from(this.verifyAdminCode(code));
  }

  // ===========================
  // MÉTODOS ADICIONALES
  // ===========================

  // Restaurar sesión
  restoreSession(): void {
    this.initializeAuthState();
  }

  // Verificar si token es válido
  private isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token));
      return payload.exp > Date.now();
    } catch {
      return false;
    }
  }

  // Refrescar token
  refreshToken(): void {
    const currentState = this.authState$.value;
    if (currentState.isAuthenticated) {
      const userId = currentState.user?.id || currentState.admin?.id;
      const userType = currentState.userType;
      
      if (userId && userType) {
        const newToken = this.generateToken(userId, userType);
        localStorage.setItem('ecobarometro_token', newToken);
      }
    }
  }

  // Método para obtener datos del admin actual (para crear preguntas)
  getCurrentAdminData(): Admin | null {
    return this.authState$.value.admin;
  }

  // Método para obtener datos del usuario actual (para el juego)
  getCurrentUserData(): User | null {
    return this.authState$.value.user;
  }
}