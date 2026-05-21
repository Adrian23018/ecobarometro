-- Agregar columna questions_per_game a la tabla admins
-- Ejecutar en Supabase SQL Editor

ALTER TABLE public.admins
ADD COLUMN IF NOT EXISTS questions_per_game INTEGER DEFAULT 15;
