-- =========================================================================
-- TERRASCRIPT 3D - MIGRATION INCREMENTAL V2.8.2
-- Execute este script no SQL Editor do Supabase Dashboard após aplicar a v2.8.1
-- =========================================================================

-- 1. TABELA DE CÓDIGOS DE RESGATE (REDEEM CODES)
CREATE TABLE IF NOT EXISTS public.terrascript_redeem_codes (
    code TEXT PRIMARY KEY,
    description TEXT,
    reward JSONB NOT NULL,
    active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    max_uses INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.terrascript_redeem_codes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'terrascript_redeem_codes' AND policyname = 'Permitir leitura publica de codigos de resgate'
    ) THEN
        CREATE POLICY "Permitir leitura publica de codigos de resgate" ON public.terrascript_redeem_codes
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'terrascript_redeem_codes' AND policyname = 'Permitir edicao de codigos de resgate'
    ) THEN
        CREATE POLICY "Permitir edicao de codigos de resgate" ON public.terrascript_redeem_codes
            FOR ALL USING (true);
    END IF;
END $$;


-- 2. TABELA DE REGISTRO DE RESGATES REALIZADOS POR JOGADOR
CREATE TABLE IF NOT EXISTS public.terrascript_code_redemptions (
    id BIGSERIAL PRIMARY KEY,
    code TEXT NOT NULL REFERENCES public.terrascript_redeem_codes(code) ON DELETE CASCADE,
    player_name TEXT NOT NULL,
    redeemed_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_player_code_redemption UNIQUE (code, player_name)
);

ALTER TABLE public.terrascript_code_redemptions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'terrascript_code_redemptions' AND policyname = 'Permitir leitura publica de resgates'
    ) THEN
        CREATE POLICY "Permitir leitura publica de resgates" ON public.terrascript_code_redemptions
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'terrascript_code_redemptions' AND policyname = 'Permitir registro de resgate'
    ) THEN
        CREATE POLICY "Permitir registro de resgate" ON public.terrascript_code_redemptions
            FOR ALL USING (true);
    END IF;
END $$;


-- 3. CÓDIGO PROMOCIONAL DE EXEMPLO (VÁLIDO ATÉ 10 DE AGOSTO DE 2026)
-- Recompensa: 1.000 Fibras, 1.000 Madeiras, 1.000 Frutas e 1.000 Raízes
INSERT INTO public.terrascript_redeem_codes (code, description, reward, active, expires_at)
VALUES (
    'TERRA1K',
    'Pacote Inicial: 1.000 Fibras, Madeiras, Frutas e Raízes!',
    '{"resources": {"fiber": 1000, "wood": 1000, "fruits": 1000, "roots": 1000}}'::jsonb,
    true,
    '2026-08-10 23:59:59+00'
)
ON CONFLICT (code) DO UPDATE SET 
    description = EXCLUDED.description,
    reward = EXCLUDED.reward,
    expires_at = EXCLUDED.expires_at,
    active = EXCLUDED.active;


-- 4. REGISTRO / UPDATE DA VERSÃO ATUAL DA ENGINE (2.8.2)
INSERT INTO public.terrascript_config (key, value, description)
VALUES ('game_engine_version', '2.8.2', 'Versão atual exigida da engine TerraScript')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
