-- ==========================================
-- SCRIPT DE INICIALIZAÇÃO DE TABELAS - TERRASCRIPT 3D
-- Copie e cole este código no SQL Editor do Supabase Dashboard
-- (https://app.supabase.com -> SQL Editor)
-- ==========================================

-- 1. Tabela de Saves na Nuvem
CREATE TABLE IF NOT EXISTS public.terrascript_saves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_name TEXT NOT NULL UNIQUE,
    save_json JSONB NOT NULL,
    fiber_count BIGINT DEFAULT 0,
    prestige_level INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS & Allow public read/write
ALTER TABLE public.terrascript_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura publica de saves" ON public.terrascript_saves FOR SELECT USING (true);
CREATE POLICY "Permitir criacao/atualizacao publica de saves" ON public.terrascript_saves FOR ALL USING (true);

-- 2. Tabela de Leaderboard / Placar de Líderes
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
CREATE POLICY "Permitir leitura publica do leaderboard" ON public.terrascript_leaderboard FOR SELECT USING (true);
CREATE POLICY "Permitir escrita publica do leaderboard" ON public.terrascript_leaderboard FOR ALL USING (true);

-- 3. Tabela de Scripts da Comunidade
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
CREATE POLICY "Permitir leitura de scripts" ON public.terrascript_community_scripts FOR SELECT USING (true);
CREATE POLICY "Permitir compartilhamento de scripts" ON public.terrascript_community_scripts FOR INSERT WITH CHECK (true);
