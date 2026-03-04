-- Script SQL para criar as tabelas necessárias no Supabase LevaCar

-- ==========================================
-- 1. TABELA DE USUÁRIOS (Perfis)
-- ==========================================
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,             -- Guardar e-mail para fácil acesso
  role TEXT NOT NULL CHECK (role IN ('CLIENT', 'DRIVER', 'MECHANIC')),
  cnh_url TEXT,           -- (Apenas para driver) URL da foto da CNH no Storage
  cnh_approved BOOLEAN,   -- (Apenas para driver) Se o admin validou a CNH
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS (Row Level Security) e permitir acesso básico
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile."
  ON public.users FOR SELECT
  USING ( auth.uid() = id );

CREATE POLICY "Users can insert their own profile."
  ON public.users FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can update their own profile."
  ON public.users FOR UPDATE
  USING ( auth.uid() = id );


-- ==========================================
-- 2. TABELA DE MECÂNICAS (Oficinas Credenciadas)
-- ==========================================
CREATE TABLE public.mechanics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.users(id) NOT NULL, -- O usuário mecânico que gerencia
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.mechanics ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa logada (mesmo cliente) pode ver a lista de mecânicas ativas
CREATE POLICY "Anyone authenticated can view active mechanics"
  ON public.mechanics FOR SELECT
  USING ( auth.role() = 'authenticated' AND is_active = true );

CREATE POLICY "Mechanics can insert and update their shops"
  ON public.mechanics FOR ALL
  USING ( auth.uid() = owner_id );


-- ==========================================
-- 3. TABELA DE CORRIDAS (Rides)
-- ==========================================
CREATE TABLE public.rides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.users(id) NOT NULL,
  driver_id UUID REFERENCES public.users(id),    -- Fica Null até algum motorista aceitar
  mechanic_id UUID REFERENCES public.mechanics(id) NOT NULL,
  
  service_type TEXT NOT NULL CHECK (service_type IN ('LEVAR', 'BUSCAR', 'LEVAR_E_BUSCAR')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'EN_ROUTE', 'AT_MECHANIC', 'RETURNING', 'COMPLETED', 'CANCELED')),
  
  pickup_address TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION,
  pickup_lng DOUBLE PRECISION,
  
  price NUMERIC(10, 2), -- Valor combinado (pode ser preenchido dps ou antes)

  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- Cliente pode ver suas próprias corridas
CREATE POLICY "Clients can view their rides"
  ON public.rides FOR SELECT
  USING ( auth.uid() = client_id );

-- Clientes podem criar corridas
CREATE POLICY "Clients can insert rides"
  ON public.rides FOR INSERT
  WITH CHECK ( auth.uid() = client_id );

-- Motoristas podem ver corridas pendentes (supondo que eles queiram aceitar) ou corridas em que são o driver_id
CREATE POLICY "Drivers can view pending and own rides"
  ON public.rides FOR SELECT
  USING ( status = 'PENDING' OR auth.uid() = driver_id );

-- O dono da mecânica de destino pode visualizar corridas indo ou saindo dele
CREATE POLICY "Mechanics can view rides going to them"
  ON public.rides FOR SELECT
  USING ( 
    auth.uid() IN (SELECT owner_id FROM public.mechanics WHERE id = public.rides.mechanic_id)
  );

-- Permitir update geral (Num caso real as policies de update seriam mais estritas)
CREATE POLICY "Participant users can update rides"
  ON public.rides FOR UPDATE
  USING ( auth.uid() IN (client_id, driver_id) OR auth.uid() IN (SELECT owner_id FROM public.mechanics WHERE id = public.rides.mechanic_id) );
