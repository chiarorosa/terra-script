import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Cpu, 
  FlaskConical, 
  Terminal, 
  CheckCircle2, 
  Lock, 
  Code, 
  Copy, 
  Check, 
  Search, 
  Sprout, 
  Zap, 
  Boxes, 
  Layers,
  ArrowRight,
  ChevronRight,
  Info,
  Sparkles,
  HelpCircle,
  FileText,
  GraduationCap,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';
import { VirtualFS } from '../engine/virtualFs';
import { API_CATALOG, isTechUnlocked, getTechForApiItem, ApiItem, getPrimaryApiItemForTech } from '../engine/techApiMap';
import { TechNode } from '../types/game';

// Helper component to render formatted inline text with code highlights and badges
const RenderFormattedInlineText: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  const regex = /(`[^`]+`|\b(?:farm|world|sys)\.[a-zA-Z0-9_]+\(\)|"[A-Z_0-9]{2,}"|\[ATENÇÃO:[^\]]+\]|ATENÇÃO:|IMPORTANTE:|Dica Tática\/Estratégica:)/g;

  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, idx) => {
        if (!part) return null;

        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={idx} className="px-2 py-0.5 mx-0.5 bg-[#08090a] border border-[#23252a] text-[#facc15] font-pixel-mono text-xs rounded">
              {part.slice(1, -1)}
            </code>
          );
        }

        if (/(?:farm|world|sys)\.[a-zA-Z0-9_]+\(\)/.test(part)) {
          return (
            <code key={idx} className="px-2 py-0.5 mx-0.5 bg-[#08090a] border border-[#22c55e]/50 text-[#22c55e] font-pixel-mono text-xs font-bold rounded shadow-sm">
              {part}
            </code>
          );
        }

        if (/^"[A-Z_0-9]{2,}"$/.test(part)) {
          return (
            <code key={idx} className="px-2 py-0.5 mx-0.5 bg-[#08090a] border border-[#3b82f6]/50 text-[#60a5fa] font-pixel-mono text-xs font-bold rounded">
              {part}
            </code>
          );
        }

        if (part.startsWith('[ATENÇÃO:') || part === 'ATENÇÃO:' || part === 'IMPORTANTE:' || part === 'Dica Tática/Estratégica:') {
          return (
            <span key={idx} className="px-2 py-0.5 mx-0.5 bg-[#facc15]/15 border border-[#facc15]/40 text-[#facc15] font-bold font-pixel-mono text-xs rounded inline-flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-[#facc15] shrink-0" />
              {part}
            </span>
          );
        }

        return <span key={idx}>{part}</span>;
      })}
    </span>
  );
};

// Component to render docDetail into structured step cards, lists, and callout boxes
const DidacticDocDetailRenderer: React.FC<{ docDetail: string }> = ({ docDetail }) => {
  if (!docDetail) return null;

  const sections = docDetail.split('\n\n').filter(s => s.trim().length > 0);

  return (
    <div className="space-y-3.5 font-sans">
      {sections.map((sectionText, sIdx) => {
        const lines = sectionText.split('\n').filter(l => l.trim().length > 0);
        if (lines.length === 0) return null;

        const firstLine = lines[0].trim();
        const numberedHeaderMatch = firstLine.match(/^(\d+)\.\s*(.*)/);

        if (numberedHeaderMatch) {
          const stepNum = numberedHeaderMatch[1];
          const stepTitle = numberedHeaderMatch[2];
          const bodyLines = lines.slice(1);

          return (
            <div key={sIdx} className="bg-[#0a0b0c] pixel-box p-4 border border-[#23252a] space-y-3">
              <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#23252a]">
                <span className="px-2.5 py-1 bg-[#22c55e] text-[#052e16] font-pixel-header text-xs font-bold shrink-0 rounded-sm">
                  PASSO {stepNum}
                </span>
                <h4 className="text-sm font-pixel-mono font-bold text-[#ffffff] uppercase tracking-wide">
                  <RenderFormattedInlineText text={stepTitle} />
                </h4>
              </div>

              <div className="space-y-2.5 pt-0.5 font-sans text-sm">
                {bodyLines.map((line, lIdx) => {
                  const trimmed = line.trim();

                  if (trimmed.includes('ATENÇÃO:') || trimmed.includes('IMPORTANTE:') || trimmed.includes('Dica Tática/Estratégica:') || trimmed.includes('Fique tranquilo!')) {
                    return (
                      <div key={lIdx} className="p-3 bg-[#facc15]/10 border-l-4 border-[#facc15] rounded-r text-[#fef08a] space-y-1 my-2">
                        <div className="flex items-center gap-1.5 font-pixel-mono font-bold text-xs text-[#facc15]">
                          <AlertTriangle className="w-4 h-4 shrink-0 text-[#facc15]" />
                          <span>RECOMENDAÇÃO TÁTICA</span>
                        </div>
                        <p className="leading-relaxed text-sm text-[#fef08a] font-sans">
                          <RenderFormattedInlineText text={trimmed.replace(/^[•\s\d\.-]+/, '')} />
                        </p>
                      </div>
                    );
                  }

                  if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
                    const cleanText = trimmed.replace(/^[•\-]\s*/, '');
                    const titleMatch = cleanText.match(/^([^:]+):\s*(.*)/);

                    return (
                      <div key={lIdx} className="flex items-start gap-2.5 p-2.5 bg-[#141517] border border-[#23252a] rounded transition-all hover:border-[#22c55e]/30">
                        <span className="w-2 h-2 rounded-full bg-[#22c55e] mt-2 shrink-0" />
                        <div className="flex-1 leading-relaxed text-[#e2e8f0] text-sm font-sans">
                          {titleMatch ? (
                            <>
                              <strong className="font-pixel-mono text-[#ffffff] mr-1 text-sm font-semibold">
                                <RenderFormattedInlineText text={titleMatch[1]} />:
                              </strong>
                              <RenderFormattedInlineText text={titleMatch[2]} />
                            </>
                          ) : (
                            <RenderFormattedInlineText text={cleanText} />
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (line.startsWith('  ') || line.startsWith('\t')) {
                    return (
                      <div key={lIdx} className="ml-4 pl-2.5 border-l-2 border-[#3b82f6]/40 text-[#a0a6b0] font-pixel-mono text-xs py-0.5">
                        <RenderFormattedInlineText text={trimmed} />
                      </div>
                    );
                  }

                  return (
                    <p key={lIdx} className="text-[#e2e8f0] text-sm leading-relaxed font-sans py-0.5">
                      <RenderFormattedInlineText text={trimmed} />
                    </p>
                  );
                })}
              </div>
            </div>
          );
        }

        return (
          <div key={sIdx} className="p-3.5 bg-[#0a0b0c] pixel-box border border-[#23252a] space-y-2">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (lIdx === 0 && lines.length > 1 && !trimmed.startsWith('•') && !trimmed.startsWith('-')) {
                return (
                  <h4 key={lIdx} className="text-sm font-pixel-mono font-bold text-[#22c55e] uppercase tracking-wider pb-1.5 border-b border-[#23252a]">
                    <RenderFormattedInlineText text={trimmed} />
                  </h4>
                );
              }

              if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
                const cleanText = trimmed.replace(/^[•\-]\s*/, '');
                return (
                  <div key={lIdx} className="flex items-start gap-2 text-sm text-[#e2e8f0] leading-relaxed font-sans py-0.5">
                    <span className="text-[#22c55e] font-bold shrink-0 mt-0.5">›</span>
                    <div><RenderFormattedInlineText text={cleanText} /></div>
                  </div>
                );
              }

              return (
                <p key={lIdx} className="text-sm text-[#e2e8f0] leading-relaxed font-sans">
                  <RenderFormattedInlineText text={trimmed} />
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

interface TutorialModalProps {
  engine: GameEngine;
  vfs?: VirtualFS;
  initialSelectedItemId?: string | null;
  onNavigateToTab?: (tab: 'workspace' | 'research' | 'agents' | 'tutorial') => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ engine, initialSelectedItemId, onNavigateToTab }) => {
  const techTree = engine.getTechTree();
  const [selectedItemId, setSelectedItemId] = useState<string>(() => {
    if (initialSelectedItemId) {
      const item = getPrimaryApiItemForTech(initialSelectedItemId);
      if (item) return item.id;
    }
    return 'mech_soil_water';
  });

  React.useEffect(() => {
    if (initialSelectedItemId) {
      const item = getPrimaryApiItemForTech(initialSelectedItemId);
      if (item) {
        setSelectedItemId(item.id);
      }
    }
  }, [initialSelectedItemId]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [activeCodeLang, setActiveCodeLang] = useState<'python' | 'javascript'>('python');

  const [educationalErrors, setEducationalErrors] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('terrascript_educational_errors') !== 'false';
    }
    return true;
  });

  const toggleEducationalErrors = () => {
    const nextVal = !educationalErrors;
    setEducationalErrors(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('terrascript_educational_errors', nextVal ? 'true' : 'false');
    }
  };

  const totalTech = techTree.length;
  const unlockedTechCount = techTree.filter(t => t.unlocked).length;
  const unlockPercentage = Math.round((unlockedTechCount / totalTech) * 100);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(code);
    setTimeout(() => setCopiedSnippet(null), 1500);
  };

  const isUnlocked = (techId: string) => isTechUnlocked(techId, techTree);

  // Filter items according to search query & filter mode
  const filteredCatalog = useMemo(() => {
    return API_CATALOG.filter(item => {
      const unlocked = isUnlocked(item.techId);
      
      // Filter mode check
      if (filterMode === 'unlocked' && !unlocked) return false;
      if (filterMode === 'locked' && unlocked) return false;

      // Search query check
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      const matchName = item.methodName.toLowerCase().includes(q);
      const matchDisplay = item.displayText.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchNamespace = item.namespace.toLowerCase().includes(q);
      const matchCat = item.category.toLowerCase().includes(q);

      return matchName || matchDisplay || matchDesc || matchNamespace || matchCat;
    });
  }, [searchQuery, filterMode, techTree]);

  // Group filtered catalog by namespace/category
  const namespaces = [
    { key: 'mechanics', label: 'Conceitos & Regras', namespaceCode: 'regras', icon: BookOpen, color: 'text-[#ec4899]', bgColor: 'bg-[#ec4899]/10', borderColor: 'border-[#ec4899]/30' },
    { key: 'farm', label: 'Comandos da Fazenda', namespaceCode: 'farm.*', icon: Sprout, color: 'text-[#27a644]', bgColor: 'bg-[#27a644]/10', borderColor: 'border-[#27a644]/30' },
    { key: 'world', label: 'Sensores do Mundo', namespaceCode: 'world.*', icon: Terminal, color: 'text-[#06b6d4]', bgColor: 'bg-[#06b6d4]/10', borderColor: 'border-[#06b6d4]/30' },
    { key: 'inventory', label: 'Consulta de Inventário', namespaceCode: 'inventory.*', icon: Boxes, color: 'text-[#eab308]', bgColor: 'bg-[#eab308]/10', borderColor: 'border-[#eab308]/30' },
    { key: 'syntax', label: 'Recursos da Linguagem', namespaceCode: 'sintaxe', icon: Cpu, color: 'text-[#02b8cc]', bgColor: 'bg-[#02b8cc]/10', borderColor: 'border-[#02b8cc]/30' },
  ] as const;

  // Selected item object
  const selectedItem = useMemo(() => {
    return API_CATALOG.find(i => i.id === selectedItemId) || API_CATALOG[0];
  }, [selectedItemId]);

  const selectedTechNode = useMemo(() => {
    if (!selectedItem) return undefined;
    return getTechForApiItem(selectedItem.techId, techTree);
  }, [selectedItem, techTree]);

  const selectedUnlocked = selectedItem ? isUnlocked(selectedItem.techId) : false;

  return (
    <div className="flex-1 bg-[#08090a] p-4 md:p-6 overflow-hidden font-pixel-body text-[#d0d6e0] select-none flex flex-col h-full">
      <div className="max-w-7xl w-full mx-auto flex flex-col h-full space-y-4">
        
        {/* Header Bar & Research Progress */}
        <div className="bg-[#0f1011] pixel-box p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-sm font-pixel-header text-[#ffffff] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#22c55e]" />
              Wiki da API & Guia de Programação
            </h1>
            <p className="text-xs text-[#8a8f98] mt-1 font-pixel-body">
              Documentação técnica oficial para automação agrícola. Inspecione a declaração de métodos, parâmetros, tipos de retorno e exemplos de algoritmos.
            </p>
          </div>

          {/* Research Progress Badge & Educational Errors Toggle */}
          <div className="flex flex-wrap items-center gap-3 shrink-0 font-pixel-mono">
            {/* Beginner Educational Help Badge */}
            <button
              onClick={toggleEducationalErrors}
              className={`flex items-center gap-2 px-3 py-1.5 pixel-btn text-xs font-medium transition-all ${
                educationalErrors
                  ? 'pixel-btn-purple'
                  : 'text-[#8a8f98]'
              }`}
              title="Clique para ativar/desativar dicas amigáveis de erros de código no console"
            >
              <GraduationCap className="w-4 h-4 text-[#a855f7]" />
              <span>Dicas de Erro: <strong className="font-pixel-mono">{educationalErrors ? 'ATIVADO' : 'DESATIVADO'}</strong></span>
            </button>

            <div className="flex items-center gap-4 bg-[#08090a] pixel-box px-3.5 py-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-pixel-mono">
                  <span className="text-[#8a8f98]">Progresso:</span>
                  <span className="text-[#22c55e] font-bold ml-2">{unlockedTechCount} / {totalTech} ({unlockPercentage}%)</span>
                </div>
                <div className="w-40 h-2 bg-[#161718] border border-[#23252a] overflow-hidden">
                  <div 
                    className="h-full bg-[#22c55e] transition-all duration-500" 
                    style={{ width: `${unlockPercentage}%` }}
                  />
                </div>
              </div>

              {onNavigateToTab && (
                <button
                  onClick={() => onNavigateToTab('research')}
                  className="px-2.5 py-1.5 pixel-btn pixel-btn-green text-xs font-pixel-header transition-all flex items-center gap-1 shrink-0"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>Pesquisas</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Wiki Main Container: Sidebar + Article View */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* SIDEBAR NAVIGATION (4 Cols) */}
          <div className="md:col-span-4 lg:col-span-3 bg-[#0f1011] pixel-box p-3 flex flex-col min-h-0 overflow-hidden">
            
            {/* Search Input Box */}
            <div className="relative mb-2.5 shrink-0">
              <Search className="w-3.5 h-3.5 text-[#8a8f98] absolute left-3 top-2.5" />
              <input 
                type="text"
                placeholder="Pesquisar API..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#08090a] pixel-box text-xs text-[#ffffff] placeholder-[#8a8f98] focus:outline-none focus:border-[#22c55e] font-pixel-mono transition-colors"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 mb-3 pb-2 border-b-2 border-[#23252a] shrink-0 font-pixel-mono">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2 py-0.5 pixel-badge transition-all ${
                  filterMode === 'all' 
                    ? 'bg-[#22c55e] text-[#052e16] font-bold' 
                    : 'text-[#8a8f98] bg-[#161718]'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterMode('unlocked')}
                className={`px-2 py-0.5 pixel-badge transition-all ${
                  filterMode === 'unlocked' 
                    ? 'bg-[#22c55e] text-[#052e16] font-bold' 
                    : 'text-[#8a8f98] bg-[#161718]'
                }`}
              >
                Ativos
              </button>
              <button
                onClick={() => setFilterMode('locked')}
                className={`px-2 py-0.5 pixel-badge transition-all ${
                  filterMode === 'locked' 
                    ? 'bg-[#facc15] text-[#0f172a] font-bold' 
                    : 'text-[#8a8f98] bg-[#161718]'
                }`}
              >
                Bloqueados
              </button>
            </div>

            {/* Navigation Tree by Namespace */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 font-pixel-body">
              {namespaces.map(ns => {
                const nsItems = filteredCatalog.filter(i => i.namespace === ns.key);
                if (nsItems.length === 0) return null;

                const NsIcon = ns.icon;

                return (
                  <div key={ns.key} className="space-y-1">
                    <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-[#ffffff] uppercase font-pixel-mono border-b-2 border-[#23252a]/50">
                      <span className="flex items-center gap-1.5">
                        <NsIcon className={`w-3.5 h-3.5 ${ns.color}`} />
                        <span>{ns.label}</span>
                      </span>
                      <span className="text-[10px] text-[#8a8f98] font-pixel-mono">({nsItems.length})</span>
                    </div>

                    <div className="space-y-1 pt-0.5">
                      {nsItems.map(item => {
                        const unlocked = isUnlocked(item.techId);
                        const isSelected = item.id === selectedItemId;

                        return (
                          <button
                            key={item.id}
                            onClick={() => setSelectedItemId(item.id)}
                            className={`w-full text-left px-2.5 py-1.5 pixel-btn text-xs font-pixel-mono transition-all flex items-center justify-between group ${
                              isSelected 
                                ? 'pixel-btn-green text-[#ffffff]' 
                                : 'text-[#a0a6b0] hover:text-[#ffffff] bg-[#161718]'
                            }`}
                          >
                            <span className="truncate flex items-center gap-1.5">
                              <ChevronRight className={`w-3 h-3 transition-transform ${isSelected ? 'rotate-90 text-[#22c55e]' : 'text-[#8a8f98]'}`} />
                              <span className="truncate">{item.displayText}</span>
                            </span>

                            <span className="shrink-0 ml-1">
                              {unlocked ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" />
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-[#facc15]" />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {filteredCatalog.length === 0 && (
                <div className="p-6 text-center text-xs text-[#8a8f98] space-y-2 font-pixel-body">
                  <HelpCircle className="w-8 h-8 mx-auto text-[#8a8f98]/50" />
                  <p>Nenhum método ou conceito encontrado para a busca atual.</p>
                </div>
              )}
            </div>
          </div>

          {/* MAIN ARTICLE VIEW - FOCUSED WIKI TOPIC (8-9 Cols) */}
          <div className="md:col-span-8 lg:col-span-9 bg-[#0f1011] pixel-box p-5 flex flex-col min-h-0 overflow-y-auto space-y-5">
            
            {/* Header Title Card */}
            <div className="p-4 bg-[#08090a] border border-[#23252a] rounded-[10px] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#23252a] pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-[#161718] text-[#27a644] border border-[#27a644]/30">
                      {selectedItem.category}
                    </span>
                    <span className="text-xs font-mono text-[#8a8f98]">
                      Namespace: <code className="text-[#ffffff]">{selectedItem.namespace}</code>
                    </span>
                  </div>

                  <h2 className="text-xl font-bold font-mono text-[#ffffff] mt-1.5 flex items-center gap-2">
                    {selectedItem.displayText}
                  </h2>
                </div>

                {/* Status Badge & Research Navigation */}
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 border ${
                    selectedUnlocked 
                      ? 'bg-[#27a644]/15 text-[#27a644] border-[#27a644]/30' 
                      : 'bg-[#d29922]/15 text-[#d29922] border-[#d29922]/30'
                  }`}>
                    {selectedUnlocked ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#27a644]" />
                        <span>DESBLOQUEADO</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5 text-[#d29922]" />
                        <span>BLOQUEADO</span>
                      </>
                    )}
                  </span>

                  {selectedTechNode && onNavigateToTab && !selectedUnlocked && (
                    <button
                      onClick={() => onNavigateToTab('research')}
                      className="px-2.5 py-1 bg-[#161718] hover:bg-[#23252a] text-[#27a644] border border-[#27a644]/40 rounded text-xs font-medium transition-all flex items-center gap-1"
                      title="Ir para Árvore de Pesquisa"
                    >
                      <span>Pesquisar {selectedTechNode.id}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Languages Tag & Description summary */}
              <div className="flex items-center justify-between text-xs text-[#a0a6b0]">
                <span>Suporte a Linguagens: <strong className="text-[#ffffff] font-mono">Python 3</strong> & <strong className="text-[#ffffff] font-mono">JavaScript ES6+</strong></span>
                {selectedTechNode && (
                  <span className="font-mono text-[11px] text-[#8a8f98]">Requisito: {selectedTechNode.name} ({selectedTechNode.id})</span>
                )}
              </div>
            </div>

            {/* PILAR: DESCRIÇÃO DIDÁTICA */}
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#23252a]">
                <h3 className="text-sm font-bold font-pixel-mono text-[#22c55e] uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4.5 h-4.5 text-[#22c55e]" />
                  Descrição Didática, Conceitos e Regras
                </h3>
                <span className="text-xs font-pixel-mono text-[#8a8f98] uppercase tracking-wider">
                  Guia Estruturado de Aprendizado
                </span>
              </div>

              {/* Visão Geral Curta */}
              {selectedItem.description && (
                <div className="p-3.5 bg-[#111214] border-l-4 border-[#22c55e] pixel-box space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-pixel-mono text-[#22c55e] uppercase font-bold">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>Visão Geral do Conceito</span>
                  </div>
                  <p className="text-sm text-[#e2e8f0] font-sans leading-relaxed">
                    <RenderFormattedInlineText text={selectedItem.description} />
                  </p>
                </div>
              )}

              {/* Passo a Passo e Mecânicas Didáticas */}
              {selectedItem.docDetail && (
                <DidacticDocDetailRenderer docDetail={selectedItem.docDetail} />
              )}
            </div>

            {/* PILAR: DECLARAÇÃO DA FUNÇÃO / SINTAXE (Somente se houver sintaxe válida) */}
            {((selectedItem.pythonSnippet && selectedItem.pythonSnippet.trim().length > 0) || 
              (selectedItem.jsSnippet && selectedItem.jsSnippet.trim().length > 0)) && (
              <div className="space-y-2.5">
                <h3 className="text-sm font-bold font-pixel-mono text-[#02b8cc] uppercase tracking-wider flex items-center gap-2">
                  <Code className="w-4.5 h-4.5 text-[#02b8cc]" />
                  Declaração e Assinatura do Método
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  
                  {/* Python Signature */}
                  {selectedItem.pythonSnippet && (
                    <div className="p-3.5 bg-[#08090a] border border-[#23252a] rounded-[8px] space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono font-bold text-[#02b8cc]">
                        <span>Sintaxe Python</span>
                        <span className="text-xs text-[#8a8f98]">.py</span>
                      </div>
                      <pre className="p-2.5 bg-[#161718] rounded border border-[#23252a] text-sm font-mono text-[#ffffff] overflow-x-auto">
                        <code>{selectedItem.pythonSnippet}</code>
                      </pre>
                    </div>
                  )}

                  {/* JS Signature */}
                  {selectedItem.jsSnippet && (
                    <div className="p-3.5 bg-[#08090a] border border-[#23252a] rounded-[8px] space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono font-bold text-[#eab308]">
                        <span>Sintaxe JavaScript</span>
                        <span className="text-xs text-[#8a8f98]">.js</span>
                      </div>
                      <pre className="p-2.5 bg-[#161718] rounded border border-[#23252a] text-sm font-mono text-[#ffffff] overflow-x-auto">
                        <code>{selectedItem.jsSnippet}</code>
                      </pre>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* PILAR: PARÂMETROS E TIPOS (Somente se houver parâmetros definidos) */}
            {selectedItem.parameters && selectedItem.parameters.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-sm font-bold font-pixel-mono text-[#eab308] uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4.5 h-4.5 text-[#eab308]" />
                  Parâmetros e Tipos de Entrada
                </h3>

                <div className="overflow-x-auto border border-[#23252a] rounded-[8px] bg-[#161718]">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#08090a] border-b border-[#23252a] text-[#8a8f98] font-mono text-xs">
                        <th className="p-3 font-bold">Parâmetro</th>
                        <th className="p-3 font-bold">Tipo</th>
                        <th className="p-3 font-bold">Obrigatório</th>
                        <th className="p-3 font-bold">Valores Aceitos</th>
                        <th className="p-3 font-bold">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#23252a] text-[#d0d6e0] font-sans">
                      {selectedItem.parameters.map((param, i) => (
                        <tr key={i} className="hover:bg-[#08090a]/50">
                          <td className="p-3 font-mono font-bold text-[#ffffff]">{param.name}</td>
                          <td className="p-3 font-mono text-[#02b8cc]">{param.type}</td>
                          <td className="p-3 font-mono">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${param.required ? 'bg-[#eb5757]/15 text-[#eb5757]' : 'bg-[#8a8f98]/15 text-[#8a8f98]'}`}>
                              {param.required ? 'SIM' : 'OPCIONAL'}
                            </span>
                          </td>
                          <td className="p-3 font-mono text-xs text-[#eab308]">
                            {param.allowedValues ? param.allowedValues.join(', ') : 'Qualquer valor válido'}
                          </td>
                          <td className="p-3 text-[#a0a6b0]">{param.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PILAR: RETORNO E SAÍDA ESPERADA (Somente se houver retorno definido) */}
            {selectedItem.returns && selectedItem.returns.type !== 'conceito' && (
              <div className="space-y-2.5">
                <h3 className="text-sm font-bold font-pixel-mono text-[#ec4899] uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4.5 h-4.5 text-[#ec4899]" />
                  Retorno e Saída Esperada
                </h3>
                <div className="p-4 bg-[#161718] border border-[#23252a] rounded-[8px] space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-mono font-bold text-[#ffffff]">Tipo do Retorno:</span>
                    <span className="px-2.5 py-0.5 bg-[#ec4899]/15 text-[#ec4899] border border-[#ec4899]/30 rounded font-mono text-xs font-bold">
                      {selectedItem.returns.type}
                    </span>
                  </div>
                  <p className="text-sm text-[#d0d6e0] font-sans leading-relaxed">
                    <strong>Efeito no Mundo:</strong> {selectedItem.returns.description}
                  </p>
                  {selectedItem.expectedOutput && (
                    <div className="p-2.5 bg-[#08090a] rounded border border-[#23252a] text-xs font-mono text-[#22c55e]">
                      Resultado em tela: {selectedItem.expectedOutput}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PILAR: USABILIDADE E CASOS DE USO (Somente se houver notas) */}
            {selectedItem.usabilityNotes && selectedItem.usabilityNotes.length > 0 && (
              <div className="space-y-2.5">
                <h3 className="text-sm font-bold font-pixel-mono text-[#06b6d4] uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-[#06b6d4]" />
                  Dicas de Usabilidade & Boas Práticas no Código
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {selectedItem.usabilityNotes.map((note, i) => (
                    <div key={i} className="p-3.5 bg-[#0a0b0c] pixel-box border border-[#23252a] flex items-start gap-3 text-sm text-[#d0d6e0] font-sans leading-relaxed transition-all hover:border-[#06b6d4]/40">
                      <span className="px-2 py-0.5 bg-[#06b6d4]/15 text-[#67e8f9] border border-[#06b6d4]/30 font-pixel-mono text-xs font-bold shrink-0 rounded">
                        #{i + 1}
                      </span>
                      <div className="flex-1">
                        <RenderFormattedInlineText text={note.replace(/^\d+\.\s*/, '')} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PILAR: EXEMPLO PRÁTICO EXECUTÁVEL (Somente se houver código de exemplo) */}
            {selectedItem.exampleCode && selectedItem.exampleCode.trim().length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold font-pixel-mono text-[#22c55e] uppercase tracking-wider flex items-center gap-2">
                    <Terminal className="w-4.5 h-4.5 text-[#22c55e]" />
                    Exemplo Prático de Script
                  </h3>

                  {/* Code Language Switcher */}
                  <div className="flex items-center gap-1 bg-[#08090a] border border-[#23252a] p-1 rounded">
                    <button
                      onClick={() => setActiveCodeLang('python')}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                        activeCodeLang === 'python' ? 'bg-[#22c55e] text-black' : 'text-[#8a8f98] hover:text-[#ffffff]'
                      }`}
                    >
                      Python
                    </button>
                    <button
                      onClick={() => setActiveCodeLang('javascript')}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                        activeCodeLang === 'javascript' ? 'bg-[#eab308] text-black' : 'text-[#8a8f98] hover:text-[#ffffff]'
                      }`}
                    >
                      JavaScript
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-[#08090a] border border-[#23252a] rounded-[8px] relative group space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[#23252a] pb-2 text-xs font-mono text-[#8a8f98]">
                    <span>Script Prático ({activeCodeLang === 'python' ? 'Python' : 'JavaScript'})</span>
                    <button 
                      onClick={() => copyCode(selectedItem.exampleCode)}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-[#161718] hover:bg-[#23252a] text-[#ffffff] rounded border border-[#23252a] text-xs transition-all active:scale-95 font-bold"
                      title="Copiar código para o clipboard"
                    >
                      {copiedSnippet === selectedItem.exampleCode ? (
                        <>
                          <Check className="w-4 h-4 text-[#22c55e]" />
                          <span className="text-[#22c55e]">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-[#8a8f98]" />
                          <span>Copiar Código</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-3.5 bg-[#161718] rounded border border-[#23252a] text-sm font-mono text-[#22c55e] leading-relaxed overflow-x-auto">
                    <code>
                      {activeCodeLang === 'python' 
                        ? selectedItem.exampleCode 
                        : selectedItem.exampleCode.replace(/def /g, 'function ').replace(/:/g, ' {').replace(/pass/g, '// ...')}
                    </code>
                  </pre>
                </div>
              </div>
            )}

            {/* PILAR: VÍNCULO NA ÁRVORE DE TECNOLOGIAS */}
            {selectedTechNode && (
              <div className="space-y-2.5 pt-3 border-t border-[#23252a]">
                <h3 className="text-sm font-bold font-pixel-mono text-[#8a8f98] uppercase tracking-wider flex items-center gap-2">
                  <FlaskConical className="w-4.5 h-4.5 text-[#22c55e]" />
                  Vínculo na Árvore de Tecnologias
                </h3>

                <div className="p-4 bg-[#161718] border border-[#23252a] rounded-[8px] flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#ffffff] font-mono">{selectedTechNode.name}</span>
                      <span className="text-xs font-mono text-[#8a8f98]">({selectedTechNode.id})</span>
                      <span className="px-2 py-0.5 rounded text-xs font-mono bg-[#08090a] border border-[#23252a] text-[#22c55e] font-bold">
                        Nível {selectedTechNode.tier}
                      </span>
                    </div>
                    <p className="text-sm text-[#a0a6b0] font-sans">{selectedTechNode.description}</p>
                  </div>

                  {onNavigateToTab && (
                    <button
                      onClick={() => onNavigateToTab('research')}
                      className="px-3.5 py-2 bg-[#238636] hover:bg-[#2ea043] text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shrink-0 border border-[#3fb950]/30 active:scale-95"
                    >
                      <FlaskConical className="w-4 h-4" />
                      <span>Ir para Pesquisa ({selectedTechNode.id})</span>
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
