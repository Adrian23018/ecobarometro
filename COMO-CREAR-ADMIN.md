# 🔐 Cómo Crear y Logearse como Administrador

## 📋 Guía Completa para Administradores

---

## 1️⃣ CREAR UNA CUENTA DE ADMINISTRADOR

### Opción A: Desde la Interfaz Web (Recomendado)

#### Paso 1: Ir a la Página de Registro
```
http://localhost:4200/auth/register
```

#### Paso 2: Seleccionar "Soy Administrador"
En la página de registro verás **DOS pestañas**:
- 👤 **Soy Jugador**
- 🛡️ **Soy Administrador** ← **SELECCIONA ESTA**

#### Paso 3: Completar el Formulario
Ingresa los siguientes datos:

```
┌─────────────────────────────────────────┐
│  📧 Email:                              │
│  [admin@ecobarometro.com]               │
│                                         │
│  👤 Nombre Completo:                    │
│  [Adrian Gómez]                         │
│                                         │
│  🏢 Empresa/Organización:               │
│  [EcoBarómetro]                         │
│                                         │
│  🔒 Contraseña:                         │
│  [••••••••]                             │
│                                         │
│  🔒 Confirmar Contraseña:               │
│  [••••••••]                             │
│                                         │
│  ✅ Acepto términos y condiciones       │
│                                         │
│  [🛡️ Registrarme como Admin]           │
└─────────────────────────────────────────┘
```

#### Paso 4: Guardar tu Código de Administrador
**⚠️ MUY IMPORTANTE:**

Después de registrarte, el sistema te mostrará un mensaje como este:

```
✅ ¡Registro exitoso! Bienvenido Adrian Gómez.
Tu código de administrador es: ABC123

⚠️ GUARDA ESTE CÓDIGO - Es necesario para que los
   jugadores se registren bajo tu administración
```

**COPIA Y GUARDA ESTE CÓDIGO** en un lugar seguro. Lo necesitarás para:
- Que los usuarios/jugadores se registren en tu plataforma
- Verificar que los jugadores pertenecen a tu organización

#### Paso 5: Esperar Redirección
Después de 3 segundos, serás redirigido automáticamente al login.

---

### Opción B: Directamente en Supabase (Solo Desarrollo)

Si tienes acceso a tu base de datos Supabase, puedes crear un admin manualmente:

#### Paso 1: Ir a Supabase Dashboard
```
https://supabase.com/dashboard
```

#### Paso 2: Seleccionar tu Proyecto
- Ve a "Table Editor"
- Selecciona la tabla `admins`

#### Paso 3: Insertar un Nuevo Admin
Haz clic en "+ Insert row" y completa:

```sql
email:         admin@ecobarometro.com
password_hash: (usa el hash generado - ver nota abajo)
name:          Adrian Gómez
company:       EcoBarómetro
admin_code:    ABC123
is_active:     true
```

**Nota sobre password_hash:**
El sistema usa un hash personalizado. Para generar uno:
1. Abre la consola del navegador
2. Ejecuta:
```javascript
const password = 'tuContraseña123';
const salt = Math.random().toString(36).substring(2, 15);
const hash = btoa(password + salt) + '.' + salt;
console.log('Hash:', hash);
```
3. Copia el resultado y úsalo en `password_hash`

---

## 2️⃣ INICIAR SESIÓN COMO ADMINISTRADOR

### Paso 1: Ir a la Página de Login
```
http://localhost:4200/auth/login
```

### Paso 2: Ingresar Credenciales
El login es **UNIFICADO** - no necesitas seleccionar pestañas.

Simplemente ingresa:

```
┌─────────────────────────────────────────┐
│  📧 Email:                              │
│  [admin@ecobarometro.com]               │
│                                         │
│  🔒 Contraseña:                         │
│  [••••••••]                             │
│                                         │
│  ☐ Recordarme                           │
│                                         │
│  [🎮 Iniciar Sesión]                    │
└─────────────────────────────────────────┘
```

### Paso 3: Sistema Detecta Automáticamente tu Rol

El sistema intentará:
1. **Primero**: Buscar tu email en la tabla `admins`
2. **Si encuentra**: Te logea como administrador
3. **Si no encuentra**: Busca en la tabla `users`
4. **Si encuentra**: Te logea como jugador

**No necesitas hacer nada especial** - el sistema detecta automáticamente si eres admin o usuario.

### Paso 4: Confirmación de Login

Si el login es exitoso, verás:

```
✅ ¡Bienvenido Administrador!
   Acceso concedido al panel de administración
```

Y serás redirigido automáticamente a:
```
http://localhost:4200/admin/dashboard
```

### Paso 5: Verificar que Estás Logeado como Admin

Verás un **BANNER ROJO** en la esquina superior derecha:

```
┌─────────────────────────────────┐
│ 🛡️  MODO ADMINISTRADOR          │
│     Panel de Control - Adrian   │
│                               ⚫ │
└─────────────────────────────────┘
```

---

## 3️⃣ DIFERENCIAS: ADMIN vs USUARIO

### Login de Administrador

**¿Qué pasa internamente?**

1. Ingresas email y contraseña
2. Sistema busca en tabla `admins`:
   ```sql
   SELECT * FROM admins
   WHERE email = 'admin@ecobarometro.com'
   AND is_active = true
   ```
3. Si encuentra el admin, verifica la contraseña
4. Si es correcta, guarda en localStorage:
   ```javascript
   localStorage.setItem('ecobarometro_admin', JSON.stringify(admin));
   localStorage.setItem('ecobarometro_token', token);
   ```
5. Actualiza el estado de autenticación:
   ```javascript
   authState = {
     isAuthenticated: true,
     admin: { id, email, name, company, ... },
     user: null,
     userType: 'admin'
   }
   ```
6. Redirige a `/admin/dashboard`

### Login de Usuario

**¿Qué pasa internamente?**

1. Ingresas email/username y contraseña
2. Sistema busca en tabla `users`:
   ```sql
   SELECT * FROM users
   WHERE (email = '...' OR username = '...')
   AND is_active = true
   ```
3. Si encuentra el usuario, verifica la contraseña
4. Si es correcta, guarda en localStorage:
   ```javascript
   localStorage.setItem('ecobarometro_user', JSON.stringify(user));
   localStorage.setItem('ecobarometro_token', token);
   ```
5. Actualiza el estado de autenticación:
   ```javascript
   authState = {
     isAuthenticated: true,
     user: { id, email, username, full_name, level, points, ... },
     admin: null,
     userType: 'user'
   }
   ```
6. Redirige a `/user/dashboard`

---

## 4️⃣ RUTAS DISPONIBLES PARA ADMIN

Una vez logeado como admin, puedes acceder a:

### Dashboard Principal
```
http://localhost:4200/admin/dashboard
```
Panel principal con estadísticas y resumen

### Gestión de Categorías
```
http://localhost:4200/admin/categories
```
**AQUÍ CREAS LAS CATEGORÍAS** (ej: Reciclaje, Agua, Energía)

### Gestión de Preguntas
```
http://localhost:4200/admin/questions
```
**AQUÍ CREAS LAS PREGUNTAS** del juego

### Crear Nueva Pregunta
```
http://localhost:4200/admin/questions/create
```
Formulario para crear preguntas con opciones

### Gestión de Usuarios
```
http://localhost:4200/admin/users
```
Ver todos los jugadores registrados bajo tu código

### Gestión de Logros
```
http://localhost:4200/admin/achievements
```
Crear y gestionar logros que pueden desbloquear los jugadores

### Análisis y Reportes
```
http://localhost:4200/admin/analytics
```
Ver estadísticas de juego y rendimiento de usuarios

### Mi Perfil
```
http://localhost:4200/admin/profile
```
Tu perfil de administrador

### Configuración
```
http://localhost:4200/admin/settings
```
Configuración de la plataforma

---

## 5️⃣ PROTECCIÓN DE RUTAS (Guards)

### AdminGuard - Protege Rutas de Admin

**¿Qué hace?**
```typescript
// Si intentas acceder a /admin/* siendo usuario:
❌ Acceso Denegado → Redirige a /user/dashboard

// Si intentas acceder a /admin/* siendo admin:
✅ Acceso Permitido → Entra al panel
```

**Ubicación**: `src/app/core/guards/admin.guard.ts`

**Aplicado en**: `src/app/app.routes.ts:26`
```typescript
{
  path: 'admin',
  loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule),
  canActivate: [AuthGuard, AdminGuard]  // ← Protección activa
}
```

### UserGuard - Protege Rutas de Usuario

**¿Qué hace?**
```typescript
// Si intentas acceder a /user/* siendo admin:
❌ Acceso Denegado → Redirige a /admin/dashboard

// Si intentas acceder a /user/* siendo usuario:
✅ Acceso Permitido → Entra al juego
```

---

## 6️⃣ VERIFICAR QUE ERES ADMIN

### Método 1: Banner Visual (Más Fácil)
Mira la esquina superior derecha:
- **ROJO con 🛡️** = Admin
- **VERDE con 👤** = Usuario

### Método 2: URL del Navegador
- Si estás en `/admin/*` = Eres admin
- Si estás en `/user/*` = Eres usuario

### Método 3: Consola del Navegador (Debugging)
Abre la consola (F12) y ejecuta:
```javascript
// Ver datos guardados
console.log('Admin:', localStorage.getItem('ecobarometro_admin'));
console.log('User:', localStorage.getItem('ecobarometro_user'));
console.log('Token:', localStorage.getItem('ecobarometro_token'));

// Si ecobarometro_admin tiene datos → Eres Admin
// Si ecobarometro_user tiene datos → Eres Usuario
```

---

## 7️⃣ PROCESO COMPLETO DE ADMIN

### Flujo Típico de un Administrador

```
1. CREAR CUENTA
   ↓
   Registro → Guarda código de admin (ej: ABC123)
   ↓
2. INICIAR SESIÓN
   ↓
   Login → Email y contraseña
   ↓
3. ACCEDER AL PANEL
   ↓
   /admin/dashboard (banner rojo aparece)
   ↓
4. CREAR CATEGORÍAS
   ↓
   /admin/categories → Crear "Reciclaje", "Energía", etc.
   ↓
5. CREAR PREGUNTAS
   ↓
   /admin/questions → Crear preguntas con 4 opciones
   ↓
6. COMPARTIR CÓDIGO
   ↓
   Dar código ABC123 a los usuarios para que se registren
   ↓
7. GESTIONAR USUARIOS
   ↓
   /admin/users → Ver progreso de jugadores
   ↓
8. VER ESTADÍSTICAS
   ↓
   /admin/analytics → Análisis de rendimiento
```

---

## 8️⃣ CERRAR SESIÓN

### Desde el Navbar

Haz clic en tu nombre o avatar en la esquina superior derecha y selecciona:
```
🚪 Cerrar Sesión
```

### Desde el Banner de Rol

Haz clic en el banner rojo "MODO ADMINISTRADOR" y selecciona:
```
🚪 Cerrar Sesión
```

### ¿Qué pasa al cerrar sesión?

✅ **Se elimina:**
- `ecobarometro_admin`
- `ecobarometro_token`
- `ecobarometro_remember`
- `sb-vxnfosrtarscqbdrethl-auth-token`
- Todo el `sessionStorage`

✅ **Se preserva:**
- `ecobarometro_progress` (por si acaso)

🔄 **Redirige a:**
```
http://localhost:4200/auth/login
```

---

## 9️⃣ TROUBLESHOOTING

### "No puedo registrarme como admin"

**Posibles causas:**
1. El email ya está registrado
2. La contraseña es muy débil (debe tener números y letras)
3. No aceptaste los términos y condiciones

**Solución:**
- Usa un email diferente
- Fortalece la contraseña (ej: Admin123)
- Marca la casilla de términos

---

### "Mi login no funciona"

**Verifica:**
1. ¿Usaste el mismo email y contraseña del registro?
2. ¿Tu cuenta está activa en Supabase (`is_active = true`)?
3. ¿Hay errores en la consola del navegador (F12)?

**Solución:**
- Verifica en Supabase que tu admin existe en la tabla `admins`
- Revisa la consola para ver errores específicos
- Intenta hacer "Recuperar contraseña" (cuando esté disponible)

---

### "Veo el banner verde en lugar del rojo"

**Causa:**
Estás logeado como usuario, no como admin.

**Solución:**
1. Cierra sesión
2. Verifica en Supabase que tu cuenta existe en `admins` y no en `users`
3. Inicia sesión nuevamente con el email del admin

---

### "No puedo acceder a /admin/dashboard"

**Causa:**
El AdminGuard te está bloqueando porque no detecta que eres admin.

**Solución:**
1. Abre la consola (F12)
2. Ejecuta: `localStorage.getItem('ecobarometro_admin')`
3. Si es `null`, significa que no estás logeado como admin
4. Cierra sesión y vuelve a iniciar con credenciales de admin

---

### "Perdí mi código de administrador"

**Solución:**
1. Ve a Supabase Dashboard
2. Abre la tabla `admins`
3. Busca tu email
4. Copia el valor de la columna `admin_code`

---

## 🔟 RESUMEN RÁPIDO

### Para Crear Admin:
```
1. Ir a http://localhost:4200/auth/register
2. Seleccionar "Soy Administrador"
3. Llenar formulario
4. Guardar código que te da el sistema
```

### Para Logearse como Admin:
```
1. Ir a http://localhost:4200/auth/login
2. Ingresar email y contraseña
3. Sistema detecta automáticamente que eres admin
4. Te redirige a /admin/dashboard
5. Ves banner ROJO con "MODO ADMINISTRADOR"
```

### Para Crear Preguntas:
```
1. Logueado como admin
2. Ir a /admin/categories → Crear categorías
3. Ir a /admin/questions → Crear preguntas
4. Usar tu admin_id automáticamente
```

---

## 📚 Archivos Relacionados

- **Servicio de Auth**: `src/app/core/services/auth.service.ts`
- **Componente Login**: `src/app/features/auth/login/login.component.ts`
- **Componente Register**: `src/app/features/auth/register/register.component.ts`
- **Admin Guard**: `src/app/core/guards/admin.guard.ts`
- **Rutas**: `src/app/app.routes.ts`
- **Banner de Rol**: `src/app/shared/components/role-indicator/role-indicator.component.ts`

---

¡Listo! Ahora sabes todo sobre crear y logearse como administrador. 🎉
