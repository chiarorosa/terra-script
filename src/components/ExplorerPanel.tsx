import React, { useRef, useState } from 'react';
import { 
  FileCode, 
  Folder, 
  Plus, 
  Trash2, 
  Star, 
  RotateCcw, 
  FileText, 
  Bot, 
  Check, 
  ChevronRight, 
  ChevronDown,
  Download,
  Upload,
  Save,
  Play
} from 'lucide-react';
import { VirtualFS } from '../engine/virtualFs';
import { VirtualFile } from '../types/game';
import { GameEngine } from '../engine/GameEngine';
import { downloadScript, importLocalScriptFile } from '../utils/saveManager';

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshFiles = () => {
    setFiles(vfs.getFiles());
  };

  const handleStartRename = (e: React.MouseEvent, file: VirtualFile) => {
    e.stopPropagation();
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

  const handleDelete = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    if (files.length <= 1) {
      alert('Você deve manter pelo menos um arquivo na workspace.');
      return;
    }
    if (confirm(`Excluir o arquivo "${path}"?`)) {
      vfs.deleteFile(path);
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

  const handleResetDefaults = () => {
    if (confirm('Restaurar apenas os arquivos da workspace para os scripts iniciais do jogo? (Suas pesquisas e terreno serão mantidos)')) {
      vfs.resetToDefaults();
      refreshFiles();
      onSelectFile('main.py');
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

  return (
    <div className="w-64 bg-[#161b22] border-r border-[#30363d] flex flex-col h-full text-[#c9d1d9] select-none shrink-0 font-sans">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportScriptFile} 
        accept=".py,.js,.txt" 
        multiple 
        className="hidden" 
      />

      {/* Panel Header */}
      <div className="px-3 py-2 border-b border-[#30363d] flex items-center justify-between bg-[#010409]">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#8b949e] flex items-center gap-1.5">
          <Folder className="w-3.5 h-3.5 text-[#d29922]" />
          Explorador
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCreating(true)}
            className="p-1 hover:bg-[#21262d] text-[#8b949e] hover:text-[#3fb950] rounded transition-all"
            title="Novo Arquivo de Script"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1 hover:bg-[#21262d] text-[#8b949e] hover:text-[#58a6ff] rounded transition-all"
            title="Importar Script Local (.py / .js)"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          {onOpenSaveManager && (
            <button
              onClick={onOpenSaveManager}
              className="p-1 hover:bg-[#21262d] text-[#8b949e] hover:text-[#d29922] rounded transition-all"
              title="Gerenciador de Saves e Backup"
            >
              <Save className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleResetDefaults}
            className="p-1 hover:bg-[#21262d] text-[#8b949e] hover:text-[#d29922] rounded transition-all"
            title="Restaurar apenas os Scripts Padrão (main.py)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* New File Modal Inline Form */}
      {isCreating && (
        <form onSubmit={handleCreate} className="p-2 border-b border-[#30363d] bg-[#010409] text-xs">
          <div className="mb-1.5 font-medium text-[#f0f6fc]">Criar Novo Arquivo de Script</div>
          <input
            type="text"
            placeholder="script_nome.py"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            className="w-full bg-[#0d1117] border border-[#30363d] rounded px-2 py-1 text-[#f0f6fc] text-xs focus:outline-none focus:border-[#58a6ff] mb-2 font-mono"
            autoFocus
          />
          <div className="flex items-center justify-between gap-2">
            <select
              value={newFileLang}
              onChange={(e) => setNewFileLang(e.target.value as any)}
              className="bg-[#0d1117] border border-[#30363d] rounded px-1.5 py-1 text-xs text-[#c9d1d9]"
            >
              <option value="python">Python (.py)</option>
              <option value="javascript">JavaScript (.js)</option>
            </select>
            <div className="flex gap-1">
              <button
                type="submit"
                className="px-2 py-1 bg-[#238636] text-white rounded text-[11px] font-medium hover:bg-[#2ea043]"
              >
                Criar
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-2 py-1 bg-[#21262d] text-[#8b949e] rounded text-[11px] hover:bg-[#30363d]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto py-2 px-1">
        <div className="text-[11px] font-mono text-[#8b949e] px-2 py-1 flex items-center gap-1 uppercase tracking-wider">
          <ChevronDown className="w-3 h-3" />
          workspace /
        </div>

        <div className="space-y-0.5 mt-1">
          {files.map((file) => {
            const isActive = file.path === activeFilePath;
            const isPy = file.language === 'python';
            const assignedAgents = agents.filter(a => a.assignedFile === file.path);

            return (
              <div
                key={file.path}
                onClick={() => onSelectFile(file.path)}
                onDoubleClick={(e) => handleStartRename(e, file)}
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-mono cursor-pointer transition-all ${
                  isActive 
                    ? 'bg-[#21262d] text-[#f0f6fc] font-semibold border-l-2 border-[#3fb950]' 
                    : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]/60'
                }`}
                title="Clique duplo para renomear este arquivo"
              >
                <div className="flex items-center gap-2 truncate min-w-0 pr-1 flex-1">
                  {/* Language Badge */}
                  <span className={`text-[9px] px-1 py-0.2 font-bold rounded shrink-0 ${
                    isPy ? 'bg-[#388bfd]/20 text-[#58a6ff] border border-[#388bfd]/40' : 'bg-[#d29922]/20 text-[#d29922] border border-[#d29922]/40'
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
                        className="w-full bg-[#0d1117] border border-[#58a6ff] rounded px-1.5 py-0.5 text-xs text-[#f0f6fc] font-mono focus:outline-none"
                        autoFocus
                      />
                    </form>
                  ) : (
                    <span className="truncate">{file.name}</span>
                  )}

                  {file.isEntrypoint && (
                    <span title="Script de Entrada Principal" className="shrink-0">
                      <Star className="w-3 h-3 text-[#d29922] fill-[#d29922]" />
                    </span>
                  )}
                </div>

                {/* Right Action Icons */}
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  {assignedAgents.length > 0 && (
                    <span 
                      className="text-[10px] px-1 bg-[#388bfd]/20 text-[#58a6ff] rounded font-sans flex items-center gap-0.5"
                      title={`Atribuído ao Drone ${assignedAgents.map(a => a.name).join(', ')}`}
                    >
                      <Bot className="w-2.5 h-2.5" />
                      {assignedAgents.length}
                    </span>
                  )}

                  {!file.isEntrypoint && (
                    <button
                      onClick={(e) => handleSetEntrypoint(e, file.path)}
                      className="p-1 hover:text-[#d29922] text-[#8b949e] transition-colors"
                      title="Definir como Entrada Principal"
                    >
                      <Star className="w-3 h-3" />
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectFile(file.path);
                      engine.runScriptOnPrimaryAgent(file.path);
                    }}
                    className="p-1 hover:text-[#3fb950] hover:bg-[#3fb950]/20 text-[#3fb950] transition-all rounded"
                    title={`Executar Script no Drone Principal (${primaryAgent.name})`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                  </button>

                  <button
                    onClick={(e) => handleDelete(e, file.path)}
                    className="p-1 hover:text-[#f85149] text-[#8b949e] transition-colors"
                    title="Excluir Arquivo"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drone Assignment Quick Bar */}
      <div className="p-2 border-t border-[#30363d] bg-[#010409] text-xs">
        <div className="text-[11px] font-semibold text-[#8b949e] mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <Bot className="w-3.5 h-3.5 text-[#bc8cff]" />
            Atribuir ao Drone:
          </span>
          <span className="text-[10px] text-[#e3b341] font-mono flex items-center gap-1" title="Drone Principal para o botão PLAY do Explorador">
            <Star className="w-3 h-3 text-[#d29922] fill-[#d29922]" />
            <span>{primaryAgent.name}</span>
          </span>
        </div>
        <div className="space-y-1">
          {agents.map(ag => {
            const isPrimary = ag.id === engine.getPrimaryAgentId();
            return (
              <div key={ag.id} className="flex items-center justify-between bg-[#161b22] p-1.5 rounded border border-[#30363d]">
                <span className="text-[11px] font-mono text-[#c9d1d9] flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ag.color }} />
                  {ag.name}
                  {isPrimary && <Star className="w-2.5 h-2.5 text-[#d29922] fill-[#d29922]" title="Drone Principal" />}
                </span>
                <select
                  value={ag.assignedFile}
                  onChange={(e) => engine.assignAgentFile(ag.id, e.target.value)}
                  className="bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] text-[10px] rounded px-1 py-0.5 font-mono"
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
