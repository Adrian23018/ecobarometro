import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// PrimeNG
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ColorPickerModule } from 'primeng/colorpicker';
import { DropdownModule } from 'primeng/dropdown';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { ProgressBarModule } from 'primeng/progressbar';
import { DragDropModule } from 'primeng/dragdrop';
import { OrderListModule } from 'primeng/orderlist';
import { TooltipModule } from 'primeng/tooltip';
import { PaginatorModule } from 'primeng/paginator';
import { SkeletonModule } from 'primeng/skeleton';

// Services
import { ConfirmationService, MessageService } from 'primeng/api';
import { Category } from '../../../core/services/game.service';
import { CategoryService } from '../../../core/services/category.service';
import { CreateCategoryRequest, UpdateCategoryRequest } from '../../../core/models/category';

// Models

interface IconOption {
  label: string;
  value: string;
  icon: string;
}

@Component({
  selector: 'app-categories-manager',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    CardModule,
    ButtonModule,
    TableModule,
    DialogModule,
    InputTextModule,
    InputTextareaModule,
    ColorPickerModule,
    DropdownModule,
    ConfirmDialogModule,
    ToastModule,
    ToolbarModule,
    TagModule,
    BadgeModule,
    ProgressBarModule,
    DragDropModule,
    OrderListModule,
    TooltipModule,
    PaginatorModule,
    SkeletonModule
  ],
  template: `
    <div class="categories-manager">
      <p-card>
        <!-- Header -->
        <p-toolbar styleClass="mb-4">
          <div class="p-toolbar-group-start">
            <p-button
              icon="pi pi-arrow-left"
              [text]="true"
              [routerLink]="['/admin/dashboard']"
              pTooltip="Volver al Dashboard"
              severity="secondary"
              class="mr-3"
            />
            <h2 class="m-0">🗂️ Gestión de Categorías</h2>
          </div>
          <div class="p-toolbar-group-end">
            <p-button
              label="Nueva Categoría"
              icon="pi pi-plus"
              (onClick)="openDialog()"
              severity="success"
            />
          </div>
        </p-toolbar>

        <!-- Search and Filter -->
        <div class="mb-4">
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search"></i>
            <input
              pInputText
              type="text"
              [(ngModel)]="searchTerm"
              (input)="filterCategories()"
              placeholder="Buscar categorías..."
              class="w-full"
            />
          </span>
        </div>

        <!-- Categories Grid -->
        <div class="categories-grid" *ngIf="!loading && paginatedCategories.length > 0">
          <div *ngFor="let category of paginatedCategories; let i = index" class="category-card-wrapper">
            <p-card [style]="{'border-left': '4px solid ' + category.color}">
              <div class="category-card-content">
                <!-- Header -->
                <div class="flex justify-content-between align-items-start mb-3">
                  <div class="flex align-items-center gap-3">
                    <div
                      class="category-icon"
                      [style.background-color]="category.color"
                    >
                      <i [class]="category.icon" class="text-white text-2xl"></i>
                    </div>
                    <div>
                      <h3 class="m-0 mb-1">{{ category.name }}</h3>
                      <p class="text-sm text-500 m-0">
                        <i class="pi pi-clock mr-1"></i>
                        {{ category.created_at | date:'short' }}
                      </p>
                    </div>
                  </div>
                  <p-badge
                    [value]="'#' + (category.order_index || i + 1)"
                    severity="secondary"
                  />
                </div>

                <!-- Description -->
                <p class="text-600 mb-3 category-description">
                  {{ category.description || 'Sin descripción' }}
                </p>

                <!-- Stats -->
                <div class="flex gap-3 mb-3">
                  <div class="stat-item">
                    <i class="pi pi-question-circle text-blue-500"></i>
                    <span class="font-semibold">{{ category.questions_count || 0 }}</span>
                    <span class="text-sm text-500">Preguntas</span>
                  </div>
                  <div class="stat-item">
                    <div
                      class="color-preview"
                      [style.background-color]="category.color"
                      [title]="category.color"
                    ></div>
                    <span class="text-sm text-500">{{ category.color }}</span>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex gap-2">
                  <p-button
                    label="Editar"
                    icon="pi pi-pencil"
                    size="small"
                    [outlined]="true"
                    severity="info"
                    (onClick)="editCategory(category)"
                    class="flex-1"
                  />
                  <p-button
                    icon="pi pi-trash"
                    size="small"
                    [outlined]="true"
                    severity="danger"
                    (onClick)="deleteCategory(category)"
                    pTooltip="Eliminar"
                  />
                </div>
              </div>
            </p-card>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && filteredCategories.length === 0" class="text-center py-8">
          <i class="pi pi-inbox text-6xl text-400 mb-3"></i>
          <h4 class="text-500 mb-2">{{ searchTerm ? 'No se encontraron categorías' : 'No hay categorías creadas' }}</h4>
          <p class="text-600 mb-4">
            {{ searchTerm ? 'Intenta con otros términos de búsqueda' : 'Crea tu primera categoría para organizar las preguntas' }}
          </p>
          <p-button
            *ngIf="!searchTerm"
            label="Crear Categoría"
            icon="pi pi-plus"
            (onClick)="openDialog()"
          />
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="categories-grid">
          <p-card *ngFor="let item of [1,2,3,4,5,6]">
            <p-skeleton height="200px" />
          </p-card>
        </div>

        <!-- Paginator -->
        <p-paginator
          *ngIf="filteredCategories.length > 0"
          [rows]="pageSize"
          [totalRecords]="filteredCategories.length"
          [rowsPerPageOptions]="[6, 12, 24, 48]"
          (onPageChange)="onPageChange($event)"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} categorías"
        />

        <!-- Reorder Mode -->
        <div *ngIf="reorderMode" class="mt-4">
          <p-card>
            <h4>Reordenar Categorías</h4>
            <p class="text-600 mb-3">Arrastra las categorías para cambiar su orden de aparición</p>
            
            <p-orderList 
              [value]="categories" 
              [dragdrop]="true"
              header="Orden de Categorías"
            >
              <ng-template let-category pTemplate="item">
                <div class="flex align-items-center gap-3 p-2">
                  <div 
                    class="flex align-items-center justify-content-center border-circle"
                    [style.background-color]="category.color"
                    style="width: 2rem; height: 2rem;"
                  >
                    <i [class]="category.icon" class="text-white text-sm"></i>
                  </div>
                  <div class="flex-1">
                    <div class="font-medium">{{ category.name }}</div>
                    <div class="text-sm text-600">{{ category.description }}</div>
                  </div>
                </div>
              </ng-template>
            </p-orderList>
            
            <div class="flex gap-2 mt-3">
              <p-button 
                label="Guardar Orden" 
                icon="pi pi-check" 
                (onClick)="saveOrder()"
                severity="success"
              />
              <p-button 
                label="Cancelar" 
                icon="pi pi-times" 
                (onClick)="cancelReorder()"
                severity="secondary"
                [outlined]="true"
              />
            </div>
          </p-card>
        </div>
      </p-card>
    </div>

    <!-- Create/Edit Dialog -->
    <p-dialog 
      [header]="editingCategory ? 'Editar Categoría' : 'Nueva Categoría'" 
      [(visible)]="showDialog"
      [modal]="true"
      [style]="{width: '500px'}"
      [closable]="false"
    >
      <form [formGroup]="categoryForm" (ngSubmit)="saveCategory()">
        <div class="grid">
          <!-- Nombre -->
          <div class="col-12">
            <label for="name" class="block text-900 font-medium mb-2">Nombre *</label>
            <input 
              id="name"
              type="text" 
              pInputText 
              formControlName="name"
              class="w-full"
              placeholder="Ej: Energía Renovable"
            />
            <small 
              *ngIf="categoryForm.get('name')?.errors?.['required'] && categoryForm.get('name')?.touched"
              class="p-error"
            >
              El nombre es requerido
            </small>
          </div>

          <!-- Descripción -->
          <div class="col-12">
            <label for="description" class="block text-900 font-medium mb-2">Descripción</label>
            <textarea 
              id="description"
              pInputTextarea 
              formControlName="description"
              rows="3"
              class="w-full"
              placeholder="Describe el tema de esta categoría..."
            ></textarea>
          </div>

          <!-- Icono -->
          <div class="col-12 md:col-6">
            <label for="icon" class="block text-900 font-medium mb-2">Icono</label>
            <p-dropdown 
              formControlName="icon"
              [options]="iconOptions"
              placeholder="Selecciona un icono"
              class="w-full"
              [showClear]="true"
            >
              <ng-template let-option pTemplate="item">
                <div class="flex align-items-center gap-2">
                  <i [class]="option.icon"></i>
                  <span>{{ option.label }}</span>
                </div>
              </ng-template>
              <ng-template let-option pTemplate="selectedItem">
                <div class="flex align-items-center gap-2" *ngIf="option">
                  <i [class]="option.icon"></i>
                  <span>{{ option.label }}</span>
                </div>
              </ng-template>
            </p-dropdown>
          </div>

          <!-- Color -->
          <div class="col-12 md:col-6">
            <label for="color" class="block text-900 font-medium mb-2">Color</label>
            <div class="flex align-items-center gap-2">
              <p-colorPicker 
                formControlName="color"
                [inline]="false"
              />
              <input 
                type="text" 
                pInputText 
                formControlName="color"
                class="flex-1"
                placeholder="#22c55e"
              />
            </div>
          </div>

          <!-- Preview -->
          <div class="col-12" *ngIf="categoryForm.get('name')?.value">
            <label class="block text-900 font-medium mb-2">Vista Previa</label>
            <div class="flex align-items-center gap-3 p-3 border-1 surface-border border-round">
              <div 
                class="flex align-items-center justify-content-center border-circle"
                [style.background-color]="categoryForm.get('color')?.value || '#22c55e'"
                style="width: 3rem; height: 3rem;"
              >
                <i [class]="categoryForm.get('icon')?.value || 'pi pi-circle'" class="text-white text-xl"></i>
              </div>
              <div>
                <div class="font-medium text-lg">{{ categoryForm.get('name')?.value }}</div>
                <div class="text-600">{{ categoryForm.get('description')?.value || 'Sin descripción' }}</div>
              </div>
            </div>
          </div>
        </div>
      </form>

      <ng-template pTemplate="footer">
        <div class="flex gap-2">
          <p-button 
            label="Cancelar" 
            icon="pi pi-times" 
            (onClick)="closeDialog()"
            severity="secondary"
            [outlined]="true"
          />
          <p-button 
            label="{{ editingCategory ? 'Actualizar' : 'Crear' }}" 
            icon="pi pi-check" 
            (onClick)="saveCategory()"
            [loading]="saving"
            [disabled]="categoryForm.invalid"
          />
        </div>
      </ng-template>
    </p-dialog>

    <!-- Confirmation Dialog -->
    <p-confirmDialog />
    
    <!-- Toast -->
    <p-toast />
  `,
  styles: [`
    .categories-manager {
      padding: 2rem;
    }

    .max-w-20rem {
      max-width: 20rem;
    }

    .cursor-move {
      cursor: move;
    }

    @media (max-width: 768px) {
      .categories-manager {
        padding: 1rem;
      }
    }
  `]
})
export class CategoriesManagerComponent implements OnInit {
  categories: Category[] = [];
  filteredCategories: Category[] = [];
  paginatedCategories: Category[] = [];
  loading = false;
  saving = false;
  showDialog = false;
  reorderMode = false;
  editingCategory: Category | null = null;
  originalCategories: Category[] = [];

  // Pagination
  pageSize = 6;
  currentPage = 0;
  searchTerm = '';

  categoryForm: FormGroup;

  iconOptions: IconOption[] = [
    { label: 'Energía', value: 'pi pi-bolt', icon: 'pi pi-bolt' },
    { label: 'Agua', value: 'pi pi-tint', icon: 'pi pi-tint' },
    { label: 'Reciclaje', value: 'pi pi-refresh', icon: 'pi pi-refresh' },
    { label: 'Transporte', value: 'pi pi-car', icon: 'pi pi-car' },
    { label: 'Hogar', value: 'pi pi-home', icon: 'pi pi-home' },
    { label: 'Naturaleza', value: 'pi pi-sun', icon: 'pi pi-sun' },
    { label: 'Industria', value: 'pi pi-cog', icon: 'pi pi-cog' },
    { label: 'Alimentación', value: 'pi pi-apple', icon: 'pi pi-apple' },
    { label: 'Educación', value: 'pi pi-book', icon: 'pi pi-book' },
    { label: 'Tecnología', value: 'pi pi-desktop', icon: 'pi pi-desktop' }
  ];

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      icon: ['pi pi-circle'],
      color: ['#22c55e']
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    const adminData = localStorage.getItem('ecobarometro_admin');

    if (adminData) {
      const admin = JSON.parse(adminData);
      this.categoryService.getCategoriesByAdmin(admin.id).subscribe({
        next: (categories) => {
          this.categories = categories;
          this.originalCategories = [...categories];
          this.filteredCategories = [...categories];
          this.updatePaginatedCategories();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar las categorías'
          });
          this.loading = false;
        }
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo identificar el administrador. Por favor, inicia sesión nuevamente.'
      });
      this.loading = false;
    }
  }

  openDialog(): void {
    this.editingCategory = null;
    this.categoryForm.reset({
      name: '',
      description: '',
      icon: 'pi pi-circle',
      color: '#22c55e'
    });
    this.showDialog = true;
  }

  editCategory(category: Category): void {
    this.editingCategory = category;
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color
    });
    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
    this.editingCategory = null;
    this.categoryForm.reset();
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) return;

    this.saving = true;
    const formValue = this.categoryForm.value;
    const adminData = localStorage.getItem('ecobarometro_admin');

    if (!adminData) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo identificar el administrador. Por favor, inicia sesión nuevamente.'
      });
      this.saving = false;
      return;
    }

    const admin = JSON.parse(adminData);

    if (this.editingCategory) {
      // Actualizar categoría existente
      const updates: UpdateCategoryRequest = {
        name: formValue.name,
        description: formValue.description,
        icon: formValue.icon,
        color: formValue.color
      };

      this.categoryService.updateCategory(this.editingCategory.id, updates).subscribe({
        next: (updatedCategory) => {
          const index = this.categories.findIndex(c => c.id === updatedCategory.id);
          if (index > -1) {
            this.categories[index] = updatedCategory;
          }
          
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Categoría actualizada correctamente'
          });
          
          this.closeDialog();
          this.saving = false;
        },
        error: (error) => {
          console.error('Error updating category:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar la categoría'
          });
          this.saving = false;
        }
      });
    } else {
      // Crear nueva categoría
      const newCategory: CreateCategoryRequest = {
        name: formValue.name,
        description: formValue.description,
        icon: formValue.icon,
        color: formValue.color,
        order_index: this.categories.length
      };

      this.categoryService.createCategory(admin.id, newCategory).subscribe({
        next: (category) => {
          this.categories.push(category);
          this.filterCategories();

          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Categoría creada correctamente'
          });

          this.closeDialog();
          this.saving = false;
        },
        error: (error) => {
          console.error('Error creating category:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear la categoría'
          });
          this.saving = false;
        }
      });
    }
  }

  deleteCategory(category: Category): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de que deseas eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`,
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.categoryService.deleteCategory(category.id).subscribe({
          next: () => {
            this.categories = this.categories.filter(c => c.id !== category.id);
            this.filterCategories();

            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Categoría eliminada correctamente'
            });
          },
          error: (error) => {
            console.error('Error deleting category:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar la categoría'
            });
          }
        });
      }
    });
  }

  toggleReorderMode(): void {
    this.reorderMode = !this.reorderMode;
    if (!this.reorderMode) {
      this.categories = [...this.originalCategories];
    }
  }

  saveOrder(): void {
    const updates = this.categories.map((category, index) => ({
      id: category.id,
      order_index: index
    }));

    this.categoryService.updateCategoryOrder(updates).subscribe({
      next: () => {
        this.originalCategories = [...this.categories];
        this.reorderMode = false;
        
        this.messageService.add({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Orden de categorías actualizado'
        });
      },
      error: (error:any) => {
        console.error('Error updating order:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el orden'
        });
      }
    });
  }

  cancelReorder(): void {
    this.categories = [...this.originalCategories];
    this.reorderMode = false;
  }

  filterCategories(): void {
    if (!this.searchTerm.trim()) {
      this.filteredCategories = [...this.categories];
    } else {
      const search = this.searchTerm.toLowerCase();
      this.filteredCategories = this.categories.filter(category =>
        category.name.toLowerCase().includes(search) ||
        category.description?.toLowerCase().includes(search)
      );
    }
    this.currentPage = 0;
    this.updatePaginatedCategories();
  }

  onPageChange(event: any): void {
    this.currentPage = event.page;
    this.pageSize = event.rows;
    this.updatePaginatedCategories();
  }

  updatePaginatedCategories(): void {
    const start = this.currentPage * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedCategories = this.filteredCategories.slice(start, end);
  }
}