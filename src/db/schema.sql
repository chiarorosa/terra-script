-- ==========================================
-- SCRIPT DE INICIALIZAÇÃO DE TABELAS - TERRASCRIPT 3D
-- Copie e cole este código no SQL Editor do Supabase Dashboard
-- (https://app.supabase.com -> SQL Editor)
-- ==========================================

-- 1. Tabela de Usuários / Credenciais na Nuvem
CREATE TABLE IF NOT EXISTS public.terrascript_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_name TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    migrated BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS & Allow public read/write for users
ALTER TABLE public.terrascript_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura publica de usuarios" ON public.terrascript_users;
DROP POLICY IF EXISTS "Permitir criacao/atualizacao de usuarios" ON public.terrascript_users;
DROP POLICY IF EXISTS "Permitir insercao de usuarios" ON public.terrascript_users;
DROP POLICY IF EXISTS "Permitir atualizacao de usuarios" ON public.terrascript_users;

CREATE POLICY "Permitir leitura publica de usuarios" ON public.terrascript_users FOR SELECT USING (true);
CREATE POLICY "Permitir insercao de usuarios" ON public.terrascript_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualizacao de usuarios" ON public.terrascript_users FOR UPDATE USING (true) WITH CHECK (true);

-- 2. Tabela de Saves na Nuvem (com Anti-Fraude & Sincronização)
CREATE TABLE IF NOT EXISTS public.terrascript_saves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_name TEXT NOT NULL UNIQUE,
    save_json JSONB NOT NULL,
    fiber_count BIGINT DEFAULT 0,
    prestige_level INT DEFAULT 1,
    save_hash TEXT,
    last_known_tick BIGINT DEFAULT 0,
    play_time_seconds BIGINT DEFAULT 0,
    migrated BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas caso a tabela já existisse anteriormente
ALTER TABLE public.terrascript_saves ADD COLUMN IF NOT EXISTS save_hash TEXT;
ALTER TABLE public.terrascript_saves ADD COLUMN IF NOT EXISTS last_known_tick BIGINT DEFAULT 0;
ALTER TABLE public.terrascript_saves ADD COLUMN IF NOT EXISTS play_time_seconds BIGINT DEFAULT 0;
ALTER TABLE public.terrascript_saves ADD COLUMN IF NOT EXISTS migrated BOOLEAN DEFAULT true;

-- Enable RLS & Allow public read/write
ALTER TABLE public.terrascript_saves ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura publica de saves" ON public.terrascript_saves;
DROP POLICY IF EXISTS "Permitir criacao/atualizacao publica de saves" ON public.terrascript_saves;
DROP POLICY IF EXISTS "Permitir insercao de saves" ON public.terrascript_saves;
DROP POLICY IF EXISTS "Permitir atualizacao de saves" ON public.terrascript_saves;

CREATE POLICY "Permitir leitura publica de saves" ON public.terrascript_saves FOR SELECT USING (true);
CREATE POLICY "Permitir insercao de saves" ON public.terrascript_saves FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualizacao de saves" ON public.terrascript_saves FOR UPDATE USING (true) WITH CHECK (true);

-- 3. Tabela de Leaderboard / Placar de Líderes
CREATE TABLE IF NOT EXISTS public.terrascript_leaderboard (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_name TEXT NOT NULL UNIQUE,
    fiber BIGINT DEFAULT 0,
    wood BIGINT DEFAULT 0,
    roots BIGINT DEFAULT 0,
    fruits BIGINT DEFAULT 0,
    energy BIGINT DEFAULT 0,
    biomass BIGINT DEFAULT 0,
    prestige_level INT DEFAULT 1,
    agents_count INT DEFAULT 1,
    techs_unlocked INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS & Allow public read/write
ALTER TABLE public.terrascript_leaderboard ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura publica do leaderboard" ON public.terrascript_leaderboard;
DROP POLICY IF EXISTS "Permitir escrita publica do leaderboard" ON public.terrascript_leaderboard;
DROP POLICY IF EXISTS "Permitir insercao no leaderboard" ON public.terrascript_leaderboard;
DROP POLICY IF EXISTS "Permitir atualizacao no leaderboard" ON public.terrascript_leaderboard;

CREATE POLICY "Permitir leitura publica do leaderboard" ON public.terrascript_leaderboard FOR SELECT USING (true);
CREATE POLICY "Permitir insercao no leaderboard" ON public.terrascript_leaderboard FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualizacao no leaderboard" ON public.terrascript_leaderboard FOR UPDATE USING (true) WITH CHECK (true);

-- 4. Tabela de Scripts da Comunidade
CREATE TABLE IF NOT EXISTS public.terrascript_community_scripts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    language TEXT NOT NULL,
    description TEXT,
    code TEXT NOT NULL,
    downloads INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS & Allow public read/write
ALTER TABLE public.terrascript_community_scripts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura de scripts" ON public.terrascript_community_scripts;
DROP POLICY IF EXISTS "Permitir compartilhamento de scripts" ON public.terrascript_community_scripts;

CREATE POLICY "Permitir leitura de scripts" ON public.terrascript_community_scripts FOR SELECT USING (true);
CREATE POLICY "Permitir compartilhamento de scripts" ON public.terrascript_community_scripts FOR INSERT WITH CHECK (true);

