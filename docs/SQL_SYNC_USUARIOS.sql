-- =====================================================
-- FUNCIÓN PARA SINCRONIZAR USUARIOS DE AUTH CON PROFILES
-- Ejecutar en SQL Editor de Supabase
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
