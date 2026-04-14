import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { MessagesModule } from 'primeng/messages';

// Services
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';

// Models

export interface CreateAdminRequest {
  name: string;
  email: string;
  password: string;
  company: string | null;
}


@Component({
  selector: 'app-admin-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    InputTextareaModule,
    CheckboxModule,
    ToastModule,
    ProgressSpinnerModule,
    DividerModule,
    MessageModule,
    MessagesModule
  ],
  template: `
    <div class="admin-register">
      <div class="register-container">
        <!-- Header -->
        <div class="text-center mb-4">
          <div class="text-6xl mb-3"><i class="pi pi-leaf" style="color:#22c55e"></i></div>
          <h1 class="text-4xl font-bold text-900 mb-2">EcoBarómetro</h1>
          <p class="text-600 text-lg">Crea tu cuenta de administrador</p>
        </div>

        <!-- Registration Form -->
        <p-card styleClass="register-card">
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <div class="grid">
              <!-- Name -->
              <div class="col-12">
                <label for="name" class="block text-900 font-medium mb-2">
                  Nombre Completo *
                </label>
                <input 
                  id="name"
                  type="text" 
                  pInputText 
                  formControlName="name"
                  class="w-full"
                  placeholder="Tu nombre completo"
                  [class.ng-invalid]="isFieldInvalid('name')"
                />
                <small 
                  *ngIf="isFieldInvalid('name')"
                  class="p-error block mt-1"
                >
                  El nombre es requerido (mínimo 2 caracteres)
                </small>
              </div>

              <!-- Email -->
              <div class="col-12">
                <label for="email" class="block text-900 font-medium mb-2">
                  Correo Electrónico *
                </label>
                <input 
                  id="email"
                  type="email" 
                  pInputText 
                  formControlName="email"
                  class="w-full"
                  placeholder="tu@empresa.com"
                  [class.ng-invalid]="isFieldInvalid('email')"
                />
                <small 
                  *ngIf="isFieldInvalid('email')"
                  class="p-error block mt-1"
                >
                  <span *ngIf="registerForm.get('email')?.errors?.['required']">
                    El correo electrónico es requerido
                  </span>
                  <span *ngIf="registerForm.get('email')?.errors?.['email']">
                    Ingresa un correo electrónico válido
                  </span>
                </small>
              </div>

              <!-- Company -->
              <div class="col-12">
                <label for="company" class="block text-900 font-medium mb-2">
                  Empresa/Organización
                </label>
                <input 
                  id="company"
                  type="text" 
                  pInputText 
                  formControlName="company"
                  class="w-full"
                  placeholder="Nombre de tu empresa u organización"
                />
                <small class="text-500">Opcional - te ayudará a identificar tu cuenta</small>
              </div>

              <!-- Password -->
              <div class="col-12 md:col-6">
                <label for="password" class="block text-900 font-medium mb-2">
                  Contraseña *
                </label>
                <p-password 
                  id="password"
                  formControlName="password"
                  [toggleMask]="true"
                  [feedback]="true"
                  placeholder="Crear contraseña"
                  styleClass="w-full"
                  [inputStyleClass]="'w-full'"
                  [class.ng-invalid]="isFieldInvalid('password')"
                >
                  <ng-template pTemplate="header">
                    <h6>Elige una contraseña</h6>
                  </ng-template>
                  <ng-template pTemplate="content">
                    <div class="password-requirements">
                      <p class="mt-2">Sugerencias:</p>
                      <ul class="pl-2 ml-2 mt-0" style="line-height: 1.5;">
                        <li>Al menos 8 caracteres</li>
                        <li>Al menos una letra minúscula</li>
                        <li>Al menos una letra mayúscula</li>
                        <li>Al menos un número</li>
                      </ul>
                    </div>
                  </ng-template>
                </p-password>
                <small 
                  *ngIf="isFieldInvalid('password')"
                  class="p-error block mt-1"
                >
                  La contraseña debe tener al menos 8 caracteres
                </small>
              </div>

              <!-- Confirm Password -->
              <div class="col-12 md:col-6">
                <label for="confirmPassword" class="block text-900 font-medium mb-2">
                  Confirmar Contraseña *
                </label>
                <p-password 
                  id="confirmPassword"
                  formControlName="confirmPassword"
                  [toggleMask]="true"
                  [feedback]="false"
                  placeholder="Confirma tu contraseña"
                  styleClass="w-full"
                  [inputStyleClass]="'w-full'"
                  [class.ng-invalid]="isFieldInvalid('confirmPassword')"
                />
                <small 
                  *ngIf="isFieldInvalid('confirmPassword')"
                  class="p-error block mt-1"
                >
                  <span *ngIf="registerForm.get('confirmPassword')?.errors?.['required']">
                    Confirma tu contraseña
                  </span>
                  <span *ngIf="registerForm.get('confirmPassword')?.errors?.['passwordMismatch']">
                    Las contraseñas no coinciden
                  </span>
                </small>
              </div>

              <!-- Terms and Conditions -->
              <div class="col-12">
                <div class="flex align-items-center">
                  <p-checkbox 
                    formControlName="acceptTerms"
                    [binary]="true"
                    inputId="terms"
                    [class.ng-invalid]="isFieldInvalid('acceptTerms')"
                  />
                  <label for="terms" class="ml-2">
                    Acepto los 
                    <a class="text-primary-500 cursor-pointer" (click)="showTerms()">
                      términos y condiciones
                    </a> 
                    y la 
                    <a class="text-primary-500 cursor-pointer" (click)="showPrivacy()">
                      política de privacidad
                    </a>
                  </label>
                </div>
                <small 
                  *ngIf="isFieldInvalid('acceptTerms')"
                  class="p-error block mt-1"
                >
                  Debes aceptar los términos y condiciones
                </small>
              </div>

              <!-- Newsletter -->
              <div class="col-12">
                <div class="flex align-items-center">
                  <p-checkbox 
                    formControlName="newsletter"
                    [binary]="true"
                    inputId="newsletter"
                  />
                  <label for="newsletter" class="ml-2 text-600">
                    Quiero recibir actualizaciones y consejos sobre sostenibilidad
                  </label>
                </div>
              </div>
            </div>

            <!-- Admin Code Info -->
            <div class="mt-4 p-3 bg-blue-50 border-round border-left-3 border-blue-500">
              <div class="flex align-items-start gap-2">
                <i class="pi pi-info-circle text-blue-500 mt-1"></i>
                <div>
                  <h4 class="m-0 text-blue-700 mb-1">Tu Código de Administrador</h4>
                  <p class="m-0 text-blue-600 text-sm">
                    Al crear tu cuenta, se generará un código único que podrás compartir 
                    con tus usuarios para que se registren en tu EcoBarómetro.
                  </p>
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="mt-4">
              <p-button 
                label="Crear Cuenta" 
                icon="pi pi-user-plus"
                type="submit"
                [loading]="loading"
                [disabled]="registerForm.invalid"
                styleClass="w-full p-3 text-xl"
                size="large"
              />
            </div>
          </form>

          <!-- Divider -->
          <p-divider align="center" styleClass="my-4">
            <span class="text-600">o</span>
          </p-divider>

          <!-- Login Link -->
          <div class="text-center">
            <span class="text-600">¿Ya tienes una cuenta? </span>
            <a 
              [routerLink]="['/auth/admin-login']" 
              class="text-primary-500 cursor-pointer font-medium no-underline hover:underline"
            >
              Iniciar Sesión
            </a>
          </div>
        </p-card>

        <!-- Features Preview -->
        <div class="mt-6">
          <h3 class="text-center text-xl font-semibold text-900 mb-4">
            ¿Qué puedes hacer con EcoBarómetro?
          </h3>
          <div class="grid">
            <div class="col-12 md:col-4 text-center">
              <div class="p-3">
                <i class="pi pi-question-circle text-blue-500 text-4xl mb-3"></i>
                <h4 class="text-900 mb-2">Crear Preguntas</h4>
                <p class="text-600 text-sm">
                  Diseña cuestionarios personalizados sobre sostenibilidad
                </p>
              </div>
            </div>
            <div class="col-12 md:col-4 text-center">
              <div class="p-3">
                <i class="pi pi-chart-bar text-green-500 text-4xl mb-3"></i>
                <h4 class="text-900 mb-2">Analizar Resultados</h4>
                <p class="text-600 text-sm">
                  Obtén métricas detalladas del nivel de conciencia ambiental
                </p>
              </div>
            </div>
            <div class="col-12 md:col-4 text-center">
              <div class="p-3">
                <i class="pi pi-users text-purple-500 text-4xl mb-3"></i>
                <h4 class="text-900 mb-2">Gestionar Usuarios</h4>
                <p class="text-600 text-sm">
                  Administra tu comunidad y ve su progreso en tiempo real
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast for notifications -->
    <p-toast />
  `,
  styles: [`
    .admin-register {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
    }

    .register-container {
      width: 100%;
      max-width: 800px;
    }

    .register-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .password-requirements ul {
      font-size: 0.875rem;
    }

    .text-primary-500 {
      color: #3b82f6;
    }

    .text-primary-500:hover {
      color: #2563eb;
    }

    .border-left-3 {
      border-left-width: 3px !important;
    }

    .border-blue-500 {
      border-color: #3b82f6 !important;
    }

    .bg-blue-50 {
      background-color: #eff6ff !important;
    }

    .text-blue-700 {
      color: #1d4ed8 !important;
    }

    .text-blue-600 {
      color: #2563eb !important;
    }

    .text-blue-500 {
      color: #3b82f6 !important;
    }

    @media (max-width: 768px) {
      .admin-register {
        padding: 1rem;
      }
      
      .register-container {
        max-width: 100%;
      }
    }
  `]
})
export class AdminRegisterComponent implements OnInit {
  registerForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private messageService: MessageService,
    private router: Router
  ) {
    this.registerForm = this.createForm();
  }

  ngOnInit(): void {
    // Verificar si ya está autenticado
    if (this.authService.isAuthenticated() && this.authService.isAdmin()) {
      this.router.navigate(['/admin/dashboard']);
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      company: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]],
      newsletter: [true]
    }, {
      validators: [this.passwordMatchValidator]
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.hasError('passwordMismatch')) {
      delete confirmPassword.errors!['passwordMismatch'];
      if (Object.keys(confirmPassword.errors!).length === 0) {
        confirmPassword.setErrors(null);
      }
    }
    
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.registerForm.value;

    const adminData: CreateAdminRequest = {
      name: formValue.name,
      email: formValue.email,
      password: formValue.password,
      company: formValue.company || null
    };

    this.authService.registerAdmin(adminData).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: '¡Cuenta Creada!',
          detail: `Tu código de administrador es: ${response.admin_code}`,
          life: 10000
        });

        // Mostrar información adicional sobre el código
        setTimeout(() => {
          this.messageService.add({
            severity: 'info',
            summary: 'Código de Administrador',
            detail: 'Comparte este código con tus usuarios para que puedan registrarse en tu EcoBarómetro',
            life: 8000
          });
        }, 2000);

        // Redirigir al dashboard después de un momento
        setTimeout(() => {
          this.router.navigate(['/admin/dashboard']);
        }, 3000);

        this.loading = false;
      },
      error: (error) => {
        console.error('Error registering admin:', error);
        
        let errorMessage = 'Ocurrió un error al crear la cuenta';
        
        if (error.message?.includes('email')) {
          errorMessage = 'Este correo electrónico ya está registrado';
        } else if (error.message?.includes('password')) {
          errorMessage = 'La contraseña no cumple con los requisitos';
        }

        this.messageService.add({
          severity: 'error',
          summary: 'Error al Registrar',
          detail: errorMessage
        });
        
        this.loading = false;
      }
    });
  }

  markAllFieldsAsTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  showTerms(): void {
    // Implementar modal o navegación a términos y condiciones
    this.messageService.add({
      severity: 'info',
      summary: 'Términos y Condiciones',
      detail: 'Los términos y condiciones se abrirán en una nueva ventana',
      life: 3000
    });
  }

  showPrivacy(): void {
    // Implementar modal o navegación a política de privacidad
    this.messageService.add({
      severity: 'info',
      summary: 'Política de Privacidad',
      detail: 'La política de privacidad se abrirá en una nueva ventana',
      life: 3000
    });
  }
}