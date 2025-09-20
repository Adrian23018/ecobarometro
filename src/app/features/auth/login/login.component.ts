// src/app/features/auth/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
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
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  onLogin() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      
      const { email, password } = this.loginForm.value;
      const isAdmin = this.activeTab === 1;
      
      // Simulación de login - aquí conectarás tu AuthService
      setTimeout(() => {
        this.isLoading = false;
        
        if (isAdmin) {
          this.messageService.add({
            severity: 'success',
            summary: '¡Bienvenido Administrador!',
            detail: 'Acceso concedido al panel de administración'
          });
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.messageService.add({
            severity: 'success',
            summary: '¡Bienvenido Jugador!',
            detail: 'Listo para jugar EcoBarómetro'
          });
          this.router.navigate(['/user/dashboard']);
        }
      }, 2000);
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
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
      if (field.errors['required']) return `${fieldName} es requerido`;
      if (field.errors['email']) return 'Email no válido';
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    }
    return '';
  }
}