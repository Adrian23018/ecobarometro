import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment.development';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';

interface AdminSession {
  id: string;
  email: string;
  name: string;
  company: string;
  admin_code: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  password_hash?: string;
}

function passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
  const newPass = control.get('newPassword')?.value;
  const confirm = control.get('confirmPassword')?.value;
  if (newPass && confirm && newPass !== confirm) {
    return { mismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    AvatarModule,
    BadgeModule,
    DividerModule,
    PasswordModule,
    ToolbarModule,
    TagModule,
  ],
  providers: [MessageService],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  admin: AdminSession | null = null;
  infoForm!: FormGroup;
  passwordForm!: FormGroup;
  savingInfo = false;
  savingPassword = false;
  codeCopied = false;

  private supabase: SupabaseClient;

  constructor(private fb: FormBuilder, private messageService: MessageService) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  ngOnInit(): void {
    const raw = localStorage.getItem('ecobarometro_admin');
    if (raw) {
      this.admin = JSON.parse(raw);
    }

    this.infoForm = this.fb.group({
      name: [this.admin?.name || '', [Validators.required, Validators.minLength(2)]],
      company: [this.admin?.company || ''],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    }, { validators: passwordMatchValidator });
  }

  get avatarLabel(): string {
    return (this.admin?.name || 'A').charAt(0).toUpperCase();
  }

  get memberSince(): string {
    if (!this.admin?.created_at) return '—';
    return new Date(this.admin.created_at).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  copyCode(): void {
    if (!this.admin?.admin_code) return;
    navigator.clipboard.writeText(this.admin.admin_code).then(() => {
      this.codeCopied = true;
      setTimeout(() => (this.codeCopied = false), 2000);
    });
  }

  async saveInfo(): Promise<void> {
    if (this.infoForm.invalid || !this.admin) return;
    this.savingInfo = true;

    const { name, company } = this.infoForm.value;

    const { error } = await this.supabase
      .from('admins')
      .update({ name, company, updated_at: new Date().toISOString() })
      .eq('id', this.admin.id);

    if (error) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el perfil' });
    } else {
      this.admin = { ...this.admin, name, company };
      localStorage.setItem('ecobarometro_admin', JSON.stringify(this.admin));
      this.messageService.add({ severity: 'success', summary: 'Guardado', detail: 'Perfil actualizado correctamente' });
    }
    this.savingInfo = false;
  }

  async changePassword(): Promise<void> {
    if (this.passwordForm.invalid || !this.admin) return;
    this.savingPassword = true;

    const { currentPassword, newPassword } = this.passwordForm.value;

    // Verify current password
    const valid = await this.verifyPassword(currentPassword, this.admin.password_hash || '');
    if (!valid) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'La contraseña actual es incorrecta' });
      this.savingPassword = false;
      return;
    }

    const newHash = await this.hashPassword(newPassword);

    const { error } = await this.supabase
      .from('admins')
      .update({ password_hash: newHash, updated_at: new Date().toISOString() })
      .eq('id', this.admin.id);

    if (error) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar la contraseña' });
    } else {
      this.admin = { ...this.admin, password_hash: newHash };
      localStorage.setItem('ecobarometro_admin', JSON.stringify(this.admin));
      this.passwordForm.reset();
      this.messageService.add({ severity: 'success', summary: '¡Listo!', detail: 'Contraseña cambiada correctamente' });
    }
    this.savingPassword = false;
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = Math.random().toString(36).substring(2, 15);
    return btoa(password + salt) + '.' + salt;
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!hash) return false;
    if (!hash.includes('.')) {
      return btoa(password) === hash;
    }
    const [hashedPart, salt] = hash.split('.');
    return btoa(password + salt) === hashedPart;
  }
}
