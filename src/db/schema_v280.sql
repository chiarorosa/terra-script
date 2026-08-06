-- =========================================================================
-- TERRASCRIPT 3D - SCHEMA COMPLETO V2.8.0 (FRESH START)
-- Execute este script no SQL Editor do Supabase Dashboard (https://app.supabase.com)
-- ATENÇÃO: Este script força a remoção de todas as tabelas e objetos atuais para um Fresh Start.
-- =========================================================================

-- 0. FORÇA DROP DE TRIGGERS, FUNÇÕES E TABELAS ANTERIORES (FRESH START)
DROP TRIGGER IF EXISTS trg_sanitize_cloud_save ON public.terrascript_saves CASCADE;
DROP TRIGGER IF EXISTS trg_sanitize_leaderboard ON public.terrascript_leaderboard CASCADE;
DROP TRIGGER IF EXISTS trg_sanitize_leaderboard_score ON public.terrascript_leaderboard CASCADE;

DROP FUNCTION IF EXISTS sanitize_cloud_save() CASCADE;
DROP FUNCTION IF EXISTS sanitize_leaderboard_entry() CASCADE;
DROP FUNCTION IF EXISTS sanitize_leaderboard_score() CASCADE;

DROP TABLE IF EXISTS public.terrascript_community_scripts CASCADE;
DROP TABLE IF EXISTS public.terrascript_leaderboard CASCADE;
DROP TABLE IF EXISTS public.terrascript_saves CASCADE;
DROP TABLE IF EXISTS public.terrascript_users CASCADE;


-- 1. TABELA DE USUÁRIOS / CREDENCIAIS NA NUVEM
CREATE TABLE public.terrascript_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_name TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    migrated BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS & Criar Políticas
ALTER TABLE public.terrascript_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura publica de usuarios" ON public.terrascript_users
    FOR SELECT USING (true);
CREATE POLICY "Permitir insercao de usuarios" ON public.terrascript_users
    FOR INSERT WITH CHECK (char_length(player_name) >= 3 AND char_length(player_name) <= 30);
CREATE POLICY "Permitir atualizacao de usuarios" ON public.terrascript_users
    FOR UPDATE USING (true);


-- 2. TABELA DE SAVES NA NUVEM (COM ANTI-FRAUDE E SINCRONIZAÇÃO V2.8.0)
CREATE TABLE public.terrascript_saves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_name TEXT NOT NULL UNIQUE,
    save_json JSONB NOT NULL,
    fiber_count BIGINT DEFAULT 0,
    prestige_level INT DEFAULT 1,
    prestige_points BIGINT DEFAULT 0,
    save_hash TEXT,
    last_known_tick BIGINT DEFAULT 0,
    play_time_seconds BIGINT DEFAULT 0,
    migrated BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS & Criar Políticas
ALTER TABLE public.terrascript_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura publica de saves" ON public.terrascript_saves
    FOR SELECT USING (true);
CREATE POLICY "Permitir insercao de saves" ON public.terrascript_saves
    FOR INSERT WITH CHECK (char_length(player_name) >= 3);
CREATE POLICY "Permitir atualizacao de saves" ON public.terrascript_saves
    FOR UPDATE USING (true);


-- 3. TABELA DE LEADERBOARD / PLACAR DE LÍDERES (RECURSOS, PRESTÍGIO E RIQUEZA V2.8.0)
CREATE TABLE public.terrascript_leaderboard (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_name TEXT NOT NULL UNIQUE,
    fiber BIGINT DEFAULT 0,
    wood BIGINT DEFAULT 0,
    roots BIGINT DEFAULT 0,
    fruits BIGINT DEFAULT 0,
    energy BIGINT DEFAULT 0,
    biomass BIGINT DEFAULT 0,
    catalyst BIGINT DEFAULT 0,
    crystals BIGINT DEFAULT 0,
    prestige_level INT DEFAULT 1,
    prestige_points BIGINT DEFAULT 0,
    wealth_score BIGINT DEFAULT 0,
    agents_count INT DEFAULT 1,
    techs_unlocked INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS & Criar Políticas
ALTER TABLE public.terrascript_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura publica do leaderboard" ON public.terrascript_leaderboard
    FOR SELECT USING (true);
CREATE POLICY "Permitir insercao no leaderboard" ON public.terrascript_leaderboard
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualizacao no leaderboard" ON public.terrascript_leaderboard
    FOR UPDATE USING (true);


-- 4. TABELA DE SCRIPTS DA COMUNIDADE
CREATE TABLE public.terrascript_community_scripts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    language TEXT NOT NULL,
    description TEXT,
    code TEXT NOT NULL,
    downloads INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS & Criar Políticas
ALTER TABLE public.terrascript_community_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura de scripts" ON public.terrascript_community_scripts
    FOR SELECT USING (true);
CREATE POLICY "Permitir compartilhamento de scripts" ON public.terrascript_community_scripts
    FOR INSERT WITH CHECK (true);


-- 5. FUNÇÕES DE SEGURANÇA E TRIGGERS ANTI-CHEAT

-- Sanitização de Cloud Save
CREATE OR REPLACE FUNCTION sanitize_cloud_save()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.prestige_level IS NOT NULL AND NEW.prestige_level > 1000) THEN
    NEW.prestige_level := 1000;
  END IF;

  IF (NEW.prestige_points IS NOT NULL AND NEW.prestige_points > 1000000000) THEN
    NEW.prestige_points := 1000000000;
  END IF;

  IF (NEW.player_name IS NULL OR char_length(NEW.player_name) < 3) THEN
    RAISE EXCEPTION 'Nome de jogador inválido para salvamento na nuvem.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sanitize_cloud_save
  BEFORE INSERT OR UPDATE ON public.terrascript_saves
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_cloud_save();


-- Sanitização de Leaderboard
CREATE OR REPLACE FUNCTION sanitize_leaderboard_entry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.biomass > 1000000000 THEN
    NEW.biomass := 1000000000;
  END IF;
  IF NEW.fiber > 1000000000 THEN
    NEW.fiber := 1000000000;
  END IF;
  IF NEW.wood > 1000000000 THEN
    NEW.wood := 1000000000;
  END IF;
  IF NEW.prestige_level > 1000 THEN
    NEW.prestige_level := 1000;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sanitize_leaderboard
  BEFORE INSERT OR UPDATE ON public.terrascript_leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_leaderboard_entry();


-- 6. ÍNDICES DE PERFORMANCE E CONSULTAS
CREATE INDEX idx_users_player_name ON public.terrascript_users(player_name);
CREATE INDEX idx_saves_player_name ON public.terrascript_saves(player_name);
CREATE INDEX idx_leaderboard_prestige_points ON public.terrascript_leaderboard(prestige_points DESC, prestige_level DESC);
CREATE INDEX idx_leaderboard_wealth_score ON public.terrascript_leaderboard(wealth_score DESC);
CREATE INDEX idx_leaderboard_biomass ON public.terrascript_leaderboard(biomass DESC);
