# Guía para Administradores - EcoBarómetro

## Cómo Acceder al Panel de Administración

### 1. Inicia Sesión como Administrador

1. Abre tu aplicación: `http://localhost:4200`
2. Haz clic en **"Iniciar Sesión"**
3. Ingresa tus credenciales de administrador:
   - **Email**: El email con el que te registraste como admin
   - **Contraseña**: Tu contraseña de administrador

### 2. Rutas del Panel Admin

Una vez que inicies sesión como administrador, podrás acceder a:

#### Panel Principal
- **Dashboard**: `http://localhost:4200/admin/dashboard`

#### Gestión de Categorías
- **Lista de Categorías**: `http://localhost:4200/admin/categories`
  - Aquí puedes crear, editar y eliminar categorías
  - Cada categoría tiene: nombre, descripción, icono y color

#### Gestión de Preguntas
- **Lista de Preguntas**: `http://localhost:4200/admin/questions`
  - Ver todas tus preguntas
  - Filtrar por categoría, dificultad, tipo
  - Editar o eliminar preguntas existentes

- **Crear Pregunta**: `http://localhost:4200/admin/questions/create`
  - Formulario para crear nuevas preguntas
  - Puedes agregar opciones de respuesta
  - Configurar puntos y dificultad

#### Gestión de Usuarios
- **Lista de Usuarios**: `http://localhost:4200/admin/users`
  - Ver todos los usuarios registrados bajo tu código de admin
  - Ver estadísticas de cada usuario

#### Otras Secciones
- **Logros**: `http://localhost:4200/admin/achievements`
- **Análisis**: `http://localhost:4200/admin/analytics`
- **Configuración**: `http://localhost:4200/admin/settings`
- **Mi Perfil**: `http://localhost:4200/admin/profile`

## Cómo Crear Categorías

### Paso a Paso

1. **Ve a Gestión de Categorías**
   ```
   http://localhost:4200/admin/categories
   ```

2. **Haz clic en "Nueva Categoría"**

3. **Completa el formulario:**
   - **Nombre**: Ej. "Energía Renovable"
   - **Descripción**: Breve descripción del tema
   - **Icono**: Selecciona un icono del dropdown
   - **Color**: Elige un color (usa el selector o escribe el código hex)

4. **Vista Previa**: Verás cómo se ve tu categoría antes de crearla

5. **Haz clic en "Crear"**

### Características de las Categorías

- ✅ **Crear** categorías nuevas
- ✅ **Editar** categorías existentes
- ✅ **Eliminar** categorías (cuidado: esto puede afectar las preguntas)
- ✅ **Reordenar** categorías arrastrando y soltando
- ✅ Ver cuántas preguntas tiene cada categoría

## Cómo Crear Preguntas

### Opción 1: Usando la Interfaz Web (RECOMENDADO)

1. **Ve a Gestión de Preguntas**
   ```
   http://localhost:4200/admin/questions
   ```

2. **Haz clic en "Nueva Pregunta" o el botón "+"**

3. **Completa el formulario:**

   **Datos Básicos:**
   - **Texto de la Pregunta**: La pregunta que verán los usuarios
   - **Categoría**: Selecciona una categoría (debes crear categorías primero)
   - **Tipo**: Opción Múltiple, Verdadero/Falso, o Escala
   - **Puntos**: Cuántos puntos vale (recomendado: 10 fácil, 15 medio, 20 difícil)
   - **Dificultad**: 1 (Fácil), 2 (Medio), 3 (Difícil)

   **Opciones de Respuesta** (para Opción Múltiple):
   - Agrega mínimo 2 opciones, máximo 4-5
   - Marca cuál es la respuesta correcta
   - Puedes agregar explicación a cada opción

   **Configuración Avanzada** (opcional):
   - **Tiempo límite**: Segundos para responder (default: 30s)
   - **Explicación**: Mensaje que se muestra después de responder
   - **Orden**: En qué posición aparece la pregunta

4. **Haz clic en "Guardar"**

### Opción 2: Importar Preguntas Masivamente (SQL)

Si tienes muchas preguntas para crear, usa el script SQL:

1. **Obtén tu Admin ID:**
   ```sql
   SELECT id, email FROM admins WHERE email = 'tu_email@ejemplo.com';
   ```

2. **Obtén o crea una categoría:**
   ```sql
   SELECT id, name FROM categories WHERE admin_id = 'TU_ADMIN_ID';
   ```

3. **Usa el script preparado:**
   - Abre `scripts/add-sample-questions.sql`
   - Reemplaza `'TU_ADMIN_ID'` con tu ID real
   - Reemplaza `'TU_CATEGORY_ID'` con el ID de tu categoría
   - Ejecuta el script en Supabase SQL Editor

4. **Verifica:**
   ```sql
   SELECT COUNT(*) FROM questions WHERE admin_id = 'TU_ADMIN_ID'::uuid;
   ```

## Estructura de una Pregunta

Según tu esquema de base de datos actual:

```typescript
{
  question_text: string,        // Texto de la pregunta
  category_id: uuid,             // ID de la categoría
  question_type: string,         // 'multiple_choice', 'true_false', 'scale'
  points: number,                // Puntos base (10, 15, 20)
  difficulty_level: number,      // 1 (Fácil), 2 (Medio), 3 (Difícil)
  order_index: number,           // Orden de aparición
  is_active: boolean             // true para mostrar en el juego
}
```

**Opciones de Respuesta:**
```typescript
{
  option_text: string,           // Texto de la opción
  is_correct: boolean,           // true si es la respuesta correcta
  points: number,                // Puntos de esta opción (0 si incorrecta)
  order_index: number            // Orden de aparición
}
```

## Campos Opcionales que Puedes Agregar

Si quieres extender tu esquema para tener más funcionalidades:

```sql
-- Agregar explicación a las preguntas
ALTER TABLE questions ADD COLUMN explanation text;

-- Agregar tiempo límite personalizado por pregunta
ALTER TABLE questions ADD COLUMN time_limit integer DEFAULT 30;

-- Agregar pista para ayudar
ALTER TABLE questions ADD COLUMN hint text;

-- Agregar imagen a la pregunta
ALTER TABLE questions ADD COLUMN image_url text;
```

## Tips y Buenas Prácticas

### Para Categorías:
- ✅ Crea categorías antes de crear preguntas
- ✅ Usa nombres descriptivos y concisos
- ✅ Elige colores distintos para cada categoría
- ✅ Los iconos ayudan a identificar rápidamente

### Para Preguntas:
- ✅ **Una sola respuesta correcta** por pregunta
- ✅ Usa **opciones plausibles** (que parezcan correctas)
- ✅ **Dificultad Fácil (1)**: Conocimiento básico, 10 puntos
- ✅ **Dificultad Media (2)**: Requiere pensar, 15 puntos
- ✅ **Dificultad Difícil (3)**: Conocimiento avanzado, 20 puntos
- ✅ Revisa la ortografía y gramática
- ✅ Sé claro y conciso en el texto de la pregunta
- ✅ Evita preguntas ambiguas o con trampa

### Para el Juego:
- ✅ Crea al menos **10-15 preguntas** para tener variedad
- ✅ Distribuye las dificultades (33% fácil, 34% medio, 33% difícil)
- ✅ Cubre diferentes aspectos de cada categoría
- ✅ Prueba el juego tú mismo antes de que lo usen los usuarios

## Verificar que Todo Funciona

### 1. Verifica tus Categorías
```sql
SELECT id, name, color, icon,
       (SELECT COUNT(*) FROM questions WHERE category_id = categories.id) as num_preguntas
FROM categories
WHERE admin_id = 'TU_ADMIN_ID'::uuid
ORDER BY order_index;
```

### 2. Verifica tus Preguntas
```sql
SELECT
  q.id,
  LEFT(q.question_text, 50) as pregunta,
  q.difficulty_level,
  q.points,
  c.name as categoria,
  COUNT(qo.id) as num_opciones
FROM questions q
LEFT JOIN categories c ON c.id = q.category_id
LEFT JOIN question_options qo ON qo.question_id = q.id
WHERE q.admin_id = 'TU_ADMIN_ID'::uuid
GROUP BY q.id, q.question_text, q.difficulty_level, q.points, c.name
ORDER BY q.order_index;
```

### 3. Verifica que cada pregunta tenga opciones
```sql
SELECT
  q.id,
  q.question_text,
  COUNT(qo.id) as total_opciones,
  SUM(CASE WHEN qo.is_correct THEN 1 ELSE 0 END) as respuestas_correctas
FROM questions q
LEFT JOIN question_options qo ON qo.question_id = q.id
WHERE q.admin_id = 'TU_ADMIN_ID'::uuid
GROUP BY q.id, q.question_text
HAVING COUNT(qo.id) = 0 OR SUM(CASE WHEN qo.is_correct THEN 1 ELSE 0 END) != 1;
```

Esta query mostrará preguntas con problemas (sin opciones o sin exactamente 1 respuesta correcta).

## Solución de Problemas

### "No veo la opción de crear preguntas"
- Asegúrate de haber iniciado sesión como **administrador**
- Verifica que estés en `http://localhost:4200/admin/questions`
- Revisa que el AuthService haya guardado tu sesión correctamente

### "No puedo crear preguntas sin categorías"
- Primero debes crear al menos una categoría en `/admin/categories`

### "Los usuarios no ven preguntas en el juego"
- Verifica que `is_active = true` en tus preguntas
- Asegúrate de que cada pregunta tenga al menos 2 opciones
- Verifica que haya exactamente 1 opción correcta por pregunta

### "Error al guardar pregunta"
- Revisa la consola del navegador (F12)
- Verifica que todos los campos requeridos estén llenos
- Asegúrate de tener conexión con Supabase

## Ejemplos de Preguntas de Calidad

### Pregunta Fácil (10 puntos)
```
Pregunta: ¿Cuál es el principal gas de efecto invernadero?
Opciones:
  - Oxígeno ❌
  - Dióxido de Carbono (CO2) ✅
  - Nitrógeno ❌
  - Hidrógeno ❌
```

### Pregunta Media (15 puntos)
```
Pregunta: ¿Qué porcentaje del agua de la Tierra es agua dulce?
Opciones:
  - 10% ❌
  - 3% ✅
  - 15% ❌
  - 25% ❌
```

### Pregunta Difícil (20 puntos)
```
Pregunta: ¿Qué porcentaje de oxígeno proviene de los océanos?
Opciones:
  - 25% ❌
  - 50% ✅
  - 10% ❌
  - 75% ❌
```

## Contacto y Soporte

Si tienes problemas técnicos:
1. Revisa la consola del navegador (F12)
2. Verifica que tu base de datos Supabase esté activa
3. Confirma que las tablas `questions`, `question_options` y `categories` existan
4. Asegúrate de tener los permisos correctos en Supabase

¡Listo! Ya puedes administrar tu sistema de preguntas y categorías. 🎉
