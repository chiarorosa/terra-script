import React, { useEffect, useState } from 'react';
import { 
  Database, 
  CloudUpload, 
  CloudDownload, 
  Trophy, 
  Share2, 
  Code, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw, 
  Sparkles,
  Server,
  Zap,
  Globe,
  Upload,
  Download,
  FileCode,
  User,
  ShieldCheck
} from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';
import { VirtualFS } from '../engine/virtualFs';
import { 
  supabaseUrl, 
  testSupabaseConnection, 
  uploadCloudSaveWithAntiFraud, 
  fetchCloudSave, 
  listAllCloudSaves, 
  submitLeaderboardScore, 
  fetchLeaderboard, 
  publishCommunityScript, 
  fetchCommunityScripts, 
  CloudSaveData,
  LeaderboardEntry,
  CommunityScript
} from '../utils/supabaseClient';

interface SupabaseModalProps {
  engine: GameEngine;
  vfs: VirtualFS;
  activeFilePath?: string;
  onClose: () => void;
  onFileImported?: (path: string) => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  engine,
  vfs,
  activeFilePath,
  onClose,
  onFileImported
}) => {
  const [activeTab, setActiveTab] = useState<'cloud_save' | 'leaderboard' | 'scripts'>('cloud_save');
  const [connectionStatus, setConnectionStatus] = useState<{ loading: boolean; success: boolean; message: string }>({
    loading: true,
    success: false,
    message: 'Verificando conexão com o servidor em nuvem...'
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Cloud Save state
  const [cloudSaves, setCloudSaves] = useState<CloudSaveData[]>([]);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [isLoadingSaves, setIsLoadingSaves] = useState(false);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  // Community Scripts state
  const [communityScripts, setCommunityScripts] = useState<CommunityScript[]>([]);
  const [isLoadingScripts, setIsLoadingScripts] = useState(false);
  const [isPublishingScript, setIsPublishingScript] = useState(false);
  const [scriptTitle, setScriptTitle] = useState('');
  const [scriptDesc, setScriptDesc] = useState('');

  const programmerName = typeof window !== 'undefined' ? (localStorage.getItem('terrascript_programmer_name') || 'Dev Master') : 'Dev Master';

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Test Connection
  const handleTestConnection = async () => {
    setConnectionStatus({ loading: true, success: false, message: 'Conectando...' });
    const res = await testSupabaseConnection();
    setConnectionStatus({ loading: false, success: res.success, message: res.message });
  };

  useEffect(() => {
    handleTestConnection();
    loadTabContent('cloud_save');
  }, []);

  const loadTabContent = async (tab: 'cloud_save' | 'leaderboard' | 'scripts') => {
    setActiveTab(tab);
    if (tab === 'cloud_save') {
      setIsLoadingSaves(true);
      const res = await listAllCloudSaves();
      if (res.success && res.saves) setCloudSaves(res.saves);
      setIsLoadingSaves(false);
    } else if (tab === 'leaderboard') {
      setIsLoadingLeaderboard(true);
      const res = await fetchLeaderboard();
      if (res.success && res.entries) setLeaderboard(res.entries);
      setIsLoadingLeaderboard(false);
    } else if (tab === 'scripts') {
      setIsLoadingScripts(true);
      const res = await fetchCommunityScripts();
      if (res.success && res.scripts) setCommunityScripts(res.scripts);
      setIsLoadingScripts(false);
    }
  };

  // 1. Upload Cloud Save
  const handleUploadSave = async () => {
    setIsSavingCloud(true);
    const saveData = engine.exportSaveData();
    const resources = engine.getResources();
    const prestige = engine.getPrestige().level;

    const res = await uploadCloudSaveWithAntiFraud(
      programmerName, 
      saveData, 
      resources.fiber, 
      prestige,
      saveData.currentTick || 0,
      0
    );
    setIsSavingCloud(false);

    if (res.success) {
      showFeedback('success', res.message);
      loadTabContent('cloud_save');
    } else {
      showFeedback('error', res.message);
    }
  };

  // 2. Load Selected Cloud Save
  const handleLoadSave = async (save: CloudSaveData) => {
    try {
      const ok = engine.importSaveData(save.save_json);
      if (ok) {
        showFeedback('success', `Save em nuvem de "${save.player_name}" carregado com sucesso!`);
        const ep = vfs.getEntrypoint();
        if (ep && onFileImported) onFileImported(ep.path);
      } else {
        showFeedback('error', 'Erro ao carregar os dados do save da nuvem.');
      }
    } catch (err: any) {
      showFeedback('error', `Falha ao importar save: ${err.message}`);
    }
  };

  // 3. Submit High Score
  const handleSubmitScore = async () => {
    setIsSubmittingScore(true);
    const resources = engine.getResources();
    const prestige = engine.getPrestige().level;
    const agents = engine.getAgents().length;
    const techs = engine.getUnlockedTechIds().length;

    const res = await submitLeaderboardScore({
      playerName: programmerName,
      fiber: resources.fiber,
      wood: resources.wood,
      roots: resources.roots,
      fruits: resources.fruits,
      energy: resources.energy,
      biomass: resources.biomass,
      prestigeLevel: prestige,
      agentsCount: agents,
      techsUnlocked: techs
    });

    setIsSubmittingScore(false);

    if (res.success) {
      showFeedback('success', res.message);
      loadTabContent('leaderboard');
    } else {
      showFeedback('error', res.message);
    }
  };

  // 4. Publish Current Active Script
  const handlePublishScript = async () => {
    const activeFile = activeFilePath ? vfs.getFile(activeFilePath) : vfs.getEntrypoint();
    if (!activeFile) {
      showFeedback('error', 'Nenhum script ativo selecionado para publicação.');
      return;
    }

    if (!scriptTitle.trim()) {
      showFeedback('error', 'Informe um título para o script antes de publicar.');
      return;
    }

    setIsPublishingScript(true);
    const res = await publishCommunityScript({
      title: scriptTitle.trim(),
      author: programmerName,
      language: activeFile.language as 'python' | 'javascript',
      description: scriptDesc.trim() || 'Script de automação para TerraScript 3D',
      code: activeFile.content
    });

    setIsPublishingScript(false);

    if (res.success) {
      showFeedback('success', res.message);
      setScriptTitle('');
      setScriptDesc('');
      loadTabContent('scripts');
    } else {
      showFeedback('error', res.message);
    }
  };

  // 5. Import Script from Community to VFS
  const handleImportCommunityScript = (script: CommunityScript) => {
    try {
      const ext = script.language === 'python' ? '.py' : '.js';
      const safeName = script.title.toLowerCase().replace(/[^a-z0-9]/g, '_') + ext;
      const created = vfs.importScriptFromDisk(safeName, script.code);
      showFeedback('success', `Script "${script.title}" importado para a workspace como "${created.name}"!`);
      if (onFileImported) onFileImported(created.path);
    } catch (err: any) {
      showFeedback('error', `Erro ao importar script: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 font-pixel-body select-none">
      <div className="bg-[#0f1011] pixel-box-emerald w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="px-5 py-4 bg-[#08090a] border-b-2 border-[#23252a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 pixel-box bg-[#161718] flex items-center justify-center text-[#10b981]">
              <Database className="w-5 h-5 text-[#10b981]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-pixel-header text-[#ffffff]">Sincronização em Nuvem</h2>
                <span className="text-[10px] font-pixel-mono px-2 py-0.5 rounded bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30">
                  Banco de Dados em Nuvem
                </span>
              </div>
              <p className="text-xs text-[#8a8f98] font-pixel-body">Cloud Saves, Leaderboard Global & Compartilhamento de Scripts na Nuvem</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#8a8f98] hover:text-[#ffffff] pixel-btn transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Banner */}
        <div className="px-5 py-2.5 bg-[#161718] border-b border-[#23252a] flex flex-wrap items-center justify-between gap-2 text-xs font-pixel-mono">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-[#10b981]" />
            <span className="text-[#8a8f98]">Servidor Nuvem:</span>
            <code className="text-[#34d399] bg-[#08090a] px-2 py-0.5 rounded border border-[#23252a] text-[11px] truncate max-w-[280px]">
              {supabaseUrl}
            </code>
          </div>

          <div className="flex items-center gap-2">
            {connectionStatus.loading ? (
              <span className="text-amber-400 flex items-center gap-1.5 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testando conexão...
              </span>
            ) : connectionStatus.success ? (
              <span className="text-[#10b981] flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#10b981]" /> Conectado com sucesso
              </span>
            ) : (
              <span className="text-rose-400 flex items-center gap-1.5 font-bold">
                <AlertCircle className="w-4 h-4 text-rose-400" /> Offline / Erro de Servidor
              </span>
            )}

            <button
              onClick={handleTestConnection}
              className="p-1 hover:bg-[#23252a] text-[#8a8f98] hover:text-white rounded transition-colors cursor-pointer"
              title="Re-testar conexão com a nuvem"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Feedback Notification Toast */}
        {notification && (
          <div className={`px-4 py-2 text-xs font-medium flex items-center gap-2 ${
            notification.type === 'success' 
              ? 'bg-[#10b981]/15 text-[#10b981] border-b border-[#10b981]/30' 
              : 'bg-[#ef4444]/15 text-[#ef4444] border-b border-[#ef4444]/30'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#ef4444] shrink-0" />
            )}
            <span className="font-sans">{notification.message}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 bg-[#08090a] border-b border-[#23252a] text-xs font-pixel-header">
          <button
            onClick={() => loadTabContent('cloud_save')}
            className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 font-bold transition-all cursor-pointer ${
              activeTab === 'cloud_save'
                ? 'border-[#10b981] text-[#10b981] bg-[#161718]'
                : 'border-transparent text-[#8a8f98] hover:text-white'
            }`}
          >
            <CloudUpload className="w-4 h-4" />
            Saves em Nuvem
          </button>

          <button
            onClick={() => loadTabContent('leaderboard')}
            className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 font-bold transition-all cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'border-[#facc15] text-[#facc15] bg-[#161718]'
                : 'border-transparent text-[#8a8f98] hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Leaderboard
          </button>

          <button
            onClick={() => loadTabContent('scripts')}
            className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 font-bold transition-all cursor-pointer ${
              activeTab === 'scripts'
                ? 'border-[#02b8cc] text-[#02b8cc] bg-[#161718]'
                : 'border-transparent text-[#8a8f98] hover:text-white'
            }`}
          >
            <Share2 className="w-4 h-4" />
            Scripts da Comunidade
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">

          {/* TAB 1: CLOUD SAVES */}
          {activeTab === 'cloud_save' && (
            <div className="space-y-4">
              <div className="bg-[#161718] border border-[#23252a] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CloudUpload className="w-5 h-5 text-[#10b981]" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Salvar Progresso Atual na Nuvem
                    </h3>
                  </div>
                  <span className="text-[10px] font-pixel-mono text-[#8a8f98] bg-[#08090a] px-2 py-0.5 rounded border border-[#23252a]">
                    Jogador: <strong className="text-white">{programmerName}</strong>
                  </span>
                </div>

                <p className="text-xs text-[#8a8f98] leading-relaxed font-sans">
                  Sincronize todo o estado do terreno 3D, pesquisas desbloqueadas, recursos e scripts da workspace com seu banco de dados na nuvem.
                </p>

                <div className="pt-1 flex items-center gap-3">
                  <button
                    onClick={handleUploadSave}
                    disabled={isSavingCloud}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all active:scale-95 shadow-md cursor-pointer"
                  >
                    <CloudUpload className="w-4 h-4" />
                    {isSavingCloud ? 'Salvando na Nuvem...' : 'Enviar Save Atual para Nuvem'}
                  </button>

                  <button
                    onClick={() => loadTabContent('cloud_save')}
                    className="p-2.5 bg-[#08090a] hover:bg-[#161718] border border-[#23252a] text-[#8a8f98] hover:text-white rounded-lg text-xs transition-all cursor-pointer"
                    title="Atualizar lista de saves"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingSaves ? 'animate-spin text-[#10b981]' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Saves List */}
              <div className="bg-[#161718] border border-[#23252a] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <CloudDownload className="w-4 h-4 text-[#34d399]" />
                    Saves Salvos na Nuvem ({cloudSaves.length})
                  </h3>
                </div>

                {isLoadingSaves ? (
                  <div className="py-8 text-center text-xs text-[#8a8f98] flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#10b981]" />
                    Buscando saves do servidor em nuvem...
                  </div>
                ) : cloudSaves.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#8a8f98] bg-[#08090a] rounded-lg border border-[#23252a] space-y-1">
                    <p>Nenhum save em nuvem encontrado.</p>
                    <p className="text-[11px] text-[#525866]">Clique acima em "Enviar Save Atual para Nuvem" para criar seu primeiro backup remoto!</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {cloudSaves.map((save) => (
                      <div key={save.id || save.player_name} className="flex flex-wrap items-center justify-between p-3 bg-[#08090a] border border-[#23252a] hover:border-[#10b981]/50 rounded-lg text-xs transition-all gap-2">
                        <div>
                          <div className="flex items-center gap-2 font-bold text-white">
                            <User className="w-3.5 h-3.5 text-[#10b981]" />
                            <span>{save.player_name}</span>
                            <span className="text-[10px] font-pixel-mono text-[#facc15] bg-[#facc15]/10 px-1.5 py-0.2 rounded border border-[#facc15]/30">
                              Prestígio {save.prestige_level || 1}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#8a8f98] font-sans mt-0.5 flex items-center gap-3">
                            <span>Fibra: <strong>{save.fiber_count || 0}</strong></span>
                            <span>Salvo em: {save.updated_at ? new Date(save.updated_at).toLocaleString('pt-BR') : 'Data recente'}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleLoadSave(save)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#059669] hover:bg-[#10b981] text-white rounded-md text-xs font-bold transition-all active:scale-95 cursor-pointer"
                        >
                          <CloudDownload className="w-3.5 h-3.5" />
                          Carregar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GLOBAL LEADERBOARD */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-4">
              <div className="bg-[#161718] border border-[#23252a] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-[#facc15] uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-[#facc15]" />
                    Ranking de Programadores & Automatizadores
                  </h3>
                  <p className="text-xs text-[#8a8f98] font-sans mt-1">
                    Publique seus resultados de colheita e nível de prestígio para competir no ranking global na nuvem.
                  </p>
                </div>

                <button
                  onClick={handleSubmitScore}
                  disabled={isSubmittingScore}
                  className="flex items-center gap-2 px-4 py-2 bg-[#facc15] hover:bg-[#eab308] disabled:opacity-50 text-[#0f172a] rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  <Trophy className="w-4 h-4" />
                  {isSubmittingScore ? 'Publicando...' : 'Publicar Minha Pontuação'}
                </button>
              </div>

              <div className="bg-[#161718] border border-[#23252a] rounded-xl p-4 space-y-3">
                {isLoadingLeaderboard ? (
                  <div className="py-8 text-center text-xs text-[#8a8f98] flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#facc15]" />
                    Carregando ranking global...
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#8a8f98] bg-[#08090a] rounded-lg border border-[#23252a]">
                    Nenhuma pontuação registrada no ranking global ainda. Seja o primeiro!
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 font-pixel-mono text-xs">
                    <div className="grid grid-cols-12 px-3 py-1.5 text-[10px] text-[#8a8f98] uppercase tracking-wider font-bold border-b border-[#23252a]">
                      <span className="col-span-1">#</span>
                      <span className="col-span-4">Programador(a)</span>
                      <span className="col-span-2 text-right">Fibra</span>
                      <span className="col-span-2 text-right">Madeira</span>
                      <span className="col-span-3 text-right">Prestígio</span>
                    </div>

                    {leaderboard.map((entry, idx) => (
                      <div key={entry.id || entry.player_name} className={`grid grid-cols-12 px-3 py-2 items-center rounded-lg border text-xs ${
                        idx === 0 ? 'bg-[#facc15]/10 border-[#facc15]/40 text-[#facc15]' :
                        idx === 1 ? 'bg-slate-800/40 border-slate-600 text-slate-200' :
                        idx === 2 ? 'bg-amber-950/30 border-amber-800/50 text-amber-300' :
                        'bg-[#08090a] border-[#23252a] text-[#d0d6e0]'
                      }`}>
                        <span className="col-span-1 font-bold">{idx + 1}º</span>
                        <span className="col-span-4 font-bold truncate flex items-center gap-1.5">
                          {idx === 0 && <Sparkles className="w-3.5 h-3.5 text-[#facc15] shrink-0" />}
                          {entry.player_name}
                        </span>
                        <span className="col-span-2 text-right">{entry.fiber || 0}</span>
                        <span className="col-span-2 text-right text-emerald-400">{entry.wood || 0}</span>
                        <span className="col-span-3 text-right font-bold text-amber-400">Nível {entry.prestige_level || 1}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: COMMUNITY SCRIPTS */}
          {activeTab === 'scripts' && (
            <div className="space-y-4">
              {/* Publish Script Box */}
              <div className="bg-[#161718] border border-[#23252a] rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-[#02b8cc] uppercase tracking-wider flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-[#02b8cc]" />
                  Compartilhar Script Ativo na Nuvem
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Título do Script (ex: Automação Total de Madeira)"
                    value={scriptTitle}
                    onChange={(e) => setScriptTitle(e.target.value)}
                    className="px-3 py-2 bg-[#08090a] border border-[#23252a] focus:border-[#02b8cc] rounded-lg text-xs text-white outline-none font-sans"
                  />

                  <input
                    type="text"
                    placeholder="Descrição breve do que o código faz..."
                    value={scriptDesc}
                    onChange={(e) => setScriptDesc(e.target.value)}
                    className="px-3 py-2 bg-[#08090a] border border-[#23252a] focus:border-[#02b8cc] rounded-lg text-xs text-white outline-none font-sans"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#8a8f98]">
                    Publicando arquivo ativo: <strong className="text-[#02b8cc] font-mono">{activeFilePath || 'main.py'}</strong>
                  </span>

                  <button
                    onClick={handlePublishScript}
                    disabled={isPublishingScript}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#02b8cc] hover:bg-[#0891b2] disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {isPublishingScript ? 'Publicando...' : 'Publicar na Nuvem'}
                  </button>
                </div>
              </div>

              {/* Community Scripts Directory */}
              <div className="bg-[#161718] border border-[#23252a] rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-[#02b8cc]" />
                  Biblioteca de Scripts da Comunidade ({communityScripts.length})
                </h3>

                {isLoadingScripts ? (
                  <div className="py-8 text-center text-xs text-[#8a8f98] flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#02b8cc]" />
                    Carregando scripts da nuvem...
                  </div>
                ) : communityScripts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#8a8f98] bg-[#08090a] rounded-lg border border-[#23252a]">
                    Nenhum script compartilhado na nuvem ainda. Seja o primeiro a compartilhar!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                    {communityScripts.map((script) => (
                      <div key={script.id || script.title} className="p-3 bg-[#08090a] border border-[#23252a] hover:border-[#02b8cc]/50 rounded-lg text-xs space-y-2 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-white truncate">{script.title}</span>
                            <span className={`text-[9px] font-pixel-mono px-1.5 py-0.2 rounded font-bold ${
                              script.language === 'python' ? 'bg-[#02b8cc]/15 text-[#02b8cc]' : 'bg-[#facc15]/15 text-[#facc15]'
                            }`}>
                              {script.language === 'python' ? 'Python' : 'JS'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#8a8f98] font-sans line-clamp-2 mt-1">{script.description}</p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#23252a] text-[10px] text-[#8a8f98] font-mono">
                          <span>Por: <strong className="text-white">{script.author}</strong></span>
                          <button
                            onClick={() => handleImportCommunityScript(script)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-[#0891b2] hover:bg-[#02b8cc] text-slate-950 rounded font-bold text-[10px] transition-all cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            Importar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#08090a] border-t border-[#23252a] flex items-center justify-between shrink-0">
          <div className="text-[11px] text-[#8a8f98] font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
            <span>Conexão com servidor em nuvem configurada e pronta.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
