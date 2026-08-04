import React, { useRef, useState } from 'react';
import { 
  Download, 
  Upload, 
  Save, 
  FileCode, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  FolderArchive, 
  FileText, 
  Bot,
  Trash2,
  RotateCcw,
  Database,
  CloudUpload
} from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';
import { VirtualFS } from '../engine/virtualFs';
import { VirtualFile } from '../types/game';
import { 
  exportGameSave, 
  importGameSave, 
  downloadScript, 
  downloadAllScriptsBundle, 
  importLocalScriptFile 
} from '../utils/saveManager';

interface SaveManagerModalProps {
  engine: GameEngine;
  vfs: VirtualFS;
  activeFilePath?: string;
  onClose: () => void;
  onFileImported?: (path: string) => void;
  onResetGame?: () => void;
  onOpenSupabase?: () => void;
}

export const SaveManagerModal: React.FC<SaveManagerModalProps> = ({
  engine,
  vfs,
  activeFilePath,
  onClose,
  onFileImported,
  onResetGame,
  onOpenSupabase
}) => {
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [resetConfirmInput, setResetConfirmInput] = useState<string>('');

  const saveFileInputRef = useRef<HTMLInputElement>(null);
  const scriptFileInputRef = useRef<HTMLInputElement>(null);

  const activeFile = activeFilePath ? vfs.getFile(activeFilePath) : vfs.getEntrypoint();
  const allFiles = vfs.getFiles();

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
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

  // 1. Export Game Save
  const handleExportSave = async () => {
    await exportGameSave(engine);
    showFeedback('success', 'Save assinado digitalmente (.json) baixado com sucesso!');
  };

  // 2. Import Game Save
  const handleSaveFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importGameSave(engine, file, (success, message) => {
      if (success) {
        showFeedback('success', message || 'Progresso do jogo importado com sucesso!');
        if (onFileImported) {
          const ep = vfs.getEntrypoint();
          if (ep) onFileImported(ep.path);
        }
      } else {
        showFeedback('error', message || 'Falha ao importar arquivo de Save.');
      }
    });
    // Reset file input
    e.target.value = '';
  };

  // 3. Download Single Active Script
  const handleDownloadActiveScript = () => {
    if (!activeFile) {
      showFeedback('error', 'Nenhum script ativo selecionado.');
      return;
    }
    downloadScript(activeFile);
    showFeedback('success', `Script '${activeFile.name}' baixado com sucesso!`);
  };

  // 4. Download All Scripts Bundle
  const handleDownloadAllScripts = () => {
    downloadAllScriptsBundle(vfs);
    showFeedback('success', 'Todos os scripts da workspace foram exportados em um pacote!');
  };

  // 5. Import Local Script (.py or .js)
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
      {/* Hidden File Inputs */}
      <input 
        type="file" 
        ref={saveFileInputRef} 
        onChange={handleSaveFileChange} 
        accept=".json" 
        className="hidden" 
      />
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
              <h2 className="text-sm font-pixel-header text-[#ffffff]">Gerenciador de Saves & Scripts</h2>
              <p className="text-xs text-[#8a8f98] font-pixel-body">Exporte/Importe o progresso do jogo ou arquivos de código Python/JS locais</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#8a8f98] hover:text-[#ffffff] pixel-btn transition-all"
          >
            <X className="w-5 h-5" />
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

          {/* SECTION 0: Supabase Cloud Saves & Integration */}
          {onOpenSupabase && (
            <div className="bg-[#10b981]/10 border border-[#10b981]/30 rounded-[12px] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#10b981]" />
                  <h3 className="text-xs font-bold text-[#10b981] uppercase tracking-wider">
                    Sincronização em Nuvem Supabase
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-[#10b981] bg-[#10b981]/15 px-2 py-0.5 rounded border border-[#10b981]/30">
                  PostgreSQL Supabase Connected
                </span>
              </div>

              <p className="text-xs text-[#d0d6e0] leading-relaxed font-sans">
                Sincronize seu progresso, publique seu recorde no Leaderboard Global ou compartilhe e baixe scripts da comunidade diretamente do banco de dados Supabase!
              </p>

              <div className="pt-1">
                <button
                  onClick={() => {
                    onClose();
                    onOpenSupabase();
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white rounded-[6px] text-xs font-bold transition-all active:scale-98 shadow-md cursor-pointer w-full sm:w-auto"
                >
                  <CloudUpload className="w-4 h-4" />
                  Abrir Painel de Saves & Banco Supabase
                </button>
              </div>
            </div>
          )}

          {/* SECTION 1: Full Game Save State */}
          <div className="bg-[#161718] border border-[#23252a] rounded-[12px] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-[#02b8cc]" />
                <h3 className="text-xs font-medium text-[#ffffff] uppercase tracking-wider">
                  Progresso do Jogo Completo (Save File .json)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#8a8f98] bg-[#08090a] px-2 py-0.5 rounded-[4px] border border-[#23252a]">
                Contém Terreno 3D, Recursos e Scripts
              </span>
            </div>

            <p className="text-xs text-[#8a8f98] leading-relaxed font-sans">
              O Save completo guarda o tamanho do mapa 3D, todos os recursos acumulados (fibra, madeira, raízes, etc.), pesquisas desbloqueadas na Árvore de Pesquisa e todos os seus scripts.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleExportSave}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#27a644] hover:bg-[#27a644]/90 text-[#ffffff] rounded-[6px] text-xs font-medium transition-all active:scale-98"
              >
                <Download className="w-4 h-4" />
                Exportar Save (.json)
              </button>

              <button
                onClick={() => saveFileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#08090a] hover:bg-[#161718] text-[#ffffff] border border-[#23252a] rounded-[6px] text-xs font-medium transition-all active:scale-98"
              >
                <Upload className="w-4 h-4 text-[#02b8cc]" />
                Importar Save (.json)
              </button>
            </div>
          </div>

          {/* SECTION 2: Individual Scripts Export / Import */}
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
              Baixe seus algoritmos individualmente para guardar em seu computador ou selecione arquivos <code className="text-[#02b8cc]">.py</code> e <code className="text-[#d0d6e0]">.js</code> do seu disco rígido para importar para o ambiente do jogo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Active Script Download */}
              <button
                onClick={handleDownloadActiveScript}
                disabled={!activeFile}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#08090a] hover:bg-[#161718] text-[#ffffff] border border-[#23252a] rounded-[6px] text-xs font-medium transition-all disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-[#27a644]" />
                Baixar '{activeFile ? activeFile.name : 'Atual'}'
              </button>

              {/* Download All Scripts Bundle */}
              <button
                onClick={handleDownloadAllScripts}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#08090a] hover:bg-[#161718] text-[#ffffff] border border-[#23252a] rounded-[6px] text-xs font-medium transition-all"
              >
                <Download className="w-3.5 h-3.5 text-[#d0d6e0]" />
                Baixar Todos os Scripts
              </button>

              {/* Import Script File */}
              <button
                onClick={() => scriptFileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#27a644] hover:bg-[#27a644]/90 text-[#ffffff] rounded-[6px] text-xs font-medium transition-all"
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
                      className="p-1 text-[#8a8f98] hover:text-[#27a644] transition-colors"
                      title={`Baixar ${file.name}`}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* SECTION 3: Danger Zone - Reset Game from Scratch */}
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
              Deseja reiniciar toda a simulação do zero? Esta ação apagará permanentemente o terreno 3D, todos os recursos acumulados, pesquisas desbloqueadas e restaurará os scripts originais da workspace.
            </p>

            <div className="pt-1">
              <button
                onClick={() => {
                  setResetConfirmInput('');
                  setShowResetModal(true);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#eb5757]/10 hover:bg-[#eb5757]/20 border border-[#eb5757]/30 text-[#eb5757] rounded-[6px] text-xs font-medium transition-all active:scale-98"
              >
                <RotateCcw className="w-4 h-4 text-[#eb5757]" />
                Começar do Zero (Resetar Tudo)
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#010409] border-t border-[#30363d] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-lg text-xs font-bold transition-all"
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
                className="px-3.5 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-lg text-xs font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetGame}
                disabled={!['RESETAR', 'DELETAR'].includes(resetConfirmInput.trim().toUpperCase())}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-30 disabled:hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-all active:scale-98 shadow-md"
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
