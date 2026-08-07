-- =========================================================================
-- MIGRATION V2.9.1 - SINCRONIZAÇÃO DE VERSÃO E DESTAQUES VISUAIS DE TERRENO
-- =========================================================================

INSERT INTO public.terrascript_config (key, value, description)
VALUES ('game_engine_version', '2.9.1', 'Versão atual exigida da engine TerraScript')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = NOW();
