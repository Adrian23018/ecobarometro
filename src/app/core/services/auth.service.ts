// src/app/core/services/auth.service.ts
import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  total_points: number;
  level: number;
  experience_points: number;
  games_played: number;
  admin_code: string;
  admin_id: string;
  is_active: boolean;
  last_game_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminProfile {
  id: string;
  email: string;
  name: string;
  company?: string;
  admin_code: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | AdminProfile | null;
  role: 'user' | 'admin' | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterUserData {
  email: string;
  password: string;
  username: string;
  fullName: string;
  adminCode: string;
}

export interface RegisterAdminData {
  email: string;
  password: string;
  name: string;
  company?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;
  private authStateSubject = new BehaviorSubject<AuthState>({
    user: null,
    profile: null,
    role: null,
    isAuthenticated: false,
    isLoading: true
  });

  public authState$ = this.authStateSubject.asObservable();

  // Keys para localStorage
  private readonly AUTH_TOKEN_KEY = 'ecobarometro_auth_token';
  private readonly USER_PROFILE_KEY = 'ecobarometro_user_profile';
  private readonly USER_ROLE_KEY = 'ecobarometro_user_role';

  constructor(private router: Router) {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );

    this.initializeAuth();
  }

  // ==================== INICIALIZACIÓN ====================

  /**
   * Inicializa el servicio de autenticación
   */
  private async initializeAuth() {
    try {
      // Verificar sesión guardada en localStorage
      const savedProfile = this.getStoredProfile();
      const savedRole = this.getStoredRole();
      const savedToken = this.getStoredToken();

      if (savedProfile && savedRole && savedToken) {
        // Verificar que la sesión sigue siendo válida
        const { data: { user }, error } = await this.supabase.auth.getUser(savedToken);
        
        if (user && !error) {
          this.updateAuthState({
            user,
            profile: savedProfile,
            role: savedRole,
            isAuthenticated: true,
            isLoading: false
          });
          return;
        }
      }

      // Si no hay sesión válida, limpiar localStorage
      this.clearStoredAuth();
      this.updateAuthState({
        user: null,
        profile: null,
        role: null,
        isAuthenticated: false,
        isLoading: false
      });

    } catch (error) {
      console.error('Error inicializando autenticación:', error);
      this.clearStoredAuth();
      this.updateAuthState({
        user: null,
        profile: null,
        role: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  }

  // ==================== AUTENTICACIÓN DE USUARIOS ====================

  /**
   * Login de usuario
   */
  loginUser(credentials: LoginCredentials): Observable<UserProfile> {
    this.updateAuthState({ isLoading: true });

    return from(this.supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    })).pipe(
      switchMap(response => {
        if (response.error) throw response.error;
        
        const user = response.data.user;
        if (!user) throw new Error('Usuario no encontrado');

        // Buscar perfil de usuario
        return from(this.supabase
          .from('users')
          .select('*')
          .eq('email', user.email)
          .eq('is_active', true)
          .single()
        );
      }),
      map(profileResponse => {
        if (profileResponse.error) throw profileResponse.error;
        
        const profile = profileResponse.data as UserProfile;
        
        // Guardar en localStorage
        this.storeAuth(profile.email, profile, 'user');
        
        // Actualizar estado
        this.updateAuthState({
          user: { email: profile.email } as User,
          profile,
          role: 'user',
          isAuthenticated: true,
          isLoading: false
        });

        return profile;
      }),
      catchError(error => {
        this.updateAuthState({ isLoading: false });
        return throwError(() => new Error(`Error en login: ${error.message}`));
      })
    );
  }

  /**
   * Registro de usuario
   */
  registerUser(userData: RegisterUserData): Observable<UserProfile> {
    this.updateAuthState({ isLoading: true });

    return from(this.validateAdminCode(userData.adminCode)).pipe(
      switchMap(admin => {
        if (!admin) throw new Error('Código de administrador inválido');

        // Crear usuario en Supabase Auth
        return from(this.supabase.auth.signUp({
          email: userData.email,
          password: userData.password
        }));
      }),
      switchMap(authResponse => {
        if (authResponse.error) throw authResponse.error;
        
        const user = authResponse.data.user;
        if (!user) throw new Error('Error creando usuario');

        // Crear perfil de usuario
        const userProfile = {
          id: user.id,
          email: userData.email,
          username: userData.username,
          full_name: userData.fullName,
          admin_code: userData.adminCode,
          admin_id: '', // Se actualizará con el ID del admin
          total_points: 0,
          level: 1,
          experience_points: 0,
          games_played: 0,
          is_active: true
        };

        return from(this.supabase
          .from('users')
          .insert([userProfile])
          .select()
          .single()
        );
      }),
      map(profileResponse => {
        if (profileResponse.error) throw profileResponse.error;
        
        const profile = profileResponse.data as UserProfile;
        
        // Guardar en localStorage
        this.storeAuth(profile.email, profile, 'user');
        
        // Actualizar estado
        this.updateAuthState({
          user: { email: profile.email } as User,
          profile,
          role: 'user',
          isAuthenticated: true,
          isLoading: false
        });

        return profile;
      }),
      catchError(error => {
        this.updateAuthState({ isLoading: false });
        return throwError(() => new Error(`Error en registro: ${error.message}`));
      })
    );
  }

  // ==================== AUTENTICACIÓN DE ADMINISTRADORES ====================

  /**
   * Login de administrador
   */
  loginAdmin(credentials: LoginCredentials): Observable<AdminProfile> {
    this.updateAuthState({ isLoading: true });

    return from(this.supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    })).pipe(
      switchMap(response => {
        if (response.error) throw response.error;
        
        const user = response.data.user;
        if (!user) throw new Error('Administrador no encontrado');

        // Buscar perfil de administrador
        return from(this.supabase
          .from('admins')
          .select('*')
          .eq('email', user.email)
          .eq('is_active', true)
          .single()
        );
      }),
      map(profileResponse => {
        if (profileResponse.error) throw profileResponse.error;
        
        const profile = profileResponse.data as AdminProfile;
        
        // Guardar en localStorage
        this.storeAuth(profile.email, profile, 'admin');
        
        // Actualizar estado
        this.updateAuthState({
          user: { email: profile.email } as User,
          profile,
          role: 'admin',
          isAuthenticated: true,
          isLoading: false
        });

        return profile;
      }),
      catchError(error => {
        this.updateAuthState({ isLoading: false });
        return throwError(() => new Error(`Error en login de admin: ${error.message}`));
      })
    );
  }

  /**
   * Registro de administrador
   */
  registerAdmin(adminData: RegisterAdminData): Observable<AdminProfile> {
    this.updateAuthState({ isLoading: true });

    return from(this.supabase.auth.signUp({
      email: adminData.email,
      password: adminData.password
    })).pipe(
      switchMap(authResponse => {
        if (authResponse.error) throw authResponse.error;
        
        const user = authResponse.data.user;
        if (!user) throw new Error('Error creando administrador');

        // Generar código único de administrador
        return from(this.generateAdminCode()).pipe(
          switchMap(adminCode => {
            const adminProfile = {
              id: user.id,
              email: adminData.email,
              name: adminData.name,
              company: adminData.company,
              admin_code: adminCode,
              is_active: true
            };

            return from(this.supabase
              .from('admins')
              .insert([adminProfile])
              .select()
              .single()
            );
          })
        );
      }),
      map(profileResponse => {
        if (profileResponse.error) throw profileResponse.error;
        
        const profile = profileResponse.data as AdminProfile;
        
        // Guardar en localStorage
        this.storeAuth(profile.email, profile, 'admin');
        
        // Actualizar estado
        this.updateAuthState({
          user: { email: profile.email } as User,
          profile,
          role: 'admin',
          isAuthenticated: true,
          isLoading: false
        });

        return profile;
      }),
      catchError(error => {
        this.updateAuthState({ isLoading: false });
        return throwError(() => new Error(`Error en registro de admin: ${error.message}`));
      })
    );
  }

  // ==================== UTILIDADES ====================

  /**
   * Valida el código de administrador
   */
private async validateAdminCode(adminCode: string): Promise<AdminProfile | null> {
  const { data, error } = await this.supabase
    .from('admins')
    .select('*') // sin genérico aquí
    .eq('admin_code', adminCode)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error validando admin_code:', error.message);
    return null;
  }

  return data as AdminProfile | null; // 👈 casteo explícito
}




  /**
   * Genera un código único de administrador
   */
  private async generateAdminCode(): Promise<string> {
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

  /**
   * Logout
   */
  logout(): Observable<void> {
    return from(this.supabase.auth.signOut()).pipe(
      tap(() => {
        this.clearStoredAuth();
        this.updateAuthState({
          user: null,
          profile: null,
          role: null,
          isAuthenticated: false,
          isLoading: false
        });
        this.router.navigate(['/auth/login']);
      }),
      map(() => void 0)
    );
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  /**
   * Obtiene el rol del usuario actual
   */
  getCurrentRole(): 'user' | 'admin' | null {
    return this.authStateSubject.value.role;
  }

  /**
   * Obtiene el perfil del usuario actual
   */
  getCurrentProfile(): UserProfile | AdminProfile | null {
    return this.authStateSubject.value.profile;
  }

  // ==================== GESTIÓN DE LOCALSTORAGE ====================

  /**
   * Guarda datos de autenticación en localStorage
   */
  private storeAuth(token: string, profile: UserProfile | AdminProfile, role: 'user' | 'admin') {
    try {
      localStorage.setItem(this.AUTH_TOKEN_KEY, token);
      localStorage.setItem(this.USER_PROFILE_KEY, JSON.stringify(profile));
      localStorage.setItem(this.USER_ROLE_KEY, role);
    } catch (error) {
      console.error('Error guardando en localStorage:', error);
    }
  }

  /**
   * Obtiene el token guardado
   */
  private getStoredToken(): string | null {
    try {
      return localStorage.getItem(this.AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error leyendo token de localStorage:', error);
      return null;
    }
  }

  /**
   * Obtiene el perfil guardado
   */
  private getStoredProfile(): UserProfile | AdminProfile | null {
    try {
      const profileJson = localStorage.getItem(this.USER_PROFILE_KEY);
      return profileJson ? JSON.parse(profileJson) : null;
    } catch (error) {
      console.error('Error leyendo perfil de localStorage:', error);
      return null;
    }
  }

  /**
   * Obtiene el rol guardado
   */
  private getStoredRole(): 'user' | 'admin' | null {
    try {
      return localStorage.getItem(this.USER_ROLE_KEY) as 'user' | 'admin' | null;
    } catch (error) {
      console.error('Error leyendo rol de localStorage:', error);
      return null;
    }
  }

  /**
   * Limpia datos de autenticación de localStorage
   */
  private clearStoredAuth() {
    try {
      localStorage.removeItem(this.AUTH_TOKEN_KEY);
      localStorage.removeItem(this.USER_PROFILE_KEY);
      localStorage.removeItem(this.USER_ROLE_KEY);
    } catch (error) {
      console.error('Error limpiando localStorage:', error);
    }
  }

  /**
   * Actualiza el estado de autenticación
   */
  private updateAuthState(updates: Partial<AuthState>) {
    const currentState = this.authStateSubject.value;
    this.authStateSubject.next({ ...currentState, ...updates });
  }

  // ==================== ACTUALIZACIÓN DE PERFIL ====================

  /**
   * Actualiza el perfil del usuario
   */
  updateUserProfile(updates: Partial<UserProfile>): Observable<UserProfile> {
    const currentProfile = this.getCurrentProfile() as UserProfile;
    if (!currentProfile) {
      return throwError(() => new Error('No hay usuario autenticado'));
    }

    return from(this.supabase
      .from('users')
      .update(updates)
      .eq('id', currentProfile.id)
      .select()
      .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        
        const updatedProfile = response.data as UserProfile;
        
        // Actualizar localStorage y estado
        this.storeAuth(updatedProfile.email, updatedProfile, 'user');
        this.updateAuthState({ profile: updatedProfile });
        
        return updatedProfile;
      })
    );
  }

  /**
   * Actualiza el perfil del administrador
   */
  updateAdminProfile(updates: Partial<AdminProfile>): Observable<AdminProfile> {
    const currentProfile = this.getCurrentProfile() as AdminProfile;
    if (!currentProfile) {
      return throwError(() => new Error('No hay administrador autenticado'));
    }

    return from(this.supabase
      .from('admins')
      .update(updates)
      .eq('id', currentProfile.id)
      .select()
      .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        
        const updatedProfile = response.data as AdminProfile;
        
        // Actualizar localStorage y estado
        this.storeAuth(updatedProfile.email, updatedProfile, 'admin');
        this.updateAuthState({ profile: updatedProfile });
        
        return updatedProfile;
      })
    );
  }
}