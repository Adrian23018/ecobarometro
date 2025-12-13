-- =====================================================
-- MIGRATION: Sistema de Videos Educativos
-- Fecha: 2025-12-12
-- Descripción: Tablas para videos de YouTube con mini-juego de ordenar pasos
-- =====================================================

-- Tabla: educational_videos
-- Almacena videos de YouTube con metadata
CREATE TABLE IF NOT EXISTS educational_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  youtube_url VARCHAR(500) NOT NULL,
  youtube_video_id VARCHAR(50) NOT NULL,
  thumbnail_url VARCHAR(500),
  duration_seconds INTEGER,
  completion_threshold INTEGER DEFAULT 50 CHECK (completion_threshold BETWEEN 1 AND 100),
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_videos_admin ON educational_videos(admin_id) WHERE is_active = true;
CREATE INDEX idx_videos_active ON educational_videos(is_active);

COMMENT ON TABLE educational_videos IS 'Videos educativos de YouTube para sistema de ayuda en el juego';
COMMENT ON COLUMN educational_videos.completion_threshold IS 'Porcentaje del video que debe verse para desbloquear mini-juego (default: 50%)';

-- Tabla: video_steps
-- Pasos del mini-juego de ordenamiento
CREATE TABLE IF NOT EXISTS video_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES educational_videos(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  step_text TEXT NOT NULL,
  hint TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_video_step UNIQUE(video_id, order_index)
);

CREATE INDEX idx_video_steps ON video_steps(video_id, order_index);

COMMENT ON TABLE video_steps IS 'Pasos ordenados que el usuario debe organizar en el mini-juego';
COMMENT ON COLUMN video_steps.order_index IS 'Orden correcto del paso (1, 2, 3, ...)';

-- Tabla: video_help_sessions
-- Tracking de uso del sistema de ayuda por video
CREATE TABLE IF NOT EXISTS video_help_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES educational_videos(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  watch_percentage INTEGER DEFAULT 0 CHECK (watch_percentage BETWEEN 0 AND 100),
  mini_game_completed BOOLEAN DEFAULT false,
  mini_game_attempts INTEGER DEFAULT 0,
  time_bonus_earned INTEGER DEFAULT 0,
  points_bonus_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT one_help_per_session UNIQUE(game_session_id)
);

CREATE INDEX idx_video_help_user ON video_help_sessions(user_id);
CREATE INDEX idx_video_help_session ON video_help_sessions(game_session_id);
CREATE INDEX idx_video_help_video ON video_help_sessions(video_id);

COMMENT ON TABLE video_help_sessions IS 'Registro de uso del sistema de ayuda con video (1 por partida)';
COMMENT ON CONSTRAINT one_help_per_session ON video_help_sessions IS 'Un usuario solo puede usar la ayuda de video una vez por partida';

-- Función: Actualizar updated_at en educational_videos
CREATE OR REPLACE FUNCTION update_educational_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_educational_videos_updated_at
  BEFORE UPDATE ON educational_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_educational_videos_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE educational_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_help_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Admins pueden gestionar sus propios videos
CREATE POLICY "Admins can manage their videos" ON educational_videos
  FOR ALL
  USING (admin_id = auth.uid()::uuid);

-- Policy: Usuarios pueden ver videos activos de su admin
CREATE POLICY "Users can view active videos" ON educational_videos
  FOR SELECT
  USING (
    is_active = true AND
    admin_id IN (
      SELECT admin_id FROM users WHERE id = auth.uid()::uuid
    )
  );

-- Policy: Admins pueden gestionar pasos de sus videos
CREATE POLICY "Admins can manage video steps" ON video_steps
  FOR ALL
  USING (
    video_id IN (
      SELECT id FROM educational_videos WHERE admin_id = auth.uid()::uuid
    )
  );

-- Policy: Usuarios pueden ver pasos de videos activos
CREATE POLICY "Users can view video steps" ON video_steps
  FOR SELECT
  USING (
    video_id IN (
      SELECT id FROM educational_videos WHERE is_active = true
    )
  );

-- Policy: Usuarios pueden gestionar sus propias sesiones de ayuda
CREATE POLICY "Users manage their help sessions" ON video_help_sessions
  FOR ALL
  USING (user_id = auth.uid()::uuid);

-- Policy: Admins pueden ver sesiones de ayuda de sus usuarios
CREATE POLICY "Admins can view help sessions" ON video_help_sessions
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE admin_id = (
        SELECT admin_id FROM admins WHERE id = auth.uid()::uuid
      )
    )
  );

-- =====================================================
-- ACHIEVEMENT "Aprendiz Visual"
-- =====================================================

-- Nota: Este INSERT creará un achievement por cada admin activo
-- Si prefieres crear manualmente desde el panel admin, puedes omitir esta sección

DO $$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN
    SELECT id FROM admins WHERE is_active = true
  LOOP
    -- Verificar si ya existe el achievement
    IF NOT EXISTS (
      SELECT 1 FROM achievements
      WHERE admin_id = admin_record.id
      AND name = 'Aprendiz Visual'
    ) THEN
      INSERT INTO achievements (
        admin_id,
        name,
        description,
        icon,
        badge_color,
        achievement_type,
        points_required,
        is_active
      ) VALUES (
        admin_record.id,
        'Aprendiz Visual',
        'Completa tu primer video educativo y desafío correctamente',
        'fas fa-graduation-cap',
        '#8b5cf6',
        'special',
        1,
        true
      );
    END IF;
  END LOOP;
END $$;

-- =====================================================
-- VIDEO DE EJEMPLO (OPCIONAL)
-- =====================================================

-- Descomentar si quieres crear un video de ejemplo
-- Reemplaza 'YOUR_ADMIN_ID' con tu ID de admin real

/*
DO $$
DECLARE
  v_admin_id UUID := 'YOUR_ADMIN_ID'; -- REEMPLAZAR CON TU ADMIN ID
  v_video_id UUID;
BEGIN
  -- Crear video de ejemplo
  INSERT INTO educational_videos (
    admin_id,
    title,
    description,
    youtube_url,
    youtube_video_id,
    thumbnail_url,
    completion_threshold,
    is_active
  ) VALUES (
    v_admin_id,
    'Importancia del Cuidado del Agua',
    'Video educativo sobre la importancia de cuidar el agua y cómo podemos contribuir en nuestra vida diaria.',
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'dQw4w9WgXcQ',
    'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    50,
    true
  ) RETURNING id INTO v_video_id;

  -- Crear pasos para el mini-juego
  INSERT INTO video_steps (video_id, order_index, step_text, hint) VALUES
    (v_video_id, 1, 'Cerrar el grifo mientras te cepillas los dientes', 'El primer paso es evitar desperdicios básicos'),
    (v_video_id, 2, 'Reparar fugas y goteras en tu hogar', 'Segundo paso es arreglar problemas existentes'),
    (v_video_id, 3, 'Reutilizar el agua de lavar verduras para regar plantas', 'Luego podemos reutilizar el agua'),
    (v_video_id, 4, 'Instalar dispositivos ahorradores de agua', 'Finalmente optimizamos con tecnología');

  RAISE NOTICE 'Video de ejemplo creado con ID: %', v_video_id;
END $$;
*/

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Ver estructura de tablas creadas
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('educational_videos', 'video_steps', 'video_help_sessions')
ORDER BY table_name;

-- Ver políticas RLS
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('educational_videos', 'video_steps', 'video_help_sessions')
ORDER BY tablename, policyname;

-- =====================================================
-- FIN DE MIGRATION
-- =====================================================

-- INSTRUCCIONES POST-MIGRATION:
-- 1. Ejecuta este script completo en el SQL Editor de Supabase
-- 2. Verifica que las 3 tablas se crearon correctamente
-- 3. Verifica que las políticas RLS están activas
-- 4. (Opcional) Descomenta y ejecuta la sección de video de ejemplo
-- 5. Continúa con la implementación del código Angular
