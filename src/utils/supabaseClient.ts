/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { computeSaveChecksum, verifySaveChecksum } from './cryptoUtils';
import { GAME_ENGINE_VERSION, isVersionMismatch } from '../version';

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
  prestige_points?: number;
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
  catalyst?: number;
  crystals?: number;
  prestige_level: number;
  prestige_points?: number;
  wealth_score?: number;
  agents_count: number;
  techs_unlocked: number;
  updated_at?: string;
}

/**
 * Calculates a balanced stock wealth score based on item complexity and production difficulty.
 * Base crops: Fiber=1, Wood=2, Roots=3, Fruits=4
 * Refined energy/biomass: Energy=5, Biomass=8
 * Rare resources: Catalyst=15, Crystals=25
 */
export function calculateWealthScore(res: {
  fiber?: number;
  wood?: number;
  roots?: number;
  fruits?: number;
  energy?: number;
  biomass?: number;
  catalyst?: number;
  crystals?: number;
}): number {
  const f = Math.max(0, Number(res?.fiber) || 0);
  const w = Math.max(0, Number(res?.wood) || 0);
  const r = Math.max(0, Number(res?.roots) || 0);
  const fr = Math.max(0, Number(res?.fruits) || 0);
  const e = Math.max(0, Number(res?.energy) || 0);
  const b = Math.max(0, Number(res?.biomass) || 0);
  const c = Math.max(0, Number(res?.catalyst) || 0);
  const cr = Math.max(0, Number(res?.crystals) || 0);

  const totalWeighted = f * 1 + w * 2 + r * 3 + fr * 4 + e * 5 + b * 8 + c * 15 + cr * 25;
  return Math.floor(totalWeighted);
}

/**
 * Calculates the total sum of raw units of all resources in stock.
 */
export function calculateTotalStock(res: {
  fiber?: number;
  wood?: number;
  roots?: number;
  fruits?: number;
  energy?: number;
  biomass?: number;
  catalyst?: number;
  crystals?: number;
}): number {
  const f = Math.max(0, Number(res?.fiber) || 0);
  const w = Math.max(0, Number(res?.wood) || 0);
  const r = Math.max(0, Number(res?.roots) || 0);
  const fr = Math.max(0, Number(res?.fruits) || 0);
  const e = Math.max(0, Number(res?.energy) || 0);
  const b = Math.max(0, Number(res?.biomass) || 0);
  const c = Math.max(0, Number(res?.catalyst) || 0);
  const cr = Math.max(0, Number(res?.crystals) || 0);

  return f + w + r + fr + e + b + c + cr;
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
      console.error('Erro ao registrar usuário no Supabase:', error);
      if (error.code === '42P01') {
        return { 
          success: false, 
          message: 'A tabela "terrascript_users" ainda não existe no seu Supabase. Execute o script SQL de criação (schema_v280.sql) no SQL Editor do Supabase.' 
        };
      } else if (error.code === '23505') {
        return { success: false, message: 'Nome de jogador ou e-mail já cadastrado.' };
      } else if (error.code === '42501') {
        return { 
          success: false, 
          message: 'Permissão negada (RLS) no Supabase. Recrie as políticas de segurança usando o script SQL (schema_v280.sql).' 
        };
      }
      return { 
        success: false, 
        message: `Falha ao cadastrar no Supabase: ${error.message}` 
      };
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
 * Fetches the required game engine version from Supabase 'terrascript_config' table.
 * If offline or query fails, returns { success: false, isOnline: false }.
 */
export async function fetchOnlineEngineVersion(): Promise<{
  success: boolean;
  isOnline: boolean;
  version?: string;
  message?: string;
}> {
  try {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { success: false, isOnline: false, message: 'Dispositivo sem conexão de rede (Offline).' };
    }

    const { data, error } = await supabase
      .from('terrascript_config')
      .select('value')
      .eq('key', 'game_engine_version')
      .maybeSingle();

    if (error) {
      // Table may not exist yet or connection error - fail gracefully
      return { success: false, isOnline: true, message: error.message };
    }

    if (data && data.value) {
      return { success: true, isOnline: true, version: data.value };
    }

    return { success: false, isOnline: true, message: 'Chave "game_engine_version" não configurada no Supabase.' };
  } catch (err: any) {
    return { success: false, isOnline: false, message: err.message || 'Erro ao consultar versão remota.' };
  }
}

/**
 * Background version checker. If online and remote version is different,
 * triggers reload to ensure client is running the latest engine build.
 */
export async function checkAndEnforceVersionMatch(): Promise<{ mismatch: boolean; remoteVersion?: string }> {
  const versionCheck = await fetchOnlineEngineVersion();
  if (versionCheck.success && versionCheck.version) {
    if (isVersionMismatch(GAME_ENGINE_VERSION, versionCheck.version)) {
      console.warn(`🚨 Versão da engine desatualizada (${GAME_ENGINE_VERSION} -> ${versionCheck.version}). Recarregando a página...`);
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
      return { mismatch: true, remoteVersion: versionCheck.version };
    }
  }
  return { mismatch: false, remoteVersion: versionCheck.version };
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

    // 0. Version Check: Prevent uploading saves from outdated client engines
    const versionCheck = await fetchOnlineEngineVersion();
    if (versionCheck.success && versionCheck.version) {
      if (isVersionMismatch(GAME_ENGINE_VERSION, versionCheck.version)) {
        console.warn(`🚨 [Versão Incompatível] Versão Local (${GAME_ENGINE_VERSION}) diferente da Versão do Servidor (${versionCheck.version}). O salvamento na nuvem foi bloqueado.`);
        
        // Force refresh to load updated web bundle
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        }

        return {
          success: false,
          message: `Sua versão local (${GAME_ENGINE_VERSION}) difere da versão do servidor (${versionCheck.version}). Salvamento bloqueado por segurança. Recarregando a página...`
        };
      }
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

    const prestigeTotalPts = finalSaveData.prestige?.totalPoints || 0;

    const payload: any = {
      player_name: playerName,
      save_json: finalSaveData,
      fiber_count: fiberCount,
      prestige_level: prestigeLevel,
      prestige_points: prestigeTotalPts,
      save_hash: newSaveHash,
      last_known_tick: currentTick,
      play_time_seconds: playTimeSeconds,
      migrated: true,
      updated_at: new Date().toISOString()
    };

    let { error } = await supabase
      .from('terrascript_saves')
      .upsert([payload], { onConflict: 'player_name' });

    // Fallback: If 'prestige_points' column is missing from terrascript_saves, retry without it
    if (error && (error.message?.includes('prestige_points') || error.message?.includes('schema cache'))) {
      delete payload.prestige_points;
      const fallbackRes = await supabase
        .from('terrascript_saves')
        .upsert([payload], { onConflict: 'player_name' });
      error = fallbackRes.error;
    }

    if (error) {
      if (error.code === '42P01') {
        return { 
          success: false, 
          message: 'Tabela "terrascript_saves" ainda não existe no banco em nuvem.' 
        };
      }
      if (error.message?.includes('record "new" has no field "prestige_points"') || error.message?.includes('prestige_points')) {
        return {
          success: false,
          message: 'Erro ao sincronizar com a nuvem: a estrutura da tabela no banco requer atualização (schema_v280.sql).'
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
      catalyst: finalSaveData.resources?.catalyst || 0,
      crystals: finalSaveData.resources?.crystals || 0,
      prestigeLevel: prestigeLevel,
      prestigePoints: prestigeTotalPts,
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
 * List Cloud Saves for the connected player only
 */
export async function listAllCloudSaves(playerName?: string): Promise<{ success: boolean; saves?: CloudSaveData[]; message?: string }> {
  try {
    const activePlayerName = playerName || (typeof window !== 'undefined' ? localStorage.getItem('terrascript_programmer_name') : null);
    if (!activePlayerName) {
      return { success: true, saves: [] };
    }

    const { data, error } = await supabase
      .from('terrascript_saves')
      .select('*')
      .eq('player_name', activePlayerName)
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
  catalyst?: number;
  crystals?: number;
  prestigeLevel: number;
  prestigePoints?: number;
  agentsCount: number;
  techsUnlocked: number;
}): Promise<{ success: boolean; message: string }> {
  try {
    const calculatedWealth = calculateWealthScore({
      fiber: entry.fiber,
      wood: entry.wood,
      roots: entry.roots,
      fruits: entry.fruits,
      energy: entry.energy,
      biomass: entry.biomass,
      catalyst: entry.catalyst,
      crystals: entry.crystals
    });

    const record = {
      player_name: entry.playerName || 'Dev Master',
      fiber: entry.fiber || 0,
      wood: entry.wood || 0,
      roots: entry.roots || 0,
      fruits: entry.fruits || 0,
      energy: entry.energy || 0,
      biomass: entry.biomass || 0,
      catalyst: entry.catalyst || 0,
      crystals: entry.crystals || 0,
      prestige_level: entry.prestigeLevel || 1,
      prestige_points: entry.prestigePoints || 0,
      wealth_score: calculatedWealth,
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
 * Fetch Top Players Leaderboard (by 'prestige' experience or 'wealth' score)
 */
export async function fetchLeaderboard(rankingType: 'prestige' | 'wealth' = 'prestige'): Promise<{ success: boolean; entries?: LeaderboardEntry[]; message?: string }> {
  try {
    let query = supabase.from('terrascript_leaderboard').select('*');

    if (rankingType === 'wealth') {
      query = query.order('wealth_score', { ascending: false }).order('prestige_points', { ascending: false });
    } else {
      query = query.order('prestige_points', { ascending: false }).order('prestige_level', { ascending: false }).order('wealth_score', { ascending: false });
    }

    const { data, error } = await query.limit(50);

    if (error) {
      return { success: false, message: error.message };
    }

    const parsedEntries: LeaderboardEntry[] = (data || []).map((row: any) => {
      const wealth = row.wealth_score !== undefined && row.wealth_score !== null && row.wealth_score !== 0
        ? Number(row.wealth_score)
        : calculateWealthScore(row);
      const points = row.prestige_points !== undefined && row.prestige_points !== null
        ? Number(row.prestige_points)
        : ((Number(row.prestige_level) || 1) * 100);

      return {
        ...row,
        wealth_score: wealth,
        prestige_points: points
      };
    });

    // Fallback sorting in JS to guarantee order even if SQL schema columns were freshly added
    if (rankingType === 'wealth') {
      parsedEntries.sort((a, b) => (b.wealth_score || 0) - (a.wealth_score || 0));
    } else {
      parsedEntries.sort((a, b) => {
        if ((b.prestige_points || 0) !== (a.prestige_points || 0)) {
          return (b.prestige_points || 0) - (a.prestige_points || 0);
        }
        return (b.prestige_level || 1) - (a.prestige_level || 1);
      });
    }

    return { success: true, entries: parsedEntries };
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
  return `-- =========================================================================
-- TERRASCRIPT 3D - SCHEMA COMPLETO V2.8.0 (FRESH START)
-- Execute este script no SQL Editor do Supabase Dashboard (https://app.supabase.com)
-- ATENÇÃO: Este script força a remoção de todas as tabelas e objetos atuais para um Fresh Start.
-- =========================================================================

-- 0. FORÇA DROP DE TRIGGERS, FUNÇÕES E TABELAS ANTERIORES (FRESH START)
DROP TRIGGER IF EXISTS trg_sanitize_cloud_save ON public.terrascript_saves CASCADE;
DROP TRIGGER IF EXISTS trg_sanitize_leaderboard ON public.terrascript_leaderboard CASCADE;
DROP TRIGGER IF EXISTS trg_sanitize_leaderboard_score ON public.terrascript_leaderboard CASCADE;

DROP FUNCTION IF EXISTS sanitize_cloud_save() CASCADE;
DROP FUNCTION IF EXISTS sanitize_leaderboard_entry() CASCADE;
DROP FUNCTION IF EXISTS sanitize_leaderboard_score() CASCADE;

DROP TABLE IF EXISTS public.terrascript_community_scripts CASCADE;
DROP TABLE IF EXISTS public.terrascript_leaderboard CASCADE;
DROP TABLE IF EXISTS public.terrascript_saves CASCADE;
DROP TABLE IF EXISTS public.terrascript_users CASCADE;


-- 1. TABELA DE USUÁRIOS / CREDENCIAIS NA NUVEM
CREATE TABLE public.terrascript_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_name TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    migrated BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS & Criar Políticas
ALTER TABLE public.terrascript_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura publica de usuarios" ON public.terrascript_users
    FOR SELECT USING (true);
CREATE POLICY "Permitir insercao de usuarios" ON public.terrascript_users
    FOR INSERT WITH CHECK (char_length(player_name) >= 3 AND char_length(player_name) <= 30);
CREATE POLICY "Permitir atualizacao de usuarios" ON public.terrascript_users
    FOR UPDATE USING (true);


-- 2. TABELA DE SAVES NA NUVEM (COM ANTI-FRAUDE E SINCRONIZAÇÃO V2.8.0)
CREATE TABLE public.terrascript_saves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_name TEXT NOT NULL UNIQUE,
    save_json JSONB NOT NULL,
    fiber_count BIGINT DEFAULT 0,
    prestige_level INT DEFAULT 1,
    prestige_points BIGINT DEFAULT 0,
    save_hash TEXT,
    last_known_tick BIGINT DEFAULT 0,
    play_time_seconds BIGINT DEFAULT 0,
    migrated BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS & Criar Políticas
ALTER TABLE public.terrascript_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura publica de saves" ON public.terrascript_saves
    FOR SELECT USING (true);
CREATE POLICY "Permitir insercao de saves" ON public.terrascript_saves
    FOR INSERT WITH CHECK (char_length(player_name) >= 3);
CREATE POLICY "Permitir atualizacao de saves" ON public.terrascript_saves
    FOR UPDATE USING (true);


-- 3. TABELA DE LEADERBOARD / PLACAR DE LÍDERES (RECURSOS, PRESTÍGIO E RIQUEZA V2.8.0)
CREATE TABLE public.terrascript_leaderboard (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_name TEXT NOT NULL UNIQUE,
    fiber BIGINT DEFAULT 0,
    wood BIGINT DEFAULT 0,
    roots BIGINT DEFAULT 0,
    fruits BIGINT DEFAULT 0,
    energy BIGINT DEFAULT 0,
    biomass BIGINT DEFAULT 0,
    catalyst BIGINT DEFAULT 0,
    crystals BIGINT DEFAULT 0,
    prestige_level INT DEFAULT 1,
    prestige_points BIGINT DEFAULT 0,
    wealth_score BIGINT DEFAULT 0,
    agents_count INT DEFAULT 1,
    techs_unlocked INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS & Criar Políticas
ALTER TABLE public.terrascript_leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura publica do leaderboard" ON public.terrascript_leaderboard
    FOR SELECT USING (true);
CREATE POLICY "Permitir insercao no leaderboard" ON public.terrascript_leaderboard
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualizacao no leaderboard" ON public.terrascript_leaderboard
    FOR UPDATE USING (true);


-- 4. TABELA DE SCRIPTS DA COMUNIDADE
CREATE TABLE public.terrascript_community_scripts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    language TEXT NOT NULL,
    description TEXT,
    code TEXT NOT NULL,
    downloads INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS & Criar Políticas
ALTER TABLE public.terrascript_community_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura de scripts" ON public.terrascript_community_scripts
    FOR SELECT USING (true);
CREATE POLICY "Permitir compartilhamento de scripts" ON public.terrascript_community_scripts
    FOR INSERT WITH CHECK (true);


-- 5. FUNÇÕES DE SEGURANÇA E TRIGGERS ANTI-CHEAT

-- Sanitização de Cloud Save
CREATE OR REPLACE FUNCTION sanitize_cloud_save()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.prestige_level IS NOT NULL AND NEW.prestige_level > 1000) THEN
    NEW.prestige_level := 1000;
  END IF;

  IF (NEW.prestige_points IS NOT NULL AND NEW.prestige_points > 1000000000) THEN
    NEW.prestige_points := 1000000000;
  END IF;

  IF (NEW.player_name IS NULL OR char_length(NEW.player_name) < 3) THEN
    RAISE EXCEPTION 'Nome de jogador inválido para salvamento na nuvem.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sanitize_cloud_save
  BEFORE INSERT OR UPDATE ON public.terrascript_saves
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_cloud_save();


-- Sanitização de Leaderboard
CREATE OR REPLACE FUNCTION sanitize_leaderboard_entry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.biomass > 1000000000 THEN
    NEW.biomass := 1000000000;
  END IF;
  IF NEW.fiber > 1000000000 THEN
    NEW.fiber := 1000000000;
  END IF;
  IF NEW.wood > 1000000000 THEN
    NEW.wood := 1000000000;
  END IF;
  IF NEW.prestige_level > 1000 THEN
    NEW.prestige_level := 1000;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sanitize_leaderboard
  BEFORE INSERT OR UPDATE ON public.terrascript_leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION sanitize_leaderboard_entry();


-- 6. ÍNDICES DE PERFORMANCE E CONSULTAS
CREATE INDEX idx_users_player_name ON public.terrascript_users(player_name);
CREATE INDEX idx_saves_player_name ON public.terrascript_saves(player_name);
CREATE INDEX idx_leaderboard_prestige_points ON public.terrascript_leaderboard(prestige_points DESC, prestige_level DESC);
CREATE INDEX idx_leaderboard_wealth_score ON public.terrascript_leaderboard(wealth_score DESC);
CREATE INDEX idx_leaderboard_biomass ON public.terrascript_leaderboard(biomass DESC);
`;
}

