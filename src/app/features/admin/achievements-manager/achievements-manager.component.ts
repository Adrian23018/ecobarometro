// src/app/features/admin/achievements-manager/achievements-manager.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { AvatarModule } from 'primeng/avatar';
import { ChipModule } from 'primeng/chip';

// Services and Models
import { AuthService } from '../../../core/services/auth.service';
import { DividerModule } from 'primeng/divider';

interface Achievement {
  id: any;
  admin_id: string;
  title: string;
  description: string;
  icon: string;
  category: 'points' | 'games' | 'streak' | 'level' | 'time' | 'special';
  type: 'milestone' | 'streak' | 'collection' | 'challenge';
  requirements: {
    target_value: number;
    condition: 'reach' | 'exceed' | 'maintain' | 'complete';
    metric: string;
  };
  reward_points: number;
  is_active: boolean;
  is_hidden: boolean;
  unlock_date?: Date;
  created_at: string;
  updated_at: string;
}

interface AchievementTemplate {
  title: string;
  description: string;
  icon: string;
  category: string;
  type: string;
  requirements: any;
  reward_points: number;
}

@Component({
  selector: 'app-achievements-manager',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    InputTextareaModule,
    InputNumberModule,
    DropdownModule,
    CheckboxModule,
    TagModule,
    BadgeModule,
    ProgressBarModule,
    ToastModule,
    ConfirmDialogModule,
    ToolbarModule,
    TooltipModule,
    AvatarModule,
    ChipModule,
    FormsModule,
    DividerModule
  ],
  templateUrl: './achievements-manager.component.html',
  styleUrls: ['./achievements-manager.component.css']
})
export class AchievementsManagerComponent implements OnInit {
  achievements: Achievement[] = [];
  filteredAchievements: Achievement[] = [];
  selectedAchievements: Achievement[] = [];
  selectedAchievement: Achievement | null = null;

  // Form and Dialog state
  achievementForm!: FormGroup;
  showDialog = false;
  isEditing = false;
  loading = false;

  // Filters
  globalFilter = '';
  categoryFilter: string | null = null;
  typeFilter: string | null = null;
  statusFilter: string | null = null;

  // Options
  categoryOptions = [
    { label: 'Todos', value: null },
    { label: 'Puntos', value: 'points', icon: 'pi pi-star' },
    { label: 'Juegos', value: 'games', icon: 'pi pi-play' },
    { label: 'Rachas', value: 'streak', icon: 'pi pi-bolt' },
    { label: 'Nivel', value: 'level', icon: 'pi pi-arrow-up' },
    { label: 'Tiempo', value: 'time', icon: 'pi pi-clock' },
    { label: 'Especial', value: 'special', icon: 'pi pi-trophy' }
  ];

  typeOptions = [
    { label: 'Todos', value: null },
    { label: 'Hito', value: 'milestone' },
    { label: 'Racha', value: 'streak' },
    { label: 'Colección', value: 'collection' },
    { label: 'Desafío', value: 'challenge' }
  ];

  statusOptions = [
    { label: 'Todos', value: null },
    { label: 'Activos', value: 'active' },
    { label: 'Inactivos', value: 'inactive' },
    { label: 'Ocultos', value: 'hidden' }
  ];

  conditionOptions = [
    { label: 'Alcanzar', value: 'reach' },
    { label: 'Superar', value: 'exceed' },
    { label: 'Mantener', value: 'maintain' },
    { label: 'Completar', value: 'complete' }
  ];

  iconOptions = [
    { label: '🏆 Trofeo', value: 'pi pi-trophy' },
    { label: '⭐ Estrella', value: 'pi pi-star' },
    { label: '🎯 Diana', value: 'pi pi-bullseye' },
    { label: '🔥 Fuego', value: 'pi pi-bolt' },
    { label: '💎 Diamante', value: 'pi pi-diamond' },
    { label: '🎖️ Medalla', value: 'pi pi-medal' },
    { label: '🚀 Cohete', value: 'pi pi-send' },
    { label: '💪 Fuerza', value: 'pi pi-heart' },
    { label: '🧠 Cerebro', value: 'pi pi-brain' },
    { label: '⚡ Rayo', value: 'pi pi-flash' }
  ];

  // Achievement templates
  achievementTemplates: AchievementTemplate[] = [
    {
      title: 'Primer Paso',
      description: 'Completa tu primer juego',
      icon: 'pi pi-play',
      category: 'games',
      type: 'milestone',
      requirements: { target_value: 1, condition: 'reach', metric: 'games_completed' },
      reward_points: 50
    },
    {
      title: 'Jugador Constante',
      description: 'Completa 10 juegos',
      icon: 'pi pi-star',
      category: 'games',
      type: 'milestone',
      requirements: { target_value: 10, condition: 'reach', metric: 'games_completed' },
      reward_points: 200
    },
    {
      title: 'Experto Eco',
      description: 'Alcanza 1000 puntos',
      icon: 'pi pi-trophy',
      category: 'points',
      type: 'milestone',
      requirements: { target_value: 1000, condition: 'reach', metric: 'total_points' },
      reward_points: 100
    },
    {
      title: 'Racha de Fuego',
      description: 'Mantén una racha de 5 respuestas correctas',
      icon: 'pi pi-bolt',
      category: 'streak',
      type: 'streak',
      requirements: { target_value: 5, condition: 'maintain', metric: 'correct_streak' },
      reward_points: 150
    },
    {
      title: 'Subida de Nivel',
      description: 'Alcanza el nivel 5',
      icon: 'pi pi-arrow-up',
      category: 'level',
      type: 'milestone',
      requirements: { target_value: 5, condition: 'reach', metric: 'level' },
      reward_points: 250
    }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadAchievements();
  }

  private initializeForm(): void {
    this.achievementForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(300)]],
      icon: ['pi pi-trophy', Validators.required],
      category: ['points', Validators.required],
      type: ['milestone', Validators.required],
      target_value: [1, [Validators.required, Validators.min(1)]],
      condition: ['reach', Validators.required],
      metric: ['total_points', Validators.required],
      reward_points: [50, [Validators.required, Validators.min(1)]],
      is_active: [true],
      is_hidden: [false]
    });
  }

  private loadAchievements(): void {
    this.loading = true;

    // Simular carga de logros
    setTimeout(() => {
      this.achievements = [
        {
          id: '1',
          admin_id: 'admin1',
          title: 'Primer Paso',
          description: 'Completa tu primer juego',
          icon: 'pi pi-play',
          category: 'games',
          type: 'milestone',
          requirements: { target_value: 1, condition: 'reach', metric: 'games_completed' },
          reward_points: 50,
          is_active: true,
          is_hidden: false,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        },
        {
          id: '2',
          admin_id: 'admin1',
          title: 'Experto Eco',
          description: 'Alcanza 1000 puntos',
          icon: 'pi pi-trophy',
          category: 'points',
          type: 'milestone',
          requirements: { target_value: 1000, condition: 'reach', metric: 'total_points' },
          reward_points: 100,
          is_active: true,
          is_hidden: false,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ];

      this.applyFilters();
      this.loading = false;
    }, 1000);
  }

  openDialog(achievement?: Achievement): void {
    this.isEditing = !!achievement;
    this.selectedAchievement = achievement || null;

    if (achievement) {
      this.achievementForm.patchValue({
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category,
        type: achievement.type,
        target_value: achievement.requirements.target_value,
        condition: achievement.requirements.condition,
        metric: achievement.requirements.metric,
        reward_points: achievement.reward_points,
        is_active: achievement.is_active,
        is_hidden: achievement.is_hidden
      });
    } else {
      this.achievementForm.reset();
      this.achievementForm.patchValue({
        icon: 'pi pi-trophy',
        category: 'points',
        type: 'milestone',
        condition: 'reach',
        metric: 'total_points',
        target_value: 1,
        reward_points: 50,
        is_active: true,
        is_hidden: false
      });
    }

    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
    this.selectedAchievement = null;
    this.achievementForm.reset();
  }

  onSubmit(): void {
    if (!this.achievementForm.valid) return;

    const formData = this.achievementForm.value;
    const achievementData: Partial<Achievement> = {
      title: formData.title,
      description: formData.description,
      icon: formData.icon,
      category: formData.category,
      type: formData.type,
      requirements: {
        target_value: formData.target_value,
        condition: formData.condition,
        metric: formData.metric
      },
      reward_points: formData.reward_points,
      is_active: formData.is_active,
      is_hidden: formData.is_hidden
    };

    if (this.isEditing && this.selectedAchievement) {
      // Update existing achievement
      const index = this.achievements.findIndex(a => a.id === this.selectedAchievement!.id);
      if (index !== -1) {
        this.achievements[index] = { ...this.achievements[index], ...achievementData };
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Logro actualizado correctamente'
        });
      }
    } else {
      // Create new achievement
      const newAchievement: Achievement = {
        id: Date.now().toString(),
        admin_id: this.authService.getCurrentAdmin()?.id || 'admin1',
        ...achievementData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as Achievement;

      this.achievements.push(newAchievement);
      this.messageService.add({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Logro creado correctamente'
      });
    }

    this.applyFilters();
    this.closeDialog();
  }

  deleteAchievement(achievement: Achievement): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar el logro "${achievement.title}"?`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.achievements = this.achievements.filter(a => a.id !== achievement.id);
        this.applyFilters();
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Logro eliminado correctamente'
        });
      }
    });
  }

  useTemplate(template: AchievementTemplate): void {
    this.achievementForm.patchValue({
      title: template.title,
      description: template.description,
      icon: template.icon,
      category: template.category,
      type: template.type,
      target_value: template.requirements.target_value,
      condition: template.requirements.condition,
      metric: template.requirements.metric,
      reward_points: template.reward_points,
      is_active: true,
      is_hidden: false
    });
  }

  toggleStatus(achievement: Achievement): void {
    achievement.is_active = !achievement.is_active;
    achievement.updated_at = new Date().toISOString();

    this.messageService.add({
      severity: 'success',
      summary: 'Éxito',
      detail: `Logro ${achievement.is_active ? 'activado' : 'desactivado'} correctamente`
    });
  }

  applyFilters(): void {
    this.filteredAchievements = this.achievements.filter(achievement => {
      const matchesGlobal = !this.globalFilter ||
        achievement.title.toLowerCase().includes(this.globalFilter.toLowerCase()) ||
        achievement.description.toLowerCase().includes(this.globalFilter.toLowerCase());

      const matchesCategory = !this.categoryFilter || achievement.category === this.categoryFilter;
      const matchesType = !this.typeFilter || achievement.type === this.typeFilter;

      let matchesStatus = true;
      if (this.statusFilter === 'active') {
        matchesStatus = achievement.is_active && !achievement.is_hidden;
      } else if (this.statusFilter === 'inactive') {
        matchesStatus = !achievement.is_active;
      } else if (this.statusFilter === 'hidden') {
        matchesStatus = achievement.is_hidden;
      }

      return matchesGlobal && matchesCategory && matchesType && matchesStatus;
    });
  }

  getCategoryIcon(category: string): string {
    const categoryOption = this.categoryOptions.find(opt => opt.value === category);
    return categoryOption?.icon || 'pi pi-star';
  }

  getCategorySeverity(category: string): any {
    const severityMap: { [key: string]: string } = {
      'points': 'warning',
      'games': 'info',
      'streak': 'danger',
      'level': 'success',
      'time': 'secondary',
      'special': 'primary'
    };
    return severityMap[category] || 'info';
  }

  getTypeSeverity(type: string): any {
    const severityMap: { [key: string]: string } = {
      'milestone': 'success',
      'streak': 'warning',
      'collection': 'info',
      'challenge': 'danger'
    };
    return severityMap[type] || 'info';
  }

  goBack(): void {
    window.history.back();
  }
}