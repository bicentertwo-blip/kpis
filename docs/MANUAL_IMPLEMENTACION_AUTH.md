# Manual de Implementación: Sistema de Autenticación KPIs VisionOS

Este documento describe el flujo completo de autenticación e invitación de usuarios para la aplicación KPIs VisionOS, incluyendo la configuración necesaria en Supabase y el código del frontend.

---

## Índice

1. [Arquitectura General](#arquitectura-general)
2. [Configuración de Supabase](#configuración-de-supabase)
   - [Base de Datos](#1-base-de-datos)
   - [Función RPC](#2-función-rpc)
   - [Políticas RLS](#3-políticas-rls)
   - [Templates de Email](#4-templates-de-email)
   - [URL Configuration](#5-url-configuration)
3. [Flujos de Usuario](#flujos-de-usuario)
   - [Invitación de Usuarios](#flujo-1-invitación-de-usuarios)
   - [Recuperación de Contraseña](#flujo-2-recuperación-de-contraseña)
   - [Login Normal](#flujo-3-login-normal)
4. [Código del Frontend](#código-del-frontend)
5. [Troubleshooting](#troubleshooting)

---

## Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Auth       │  │  Database   │  │  Edge Functions (RPC)   │  │
│  │  - Users    │  │  - profiles │  │  - create_profile_with  │  │
│  │  - Sessions │  │  - kpi_*    │  │    _permissions         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Auth Store │  │  Permissions│  │  Pages                  │  │
│  │  (Zustand)  │  │  Store      │  │  - /login               │  │
│  │             │  │             │  │  - /auth/callback       │  │
│  │             │  │             │  │  - /set-password        │  │
│  │             │  │             │  │  - /reset-password      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Configuración de Supabase

### 1. Base de Datos

#### Tabla `profiles`

Esta tabla almacena la información del perfil de cada usuario y sus permisos.

```sql
-- Crear tabla profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  permitted_views TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Crear índice para búsquedas por user_id
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);

-- Crear índice para búsquedas por email
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
```

**Campos importantes:**
- `user_id`: Referencia al usuario en `auth.users` (Supabase Auth)
- `permitted_views`: Array de strings con los IDs de las vistas que el usuario puede acceder
- El constraint `UNIQUE` en `user_id` es **crítico** para el funcionamiento del `ON CONFLICT`

---

### 2. Función RPC

Esta función crea el perfil del usuario de forma atómica y asigna permisos automáticamente al primer usuario.

```sql
-- Eliminar función existente si hay cambios
DROP FUNCTION IF EXISTS create_profile_with_permissions(uuid, text);

-- Crear función
CREATE OR REPLACE FUNCTION create_profile_with_permissions(
  p_user_id UUID,
  p_email TEXT
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_first_user BOOLEAN;
  v_permitted_views TEXT[];
  v_profile public.profiles;
BEGIN
  -- Verificar si es el primer usuario
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) INTO v_is_first_user;
  
  -- Primer usuario obtiene 'configuracion' por defecto (admin)
  -- Los demás usuarios obtienen array vacío (sin permisos)
  IF v_is_first_user THEN
    v_permitted_views := ARRAY['configuracion']::TEXT[];
  ELSE
    v_permitted_views := ARRAY[]::TEXT[];
  END IF;
  
  -- Insertar perfil (o actualizar email si ya existe por race condition)
  INSERT INTO public.profiles (user_id, email, permitted_views)
  VALUES (p_user_id, p_email, v_permitted_views)
  ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email
  RETURNING * INTO v_profile;
  
  RETURN v_profile;
END;
$$;
```

**Notas importantes:**
- `SECURITY DEFINER`: Permite que la función se ejecute con los permisos del creador (bypass RLS)
- El primer usuario automáticamente recibe el permiso `configuracion` para poder administrar
- Usa `ON CONFLICT` para manejar race conditions de forma segura

---

### 3. Políticas RLS

Row Level Security protege los datos a nivel de fila.

```sql
-- Habilitar RLS en la tabla profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios autenticados pueden ver todos los perfiles
-- (necesario para que admins vean la lista de usuarios)
CREATE POLICY "Authenticated users can view all profiles" 
ON public.profiles
FOR SELECT 
TO authenticated 
USING (true);

-- Política: Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" 
ON public.profiles
FOR UPDATE 
USING (auth.uid() = user_id);

-- Política: Permitir inserciones (la función RPC usa SECURITY DEFINER)
CREATE POLICY "Allow profile creation" 
ON public.profiles
FOR INSERT 
WITH CHECK (true);

-- Política: Admins pueden actualizar cualquier perfil
-- (usuarios con 'configuracion' en permitted_views)
CREATE POLICY "Admins can update any profile" 
ON public.profiles
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND 'configuracion' = ANY(permitted_views)
  )
);
```

---

### 4. Templates de Email

Ve a **Authentication** → **Email Templates** en el dashboard de Supabase.

#### Template: Invite User

```html
<h2 style="font-family:sans-serif;font-size:22px;font-weight:600;margin-bottom:16px;">
  Te invitaron a KPIs VisionOS
</h2>

<p style="font-family:sans-serif;font-size:16px;color:#475569;margin:0 0 20px;">
  Fuiste invitado a crear una cuenta en <strong>{{ .SiteURL }}</strong>.
  Haz clic en el siguiente botón para validar tu enlace y definir tu contraseña:
</p>

<p style="margin:24px 0;">
  <a
    href="{{ .ConfirmationURL }}&next=/set-password"
    style="display:inline-block;padding:14px 24px;border-radius:999px;
           background:#4f46e5;color:#fff;text-decoration:none;font-weight:600;">
    Configurar contraseña
  </a>
</p>

<p style="font-family:sans-serif;font-size:14px;color:#94a3b8;margin:0 0 8px;">
  Si el botón no funciona, copia y pega esta URL en tu navegador:
</p>

<p style="font-family:monospace;font-size:14px;background:#f1f5f9;padding:12px;
          border-radius:8px;word-break:break-all;color:#475569;margin:0;">
  {{ .ConfirmationURL }}&next=/set-password
</p>
```

#### Template: Reset Password

```html
<h2 style="font-family:sans-serif;font-size:22px;font-weight:600;margin-bottom:16px;">
  Restablece tu contraseña
</h2>

<p style="font-family:sans-serif;font-size:16px;color:#475569;margin:0 0 20px;">
  Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong>{{ .SiteURL }}</strong>.
  Haz clic en el siguiente botón para crear una nueva contraseña:
</p>

<p style="margin:24px 0;">
  <a
    href="{{ .ConfirmationURL }}"
    style="display:inline-block;padding:14px 24px;border-radius:999px;
           background:#4f46e5;color:#fff;text-decoration:none;font-weight:600;">
    Restablecer contraseña
  </a>
</p>

<p style="font-family:sans-serif;font-size:14px;color:#94a3b8;margin:0 0 8px;">
  Si el botón no funciona, copia y pega esta URL en tu navegador:
</p>

<p style="font-family:monospace;font-size:14px;background:#f1f5f9;padding:12px;
          border-radius:8px;word-break:break-all;color:#475569;margin:0;">
  {{ .ConfirmationURL }}
</p>

<p style="font-family:sans-serif;font-size:13px;color:#94a3b8;margin:24px 0 0;">
  Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña actual seguirá siendo válida.
</p>
```

---

### 5. URL Configuration

Ve a **Authentication** → **URL Configuration** en Supabase.

| Campo | Valor |
|-------|-------|
| Site URL | `https://tu-dominio.com` (o `http://localhost:5173` en desarrollo) |
| Redirect URLs | Agregar: `http://localhost:5173/auth/callback`, `https://tu-dominio.com/auth/callback` |

**Importante:** El Site URL debe coincidir con el dominio donde corre tu aplicación.

---

## Flujos de Usuario

### Flujo 1: Invitación de Usuarios

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Admin      │     │   Supabase   │     │  Nuevo User  │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │  1. Invite User    │                    │
       │  (desde dashboard) │                    │
       │───────────────────>│                    │
       │                    │                    │
       │                    │  2. Envía email    │
       │                    │  con link          │
       │                    │───────────────────>│
       │                    │                    │
       │                    │  3. Click en link  │
       │                    │<───────────────────│
       │                    │                    │
       │                    │  4. Redirect a     │
       │                    │  /auth/callback    │
       │                    │───────────────────>│
       │                    │                    │
       │                    │  5. Valida token,  │
       │                    │  redirect a        │
       │                    │  /set-password     │
       │                    │<───────────────────│
       │                    │                    │
       │                    │  6. Usuario define │
       │                    │  contraseña        │
       │                    │───────────────────>│
       │                    │                    │
       │                    │  7. Crea sesión +  │
       │                    │  perfil via RPC    │
       │                    │<───────────────────│
       │                    │                    │
       │                    │  8. Redirect a /   │
       │                    │───────────────────>│
```

#### Pasos para invitar un usuario:

1. Ve a **Authentication** → **Users** en Supabase
2. Click en **Invite user**
3. Ingresa el email del usuario
4. El usuario recibe el email con el link
5. Al hacer click, es redirigido a `/auth/callback`
6. El callback procesa el token y redirige a `/set-password`
7. El usuario define su contraseña
8. Se crea automáticamente el perfil en la tabla `profiles`
9. El usuario es redirigido a la aplicación

---

### Flujo 2: Recuperación de Contraseña

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Usuario    │     │   Frontend   │     │   Supabase   │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │  1. Click "Olvidé  │                    │
       │  mi contraseña"    │                    │
       │───────────────────>│                    │
       │                    │                    │
       │  2. Ingresa email  │                    │
       │───────────────────>│                    │
       │                    │                    │
       │                    │  3. requestPassword│
       │                    │  Reset(email)      │
       │                    │───────────────────>│
       │                    │                    │
       │                    │  4. Envía email    │
       │  <─────────────────│<───────────────────│
       │                    │                    │
       │  5. Click en link  │                    │
       │───────────────────>│                    │
       │                    │                    │
       │                    │  6. /auth/callback │
       │                    │  procesa token     │
       │                    │───────────────────>│
       │                    │                    │
       │  7. /set-password  │                    │
       │  <─────────────────│<───────────────────│
       │                    │                    │
       │  8. Nueva password │                    │
       │───────────────────>│───────────────────>│
```

---

### Flujo 3: Login Normal

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Usuario    │     │   Frontend   │     │   Supabase   │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       │  1. Email + Pass   │                    │
       │───────────────────>│                    │
       │                    │                    │
       │                    │  2. signInWith     │
       │                    │  Password          │
       │                    │───────────────────>│
       │                    │                    │
       │                    │  3. Session        │
       │                    │<───────────────────│
       │                    │                    │
       │                    │  4. ensureProfile  │
       │                    │  (verifica/crea)   │
       │                    │───────────────────>│
       │                    │                    │
       │                    │  5. Profile data   │
       │                    │<───────────────────│
       │                    │                    │
       │  6. Redirect a /   │                    │
       │  <─────────────────│                    │
```

---

## Código del Frontend

### Estructura de Archivos

```
src/
├── lib/
│   └── supabase.ts          # Cliente de Supabase
├── store/
│   ├── auth.ts              # Estado de autenticación
│   └── permissions.ts       # Estado de permisos
├── pages/
│   ├── login/
│   │   └── LoginPage.tsx    # Página de login
│   ├── auth-callback/
│   │   └── AuthCallbackPage.tsx  # Procesa tokens de auth
│   ├── set-password/
│   │   └── SetPasswordPage.tsx   # Definir/cambiar contraseña
│   └── reset-password/
│       └── ResetPasswordPage.tsx # Solicitar reset
└── layout/
    └── RouteGuards.tsx      # Protección de rutas
```

### Archivo: `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,  // Importante para el callback
  },
})
```

### Archivo: `src/store/auth.ts` (fragmento clave)

```typescript
const ensureProfile = async (user: User): Promise<Profile> => {
  // 1. Buscar perfil existente
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return existing

  // 2. Crear perfil via RPC (maneja primer usuario automáticamente)
  const { data, error } = await supabase.rpc('create_profile_with_permissions', {
    p_user_id: user.id,
    p_email: user.email ?? '',
  })

  if (error) throw error
  return data
}
```

### Archivo: `src/pages/auth-callback/AuthCallbackPage.tsx`

Este componente procesa todos los tipos de tokens de autenticación:
- Invitaciones (`type=invite`)
- Recovery (`type=recovery`)
- Magic links (`type=magiclink`)
- OAuth callbacks (`code`)

### Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Troubleshooting

### Problema: El perfil no se crea

**Causa probable:** La función RPC no existe o tiene errores.

**Solución:**
1. Ve a SQL Editor en Supabase
2. Ejecuta el DROP + CREATE de la función
3. Verifica que no haya errores de sintaxis

### Problema: "relation profiles does not exist"

**Causa:** La tabla profiles no fue creada.

**Solución:** Ejecutar el SQL de creación de tabla.

### Problema: El usuario no puede ver nada después de login

**Causa:** El usuario no tiene permisos asignados (`permitted_views` vacío).

**Solución:**
1. Un admin debe ir a Configuración en la app
2. Asignar las vistas correspondientes al usuario

### Problema: El link de invitación no funciona

**Causas posibles:**
1. El link expiró (por defecto 24 horas)
2. El Redirect URL no está configurado en Supabase
3. El Site URL no coincide con el dominio

**Solución:**
1. Verificar URL Configuration en Supabase
2. Enviar nueva invitación si expiró

### Problema: Error "duplicate key value violates unique constraint"

**Causa:** Race condition al crear perfil (ya manejado por el código).

**Solución:** El `ON CONFLICT` en la función RPC debería manejar esto automáticamente.

### Problema: El primer usuario no tiene acceso a Configuración

**Causa:** El perfil se creó antes de que existiera la función RPC correcta.

**Solución:**
```sql
-- Actualizar manualmente el primer usuario
UPDATE public.profiles 
SET permitted_views = ARRAY['configuracion', 'dashboard', 'supervision']
WHERE email = 'admin@ejemplo.com';
```

---

## Checklist de Implementación

- [ ] Crear tabla `profiles` en Supabase
- [ ] Crear función RPC `create_profile_with_permissions`
- [ ] Configurar políticas RLS
- [ ] Configurar template de email "Invite User"
- [ ] Configurar template de email "Reset Password"
- [ ] Configurar Site URL y Redirect URLs
- [ ] Configurar variables de entorno en el frontend
- [ ] Probar flujo de invitación completo
- [ ] Probar flujo de reset password
- [ ] Verificar que el primer usuario tenga acceso a Configuración

---

## Contacto y Soporte

Para dudas sobre la implementación, revisar:
- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
