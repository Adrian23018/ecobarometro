// src/app/features/admin/settings/settings.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { TabViewModule } from 'primeng/tabview';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { PasswordModule } from 'primeng/password';
import { ColorPickerModule } from 'primeng/colorpicker';
import { SliderModule } from 'primeng/slider';
import { FileUploadModule } from 'primeng/fileupload';

// Services
import { AuthService } from '../../../core/services/auth.service';
import { Admin } from '../../../core/models/admin';

interface AppSettings {
  app_name: string;
  app_description: string;
  app_logo_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  max_users_per_admin: number;
  default_game_duration: number;
  points_per_correct_answer: number;
  points_per_game_completion: number;
  level_up_threshold: number;
  enable_achievements: boolean;
  enable_leaderboard: boolean;
  enable_notifications: boolean;
  auto_save_progress: boolean;
  session_timeout: number;
  max_attempts_per_question: number;
  show_correct_answers: boolean;
  allow_question_skip: boolean;
}

interface GameSettings {
  default_question_count: number;
  default_time_limit: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  immediate_feedback: boolean;
  show_progress: boolean;
  pause_allowed: boolean;
  retry_allowed: boolean;
  hint_system_enabled: boolean;
  penalty_for_wrong_answer: number;
  bonus_for_fast_answer: number;
  streak_multiplier: number;
}

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  achievement_notifications: boolean;
  level_up_notifications: boolean;
  daily_reminder: boolean;
  weekly_summary: boolean;
  maintenance_alerts: boolean;
  new_user_alerts: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    InputTextareaModule,
    InputNumberModule,
    DropdownModule,
    CheckboxModule,
    TabViewModule,
    ToastModule,
    ConfirmDialogModule,
    DividerModule,
    TooltipModule,
    PasswordModule,
    ColorPickerModule,
    SliderModule,
    FileUploadModule
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  currentAdmin: any | null = null;

  // Forms
  profileForm!: FormGroup;
  appSettingsForm!: FormGroup;
  gameSettingsForm!: FormGroup;
  notificationForm!: FormGroup;

  // Loading states
  isLoadingProfile = false;
  isLoadingAppSettings = false;
  isLoadingGameSettings = false;
  isLoadingNotifications = false;

  // Tab management
  activeTab = 0;

  // Default settings
  defaultAppSettings: AppSettings = {
    app_name: 'EcoBarómetro',
    app_description: 'Plataforma educativa de conciencia ambiental',
    app_logo_url: '',
    primary_color: '#3b82f6',
    secondary_color: '#64748b',
    accent_color: '#10b981',
    max_users_per_admin: 1000,
    default_game_duration: 300, // 5 minutes
    points_per_correct_answer: 10,
    points_per_game_completion: 50,
    level_up_threshold: 100,
    enable_achievements: true,
    enable_leaderboard: true,
    enable_notifications: true,
    auto_save_progress: true,
    session_timeout: 3600, // 1 hour
    max_attempts_per_question: 3,
    show_correct_answers: true,
    allow_question_skip: false
  };

  defaultGameSettings: GameSettings = {
    default_question_count: 10,
    default_time_limit: 30,
    shuffle_questions: true,
    shuffle_options: true,
    immediate_feedback: true,
    show_progress: true,
    pause_allowed: true,
    retry_allowed: true,
    hint_system_enabled: true,
    penalty_for_wrong_answer: 0,
    bonus_for_fast_answer: 5,
    streak_multiplier: 1.5
  };

  defaultNotificationSettings: NotificationSettings = {
    email_notifications: true,
    push_notifications: false,
    achievement_notifications: true,
    level_up_notifications: true,
    daily_reminder: false,
    weekly_summary: true,
    maintenance_alerts: true,
    new_user_alerts: true
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.currentAdmin = this.authService.getCurrentAdmin();
    this.loadSettings();
  }

  private initializeForms(): void {
    // Profile Form
    this.profileForm = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      organization: [''],
      bio: [''],
      current_password: [''],
      new_password: [''],
      confirm_password: ['']
    });

    // App Settings Form
    this.appSettingsForm = this.fb.group({
      app_name: [this.defaultAppSettings.app_name, Validators.required],
      app_description: [this.defaultAppSettings.app_description],
      primary_color: [this.defaultAppSettings.primary_color],
      secondary_color: [this.defaultAppSettings.secondary_color],
      accent_color: [this.defaultAppSettings.accent_color],
      max_users_per_admin: [this.defaultAppSettings.max_users_per_admin, [Validators.min(1)]],
      points_per_correct_answer: [this.defaultAppSettings.points_per_correct_answer, [Validators.min(1)]],
      points_per_game_completion: [this.defaultAppSettings.points_per_game_completion, [Validators.min(1)]],
      level_up_threshold: [this.defaultAppSettings.level_up_threshold, [Validators.min(1)]],
      enable_achievements: [this.defaultAppSettings.enable_achievements],
      enable_leaderboard: [this.defaultAppSettings.enable_leaderboard],
      enable_notifications: [this.defaultAppSettings.enable_notifications],
      auto_save_progress: [this.defaultAppSettings.auto_save_progress],
      session_timeout: [this.defaultAppSettings.session_timeout, [Validators.min(300)]],
      show_correct_answers: [this.defaultAppSettings.show_correct_answers],
      allow_question_skip: [this.defaultAppSettings.allow_question_skip]
    });

    // Game Settings Form
    this.gameSettingsForm = this.fb.group({
      default_question_count: [this.defaultGameSettings.default_question_count, [Validators.min(1), Validators.max(50)]],
      default_time_limit: [this.defaultGameSettings.default_time_limit, [Validators.min(10), Validators.max(300)]],
      shuffle_questions: [this.defaultGameSettings.shuffle_questions],
      shuffle_options: [this.defaultGameSettings.shuffle_options],
      immediate_feedback: [this.defaultGameSettings.immediate_feedback],
      show_progress: [this.defaultGameSettings.show_progress],
      pause_allowed: [this.defaultGameSettings.pause_allowed],
      retry_allowed: [this.defaultGameSettings.retry_allowed],
      hint_system_enabled: [this.defaultGameSettings.hint_system_enabled],
      penalty_for_wrong_answer: [this.defaultGameSettings.penalty_for_wrong_answer, [Validators.min(0)]],
      bonus_for_fast_answer: [this.defaultGameSettings.bonus_for_fast_answer, [Validators.min(0)]],
      streak_multiplier: [this.defaultGameSettings.streak_multiplier, [Validators.min(1), Validators.max(5)]]
    });

    // Notification Form
    this.notificationForm = this.fb.group({
      email_notifications: [this.defaultNotificationSettings.email_notifications],
      push_notifications: [this.defaultNotificationSettings.push_notifications],
      achievement_notifications: [this.defaultNotificationSettings.achievement_notifications],
      level_up_notifications: [this.defaultNotificationSettings.level_up_notifications],
      daily_reminder: [this.defaultNotificationSettings.daily_reminder],
      weekly_summary: [this.defaultNotificationSettings.weekly_summary],
      maintenance_alerts: [this.defaultNotificationSettings.maintenance_alerts],
      new_user_alerts: [this.defaultNotificationSettings.new_user_alerts]
    });
  }

  private loadSettings(): void {
    if (!this.currentAdmin) return;

    // Load profile data
    this.profileForm.patchValue({
      full_name: this.currentAdmin.full_name,
      email: this.currentAdmin.email,
      phone: this.currentAdmin.phone || '',
      organization: this.currentAdmin.organization || '',
      bio: this.currentAdmin.bio || ''
    });
  }

  onProfileSubmit(): void {
    if (!this.profileForm.valid || !this.currentAdmin) return;

    this.isLoadingProfile = true;
    const formData = this.profileForm.value;

    // Simulate API call
    setTimeout(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Perfil actualizado correctamente'
      });
      this.isLoadingProfile = false;
    }, 1000);
  }

  onAppSettingsSubmit(): void {
    if (!this.appSettingsForm.valid) return;

    this.isLoadingAppSettings = true;
    const formData = this.appSettingsForm.value;

    // Simulate API call
    setTimeout(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Configuración de aplicación actualizada'
      });
      this.isLoadingAppSettings = false;
    }, 1000);
  }

  onGameSettingsSubmit(): void {
    if (!this.gameSettingsForm.valid) return;

    this.isLoadingGameSettings = true;
    const formData = this.gameSettingsForm.value;

    // Simulate API call
    setTimeout(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Configuración de juego actualizada'
      });
      this.isLoadingGameSettings = false;
    }, 1000);
  }

  onNotificationSubmit(): void {
    if (!this.notificationForm.valid) return;

    this.isLoadingNotifications = true;
    const formData = this.notificationForm.value;

    // Simulate API call
    setTimeout(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Configuración de notificaciones actualizada'
      });
      this.isLoadingNotifications = false;
    }, 1000);
  }

  resetToDefaults(section: string): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de restaurar la configuración por defecto? Se perderán todos los cambios.',
      header: 'Restaurar Configuración',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, restaurar',
      rejectLabel: 'Cancelar',
      accept: () => {
        switch (section) {
          case 'app':
            this.appSettingsForm.patchValue(this.defaultAppSettings);
            break;
          case 'game':
            this.gameSettingsForm.patchValue(this.defaultGameSettings);
            break;
          case 'notifications':
            this.notificationForm.patchValue(this.defaultNotificationSettings);
            break;
        }

        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Configuración restaurada por defecto'
        });
      }
    });
  }

  exportSettings(): void {
    const settings = {
      app: this.appSettingsForm.value,
      game: this.gameSettingsForm.value,
      notifications: this.notificationForm.value,
      exported_at: new Date().toISOString(),
      admin_id: this.currentAdmin?.id
    };

    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ecobarometro-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: 'Configuración exportada correctamente'
    });
  }

  onUpload(event: any): void {
    const file = event.files[0];

    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: `${file.name} subido correctamente`
    });
  }

  getAdminInitials(): string {
    if (!this.currentAdmin) return 'A';
    return this.currentAdmin.full_name
      .split(' ')
      .map((n:any) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  generateNewAdminCode(): void {
    this.confirmationService.confirm({
      message: '¿Estás seguro de generar un nuevo código de administrador? El código actual se invalidará.',
      header: 'Generar Nuevo Código',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, generar',
      rejectLabel: 'Cancelar',
      accept: () => {
        // Simulate code generation
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: `Nuevo código generado: ${newCode}`
        });
      }
    });
  }

  goBack(): void {
    window.history.back();
  }
}