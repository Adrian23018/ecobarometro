// src/app/features/auth/register/register.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AuthService, CreateUserRequest, CreateAdminRequest } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit, OnDestroy {
  registerForm!: FormGroup;
  isLoading = false;
  activeTab = 0; // 0 = Usuario, 1 = Admin
  isAdminRoute = false;
  showPassword = false;
  showConfirmPassword = false;
  showAdminCodeValidation = false;
  adminCodeValidating = false;
  adminCodeValid = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.isAdminRoute = this.route.snapshot.data['isAdmin'] === true;
    this.initForm();
    if (this.isAdminRoute) {
      this.onTabChange({ index: 1 });
    }
    this.setupAdminCodeValidation();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm() {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), this.passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]],
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [Validators.minLength(3), this.usernameValidator]],
      adminCode: [''],
      company: [''],
      terms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });

    this.updateValidators();
  }

  setupAdminCodeValidation() {
    // Validación en tiempo real del código de admin
    this.registerForm.get('adminCode')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(async (code) => {
      if (code && code.length >= 4 && this.activeTab === 0) { // Cambié de 6 a 4 caracteres
        this.adminCodeValidating = true;
        console.log('Validando código en componente:', code); // Debug
        this.adminCodeValid = await this.authService.verifyAdminCode(code);
        this.adminCodeValidating = false;

        if (this.adminCodeValid) {
          this.messageService.add({
            severity: 'success',
            summary: 'Código Válido',
            detail: '✓ Código de administrador verificado',
            life: 3000
          });
        } else {
          console.log('Código inválido:', code); // Debug
        }
      } else {
        this.adminCodeValid = false;
      }
    });
  }

  passwordStrengthValidator(control: AbstractControl): {[key: string]: any} | null {
    const value = control.value;
    if (!value) return null;

    const hasNumber = /[0-9]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);

    const valid = hasNumber && (hasUpper || hasLower);
    if (!valid) {
      return { weakPassword: true };
    }
    return null;
  }

  usernameValidator(control: AbstractControl): {[key: string]: any} | null {
    const value = control.value;
    if (!value) return null;

    // Solo letras, números y guiones bajos
    const validPattern = /^[a-zA-Z0-9_]+$/.test(value);
    if (!validPattern) {
      return { invalidUsername: true };
    }
    return null;
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else if (confirmPassword?.hasError('passwordMismatch')) {
      confirmPassword.setErrors(null);
    }
    
    return null;
  }

  onTabChange(event: any) {
    this.activeTab = event.index;
    this.updateValidators();
    this.showAdminCodeValidation = false;
    this.adminCodeValid = false;

    // Limpiar campos específicos del tab anterior
    if (this.activeTab === 0) {
      this.registerForm.patchValue({ company: '' });
    } else {
      this.registerForm.patchValue({ 
        adminCode: '',
        username: ''
      });
    }
  }

  updateValidators() {
    const adminCodeControl = this.registerForm.get('adminCode');
    const companyControl = this.registerForm.get('company');
    const usernameControl = this.registerForm.get('username');
    
    if (this.activeTab === 0) { // Usuario
      adminCodeControl?.setValidators([Validators.required, Validators.minLength(6)]);
      usernameControl?.setValidators([Validators.required, Validators.minLength(3), this.usernameValidator]);
      companyControl?.clearValidators();
    } else { // Admin
      adminCodeControl?.clearValidators();
      usernameControl?.clearValidators();
      companyControl?.setValidators([Validators.required]);
    }
    
    adminCodeControl?.updateValueAndValidity();
    companyControl?.updateValueAndValidity();
    usernameControl?.updateValueAndValidity();
  }

  async onRegister() {
    if (!this.registerForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    // Validación específica para usuarios con código de admin
    if (this.activeTab === 0 && !this.adminCodeValid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Código Inválido',
        detail: 'El código de administrador no es válido',
        life: 5000
      });
      return;
    }

    this.isLoading = true;
    
    try {
      const formData = this.registerForm.value;
      let result;

      if (this.activeTab === 0) {
        // Registro de usuario
        const userData: CreateUserRequest = {
          email: formData.email,
          password: formData.password,
          username: formData.username,
          full_name: formData.fullName,
          admin_code: formData.adminCode
        };
        result = await this.authService.registerUser(userData);
      } else {
        // Registro de administrador
        const adminData: CreateAdminRequest = {
          email: formData.email,
          password: formData.password,
          name: formData.fullName,
          company: formData.company
        };
        result = await this.authService.registerAdmin(adminData);
      }

      if (result.success) {
        this.messageService.add({
          severity: 'success',
          summary: '¡Registro Exitoso!',
          detail: result.message,
          life: 8000
        });

        // Limpiar formulario
        this.registerForm.reset();
        this.activeTab = 0;

        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          this.router.navigate([this.isAdminRoute ? '/auth/login-admin' : '/auth/login']);
        }, 3000);
      } else {
        this.messageService.add({
          severity: 'error',
          summary: 'Error en el Registro',
          detail: result.error,
          life: 5000
        });
      }
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error Inesperado',
        detail: 'Ocurrió un error durante el registro. Intenta nuevamente.',
        life: 5000
      });
    } finally {
      this.isLoading = false;
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });

    // Mostrar mensaje de validación específico
    if (this.activeTab === 0 && this.registerForm.get('adminCode')?.invalid) {
      this.showAdminCodeValidation = true;
    }

    this.messageService.add({
      severity: 'warn',
      summary: 'Formulario Incompleto',
      detail: 'Por favor completa todos los campos requeridos correctamente',
      life: 4000
    });
  }

  navigateToLogin() {
    this.router.navigate([this.isAdminRoute ? '/auth/login-admin' : '/auth/login']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} es requerido`;
      if (field.errors['email']) return 'Email no válido';
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['weakPassword']) return 'Debe contener números y letras';
      if (field.errors['invalidUsername']) return 'Solo letras, números y guiones bajos';
      if (field.errors['passwordMismatch']) return 'Las contraseñas no coinciden';
      if (field.errors['requiredTrue']) return 'Debes aceptar los términos';
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      email: 'Email',
      password: 'Contraseña',
      confirmPassword: 'Confirmar contraseña',
      fullName: 'Nombre completo',
      username: 'Nombre de usuario',
      adminCode: 'Código de administrador',
      company: 'Empresa'
    };
    return labels[fieldName] || fieldName;
  }

  generateRandomUsername() {
    const adjectives = ['Eco', 'Verde', 'Natural', 'Bio', 'Limpio', 'Puro', 'Wise', 'Smart'];
    const nouns = ['Guerrero', 'Heroe', 'Defensor', 'Guardian', 'Luchador', 'Campeon', 'Master', 'Pro'];
    const random = Math.floor(Math.random() * 1000);
    
    const username = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${random}`;
    this.registerForm.patchValue({ username });
    
    // Revalidar el campo
    this.registerForm.get('username')?.updateValueAndValidity();
  }

  // Getters para el template
  get isUserRegistration() {
    return this.activeTab === 0;
  }

  get isAdminRegistration() {
    return this.activeTab === 1;
  }

  get passwordStrength() {
    const password = this.registerForm.get('password')?.value || '';
    const score = this.calculatePasswordStrength(password);
    
    if (score < 2) return { class: 'text-red-500', text: 'Débil' };
    if (score < 4) return { class: 'text-yellow-500', text: 'Media' };
    return { class: 'text-green-500', text: 'Fuerte' };
  }

  private calculatePasswordStrength(password: string): number {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }

  get adminCodeStatus() {
    const code = this.registerForm.get('adminCode')?.value;
    
    if (!code || code.length < 6) {
      return { show: false, valid: false, validating: false };
    }
    
    return {
      show: true,
      valid: this.adminCodeValid,
      validating: this.adminCodeValidating
    };
  }

  get canSubmit() {
    if (!this.registerForm.valid) return false;
    if (this.isLoading) return false;
    if (this.activeTab === 0 && !this.adminCodeValid) return false;
    return true;
  }
}