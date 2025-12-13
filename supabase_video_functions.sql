-- =====================================================
-- FUNCIONES AUXILIARES PARA VIDEO HELP
-- =====================================================

-- Función para incrementar el contador de vistas de un video
CREATE OR REPLACE FUNCTION increment_video_view_count(video_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE educational_videos
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para incrementar el contador de éxitos de un video
CREATE OR REPLACE FUNCTION increment_video_success_count(video_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE educational_videos
  SET success_count = COALESCE(success_count, 0) + 1
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios
COMMENT ON FUNCTION increment_video_view_count(UUID) IS
'Incrementa el contador de visualizaciones de un video educativo';

COMMENT ON FUNCTION increment_video_success_count(UUID) IS
'Incrementa el contador de completaciones exitosas de un video educativo';
