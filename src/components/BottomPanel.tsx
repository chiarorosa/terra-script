import React, { useState } from 'react';
import { 
  Terminal, 
  AlertCircle, 
  Variable, 
  Layers, 
  History,
  Trash2, 
  ChevronDown, 
  ChevronUp
} from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';
import { CHANGELOG_HISTORY } from '../data/changelogData';

interface BottomPanelProps {
  engine: GameEngine;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({ engine }) => {
  const [activeTab, setActiveTab] = useState<'console' | 'problems' | 'variables' | 'stack' | 'changelog'>('console');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const logs = engine.getLogs();
  const agents = engine.getAgents();

  return (
    <div className={`bg-[#161b22] border-t border-[#30363d] flex flex-col transition-all font-sans text-[#c9d1d9] shrink-0 ${
      isExpanded ? 'h-52' : 'h-8'
    }`}>
      {/* Panel Header Bar */}
      <div className="h-8 bg-[#010409] px-3 flex items-center justify-between text-xs font-mono select-none border-b border-[#30363d]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setActiveTab('console'); setIsExpanded(true); }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-t border-b-2 text-xs font-medium transition-all ${
              activeTab === 'console' && isExpanded 
                ? 'border-[#3fb950] text-[#f0f6fc] bg-[#161b22]' 
                : 'border-transparent text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-[#3fb950]" />
            Saída do Console ({logs.length})
          </button>

          <button
            onClick={() => { setActiveTab('problems'); setIsExpanded(true); }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-t border-b-2 text-xs font-medium transition-all ${
              activeTab === 'problems' && isExpanded 
                ? 'border-[#f85149] text-[#f85149] bg-[#161b22]' 
                : 'border-transparent text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-[#f85149]" />
            Problemas ({logs.filter(l => l.type === 'stderr').length})
          </button>

          <button
            onClick={() => { setActiveTab('variables'); setIsExpanded(true); }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-t border-b-2 text-xs font-medium transition-all ${
              activeTab === 'variables' && isExpanded 
                ? 'border-[#58a6ff] text-[#58a6ff] bg-[#161b22]' 
                : 'border-transparent text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            <Variable className="w-3.5 h-3.5 text-[#58a6ff]" />
            Variáveis e Estado
          </button>

          <button
            onClick={() => { setActiveTab('stack'); setIsExpanded(true); }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-t border-b-2 text-xs font-medium transition-all ${
              activeTab === 'stack' && isExpanded 
                ? 'border-[#bc8cff] text-[#bc8cff] bg-[#161b22]' 
                : 'border-transparent text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#bc8cff]" />
            Pilha de Chamadas
          </button>

          <button
            onClick={() => { setActiveTab('changelog'); setIsExpanded(true); }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-t border-b-2 text-xs font-medium transition-all ${
              activeTab === 'changelog' && isExpanded 
                ? 'border-[#d29922] text-[#e3b341] bg-[#161b22]' 
                : 'border-transparent text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            <History className="w-3.5 h-3.5 text-[#e3b341]" />
            Changelog
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'console' && (
            <button
              onClick={() => engine.clearLogs()}
              className="p-1 text-[#8b949e] hover:text-[#f85149] hover:bg-[#21262d] rounded transition-colors"
              title="Limpar Saída do Console"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] rounded transition-colors"
            title={isExpanded ? 'Recolher Painel' : 'Expandir Painel'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          <span className="text-[10px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#238636]/20 text-[#3fb950] border border-[#238636]/50 select-none ml-1">
            v2.0.1
          </span>
        </div>
      </div>

      {/* Panel Body Content */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-3 font-mono text-xs text-[#c9d1d9] bg-[#0d1117]">
          {activeTab === 'console' && (
            <div className="space-y-1">
              {logs.length === 0 ? (
                <div className="text-[#8b949e] italic py-2">Saída do console está vazia. Execute o código ou chame print() para inspecionar valores.</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 hover:bg-[#161b22] px-1 py-0.5 rounded">
                    <span className="text-[#6e7681] text-[10px] shrink-0 font-sans">{log.timestamp}</span>
                    <span className="text-[#58a6ff] font-bold shrink-0">[Agent #{log.agentId}]</span>
                    {log.file && <span className="text-[#8b949e] text-[10px] shrink-0">{log.file}:{log.line}</span>}
                    <span className={`break-all ${
                      log.type === 'stderr' 
                        ? 'text-[#f85149] font-bold' 
                        : log.type === 'system' 
                          ? 'text-[#d29922] italic' 
                          : 'text-[#3fb950]'
                    }`}>
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'problems' && (
            <div className="space-y-1">
              {logs.filter(l => l.type === 'stderr').length === 0 ? (
                <div className="text-[#3fb950] flex items-center gap-2 py-2">
                  <CheckIcon className="w-4 h-4" /> Nenhum erro de sintaxe ou execução detectado.
                </div>
              ) : (
                logs.filter(l => l.type === 'stderr').map((log) => (
                  <div key={log.id} className="p-2 bg-[#da3633]/10 border border-[#da3633]/40 rounded text-[#f85149] font-mono text-xs">
                    <div className="font-bold flex items-center gap-2 mb-1">
                      <AlertCircle className="w-4 h-4 text-[#f85149]" />
                      Exceção em Tempo de Execução em {log.file || 'script'}:{log.line || 1}
                    </div>
                    <div>{log.message}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'variables' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {agents.map(ag => (
                <div key={ag.id} className="p-2 bg-[#161b22] border border-[#30363d] rounded">
                  <div className="font-bold text-[#58a6ff] mb-1 border-b border-[#30363d] pb-1 flex items-center justify-between">
                    <span>{ag.name}</span>
                    <span className="text-[10px] text-[#8b949e] font-normal">Linha {ag.currentLine}</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between"><span className="text-[#8b949e]">Posição X:</span> <span>{ag.x}</span></div>
                    <div className="flex justify-between"><span className="text-[#8b949e]">Posição Y:</span> <span>{ag.y}</span></div>
                    <div className="flex justify-between"><span className="text-[#8b949e]">Limites da Grade:</span> <span>{engine.getGridWidth()}x{engine.getGridHeight()}</span></div>
                    <div className="flex justify-between"><span className="text-[#8b949e]">Arquivo Atribuído:</span> <span className="text-[#3fb950]">{ag.assignedFile}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'stack' && (
            <div className="space-y-1">
              {agents.map(ag => (
                <div key={ag.id} className="p-2 bg-[#161b22] border border-[#30363d] rounded font-mono text-xs">
                  <span className="text-[#58a6ff] font-bold">{ag.name}</span> Pilha de Chamadas:
                  <div className="mt-1 pl-3 text-[#8b949e] space-y-0.5 border-l-2 border-[#30363d]">
                    <div>-&gt; {ag.assignedFile}:{ag.currentLine} (frame ativo)</div>
                    <div>  main()</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'changelog' && (
            <div className="space-y-3 font-sans">
              <div className="text-[#8b949e] text-[11px] mb-2 flex items-center justify-between">
                <span>Histórico de Atualizações de Versões (N.N.N)</span>
                <span className="text-[#3fb950] font-mono font-semibold">Versão Atual: v2.0.1</span>
              </div>
              
              <div className="space-y-2.5">
                {CHANGELOG_HISTORY.map((rel) => (
                  <div 
                    key={rel.version} 
                    className={`p-3 rounded-lg border transition-all ${
                      rel.isCurrent 
                        ? 'bg-[#161b22] border-[#d29922]/50 shadow-sm' 
                        : 'bg-[#161b22]/50 border-[#30363d]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                          rel.isCurrent 
                            ? 'bg-[#238636] text-[#ffffff]' 
                            : 'bg-[#21262d] text-[#8b949e] border border-[#30363d]'
                        }`}>
                          {rel.version}
                        </span>
                        <span className="text-xs font-semibold text-[#f0f6fc]">{rel.title}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#8b949e]">{rel.date}</span>
                    </div>

                    <ul className="list-disc list-inside space-y-1 text-xs text-[#c9d1d9] pl-1">
                      {rel.changes.map((item, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function CheckIcon(props: any) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
