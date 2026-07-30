import React, { useState, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { VirtualFile } from '../types/game';
import { GameEngine } from '../engine/GameEngine';
import { VirtualFS } from '../engine/virtualFs';
import { Play, Sparkles, Star, Tag, Lock, CheckCircle2, Copy, Filter } from 'lucide-react';
import { API_CATALOG, isTechUnlocked, getTechForApiItem } from '../engine/techApiMap';
import { createGameEngineCompletionExtension } from './editorAutocompletion';
import { activeLineExtension } from './editorActiveLine';

interface CodeEditorProps {
  file: VirtualFile;
  vfs: VirtualFS;
  engine: GameEngine;
  activeLine?: number;
  onCodeChange: (content: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  file,
  vfs,
  engine,
  activeLine,
  onCodeChange
}) => {
  const isPython = file.language === 'python';
  const breakpoints = engine.getBreakpoints(file.path);
  const techTree = engine.getTechTree();
  
  const [filterUnlockedOnly, setFilterUnlockedOnly] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const handleEditorChange = (value: string) => {
    vfs.setFileContent(file.path, value);
    engine.onScriptModified(file.path);
    onCodeChange(value);
  };

  const unlockedCount = API_CATALOG.filter(a => isTechUnlocked(a.techId, techTree)).length;

  const filteredApis = filterUnlockedOnly 
    ? API_CATALOG.filter(a => isTechUnlocked(a.techId, techTree))
    : API_CATALOG;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(text);
    setTimeout(() => setCopiedItem(null), 1500);
  };

  const completionExt = useMemo(() => {
    return createGameEngineCompletionExtension(engine, isPython);
  }, [engine, isPython]);

  const langExt = useMemo(() => {
    return isPython ? python() : javascript();
  }, [isPython]);

  const activeLineExt = useMemo(() => {
    return activeLineExtension(activeLine);
  }, [activeLine]);

  const editorExtensions = useMemo(() => [
    langExt,
    completionExt,
    activeLineExt
  ], [langExt, completionExt, activeLineExt]);

  return (
    <div className="flex-1 flex flex-col bg-[#0d1117] h-full overflow-hidden border-r border-[#30363d]">
      {/* Editor Header Bar */}
      <div className="h-9 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-3 text-xs font-mono text-[#c9d1d9] select-none shrink-0">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
            isPython ? 'bg-[#388bfd]/20 text-[#58a6ff] border border-[#388bfd]/40' : 'bg-[#e4f222]/20 text-[#e4f222] border border-[#e4f222]/40'
          }`}>
            {file.language}
          </span>
          <span className="font-semibold text-[#f0f6fc]">{file.name}</span>
          {file.isEntrypoint && (
            <span className="text-[10px] text-[#d29922] bg-[#d29922]/15 px-1.5 py-0.5 rounded border border-[#d29922]/30 flex items-center gap-1">
              <Star className="w-2.5 h-2.5 fill-current" />
              Entrada Principal
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[#8b949e] text-[11px]">
          {activeLine && (
            <span className="text-[#5e6ad2] font-bold animate-pulse flex items-center gap-1">
              <Play className="w-3 h-3 fill-current" />
              Executando Linha {activeLine}
            </span>
          )}
          <span>Pontos de Interrupção: {breakpoints.size}</span>
        </div>
      </div>

      {/* CodeMirror Workspace */}
      <div className="flex-1 overflow-auto text-sm font-mono relative">
        <CodeMirror
          value={file.content}
          height="100%"
          theme={oneDark}
          extensions={editorExtensions}
          onChange={handleEditorChange}
          className="h-full text-sm"
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            history: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            defaultKeymap: true,
            searchKeymap: true,
            historyKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
        />
      </div>

      {/* Dynamic API Quick Reference Footer */}
      <div className="p-2 bg-[#161b22] border-t border-[#30363d] text-[11px] font-mono text-[#8b949e] flex flex-col gap-1.5 shrink-0 select-none">
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[#f0f6fc] font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#3fb950]" />
              Referência da API:
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40">
              {unlockedCount} / {API_CATALOG.length} Desbloqueados
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setFilterUnlockedOnly(!filterUnlockedOnly)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] transition-all border ${
                filterUnlockedOnly 
                  ? 'bg-[#238636]/20 text-[#3fb950] border-[#238636]/50' 
                  : 'bg-[#21262d] text-[#c9d1d9] border-[#30363d] hover:bg-[#30363d]'
              }`}
            >
              <Filter className="w-2.5 h-2.5" />
              {filterUnlockedOnly ? 'Apenas Desbloqueados' : 'Mostrar Todos'}
            </button>
          </div>
        </div>

        {/* API Chips List */}
        <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-0.5 scrollbar-thin">
          {filteredApis.map(api => {
            const unlocked = isTechUnlocked(api.techId, techTree);
            const techNode = getTechForApiItem(api.techId, techTree);

            return (
              <button
                key={api.id}
                onClick={() => unlocked && copyToClipboard(api.displayText)}
                title={
                  unlocked 
                    ? `Sintaxe: ${api.signature}\nDescrição: ${api.description}\n\n(Clique para copiar: ${api.displayText})` 
                    : `Sintaxe: ${api.signature}\nDescrição: ${api.description}\n\nBloqueado na Árvore de Pesquisa\nRequer: ${techNode?.name} (Nível ${techNode?.tier})`
                }
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono transition-all border ${
                  unlocked
                    ? api.namespace === 'farm'
                      ? 'bg-[#238636]/15 text-[#3fb950] border-[#238636]/40 hover:border-[#3fb950] cursor-pointer'
                      : api.namespace === 'world'
                      ? 'bg-[#388bfd]/15 text-[#58a6ff] border-[#388bfd]/40 hover:border-[#58a6ff] cursor-pointer'
                      : 'bg-[#d29922]/15 text-[#d29922] border-[#d29922]/40 hover:border-[#d29922] cursor-pointer'
                    : 'bg-[#010409] text-[#6e7681] border-[#21262d] opacity-60 cursor-not-allowed'
                }`}
              >
                {unlocked ? (
                  <CheckCircle2 className="w-2.5 h-2.5 text-[#3fb950] shrink-0" />
                ) : (
                  <Lock className="w-2.5 h-2.5 text-[#6e7681] shrink-0" />
                )}
                <span>{api.displayText}</span>
                {copiedItem === api.displayText && (
                  <span className="text-[9px] text-[#3fb950] font-sans ml-1">Copiado!</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

