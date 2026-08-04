/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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

export interface CloudSaveData {
  id?: string;
  player_name: string;
  save_json: any;
  fiber_count: number;
  prestige_level: number;
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
 * Test connection to Supabase REST endpoint
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
      return { success: true, message: 'Conectado ao Supabase com sucesso!' };
    }
    return { success: false, message: `Status de resposta HTTP: ${res.status} ${res.statusText}` };
  } catch (err: any) {
    console.error('Erro de conexão Supabase:', err);
    return { success: false, message: err.message || 'Não foi possível conectar ao Supabase.' };
  }
}

/**
 * Save Game Progress to Cloud (Supabase)
 */
export async function uploadCloudSave(
  playerName: string, 
  saveData: any, 
  fiberCount: number, 
  prestigeLevel: number
): Promise<{ success: boolean; message: string }> {
  try {
    const payload = {
      player_name: playerName || 'Programador Anônimo',
      save_json: saveData,
      fiber_count: fiberCount,
      prestige_level: prestigeLevel,
      updated_at: new Date().toISOString()
    };

    // Attempt to upsert in `terrascript_saves`
    const { data, error } = await supabase
      .from('terrascript_saves')
      .upsert([payload], { onConflict: 'player_name' });

    if (error) {
      // If table doesn't exist, try alternative table name or return error with SQL instructions
      if (error.code === '42P01') {
        return { 
          success: false, 
          message: 'Tabela "terrascript_saves" ainda não existe no Supabase. Crie as tabelas executando o script SQL no Supabase!' 
        };
      }
      return { success: false, message: `Erro ao salvar na nuvem: ${error.message}` };
    }

    return { success: true, message: 'Progresso salvo na nuvem Supabase com sucesso!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Erro inesperado ao conectar ao Supabase.' };
  }
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
 * Submit High Score / Progress to Global Supabase Leaderboard
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
          message: 'Tabela "terrascript_leaderboard" não existe no Supabase. Crie as tabelas com a Query SQL fornecida.' 
        };
      }
      return { success: false, message: `Erro no Leaderboard: ${error.message}` };
    }

    return { success: true, message: 'Sua pontuação foi publicada no Leaderboard Supabase!' };
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
 * Share script to Supabase Community Scripts
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
        return { success: false, message: 'Tabela "terrascript_community_scripts" não existe no Supabase.' };
      }
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Script compartilhado com a comunidade no Supabase!' };
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

-- 1. Tabela de Saves na Nuvem
CREATE TABLE IF NOT EXISTS public.terrascript_saves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_name TEXT NOT NULL UNIQUE,
    save_json JSONB NOT NULL,
    fiber_count BIGINT DEFAULT 0,
    prestige_level INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS & Allow public read/write
ALTER TABLE public.terrascript_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura publica de saves" ON public.terrascript_saves FOR SELECT USING (true);
CREATE POLICY "Permitir criacao/atualizacao publica de saves" ON public.terrascript_saves FOR ALL USING (true);

-- 2. Tabela de Leaderboard / Placar de Líderes
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

-- 3. Tabela de Scripts da Comunidade
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
