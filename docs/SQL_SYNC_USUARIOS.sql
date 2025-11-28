-- =====================================================
-- FUNCIÓN PARA SINCRONIZAR USUARIOS DE AUTH CON PROFILES
-- Y POLÍTICAS RLS PARA ADMINISTRACIÓN DE PERMISOS
-- Ejecutar en SQL Editor de Supabase
-- =====================================================

-- =====================================================
-- PASO 1: ACTUALIZAR POLÍTICAS RLS DE PROFILES
-- Para permitir que admins vean y editen todos los perfiles
-- =====================================================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;

-- Función para verificar si un usuario es admin (tiene acceso a Configuración)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND 'configuracion' = ANY(permitted_views)
  );
END;
$$;

-- Política SELECT: Admins pueden ver TODOS los perfiles, usuarios normales solo el suyo
CREATE POLICY "profiles_select_policy" ON profiles
FOR SELECT 
TO authenticated
USING (
  auth.uid() = user_id  -- Siempre puede ver su propio perfil
  OR is_admin()          -- Admins pueden ver todos
);

-- Política UPDATE: Usuarios pueden actualizar su propio perfil
CREATE POLICY "profiles_update_own" ON profiles
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política UPDATE: Admins pueden actualizar cualquier perfil
CREATE POLICY "profiles_update_admin" ON profiles
FOR UPDATE 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- =====================================================
-- PASO 2: FUNCIÓN DE SINCRONIZACIÓN
-- =====================================================

-- Esta función sincroniza todos los usuarios de auth.users
-- con la tabla profiles, creando perfiles para usuarios nuevos

CREATE OR REPLACE FUNCTION sync_all_users_to_profiles()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insertar usuarios que no tienen perfil aún
  RETURN QUERY
  INSERT INTO public.profiles (user_id, email, permitted_views)
  SELECT 
    au.id,
    au.email,
    ARRAY[]::TEXT[]  -- Sin permisos por defecto
  FROM auth.users au
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.user_id = au.id
  )
  ON CONFLICT (user_id) DO NOTHING
  RETURNING 
    profiles.user_id,
    profiles.email,
    'created'::TEXT as status;
END;
$$;

-- Dar permisos para ejecutar la función a usuarios autenticados
GRANT EXECUTE ON FUNCTION sync_all_users_to_profiles() TO authenticated;

-- =====================================================
-- ALTERNATIVA: Si prefieres sincronizar automáticamente
-- cuando se crea un usuario nuevo (trigger)
-- =====================================================

-- Función trigger para crear perfil automáticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_first_user BOOLEAN;
  v_permitted_views TEXT[];
BEGIN
  -- Verificar si es el primer usuario
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) INTO v_is_first_user;
  
  -- Primer usuario obtiene 'configuracion' por defecto
  IF v_is_first_user THEN
    v_permitted_views := ARRAY['configuracion']::TEXT[];
  ELSE
    v_permitted_views := ARRAY[]::TEXT[];
  END IF;

  INSERT INTO public.profiles (user_id, email, permitted_views)
  VALUES (NEW.id, NEW.email, v_permitted_views)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Crear trigger (si no existe ya)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- EJECUTAR SINCRONIZACIÓN INICIAL
-- (para usuarios existentes que no tienen perfil)
-- =====================================================

-- Descomentar y ejecutar para sincronizar usuarios existentes:
-- SELECT * FROM sync_all_users_to_profiles();
