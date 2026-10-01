-- ========================================================
-- SCRIPT DE CONFIGURACIÓN Y MIGRACIÓN SUPABASE - HORASA TRACK PRO
-- ========================================================

-- 1. Tabla de Perfiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  role TEXT CHECK (role IN ('practicante', 'asesor')) NOT NULL DEFAULT 'practicante',
  target_hours NUMERIC(6,2) DEFAULT 480.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar columna target_hours a profiles si no existe
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_hours NUMERIC(6,2) DEFAULT 480.0;

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios leen su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios leen su propio perfil" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuarios actualizan su propio perfil" ON public.profiles;
CREATE POLICY "Usuarios actualizan su propio perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Trigger para nuevos usuarios
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, target_hours)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'role', 'practicante'),
    480.0
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 3. Tabla de Registros de Horas (time_logs) con soporte para marcas de tiempo y tipo de día
CREATE TABLE IF NOT EXISTS public.time_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  entry_time TIME,
  lunch_start TIME,
  lunch_end TIME,
  exit_time TIME,
  hours NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (hours >= 0),
  extra_hours NUMERIC(4,2) DEFAULT 0,
  status_type TEXT DEFAULT 'normal',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_date UNIQUE (user_id, date)
);

-- Agregar columnas necesarias si la tabla ya existía
ALTER TABLE public.time_logs ADD COLUMN IF NOT EXISTS entry_time TIME;
ALTER TABLE public.time_logs ADD COLUMN IF NOT EXISTS lunch_start TIME;
ALTER TABLE public.time_logs ADD COLUMN IF NOT EXISTS lunch_end TIME;
ALTER TABLE public.time_logs ADD COLUMN IF NOT EXISTS exit_time TIME;
ALTER TABLE public.time_logs ADD COLUMN IF NOT EXISTS extra_hours NUMERIC(4,2) DEFAULT 0;
ALTER TABLE public.time_logs ADD COLUMN IF NOT EXISTS status_type TEXT DEFAULT 'normal';

-- Habilitar RLS en time_logs
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

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


-- 4. Función RPC Segura para el Rol de Asesor
DROP FUNCTION IF EXISTS public.get_totals_per_practicante();
CREATE OR REPLACE FUNCTION public.get_totals_per_practicante()
RETURNS TABLE (
  practicante_id UUID,
  full_name TEXT,
  total_hours NUMERIC,
  completed_days BIGINT,
  target_hours NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'asesor'
  ) THEN
    RETURN QUERY
      SELECT 
        p.id AS practicante_id,
        p.full_name,
        COALESCE(SUM(t.hours), 0) AS total_hours,
        COUNT(DISTINCT t.date) FILTER (WHERE t.hours > 0) AS completed_days,
        COALESCE(p.target_hours, 480.0) AS target_hours
      FROM public.profiles p
      LEFT JOIN public.time_logs t ON p.id = t.user_id
      WHERE p.role = 'practicante'
      GROUP BY p.id, p.full_name, p.target_hours
      ORDER BY total_hours DESC;
  ELSE
    RAISE EXCEPTION 'Acceso denegado: se requiere rol de asesor.';
  END IF;
END;
$$;
