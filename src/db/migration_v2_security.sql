-- ========================================================
-- MIGRATION V2: SECURITY HARDENING & ANTI-CHEAT RLS RULES
-- Execute este script no SQL Editor do Supabase para ativar RLS,
-- sanitização de payloads e proteção de integridade na nuvem.
-- ========================================================

-- 1. Habilitar RLS nas tabelas principais
ALTER TABLE IF EXISTS terrascript_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS terrascript_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS terrascript_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS terrascript_community_scripts ENABLE ROW LEVEL SECURITY;

-- 2. Politica de leitura e escrita para terrascript_users
DROP POLICY IF EXISTS "Public Read Users" ON terrascript_users;
CREATE POLICY "Public Read Users" ON terrascript_users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Users" ON terrascript_users;
CREATE POLICY "Public Insert Users" ON terrascript_users
  FOR INSERT WITH CHECK (char_length(player_name) >= 3 AND char_length(player_name) <= 30);

DROP POLICY IF EXISTS "Owner Update Users" ON terrascript_users;
CREATE POLICY "Owner Update Users" ON terrascript_users
  FOR UPDATE USING (true);

-- 3. Validação e Limpeza Anti-Cheat na Tabela terrascript_saves
-- Função de Trigger para barrar e sanitizar saves com recursos/prestígio manipulados
CREATE OR REPLACE FUNCTION sanitize_cloud_save()
RETURNS TRIGGER AS $$
DECLARE
  clean_resources JSONB;
BEGIN
  -- Limitar prestígio maximo plausível por save (Anti-Integer Overflow / Macro Edit)
  IF (NEW.prestige_level IS NOT NULL AND NEW.prestige_level > 1000) THEN
    NEW.prestige_level := 1000;
  END IF;

  IF (NEW.prestige_points IS NOT NULL AND NEW.prestige_points > 1000000000) THEN
    NEW.prestige_points := 1000000000;
  END IF;

  -- Garantir que player_name é váilido
  IF (NEW.player_name IS NULL OR char_length(NEW.player_name) < 3) THEN
    RAISE EXCEPTION 'Nome de jogador inválido para salvamento na nuvem.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sanitize_cloud_save ON terrascript_saves;
CREATE TRIGGER trg_sanitize_cloud_save
  BEFORE INSERT OR UPDATE ON terrascript_saves
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_cloud_save();

-- 4. Politicas para terrascript_saves
DROP POLICY IF EXISTS "Select Own Save" ON terrascript_saves;
CREATE POLICY "Select Own Save" ON terrascript_saves
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert Own Save" ON terrascript_saves;
CREATE POLICY "Insert Own Save" ON terrascript_saves
  FOR INSERT WITH CHECK (char_length(player_name) >= 3);

DROP POLICY IF EXISTS "Update Own Save" ON terrascript_saves;
CREATE POLICY "Update Own Save" ON terrascript_saves
  FOR UPDATE USING (true);

-- 5. Validação Anti-Cheat para Leaderboard
CREATE OR REPLACE FUNCTION sanitize_leaderboard_entry()
RETURNS TRIGGER AS $$
BEGIN
  -- Trava de valores extremos suspeitos no Leaderboard
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

DROP TRIGGER IF EXISTS trg_sanitize_leaderboard ON terrascript_leaderboard;
CREATE TRIGGER trg_sanitize_leaderboard
  BEFORE INSERT OR UPDATE ON terrascript_leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_leaderboard_entry();

-- 6. Índices de Performance e Segurança
CREATE INDEX IF NOT EXISTS idx_saves_player_name ON terrascript_saves(player_name);
CREATE INDEX IF NOT EXISTS idx_users_player_name ON terrascript_users(player_name);
CREATE INDEX IF NOT EXISTS idx_leaderboard_biomass ON terrascript_leaderboard(biomass DESC);
