-- =========================================================================
-- MIGRATION V2.9.3 - CORREÇÃO DE AVALIAÇÃO DE MÉTODOS DE COMBO NO EXECUTOR DE SCRIPTS
-- =========================================================================

INSERT INTO public.terrascript_config (key, value, description)
VALUES ('game_engine_version', '2.9.3', 'Versão atual exigida da engine TerraScript')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = NOW();
