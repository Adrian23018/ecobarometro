# Guía para agregar preguntas de prueba

## Esquema de Base de Datos

Tu base de datos tiene la siguiente estructura:

### Tabla `questions`
- `id` (uuid) - PK
- `admin_id` (uuid) - FK a `admins`
- `category_id` (uuid) - FK a `categories`
- `question_text` (text) - Texto de la pregunta
- `question_type` (varchar) - Tipo: 'multiple_choice', 'true_false', 'scale'
- `points` (integer) - Puntos base (default: 10)
- `difficulty_level` (integer) - 1=Fácil, 2=Medio, 3=Difícil
- `order_index` (integer) - Orden de aparición
- `is_active` (boolean) - Si está activa

### Tabla `question_options`
- `id` (uuid) - PK
- `question_id` (uuid) - FK a `questions`
- `option_text` (text) - Texto de la opción
- `is_correct` (boolean) - Si es correcta
- `points` (integer) - Puntos de esta opción
- `order_index` (integer) - Orden de aparición

## Opción 1: Usar SQL directo en Supabase (RECOMENDADO)

### Paso 1: Obtener IDs necesarios

Ejecuta esto en el SQL Editor de Supabase:

```sql
-- 1. Obtener tu admin_id
SELECT id, email FROM admins WHERE email = 'tu_email@ejemplo.com';

-- 2. Ver categorías existentes o crear una nueva
SELECT id, name FROM categories WHERE admin_id = 'TU_ADMIN_ID';

-- O crear una categoría nueva:
INSERT INTO categories (admin_id, name, description, icon, color, is_active)
VALUES (
  'TU_ADMIN_ID'::uuid,
  'Medio Ambiente',
  'Preguntas sobre ecología y medio ambiente',
  'pi-globe',
  '#10b981',
  true
) RETURNING id, name;
```

### Paso 2: Ejecutar el script completo

1. Abre el archivo `add-sample-questions.sql` en esta carpeta
2. Reemplaza **todas** las ocurrencias de:
   - `'TU_ADMIN_ID'` con tu admin_id real (ej: `'5c23aa52-64b2-4b61-982a-dfc6997b676a'`)
   - `'TU_CATEGORY_ID'` con tu category_id real
3. Ejecuta el script completo en el SQL Editor de Supabase
4. Verás mensajes "Pregunta X creada con ID: ..."

### Paso 3: Verificar

Ejecuta la query de verificación al final del script para ver todas las preguntas creadas.

## Opción 2: Usar la interfaz de administración

Si prefieres crear las preguntas manualmente:

1. Inicia sesión como administrador
2. Ve a "Gestión de Preguntas"
3. Haz clic en "Nueva Pregunta"

### Pregunta 1 (Fácil - 10 puntos)
- **Texto**: ¿Cuál es el principal gas de efecto invernadero responsable del calentamiento global?
- **Tipo**: Opción múltiple
- **Dificultad**: 1 (Fácil)
- **Puntos**: 10
- **Opciones**:
  1. Oxígeno → Incorrecta
  2. Dióxido de Carbono (CO2) → **Correcta**
  3. Nitrógeno → Incorrecta
  4. Hidrógeno → Incorrecta

### Pregunta 2 (Media - 15 puntos)
- **Texto**: ¿Cuánto tiempo tarda en degradarse una botella de plástico en el medio ambiente?
- **Tipo**: Opción múltiple
- **Dificultad**: 2 (Media)
- **Puntos**: 15
- **Opciones**:
  1. 10 años → Incorrecta
  2. 100 años → Incorrecta
  3. 450 años → **Correcta**
  4. 50 años → Incorrecta

### Pregunta 3 (Fácil - 10 puntos)
- **Texto**: ¿Cuál de las siguientes NO es una fuente de energía renovable?
- **Tipo**: Opción múltiple
- **Dificultad**: 1 (Fácil)
- **Puntos**: 10
- **Opciones**:
  1. Energía Solar → Incorrecta
  2. Energía Eólica → Incorrecta
  3. Carbón → **Correcta**
  4. Energía Hidroeléctrica → Incorrecta

### Pregunta 4 (Difícil - 20 puntos)
- **Texto**: ¿Qué porcentaje de las especies del planeta vive en los bosques tropicales?
- **Tipo**: Opción múltiple
- **Dificultad**: 3 (Difícil)
- **Puntos**: 20
- **Opciones**:
  1. 30% → Incorrecta
  2. 50% → Incorrecta
  3. 80% → **Correcta**
  4. 20% → Incorrecta

### Pregunta 5 (Media - 15 puntos)
- **Texto**: ¿Qué porcentaje del agua de la Tierra es agua dulce disponible para consumo humano?
- **Tipo**: Opción múltiple
- **Dificultad**: 2 (Media)
- **Puntos**: 15
- **Opciones**:
  1. 10% → Incorrecta
  2. 3% → **Correcta**
  3. 15% → Incorrecta
  4. 25% → Incorrecta

### Pregunta 6 (Fácil - 10 puntos)
- **Texto**: ¿Cuál es la principal fuente de contaminación del aire en las ciudades?
- **Tipo**: Opción múltiple
- **Dificultad**: 1 (Fácil)
- **Puntos**: 10
- **Opciones**:
  1. Industrias → Incorrecta
  2. Vehículos automotores → **Correcta**
  3. Agricultura → Incorrecta
  4. Residuos domésticos → Incorrecta

### Pregunta 7 (Difícil - 20 puntos)
- **Texto**: ¿Cuántos árboles se estima que se talan por minuto en el mundo?
- **Tipo**: Opción múltiple
- **Dificultad**: 3 (Difícil)
- **Puntos**: 20
- **Opciones**:
  1. 100 árboles → Incorrecta
  2. 500 árboles → Incorrecta
  3. 2,000 árboles → **Correcta**
  4. 50 árboles → Incorrecta

### Pregunta 8 (Media - 15 puntos)
- **Texto**: ¿Cuál electrodoméstico consume más energía en un hogar promedio?
- **Tipo**: Opción múltiple
- **Dificultad**: 2 (Media)
- **Puntos**: 15
- **Opciones**:
  1. Televisor → Incorrecta
  2. Refrigerador → **Correcta**
  3. Computadora → Incorrecta
  4. Lavadora → Incorrecta

### Pregunta 9 (Difícil - 20 puntos)
- **Texto**: ¿Qué porcentaje de oxígeno que respiramos proviene de los océanos?
- **Tipo**: Opción múltiple
- **Dificultad**: 3 (Difícil)
- **Puntos**: 20
- **Opciones**:
  1. 25% → Incorrecta
  2. 50% → **Correcta**
  3. 10% → Incorrecta
  4. 75% → Incorrecta

### Pregunta 10 (Media - 15 puntos)
- **Texto**: ¿Cuál de estas acciones reduce más tu huella de carbono?
- **Tipo**: Opción múltiple
- **Dificultad**: 2 (Media)
- **Puntos**: 15
- **Opciones**:
  1. Reciclar papel → Incorrecta
  2. Usar transporte público o bicicleta → **Correcta**
  3. Apagar las luces → Incorrecta
  4. Cerrar el grifo al lavarse los dientes → Incorrecta

## Verificación Final

Después de agregar las preguntas, verifica que todo esté correcto:

```sql
-- Ver resumen de preguntas
SELECT
  q.id,
  LEFT(q.question_text, 50) as pregunta,
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
  AND q.is_active = true
GROUP BY q.id, q.question_text, q.difficulty_level, q.points
ORDER BY q.order_index;

-- Contar total
SELECT COUNT(*) as total_preguntas
FROM questions
WHERE admin_id = 'TU_ADMIN_ID'::uuid
  AND is_active = true;
```

## Notas Importantes

- Cada pregunta debe tener exactamente **1 opción correcta**
- Las preguntas se cargan aleatoriamente en cada juego
- El campo `difficulty_level` es numérico: 1 (Fácil), 2 (Medio), 3 (Difícil)
- Los puntos base son: Fácil=10, Media=15, Difícil=20
- Asegúrate de que `is_active = true` para que aparezcan en el juego
- El `order_index` solo se usa si quieres un orden específico en el admin

## Campos Opcionales en el Modelo

El modelo de TypeScript incluye campos opcionales que **no están en tu esquema actual**:
- `explanation` - Explicación de la respuesta (puedes agregarlo a tu BD si quieres)
- `time_limit` - Tiempo límite personalizado por pregunta (también opcional)
- `hint` - Pista para ayudar (no existe en tu esquema)
- `image_url` - Imagen de la pregunta (no existe en tu esquema)

Si quieres agregar estos campos a futuro, necesitarás modificar tu esquema con:

```sql
ALTER TABLE questions ADD COLUMN explanation text;
ALTER TABLE questions ADD COLUMN time_limit integer DEFAULT 30;
ALTER TABLE questions ADD COLUMN hint text;
ALTER TABLE questions ADD COLUMN image_url text;
```
