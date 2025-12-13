-- =====================================================
-- ACTUALIZACIÓN: Permitir múltiples videos por partida
-- =====================================================

-- Eliminar el constraint UNIQUE en game_session_id
-- Esto permite que los usuarios vean múltiples videos en la misma partida
ALTER TABLE video_help_sessions
DROP CONSTRAINT IF EXISTS one_help_per_session;

-- También intentar eliminar si tiene el nombre por defecto
ALTER TABLE video_help_sessions
DROP CONSTRAINT IF EXISTS video_help_sessions_game_session_id_key;

-- Agregar un índice compuesto para mejorar el rendimiento de consultas
-- pero sin restricción de unicidad
CREATE INDEX IF NOT EXISTS idx_video_help_sessions_game_question
ON video_help_sessions(game_session_id, video_id, created_at DESC);

-- Comentario de actualización
COMMENT ON TABLE video_help_sessions IS
'Sesiones de ayuda con videos educativos. Los usuarios pueden usar la ayuda múltiples veces por partida, una vez por pregunta incorrecta.';
