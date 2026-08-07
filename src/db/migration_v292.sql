-- =========================================================================
-- MIGRATION V2.9.2 - SINCRONIZAÇÃO DE VERSÃO DA ENGINE E NARRATIVA MUDANÇA DO MUNDO
-- =========================================================================

INSERT INTO public.terrascript_config (key, value, description)
VALUES ('game_engine_version', '2.9.2', 'Versão atual exigida da engine TerraScript')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = NOW();
