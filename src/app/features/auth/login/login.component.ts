// src/app/features/auth/login/login.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  isLoading = false;
  activeTab = 0; // 0 = Usuario, 1 = Admin
  private destroy$ = new Subject<void>();

  // Mensajes de loading específicos
  loadingMessages = {
    user: 'Conectando al juego...',
    admin: 'Accediendo al panel...'
  };

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private messageService: MessageService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.initForm();
    this.checkExistingSession();
    this.setupDemoValues();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  setupDemoValues() {
    // Valores por defecto para desarrollo (remover en producción)
    if (!environment.production) {
      this.loginForm.patchValue({
        email: 'demo@ecobarometro.com',
        password: 'demo123'
      });
    }
  }

  checkExistingSession() {
    // Si ya está autenticado, redirigir
    this.authService.authState
      .pipe(takeUntil(this.destroy$))
      .subscribe(authState => {
        if (authState.isAuthenticated) {
          this.redirectBasedOnRole(authState.userType!);
        }
      });
  }

  async onLogin() {
    if (!this.loginForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    
    try {
      const formData = this.loginForm.value;
      const credentials = {
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe
      };

      const result = await this.authService.login(credentials);
      console.log("result del login:", result);
      

      if (result.success && result.data) {
        // Mostrar mensaje de éxito
        this.messageService.add({
          severity: 'success',
          summary: result.message,
          detail: result.data.role === 'admin' 
            ? 'Acceso concedido al panel de administración' 
            : 'Listo para jugar EcoBarómetro',
          life: 4000
        });

        // Breve delay para mostrar el mensaje antes de redirigir
        setTimeout(() => {
          this.redirectBasedOnRole(result.data.role);
        }, 1500);

      } else {
        // Mostrar error
        this.messageService.add({
          severity: 'error',
          summary: 'Error de Acceso',
          detail: result.error || 'Credenciales incorrectas',
          life: 5000
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error de Conexión',
        detail: 'No se pudo conectar al servidor. Intenta nuevamente.',
        life: 5000
      });
    } finally {
      this.isLoading = false;
    }
  }

  private redirectBasedOnRole(role: 'admin' | 'user') {
    if (role === 'admin') {
      this.router.navigate(['/admin/dashboard']);
    } else {
      this.router.navigate(['/user/dashboard']);
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });

    this.messageService.add({
      severity: 'warn',
      summary: 'Formulario Incompleto',
      detail: 'Por favor completa todos los campos requeridos',
      life: 3000
    });
  }

  navigateToRegister() {
    this.router.navigate(['/auth/register']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) {
        const labels: { [key: string]: string } = {
          email: 'El email',
          password: 'La contraseña'
        };
        return `${labels[fieldName] || fieldName} es requerido`;
      }
      if (field.errors['email']) return 'El formato del email no es válido';
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    }
    return '';
  }

  // Método para cambio de pestañas (aunque ambas usan el mismo formulario)
  onTabChange(event: any) {
    this.activeTab = event.index;
  }

  // Método para recuperar contraseña (implementar más tarde)
  onForgotPassword() {
    const email = this.loginForm.get('email')?.value;
    
    if (!email) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Email Requerido',
        detail: 'Por favor ingresa tu email para recuperar la contraseña',
        life: 3000
      });
      return;
    }

    // TODO: Implementar recuperación de contraseña
    this.messageService.add({
      severity: 'info',
      summary: 'Función Pendiente',
      detail: 'La recuperación de contraseña estará disponible pronto',
      life: 3000
    });
  }

  // Login rápido para desarrollo (remover en producción)
  quickLogin(type: 'admin' | 'user') {
    if (environment.production) return;

    const credentials = {
      admin: {
        email: 'admin@ecobarometro.com',
        password: 'admin123'
      },
      user: {
        email: 'user@ecobarometro.com',
        password: 'user123'
      }
    };

    this.loginForm.patchValue(credentials[type]);
    this.activeTab = type === 'admin' ? 1 : 0;
  }

  // Métodos para probar con datos demo
  fillDemoUser() {
    this.loginForm.patchValue({
      email: 'usuario@demo.com',
      password: 'demo123'
    });
    this.activeTab = 0;
  }

  fillDemoAdmin() {
    this.loginForm.patchValue({
      email: 'admin@demo.com',
      password: 'admin123'
    });
    this.activeTab = 1;
  }

  // Getters para el template
  get isUserLogin() {
    return this.activeTab === 0;
  }

  get isAdminLogin() {
    return this.activeTab === 1;
  }

  get currentLoadingMessage() {
    return this.isUserLogin ? this.loadingMessages.user : this.loadingMessages.admin;
  }

  get submitButtonText() {
    if (this.isLoading) {
      return this.currentLoadingMessage;
    }
    return this.isUserLogin ? '🎮 Empezar a Jugar' : '⚙️ Acceder al Panel';
  }

  get formTitle() {
    return this.isUserLogin ? 'Acceso de Jugador' : 'Panel de Administración';
  }

  get formSubtitle() {
    return this.isUserLogin 
      ? 'Inicia sesión para jugar EcoBarómetro' 
      : 'Gestiona preguntas y usuarios';
  }

  // Animaciones CSS personalizadas
  getSubmitButtonClasses() {
    const baseClasses = 'w-full eco-button py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300';
    
    if (this.isLoading) {
      return `${baseClasses} opacity-80 cursor-not-allowed`;
    }
    
    if (!this.loginForm.valid) {
      return `${baseClasses} opacity-50 cursor-not-allowed`;
    }
    
    return `${baseClasses} hover:scale-105 active:scale-95`;
  }

  // Verificar estado de autenticación para debugging
  checkAuthState() {
    if (!environment.production) {
      this.authService.authState.subscribe(state => {
        console.log('Current Auth State:', state);
      });
    }
  }

  // Método para limpiar sesión en caso de problemas
  clearSession() {
    if (!environment.production) {
      localStorage.clear();
      this.messageService.add({
        severity: 'info',
        summary: 'Sesión Limpiada',
        detail: 'Datos de sesión eliminados para debugging',
        life: 3000
      });
    }
  }
}