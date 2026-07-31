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
  GraduationCap
} from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';
import { VirtualFS } from '../engine/virtualFs';
import { API_CATALOG, isTechUnlocked, getTechForApiItem, ApiItem } from '../engine/techApiMap';
import { TechNode } from '../types/game';

interface TutorialModalProps {
  engine: GameEngine;
  vfs?: VirtualFS;
  onNavigateToTab?: (tab: 'workspace' | 'research' | 'agents' | 'tutorial') => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ engine, onNavigateToTab }) => {
  const techTree = engine.getTechTree();
  const [selectedItemId, setSelectedItemId] = useState<string>('mech_soil_water');
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
    { key: 'world', label: 'Sensores do Mundo', namespaceCode: 'world.*', icon: Terminal, color: 'text-[#8b5cf6]', bgColor: 'bg-[#8b5cf6]/10', borderColor: 'border-[#8b5cf6]/30' },
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
    <div className="flex-1 bg-[#08090a] p-4 md:p-6 overflow-hidden font-sans text-[#d0d6e0] select-none flex flex-col h-full">
      <div className="max-w-7xl w-full mx-auto flex flex-col h-full space-y-4">
        
        {/* Header Bar & Research Progress */}
        <div className="bg-[#0f1011] border border-[#23252a] rounded-[12px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-sm">
          <div>
            <h1 className="text-lg font-bold text-[#ffffff] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#27a644]" />
              Wiki da API & Guia de Programação
            </h1>
            <p className="text-xs text-[#8a8f98] mt-1">
              Documentação técnica oficial para automação agrícola. Inspecione a declaração de métodos, parâmetros, tipos de retorno e exemplos de algoritmos.
            </p>
          </div>

          {/* Research Progress Badge & Educational Errors Toggle */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Beginner Educational Help Badge */}
            <button
              onClick={toggleEducationalErrors}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-[8px] border text-xs font-medium transition-all ${
                educationalErrors
                  ? 'bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/30 hover:bg-[#8b5cf6]/20'
                  : 'bg-[#161718] text-[#8a8f98] border-[#23252a] hover:text-[#d0d6e0]'
              }`}
              title="Clique para ativar/desativar dicas amigáveis de erros de código no console"
            >
              <GraduationCap className="w-4 h-4 text-[#8b5cf6]" />
              <span>Dicas de Erro: <strong className="font-mono">{educationalErrors ? 'ATIVADO' : 'DESATIVADO'}</strong></span>
            </button>

            <div className="flex items-center gap-4 bg-[#08090a] border border-[#23252a] px-3.5 py-2 rounded-[8px]">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#8a8f98]">Progresso de Pesquisas:</span>
                  <span className="text-[#27a644] font-bold ml-2">{unlockedTechCount} / {totalTech} ({unlockPercentage}%)</span>
                </div>
                <div className="w-40 h-1.5 bg-[#161718] rounded-full overflow-hidden border border-[#23252a]">
                  <div 
                    className="h-full bg-[#27a644] transition-all duration-500 rounded-full" 
                    style={{ width: `${unlockPercentage}%` }}
                  />
                </div>
              </div>

              {onNavigateToTab && (
                <button
                  onClick={() => onNavigateToTab('research')}
                  className="px-2.5 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded text-xs font-semibold transition-all flex items-center gap-1 shadow-sm active:scale-95 shrink-0 border border-[#3fb950]/30"
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
          <div className="md:col-span-4 lg:col-span-3 bg-[#0f1011] border border-[#23252a] rounded-[12px] p-3 flex flex-col min-h-0 overflow-hidden shadow-sm">
            
            {/* Search Input Box */}
            <div className="relative mb-2.5 shrink-0">
              <Search className="w-3.5 h-3.5 text-[#8a8f98] absolute left-3 top-2.5" />
              <input 
                type="text"
                placeholder="Pesquisar API ou conceito..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#08090a] border border-[#23252a] rounded-[6px] text-xs text-[#ffffff] placeholder-[#8a8f98] focus:outline-none focus:border-[#27a644] font-mono transition-colors"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 mb-3 pb-2 border-b border-[#23252a] shrink-0">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  filterMode === 'all' 
                    ? 'bg-[#27a644]/20 text-[#27a644] border border-[#27a644]/40 font-semibold' 
                    : 'text-[#8a8f98] hover:text-[#ffffff]'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterMode('unlocked')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  filterMode === 'unlocked' 
                    ? 'bg-[#27a644]/20 text-[#27a644] border border-[#27a644]/40 font-semibold' 
                    : 'text-[#8a8f98] hover:text-[#ffffff]'
                }`}
              >
                Desbloqueados
              </button>
              <button
                onClick={() => setFilterMode('locked')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  filterMode === 'locked' 
                    ? 'bg-[#27a644]/20 text-[#27a644] border border-[#27a644]/40 font-semibold' 
                    : 'text-[#8a8f98] hover:text-[#ffffff]'
                }`}
              >
                Bloqueados
              </button>
            </div>

            {/* Navigation Tree by Namespace */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {namespaces.map(ns => {
                const nsItems = filteredCatalog.filter(i => i.namespace === ns.key);
                if (nsItems.length === 0) return null;

                const NsIcon = ns.icon;

                return (
                  <div key={ns.key} className="space-y-1">
                    <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-[#ffffff] tracking-wide uppercase font-mono border-b border-[#23252a]/50">
                      <span className="flex items-center gap-1.5">
                        <NsIcon className={`w-3.5 h-3.5 ${ns.color}`} />
                        <span>{ns.label}</span>
                      </span>
                      <span className="text-[10px] text-[#8a8f98] font-mono">({nsItems.length})</span>
                    </div>

                    <div className="space-y-0.5 pt-0.5">
                      {nsItems.map(item => {
                        const unlocked = isUnlocked(item.techId);
                        const isSelected = item.id === selectedItemId;

                        return (
                          <button
                            key={item.id}
                            onClick={() => setSelectedItemId(item.id)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-xs font-mono transition-all flex items-center justify-between group ${
                              isSelected 
                                ? 'bg-[#161718] text-[#ffffff] border border-[#27a644]/50 shadow-sm' 
                                : 'text-[#a0a6b0] hover:text-[#ffffff] hover:bg-[#161718]/60 border border-transparent'
                            }`}
                          >
                            <span className="truncate flex items-center gap-1.5">
                              <ChevronRight className={`w-3 h-3 transition-transform ${isSelected ? 'rotate-90 text-[#27a644]' : 'text-[#8a8f98] group-hover:text-[#ffffff]'}`} />
                              <span className="truncate">{item.displayText}</span>
                            </span>

                            <span className="shrink-0 ml-1">
                              {unlocked ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#27a644]" />
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-[#d29922]" />
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
                <div className="p-6 text-center text-xs text-[#8a8f98] space-y-2">
                  <HelpCircle className="w-8 h-8 mx-auto text-[#8a8f98]/50" />
                  <p>Nenhum método ou conceito encontrado para a busca atual.</p>
                </div>
              )}
            </div>
          </div>

          {/* MAIN ARTICLE VIEW - FOCUSED WIKI TOPIC (8-9 Cols) */}
          <div className="md:col-span-8 lg:col-span-9 bg-[#0f1011] border border-[#23252a] rounded-[12px] p-5 flex flex-col min-h-0 overflow-y-auto space-y-5 shadow-sm">
            
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
            <div className="space-y-2">
              <h3 className="text-xs font-bold font-mono text-[#27a644] uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#27a644]" />
                Descrição Didática
              </h3>
              <div className="p-3.5 bg-[#161718] border border-[#23252a] rounded-[8px] text-xs text-[#d0d6e0] leading-relaxed">
                <p className="mb-2 font-sans">{selectedItem.description}</p>
                <p className="font-sans text-[#a0a6b0]">{selectedItem.docDetail}</p>
              </div>
            </div>

            {/* PILAR: DECLARAÇÃO DA FUNÇÃO / SINTAXE (Somente se houver sintaxe válida) */}
            {((selectedItem.pythonSnippet && selectedItem.pythonSnippet.trim().length > 0) || 
              (selectedItem.jsSnippet && selectedItem.jsSnippet.trim().length > 0)) && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold font-mono text-[#02b8cc] uppercase tracking-wider flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-[#02b8cc]" />
                  Declaração e Assinatura do Método
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  
                  {/* Python Signature */}
                  {selectedItem.pythonSnippet && (
                    <div className="p-3 bg-[#08090a] border border-[#23252a] rounded-[8px] space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#02b8cc]">
                        <span>Sintaxe Python</span>
                        <span className="text-[10px] text-[#8a8f98]">.py</span>
                      </div>
                      <pre className="p-2 bg-[#161718] rounded border border-[#23252a] text-xs font-mono text-[#ffffff] overflow-x-auto">
                        <code>{selectedItem.pythonSnippet}</code>
                      </pre>
                    </div>
                  )}

                  {/* JS Signature */}
                  {selectedItem.jsSnippet && (
                    <div className="p-3 bg-[#08090a] border border-[#23252a] rounded-[8px] space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#eab308]">
                        <span>Sintaxe JavaScript</span>
                        <span className="text-[10px] text-[#8a8f98]">.js</span>
                      </div>
                      <pre className="p-2 bg-[#161718] rounded border border-[#23252a] text-xs font-mono text-[#ffffff] overflow-x-auto">
                        <code>{selectedItem.jsSnippet}</code>
                      </pre>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* PILAR: PARÂMETROS E TIPOS (Somente se houver parâmetros definidos) */}
            {selectedItem.parameters && selectedItem.parameters.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold font-mono text-[#eab308] uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#eab308]" />
                  Parâmetros e Tipos de Entrada
                </h3>

                <div className="overflow-x-auto border border-[#23252a] rounded-[8px] bg-[#161718]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#08090a] border-b border-[#23252a] text-[#8a8f98] font-mono text-[11px]">
                        <th className="p-2.5 font-bold">Parâmetro</th>
                        <th className="p-2.5 font-bold">Tipo</th>
                        <th className="p-2.5 font-bold">Obrigatório</th>
                        <th className="p-2.5 font-bold">Valores Aceitos</th>
                        <th className="p-2.5 font-bold">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#23252a] text-[#d0d6e0] font-sans">
                      {selectedItem.parameters.map((param, i) => (
                        <tr key={i} className="hover:bg-[#08090a]/50">
                          <td className="p-2.5 font-mono font-bold text-[#ffffff]">{param.name}</td>
                          <td className="p-2.5 font-mono text-[#02b8cc]">{param.type}</td>
                          <td className="p-2.5 font-mono">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${param.required ? 'bg-[#eb5757]/15 text-[#eb5757]' : 'bg-[#8a8f98]/15 text-[#8a8f98]'}`}>
                              {param.required ? 'SIM' : 'OPCIONAL'}
                            </span>
                          </td>
                          <td className="p-2.5 font-mono text-[11px] text-[#eab308]">
                            {param.allowedValues ? param.allowedValues.join(', ') : 'Qualquer valor válido'}
                          </td>
                          <td className="p-2.5 text-[#a0a6b0]">{param.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PILAR: RETORNO E SAÍDA ESPERADA (Somente se houver retorno definido) */}
            {selectedItem.returns && selectedItem.returns.type !== 'conceito' && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold font-mono text-[#ec4899] uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-[#ec4899]" />
                  Retorno e Saída Esperada
                </h3>
                <div className="p-3.5 bg-[#161718] border border-[#23252a] rounded-[8px] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#ffffff]">Tipo do Retorno:</span>
                    <span className="px-2 py-0.5 bg-[#ec4899]/15 text-[#ec4899] border border-[#ec4899]/30 rounded font-mono text-xs font-bold">
                      {selectedItem.returns.type}
                    </span>
                  </div>
                  <p className="text-xs text-[#d0d6e0] font-sans leading-relaxed">
                    <strong>Efeito no Mundo:</strong> {selectedItem.returns.description}
                  </p>
                  {selectedItem.expectedOutput && (
                    <div className="p-2 bg-[#08090a] rounded border border-[#23252a] text-[11px] font-mono text-[#27a644]">
                      Resultado em tela: {selectedItem.expectedOutput}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PILAR: USABILIDADE E CASOS DE USO (Somente se houver notas) */}
            {selectedItem.usabilityNotes && selectedItem.usabilityNotes.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold font-mono text-[#8b5cf6] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#8b5cf6]" />
                  Usabilidade & Casos de Uso Práticos
                </h3>
                <div className="p-3.5 bg-[#161718] border border-[#23252a] rounded-[8px] space-y-1.5">
                  <ul className="list-disc list-inside text-xs text-[#d0d6e0] space-y-1.5 font-sans leading-relaxed">
                    {selectedItem.usabilityNotes.map((note, i) => (
                      <li key={i} className="leading-snug">{note}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* PILAR: EXEMPLO PRÁTICO EXECUTÁVEL (Somente se houver código de exemplo) */}
            {selectedItem.exampleCode && selectedItem.exampleCode.trim().length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold font-mono text-[#27a644] uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-[#27a644]" />
                    Exemplo Prático de Script
                  </h3>

                  {/* Code Language Switcher */}
                  <div className="flex items-center gap-1 bg-[#08090a] border border-[#23252a] p-0.5 rounded">
                    <button
                      onClick={() => setActiveCodeLang('python')}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                        activeCodeLang === 'python' ? 'bg-[#27a644] text-white' : 'text-[#8a8f98] hover:text-[#ffffff]'
                      }`}
                    >
                      Python
                    </button>
                    <button
                      onClick={() => setActiveCodeLang('javascript')}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                        activeCodeLang === 'javascript' ? 'bg-[#eab308] text-black' : 'text-[#8a8f98] hover:text-[#ffffff]'
                      }`}
                    >
                      JavaScript
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-[#08090a] border border-[#23252a] rounded-[8px] relative group space-y-2">
                  <div className="flex items-center justify-between border-b border-[#23252a] pb-2 text-[11px] font-mono text-[#8a8f98]">
                    <span>Script Prático ({activeCodeLang === 'python' ? 'Python' : 'JavaScript'})</span>
                    <button 
                      onClick={() => copyCode(selectedItem.exampleCode)}
                      className="flex items-center gap-1 px-2 py-1 bg-[#161718] hover:bg-[#23252a] text-[#ffffff] rounded border border-[#23252a] text-xs transition-all active:scale-95"
                      title="Copiar código para o clipboard"
                    >
                      {copiedSnippet === selectedItem.exampleCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#27a644]" />
                          <span className="text-[#27a644]">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#8a8f98]" />
                          <span>Copiar Código</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-3 bg-[#161718] rounded border border-[#23252a] text-xs font-mono text-[#27a644] leading-relaxed overflow-x-auto">
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
              <div className="space-y-2 pt-2 border-t border-[#23252a]">
                <h3 className="text-xs font-bold font-mono text-[#8a8f98] uppercase tracking-wider flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-[#27a644]" />
                  Vínculo na Árvore de Tecnologias
                </h3>

                <div className="p-3.5 bg-[#161718] border border-[#23252a] rounded-[8px] flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#ffffff] font-mono">{selectedTechNode.name}</span>
                      <span className="text-[10px] font-mono text-[#8a8f98]">({selectedTechNode.id})</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#08090a] border border-[#23252a] text-[#27a644]">
                        Nível {selectedTechNode.tier}
                      </span>
                    </div>
                    <p className="text-xs text-[#a0a6b0] font-sans">{selectedTechNode.description}</p>
                  </div>

                  {onNavigateToTab && (
                    <button
                      onClick={() => onNavigateToTab('research')}
                      className="px-3 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shrink-0 border border-[#3fb950]/30 active:scale-95"
                    >
                      <FlaskConical className="w-3.5 h-3.5" />
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
