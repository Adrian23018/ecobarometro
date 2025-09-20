// src/app/features/auth/register/register.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  activeTab = 0; // 0 = Usuario, 1 = Admin

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit() {
    this.initForm();
  }

  initForm() {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      adminCode: ['', this.activeTab === 0 ? [Validators.required] : []],
      company: ['', this.activeTab === 1 ? [Validators.required] : []],
      terms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
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
  }

  updateValidators() {
    const adminCodeControl = this.registerForm.get('adminCode');
    const companyControl = this.registerForm.get('company');
    
    if (this.activeTab === 0) { // Usuario
      adminCodeControl?.setValidators([Validators.required]);
      companyControl?.clearValidators();
    } else { // Admin
      adminCodeControl?.clearValidators();
      companyControl?.setValidators([Validators.required]);
    }
    
    adminCodeControl?.updateValueAndValidity();
    companyControl?.updateValueAndValidity();
  }

  onRegister() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      
      const formData = this.registerForm.value;
      const isAdmin = this.activeTab === 1;
      
      // Simulación de registro
      setTimeout(() => {
        this.isLoading = false;
        
        this.messageService.add({
          severity: 'success',
          summary: '¡Registro Exitoso!',
          detail: `Bienvenido ${formData.fullName}. ${isAdmin ? 'Tu código de administrador es: ECO123' : 'Ya puedes empezar a jugar'}`
        });
        
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      }, 2000);
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  navigateToLogin() {
    this.router.navigate(['/auth/login']);
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
    const adjectives = ['Eco', 'Verde', 'Natural', 'Bio', 'Limpio', 'Puro'];
    const nouns = ['Guerrero', 'Heroe', 'Defensor', 'Guardian', 'Luchador', 'Campeon'];
    const random = Math.floor(Math.random() * 1000);
    
    const username = `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${random}`;
    this.registerForm.patchValue({ username });
  }
}