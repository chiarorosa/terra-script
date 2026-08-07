-- =========================================================================
-- TERRASCRIPT 3D - MIGRATION INCREMENTAL V2.8.1
-- Execute este script no SQL Editor do Supabase Dashboard após aplicar a v2.8.0
-- =========================================================================

-- 1. TABELA DE CONFIGURAÇÃO DO SISTEMA E VERSÃO DA ENGINE
CREATE TABLE IF NOT EXISTS public.terrascript_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.terrascript_config ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'terrascript_config' AND policyname = 'Permitir leitura publica de configuracao'
    ) THEN
        CREATE POLICY "Permitir leitura publica de configuracao" ON public.terrascript_config
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'terrascript_config' AND policyname = 'Permitir edicao de configuracao'
    ) THEN
        CREATE POLICY "Permitir edicao de configuracao" ON public.terrascript_config
            FOR ALL USING (true);
    END IF;
END $$;

-- 2. REGISTRO / UPDATE DA VERSÃO ATUAL DA ENGINE (2.8.1)
INSERT INTO public.terrascript_config (key, value, description)
VALUES ('game_engine_version', '2.8.1', 'Versão atual exigida da engine TerraScript')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
