-- =========================================================================
-- TERRASCRIPT 3D - MIGRATION INCREMENTAL V2.8.4
-- Execute este script no SQL Editor do Supabase Dashboard após aplicar a v2.8.3
-- =========================================================================

-- REGISTRO / UPDATE DA VERSÃO ATUAL DA ENGINE (2.8.4)
INSERT INTO public.terrascript_config (key, value, description)
VALUES ('game_engine_version', '2.8.4', 'Versão atual exigida da engine TerraScript')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
