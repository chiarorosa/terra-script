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
  Sparkles,
  Bot,
  Trash2,
  RotateCcw
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
}

export const SaveManagerModal: React.FC<SaveManagerModalProps> = ({
  engine,
  vfs,
  activeFilePath,
  onClose,
  onFileImported,
  onResetGame
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
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

      <div className="bg-[#161b22] border border-[#30363d] rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-[#010409] border-b border-[#30363d] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#238636]/20 border border-[#238636]/40 flex items-center justify-center text-[#3fb950]">
              <Save className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#f0f6fc]">Gerenciador de Saves & Scripts</h2>
              <p className="text-xs text-[#8b949e]">Exporte/Importe o progresso do jogo ou arquivos de código Python/JS locais</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert Toast */}
        {notification && (
          <div className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 ${
            notification.type === 'success' 
              ? 'bg-[#238636]/20 text-[#3fb950] border-b border-[#238636]/40' 
              : 'bg-[#da3633]/20 text-[#f85149] border-b border-[#da3633]/40'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#3fb950] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#f85149] shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 space-y-6 overflow-y-auto">

          {/* SECTION 1: Full Game Save State */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-[#58a6ff]" />
                <h3 className="text-xs font-bold text-[#f0f6fc] uppercase tracking-wider">
                  Progresso do Jogo Completo (Save File .json)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#8b949e] bg-[#161b22] px-2 py-0.5 rounded border border-[#30363d]">
                Contém Terreno 3D, Recursos e Scripts
              </span>
            </div>

            <p className="text-xs text-[#8b949e] leading-relaxed">
              O Save completo guarda o tamanho do mapa 3D, todos os recursos acumulados (fibra, madeira, raízes, etc.), pesquisas desbloqueadas na Árvore de Pesquisa e todos os seus scripts.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleExportSave}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-98"
              >
                <Download className="w-4 h-4" />
                Exportar Save (.json)
              </button>

              <button
                onClick={() => saveFileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d] rounded-lg text-xs font-bold transition-all active:scale-98"
              >
                <Upload className="w-4 h-4 text-[#58a6ff]" />
                Importar Save (.json)
              </button>
            </div>
          </div>

          {/* SECTION 2: Individual Scripts Export / Import */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#d29922]" />
                <h3 className="text-xs font-bold text-[#f0f6fc] uppercase tracking-wider">
                  Scripts e Arquivos de Código Locais
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#8b949e] bg-[#161b22] px-2 py-0.5 rounded border border-[#30363d]">
                Python (.py) e JavaScript (.js)
              </span>
            </div>

            <p className="text-xs text-[#8b949e] leading-relaxed">
              Baixe seus algoritmos individualmente para guardar em seu computador ou selecione arquivos <code className="text-[#58a6ff]">.py</code> e <code className="text-[#d29922]">.js</code> do seu disco rígido para importar para o ambiente do jogo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Active Script Download */}
              <button
                onClick={handleDownloadActiveScript}
                disabled={!activeFile}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d] rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-[#3fb950]" />
                Baixar '{activeFile ? activeFile.name : 'Atual'}'
              </button>

              {/* Download All Scripts Bundle */}
              <button
                onClick={handleDownloadAllScripts}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] border border-[#30363d] rounded-lg text-xs font-semibold transition-all"
              >
                <Download className="w-3.5 h-3.5 text-[#d29922]" />
                Baixar Todos os Scripts
              </button>

              {/* Import Script File */}
              <button
                onClick={() => scriptFileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                Importar Script (.py/.js)
              </button>
            </div>

            {/* List of current workspace files */}
            <div className="mt-3 pt-3 border-t border-[#30363d]/60 space-y-1.5">
              <span className="text-[11px] font-semibold text-[#8b949e] flex items-center justify-between">
                <span>Arquivos Atuais na Workspace ({allFiles.length}):</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                {allFiles.map(file => (
                  <div key={file.path} className="flex items-center justify-between bg-[#161b22] px-2.5 py-1.5 rounded border border-[#30363d] text-xs font-mono">
                    <div className="flex items-center gap-2 truncate">
                      <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                        file.language === 'python' ? 'bg-[#388bfd]/20 text-[#58a6ff]' : 'bg-[#d29922]/20 text-[#d29922]'
                      }`}>
                        {file.language === 'python' ? 'PY' : 'JS'}
                      </span>
                      <span className="text-[#c9d1d9] truncate">{file.name}</span>
                    </div>

                    <button
                      onClick={() => downloadScript(file)}
                      className="p-1 text-[#8b949e] hover:text-[#3fb950] transition-colors"
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
          <div className="bg-[#0d1117] border border-rose-900/60 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                  Começar do Zero (Reset Total)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60">
                Irreversível
              </span>
            </div>

            <p className="text-xs text-[#8b949e] leading-relaxed">
              Deseja reiniciar toda a simulação do zero? Esta ação apagará permanentemente o terreno 3D, todos os recursos acumulados, pesquisas desbloqueadas e restaurará os scripts originais da workspace.
            </p>

            <div className="pt-1">
              <button
                onClick={() => {
                  setResetConfirmInput('');
                  setShowResetModal(true);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800/80 text-rose-200 rounded-lg text-xs font-bold transition-all active:scale-98 shadow-sm"
              >
                <RotateCcw className="w-4 h-4 text-rose-400" />
                Começar do Zero (Resetar Tudo)
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#010409] border-t border-[#30363d] flex items-center justify-between">
          <button
            onClick={() => {
              setResetConfirmInput('');
              setShowResetModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-lg text-xs font-semibold transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>Começar do Zero</span>
          </button>

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
