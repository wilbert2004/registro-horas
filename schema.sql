-- ========================================================
-- SCRIPT DE CONFIGURACIÓN SUPABASE - REGISTRO DE HORAS (RBAC)
-- ========================================================
-- Ejecuta este script en el Editor SQL de tu proyecto Supabase.

-- 1. Tabla de Perfiles de Usuario
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('practicante', 'asesor')) NOT NULL DEFAULT 'practicante',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS) en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política RLS: Los usuarios leen únicamente su propio perfil
DROP POLICY IF EXISTS "Usuarios leen su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios leen su propio perfil" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 2. Trigger de creación automática de perfil tras el registro en Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'practicante')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 3. Tabla de Registro de Horas
CREATE TABLE IF NOT EXISTS public.time_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hours NUMERIC(5,2) NOT NULL CHECK (hours > 0),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS) en time_logs
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para time_logs (Solo el propio Practicante puede interactuar con sus registros)
DROP POLICY IF EXISTS "Practicantes leen sus propias horas" ON public.time_logs;
CREATE POLICY "Practicantes leen sus propias horas" ON public.time_logs
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Practicantes registran sus propias horas" ON public.time_logs;
CREATE POLICY "Practicantes registran sus propias horas" ON public.time_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Practicantes modifican sus propias horas" ON public.time_logs;
CREATE POLICY "Practicantes modifican sus propias horas" ON public.time_logs
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Practicantes eliminan sus propias horas" ON public.time_logs;
CREATE POLICY "Practicantes eliminan sus propias horas" ON public.time_logs
  FOR DELETE USING (auth.uid() = user_id);


-- 4. Función RPC Segura para el Rol de Asesor (Suma de horas por practicante sin detalles)
CREATE OR REPLACE FUNCTION public.get_totals_per_practicante()
RETURNS TABLE (
  practicante_id UUID,
  full_name TEXT,
  total_hours NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el usuario que ejecuta la función sea un Asesor
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'asesor'
  ) THEN
    RETURN QUERY
      SELECT 
        p.id AS practicante_id,
        p.full_name,
        COALESCE(SUM(t.hours), 0) AS total_hours
      FROM public.profiles p
      LEFT JOIN public.time_logs t ON p.id = t.user_id
      WHERE p.role = 'practicante'
      GROUP BY p.id, p.full_name
      ORDER BY total_hours DESC;
  ELSE
    RAISE EXCEPTION 'Acceso denegado: solo usuarios con rol de asesor pueden consultar este resumen.';
  END IF;
END;
$$;
