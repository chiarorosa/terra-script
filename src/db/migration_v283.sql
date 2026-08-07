-- =========================================================================
-- TERRASCRIPT 3D - MIGRATION INCREMENTAL V2.8.3
-- Execute este script no SQL Editor do Supabase Dashboard após aplicar a v2.8.2
-- =========================================================================

-- 1. NOVO CÓDIGO PROMOCIONAL DE RESGATE (REDEEM CODE): PRESENTE
-- Recompensa: 20.000.000 de Experiência de Prestígio
INSERT INTO public.terrascript_redeem_codes (code, description, reward, active)
VALUES (
    'PAY2FAST',
    'Presente Especial: 20.000.000 de XP de Prestígio!',
    '{"prestige_xp": 20000000}'::jsonb,
    true
)
ON CONFLICT (code) DO UPDATE SET 
    description = EXCLUDED.description,
    reward = EXCLUDED.reward,
    active = EXCLUDED.active;


-- 2. REGISTRO / UPDATE DA VERSÃO ATUAL DA ENGINE (2.8.3)
INSERT INTO public.terrascript_config (key, value, description)
VALUES ('game_engine_version', '2.8.3', 'Versão atual exigida da engine TerraScript')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

