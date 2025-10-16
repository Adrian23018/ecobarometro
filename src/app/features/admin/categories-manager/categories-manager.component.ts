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
  templateUrl: './categories-manager.component.html',
  styleUrls: ['./categories-manager.component.css'],
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