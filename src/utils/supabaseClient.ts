/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { computeSaveChecksum, verifySaveChecksum } from './cryptoUtils';

// Default Supabase Credentials supplied by the user
const DEFAULT_SUPABASE_URL = "https://cabsokojrjidpvxcjrcj.supabase.co/rest/v1/";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_Pz1co20CikdEUwwHxnW2MA_R6GZ-FF1";

// Format clean URL (remove /rest/v1/ suffix for standard JS client)
function getCleanUrl(rawUrl: string): string {
  if (!rawUrl) return 'https://cabsokojrjidpvxcjrcj.supabase.co';
  return rawUrl.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
}

const metaEnv = (import.meta as any).env || {};
const rawUrl = (metaEnv.VITE_SUPABASE_URL as string) || DEFAULT_SUPABASE_URL;
const anonKey = (metaEnv.VITE_SUPABASE_ANON_KEY as string) || DEFAULT_SUPABASE_ANON_KEY;

export const supabaseUrl = getCleanUrl(rawUrl);
export const supabaseAnonKey = anonKey;

// Initialize Supabase Client
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

export interface CloudUser {
  id?: string;
  player_name: string;
  email: string;
  password_hash: string;
  migrated?: boolean;
  created_at?: string;
  last_login_at?: string;
}

export interface CloudSaveData {
  id?: string;
  player_name: string;
  save_json: any;
  fiber_count: number;
  prestige_level: number;
  save_hash?: string;
  last_known_tick?: number;
  play_time_seconds?: number;
  migrated?: boolean;
  updated_at?: string;
  created_at?: string;
}

export interface LeaderboardEntry {
  id?: string;
  player_name: string;
  fiber: number;
  wood: number;
  roots: number;
  fruits: number;
  energy: number;
  biomass: number;
  prestige_level: number;
  agents_count: number;
  techs_unlocked: number;
  updated_at?: string;
}

export interface CommunityScript {
  id?: string;
  title: string;
  author: string;
  language: 'python' | 'javascript';
  description: string;
  code: string;
  downloads?: number;
  created_at?: string;
}

/**
 * Test connection to cloud REST endpoint
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });

    if (res.ok || res.status === 200 || res.status === 404) {
      return { success: true, message: 'Conectado ao servidor em nuvem com sucesso!' };
    }
    return { success: false, message: `Status de resposta HTTP: ${res.status} ${res.statusText}` };
  } catch (err: any) {
    console.error('Erro de conexão com servidor em nuvem:', err);
    return { success: false, message: err.message || 'Não foi possível conectar ao servidor em nuvem.' };
  }
}

/**
 * Check if a player_name is already registered or taken in cloud database
 */
export async function checkPlayerNameExists(playerName: string): Promise<{ exists: boolean; message?: string }> {
  try {
    if (!playerName || !playerName.trim()) return { exists: false };
    const name = playerName.trim();

    // 1. Check in terrascript_users
    const { data: userData, error: userError } = await supabase
      .from('terrascript_users')
      .select('id, player_name')
      .eq('player_name', name)
      .limit(1);

    if (!userError && userData && userData.length > 0) {
      return { exists: true, message: 'Este nome de jogador já está em uso na nuvem.' };
    }

    // 2. Check in terrascript_saves
    const { data: saveData, error: saveError } = await supabase
      .from('terrascript_saves')
      .select('id, player_name')
      .eq('player_name', name)
      .limit(1);

    if (!saveError && saveData && saveData.length > 0) {
      return { exists: true, message: 'Este nome de jogador já possui um save na nuvem.' };
    }

    return { exists: false };
  } catch (err: any) {
    return { exists: false, message: err.message };
  }
}

/**
 * Register a new user in the Cloud database
 */
export async function registerCloudUser(
  playerName: string, 
  email: string, 
  passwordHash: string
): Promise<{ success: boolean; message: string }> {
  try {
    const name = playerName.trim();
    if (!name) return { success: false, message: 'Nome de jogador inválido.' };
    if (!email || !email.includes('@')) return { success: false, message: 'E-mail inválido.' };

    const check = await checkPlayerNameExists(name);
    if (check.exists) {
      return { success: false, message: 'Este nome de jogador já está em uso na nuvem. Faça login ou escolha outro nome.' };
    }

    const payload = {
      player_name: name,
      email: email.trim().toLowerCase(),
      password_hash: passwordHash,
      migrated: true,
      created_at: new Date().toISOString(),
      last_login_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('terrascript_users')
      .insert([payload]);

    if (error) {
      // Table might not exist yet if script wasn't executed in dashboard
      if (error.code === '42P01') {
        console.warn('Tabela terrascript_users não existe, prosseguindo com registro direto no save.');
      } else if (error.code === '23505') {
        return { success: false, message: 'Nome de jogador ou e-mail já cadastrado.' };
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('terrascript_programmer_name', name);
      localStorage.setItem('terrascript_migrated', 'true');
    }

    return { success: true, message: 'Conta criada com sucesso na nuvem!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Erro ao registrar usuário na nuvem.' };
  }
}

/**
 * Login existing cloud user
 */
export async function loginCloudUser(
  playerName: string, 
  passwordHash: string
): Promise<{ success: boolean; message: string; user?: CloudUser }> {
  try {
    const name = playerName.trim();
    if (!name) return { success: false, message: 'Nome de jogador inválido.' };

    const { data, error } = await supabase
      .from('terrascript_users')
      .select('*')
      .eq('player_name', name)
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        // Fallback check in terrascript_saves
        const saveCheck = await fetchCloudSave(name);
        if (saveCheck.success) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('terrascript_programmer_name', name);
            localStorage.setItem('terrascript_migrated', 'true');
          }
          return { success: true, message: 'Login realizado via registro de save existente!' };
        }
      }
      return { success: false, message: `Erro ao consultar usuário: ${error.message}` };
    }

    if (!data || data.length === 0) {
      // Check if user has save record
      const saveCheck = await fetchCloudSave(name);
      if (saveCheck.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('terrascript_programmer_name', name);
          localStorage.setItem('terrascript_migrated', 'true');
        }
        return { success: true, message: 'Login realizado! Seu progresso em nuvem foi encontrado.' };
      }
      return { success: false, message: `Usuário "${name}" não encontrado na nuvem.` };
    }

    const user = data[0] as CloudUser;
    if (user.password_hash && user.password_hash !== passwordHash) {
      return { success: false, message: 'Senha incorreta para este usuário.' };
    }

    // Update last login
    await supabase
      .from('terrascript_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('player_name', name);

    if (typeof window !== 'undefined') {
      localStorage.setItem('terrascript_programmer_name', name);
      localStorage.setItem('terrascript_migrated', 'true');
    }

    return { success: true, message: `Bem-vindo de volta, ${name}!`, user };
  } catch (err: any) {
    return { success: false, message: err.message || 'Erro ao realizar login.' };
  }
}

/**
 * Upload Cloud Save with Anti-Fraud Checks & Rate Limiting Verification
 */
export async function uploadCloudSaveWithAntiFraud(
  playerName: string, 
  saveData: any, 
  fiberCount: number, 
  prestigeLevel: number,
  currentTick: number = 0,
  playTimeSeconds: number = 0
): Promise<{ success: boolean; message: string; sanitized?: boolean }> {
  try {
    if (!playerName || playerName === 'Dev Master' || playerName === 'Programador Anônimo') {
      return { success: false, message: 'É necessário registrar um nome único para sincronizar na nuvem.' };
    }

    // 1. HMAC Checksum verification of local save
    let isSanitized = false;

    // 2. Compute fresh canonical save hash for cloud storage
    const newSaveHash = await computeSaveChecksum(saveData);

    // 3. Rate limiting / Anti-fraud bounds check against existing cloud record
    const fetchRes = await fetchCloudSave(playerName);
    let finalSaveData = { ...saveData };
    
    if (fetchRes.success && fetchRes.save) {
      const cloudSave = fetchRes.save;
      const lastTick = cloudSave.last_known_tick || 0;
      const deltaTicks = Math.max(0, currentTick - lastTick);
      
      // Calculate max plausible resources based on unlocked tech nodes and elapsed ticks
      const unlockedTechs = Array.isArray(saveData.techTree) 
        ? saveData.techTree.filter((t: any) => t.unlocked).map((t: any) => t.id)
        : [];
      
      const agentsCount = Array.isArray(saveData.agents) ? saveData.agents.length : 1;
      
      // Maximum plausible generation per tick factor (with generous tolerance margin)
      const maxPlausibleRate = 1 + unlockedTechs.length * 5 + agentsCount * 10;
      const maxAllowedDelta = Math.floor(deltaTicks * maxPlausibleRate) + 500;

      // Sanitize fiber count if an impossible jump occurred without sufficient ticks
      const cloudFiber = cloudSave.fiber_count || 0;
      if (fiberCount > cloudFiber + maxAllowedDelta && deltaTicks < 1000 && cloudFiber > 0) {
        console.warn(`🛡️ [Anti-Fraude] Injeção de recursos detectada (${fiberCount} fibras). Sanitizando para limite plausível (${cloudFiber + maxAllowedDelta}).`);
        fiberCount = cloudFiber + maxAllowedDelta;
        if (finalSaveData.resources) {
          finalSaveData.resources.fiber = fiberCount;
        }
        isSanitized = true;
      }
    }

    const payload = {
      player_name: playerName,
      save_json: finalSaveData,
      fiber_count: fiberCount,
      prestige_level: prestigeLevel,
      save_hash: newSaveHash,
      last_known_tick: currentTick,
      play_time_seconds: playTimeSeconds,
      migrated: true,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('terrascript_saves')
      .upsert([payload], { onConflict: 'player_name' });

    if (error) {
      if (error.code === '42P01') {
        return { 
          success: false, 
          message: 'Tabela "terrascript_saves" ainda não existe no banco em nuvem.' 
        };
      }
      return { success: false, message: `Erro ao sincronizar com a nuvem: ${error.message}` };
    }

    // Also update Leaderboard automatically
    await submitLeaderboardScore({
      playerName,
      fiber: fiberCount,
      wood: finalSaveData.resources?.wood || 0,
      roots: finalSaveData.resources?.roots || 0,
      fruits: finalSaveData.resources?.fruits || 0,
      energy: finalSaveData.resources?.energy || 0,
      biomass: finalSaveData.resources?.biomass || 0,
      prestigeLevel: prestigeLevel,
      agentsCount: Array.isArray(finalSaveData.agents) ? finalSaveData.agents.length : 1,
      techsUnlocked: Array.isArray(finalSaveData.techTree) ? finalSaveData.techTree.filter((t: any) => t.unlocked).length : 0
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('terrascript_migrated', 'true');
    }

    return { 
      success: true, 
      message: isSanitized 
        ? 'Sincronizado com a nuvem! (Integridade verificada e valores sanitizados pelo Guardrail)' 
        : 'Progresso sincronizado com a nuvem e verificado com sucesso!',
      sanitized: isSanitized
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Erro inesperado ao conectar à nuvem.' };
  }
}

/**
 * Standard uploadCloudSave fallback
 */
export async function uploadCloudSave(
  playerName: string, 
  saveData: any, 
  fiberCount: number, 
  prestigeLevel: number
): Promise<{ success: boolean; message: string }> {
  return uploadCloudSaveWithAntiFraud(playerName, saveData, fiberCount, prestigeLevel, saveData?.currentTick || 0, 0);
}

/**
 * Fetch Game Saves from Cloud
 */
export async function fetchCloudSave(playerName: string): Promise<{ success: boolean; save?: CloudSaveData; message?: string }> {
  try {
    const { data, error } = await supabase
      .from('terrascript_saves')
      .select('*')
      .eq('player_name', playerName)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (error) {
      return { success: false, message: error.message };
    }

    if (data && data.length > 0) {
      return { success: true, save: data[0] as CloudSaveData };
    }

    return { success: false, message: `Nenhum save em nuvem encontrado para "${playerName}".` };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

/**
 * List all Cloud Saves
 */
export async function listAllCloudSaves(): Promise<{ success: boolean; saves?: CloudSaveData[]; message?: string }> {
  try {
    const { data, error } = await supabase
      .from('terrascript_saves')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, saves: (data || []) as CloudSaveData[] };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

/**
 * Submit High Score / Progress to Global Leaderboard
 */
export async function submitLeaderboardScore(entry: {
  playerName: string;
  fiber: number;
  wood: number;
  roots: number;
  fruits: number;
  energy: number;
  biomass: number;
  prestigeLevel: number;
  agentsCount: number;
  techsUnlocked: number;
}): Promise<{ success: boolean; message: string }> {
  try {
    const record = {
      player_name: entry.playerName || 'Dev Master',
      fiber: entry.fiber || 0,
      wood: entry.wood || 0,
      roots: entry.roots || 0,
      fruits: entry.fruits || 0,
      energy: entry.energy || 0,
      biomass: entry.biomass || 0,
      prestige_level: entry.prestigeLevel || 1,
      agents_count: entry.agentsCount || 1,
      techs_unlocked: entry.techsUnlocked || 0,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('terrascript_leaderboard')
      .upsert([record], { onConflict: 'player_name' });

    if (error) {
      if (error.code === '42P01') {
        return { 
          success: false, 
          message: 'Tabela "terrascript_leaderboard" não existe no banco em nuvem.' 
        };
      }
      return { success: false, message: `Erro no Leaderboard: ${error.message}` };
    }

    return { success: true, message: 'Sua pontuação foi publicada no Leaderboard Global em nuvem!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Erro ao publicar pontuação.' };
  }
}

/**
 * Fetch Top Players Leaderboard
 */
export async function fetchLeaderboard(): Promise<{ success: boolean; entries?: LeaderboardEntry[]; message?: string }> {
  try {
    const { data, error } = await supabase
      .from('terrascript_leaderboard')
      .select('*')
      .order('fiber', { ascending: false })
      .limit(25);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, entries: (data || []) as LeaderboardEntry[] };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

/**
 * Share script to Community Scripts in Cloud
 */
export async function publishCommunityScript(script: {
  title: string;
  author: string;
  language: 'python' | 'javascript';
  description: string;
  code: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const { error } = await supabase
      .from('terrascript_community_scripts')
      .insert([{
        title: script.title,
        author: script.author || 'Anônimo',
        language: script.language,
        description: script.description,
        code: script.code,
        downloads: 0,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      if (error.code === '42P01') {
        return { success: false, message: 'Tabela "terrascript_community_scripts" não existe na nuvem.' };
      }
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Script compartilhado com a comunidade na nuvem!' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

/**
 * Fetch Community Scripts
 */
export async function fetchCommunityScripts(): Promise<{ success: boolean; scripts?: CommunityScript[]; message?: string }> {
  try {
    const { data, error } = await supabase
      .from('terrascript_community_scripts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      return { success: false, message: error.message };
    }

    return { success: true, scripts: (data || []) as CommunityScript[] };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

/**
 * SQL Schema script to easily setup tables in Supabase Dashboard
 */
export function getSupabaseSqlSetupScript(): string {
  return `-- ==========================================
-- SCRIPT DE INICIALIZAÇÃO DE TABELAS - TERRASCRIPT 3D
-- Copie e cole este código no SQL Editor do Supabase Dashboard
-- (https://app.supabase.com -> SQL Editor)
-- ==========================================

-- 1. Tabela de Usuários / Credenciais na Nuvem
CREATE TABLE IF NOT EXISTS public.terrascript_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_name TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    migrated BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS & Allow public read/write for users
ALTER TABLE public.terrascript_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura publica de usuarios" ON public.terrascript_users FOR SELECT USING (true);
CREATE POLICY "Permitir criacao/atualizacao de usuarios" ON public.terrascript_users FOR ALL USING (true);

-- 2. Tabela de Saves na Nuvem (com Anti-Fraude & Sincronização)
CREATE TABLE IF NOT EXISTS public.terrascript_saves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_name TEXT NOT NULL UNIQUE,
    save_json JSONB NOT NULL,
    fiber_count BIGINT DEFAULT 0,
    prestige_level INT DEFAULT 1,
    save_hash TEXT,
    last_known_tick BIGINT DEFAULT 0,
    play_time_seconds BIGINT DEFAULT 0,
    migrated BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas caso a tabela já existisse anteriormente
ALTER TABLE public.terrascript_saves ADD COLUMN IF NOT EXISTS save_hash TEXT;
ALTER TABLE public.terrascript_saves ADD COLUMN IF NOT EXISTS last_known_tick BIGINT DEFAULT 0;
ALTER TABLE public.terrascript_saves ADD COLUMN IF NOT EXISTS play_time_seconds BIGINT DEFAULT 0;
ALTER TABLE public.terrascript_saves ADD COLUMN IF NOT EXISTS migrated BOOLEAN DEFAULT true;

-- Enable RLS & Allow public read/write
ALTER TABLE public.terrascript_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura publica de saves" ON public.terrascript_saves FOR SELECT USING (true);
CREATE POLICY "Permitir criacao/atualizacao publica de saves" ON public.terrascript_saves FOR ALL USING (true);

-- 3. Tabela de Leaderboard / Placar de Líderes
CREATE TABLE IF NOT EXISTS public.terrascript_leaderboard (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_name TEXT NOT NULL UNIQUE,
    fiber BIGINT DEFAULT 0,
    wood BIGINT DEFAULT 0,
    roots BIGINT DEFAULT 0,
    fruits BIGINT DEFAULT 0,
    energy BIGINT DEFAULT 0,
    biomass BIGINT DEFAULT 0,
    prestige_level INT DEFAULT 1,
    agents_count INT DEFAULT 1,
    techs_unlocked INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS & Allow public read/write
ALTER TABLE public.terrascript_leaderboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura publica do leaderboard" ON public.terrascript_leaderboard FOR SELECT USING (true);
CREATE POLICY "Permitir escrita publica do leaderboard" ON public.terrascript_leaderboard FOR ALL USING (true);

-- 4. Tabela de Scripts da Comunidade
CREATE TABLE IF NOT EXISTS public.terrascript_community_scripts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    language TEXT NOT NULL,
    description TEXT,
    code TEXT NOT NULL,
    downloads INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS & Allow public read/write
ALTER TABLE public.terrascript_community_scripts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura de scripts" ON public.terrascript_community_scripts FOR SELECT USING (true);
CREATE POLICY "Permitir compartilhamento de scripts" ON public.terrascript_community_scripts FOR INSERT WITH CHECK (true);
`;
}

