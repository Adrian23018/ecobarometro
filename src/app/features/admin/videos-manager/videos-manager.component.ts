// src/app/features/admin/videos-manager/videos-manager.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

// PrimeNG
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { InputNumberModule } from 'primeng/inputnumber';

// Models & Services
import { EducationalVideo, VideoStep, CreateVideoRequest, UpdateVideoRequest } from '../../../core/models/educational-video';
import { VideoService } from '../../../core/services/video.service';
import { AuthService } from '../../../core/services/auth.service';
import { SafePipe } from '../../../shared/pipes/safe.pipe';

@Component({
  selector: 'app-videos-manager',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputTextareaModule,
    DialogModule,
    ToastModule,
    ConfirmDialogModule,
    DividerModule,
    InputNumberModule,
    DragDropModule,
    SafePipe,
    FormsModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './videos-manager.component.html',
  styleUrls: ['./videos-manager.component.css']
})
export class VideosManagerComponent implements OnInit, OnDestroy {
  videos: EducationalVideo[] = [];
  isLoading = false;
  showDialog = false;
  showPreviewDialog = false;
  editMode = false;
  selectedVideo: EducationalVideo | null = null;
  previewVideo: EducationalVideo | null = null;

  videoForm!: FormGroup;
  currentAdminId = '';

  // Statistics
  totalVideos = 0;
  totalViews = 0;
  totalSuccesses = 0;
  successRate = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private videoService: VideoService,
    private authService: AuthService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadCurrentAdmin();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========== INITIALIZATION ==========

  loadCurrentAdmin(): void {
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (user:any) => {
        // Si es un admin logueado, usar user.id
        // Si es un usuario regular, usar user.admin_id
        const adminId = user?.id || user?.admin_id;

        if (adminId && adminId.trim() !== '') {
          this.currentAdminId = adminId;
          this.loadVideos();
        } else {
          this.isLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No tienes permisos de administrador',
            life: 3000
          });
        }
      },
      error: (error) => {
        console.error('Error loading admin:', error);
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo cargar la información del administrador',
          life: 3000
        });
      }
    });
  }

  initializeForm(): void {
    this.videoForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      description: ['', Validators.maxLength(500)],
      youtube_url: ['', [Validators.required, Validators.pattern(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/)]],
      completion_threshold: [50, [Validators.required, Validators.min(10), Validators.max(100)]],
      steps: this.fb.array([], [Validators.required, Validators.minLength(3)])
    });
  }

  get stepsArray(): FormArray {
    return this.videoForm.get('steps') as FormArray;
  }

  getStepFormGroup(index: number): FormGroup {
    return this.stepsArray.at(index) as FormGroup;
  }

  // ========== CRUD OPERATIONS ==========

  loadVideos(): void {
    if (!this.currentAdminId || this.currentAdminId.trim() === '') {
      console.error('No admin ID available');
      this.isLoading = false;
      return;
    }

    this.isLoading = true;

    this.videoService.getVideosByAdmin(this.currentAdminId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (videos) => {
          this.videos = videos;
          this.calculateStatistics();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading videos:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los videos',
            life: 3000
          });
          this.isLoading = false;
        }
      });
  }

  openCreateDialog(): void {
    this.editMode = false;
    this.selectedVideo = null;
    this.videoForm.reset({ completion_threshold: 50 });
    this.stepsArray.clear();
    this.addStep(); // Add first step by default
    this.showDialog = true;
  }

  openEditDialog(video: EducationalVideo): void {
    this.editMode = true;
    this.selectedVideo = video;

    this.videoForm.patchValue({
      title: video.title,
      description: video.description,
      youtube_url: this.videoService.buildYouTubeUrl(video.youtube_video_id),
      completion_threshold: video.completion_threshold
    });

    this.stepsArray.clear();
    if (video.steps && video.steps.length > 0) {
      video.steps
        .sort((a, b) => a.order_index - b.order_index)
        .forEach(step => {
          this.stepsArray.push(this.fb.group({
            order_index: [step.order_index],
            step_text: [step.step_text, [Validators.required, Validators.maxLength(200)]],
            hint: [step.hint, Validators.maxLength(150)]
          }));
        });
    }

    this.showDialog = true;
  }

  saveVideo(): void {
    if (this.videoForm.invalid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Formulario incompleto',
        detail: 'Por favor completa todos los campos requeridos',
        life: 3000
      });
      return;
    }

    const youtubeUrl = this.videoForm.value.youtube_url;
    const videoId = this.videoService.extractYouTubeId(youtubeUrl);

    if (!videoId) {
      this.messageService.add({
        severity: 'error',
        summary: 'URL inválida',
        detail: 'No se pudo extraer el ID del video de YouTube',
        life: 3000
      });
      return;
    }

    const steps = this.stepsArray.value.map((step: any, index: number) => ({
      order_index: index + 1,
      step_text: step.step_text,
      hint: step.hint || null
    }));

    if (this.editMode && this.selectedVideo) {
      const updateData: UpdateVideoRequest = {
        title: this.videoForm.value.title,
        description: this.videoForm.value.description,
        youtube_video_id: videoId,
        completion_threshold: this.videoForm.value.completion_threshold
      };

      this.videoService.updateVideo(this.selectedVideo.id, updateData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.updateVideoSteps(this.selectedVideo!.id, steps);
          },
          error: (error) => {
            console.error('Error updating video:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo actualizar el video',
              life: 3000
            });
          }
        });
    } else {
      const createData: CreateVideoRequest = {
        admin_id: this.currentAdminId,
        title: this.videoForm.value.title,
        description: this.videoForm.value.description,
        youtube_video_id: videoId,
        completion_threshold: this.videoForm.value.completion_threshold,
        steps
      };

      this.videoService.createVideo(createData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Éxito',
              detail: 'Video creado correctamente',
              life: 3000
            });
            this.loadVideos();
            this.showDialog = false;
          },
          error: (error) => {
            console.error('Error creating video:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo crear el video',
              life: 3000
            });
          }
        });
    }
  }

  updateVideoSteps(videoId: string, steps: Partial<VideoStep>[]): void {
    this.videoService.updateVideoSteps(videoId, steps)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Video actualizado correctamente',
            life: 3000
          });
          this.loadVideos();
          this.showDialog = false;
        },
        error: (error:any) => {
          console.error('Error updating steps:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron actualizar los pasos',
            life: 3000
          });
        }
      });
  }

  deleteVideo(video: EducationalVideo): void {
    this.confirmationService.confirm({
      message: `¿Estás seguro de eliminar el video "${video.title}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.videoService.deleteVideo(video.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Éxito',
                detail: 'Video eliminado correctamente',
                life: 3000
              });
              this.loadVideos();
            },
            error: (error) => {
              console.error('Error deleting video:', error);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo eliminar el video',
                life: 3000
              });
            }
          });
      }
    });
  }

  // ========== STEPS MANAGEMENT ==========

  addStep(): void {
    const stepGroup = this.fb.group({
      order_index: [this.stepsArray.length + 1],
      step_text: ['', [Validators.required, Validators.maxLength(200)]],
      hint: ['', Validators.maxLength(150)]
    });
    this.stepsArray.push(stepGroup);
  }

  removeStep(index: number): void {
    this.stepsArray.removeAt(index);
    this.reorderSteps();
  }

  onStepDrop(event: CdkDragDrop<FormArray>): void {
    const steps = this.stepsArray.value;
    moveItemInArray(steps, event.previousIndex, event.currentIndex);

    this.stepsArray.clear();
    steps.forEach((step: any) => {
      this.stepsArray.push(this.fb.group({
        order_index: [0],
        step_text: [step.step_text, [Validators.required, Validators.maxLength(200)]],
        hint: [step.hint, Validators.maxLength(150)]
      }));
    });

    this.reorderSteps();
  }

  reorderSteps(): void {
    this.stepsArray.controls.forEach((control, index) => {
      control.patchValue({ order_index: index + 1 });
    });
  }

  // ========== PREVIEW ==========

  openPreview(video: EducationalVideo): void {
    this.previewVideo = video;
    this.showPreviewDialog = true;
  }

  getPreviewUrl(video: EducationalVideo): string {
    return this.videoService.buildYouTubeEmbedUrl(video.youtube_video_id);
  }

  // ========== STATISTICS ==========

  calculateStatistics(): void {
    this.totalVideos = this.videos.length;
    this.totalViews = this.videos.reduce((sum, v) => sum + (v.view_count || 0), 0);
    this.totalSuccesses = this.videos.reduce((sum, v) => sum + (v.success_count || 0), 0);
    this.successRate = this.totalViews > 0 ? Math.round((this.totalSuccesses / this.totalViews) * 100) : 0;
  }

  // ========== HELPERS ==========

  getYouTubeEmbedUrl(videoId: string): string {
    return `https://www.youtube.com/embed/${videoId}`;
  }

  getThumbnailUrl(video: EducationalVideo): string {
    return this.videoService.generateThumbnailUrl(video.youtube_video_id);
  }
}
