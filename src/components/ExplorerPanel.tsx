import React, { useRef, useState } from 'react';
import { 
  Folder, 
  FolderOpen,
  Plus, 
  Trash2, 
  Star, 
  RotateCcw, 
  Bot, 
  ChevronRight, 
  ChevronDown,
  Upload,
  Save,
  Play,
  Sparkles,
  X,
  Lock,
  Filter,
  Check
} from 'lucide-react';
import { VirtualFS } from '../engine/virtualFs';
import { VirtualFile } from '../types/game';
import { GameEngine } from '../engine/GameEngine';
import { importLocalScriptFile } from '../utils/saveManager';

interface ExplorerPanelProps {
  vfs: VirtualFS;
  engine: GameEngine;
  activeFilePath: string;
  onSelectFile: (path: string) => void;
  onOpenSaveManager?: () => void;
}

export const ExplorerPanel: React.FC<ExplorerPanelProps> = ({
  vfs,
  engine,
  activeFilePath,
  onSelectFile,
  onOpenSaveManager
}) => {
  const [files, setFiles] = useState<VirtualFile[]>(vfs.getFiles());
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileLang, setNewFileLang] = useState<'python' | 'javascript'>('python');

  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  // Folder collapse states
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    guia: true,
    fazenda: true
  });

  // Extension filters
  const [enabledExtensions, setEnabledExtensions] = useState<Record<string, boolean>>({
    '.py': true,
    '.js': true
  });

  const [showOnboardingTip, setShowOnboardingTip] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('terrascript_onboarding_tip_dismissed') !== 'true';
    }
    return true;
  });

  const dismissOnboardingTip = () => {
    setShowOnboardingTip(false);
    engine.markQuickStartProminentDone();
    engine.markQuickStartSeen();
    if (typeof window !== 'undefined') {
      localStorage.setItem('terrascript_onboarding_tip_dismissed', 'true');
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshFiles = () => {
    setFiles(vfs.getFiles());
  };

  const toggleFolder = (folderKey: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderKey]: !prev[folderKey]
    }));
  };

  const toggleExtensionFilter = (ext: string) => {
    setEnabledExtensions(prev => ({
      ...prev,
      [ext]: prev[ext] === false ? true : false
    }));
  };

  const handleStartRename = (e: React.MouseEvent, file: VirtualFile) => {
    e.stopPropagation();
    if (file.readOnly || file.folder === 'guia' || file.path.startsWith('guia/')) {
      alert('Os scripts na pasta /guia são apenas para leitura e aprendizado. Crie seus próprios scripts na pasta /fazenda!');
      return;
    }
    setEditingPath(file.path);
    setEditingName(file.name);
  };

  const handleRenameSubmit = (oldPath: string) => {
    if (!editingName.trim()) {
      setEditingPath(null);
      return;
    }
    const renamed = vfs.renameFile(oldPath, editingName);
    if (renamed === false) {
      alert('Não foi possível renomear o arquivo. Nome inválido ou já existente.');
    } else {
      engine.getAgents().forEach(ag => {
        if (ag.assignedFile === oldPath) {
          ag.assignedFile = renamed.path;
        }
      });
      if (activeFilePath === oldPath) {
        onSelectFile(renamed.path);
      }
      refreshFiles();
    }
    setEditingPath(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const created = vfs.createFile(newFileName, newFileLang);
    setNewFileName('');
    setIsCreating(false);
    refreshFiles();
    onSelectFile(created.path);
  };

  const handleDelete = (e: React.MouseEvent, file: VirtualFile) => {
    e.stopPropagation();
    if (file.readOnly || file.folder === 'guia' || file.path.startsWith('guia/')) {
      alert('Não é possível excluir scripts protegidos da pasta /guia.');
      return;
    }
    if (files.length <= 1) {
      alert('Você deve manter pelo menos um arquivo na workspace.');
      return;
    }
    if (confirm(`Excluir o arquivo "${file.name}" de /fazenda?`)) {
      vfs.deleteFile(file.path);
      refreshFiles();
      const remaining = vfs.getFiles();
      if (remaining.length > 0) {
        onSelectFile(remaining[0].path);
      }
    }
  };

  const handleSetEntrypoint = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    vfs.setEntrypoint(path);
    refreshFiles();
  };

  const handleResetGuiaDefaults = () => {
    if (confirm('Restaurar os scripts padrão na pasta /guia? (Seus scripts na pasta /fazenda serão mantidos intactos!)')) {
      vfs.resetGuiaFiles();
      refreshFiles();
      onSelectFile('guia/main.py');
    }
  };

  const handleImportScriptFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;
    Array.from(uploadedFiles).forEach((file: File, index) => {
      importLocalScriptFile(vfs, file, (path) => {
        refreshFiles();
        if (index === 0) onSelectFile(path);
      });
    });
    e.target.value = '';
  };

  const agents = engine.getAgents();
  const primaryAgent = engine.getPrimaryAgent();
  const milestones = engine.getMilestones();

  // Extract all distinct extensions present in files
  const availableExtensions: string[] = Array.from(
    new Set<string>(
      files.map(f => {
        const idx = f.path.lastIndexOf('.');
        return idx !== -1 ? f.path.substring(idx) : '';
      }).filter((ext): ext is string => Boolean(ext))
    )
  );

  const visibleFiles = files.filter(file => {
    // Check first execution milestone filter if active
    if (!milestones.firstExecutionDone) {
      if (!(file.path.endsWith('main.py') || file.path.endsWith('main.js'))) {
        return false;
      }
    }
    // Extension filter
    const idx = file.path.lastIndexOf('.');
    const ext = idx !== -1 ? file.path.substring(idx) : '';
    if (ext && enabledExtensions[ext] === false) {
      return false;
    }
    return true;
  });

  const guiaFiles = visibleFiles.filter(f => f.folder === 'guia' || f.path.startsWith('guia/'));
  const fazendaFiles = visibleFiles.filter(f => f.folder === 'fazenda' || f.path.startsWith('fazenda/') || (!f.path.startsWith('guia/') && f.folder !== 'guia'));

  const renderFileList = (fileList: VirtualFile[], isGuiaFolder: boolean) => {
    if (fileList.length === 0) {
      return (
        <div className="pl-6 py-1.5 pr-2 text-[10px] text-[#62666d] font-mono italic">
          {isGuiaFolder ? 'Nenhum script no guia.' : 'Nenhum script na fazenda. Clique no botão "+" acima para criar!'}
        </div>
      );
    }

    return fileList.map((file) => {
      const isActive = file.path === activeFilePath;
      const isPy = file.language === 'python';
      const assignedAgents = agents.filter(a => a.assignedFile === file.path);

      return (
        <div
          key={file.path}
          onClick={() => onSelectFile(file.path)}
          onDoubleClick={(e) => handleStartRename(e, file)}
          className={`group flex items-center justify-between pl-6 pr-2 py-1.5 text-xs font-mono cursor-pointer transition-all ${
            isActive 
              ? 'bg-[#161718] text-[#ffffff] font-medium border-l-2 border-[#27a644]' 
              : 'text-[#8a8f98] hover:text-[#ffffff] hover:bg-[#161718]/60'
          }`}
          title={isGuiaFolder ? "Script de Aprendizado (Somente Leitura)" : "Clique duplo para renomear este arquivo"}
        >
          <div className="flex items-center gap-1.5 truncate min-w-0 pr-1 flex-1">
            {/* Language Badge */}
            <span className={`text-[8px] px-1 py-0.2 font-mono font-bold rounded-[3px] shrink-0 ${
              isPy ? 'bg-[#02b8cc]/10 text-[#02b8cc] border border-[#02b8cc]/30' : 'bg-[#e4f222]/15 text-[#e4f222] border border-[#e4f222]/30'
            }`}>
              {isPy ? 'PY' : 'JS'}
            </span>

            {editingPath === file.path ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRenameSubmit(file.path);
                }}
                className="flex-1 flex items-center min-w-0"
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => handleRenameSubmit(file.path)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setEditingPath(null);
                    }
                  }}
                  className="w-full bg-[#08090a] border border-[#383b3f] rounded-[4px] px-1.5 py-0.5 text-xs text-[#ffffff] font-mono focus:outline-none"
                  autoFocus
                />
              </form>
            ) : (
              <span className="truncate">{file.name}</span>
            )}

            {file.isEntrypoint && (
              <span title="Script de Entrada Principal" className="shrink-0">
                <Star className="w-3 h-3 text-[#d0d6e0] fill-[#d0d6e0]" />
              </span>
            )}
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
            {assignedAgents.length > 0 && (
              <span 
                className="text-[9px] px-1 py-0.2 bg-[#06b6d4]/15 text-[#06b6d4] border border-[#06b6d4]/40 font-pixel-mono font-bold flex items-center gap-0.5 rounded-sm"
                title={`Atribuído ao Agente ${assignedAgents.map(a => a.name).join(', ')}`}
              >
                <Bot className="w-3 h-3 text-[#06b6d4]" />
                {assignedAgents.length}
              </span>
            )}

            {!file.isEntrypoint && (
              <button
                onClick={(e) => handleSetEntrypoint(e, file.path)}
                className="p-1 hover:text-[#d0d6e0] text-[#8a8f98] transition-colors"
                title="Definir como Entrada Principal"
              >
                <Star className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (e && !e.isTrusted) {
                  engine.triggerSyntheticGuardrail();
                  return;
                }
                onSelectFile(file.path);
                engine.runScriptOnPrimaryAgent(file.path);
              }}
              className="p-1 text-[#22c55e] hover:text-[#4ade80] hover:scale-110 transition-all rounded"
              title={`Executar Script no Agente Principal (${primaryAgent.name}) [Ctrl/Cmd + Enter]`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>

            {!isGuiaFolder && (
              <button
                onClick={(e) => handleDelete(e, file)}
                className="p-1 hover:text-[#eb5757] text-[#8a8f98] transition-colors"
                title="Excluir Arquivo de /fazenda"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="w-64 bg-[#0f1011] border-r-2 border-[#23252a] flex flex-col h-full text-[#d0d6e0] select-none shrink-0 font-pixel-body text-xs">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportScriptFile} 
        accept=".py,.js,.txt" 
        multiple 
        className="hidden" 
      />

      {/* Panel Header */}
      <div className="px-3 py-2 border-b-2 border-[#23252a] flex items-center justify-between bg-[#08090a]">
        <span className="text-xs font-pixel-header tracking-wider text-[#8a8f98] flex items-center gap-1.5">
          <Folder className="w-3.5 h-3.5 text-[#d0d6e0]" />
          Explorador
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => milestones.createFileUnlocked && setIsCreating(true)}
            disabled={!milestones.createFileUnlocked}
            className={`p-1 pixel-btn text-xs transition-all ${
              milestones.createFileUnlocked 
                ? 'pixel-btn-green' 
                : 'opacity-40 cursor-not-allowed text-[#62666d]'
            }`}
            title={milestones.createFileUnlocked ? "Novo Arquivo de Script (salvo em /fazenda)" : "Execute seu código pela 1ª vez para liberar a criação de arquivos!"}
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1 pixel-btn pixel-btn-cyan text-xs transition-all"
            title="Importar Script Local para /fazenda (.py / .js)"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          {onOpenSaveManager && (
            <button
              onClick={onOpenSaveManager}
              className="p-1 pixel-btn text-[#d0d6e0] text-xs transition-all"
              title="Gerenciador de Scripts e Nuvem"
            >
              <Save className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleResetGuiaDefaults}
            className="p-1 pixel-btn text-xs text-[#8a8f98] hover:text-[#ffffff] transition-all"
            title="Restaurar apenas os Scripts da pasta /guia"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* New File Modal Inline Form */}
      {isCreating && (
        <form onSubmit={handleCreate} className="p-2 border-b border-[#23252a] bg-[#08090a] text-xs">
          <div className="mb-1 text-[11px] font-pixel-header text-[#ffffff]">Novo Script em /fazenda</div>
          <input
            type="text"
            placeholder="script_nome.py"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            className="w-full bg-[#161718] border border-[#23252a] rounded-[6px] px-2 py-1 text-[#ffffff] text-xs focus:outline-none focus:border-[#383b3f] mb-2 font-mono"
            autoFocus
          />
          <div className="flex items-center justify-between gap-2">
            <select
              value={newFileLang}
              onChange={(e) => setNewFileLang(e.target.value as 'python' | 'javascript')}
              className="bg-[#161718] border border-[#23252a] rounded-[6px] px-1.5 py-1 text-xs text-[#d0d6e0]"
            >
              <option value="python">Python (.py)</option>
              <option value="javascript">JavaScript (.js)</option>
            </select>
            <div className="flex gap-1">
              <button
                type="submit"
                className="px-2 py-1 bg-[#27a644] text-[#ffffff] rounded-[6px] text-[11px] font-medium hover:bg-[#27a644]/90"
              >
                Criar
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-2 py-1 bg-[#161718] text-[#8a8f98] rounded-[6px] text-[11px] hover:bg-[#23252a]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto py-2 px-1">
        <div className="text-[11px] font-mono text-[#8a8f98] px-2 py-1 flex items-center justify-between uppercase tracking-wider">
          <span className="flex items-center gap-1 font-pixel-header text-[10px] text-[#62666d]">
            workspace /
          </span>
          <button
            onClick={() => {
              const next = !showOnboardingTip;
              setShowOnboardingTip(next);
              if (typeof window !== 'undefined') {
                localStorage.setItem('terrascript_onboarding_tip_dismissed', next ? 'false' : 'true');
              }
            }}
            className="text-[10px] text-[#facc15] hover:text-[#fef08a] flex items-center gap-1 cursor-pointer font-sans normal-case lowercase hover:underline font-bold"
            title="Exibir/Ocultar Dicas de Início"
          >
            <span>Guia Rápido</span>
          </button>
        </div>

        {/* Beginner Onboarding Quick Start Banner in Pixel Amber Theme */}
        {showOnboardingTip && (
          <div 
            className="mx-1 my-2 p-2.5 bg-[#0f1011] pixel-box-amber border border-[#facc15]/80 shadow-[0_0_15px_rgba(250,204,21,0.2)] text-[11px] font-sans text-[#d0d6e0] space-y-1.5 animate-pulse hover:animate-none transition-all"
          >
            <div className="flex items-center justify-between text-[#facc15] font-bold text-xs font-pixel-mono">
              <span className="text-[#ffffff]">Primeiros Passos</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  dismissOnboardingTip();
                }}
                className="text-[#8a8f98] hover:text-[#ffffff] text-[10px] p-0.5 hover:bg-[#161718] rounded cursor-pointer"
                title="Fechar guia rápido"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-[#d0d6e0] text-[11px] leading-tight font-sans">
              <li>Edite o código em <strong className="text-[#ffffff]">guia/main.py</strong></li>
              <li>Clique no botão <strong className="text-[#22c55e]">▶ Executar (F5)</strong></li>
              <li>Acompanhe seu agente colher e libere novas <strong className="text-[#facc15]">Pesquisas</strong>!</li>
            </ol>
          </div>
        )}

        {/* Folders & Tree */}
        <div className="space-y-1 mt-1">

          {/* 1. Folder /guia */}
          <div className="rounded-[6px] overflow-hidden">
            <div 
              onClick={() => toggleFolder('guia')}
              className="flex items-center justify-between px-2 py-1.5 bg-[#141517] hover:bg-[#1a1c1e] text-[#d0d6e0] cursor-pointer transition-colors border border-[#23252a]"
              title="Clique para minimizar/expandir a pasta /guia"
            >
              <div className="flex items-center gap-1.5 font-pixel-mono font-bold text-xs text-[#02b8cc]">
                {expandedFolders.guia ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#8a8f98]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#8a8f98]" />
                )}
                {expandedFolders.guia ? (
                  <FolderOpen className="w-3.5 h-3.5 text-[#02b8cc]" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-[#02b8cc]" />
                )}
                <span>/guia</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] px-1 py-0.2 bg-[#02b8cc]/10 text-[#02b8cc] border border-[#02b8cc]/30 rounded font-pixel-mono flex items-center gap-0.5" title="Arquivos padrão de aprendizado (Somente Leitura)">
                  <span>Leitura</span>
                </span>
                <span className="text-[10px] font-mono text-[#8a8f98] font-bold bg-[#08090a] px-1.5 rounded">
                  {guiaFiles.length}
                </span>
              </div>
            </div>

            {expandedFolders.guia && (
              <div className="pt-0.5 space-y-0.5 bg-[#0b0c0d]/40 border-l border-[#23252a] ml-2">
                {renderFileList(guiaFiles, true)}
              </div>
            )}
          </div>

          {/* 2. Folder /fazenda */}
          <div className="rounded-[6px] overflow-hidden mt-1">
            <div 
              onClick={() => toggleFolder('fazenda')}
              className="flex items-center justify-between px-2 py-1.5 bg-[#141517] hover:bg-[#1a1c1e] text-[#d0d6e0] cursor-pointer transition-colors border border-[#23252a]"
              title="Clique para minimizar/expandir a pasta /fazenda"
            >
              <div className="flex items-center gap-1.5 font-pixel-mono font-bold text-xs text-[#22c55e]">
                {expandedFolders.fazenda ? (
                  <ChevronDown className="w-3.5 h-3.5 text-[#8a8f98]" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-[#8a8f98]" />
                )}
                {expandedFolders.fazenda ? (
                  <FolderOpen className="w-3.5 h-3.5 text-[#22c55e]" />
                ) : (
                  <Folder className="w-3.5 h-3.5 text-[#22c55e]" />
                )}
                <span>/fazenda</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] px-1 py-0.2 bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30 rounded font-pixel-mono font-bold">
                  Jogador
                </span>
                <span className="text-[10px] font-mono text-[#8a8f98] font-bold bg-[#08090a] px-1.5 rounded">
                  {fazendaFiles.length}
                </span>
              </div>
            </div>

            {expandedFolders.fazenda && (
              <div className="pt-0.5 space-y-0.5 bg-[#0b0c0d]/40 border-l border-[#23252a] ml-2">
                {renderFileList(fazendaFiles, false)}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Footer Extension Filter Bar */}
      <div className="px-2 py-1.5 border-t border-[#23252a] bg-[#0c0d0e] flex items-center justify-between text-[10px] font-mono text-[#8a8f98]">
        <div className="flex items-center gap-1">
          <Filter className="w-3 h-3 text-[#06b6d4]" />
          <span>Filtro:</span>
        </div>
        <div className="flex items-center gap-1">
          {availableExtensions.map(ext => {
            const isEnabled = enabledExtensions[ext] !== false;
            return (
              <button
                key={ext}
                onClick={() => toggleExtensionFilter(ext)}
                className={`px-1.5 py-0.5 rounded-[4px] font-pixel-mono font-bold transition-all flex items-center gap-0.5 cursor-pointer ${
                  isEnabled
                    ? 'bg-[#06b6d4]/20 text-[#06b6d4] border border-[#06b6d4]/50 shadow-[0_0_8px_rgba(6,182,212,0.15)]'
                    : 'bg-[#161718] text-[#62666d] border border-[#23252a] hover:text-[#8a8f98]'
                }`}
                title={`Exibir/Ocultar arquivos ${ext}`}
              >
                <span>{ext}</span>
                {isEnabled && <Check className="w-2.5 h-2.5 text-[#06b6d4]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Agent Assignment Quick Bar */}
      <div className="p-2 border-t border-[#23252a] bg-[#08090a] text-xs">
        <div className="text-[11px] font-medium text-[#8a8f98] mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Bot className="w-3.5 h-3.5 text-[#06b6d4]" />
            Atribuir ao Agente:
          </span>
          <span className="text-[10px] text-[#d0d6e0] font-mono flex items-center gap-1" title="Agente Principal para o botão PLAY do Explorador">
            <Star className="w-3 h-3 text-[#d0d6e0] fill-[#d0d6e0]" />
            <span>{primaryAgent.name}</span>
          </span>
        </div>
        <div className="space-y-1">
          {agents.map(ag => {
            const isPrimary = ag.id === engine.getPrimaryAgentId();
            return (
              <div key={ag.id} className="flex items-center justify-between bg-[#161718] p-1.5 rounded-[6px] border border-[#23252a]">
                <span className="text-[11px] font-mono text-[#d0d6e0] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ag.color }} />
                  {ag.name}
                  {isPrimary && <Star className="w-2.5 h-2.5 text-[#d0d6e0] fill-[#d0d6e0]" title="Agente Principal" />}
                </span>
                <select
                  value={ag.assignedFile}
                  onChange={(e) => engine.assignAgentFile(ag.id, e.target.value)}
                  className="bg-[#08090a] border border-[#23252a] text-[#d0d6e0] text-[10px] rounded-[4px] px-1 py-0.5 font-mono max-w-[110px] truncate"
                >
                  {files.map(f => (
                    <option key={f.path} value={f.path}>{f.name}</option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
