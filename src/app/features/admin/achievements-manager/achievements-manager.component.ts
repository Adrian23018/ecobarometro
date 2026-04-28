import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG
import { DialogModule } from 'primeng/dialog';
import { SidebarModule } from 'primeng/sidebar';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment.development';

interface AchievementRow {
  id: string;
  admin_id: string;
  name: string;
  description: string;
  icon: string;
  badge_color: string;
  achievement_type: 'points' | 'games' | 'streak' | 'category';
  points_required: number;
  is_active: boolean;
  created_at: string;
}

@Component({
  selector: 'app-achievements-manager',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FormsModule,
    DialogModule,
    SidebarModule,
    InputTextModule,
    InputTextareaModule,
    InputNumberModule,
    DropdownModule,
    CheckboxModule,
    ColorPickerModule,
    ToastModule,
    ConfirmDialogModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './achievements-manager.component.html',
  styleUrls: ['./achievements-manager.component.css']
})
export class AchievementsManagerComponent implements OnInit {
  achievements: AchievementRow[] = [];
  filteredAchievements: AchievementRow[] = [];
  selectedAchievement: AchievementRow | null = null;

  achievementForm!: FormGroup;
  showDialog  = false;
  showFilters = false;
  isEditing   = false;
  loading     = false;
  saving      = false;

  // Filters
  globalFilter  = '';
  typeFilter:   string | null = null;
  statusFilter: string | null = null;

  private supabase: SupabaseClient;
  private adminId = '';

  typeOptions = [
    { label: 'Puntos',      value: 'points',   icon: 'pi pi-star' },
    { label: 'Juegos',      value: 'games',    icon: 'pi pi-play' },
    { label: 'Racha',       value: 'streak',   icon: 'pi pi-bolt' },
    { label: 'Categorías',  value: 'category', icon: 'pi pi-folder' },
  ];

  statusOptions = [
    { label: 'Activos',   value: 'active' },
    { label: 'Inactivos', value: 'inactive' },
  ];

  iconOptions = [
    { label: 'Trofeo',   value: 'pi pi-trophy' },
    { label: 'Estrella', value: 'pi pi-star' },
    { label: 'Objetivo', value: 'pi pi-flag' },
    { label: 'Rayo',     value: 'pi pi-bolt' },
    { label: 'Diamante', value: 'pi pi-diamond' },
    { label: 'Medalla',  value: 'pi pi-medal' },
    { label: 'Corazón',  value: 'pi pi-heart' },
    { label: 'Libro',    value: 'pi pi-book' },
    { label: 'Juego',    value: 'pi pi-play' },
    { label: 'Hoja',     value: 'pi pi-leaf' },
    { label: 'Globo',    value: 'pi pi-globe' },
    { label: 'Usuario',  value: 'pi pi-user' },
  ];

  achievementTemplates = [
    { name: 'Primer Paso',       description: 'Completa tu primer juego',    icon: 'pi pi-play',       badge_color: '#3b82f6', achievement_type: 'games',    points_required: 1    },
    { name: 'Jugador Constante', description: 'Completa 10 juegos',          icon: 'pi pi-star',       badge_color: '#f59e0b', achievement_type: 'games',    points_required: 10   },
    { name: 'Experto Eco',       description: 'Alcanza 1000 puntos',         icon: 'pi pi-trophy',     badge_color: '#22c55e', achievement_type: 'points',   points_required: 1000 },
    { name: 'Racha Inicial',     description: 'Mantén una racha de 5 días',  icon: 'pi pi-bolt',       badge_color: '#ef4444', achievement_type: 'streak',   points_required: 5    },
    { name: 'Maestro Eco',       description: 'Domina 3 categorías',         icon: 'pi pi-chart-line', badge_color: '#8b5cf6', achievement_type: 'category', points_required: 3    },
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    this.initForm();
  }

  ngOnInit(): void {
    const admin = this.authService.getCurrentAdmin();
    this.adminId = admin?.id || '';
    this.loadAchievements();
  }

  private initForm(): void {
    this.achievementForm = this.fb.group({
      name:             ['', [Validators.required, Validators.maxLength(100)]],
      description:      ['', [Validators.required, Validators.maxLength(300)]],
      icon:             ['pi pi-trophy', Validators.required],
      badge_color:      ['#22c55e'],
      achievement_type: ['points', Validators.required],
      points_required:  [100, [Validators.required, Validators.min(1)]],
      is_active:        [true],
    });
  }

  async loadAchievements(): Promise<void> {
    if (!this.adminId) return;
    this.loading = true;

    const { data, error } = await this.supabase
      .from('achievements')
      .select('*')
      .eq('admin_id', this.adminId)
      .order('created_at', { ascending: false });

    if (error) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los logros' });
    } else {
      this.achievements = data || [];
      this.applyFilters();
    }
    this.loading = false;
  }

  openDialog(achievement?: AchievementRow): void {
    this.isEditing = !!achievement;
    this.selectedAchievement = achievement || null;

    if (achievement) {
      this.achievementForm.patchValue({
        name:             achievement.name,
        description:      achievement.description,
        icon:             achievement.icon,
        badge_color:      achievement.badge_color || '#22c55e',
        achievement_type: achievement.achievement_type,
        points_required:  achievement.points_required,
        is_active:        achievement.is_active,
      });
    } else {
      this.achievementForm.reset({
        icon: 'pi pi-trophy', badge_color: '#22c55e',
        achievement_type: 'points', points_required: 100, is_active: true
      });
    }
    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
    this.selectedAchievement = null;
    this.achievementForm.reset();
  }

  async onSubmit(): Promise<void> {
    if (this.achievementForm.invalid) return;
    this.saving = true;

    const v = this.achievementForm.value;
    const payload = {
      name:             v.name,
      description:      v.description,
      icon:             v.icon,
      badge_color:      v.badge_color || '#22c55e',
      achievement_type: v.achievement_type,
      points_required:  v.points_required,
      is_active:        v.is_active ?? true,
    };

    if (this.isEditing && this.selectedAchievement) {
      const { error } = await this.supabase
        .from('achievements')
        .update(payload)
        .eq('id', this.selectedAchievement.id);

      if (error) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el logro' });
      } else {
        this.messageService.add({ severity: 'success', summary: '¡Actualizado!', detail: 'Logro actualizado correctamente' });
        await this.loadAchievements();
        this.closeDialog();
      }
    } else {
      const { error } = await this.supabase
        .from('achievements')
        .insert([{ ...payload, admin_id: this.adminId }]);

      if (error) {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo crear el logro' });
      } else {
        this.messageService.add({ severity: 'success', summary: '¡Creado!', detail: 'Logro creado y visible para los usuarios' });
        await this.loadAchievements();
        this.closeDialog();
      }
    }
    this.saving = false;
  }

  deleteAchievement(achievement: AchievementRow): void {
    this.confirmationService.confirm({
      message:     `¿Eliminar el logro "${achievement.name}"?`,
      header:      'Confirmar eliminación',
      icon:        'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: async () => {
        const { error } = await this.supabase
          .from('achievements')
          .delete()
          .eq('id', achievement.id);

        if (error) {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el logro' });
        } else {
          this.messageService.add({ severity: 'success', summary: '¡Eliminado!', detail: 'Logro eliminado' });
          await this.loadAchievements();
        }
      }
    });
  }

  async toggleStatus(achievement: AchievementRow): Promise<void> {
    const newStatus = !achievement.is_active;
    const { error } = await this.supabase
      .from('achievements')
      .update({ is_active: newStatus })
      .eq('id', achievement.id);

    if (error) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cambiar el estado' });
    } else {
      achievement.is_active = newStatus;
      this.applyFilters();
      this.messageService.add({ severity: 'success', summary: '¡Listo!', detail: `Logro ${newStatus ? 'activado' : 'desactivado'}` });
    }
  }

  useTemplate(t: any): void {
    this.achievementForm.patchValue({
      name: t.name, description: t.description,
      icon: t.icon, badge_color: t.badge_color,
      achievement_type: t.achievement_type,
      points_required:  t.points_required,
      is_active: true,
    });
  }

  applyFilters(): void {
    this.filteredAchievements = this.achievements.filter(a => {
      const matchSearch = !this.globalFilter ||
        a.name.toLowerCase().includes(this.globalFilter.toLowerCase()) ||
        a.description.toLowerCase().includes(this.globalFilter.toLowerCase());

      const matchType   = !this.typeFilter   || a.achievement_type === this.typeFilter;
      const matchStatus = !this.statusFilter ||
        (this.statusFilter === 'active'   &&  a.is_active) ||
        (this.statusFilter === 'inactive' && !a.is_active);

      return matchSearch && matchType && matchStatus;
    });
  }

  clearFilters(): void {
    this.typeFilter = null;
    this.statusFilter = null;
    this.applyFilters();
  }

  get activeCount(): number { return this.filteredAchievements.filter(a => a.is_active).length; }

  get hasActiveFilters(): boolean { return !!(this.typeFilter || this.statusFilter); }

  getTypeLabel(type: string): string {
    const m: any = { points: 'Puntos', games: 'Juegos', streak: 'Racha', category: 'Categorías' };
    return m[type] || type;
  }

  getTypeClass(type: string): string {
    const m: any = { points: 'points', games: 'games', streak: 'streak', category: 'category' };
    return m[type] || 'points';
  }

  goBack(): void { window.history.back(); }
}
