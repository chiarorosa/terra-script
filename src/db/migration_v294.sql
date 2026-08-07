-- =========================================================================
-- MIGRATION V2.9.4 - NOVAS CONQUISTAS DE MULTIPLICADOR DE COMBO
-- =========================================================================

INSERT INTO public.terrascript_config (key, value, description)
VALUES ('game_engine_version', '2.9.4', 'Versão atual exigida da engine TerraScript')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    updated_at = NOW();
