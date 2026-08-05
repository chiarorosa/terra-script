import React, { useEffect, useRef, useState } from 'react';
import { 
  Download, 
  Upload, 
  Save, 
  FileCode, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Trash2,
  RotateCcw,
  Database,
  CloudUpload,
  CloudDownload,
  Share2,
  RefreshCw,
  Sparkles,
  User,
  Globe
} from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';
import { VirtualFS } from '../engine/virtualFs';
import { 
  downloadScript, 
  downloadAllScriptsBundle, 
  importLocalScriptFile 
} from '../utils/saveManager';
import { 
  uploadCloudSaveWithAntiFraud, 
  listAllCloudSaves, 
  publishCommunityScript, 
  fetchCommunityScripts, 
  CloudSaveData, 
  CommunityScript 
} from '../utils/supabaseClient';

interface SaveManagerModalProps {
  engine: GameEngine;
  vfs: VirtualFS;
  activeFilePath?: string;
  onClose: () => void;
  onFileImported?: (path: string) => void;
  onResetGame?: () => void;
}

export const SaveManagerModal: React.FC<SaveManagerModalProps> = ({
  engine,
  vfs,
  activeFilePath,
  onClose,
  onFileImported,
  onResetGame
}) => {
  const [activeTab, setActiveTab] = useState<'cloud' | 'local' | 'community'>('cloud');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [resetConfirmInput, setResetConfirmInput] = useState<string>('');

  // Cloud Saves state
  const [cloudSaves, setCloudSaves] = useState<CloudSaveData[]>([]);
  const [isSavingCloud, setIsSavingCloud] = useState<boolean>(false);
  const [isLoadingSaves, setIsLoadingSaves] = useState<boolean>(false);

  // Community Scripts state
  const [communityScripts, setCommunityScripts] = useState<CommunityScript[]>([]);
  const [isLoadingScripts, setIsLoadingScripts] = useState<boolean>(false);
  const [isPublishingScript, setIsPublishingScript] = useState<boolean>(false);
  const [scriptTitle, setScriptTitle] = useState<string>('');
  const [scriptDesc, setScriptDesc] = useState<string>('');

  const scriptFileInputRef = useRef<HTMLInputElement>(null);

  const activeFile = activeFilePath ? vfs.getFile(activeFilePath) : vfs.getEntrypoint();
  const allFiles = vfs.getFiles();
  const programmerName = typeof window !== 'undefined' 
    ? (localStorage.getItem('terrascript_programmer_name') || 'Dev Master') 
    : 'Dev Master';

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  // Load Cloud Data when tab changes
  useEffect(() => {
    if (activeTab === 'cloud') {
      loadCloudSaves();
    } else if (activeTab === 'community') {
      loadCommunityScripts();
    }
  }, [activeTab]);

  const loadCloudSaves = async () => {
    setIsLoadingSaves(true);
    const res = await listAllCloudSaves();
    if (res.success && res.saves) {
      setCloudSaves(res.saves);
    } else if (res.message) {
      showFeedback('error', res.message);
    }
    setIsLoadingSaves(false);
  };

  const loadCommunityScripts = async () => {
    setIsLoadingScripts(true);
    const res = await fetchCommunityScripts();
    if (res.success && res.scripts) {
      setCommunityScripts(res.scripts);
    } else if (res.message) {
      showFeedback('error', res.message);
    }
    setIsLoadingScripts(false);
  };

  // 1. Upload Cloud Save
  const handleUploadCloudSave = async () => {
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
      loadCloudSaves();
    } else {
      showFeedback('error', res.message);
    }
  };

  // 2. Load Selected Cloud Save
  const handleLoadCloudSave = async (save: CloudSaveData) => {
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

  // 3. Publish Current Script to Community
  const handlePublishScript = async () => {
    const fileToPublish = activeFilePath ? vfs.getFile(activeFilePath) : vfs.getEntrypoint();
    if (!fileToPublish) {
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
      language: fileToPublish.language as 'python' | 'javascript',
      description: scriptDesc.trim() || 'Script de automação para TerraScript 3D',
      code: fileToPublish.content
    });

    setIsPublishingScript(false);

    if (res.success) {
      showFeedback('success', res.message);
      setScriptTitle('');
      setScriptDesc('');
      loadCommunityScripts();
    } else {
      showFeedback('error', res.message);
    }
  };

  // 4. Import Community Script into Local VirtualFS
  const handleImportCommunityScript = (script: CommunityScript) => {
    const ext = script.language === 'python' ? '.py' : '.js';
    const cleanTitle = script.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const path = `comunidade/${cleanTitle}${ext}`;

    vfs.createFile(path, script.code, script.language);
    showFeedback('success', `Script "${script.title}" importado para 'src/${path}'!`);
    if (onFileImported) onFileImported(path);
  };

  // Reset Everything to Factory Defaults
  const handleResetGame = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('terrascript_welcome_seen');
      localStorage.removeItem('terrascript_programmer_name');
      localStorage.removeItem('terrascript_programmer_avatar');
      localStorage.removeItem('terrascript_onboarding_tip_dismissed');
      localStorage.removeItem('terrascript_ui_style');
      localStorage.removeItem('terrascript_follow_agent');
      localStorage.removeItem('terrascript_bottom_panel_expanded');
    }
    engine.resetEverything(vfs);
    const ep = vfs.getEntrypoint();
    if (ep && onFileImported) {
      onFileImported(ep.path);
    }
    setShowResetModal(false);
    onClose();
    if (onResetGame) {
      onResetGame();
    }
  };

  // Download Single Active Script
  const handleDownloadActiveScript = () => {
    if (!activeFile) {
      showFeedback('error', 'Nenhum script ativo selecionado.');
      return;
    }
    downloadScript(activeFile);
    showFeedback('success', `Script '${activeFile.name}' baixado com sucesso!`);
  };

  // Download All Scripts Bundle
  const handleDownloadAllScripts = () => {
    downloadAllScriptsBundle(vfs);
    showFeedback('success', 'Todos os scripts da workspace foram exportados em um pacote!');
  };

  // Import Local Script (.py or .js)
  const handleScriptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let importedCount = 0;
    Array.from(files).forEach((file: File, index) => {
      importLocalScriptFile(vfs, file, (importedPath) => {
        importedCount++;
        if (onFileImported && index === 0) {
          onFileImported(importedPath);
        }
        if (importedCount === files.length) {
          showFeedback('success', `${importedCount} script(s) importado(s) para a workspace local!`);
        }
      });
    });

    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 font-pixel-body">
      {/* Hidden File Input for Scripts */}
      <input 
        type="file" 
        ref={scriptFileInputRef} 
        onChange={handleScriptFileChange} 
        accept=".py,.js,.txt" 
        multiple 
        className="hidden" 
      />

      <div className="bg-[#0f1011] pixel-box-amber w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-[#08090a] border-b-2 border-[#23252a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 pixel-box bg-[#161718] flex items-center justify-center text-[#22c55e]">
              <Save className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-pixel-header text-[#ffffff]">Gerenciador de Scripts & Saves</h2>
              <p className="text-xs text-[#8a8f98] font-pixel-body">
                Exporte, importe, salve na nuvem ou compartilhe códigos com a comunidade
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#8a8f98] hover:text-[#ffffff] pixel-btn transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 bg-[#08090a] border-b border-[#23252a] flex items-center gap-2">
          <button
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'cloud'
                ? 'border-[#10b981] text-[#10b981]'
                : 'border-transparent text-[#8a8f98] hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Saves na Nuvem</span>
          </button>

          <button
            onClick={() => setActiveTab('local')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'local'
                ? 'border-[#22c55e] text-[#22c55e]'
                : 'border-transparent text-[#8a8f98] hover:text-white'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Saves Locais & Scripts</span>
          </button>

          <button
            onClick={() => setActiveTab('community')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'community'
                ? 'border-[#38bdf8] text-[#38bdf8]'
                : 'border-transparent text-[#8a8f98] hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Scripts da Comunidade</span>
          </button>
        </div>

        {/* Feedback Alert Toast */}
        {notification && (
          <div className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 ${
            notification.type === 'success' 
              ? 'bg-[#27a644]/10 text-[#27a644] border-b border-[#27a644]/30' 
              : 'bg-[#eb5757]/10 text-[#eb5757] border-b border-[#eb5757]/30'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#27a644] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#eb5757] shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 space-y-6 overflow-y-auto">

          {/* TAB 1: LOCAL SAVES & SCRIPTS */}
          {activeTab === 'local' && (
            <div className="space-y-6">
              {/* Individual Scripts Export / Import */}
              <div className="bg-[#161718] border border-[#23252a] rounded-[12px] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-[#d0d6e0]" />
                    <h3 className="text-xs font-medium text-[#ffffff] uppercase tracking-wider">
                      Scripts e Arquivos de Código Locais
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-[#8a8f98] bg-[#08090a] px-2 py-0.5 rounded-[4px] border border-[#23252a]">
                    Python (.py) e JavaScript (.js)
                  </span>
                </div>

                <p className="text-xs text-[#8a8f98] leading-relaxed font-sans">
                  Baixe seus algoritmos individualmente para guardar em seu computador ou selecione arquivos <code className="text-[#02b8cc]">.py</code> e <code className="text-[#d0d6e0]">.js</code> do seu disco rígido para importar para a workspace.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Active Script Download */}
                  <button
                    onClick={handleDownloadActiveScript}
                    disabled={!activeFile}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#08090a] hover:bg-[#161718] text-[#ffffff] border border-[#23252a] rounded-[6px] text-xs font-medium transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#27a644]" />
                    Baixar '{activeFile ? activeFile.name : 'Atual'}'
                  </button>

                  {/* Download All Scripts Bundle */}
                  <button
                    onClick={handleDownloadAllScripts}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#08090a] hover:bg-[#161718] text-[#ffffff] border border-[#23252a] rounded-[6px] text-xs font-medium transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#d0d6e0]" />
                    Baixar Todos os Scripts
                  </button>

                  {/* Import Script File */}
                  <button
                    onClick={() => scriptFileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#27a644] hover:bg-[#27a644]/90 text-[#ffffff] rounded-[6px] text-xs font-medium transition-all cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Importar Script (.py/.js)
                  </button>
                </div>

                {/* List of current workspace files */}
                <div className="mt-3 pt-3 border-t border-[#23252a] space-y-1.5">
                  <span className="text-[11px] font-medium text-[#8a8f98] flex items-center justify-between">
                    <span>Arquivos Atuais na Workspace ({allFiles.length}):</span>
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {allFiles.map(file => (
                      <div key={file.path} className="flex items-center justify-between bg-[#08090a] px-2.5 py-1.5 rounded-[6px] border border-[#23252a] text-xs font-mono">
                        <div className="flex items-center gap-2 truncate">
                          <span className={`text-[9px] px-1 py-0.2 rounded font-medium ${
                            file.language === 'python' ? 'bg-[#02b8cc]/10 text-[#02b8cc]' : 'bg-[#e4f222]/15 text-[#e4f222]'
                          }`}>
                            {file.language === 'python' ? 'PY' : 'JS'}
                          </span>
                          <span className="text-[#d0d6e0] truncate">{file.name}</span>
                        </div>

                        <button
                          onClick={() => downloadScript(file)}
                          className="p-1 text-[#8a8f98] hover:text-[#27a644] transition-colors cursor-pointer"
                          title={`Baixar ${file.name}`}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Danger Zone - Reset Game from Scratch */}
              <div className="bg-[#161718] border border-[#eb5757]/30 rounded-[12px] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-[#eb5757]" />
                    <h3 className="text-xs font-medium text-[#eb5757] uppercase tracking-wider">
                      Começar do Zero (Reset Total)
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-[#eb5757] bg-[#eb5757]/10 px-2 py-0.5 rounded-[4px] border border-[#eb5757]/30">
                    Irreversível
                  </span>
                </div>

                <p className="text-xs text-[#8a8f98] leading-relaxed font-sans">
                  Deseja reiniciar toda a simulação do zero? Esta ação apagará permanentemente o terreno 3D, todos os recursos acumulados e restaurará os scripts padrão.
                </p>

                <div className="pt-1">
                  <button
                    onClick={() => {
                      setResetConfirmInput('');
                      setShowResetModal(true);
                    }}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#eb5757]/10 hover:bg-[#eb5757]/20 border border-[#eb5757]/30 text-[#eb5757] rounded-[6px] text-xs font-medium transition-all active:scale-98 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-[#eb5757]" />
                    Começar do Zero (Resetar Tudo)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLOUD SAVES */}
          {activeTab === 'cloud' && (
            <div className="space-y-4">
              {/* User Profile Banner & Cloud Save Button */}
              <div className="bg-[#10b981]/10 border border-[#10b981]/30 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#10b981]/20 rounded-lg border border-[#10b981]/40 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-[#10b981]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#10b981] uppercase tracking-wider">
                      Sincronização com a Nuvem
                    </h3>
                    <p className="text-xs text-[#d0d6e0] font-sans">
                      Programador(a): <strong className="text-white">{programmerName}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleUploadCloudSave}
                  disabled={isSavingCloud}
                  className="flex items-center gap-2 px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md active:scale-95"
                >
                  <CloudUpload className="w-4 h-4" />
                  {isSavingCloud ? 'Sincronizando...' : 'Salvar Progresso Atual na Nuvem'}
                </button>
              </div>

              {/* List of Cloud Saves */}
              <div className="bg-[#161718] border border-[#23252a] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#10b981]" />
                    Saves em Nuvem Salvos
                  </h4>
                  <button
                    onClick={loadCloudSaves}
                    disabled={isLoadingSaves}
                    className="flex items-center gap-1 text-[11px] text-[#8a8f98] hover:text-white transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingSaves ? 'animate-spin text-[#10b981]' : ''}`} />
                    Atualizar
                  </button>
                </div>

                {isLoadingSaves ? (
                  <div className="py-8 text-center text-xs text-[#8a8f98] flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#10b981]" />
                    Carregando saves remotos...
                  </div>
                ) : cloudSaves.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#8a8f98] bg-[#08090a] rounded-lg border border-[#23252a]">
                    Nenhum save em nuvem registrado ainda. Salve seu progresso acima!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {cloudSaves.map((save) => (
                      <div key={save.id || save.player_name} className="p-3 bg-[#08090a] border border-[#23252a] rounded-lg flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <span className="text-xs font-bold text-white block">{save.player_name}</span>
                          <span className="text-[11px] text-[#8a8f98] font-mono">
                            Fibra: {save.fiber} | Prestígio: Lv.{save.prestige_level} | Atualizado: {new Date(save.updated_at || '').toLocaleDateString('pt-BR')}
                          </span>
                        </div>

                        <button
                          onClick={() => handleLoadCloudSave(save)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] border border-[#10b981]/40 rounded-md text-xs font-bold transition-all cursor-pointer"
                        >
                          <CloudDownload className="w-3.5 h-3.5" />
                          Carregar Este Save
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: COMMUNITY SCRIPTS */}
          {activeTab === 'community' && (
            <div className="space-y-4">
              {/* Share Script Box */}
              <div className="bg-[#161718] border border-[#38bdf8]/30 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-[#38bdf8] uppercase tracking-wider flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-[#38bdf8]" />
                  Publicar Meu Script Ativo na Comunidade
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={scriptTitle}
                    onChange={(e) => setScriptTitle(e.target.value)}
                    placeholder="Título do Script (ex: Colheita Automática 3000)"
                    className="px-3 py-2 bg-[#08090a] border border-[#23252a] focus:border-[#38bdf8] text-white text-xs rounded-lg outline-none"
                  />
                  <input
                    type="text"
                    value={scriptDesc}
                    onChange={(e) => setScriptDesc(e.target.value)}
                    placeholder="Descrição opcional (ex: Otimizado para rotação de frutas)"
                    className="px-3 py-2 bg-[#08090a] border border-[#23252a] focus:border-[#38bdf8] text-white text-xs rounded-lg outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[#8a8f98] font-mono">
                    Script Selecionado: <strong className="text-white">{activeFile ? activeFile.name : 'Nenhum'}</strong>
                  </span>
                  <button
                    onClick={handlePublishScript}
                    disabled={isPublishingScript || !activeFile}
                    className="flex items-center gap-2 px-4 py-2 bg-[#38bdf8] hover:bg-[#0284c7] text-[#0f172a] rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    {isPublishingScript ? 'Publicando...' : 'Publicar Agora'}
                  </button>
                </div>
              </div>

              {/* List of Community Scripts */}
              <div className="bg-[#161718] border border-[#23252a] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#38bdf8]" />
                    Biblioteca de Scripts Compartilhados
                  </h4>
                  <button
                    onClick={loadCommunityScripts}
                    disabled={isLoadingScripts}
                    className="flex items-center gap-1 text-[11px] text-[#8a8f98] hover:text-white transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingScripts ? 'animate-spin text-[#38bdf8]' : ''}`} />
                    Atualizar
                  </button>
                </div>

                {isLoadingScripts ? (
                  <div className="py-8 text-center text-xs text-[#8a8f98] flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#38bdf8]" />
                    Buscando scripts da comunidade...
                  </div>
                ) : communityScripts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#8a8f98] bg-[#08090a] rounded-lg border border-[#23252a]">
                    Nenhum script compartilhado na comunidade ainda. Compartilhe o seu primeiro acima!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {communityScripts.map((sc) => (
                      <div key={sc.id || sc.title} className="p-3 bg-[#08090a] border border-[#23252a] rounded-lg flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                              sc.language === 'python' ? 'bg-[#02b8cc]/20 text-[#02b8cc]' : 'bg-[#e4f222]/20 text-[#e4f222]'
                            }`}>
                              {sc.language === 'python' ? 'PYTHON' : 'JS'}
                            </span>
                            <span className="text-xs font-bold text-white">{sc.title}</span>
                          </div>
                          <p className="text-[11px] text-[#8a8f98] mt-1 font-sans">
                            {sc.description || 'Sem descrição.'} • Por: <strong className="text-[#d0d6e0]">{sc.author}</strong>
                          </p>
                        </div>

                        <button
                          onClick={() => handleImportCommunityScript(sc)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#38bdf8]/20 hover:bg-[#38bdf8]/30 text-[#38bdf8] border border-[#38bdf8]/40 rounded-md text-xs font-bold transition-all cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Importar para IDE
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#010409] border-t border-[#30363d] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>

      {/* TYPED CONFIRMATION MODAL OVERLAY */}
      {showResetModal && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#161b22] border border-rose-800/80 rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4 text-left">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-950/80 border border-rose-800/80 rounded-lg shrink-0">
                <AlertCircle className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-200">Confirmar Reset Total do Jogo</h3>
                <p className="text-xs text-[#8b949e]">Esta ação apaga permanentemente todo o seu progresso.</p>
              </div>
            </div>

            <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded-lg space-y-1.5 text-xs text-[#c9d1d9]">
              <p className="text-rose-300 font-semibold">Itens que serão resetados:</p>
              <ul className="list-disc list-inside text-[#8b949e] space-y-0.5 text-[11px]">
                <li>Mapa 3D volta para grade 1x1 inicial</li>
                <li>Recursos, inventário e estatísticas zerados</li>
                <li>Árvore de pesquisas bloqueada novamente</li>
                <li>Scripts da workspace voltam para os arquivos padrão</li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#c9d1d9]">
                Para confirmar, digite <span className="text-rose-400 font-mono font-bold select-all">RESETAR</span> ou <span className="text-rose-400 font-mono font-bold select-all">DELETAR</span> abaixo:
              </label>
              <input
                type="text"
                value={resetConfirmInput}
                onChange={(e) => setResetConfirmInput(e.target.value)}
                placeholder="Digite RESETAR ou DELETAR"
                className="w-full px-3 py-2 bg-[#0d1117] border border-rose-900/60 focus:border-rose-500 text-white text-xs font-mono rounded-lg outline-none transition-colors placeholder:text-[#484f58]"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-3.5 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetGame}
                disabled={!['RESETAR', 'DELETAR'].includes(resetConfirmInput.trim().toUpperCase())}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-30 disabled:hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-all active:scale-98 shadow-md cursor-pointer"
              >
                Confirmar Reset Total
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
