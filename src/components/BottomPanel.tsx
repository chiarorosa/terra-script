import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  AlertCircle, 
  Variable, 
  History,
  Trash2, 
  ChevronDown, 
  ChevronUp,
  GraduationCap,
  X
} from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';
import { CHANGELOG_HISTORY } from '../data/changelogData';

interface BottomPanelProps {
  engine: GameEngine;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({ engine }) => {
  const [activeTab, setActiveTab] = useState<'console' | 'problems' | 'variables' | 'changelog'>('console');
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('terrascript_bottom_panel_expanded');
      if (saved !== null) {
        return saved === 'true';
      }
    }
    return false; // Padrão: Painel fechado/minimizado
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('terrascript_bottom_panel_expanded', String(isExpanded));
    }
  }, [isExpanded]);
  const [educationalErrors, setEducationalErrors] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('terrascript_educational_errors') !== 'false';
    }
    return true;
  });

  const disableEducationalErrors = () => {
    setEducationalErrors(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('terrascript_educational_errors', 'false');
    }
  };

  const getEducationalAdvice = (msg: string) => {
    const m = msg.toLowerCase();
    if (m.includes('syntaxerror') || m.includes('invalid syntax')) {
      return 'Erro de sintaxe no código. Verifique se esqueceu de fechar parênteses (), aspas ou colocar dois-pontos (:) ao final de um bloco "if" ou "while".';
    }
    if (m.includes('nameerror') || m.includes('not defined')) {
      return 'Nome de comando ou variável não encontrado. Lembre-se de utilizar os namespaces do jogo (ex: farm.harvest(), world.measure()) e conferir a grafia exata.';
    }
    if (m.includes('indentationerror') || m.includes('indent')) {
      return 'Erro de recuo/indentação. Em Python, o bloco de código dentro de um "if", "while" ou "def" deve ser recuado com 4 espaços.';
    }
    if (m.includes('typeerror')) {
      return 'Tipo de parâmetro incompatível. Verifique a documentação na aba "Guia" para confirmar se a função espera um número, texto ou booleano.';
    }
    if (m.includes('dry') || m.includes('soil') || m.includes('harvest')) {
      return 'Certifique-se de que o solo foi molhado (farm.water()) e de checar se a cultura está madura (farm.can_harvest()) antes de colher.';
    }
    return 'Inspecione a linha de código informada. Consulte a aba "Guia" para ver exemplos funcionais e sintaxe detalhada de cada comando.';
  };

  const logs = engine.getLogs();
  const agents = engine.getAgents();

  return (
    <div className={`bg-[#0f1011] border-t-2 border-[#23252a] flex flex-col transition-all font-pixel-body text-[#d0d6e0] shrink-0 ${
      isExpanded ? 'h-56' : 'h-8'
    }`}>
      {/* Panel Header Bar */}
      <div className="h-8 bg-[#08090a] px-3 flex items-center justify-between text-xs font-pixel-mono select-none border-b-2 border-[#23252a]">
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setActiveTab('console'); setIsExpanded(true); }}
            className={`flex items-center gap-1.5 px-3 py-1 pixel-btn text-xs font-medium transition-all ${
              activeTab === 'console' && isExpanded 
                ? 'pixel-btn-green' 
                : 'text-[#8a8f98] hover:text-[#ffffff]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Saída do Console ({logs.length})
          </button>

          <button
            onClick={() => { setActiveTab('problems'); setIsExpanded(true); }}
            className={`flex items-center gap-1.5 px-3 py-1 pixel-btn text-xs font-medium transition-all ${
              activeTab === 'problems' && isExpanded 
                ? 'bg-[#ef4444] text-[#ffffff] shadow-[inset_-3px_-3px_0px_0px_#991b1b,inset_3px_3px_0px_0px_#fca5a5]' 
                : 'text-[#8a8f98] hover:text-[#ffffff]'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-[#ef4444]" />
            Problemas ({logs.filter(l => l.type === 'stderr').length})
          </button>

          <button
            onClick={() => { setActiveTab('variables'); setIsExpanded(true); }}
            className={`flex items-center gap-1.5 px-3 py-1 pixel-btn text-xs font-medium transition-all ${
              activeTab === 'variables' && isExpanded 
                ? 'pixel-btn-cyan' 
                : 'text-[#8a8f98] hover:text-[#ffffff]'
            }`}
          >
            <Variable className="w-3.5 h-3.5" />
            Variáveis e Estado
          </button>

          <button
            onClick={() => { setActiveTab('changelog'); setIsExpanded(true); }}
            className={`flex items-center gap-1.5 px-3 py-1 pixel-btn text-xs font-medium transition-all ${
              activeTab === 'changelog' && isExpanded 
                ? 'pixel-btn-amber' 
                : 'text-[#8a8f98] hover:text-[#ffffff]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Changelog
          </button>
        </div>

        <div className="flex items-center gap-2">
          {(activeTab === 'console' || activeTab === 'problems') && (
            <button
              onClick={() => engine.clearLogs()}
              className="flex items-center gap-1.5 px-2 py-0.5 pixel-btn text-xs text-[#8a8f98] hover:text-[#ef4444] transition-colors"
              title="Limpar Saída do Console"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Limpar Console</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-[#8a8f98] hover:text-[#ffffff] pixel-btn transition-colors"
            title={isExpanded ? 'Recolher Painel' : 'Expandir Painel'}
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          <span className="pixel-badge bg-[#22c55e] text-[#052e16] font-bold">
            {CHANGELOG_HISTORY.find(r => r.isCurrent)?.version || 'v2.6.0'}
          </span>
        </div>
      </div>

      {/* Panel Body Content */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-3 font-mono text-xs text-[#d0d6e0] bg-[#08090a]">
          {activeTab === 'console' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#23252a]">
                <span className="text-[11px] text-[#8a8f98] font-sans">
                  Logs de execução do script e mensagens do sistema ({logs.length} registro{logs.length !== 1 ? 's' : ''})
                </span>
              </div>
              {logs.length === 0 ? (
                <div className="text-[#8a8f98] italic py-2">Saída do console está vazia. Execute o código ou chame print() para inspecionar valores.</div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="space-y-0.5">
                    <div className="flex items-start gap-2 hover:bg-[#161718] px-1 py-0.5 rounded-[4px]">
                      <span className="text-[#62666d] text-[10px] shrink-0 font-sans">{log.timestamp}</span>
                      <span className="text-[#02b8cc] font-medium shrink-0">[Agent #{log.agentId}]</span>
                      {log.file && <span className="text-[#8a8f98] text-[10px] shrink-0">{log.file}:{log.line}</span>}
                      <span className={`break-all ${
                        log.type === 'stderr' 
                          ? 'text-[#eb5757] font-medium' 
                          : log.type === 'system' 
                            ? 'text-[#d0d6e0] italic' 
                            : 'text-[#27a644]'
                      }`}>
                        {log.message}
                      </span>
                    </div>

                    {log.type === 'stderr' && educationalErrors && (
                      <div className="ml-16 my-1 p-2 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 rounded-[6px] text-[11px] font-sans text-[#d0d6e0] flex items-start justify-between gap-2">
                        <div className="flex items-start gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-[#8b5cf6] shrink-0 mt-0.5" />
                          <span><strong className="text-[#8b5cf6]">Dica de Erro:</strong> {getEducationalAdvice(log.message)}</span>
                        </div>
                        <button
                          onClick={disableEducationalErrors}
                          className="text-[#8a8f98] hover:text-[#ffffff] text-[9px] font-mono shrink-0 hover:underline"
                          title="Desativar dicas"
                        >
                          [x]
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'problems' && (
            <div className="space-y-2">
              {logs.filter(l => l.type === 'stderr').length === 0 ? (
                <div className="text-[#27a644] flex items-center gap-2 py-2">
                  <CheckIcon className="w-4 h-4" /> Nenhum erro de sintaxe ou execução detectado.
                </div>
              ) : (
                logs.filter(l => l.type === 'stderr').map((log) => (
                  <div key={log.id} className="space-y-1.5">
                    <div className="p-2.5 bg-[#eb5757]/10 border border-[#eb5757]/30 rounded-[6px] text-[#eb5757] font-mono text-xs">
                      <div className="font-medium flex items-center gap-2 mb-1">
                        <AlertCircle className="w-4 h-4 text-[#eb5757] shrink-0" />
                        <span>Exceção em Tempo de Execução em <strong className="underline">{log.file || 'script'}:{log.line || 1}</strong></span>
                      </div>
                      <div className="pl-6 font-mono text-xs">{log.message}</div>
                    </div>

                    {/* Beginner Educational Advice Card */}
                    {educationalErrors && (
                      <div className="p-2.5 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 rounded-[6px] text-xs font-sans text-[#d0d6e0] flex items-start justify-between gap-3 animate-in fade-in duration-200">
                        <div className="flex items-start gap-2">
                          <GraduationCap className="w-4 h-4 text-[#8b5cf6] shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-[#8b5cf6] text-[11px] uppercase tracking-wider mb-0.5">
                              Dica Educativa para Iniciantes
                            </div>
                            <div className="text-xs text-[#d0d6e0] leading-relaxed">
                              {getEducationalAdvice(log.message)}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={disableEducationalErrors}
                          className="text-[#8a8f98] hover:text-[#ffffff] text-[10px] font-mono hover:bg-[#161718] px-1.5 py-0.5 rounded border border-transparent hover:border-[#23252a] shrink-0 transition-all flex items-center gap-1"
                          title="Não exibir mais dicas para iniciantes (Você pode reativar nas configurações)"
                        >
                          <X className="w-3 h-3" />
                          <span>Desativar Dicas</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'variables' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {agents.map(ag => (
                <div key={ag.id} className="p-2 bg-[#161718] border border-[#23252a] rounded-[6px]">
                  <div className="font-medium text-[#02b8cc] mb-1 border-b border-[#23252a] pb-1 flex items-center justify-between">
                    <span>{ag.name}</span>
                    <span className="text-[10px] text-[#8a8f98] font-normal">Linha {ag.currentLine}</span>
                  </div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between"><span className="text-[#8a8f98]">Posição X:</span> <span>{ag.x}</span></div>
                    <div className="flex justify-between"><span className="text-[#8a8f98]">Posição Y:</span> <span>{ag.y}</span></div>
                    <div className="flex justify-between"><span className="text-[#8a8f98]">Limites da Grade:</span> <span>{engine.getGridWidth()}x{engine.getGridHeight()}</span></div>
                    <div className="flex justify-between"><span className="text-[#8a8f98]">Arquivo Atribuído:</span> <span className="text-[#27a644]">{ag.assignedFile}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'changelog' && (
            <div className="space-y-3 font-sans">
              <div className="text-[#8a8f98] text-[11px] mb-2 flex items-center justify-between">
                <span>Histórico de Atualizações de Versões (N.N.N)</span>
                <span className="text-[#27a644] font-mono font-medium">Versão Atual: {CHANGELOG_HISTORY.find(r => r.isCurrent)?.version || 'v2.2.0'}</span>
              </div>
              
              <div className="space-y-2.5">
                {CHANGELOG_HISTORY.map((rel) => (
                  <div 
                    key={rel.version} 
                    className={`p-3 rounded-[12px] border transition-all ${
                      rel.isCurrent 
                        ? 'bg-[#161718] border-[#383b3f]' 
                        : 'bg-[#0f1011] border-[#23252a]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs font-medium px-2 py-0.5 rounded-[4px] ${
                          rel.isCurrent 
                            ? 'bg-[#27a644] text-[#ffffff]' 
                            : 'bg-[#161718] text-[#8a8f98] border border-[#23252a]'
                        }`}>
                          {rel.version}
                        </span>
                        <span className="text-xs font-medium text-[#ffffff]">{rel.title}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#8a8f98]">{rel.date}</span>
                    </div>

                    <ul className="list-disc list-inside space-y-1 text-xs text-[#d0d6e0] pl-1">
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
