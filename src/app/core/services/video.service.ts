// src/app/core/services/video.service.ts

import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Observable, from, of, forkJoin } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  EducationalVideo,
  VideoStep,
  CreateVideoRequest,
  UpdateVideoRequest,
  VideoHelpSession,
  CreateVideoHelpSessionRequest,
  VideoHelpResult,
  VideoStats
} from '../models/educational-video';

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  // ==================== CRUD DE VIDEOS (ADMIN) ====================

  /**
   * Crear un nuevo video educativo con sus pasos
   */
  createVideo(videoData: CreateVideoRequest): Observable<EducationalVideo> {
    // Extraer ID de YouTube desde youtube_video_id o youtube_url
    let youtubeId: string | null = null;
    let youtubeUrl: string | any;

    if (videoData.youtube_video_id) {
      youtubeId = videoData.youtube_video_id;
      youtubeUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
    } else if (videoData.youtube_url) {
      youtubeId = this.extractYouTubeId(videoData.youtube_url);
      youtubeUrl = videoData.youtube_url;
    }

    if (!youtubeId) {
      throw new Error('Debe proporcionar youtube_url o youtube_video_id válido');
    }

    const videoRecord = {
      admin_id: videoData.admin_id,
      title: videoData.title,
      description: videoData.description,
      youtube_url: youtubeUrl,
      youtube_video_id: youtubeId,
      thumbnail_url: this.generateThumbnailUrl(youtubeId),
      completion_threshold: videoData.completion_threshold || 50,
      is_active: true,
      view_count: 0,
      success_count: 0
    };

    return from(
      this.supabase
        .from('educational_videos')
        .insert(videoRecord)
        .select()
        .single()
    ).pipe(
      switchMap(response => {
        if (response.error) throw response.error;
        const video = response.data;

        // Crear pasos
        const stepsToInsert = videoData.steps.map(step => ({
          video_id: video.id,
          order_index: step.order_index,
          step_text: step.step_text,
          hint: step.hint || null
        }));

        return from(
          this.supabase
            .from('video_steps')
            .insert(stepsToInsert)
            .select()
        ).pipe(
          map(stepsResponse => {
            if (stepsResponse.error) throw stepsResponse.error;
            video.steps = stepsResponse.data;
            return video;
          })
        );
      })
    );
  }

  /**
   * Obtener todos los videos de un admin
   */
  getVideosByAdmin(adminId: string): Observable<EducationalVideo[]> {
    return from(
      this.supabase
        .from('educational_videos')
        .select(`
          *,
          steps:video_steps(*)
        `)
        .eq('admin_id', adminId)
        .order('created_at', { ascending: false })
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data.map(video => ({
          ...video,
          steps: video.steps?.sort((a: VideoStep, b: VideoStep) => a.order_index - b.order_index) || []
        }));
      })
    );
  }

  /**
   * Obtener un video específico por ID
   */
  getVideoById(videoId: string): Observable<EducationalVideo> {
    return from(
      this.supabase
        .from('educational_videos')
        .select(`
          *,
          steps:video_steps(*)
        `)
        .eq('id', videoId)
        .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        const video = response.data;
        video.steps = video.steps?.sort((a: VideoStep, b: VideoStep) => a.order_index - b.order_index) || [];
        return video;
      })
    );
  }

  /**
   * Actualizar un video existente
   */
  updateVideo(videoId: string, updates: UpdateVideoRequest): Observable<EducationalVideo> {
    const videoUpdates: any = {};

    if (updates.title) videoUpdates.title = updates.title;
    if (updates.description !== undefined) videoUpdates.description = updates.description;
    if (updates.completion_threshold) videoUpdates.completion_threshold = updates.completion_threshold;
    if (updates.is_active !== undefined) videoUpdates.is_active = updates.is_active;

    // Manejar youtube_video_id directamente o extraer de URL
    if (updates.youtube_video_id) {
      videoUpdates.youtube_video_id = updates.youtube_video_id;
      videoUpdates.youtube_url = `https://www.youtube.com/watch?v=${updates.youtube_video_id}`;
      videoUpdates.thumbnail_url = this.generateThumbnailUrl(updates.youtube_video_id);
    } else if (updates.youtube_url) {
      const youtubeId = this.extractYouTubeId(updates.youtube_url);
      if (!youtubeId) {
        throw new Error('URL de YouTube inválida');
      }
      videoUpdates.youtube_url = updates.youtube_url;
      videoUpdates.youtube_video_id = youtubeId;
      videoUpdates.thumbnail_url = this.generateThumbnailUrl(youtubeId);
    }

    return from(
      this.supabase
        .from('educational_videos')
        .update(videoUpdates)
        .eq('id', videoId)
        .select()
        .single()
    ).pipe(
      switchMap(response => {
        if (response.error) throw response.error;
        const video = response.data;

        // Si hay pasos para actualizar
        if (updates.steps && updates.steps.length > 0) {
          // Eliminar pasos existentes
          return from(
            this.supabase
              .from('video_steps')
              .delete()
              .eq('video_id', videoId)
          ).pipe(
            switchMap(() => {
              // Crear nuevos pasos
              const stepsToInsert = updates.steps!.map(step => ({
                video_id: videoId,
                order_index: step.order_index,
                step_text: step.step_text,
                hint: step.hint || null
              }));

              return from(
                this.supabase
                  .from('video_steps')
                  .insert(stepsToInsert)
                  .select()
              );
            }),
            map(stepsResponse => {
              if (stepsResponse.error) throw stepsResponse.error;
              video.steps = stepsResponse.data;
              return video;
            })
          );
        }

        return of(video);
      })
    );
  }

  /**
   * Eliminar un video (soft delete)
   */
  deleteVideo(videoId: string): Observable<void> {
    return from(
      this.supabase
        .from('educational_videos')
        .update({ is_active: false })
        .eq('id', videoId)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return;
      })
    );
  }

  // ==================== OBTENER VIDEO ALEATORIO ====================

  /**
   * Obtener un video aleatorio activo del admin
   */
  getRandomVideo(adminId: string): Observable<EducationalVideo> {
    return from(
      this.supabase
        .from('educational_videos')
        .select(`
          *,
          steps:video_steps(*)
        `)
        .eq('admin_id', adminId)
        .eq('is_active', true)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        if (!response.data || response.data.length === 0) {
          throw new Error('No hay videos disponibles');
        }

        // Seleccionar uno aleatorio
        const randomIndex = Math.floor(Math.random() * response.data.length);
        const video = response.data[randomIndex];

        // Ordenar pasos
        video.steps = video.steps?.sort((a: VideoStep, b: VideoStep) => a.order_index - b.order_index) || [];

        return video;
      })
    );
  }

  // ==================== TRACKING DE SESIONES ====================

  /**
   * Crear una sesión de ayuda con video
   */
  createVideoHelpSession(sessionData: CreateVideoHelpSessionRequest): Observable<VideoHelpSession> {
    const record = {
      user_id: sessionData.user_id,
      game_session_id: sessionData.game_session_id,
      video_id: sessionData.video_id,
      watch_percentage: sessionData.watch_percentage || 0,
      mini_game_completed: false,
      mini_game_attempts: 0,
      time_bonus_earned: 0,
      points_bonus_earned: 0
    };

    return from(
      this.supabase
        .from('video_help_sessions')
        .insert(record)
        .select()
        .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data;
      })
    );
  }

  /**
   * Actualizar el progreso de visualización
   */
  updateVideoProgress(sessionId: string, watchPercentage: number): Observable<VideoHelpSession> {
    return from(
      this.supabase
        .from('video_help_sessions')
        .update({ watch_percentage: watchPercentage })
        .eq('id', sessionId)
        .select()
        .single()
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return response.data;
      })
    );
  }

  /**
   * Completar el mini-juego y otorgar recompensas
   */
  completeMiniGame(sessionId: string, attempts: number): Observable<VideoHelpResult> {
    return from(
      this.supabase
        .from('video_help_sessions')
        .update({
          mini_game_completed: true,
          mini_game_attempts: attempts,
          time_bonus_earned: 30,
          points_bonus_earned: 10,
          completed_at: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single()
    ).pipe(
      switchMap(response => {
        if (response.error) throw response.error;

        const session = response.data;

        // Incrementar contador de éxitos del video
        return this.incrementSuccessCount(session.video_id).pipe(
          map(() => ({
            success: true,
            time_bonus: 30,
            points_bonus: 10,
            session: session
          }))
        );
      })
    );
  }

  // ==================== VERIFICACIONES ====================

  /**
   * Verificar si el usuario ya usó la ayuda de video en esta partida
   */
  hasUsedVideoHelp(gameSessionId: string): Observable<boolean> {
    return from(
      this.supabase
        .from('video_help_sessions')
        .select('id')
        .eq('game_session_id', gameSessionId)
        .limit(1)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;
        return (response.data?.length || 0) > 0;
      })
    );
  }

  /**
   * Verificar si puede usar la ayuda de video (negación de hasUsed)
   */
  canUseVideoHelp(gameSessionId: string): Observable<boolean> {
    return this.hasUsedVideoHelp(gameSessionId).pipe(
      map(hasUsed => !hasUsed)
    );
  }

  // ==================== ESTADÍSTICAS ====================

  /**
   * Obtener estadísticas de un video
   */
  getVideoStats(videoId: string): Observable<VideoStats> {
    return from(
      this.supabase
        .from('video_help_sessions')
        .select('*')
        .eq('video_id', videoId)
    ).pipe(
      map(response => {
        if (response.error) throw response.error;

        const sessions = response.data || [];
        const completedSessions = sessions.filter(s => s.mini_game_completed);

        // Calcular estadísticas
        const totalViews = sessions.length;
        const totalCompletions = completedSessions.length;
        const completionRate = totalViews > 0 ? (totalCompletions / totalViews) * 100 : 0;

        const avgAttempts = completedSessions.length > 0
          ? completedSessions.reduce((sum, s) => sum + s.mini_game_attempts, 0) / completedSessions.length
          : 0;

        const uniqueUsers = new Set(sessions.map(s => s.user_id)).size;

        return {
          video_id: videoId,
          total_views: totalViews,
          total_completions: totalCompletions,
          completion_rate: Math.round(completionRate),
          avg_attempts: Math.round(avgAttempts * 10) / 10,
          unique_users: uniqueUsers
        };
      })
    );
  }

  /**
   * Incrementar contador de vistas
   */
  incrementViewCount(videoId: string): Observable<void> {
    return from(
      this.supabase.rpc('increment_video_view_count', { video_id: videoId })
    ).pipe(
      catchError(() => {
        // Fallback: actualizar manualmente
        return from(
          this.supabase
            .from('educational_videos')
            .select('view_count')
            .eq('id', videoId)
            .single()
        ).pipe(
          switchMap(response => {
            if (response.error) throw response.error;
            const currentCount = response.data.view_count || 0;
            return from(
              this.supabase
                .from('educational_videos')
                .update({ view_count: currentCount + 1 })
                .eq('id', videoId)
            );
          })
        );
      }),
      map(() => {})
    );
  }

  /**
   * Incrementar contador de completaciones exitosas
   */
  incrementSuccessCount(videoId: string): Observable<void> {
    return from(
      this.supabase.rpc('increment_video_success_count', { video_id: videoId })
    ).pipe(
      catchError(() => {
        // Fallback: actualizar manualmente
        return from(
          this.supabase
            .from('educational_videos')
            .select('success_count')
            .eq('id', videoId)
            .single()
        ).pipe(
          switchMap(response => {
            if (response.error) throw response.error;
            const currentCount = response.data.success_count || 0;
            return from(
              this.supabase
                .from('educational_videos')
                .update({ success_count: currentCount + 1 })
                .eq('id', videoId)
            );
          })
        );
      }),
      map(() => {})
    );
  }

  // ==================== HELPERS ====================

  /**
   * Extraer ID de YouTube de una URL
   */
  extractYouTubeId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Generar URL de thumbnail desde ID de YouTube
   */
  generateThumbnailUrl(videoId: string): string {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }

  /**
   * Validar que una URL sea de YouTube
   */
  validateYouTubeUrl(url: string): boolean {
    return this.extractYouTubeId(url) !== null;
  }

  /**
   * Construir URL completa de YouTube desde un ID
   */
  buildYouTubeUrl(videoId: string): string {
    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  /**
   * Construir URL de embed de YouTube
   */
  buildYouTubeEmbedUrl(videoId: string): string {
    return `https://www.youtube.com/embed/${videoId}`;
  }

  /**
   * Actualizar solo los pasos de un video
   */
  updateVideoSteps(videoId: string, steps: Partial<VideoStep>[]): Observable<void> {
    // Primero eliminar pasos existentes
    return from(
      this.supabase
        .from('video_steps')
        .delete()
        .eq('video_id', videoId)
    ).pipe(
      switchMap(() => {
        // Crear nuevos pasos
        const stepsToInsert = steps.map(step => ({
          video_id: videoId,
          order_index: step.order_index,
          step_text: step.step_text,
          hint: step.hint || null
        }));

        return from(
          this.supabase
            .from('video_steps')
            .insert(stepsToInsert)
        );
      }),
      map(() => {})
    );
  }
}
