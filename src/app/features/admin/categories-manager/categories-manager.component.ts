import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

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
    TooltipModule
  ],
  template: `
    <div class="categories-manager">
      <p-card>
        <!-- Header -->
        <p-toolbar styleClass="mb-4">
          <div class="p-toolbar-group-start">
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

        <!-- Categories Table -->
        <p-table 
          [value]="categories" 
          [loading]="loading"
          styleClass="p-datatable-striped"
          [paginator]="true"
          [rows]="10"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} categorías"
          [rowsPerPageOptions]="[10, 25, 50]"
          [globalFilterFields]="['name', 'description']"
          #dt
        >
          <ng-template pTemplate="caption">
            <div class="flex justify-content-between align-items-center">
              <span class="p-input-icon-left">
                <i class="pi pi-search"></i>
                <input 
                  pInputText 
                  type="text" 
                  (input)="dt.filterGlobal($any($event.target).value, 'contains')" 
                  placeholder="Buscar categorías..." 
                />
              </span>
              <div class="flex gap-2">
                <p-button 
                  icon="pi pi-sort-alt" 
                  label="Reordenar"
                  [text]="true"
                  (onClick)="toggleReorderMode()"
                  [severity]="reorderMode ? 'info' : 'secondary'"
                />
              </div>
            </div>
          </ng-template>

          <ng-template pTemplate="header">
            <tr>
              <th style="width: 3rem">
                <i class="pi pi-sort" pTooltip="Orden"></i>
              </th>
              <th pSortableColumn="name">
                Nombre 
                <p-sortIcon field="name" />
              </th>
              <th>Descripción</th>
              <th>Color/Icono</th>
              <th>Preguntas</th>
              <th pSortableColumn="created_at">
                Creada 
                <p-sortIcon field="created_at" />
              </th>
              <th style="width: 8rem">Acciones</th>
            </tr>
          </ng-template>

          <ng-template pTemplate="body" let-category let-i="rowIndex">
            <tr>
              <td>
                <div class="flex align-items-center gap-2">
                  <i 
                    *ngIf="reorderMode"
                    class="pi pi-bars cursor-move text-400"
                    pTooltip="Arrastrar para reordenar"
                  ></i>
                  <p-badge 
                    [value]="category.order_index || i + 1" 
                    severity="secondary"
                  />
                </div>
              </td>
              <td>
                <div class="font-medium">{{ category.name }}</div>
              </td>
              <td>
                <div class="text-600 max-w-20rem overflow-hidden text-overflow-ellipsis">
                  {{ category.description }}
                </div>
              </td>
              <td>
                <div class="flex align-items-center gap-2">
                  <div 
                    class="flex align-items-center justify-content-center border-circle"
                    [style.background-color]="category.color"
                    style="width: 2.5rem; height: 2.5rem;"
                  >
                    <i [class]="category.icon" class="text-white"></i>
                  </div>
                  <div class="text-sm">
                    <div>{{ category.color }}</div>
                    <div class="text-500">{{ category.icon }}</div>
                  </div>
                </div>
              </td>
              <td>
                <p-tag 
                  [value]="category.questions_count || 0" 
                  severity="info"
                />
              </td>
              <td>
                {{ category.created_at | date:'short' }}
              </td>
              <td>
                <div class="flex gap-1">
                  <p-button 
                    icon="pi pi-pencil" 
                    size="small"
                    [text]="true"
                    severity="info"
                    (onClick)="editCategory(category)"
                    pTooltip="Editar"
                  />
                  <p-button 
                    icon="pi pi-trash" 
                    size="small"
                    [text]="true"
                    severity="danger"
                    (onClick)="deleteCategory(category)"
                    pTooltip="Eliminar"
                  />
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="7" class="text-center p-4">
                <div class="text-center">
                  <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
                  <h4 class="text-500">No hay categorías creadas</h4>
                  <p class="text-600">Crea tu primera categoría para organizar las preguntas</p>
                  <p-button 
                    label="Crear Categoría" 
                    icon="pi pi-plus" 
                    (onClick)="openDialog()"
                  />
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>

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
      padding: 1rem;
    }

    .max-w-20rem {
      max-width: 20rem;
    }

    .cursor-move {
      cursor: move;
    }

    @media (max-width: 768px) {
      .categories-manager {
        padding: 0.5rem;
      }
    }
  `]
})
export class CategoriesManagerComponent implements OnInit {
  categories: Category[] = [];
  loading = false;
  saving = false;
  showDialog = false;
  reorderMode = false;
  editingCategory: Category | null = null;
  originalCategories: Category[] = [];

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
    const adminData = localStorage.getItem('admin');
    
    if (adminData) {
      const admin = JSON.parse(adminData);
      this.categoryService.getCategoriesByAdmin(admin.id).subscribe({
        next: (categories) => {
          this.categories = categories;
          this.originalCategories = [...categories];
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
    const adminData = localStorage.getItem('admin');
    
    if (!adminData) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo identificar el administrador'
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
}