-- =========================================================================
-- TERRASCRIPT 3D - MIGRATION INCREMENTAL V2.9.0
-- Execute este script no SQL Editor do Supabase Dashboard após aplicar a v2.8.4
-- =========================================================================

-- REGISTRO / UPDATE DA VERSÃO ATUAL DA ENGINE (2.9.0)
INSERT INTO public.terrascript_config (key, value, description)
VALUES ('game_engine_version', '2.9.0', 'Versão atual exigida da engine TerraScript')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
