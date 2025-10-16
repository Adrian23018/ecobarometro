# Funcionalidad de Logout - EcoBarómetro

## ✅ Implementación Completa

El sistema de logout ahora limpia correctamente toda la sesión del usuario mientras preserva su progreso.

## 🔑 Qué se Elimina al Hacer Logout

### LocalStorage (Parcial)
Se eliminan las siguientes claves:
- ✅ `ecobarometro_token` - Token de autenticación
- ✅ `ecobarometro_user` - Datos del usuario jugador
- ✅ `ecobarometro_admin` - Datos del administrador
- ✅ `ecobarometro_remember` - Opción "Recordarme"
- ✅ `sb-vxnfosrtarscqbdrethl-auth-token` - Token de Supabase

### SessionStorage (Completo)
Se limpia **TODO** el sessionStorage:
- ✅ Todas las claves se eliminan
- ✅ Datos temporales de la sesión

## 💾 Qué se PRESERVA al Hacer Logout

### LocalStorage (Preservado)
- ✅ `ecobarometro_progress` - **Progreso del usuario**

Esta clave se mantiene intacta para que el usuario no pierda su progreso cuando cierra sesión.

## 🎯 Cómo Funciona

### 1. Usuario hace clic en "Cerrar Sesión"
Desde cualquiera de estos lugares:
- Navbar (menú superior)
- Indicador de rol (banner flotante)
- Menú de usuario

### 2. Se ejecuta el proceso de limpieza
```typescript
// Paso 1: Guardar progreso
const progress = localStorage.getItem('ecobarometro_progress');

// Paso 2: Eliminar datos de sesión
localStorage.removeItem('ecobarometro_token');
localStorage.removeItem('ecobarometro_user');
localStorage.removeItem('ecobarometro_admin');
localStorage.removeItem('ecobarometro_remember');
localStorage.removeItem('sb-vxnfosrtarscqbdrethl-auth-token');

// Paso 3: Limpiar sessionStorage
sessionStorage.clear();

// Paso 4: Restaurar progreso
if (progress) {
  localStorage.setItem('ecobarometro_progress', progress);
}
```

### 3. Actualización del estado de autenticación
```typescript
this.updateAuthState(false, null, null, null);
```

### 4. Redirección a login
```typescript
this.router.navigate(['/auth/login']);
```

## 📍 Dónde Está Implementado

### 1. **NavbarComponent** (`navbar.component.ts`)
```typescript
private cleanupStorageKeepingProgress() {
  // Guarda progreso
  // Limpia localStorage (excepto progreso)
  // Limpia sessionStorage
  // Restaura progreso
}
```

### 2. **AuthService** (`auth.service.ts`)
```typescript
logout(): void {
  // Guarda progreso
  // Limpia localStorage (excepto progreso)
  // Limpia sessionStorage
  // Restaura progreso
  // Actualiza estado de auth
  // Redirige a login
}
```

### 3. **RoleIndicatorComponent** (Menú desplegable)
Usa `authService.logout()` cuando el usuario selecciona "Cerrar Sesión"

## 🎨 Experiencia del Usuario

### Mensaje de Confirmación
Al hacer logout, el usuario ve:
```
ℹ️ Cerrando Sesión
Hasta pronto! Tu progreso se ha guardado.
```

### Logs en Consola (Desarrollo)
Para debugging, se muestran logs:
```javascript
🚪 Cerrando sesión desde navbar...
💾 Guardando progreso antes de logout: {...}
🗑️ Removido: ecobarometro_token
🗑️ Removido: ecobarometro_user
🗑️ Removido: ecobarometro_admin
🗑️ Removido: ecobarometro_remember
🗑️ Removido: sb-vxnfosrtarscqbdrethl-auth-token
🗑️ SessionStorage limpiado
✅ Progreso restaurado
```

## 🔐 Seguridad

### Tokens Eliminados
- ✅ Token JWT de la aplicación
- ✅ Token de Supabase
- ✅ Información del usuario/admin

### Datos Sensibles
- ✅ Email
- ✅ Username
- ✅ Admin code
- ✅ Contraseñas hasheadas (nunca se guardan en cliente)

## 🧪 Cómo Probar

### 1. Verificar que el logout limpia correctamente:
```javascript
// Antes del logout
console.log('User:', localStorage.getItem('ecobarometro_user'));
console.log('Token:', localStorage.getItem('ecobarometro_token'));
console.log('Progress:', localStorage.getItem('ecobarometro_progress'));

// Hacer logout

// Después del logout
console.log('User:', localStorage.getItem('ecobarometro_user')); // null
console.log('Token:', localStorage.getItem('ecobarometro_token')); // null
console.log('Progress:', localStorage.getItem('ecobarometro_progress')); // ✅ Preserved
```

### 2. Verificar el progreso se mantiene:
1. Inicia sesión como usuario
2. Genera algún progreso (juega, gana puntos, etc.)
3. Abre la consola (F12)
4. Verifica: `localStorage.getItem('ecobarometro_progress')`
5. Haz logout
6. Verifica nuevamente: `localStorage.getItem('ecobarometro_progress')` - Debe seguir ahí

### 3. Verificar sessionStorage se limpia:
```javascript
// Antes del logout
sessionStorage.setItem('test', 'value');
console.log('Test:', sessionStorage.getItem('test')); // "value"

// Hacer logout

// Después del logout
console.log('Test:', sessionStorage.getItem('test')); // null
```

## 📝 Estructura del Progreso

La clave `ecobarometro_progress` puede contener:

```json
{
  "lastGameScore": 850,
  "currentLevel": 5,
  "unlockedAchievements": ["first_game", "speed_demon"],
  "tutorialCompleted": true,
  "preferences": {
    "soundEnabled": true,
    "notificationsEnabled": false
  }
}
```

## 🛡️ Guards y Protección

Después del logout:
- ❌ No puedes acceder a `/user/*` (protegido por UserGuard)
- ❌ No puedes acceder a `/admin/*` (protegido por AdminGuard)
- ✅ Solo puedes acceder a `/auth/*` (login, register)

## 🔄 Flujo Completo

```
Usuario autenticado
    ↓
Hace clic en "Cerrar Sesión"
    ↓
[NavbarComponent] Muestra mensaje
    ↓
[NavbarComponent] Ejecuta cleanupStorageKeepingProgress()
    ↓
Guarda ecobarometro_progress
    ↓
Elimina ecobarometro_token, ecobarometro_user, etc.
    ↓
Limpia sessionStorage
    ↓
Restaura ecobarometro_progress
    ↓
[AuthService] Ejecuta logout()
    ↓
Actualiza authState (isAuthenticated = false)
    ↓
Redirige a /auth/login
    ↓
Usuario desautenticado (pero con progreso guardado)
```

## 🎯 Beneficios

1. **Seguridad**: Elimina todos los tokens y datos sensibles
2. **Privacidad**: Limpia completamente la sesión
3. **UX**: El usuario no pierde su progreso
4. **Confianza**: El usuario sabe que su progreso está a salvo
5. **Limpieza**: SessionStorage completamente limpio

## 🚀 Mejoras Futuras (Opcional)

### Sincronización con Backend
```typescript
async logout(): Promise<void> {
  // Guardar progreso en BD antes de limpiar
  if (this.currentUser) {
    await this.saveProgressToBackend(this.currentUser.id);
  }

  // Continuar con logout normal
  this.cleanupStorageKeepingProgress();
}
```

### Confirmación de Logout
```typescript
confirmLogout(): void {
  this.confirmationService.confirm({
    message: '¿Estás seguro de que quieres cerrar sesión?',
    header: 'Confirmar Logout',
    icon: 'pi pi-sign-out',
    accept: () => this.logout()
  });
}
```

## ✅ Checklist de Implementación

- [x] Navbar tiene método cleanupStorageKeepingProgress()
- [x] AuthService preserva ecobarometro_progress
- [x] SessionStorage se limpia completamente
- [x] Tokens se eliminan correctamente
- [x] Datos de usuario/admin se eliminan
- [x] Mensaje de confirmación se muestra
- [x] Redirección a login funciona
- [x] Estado de autenticación se actualiza
- [x] Guards protegen rutas después del logout
- [x] Logs en consola para debugging

¡Listo! Ahora tu logout funciona perfectamente preservando el progreso del usuario. 🎉
