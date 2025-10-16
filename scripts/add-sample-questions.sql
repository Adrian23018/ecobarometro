-- Script para agregar preguntas de prueba al sistema EcoBarómetro
-- Adaptado al esquema real de la base de datos
--
-- INSTRUCCIONES:
-- 1. Obtén tu admin_id ejecutando: SELECT id FROM admins WHERE email = 'tu_email@ejemplo.com';
-- 2. Obtén o crea un category_id ejecutando: SELECT id, name FROM categories WHERE admin_id = 'TU_ADMIN_ID';
-- 3. Reemplaza 'TU_ADMIN_ID' y 'TU_CATEGORY_ID' en este script
-- 4. Ejecuta cada bloque (pregunta + opciones) en el SQL Editor de Supabase

-- ============================================================================
-- PREGUNTA 1: Cambio Climático (Fácil)
-- ============================================================================
DO $$
DECLARE
  v_question_id uuid;
BEGIN
  -- Insertar pregunta
  INSERT INTO questions (
    admin_id,
    category_id,
    question_text,
    question_type,
    points,
    difficulty_level,
    order_index,
    is_active
  ) VALUES (
    'TU_ADMIN_ID'::uuid,
    'TU_CATEGORY_ID'::uuid,
    '¿Cuál es el principal gas de efecto invernadero responsable del calentamiento global?',
    'multiple_choice',
    10,
    1, -- Fácil
    1,
    true
  ) RETURNING id INTO v_question_id;

  -- Insertar opciones
  INSERT INTO question_options (question_id, option_text, is_correct, points, order_index) VALUES
  (v_question_id, 'Oxígeno', false, 0, 1),
  (v_question_id, 'Dióxido de Carbono (CO2)', true, 10, 2),
  (v_question_id, 'Nitrógeno', false, 0, 3),
  (v_question_id, 'Hidrógeno', false, 0, 4);

  RAISE NOTICE 'Pregunta 1 creada con ID: %', v_question_id;
END $$;

-- ============================================================================
-- PREGUNTA 2: Reciclaje (Media)
-- ============================================================================
DO $$
DECLARE
  v_question_id uuid;
BEGIN
  INSERT INTO questions (
    admin_id,
    category_id,
    question_text,
    question_type,
    points,
    difficulty_level,
    order_index,
    is_active
  ) VALUES (
    'TU_ADMIN_ID'::uuid,
    'TU_CATEGORY_ID'::uuid,
    '¿Cuánto tiempo tarda en degradarse una botella de plástico en el medio ambiente?',
    'multiple_choice',
    15,
    2, -- Media
    2,
    true
  ) RETURNING id INTO v_question_id;

  INSERT INTO question_options (question_id, option_text, is_correct, points, order_index) VALUES
  (v_question_id, '10 años', false, 0, 1),
  (v_question_id, '100 años', false, 0, 2),
  (v_question_id, '450 años', true, 15, 3),
  (v_question_id, '50 años', false, 0, 4);

  RAISE NOTICE 'Pregunta 2 creada con ID: %', v_question_id;
END $$;

-- ============================================================================
-- PREGUNTA 3: Energías Renovables (Fácil)
-- ============================================================================
DO $$
DECLARE
  v_question_id uuid;
BEGIN
  INSERT INTO questions (
    admin_id,
    category_id,
    question_text,
    question_type,
    points,
    difficulty_level,
    order_index,
    is_active
  ) VALUES (
    'TU_ADMIN_ID'::uuid,
    'TU_CATEGORY_ID'::uuid,
    '¿Cuál de las siguientes NO es una fuente de energía renovable?',
    'multiple_choice',
    10,
    1, -- Fácil
    3,
    true
  ) RETURNING id INTO v_question_id;

  INSERT INTO question_options (question_id, option_text, is_correct, points, order_index) VALUES
  (v_question_id, 'Energía Solar', false, 0, 1),
  (v_question_id, 'Energía Eólica', false, 0, 2),
  (v_question_id, 'Carbón', true, 10, 3),
  (v_question_id, 'Energía Hidroeléctrica', false, 0, 4);

  RAISE NOTICE 'Pregunta 3 creada con ID: %', v_question_id;
END $$;

-- ============================================================================
-- PREGUNTA 4: Biodiversidad (Difícil)
-- ============================================================================
DO $$
DECLARE
  v_question_id uuid;
BEGIN
  INSERT INTO questions (
    admin_id,
    category_id,
    question_text,
    question_type,
    points,
    difficulty_level,
    order_index,
    is_active
  ) VALUES (
    'TU_ADMIN_ID'::uuid,
    'TU_CATEGORY_ID'::uuid,
    '¿Qué porcentaje de las especies del planeta vive en los bosques tropicales?',
    'multiple_choice',
    20,
    3, -- Difícil
    4,
    true
  ) RETURNING id INTO v_question_id;

  INSERT INTO question_options (question_id, option_text, is_correct, points, order_index) VALUES
  (v_question_id, '30%', false, 0, 1),
  (v_question_id, '50%', false, 0, 2),
  (v_question_id, '80%', true, 20, 3),
  (v_question_id, '20%', false, 0, 4);

  RAISE NOTICE 'Pregunta 4 creada con ID: %', v_question_id;
END $$;

-- ============================================================================
-- PREGUNTA 5: Agua (Media)
-- ============================================================================
DO $$
DECLARE
  v_question_id uuid;
BEGIN
  INSERT INTO questions (
    admin_id,
    category_id,
    question_text,
    question_type,
    points,
    difficulty_level,
    order_index,
    is_active
  ) VALUES (
    'TU_ADMIN_ID'::uuid,
    'TU_CATEGORY_ID'::uuid,
    '¿Qué porcentaje del agua de la Tierra es agua dulce disponible para consumo humano?',
    'multiple_choice',
    15,
    2, -- Media
    5,
    true
  ) RETURNING id INTO v_question_id;

  INSERT INTO question_options (question_id, option_text, is_correct, points, order_index) VALUES
  (v_question_id, '10%', false, 0, 1),
  (v_question_id, '3%', true, 15, 2),
  (v_question_id, '15%', false, 0, 3),
  (v_question_id, '25%', false, 0, 4);

  RAISE NOTICE 'Pregunta 5 creada con ID: %', v_question_id;
END $$;

-- ============================================================================
-- PREGUNTA 6: Contaminación (Fácil)
-- ============================================================================
DO $$
DECLARE
  v_question_id uuid;
BEGIN
  INSERT INTO questions (
    admin_id,
    category_id,
    question_text,
    question_type,
    points,
    difficulty_level,
    order_index,
    is_active
  ) VALUES (
    'TU_ADMIN_ID'::uuid,
    'TU_CATEGORY_ID'::uuid,
    '¿Cuál es la principal fuente de contaminación del aire en las ciudades?',
    'multiple_choice',
    10,
    1, -- Fácil
    6,
    true
  ) RETURNING id INTO v_question_id;

  INSERT INTO question_options (question_id, option_text, is_correct, points, order_index) VALUES
  (v_question_id, 'Industrias', false, 0, 1),
  (v_question_id, 'Vehículos automotores', true, 10, 2),
  (v_question_id, 'Agricultura', false, 0, 3),
  (v_question_id, 'Residuos domésticos', false, 0, 4);

  RAISE NOTICE 'Pregunta 6 creada con ID: %', v_question_id;
END $$;

-- ============================================================================
-- PREGUNTA 7: Deforestación (Difícil)
-- ============================================================================
DO $$
DECLARE
  v_question_id uuid;
BEGIN
  INSERT INTO questions (
    admin_id,
    category_id,
    question_text,
    question_type,
    points,
    difficulty_level,
    order_index,
    is_active
  ) VALUES (
    'TU_ADMIN_ID'::uuid,
    'TU_CATEGORY_ID'::uuid,
    '¿Cuántos árboles se estima que se talan por minuto en el mundo?',
    'multiple_choice',
    20,
    3, -- Difícil
    7,
    true
  ) RETURNING id INTO v_question_id;

  INSERT INTO question_options (question_id, option_text, is_correct, points, order_index) VALUES
  (v_question_id, '100 árboles', false, 0, 1),
  (v_question_id, '500 árboles', false, 0, 2),
  (v_question_id, '2,000 árboles', true, 20, 3),
  (v_question_id, '50 árboles', false, 0, 4);

  RAISE NOTICE 'Pregunta 7 creada con ID: %', v_question_id;
END $$;

-- ============================================================================
-- PREGUNTA 8: Energía en el hogar (Media)
-- ============================================================================
DO $$
DECLARE
  v_question_id uuid;
BEGIN
  INSERT INTO questions (
    admin_id,
    category_id,
    question_text,
    question_type,
    points,
    difficulty_level,
    order_index,
    is_active
  ) VALUES (
    'TU_ADMIN_ID'::uuid,
    'TU_CATEGORY_ID'::uuid,
    '¿Cuál electrodoméstico consume más energía en un hogar promedio?',
    'multiple_choice',
    15,
    2, -- Media
    8,
    true
  ) RETURNING id INTO v_question_id;

  INSERT INTO question_options (question_id, option_text, is_correct, points, order_index) VALUES
  (v_question_id, 'Televisor', false, 0, 1),
  (v_question_id, 'Refrigerador', true, 15, 2),
  (v_question_id, 'Computadora', false, 0, 3),
  (v_question_id, 'Lavadora', false, 0, 4);

  RAISE NOTICE 'Pregunta 8 creada con ID: %', v_question_id;
END $$;

-- ============================================================================
-- PREGUNTA 9: Océanos (Difícil)
-- ============================================================================
DO $$
DECLARE
  v_question_id uuid;
BEGIN
  INSERT INTO questions (
    admin_id,
    category_id,
    question_text,
    question_type,
    points,
    difficulty_level,
    order_index,
    is_active
  ) VALUES (
    'TU_ADMIN_ID'::uuid,
    'TU_CATEGORY_ID'::uuid,
    '¿Qué porcentaje de oxígeno que respiramos proviene de los océanos?',
    'multiple_choice',
    20,
    3, -- Difícil
    9,
    true
  ) RETURNING id INTO v_question_id;

  INSERT INTO question_options (question_id, option_text, is_correct, points, order_index) VALUES
  (v_question_id, '25%', false, 0, 1),
  (v_question_id, '50%', true, 20, 2),
  (v_question_id, '10%', false, 0, 3),
  (v_question_id, '75%', false, 0, 4);

  RAISE NOTICE 'Pregunta 9 creada con ID: %', v_question_id;
END $$;

-- ============================================================================
-- PREGUNTA 10: Huella de Carbono (Media)
-- ============================================================================
DO $$
DECLARE
  v_question_id uuid;
BEGIN
  INSERT INTO questions (
    admin_id,
    category_id,
    question_text,
    question_type,
    points,
    difficulty_level,
    order_index,
    is_active
  ) VALUES (
    'TU_ADMIN_ID'::uuid,
    'TU_CATEGORY_ID'::uuid,
    '¿Cuál de estas acciones reduce más tu huella de carbono?',
    'multiple_choice',
    15,
    2, -- Media
    10,
    true
  ) RETURNING id INTO v_question_id;

  INSERT INTO question_options (question_id, option_text, is_correct, points, order_index) VALUES
  (v_question_id, 'Reciclar papel', false, 0, 1),
  (v_question_id, 'Usar transporte público o bicicleta', true, 15, 2),
  (v_question_id, 'Apagar las luces', false, 0, 3),
  (v_question_id, 'Cerrar el grifo al lavarse los dientes', false, 0, 4);

  RAISE NOTICE 'Pregunta 10 creada con ID: %', v_question_id;
END $$;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Ejecuta esto al final para verificar que se crearon correctamente
SELECT
  q.id,
  q.question_text,
  q.difficulty_level,
  CASE q.difficulty_level
    WHEN 1 THEN 'Fácil'
    WHEN 2 THEN 'Media'
    WHEN 3 THEN 'Difícil'
  END as dificultad,
  q.points,
  COUNT(qo.id) as num_opciones,
  SUM(CASE WHEN qo.is_correct THEN 1 ELSE 0 END) as respuestas_correctas
FROM questions q
LEFT JOIN question_options qo ON qo.question_id = q.id
WHERE q.admin_id = 'TU_ADMIN_ID'::uuid
GROUP BY q.id, q.question_text, q.difficulty_level, q.points
ORDER BY q.order_index;
