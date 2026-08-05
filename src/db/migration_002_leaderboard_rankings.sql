-- ==============================================================================
-- TerraScript 3D - Migration 002: Dual Leaderboard Rankings
-- (Prestígio Mais Alto & Maior Riqueza em Estoque)
--
-- Execute este script no SQL Editor do Supabase Dashboard (app.supabase.com)
-- ==============================================================================

-- 1. Adicionar colunas de experiência de prestígio, riqueza em estoque e novos recursos
ALTER TABLE public.terrascript_leaderboard 
  ADD COLUMN IF NOT EXISTS prestige_points BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wealth_score BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS catalyst BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS crystals BIGINT DEFAULT 0;

-- 2. Criar índices de alta performance para consulta dos dois rankings
CREATE INDEX IF NOT EXISTS idx_leaderboard_prestige_points 
  ON public.terrascript_leaderboard (prestige_points DESC, prestige_level DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboard_wealth_score 
  ON public.terrascript_leaderboard (wealth_score DESC);

-- 3. Atualizar registros existentes para calcular wealth_score inicial se estiver em zero
UPDATE public.terrascript_leaderboard
SET wealth_score = (
  COALESCE(fiber, 0) * 1 +
  COALESCE(wood, 0) * 2 +
  COALESCE(roots, 0) * 3 +
  COALESCE(fruits, 0) * 4 +
  COALESCE(energy, 0) * 5 +
  COALESCE(biomass, 0) * 8 +
  COALESCE(catalyst, 0) * 15 +
  COALESCE(crystals, 0) * 25
)
WHERE wealth_score IS NULL OR wealth_score = 0;

-- 4. Garantir permissões de RLS para inserção e atualização
ALTER TABLE public.terrascript_leaderboard ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura publica do leaderboard" ON public.terrascript_leaderboard;
DROP POLICY IF EXISTS "Permitir insercao no leaderboard" ON public.terrascript_leaderboard;
DROP POLICY IF EXISTS "Permitir atualizacao no leaderboard" ON public.terrascript_leaderboard;

CREATE POLICY "Permitir leitura publica do leaderboard" ON public.terrascript_leaderboard FOR SELECT USING (true);
CREATE POLICY "Permitir insercao no leaderboard" ON public.terrascript_leaderboard FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualizacao no leaderboard" ON public.terrascript_leaderboard FOR UPDATE USING (true) WITH CHECK (true);
