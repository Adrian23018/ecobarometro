# ¿Cómo Saber si Estoy Logeado como Admin o User?

## 🎯 Indicador Visual (Nuevo)

Ahora verás un **banner flotante en la esquina superior derecha** que muestra claramente tu rol:

### MODO ADMINISTRADOR
```
┌─────────────────────────────────┐
│ 🛡️  MODO ADMINISTRADOR          │
│     Panel de Control - Tu Nombre│
│                               ⚫ │
└─────────────────────────────────┘
```
- **Color**: Rojo/Rosa
- **Icono**: Escudo (🛡️)
- **Texto**: "MODO ADMINISTRADOR"

### MODO JUGADOR
```
┌─────────────────────────────────┐
│ 👤  MODO JUGADOR                │
│     Tu Nombre - Nivel X         │
│                               ⚫ │
└─────────────────────────────────┘
```
- **Color**: Verde
- **Icono**: Usuario (👤)
- **Texto**: "MODO JUGADOR"

## 🔐 Protección de Rutas (Guards Habilitados)

Ahora las rutas están protegidas:

### Si estás logeado como ADMIN:
- ✅ Puedes acceder a: `/admin/*`
- ❌ NO puedes acceder a: `/user/*`
- Si intentas ir a `/user/dashboard` → Te redirige a `/admin/dashboard`

### Si estás logeado como USER:
- ✅ Puedes acceder a: `/user/*` y `/game/*`
- ❌ NO puedes acceder a: `/admin/*`
- Si intentas ir a `/admin/dashboard` → Te redirige a `/user/dashboard`

## 📍 Rutas Según Rol

### Rutas de ADMINISTRADOR
```
Dashboard:           /admin/dashboard
Categorías:          /admin/categories      ← CREAR CATEGORÍAS AQUÍ
Preguntas:           /admin/questions       ← CREAR PREGUNTAS AQUÍ
Crear Pregunta:      /admin/questions/create
Usuarios:            /admin/users
Logros:              /admin/achievements
Análisis:            /admin/analytics
Mi Perfil:           /admin/profile
```

### Rutas de JUGADOR
```
Dashboard:           /user/dashboard
Jugar:               /game/lobby
Mis Logros:          /user/achievements
Ranking:             /user/ranking
Mi Perfil:           /user/profile
```

## 🚪 Cómo Iniciar Sesión

### Como Administrador:
1. Ve a: `http://localhost:4200/auth/login`
2. Ingresa tu **email de administrador** y **contraseña**
3. Haz clic en "Acceder al Panel"
4. Serás redirigido automáticamente a `/admin/dashboard`
5. Verás el banner ROJO con "MODO ADMINISTRADOR"

### Como Usuario:
1. Ve a: `http://localhost:4200/auth/login`
2. Ingresa tu **email o username** y **contraseña**
3. Haz clic en "Empezar a Jugar"
4. Serás redirigido automáticamente a `/user/dashboard`
5. Verás el banner VERDE con "MODO JUGADOR"

## 🔍 Métodos para Verificar tu Rol

### 1. Indicador Visual (Más Fácil)
Mira la esquina superior derecha de la pantalla:
- **Rojo** = Admin
- **Verde** = User

### 2. URL del Navegador
Mira la barra de direcciones:
- Si estás en `/admin/...` = Eres Admin
- Si estás en `/user/...` = Eres User

### 3. Consola del Navegador (Para Debugging)
Abre la consola (F12) y ejecuta:
```javascript
// Ver datos en localStorage
console.log('Admin:', localStorage.getItem('ecobarometro_admin'));
console.log('User:', localStorage.getItem('ecobarometro_user'));
console.log('Token:', localStorage.getItem('ecobarometro_token'));
```

Si `ecobarometro_admin` tiene datos → Estás logeado como Admin
Si `ecobarometro_user` tiene datos → Estás logeado como User

### 4. Menú de Navegación
El indicador visual tiene un menú desplegable:
- Haz clic en el banner
- Verás opciones específicas según tu rol:
  - **Admin**: Dashboard, Categorías, Preguntas, Usuarios
  - **User**: Dashboard, Jugar, Mis Logros, Ranking

## 🎨 Diferencias Visuales

| Característica | Administrador | Jugador |
|----------------|---------------|---------|
| Color Banner | Rojo (#ef4444) | Verde (#22c55e) |
| Icono | 🛡️ Escudo | 👤 Usuario |
| Texto | MODO ADMINISTRADOR | MODO JUGADOR |
| Dashboard | Panel de Control | Juego y Estadísticas |
| Opciones Menú | Gestión (Categorías, Preguntas, Usuarios) | Juego (Jugar, Logros, Ranking) |

## 🔄 Cambiar de Rol

### Para probar ambos roles:

1. **Cerrar Sesión Actual:**
   - Haz clic en el banner de rol
   - Selecciona "Cerrar Sesión"

2. **Iniciar Sesión con Otra Cuenta:**
   - Usa credenciales de admin para ver el panel de administración
   - Usa credenciales de user para ver el panel de jugador

### Crear Cuentas de Prueba:

**Crear Admin:**
```
http://localhost:4200/auth/register
- Selecciona: "Soy Administrador"
- Completa el formulario
- Guarda tu código de administrador
```

**Crear User:**
```
http://localhost:4200/auth/register
- Selecciona: "Soy Jugador"
- Ingresa el código del administrador
- Completa el formulario
```

## 🐛 Solución de Problemas

### "No veo el indicador de rol"
- Asegúrate de haber iniciado sesión
- Refresca la página (F5)
- Verifica que el componente `RoleIndicatorComponent` esté importado en `app.component.ts`

### "Veo el indicador pero no puedo acceder a ciertas rutas"
- Los guards están activos y te protegen
- Si eres admin y quieres ver el panel de admin, ve a `/admin/dashboard`
- Si eres user y quieres jugar, ve a `/user/dashboard`

### "El indicador no cambia cuando hago login"
- Cierra todas las pestañas de la aplicación
- Limpia el localStorage: Consola > `localStorage.clear()`
- Inicia sesión nuevamente

### "No sé mis credenciales"
- Consulta la tabla `admins` en Supabase para administradores
- Consulta la tabla `users` en Supabase para jugadores
- Las contraseñas están hasheadas, no se pueden ver directamente

## ✅ Resumen Rápido

1. **Banner Rojo** = Administrador → Puedes crear categorías y preguntas
2. **Banner Verde** = Jugador → Puedes jugar y ganar puntos
3. **Haz clic en el banner** → Ver menú con opciones específicas
4. **URL del navegador** → `/admin/*` o `/user/*`
5. **Guards activos** → No puedes acceder a rutas de otro rol

¡Listo! Ahora siempre sabrás en qué modo estás. 🎉
