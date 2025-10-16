-- ========================================
-- Script para Crear Administrador Directamente en Supabase
-- ========================================

-- INSTRUCCIONES:
-- 1. Ve a tu proyecto de Supabase
-- 2. Abre el "SQL Editor"
-- 3. Copia y pega este script
-- 4. MODIFICA los valores según tus datos
-- 5. Ejecuta el script

-- ========================================
-- OPCIÓN 1: Crear Admin con Contraseña Simple (SIN SALT)
-- ========================================

-- Este método es más fácil para empezar
-- La contraseña se hashea con btoa() simple

INSERT INTO public.admins (
  email,
  password_hash,
  name,
  company,
  admin_code,
  is_active
) VALUES (
  'adrian.cardenas@correounivalle.edu.co',  -- TU EMAIL
  encode(convert_to('Cambiame123', 'UTF8'), 'base64'),  -- TU CONTRASEÑA (cambia 'Cambiame123')
  'Adrian Cárdenas',  -- TU NOMBRE
  'Universidad del Valle',  -- TU EMPRESA/ORGANIZACIÓN
  'UVALL2024',  -- CÓDIGO DE ADMIN (compártelo con tus usuarios)
  true  -- Cuenta activa
);

-- ========================================
-- VERIFICAR QUE SE CREÓ CORRECTAMENTE
-- ========================================

SELECT
  id,
  email,
  name,
  company,
  admin_code,
  is_active,
  created_at
FROM public.admins
WHERE email = 'adrian.cardenas@correounivalle.edu.co';

-- ========================================
-- NOTAS IMPORTANTES
-- ========================================

-- 1. CONTRASEÑA:
--    La contraseña que uses aquí ('Cambiame123') será la que uses para hacer login.
--    El sistema la hasheará automáticamente con btoa().

-- 2. ADMIN_CODE:
--    Este código es lo que tus USUARIOS necesitan para registrarse.
--    Ejemplo: Si tu código es 'UVALL2024', tus usuarios lo ingresan al registrarse.

-- 3. FORMATO DEL HASH:
--    El sistema ahora soporta DOS formatos:
--    - Hash simple: btoa(password) -> Sin punto
--    - Hash con salt: btoa(password + salt) + '.' + salt -> Con punto
--
--    Este script usa el formato SIMPLE (sin salt) para facilidad.

-- ========================================
-- EJEMPLO DE USO DESPUÉS DE CREAR EL ADMIN
-- ========================================

-- En la interfaz web (http://localhost:4200/auth/login):
-- Email: adrian.cardenas@correounivalle.edu.co
-- Contraseña: Cambiame123

-- ========================================
-- OPCIÓN 2: Crear Admin con Contraseña + SALT (Más Seguro)
-- ========================================

-- Si quieres usar el método con salt, usa este script en su lugar:

/*
DO $$
DECLARE
  v_password TEXT := 'Cambiame123';  -- Cambia esta contraseña
  v_salt TEXT := substring(md5(random()::text) from 1 for 13);
  v_hash TEXT;
BEGIN
  -- Generar hash: btoa(password + salt) + '.' + salt
  v_hash := encode(convert_to(v_password || v_salt, 'UTF8'), 'base64') || '.' || v_salt;

  -- Insertar admin
  INSERT INTO public.admins (
    email,
    password_hash,
    name,
    company,
    admin_code,
    is_active
  ) VALUES (
    'adrian.cardenas@correounivalle.edu.co',
    v_hash,
    'Adrian Cárdenas',
    'Universidad del Valle',
    'UVALL2024',
    true
  );

  RAISE NOTICE 'Admin creado con hash: %', v_hash;
END $$;
*/

-- ========================================
-- TROUBLESHOOTING
-- ========================================

-- Si el admin ya existe y quieres actualizarlo:

/*
UPDATE public.admins
SET
  password_hash = encode(convert_to('NuevaContraseña123', 'UTF8'), 'base64'),
  admin_code = 'NUEVOCODIGO',
  is_active = true
WHERE email = 'adrian.cardenas@correounivalle.edu.co';
*/

-- Si quieres eliminar el admin y crearlo de nuevo:

/*
DELETE FROM public.admins
WHERE email = 'adrian.cardenas@correounivalle.edu.co';

-- Luego ejecuta el INSERT de arriba
*/

-- ========================================
-- VERIFICAR EL HASH DE UNA CONTRASEÑA
-- ========================================

-- Para verificar cómo se ve el hash de una contraseña:

/*
SELECT encode(convert_to('Cambiame123', 'UTF8'), 'base64') as password_hash;
-- Resultado: Q2FtYmlhbWUxMjM=
*/

-- ========================================
-- USUARIOS PUEDEN REGISTRARSE CON TU CÓDIGO
-- ========================================

-- Una vez que tengas tu admin creado con código 'UVALL2024',
-- los usuarios pueden registrarse en la interfaz web usando ese código.

-- Flujo de registro de usuario:
-- 1. Usuario va a http://localhost:4200/auth/register
-- 2. Selecciona "Soy Jugador"
-- 3. Ingresa el código: UVALL2024
-- 4. Completa el resto del formulario
-- 5. Se registra bajo tu administración

-- ========================================
-- FIN DEL SCRIPT
-- ========================================

-- ¡Listo! Ahora puedes hacer login con:
-- Email: adrian.cardenas@correounivalle.edu.co
-- Contraseña: Cambiame123 (o la que hayas puesto)
