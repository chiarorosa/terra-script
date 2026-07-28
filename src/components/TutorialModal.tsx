import React, { useState } from 'react';
import { 
  BookOpen, 
  Cpu, 
  Sparkles, 
  Terminal, 
  CheckCircle2, 
  Lock, 
  Code, 
  ArrowRight, 
  Copy, 
  Check, 
  Filter, 
  Sprout, 
  TreePine, 
  Compass, 
  Layers,
  Grid,
  Bot,
  Zap,
  Droplets,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';
import { VirtualFS } from '../engine/virtualFs';
import { API_CATALOG, isTechUnlocked, getTechForApiItem, ApiItem } from '../engine/techApiMap';
import { TechBranch, TechNode } from '../types/game';

interface TutorialModalProps {
  engine: GameEngine;
  vfs?: VirtualFS;
  onNavigateToTab?: (tab: 'workspace' | 'research' | 'agents' | 'tutorial') => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ engine, onNavigateToTab }) => {
  const techTree = engine.getTechTree();
  const [activeGuideTab, setActiveGuideTab] = useState<'matrix' | 'farm' | 'world' | 'syntax' | 'mechanics'>('matrix');
  const [filterMode, setFilterMode] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const totalTech = techTree.length;
  const unlockedTechCount = techTree.filter(t => t.unlocked).length;
  const unlockPercentage = Math.round((unlockedTechCount / totalTech) * 100);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSnippet(code);
    setTimeout(() => setCopiedSnippet(null), 1500);
  };

  const isUnlocked = (techId: string) => isTechUnlocked(techId, techTree);

  // Group tech tree nodes by branch
  const techByBranch: Record<TechBranch, TechNode[]> = {
    AUTOMATION: techTree.filter(t => t.branch === 'AUTOMATION'),
    AGRONOMY: techTree.filter(t => t.branch === 'AGRONOMY'),
    SYSTEMS: techTree.filter(t => t.branch === 'SYSTEMS'),
    SCALE: techTree.filter(t => t.branch === 'SCALE'),
  };

  // Associated details and code for each tech node
  const getTechUnlockDetails = (node: TechNode) => {
    switch (node.id) {
      // AUTOMATION
      case 'AUTO_1':
        return {
          capabilities: ['Execução sequencial de código linha a linha', 'Movimento básico: world.move("EAST")', 'Verificação básica de obstáculo: world.can_move("EAST")', 'Reset de bloco: world.clear()'],
          snippet: 'farm.harvest()\nworld.move("EAST")'
        };
      case 'AUTO_2':
        return {
          capabilities: ['Atribuição de variáveis (x = 10, y = 20)', 'Operadores aritméticos (+, -, *, /, %)', 'Armazenamento de coordenadas e contadores'],
          snippet: 'x = world.x()\ny = world.y()\nnext_x = x + 1'
        };
      case 'AUTO_3':
        return {
          capabilities: ['Lógica condicional: if ... else', 'Avaliação de estado e tomada de decisão'],
          snippet: 'if farm.can_harvest():\n    farm.harvest()\nelse:\n    farm.plant("WILD_FIBER")'
        };
      case 'AUTO_4':
        return {
          capabilities: ['Estruturas de laço: while / for', 'Laços de automação contínua (while True:)'],
          snippet: 'while True:\n    if farm.can_harvest():\n        farm.harvest()\n    world.move("EAST")'
        };
      case 'AUTO_5':
        return {
          capabilities: ['Definição de funções: def minha_func() / function minhaFunc()', 'Procedimentos de código modulares e reutilizáveis'],
          snippet: 'def harvest_tile():\n    if farm.can_harvest():\n        farm.harvest()\n    world.move("EAST")'
        };
      case 'AUTO_6':
        return {
          capabilities: [
            'Barramento de Comunicação Inter-Drones (IPC)',
            'Envio de sinais e mensagens entre robôs: sys.send(drone_id, msg)',
            'Sincronização de tarefas coordenadas em tempo real'
          ],
          snippet: '# Drone 1 notifica o Drone 2 quando concluir a linha:\nif farm.can_harvest():\n    farm.harvest()\nsys.send(2, "ROW_COMPLETED")'
        };

      // AGRONOMY
      case 'AGRO_1':
        return {
          capabilities: ['Colher fibras selvagens', 'Plantar fibra selvagem: farm.plant("WILD_FIBER")', 'Irrigação do Solo: farm.water()', 'Verificação de colheita: farm.can_harvest()'],
          snippet: 'if farm.can_harvest():\n    farm.harvest()\nelse:\n    farm.water()'
        };
      case 'AGRO_2':
        return {
          capabilities: ['Plantar Arbusto de Madeira: farm.plant("WOODY_BUSH")', 'Gera o recurso Madeira necessário para pesquisas Nível 2+'],
          snippet: 'farm.plant("WOODY_BUSH")'
        };
      case 'AGRO_3':
        return {
          capabilities: ['Arar solo natural para cultivo: farm.till()', 'Irrigar solo: farm.water()', 'Plantar Raízes Cultivadas: farm.plant("CULTIVATED_ROOT")', 'Solo arado triplica a taxa de crescimento!'],
          snippet: 'if world.ground() == "NATURAL":\n    farm.till()\nfarm.plant("CULTIVATED_ROOT")'
        };
      case 'AGRO_4':
        return {
          capabilities: ['Plantar Árvores: farm.plant("TREE")', 'Rendimento de madeira para pesquisas avançadas', 'Otimização em xadrez: plante árvores sem vizinhos adjacentes para crescimento mais rápido'],
          snippet: 'if (world.x() + world.y()) % 2 == 0:\n    farm.plant("TREE")'
        };
      case 'AGRO_5':
        return {
          capabilities: ['Plantar Colônias de Frutas: farm.plant("FRUIT_COLONY")', 'Grupos de frutas maduras conectadas geram recompensas multiplicadas de Fruta'],
          snippet: 'farm.plant("FRUIT_COLONY")'
        };
      case 'AGRO_6':
        return {
          capabilities: ['Plantar Flores de Energia: farm.plant("ENERGY_FLOWER")', 'Medir o valor de energia do bloco com world.measure()', 'Colher quando a energia atingir o pico (> 50)'],
          snippet: 'farm.plant("ENERGY_FLOWER")\nif world.measure() > 50:\n    farm.harvest()'
        };
      case 'AGRO_7':
        return {
          capabilities: ['Plantar Plantas com Nota: farm.plant("GRADED_PLANT")', 'Trocar blocos de cultivo com vizinho: farm.swap("EAST")', 'Executar algoritmos de ordenação (ex: Bubble Sort) para ordenar fileiras para Máxima Biomassa'],
          snippet: 'if world.measure() > next_grade:\n    farm.swap("EAST")'
        };
      case 'AGRO_8':
        return {
          capabilities: ['Geração de Labirinto Vivo e núcleo de cristal', 'Verificar núcleo do labirinto: world.is_maze_core()', 'Inspecionar cultura companheira: farm.get_companion()'],
          snippet: 'if world.is_maze_core():\n    farm.harvest()'
        };

      // SYSTEMS
      case 'SYS_1':
        return {
          capabilities: ['Imprimir mensagens no stdout: print(...) ou console.log(...)', 'Visualizar logs de execução no console do Painel Inferior'],
          snippet: 'print("Drone ativo em", world.x(), world.y())'
        };
      case 'SYS_2':
        return {
          capabilities: ['Sensores de posição: world.x(), world.y()', 'Sensores de dimensão da grade: world.width(), world.height()', 'Inspeção do solo: world.ground()', 'Inspeção da cultura: world.entity()', 'Contagem de inventário: inventory.count("fiber")'],
          snippet: 'if world.ground() == "NATURAL":\n    farm.till()'
        };
      case 'SYS_3':
        return {
          capabilities: ['Sensor numérico de bloco: world.measure()', 'Lê níveis de energia em flores e valores de nota em plantas graduadas'],
          snippet: 'val = world.measure()'
        };
      case 'SYS_4':
        return {
          capabilities: ['Depurador Interativo de Passos', 'F9 para alternar pontos de interrupção (breakpoints)', 'F10 para avançar linha a linha no código'],
          snippet: '# Clique na margem ou pressione F9 na linha para definir breakpoint'
        };
      case 'SYS_5':
        return {
          capabilities: ['Métricas de Desempenho', 'Acompanhe ticks executados e ações realizadas por minuto'],
          snippet: '# Métricas ativas no Painel Inferior'
        };

      // SCALE
      case 'SCALE_1':
        return { capabilities: ['Terreno Inicial 1x1'], snippet: '# Tamanho da Grade: 1x1' };
      case 'SCALE_2':
        return { capabilities: ['Expandir terreno para faixa horizontal 1x3 (3 blocos)'], snippet: '# Tamanho da Grade: 1x3' };
      case 'SCALE_3':
        return { capabilities: ['Expandir terreno para matriz 2D 3x3 (9 blocos)'], snippet: '# Tamanho da Grade: 3x3' };
      case 'SCALE_4':
        return { capabilities: ['Expandir terreno para zona agrícola 5x5 (25 blocos)'], snippet: '# Tamanho da Grade: 5x5' };
      case 'SCALE_5':
        return { capabilities: ['Desbloquear Drone #2 (Gepeto)', 'Implantar múltiplos drones simultaneamente na grade'], snippet: '# Drones Ativos: 2 (Claudio & Gepeto)' };
      case 'SCALE_6':
        return { capabilities: ['Expandir terreno para grade industrial 7x7 (49 blocos)'], snippet: '# Tamanho da Grade: 7x7' };
      case 'SCALE_7':
        return { capabilities: ['Expandir terreno para matriz complexa 9x9 (81 blocos)'], snippet: '# Tamanho da Grade: 9x9' };
      case 'SCALE_8':
        return { capabilities: ['Desbloquear Drone #3 (Gemilson)', 'Ativar 3 drones operando em paralelo na fazenda'], snippet: '# Drones Ativos: 3 (Claudio, Gepeto & Gemilson)' };
      case 'SCALE_9':
        return { capabilities: ['Expandir terreno para mega lote 12x12 (144 blocos)'], snippet: '# Tamanho da Grade: 12x12' };

      default:
        return { capabilities: [node.description], snippet: '' };
    }
  };

  // Filter API items
  const filteredApis = API_CATALOG.filter(item => {
    const unlocked = isUnlocked(item.techId);
    if (filterMode === 'unlocked') return unlocked;
    if (filterMode === 'locked') return !unlocked;
    return true;
  });

  const farmApis = filteredApis.filter(a => a.namespace === 'farm');
  const worldApis = filteredApis.filter(a => a.namespace === 'world');
  const syntaxApis = filteredApis.filter(a => a.namespace === 'syntax');

  return (
    <div className="flex-1 bg-[#0d1117] p-6 overflow-y-auto font-sans text-[#c9d1d9] select-none">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Title & Research Progress Bar */}
        <div className="border-b border-[#30363d] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#f0f6fc] flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-[#3fb950]" />
              TerraScript 3D - Guia de Pesquisas e Funcionalidades
            </h1>
            <p className="text-xs text-[#8b949e] mt-1">
              Referência completa do que cada <strong>DESBLOQUEIO DE PESQUISA</strong> habilita em seu interpretador e no mundo da fazenda!
            </p>
          </div>

          {/* Research Progress Widget */}
          <div className="bg-[#161b22] border border-[#30363d] p-3 rounded-lg flex items-center gap-4 shrink-0">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#8b949e] font-semibold">Pesquisas Desbloqueadas:</span>
                <span className="text-[#3fb950] font-bold ml-2">{unlockedTechCount} / {totalTech} ({unlockPercentage}%)</span>
              </div>
              <div className="w-48 h-2 bg-[#010409] rounded-full overflow-hidden border border-[#30363d]">
                <div 
                  className="h-full bg-gradient-to-r from-[#238636] to-[#3fb950] transition-all duration-500" 
                  style={{ width: `${unlockPercentage}%` }}
                />
              </div>
            </div>

            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('research')}
                className="px-3 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0 border border-[#3fb950]/30"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Árvore de Pesquisa
              </button>
            )}
          </div>
        </div>

        {/* Main Category Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#30363d] pb-3">
          <button
            onClick={() => setActiveGuideTab('matrix')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold transition-all ${
              activeGuideTab === 'matrix' 
                ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm' 
                : 'bg-[#161b22]/60 text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d]'
            }`}
          >
            <Zap className="w-4 h-4 text-[#3fb950]" />
            Matriz de Desbloqueios
          </button>

          <button
            onClick={() => setActiveGuideTab('farm')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold transition-all ${
              activeGuideTab === 'farm' 
                ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm' 
                : 'bg-[#161b22]/60 text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d]'
            }`}
          >
            <Sprout className="w-4 h-4 text-[#3fb950]" />
            API da Fazenda (<code className="text-[#3fb950]">farm.*</code>)
          </button>

          <button
            onClick={() => setActiveGuideTab('world')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold transition-all ${
              activeGuideTab === 'world' 
                ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm' 
                : 'bg-[#161b22]/60 text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d]'
            }`}
          >
            <Compass className="w-4 h-4 text-[#58a6ff]" />
            Mundo e Sensores (<code className="text-[#58a6ff]">world.*</code>)
          </button>

          <button
            onClick={() => setActiveGuideTab('syntax')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold transition-all ${
              activeGuideTab === 'syntax' 
                ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm' 
                : 'bg-[#161b22]/60 text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d]'
            }`}
          >
            <Code className="w-4 h-4 text-[#bc8cff]" />
            Linguagem e Sintaxe
          </button>

          <button
            onClick={() => setActiveGuideTab('mechanics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold transition-all ${
              activeGuideTab === 'mechanics' 
                ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm' 
                : 'bg-[#161b22]/60 text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d]'
            }`}
          >
            <Sprout className="w-4 h-4 text-emerald-400" />
            Mecânicas de Crescimento
          </button>
        </div>

        {/* TAB 1: RESEARCH UNLOCKS MATRIX */}
        {activeGuideTab === 'matrix' && (
          <div className="space-y-6">
            
            {/* AUTOMATION BRANCH */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
                <h2 className="font-bold text-sm text-[#bc8cff] flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  RAMO DE AUTOMAÇÃO — Controle de Programação e Recursos do Interpretador
                </h2>
                <span className="text-xs font-mono text-[#bc8cff]">
                  {techByBranch.AUTOMATION.filter(t => t.unlocked).length} / {techByBranch.AUTOMATION.length} Desbloqueados
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {techByBranch.AUTOMATION.map(node => {
                  const details = getTechUnlockDetails(node);
                  return (
                    <div 
                      key={node.id} 
                      className={`p-4 rounded-xl border transition-all ${
                        node.unlocked 
                          ? 'bg-[#010409] border-[#bc8cff]/40 text-[#f0f6fc] shadow-sm' 
                          : 'bg-[#010409]/50 border-[#30363d] text-[#8b949e] opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-[#bc8cff] flex items-center gap-1.5">
                          {node.unlocked ? <CheckCircle2 className="w-4 h-4 text-[#bc8cff]" /> : <Lock className="w-4 h-4 text-[#d29922]" />}
                          {node.name} <span className="text-[10px] text-[#8b949e] font-mono">({node.id})</span>
                        </span>
                        <span className={`text-[10px] font-sans px-2 py-0.5 rounded font-bold ${
                          node.unlocked ? 'bg-[#bc8cff]/15 text-[#bc8cff] border border-[#bc8cff]/30' : 'bg-[#d29922]/15 text-[#d29922] border border-[#d29922]/30'
                        }`}>
                          {node.unlocked ? 'DESBLOQUEADO' : `Nível ${node.tier}`}
                        </span>
                      </div>

                      <p className="text-xs text-[#c9d1d9] mb-2 font-sans leading-relaxed">{node.description}</p>

                      <div className="space-y-1 mb-3">
                        <div className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider font-mono">Recursos Desbloqueados:</div>
                        <ul className="list-disc list-inside text-xs text-[#c9d1d9] space-y-1 font-sans">
                          {details.capabilities.map((cap, i) => (
                            <li key={i} className="leading-snug">{cap}</li>
                          ))}
                        </ul>
                      </div>

                      {details.snippet && (
                        <div className="bg-[#0d1117] p-2.5 rounded border border-[#30363d] flex items-center justify-between group">
                          <code className="text-xs font-mono text-[#bc8cff] whitespace-pre leading-relaxed">{details.snippet}</code>
                          {node.unlocked && (
                            <button 
                              onClick={() => copyCode(details.snippet)}
                              className="p-1.5 hover:bg-[#21262d] rounded text-[#8b949e] hover:text-[#f0f6fc] transition-all opacity-0 group-hover:opacity-100 shrink-0"
                              title="Copiar código"
                            >
                              {copiedSnippet === details.snippet ? <Check className="w-4 h-4 text-[#3fb950]" /> : <Copy className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* AGRONOMY BRANCH */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
                <h2 className="font-bold text-sm text-[#3fb950] flex items-center gap-2">
                  <Sprout className="w-4 h-4" />
                  RAMO DE AGRONOMIA — Culturas, Preparo do Solo e Mecânicas de Cultivo
                </h2>
                <span className="text-xs font-mono text-[#3fb950]">
                  {techByBranch.AGRONOMY.filter(t => t.unlocked).length} / {techByBranch.AGRONOMY.length} Desbloqueados
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {techByBranch.AGRONOMY.map(node => {
                  const details = getTechUnlockDetails(node);
                  return (
                    <div 
                      key={node.id} 
                      className={`p-4 rounded-xl border transition-all ${
                        node.unlocked 
                          ? 'bg-[#010409] border-[#3fb950]/40 text-[#f0f6fc] shadow-sm' 
                          : 'bg-[#010409]/50 border-[#30363d] text-[#8b949e] opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-[#3fb950] flex items-center gap-1.5">
                          {node.unlocked ? <CheckCircle2 className="w-4 h-4 text-[#3fb950]" /> : <Lock className="w-4 h-4 text-[#d29922]" />}
                          {node.name} <span className="text-[10px] text-[#8b949e] font-mono">({node.id})</span>
                        </span>
                        <span className={`text-[10px] font-sans px-2 py-0.5 rounded font-bold ${
                          node.unlocked ? 'bg-[#3fb950]/15 text-[#3fb950] border border-[#3fb950]/30' : 'bg-[#d29922]/15 text-[#d29922] border border-[#d29922]/30'
                        }`}>
                          {node.unlocked ? 'DESBLOQUEADO' : `Nível ${node.tier}`}
                        </span>
                      </div>

                      <p className="text-xs text-[#c9d1d9] mb-2 font-sans leading-relaxed">{node.description}</p>

                      <div className="space-y-1 mb-3">
                        <div className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider font-mono">Recursos Desbloqueados:</div>
                        <ul className="list-disc list-inside text-xs text-[#c9d1d9] space-y-1 font-sans">
                          {details.capabilities.map((cap, i) => (
                            <li key={i} className="leading-snug">{cap}</li>
                          ))}
                        </ul>
                      </div>

                      {details.snippet && (
                        <div className="bg-[#0d1117] p-2.5 rounded border border-[#30363d] flex items-center justify-between group">
                          <code className="text-xs font-mono text-[#3fb950] whitespace-pre leading-relaxed">{details.snippet}</code>
                          {node.unlocked && (
                            <button 
                              onClick={() => copyCode(details.snippet)}
                              className="p-1.5 hover:bg-[#21262d] rounded text-[#8b949e] hover:text-[#f0f6fc] transition-all opacity-0 group-hover:opacity-100 shrink-0"
                              title="Copiar código"
                            >
                              {copiedSnippet === details.snippet ? <Check className="w-4 h-4 text-[#3fb950]" /> : <Copy className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SYSTEMS BRANCH */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
                <h2 className="font-bold text-sm text-[#58a6ff] flex items-center gap-2">
                  <Compass className="w-4 h-4" />
                  RAMO DE SISTEMAS — Sensores, Logs de Terminal e Ferramentas de Depuração
                </h2>
                <span className="text-xs font-mono text-[#58a6ff]">
                  {techByBranch.SYSTEMS.filter(t => t.unlocked).length} / {techByBranch.SYSTEMS.length} Desbloqueados
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {techByBranch.SYSTEMS.map(node => {
                  const details = getTechUnlockDetails(node);
                  return (
                    <div 
                      key={node.id} 
                      className={`p-4 rounded-xl border transition-all ${
                        node.unlocked 
                          ? 'bg-[#010409] border-[#58a6ff]/40 text-[#f0f6fc] shadow-sm' 
                          : 'bg-[#010409]/50 border-[#30363d] text-[#8b949e] opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-[#58a6ff] flex items-center gap-1.5">
                          {node.unlocked ? <CheckCircle2 className="w-4 h-4 text-[#58a6ff]" /> : <Lock className="w-4 h-4 text-[#d29922]" />}
                          {node.name} <span className="text-[10px] text-[#8b949e] font-mono">({node.id})</span>
                        </span>
                        <span className={`text-[10px] font-sans px-2 py-0.5 rounded font-bold ${
                          node.unlocked ? 'bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/30' : 'bg-[#d29922]/15 text-[#d29922] border border-[#d29922]/30'
                        }`}>
                          {node.unlocked ? 'DESBLOQUEADO' : `Nível ${node.tier}`}
                        </span>
                      </div>

                      <p className="text-xs text-[#c9d1d9] mb-2 font-sans leading-relaxed">{node.description}</p>

                      <div className="space-y-1 mb-3">
                        <div className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider font-mono">Recursos Desbloqueados:</div>
                        <ul className="list-disc list-inside text-xs text-[#c9d1d9] space-y-1 font-sans">
                          {details.capabilities.map((cap, i) => (
                            <li key={i} className="leading-snug">{cap}</li>
                          ))}
                        </ul>
                      </div>

                      {details.snippet && (
                        <div className="bg-[#0d1117] p-2.5 rounded border border-[#30363d] flex items-center justify-between group">
                          <code className="text-xs font-mono text-[#58a6ff] whitespace-pre leading-relaxed">{details.snippet}</code>
                          {node.unlocked && (
                            <button 
                              onClick={() => copyCode(details.snippet)}
                              className="p-1.5 hover:bg-[#21262d] rounded text-[#8b949e] hover:text-[#f0f6fc] transition-all opacity-0 group-hover:opacity-100 shrink-0"
                              title="Copiar código"
                            >
                              {copiedSnippet === details.snippet ? <Check className="w-4 h-4 text-[#3fb950]" /> : <Copy className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SCALE BRANCH */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
                <h2 className="font-bold text-sm text-[#d29922] flex items-center gap-2">
                  <Grid className="w-4 h-4" />
                  RAMO DE ESCALA — Expansão de Terreno e Frota de Drones
                </h2>
                <span className="text-xs font-mono text-[#d29922]">
                  {techByBranch.SCALE.filter(t => t.unlocked).length} / {techByBranch.SCALE.length} Desbloqueados
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {techByBranch.SCALE.map(node => {
                  const details = getTechUnlockDetails(node);
                  return (
                    <div 
                      key={node.id} 
                      className={`p-4 rounded-xl border transition-all ${
                        node.unlocked 
                          ? 'bg-[#010409] border-[#d29922]/40 text-[#f0f6fc] shadow-sm' 
                          : 'bg-[#010409]/50 border-[#30363d] text-[#8b949e] opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-[#d29922] flex items-center gap-1.5">
                          {node.unlocked ? <CheckCircle2 className="w-4 h-4 text-[#d29922]" /> : <Lock className="w-4 h-4 text-[#d29922]" />}
                          {node.name} <span className="text-[10px] text-[#8b949e] font-mono">({node.id})</span>
                        </span>
                        <span className={`text-[10px] font-sans px-2 py-0.5 rounded font-bold ${
                          node.unlocked ? 'bg-[#d29922]/15 text-[#d29922] border border-[#d29922]/30' : 'bg-[#d29922]/10 text-[#d29922] border border-[#d29922]/20'
                        }`}>
                          {node.unlocked ? 'DESBLOQUEADO' : `Nível ${node.tier}`}
                        </span>
                      </div>

                      <p className="text-xs text-[#c9d1d9] mb-2 font-sans leading-relaxed">{node.description}</p>

                      <div className="space-y-1 mb-2">
                        <div className="text-[11px] font-semibold text-[#8b949e] uppercase tracking-wider font-mono">Recursos Desbloqueados:</div>
                        <ul className="list-disc list-inside text-xs text-[#c9d1d9] space-y-1 font-sans">
                          {details.capabilities.map((cap, i) => (
                            <li key={i} className="leading-snug">{cap}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: FARM API */}
        {activeGuideTab === 'farm' && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
              <h2 className="font-bold text-sm text-[#3fb950] flex items-center gap-2">
                <Sprout className="w-4 h-4" />
                Comandos da Fazenda (<code className="text-[#3fb950]">farm.*</code>)
              </h2>
              <span className="text-xs text-[#8b949e] font-mono">
                {farmApis.filter(a => isUnlocked(a.techId)).length} / {farmApis.length} Desbloqueados
              </span>
            </div>

            {/* Growth Notice Callout */}
            <div className="bg-[#3fb950]/10 border border-[#3fb950]/30 p-3 rounded-lg flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3fb950] shrink-0" />
                <span className="text-[#f0f6fc] font-sans">
                  <strong>Regra de Colheita:</strong> A colheita com <code className="text-[#3fb950] font-mono">farm.harvest()</code> exige <strong>100% de crescimento</strong> no bloco.
                </span>
              </div>
              <button 
                onClick={() => setActiveGuideTab('mechanics')}
                className="text-[11px] font-bold text-[#3fb950] hover:underline shrink-0"
              >
                Ver Mecânicas →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {farmApis.map(api => {
                const unlocked = isUnlocked(api.techId);
                const techNode = getTechForApiItem(api.techId, techTree);

                return (
                  <div 
                    key={api.id}
                    className={`p-4 rounded-xl border text-xs font-mono transition-all ${
                      unlocked 
                        ? 'bg-[#010409] border-[#3fb950]/40 text-[#f0f6fc]' 
                        : 'bg-[#010409]/50 border-[#30363d] text-[#8b949e] opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[#3fb950] flex items-center gap-1.5 text-xs">
                        {unlocked ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#3fb950]" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-[#d29922]" />
                        )}
                        {api.displayText}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-sans font-bold ${
                        unlocked ? 'bg-[#3fb950]/15 text-[#3fb950] border border-[#3fb950]/30' : 'bg-[#d29922]/15 text-[#d29922] border border-[#d29922]/30'
                      }`}>
                        {unlocked ? 'DESBLOQUEADO' : `Req: ${techNode?.name || api.techId}`}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-[#3fb950] mb-2 bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]">
                      <span className="text-[#8b949e] font-sans font-semibold mr-1">Sintaxe:</span>
                      <code>{api.signature}</code>
                    </div>

                    <p className="text-xs font-sans text-[#c9d1d9] mb-3 leading-relaxed">{api.docDetail}</p>

                    <div className="bg-[#0d1117] p-2.5 rounded border border-[#30363d] flex items-center justify-between group">
                      <code className="text-xs text-[#3fb950]">{api.exampleCode}</code>
                      {unlocked && (
                        <button 
                          onClick={() => copyCode(api.exampleCode)}
                          className="p-1 hover:bg-[#21262d] rounded text-[#8b949e] hover:text-[#f0f6fc] transition-all opacity-0 group-hover:opacity-100"
                          title="Copiar código"
                        >
                          {copiedSnippet === api.exampleCode ? <Check className="w-3.5 h-3.5 text-[#3fb950]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: WORLD & SENSORS */}
        {activeGuideTab === 'world' && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
              <h2 className="font-bold text-sm text-[#58a6ff] flex items-center gap-2">
                <Compass className="w-4 h-4" />
                API de Mundo e Sensores (<code className="text-[#58a6ff]">world.*</code>)
              </h2>
              <span className="text-xs text-[#8b949e] font-mono">
                {worldApis.filter(a => isUnlocked(a.techId)).length} / {worldApis.length} Desbloqueados
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {worldApis.map(api => {
                const unlocked = isUnlocked(api.techId);
                const techNode = getTechForApiItem(api.techId, techTree);

                return (
                  <div 
                    key={api.id}
                    className={`p-4 rounded-xl border text-xs font-mono transition-all ${
                      unlocked 
                        ? 'bg-[#010409] border-[#58a6ff]/40 text-[#f0f6fc]' 
                        : 'bg-[#010409]/50 border-[#30363d] text-[#8b949e] opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[#58a6ff] flex items-center gap-1.5 text-xs">
                        {unlocked ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#58a6ff]" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-[#d29922]" />
                        )}
                        {api.displayText}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-sans font-bold ${
                        unlocked ? 'bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/30' : 'bg-[#d29922]/15 text-[#d29922] border border-[#d29922]/30'
                      }`}>
                        {unlocked ? 'DESBLOQUEADO' : `Req: ${techNode?.name || api.techId}`}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-[#58a6ff] mb-2 bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]">
                      <span className="text-[#8b949e] font-sans font-semibold mr-1">Sintaxe:</span>
                      <code>{api.signature}</code>
                    </div>

                    <p className="text-xs font-sans text-[#c9d1d9] mb-3 leading-relaxed">{api.docDetail}</p>

                    <div className="bg-[#0d1117] p-2.5 rounded border border-[#30363d] flex items-center justify-between group">
                      <code className="text-xs text-[#58a6ff]">{api.exampleCode}</code>
                      {unlocked && (
                        <button 
                          onClick={() => copyCode(api.exampleCode)}
                          className="p-1 hover:bg-[#21262d] rounded text-[#8b949e] hover:text-[#f0f6fc] transition-all opacity-0 group-hover:opacity-100"
                          title="Copiar código"
                        >
                          {copiedSnippet === api.exampleCode ? <Check className="w-3.5 h-3.5 text-[#3fb950]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: LANGUAGE & SYNTAX */}
        {activeGuideTab === 'syntax' && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
              <h2 className="font-bold text-sm text-[#bc8cff] flex items-center gap-2">
                <Code className="w-4 h-4" />
                Sintaxe e Estruturas da Linguagem
              </h2>
              <span className="text-xs text-[#8b949e] font-mono">
                {syntaxApis.filter(a => isUnlocked(a.techId)).length} / {syntaxApis.length} Desbloqueados
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {syntaxApis.map(syn => {
                const unlocked = isUnlocked(syn.techId);
                const techNode = getTechForApiItem(syn.techId, techTree);

                return (
                  <div 
                    key={syn.id} 
                    className={`p-4 rounded-xl border text-xs font-mono transition-all ${
                      unlocked 
                        ? 'bg-[#010409] border-[#bc8cff]/40 text-[#f0f6fc]' 
                        : 'bg-[#010409]/50 border-[#30363d] text-[#8b949e] opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[#bc8cff] flex items-center gap-1.5 text-xs">
                        {unlocked ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#bc8cff]" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-[#d29922]" />
                        )}
                        {syn.displayText}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-sans font-bold ${
                        unlocked ? 'bg-[#bc8cff]/15 text-[#bc8cff] border border-[#bc8cff]/30' : 'bg-[#d29922]/15 text-[#d29922] border border-[#d29922]/30'
                      }`}>
                        {unlocked ? 'Desbloqueado' : `Pesquisa: ${techNode?.name}`}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-[#bc8cff] mb-2 bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]">
                      <span className="text-[#8b949e] font-sans font-semibold mr-1">Sintaxe:</span>
                      <code>{syn.signature}</code>
                    </div>

                    <p className="text-xs font-sans text-[#c9d1d9] mb-3 leading-relaxed">{syn.description}</p>

                    <div className="bg-[#0d1117] p-2.5 rounded border border-[#30363d] flex items-center justify-between group">
                      <code className="text-xs text-[#bc8cff] whitespace-pre">{syn.exampleCode}</code>
                      {unlocked && (
                        <button 
                          onClick={() => copyCode(syn.exampleCode)}
                          className="p-1 hover:bg-[#21262d] rounded text-[#8b949e] hover:text-[#f0f6fc] transition-all opacity-0 group-hover:opacity-100"
                          title="Copiar código"
                        >
                          {copiedSnippet === syn.exampleCode ? <Check className="w-3.5 h-3.5 text-[#3fb950]" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: GROWTH & FARM MECHANICS */}
        {activeGuideTab === 'mechanics' && (
          <div className="space-y-6">
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
                <h2 className="font-bold text-base text-[#3fb950] flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-[#3fb950]" />
                  Mecânicas e Regras de Crescimento das Culturas
                </h2>
                <span className="text-xs bg-[#3fb950]/15 text-[#3fb950] border border-[#3fb950]/30 px-2.5 py-1 rounded font-bold">
                  Requisito de Colheita: 100%
                </span>
              </div>

              {/* Requirement Highlight Card */}
              <div className="bg-[#3fb950]/10 border border-[#3fb950]/30 p-4 rounded-xl flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#3fb950] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-[#3fb950] uppercase tracking-wide">Condição Obrigatória para Colheita</h3>
                  <p className="text-xs text-[#c9d1d9] leading-relaxed font-sans">
                    Para que a colheita seja realizada com sucesso utilizando <code className="text-[#3fb950] font-mono bg-[#0d1117] px-1 py-0.5 rounded border border-[#30363d]">farm.harvest()</code>, a cultura no bloco precisa atingir <strong>exatamente 100% de crescimento</strong>. A função <code className="text-[#3fb950] font-mono bg-[#0d1117] px-1 py-0.5 rounded border border-[#30363d]">farm.can_harvest()</code> retornará <code className="text-[#3fb950] font-mono">True</code> apenas quando o crescimento for de 100%.
                  </p>
                </div>
              </div>

              {/* Grid of Mechanics Factors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                
                <div className="bg-[#010409] p-4 rounded-xl border border-[#30363d] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#d29922]">
                    <Grid className="w-4 h-4 text-[#d29922]" />
                    1. Preparo do Solo (Arado vs. Natural)
                  </div>
                  <p className="text-xs text-[#c9d1d9] leading-relaxed">
                    Plantas em solo <strong>Arado (<code className="text-[#d29922]">farm.till()</code>)</strong> crescem significativamente mais rápido (<strong>duplica a taxa base de Raízes Cultivadas</strong>) em comparação com solo natural não preparado. Arar o solo é o fator principal para otimizar sua fazenda.
                  </p>
                </div>

                <div className="bg-[#010409] p-4 rounded-xl border border-[#30363d] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#58a6ff]">
                    <Compass className="w-4 h-4 text-[#58a6ff]" />
                    2. Irrigação, Umidade e Combinação com Arado (Till)
                  </div>
                  <p className="text-xs text-[#c9d1d9] leading-relaxed">
                    <strong>Combinação de Arado e Irrigação:</strong> Os comandos <code className="text-[#d29922] font-mono">farm.till()</code> e <code className="text-[#58a6ff] font-mono">farm.water()</code> <strong>se combinam perfeitamente</strong>! O arado define a preparação do solo para duplicar a taxa base de crescimento de Raízes Cultivadas, enquanto a irrigação eleva a umidade do solo para 100% (<code className="text-[#58a6ff] font-mono">moisture = 1.0</code>) para aplicar o acelerador de velocidade (+60%). Um solo arado e irrigado atinge a máxima produtividade possível do jogo.
                  </p>
                </div>

                <div className="bg-[#010409] p-4 rounded-xl border border-[#30363d] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#38d430]">
                    <Droplets className="w-4 h-4 text-[#38d430]" />
                    3. Consumo de Umidade e Evaporação Natural
                  </div>
                  <p className="text-xs text-[#c9d1d9] leading-relaxed">
                    • <strong>Absorção pelas Plantas:</strong> Durante o crescimento, a cultura absorve água do bloco (-0,3% de umidade/tick).<br/>
                    • <strong>Evaporação Natural:</strong> Solo desprovido de cultura e com alta umidade (&gt; 50%) evapora água gradualmente (-0,1%/tick).<br/>
                    • <strong>Consumo na Colheita:</strong> Colher uma planta consume imediatamente 25% (0,25) da umidade do bloco.
                  </p>
                </div>

                <div className="bg-[#010409] p-4 rounded-xl border border-[#30363d] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#e3b341]">
                    <RefreshCw className="w-4 h-4 text-[#e3b341]" />
                    4. Reversão Dinâmica do Solo Irrigado
                  </div>
                  <p className="text-xs text-[#c9d1d9] leading-relaxed">
                    Quando a umidade de um bloco irrigado diminui para <strong>&le; 25% (0.25)</strong> — seja por absorção do crescimento, evaporação ou colheita —, o solo perde o estado Irrigado (<code className="text-[#58a6ff] font-mono">IRRIGATED</code>) e <strong>reverte automaticamente para Solo Natural (<code className="text-[#3fb950] font-mono">NATURAL</code>)</strong>. Para mantê-lo irrigado, regue periodicamente com <code className="text-[#58a6ff] font-mono">farm.water()</code>.
                  </p>
                </div>

                <div className="bg-[#010409] p-4 rounded-xl border border-[#30363d] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#3fb950]">
                    <Zap className="w-4 h-4 text-[#3fb950]" />
                    5. Simulação em Ticks Finitos
                  </div>
                  <p className="text-xs text-[#c9d1d9] leading-relaxed">
                    A cada tick de ação ou ciclo contínuo do mundo, o mecanismo da fazenda atualiza todos os blocos simultaneamente. Variáveis de umidade e preparo do solo determinam o avanço de cada cultura a cada ciclo.
                  </p>
                </div>

              </div>

              {/* Comprehensive Crops, Soil & Adjacency Reference Table/Cards */}
              <div className="border-t border-[#30363d] pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#f0f6fc] flex items-center gap-2">
                    <Sprout className="w-4 h-4 text-[#3fb950]" />
                    Guia Detalhado de Culturas, Solo, Umidade e Adjacências
                  </h3>
                  <span className="text-[11px] font-mono text-[#8b949e]">7 Culturas Agrícolas</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">

                  {/* WILD_FIBER */}
                  <div className="bg-[#010409] p-4 rounded-xl border border-[#30363d] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs text-[#3fb950]">
                        <span className="text-base">🌾</span>
                        <span>Fibra Selvagem</span>
                        <code className="text-[10px] text-[#8b949e] font-mono">"WILD_FIBER"</code>
                      </div>
                      <span className="text-[10px] bg-[#3fb950]/15 text-[#3fb950] border border-[#3fb950]/30 px-2 py-0.5 rounded font-mono font-semibold">
                        Base: 5%/tick
                      </span>
                    </div>
                    <p className="text-xs text-[#c9d1d9] leading-relaxed">
                      Cultura silvestre inicial. Rebrota de forma espontânea e natural em qualquer solo não plantado (<code className="text-[#3fb950] font-mono">crop = "NONE"</code>).
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-[#0d1117] p-2 rounded border border-[#30363d]">
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Solo:</span>
                        <span className="text-[#f0f6fc]">Qualquer</span>
                      </div>
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Umidade:</span>
                        <span className="text-[#58a6ff]">&gt; 25%</span>
                      </div>
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Adjacência:</span>
                        <span className="text-[#3fb950]">Livre</span>
                      </div>
                    </div>
                  </div>

                  {/* WOODY_BUSH */}
                  <div className="bg-[#010409] p-4 rounded-xl border border-[#30363d] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs text-[#d29922]">
                        <span className="text-base">🌿</span>
                        <span>Arbusto de Madeira</span>
                        <code className="text-[10px] text-[#8b949e] font-mono">"WOODY_BUSH"</code>
                      </div>
                      <span className="text-[10px] bg-[#d29922]/15 text-[#d29922] border border-[#d29922]/30 px-2 py-0.5 rounded font-mono font-semibold">
                        Base: 3%/tick
                      </span>
                    </div>
                    <p className="text-xs text-[#c9d1d9] leading-relaxed">
                      Planta lenhosa resistente. Excelente fonte primária de madeira para construção e pesquisas Nível 2+.
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-[#0d1117] p-2 rounded border border-[#30363d]">
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Solo:</span>
                        <span className="text-[#f0f6fc]">Qualquer</span>
                      </div>
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Umidade:</span>
                        <span className="text-[#58a6ff]">&gt; 25%</span>
                      </div>
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Adjacência:</span>
                        <span className="text-[#3fb950]">Livre</span>
                      </div>
                    </div>
                  </div>

                  {/* CULTIVATED_ROOT */}
                  <div className="bg-[#010409] p-4 rounded-xl border border-[#30363d] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs text-[#e3b341]">
                        <span className="text-base">🥕</span>
                        <span>Raízes Cultivadas</span>
                        <code className="text-[10px] text-[#8b949e] font-mono">"CULTIVATED_ROOT"</code>
                      </div>
                      <span className="text-[10px] bg-[#e3b341]/15 text-[#e3b341] border border-[#e3b341]/30 px-2 py-0.5 rounded font-mono font-semibold">
                        Base: 4%/tick (Arado)
                      </span>
                    </div>
                    <p className="text-xs text-[#c9d1d9] leading-relaxed">
                      Exige preparação do terreno. Cresce <strong>duas vezes mais rápido (4%/tick)</strong> em solo Arado (<code className="text-[#d29922] font-mono">farm.till()</code>) do que em solo natural.
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-[#0d1117] p-2 rounded border border-[#30363d]">
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Solo Ideal:</span>
                        <span className="text-[#d29922]">Arado (TILLED)</span>
                      </div>
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Umidade:</span>
                        <span className="text-[#58a6ff]">&gt; 25%</span>
                      </div>
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Adjacência:</span>
                        <span className="text-[#3fb950]">Livre</span>
                      </div>
                    </div>
                  </div>

                  {/* TREE */}
                  <div className="bg-[#010409] p-4 rounded-xl border border-[#30363d] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs text-[#bc8cff]">
                        <span className="text-base">🌲</span>
                        <span>Árvore (Madeira Nobre)</span>
                        <code className="text-[10px] text-[#8b949e] font-mono">"TREE"</code>
                      </div>
                      <span className="text-[10px] bg-[#bc8cff]/15 text-[#bc8cff] border border-[#bc8cff]/30 px-2 py-0.5 rounded font-mono font-semibold">
                        Base: 2%/tick (Xadrez)
                      </span>
                    </div>
                    <p className="text-xs text-[#c9d1d9] leading-relaxed">
                      Possui regra de vizinhança: se houver outra árvore em um bloco adjacente (N, S, L, O), a taxa cai pela metade (1%/tick). Plante em <strong>padrão xadrez (padrão intercalado)</strong> para evitar competição por recursos.
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-[#0d1117] p-2 rounded border border-[#30363d]">
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Solo:</span>
                        <span className="text-[#f0f6fc]">Natural / Irrigado</span>
                      </div>
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Umidade:</span>
                        <span className="text-[#58a6ff]">&gt; 25%</span>
                      </div>
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Adjacência:</span>
                        <span className="text-[#f85149]">Evitar Vizinho</span>
                      </div>
                    </div>
                  </div>

                  {/* FRUIT_COLONY */}
                  <div className="bg-[#010409] p-4 rounded-xl border border-[#30363d] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs text-[#f85149]">
                        <span className="text-base">🍓</span>
                        <span>Colônia de Frutas</span>
                        <code className="text-[10px] text-[#8b949e] font-mono">"FRUIT_COLONY"</code>
                      </div>
                      <span className="text-[10px] bg-[#f85149]/15 text-[#f85149] border border-[#f85149]/30 px-2 py-0.5 rounded font-mono font-semibold">
                        Delicada (Umidade &ge; 75%)
                      </span>
                    </div>
                    <p className="text-xs text-[#c9d1d9] leading-relaxed">
                      Cultura de alta irrigação. Requer umidade alta (&ge; 75%) para crescer. Formar agrupamentos contínuos de frutas maduras gera multiplicadores na colheita.
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-[#0d1117] p-2 rounded border border-[#30363d]">
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Solo:</span>
                        <span className="text-[#58a6ff]">Irrigado (water)</span>
                      </div>
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Umidade Min:</span>
                        <span className="text-[#f85149] font-bold">&ge; 75%</span>
                      </div>
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Adjacência:</span>
                        <span className="text-[#3fb950]">Colônias</span>
                      </div>
                    </div>
                  </div>

                  {/* ENERGY_FLOWER */}
                  <div className="bg-[#010409] p-4 rounded-xl border border-[#30363d] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-[#a5d6ff] text-xs">
                        <span className="text-base">⚡</span>
                        <span>Flor de Energia</span>
                        <code className="text-[10px] text-[#8b949e] font-mono">"ENERGY_FLOWER"</code>
                      </div>
                      <span className="text-[10px] bg-[#a5d6ff]/15 text-[#a5d6ff] border border-[#a5d6ff]/30 px-2 py-0.5 rounded font-mono font-semibold">
                        Delicada (Umidade &ge; 75%)
                      </span>
                    </div>
                    <p className="text-xs text-[#c9d1d9] leading-relaxed">
                      Gera energia elétrica. Requer umidade alta (&ge; 75%). Utilize <code className="text-[#58a6ff] font-mono">world.measure()</code> para ler o acúmulo de energia e colher no valor de pico (&gt; 50).
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-[#0d1117] p-2 rounded border border-[#30363d]">
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Solo:</span>
                        <span className="text-[#58a6ff]">Irrigado (water)</span>
                      </div>
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Umidade Min:</span>
                        <span className="text-[#f85149] font-bold">&ge; 75%</span>
                      </div>
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Sensor:</span>
                        <span className="text-[#a5d6ff]">measure()</span>
                      </div>
                    </div>
                  </div>

                  {/* GRADED_PLANT */}
                  <div className="bg-[#010409] p-4 rounded-xl border border-[#30363d] space-y-2.5 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs text-[#bc8cff]">
                        <span className="text-base">🧬</span>
                        <span>Planta Graduada (Ordenação de Biomassa)</span>
                        <code className="text-[10px] text-[#8b949e] font-mono">"GRADED_PLANT"</code>
                      </div>
                      <span className="text-[10px] bg-[#bc8cff]/15 text-[#bc8cff] border border-[#bc8cff]/30 px-2 py-0.5 rounded font-mono font-semibold">
                        Delicada (Umidade &ge; 75%)
                      </span>
                    </div>
                    <p className="text-xs text-[#c9d1d9] leading-relaxed">
                      Cultura avançada para algoritmos de ordenação (ex: Bubble Sort). Cada planta possui um grau numérico lido via <code className="text-[#58a6ff] font-mono">world.measure()</code>. Troque posições com blocos vizinhos via <code className="text-[#bc8cff] font-mono">farm.swap("EAST")</code> para criar sequências ordenadas e maximizar a biomassa gerada.
                    </p>
                    <div className="grid grid-cols-4 gap-2 text-[11px] font-mono bg-[#0d1117] p-2 rounded border border-[#30363d]">
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Solo:</span>
                        <span className="text-[#58a6ff]">Irrigado</span>
                      </div>
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Umidade:</span>
                        <span className="text-[#f85149] font-bold">&ge; 75%</span>
                      </div>
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Troca de Posição:</span>
                        <span className="text-[#bc8cff]">farm.swap()</span>
                      </div>
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Ação Especial:</span>
                        <span className="text-[#e3b341]">Bubble Sort</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Example Python Code Snippet */}
              <div className="bg-[#010409] border border-[#30363d] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-[#8b949e]">
                  <span>Exemplo de Loop Inteligente de Colheita (Python)</span>
                  <button 
                    onClick={() => copyCode('while True:\n    if world.get_growth() == 100:\n        farm.harvest()\n    elif world.get_growth() == 0:\n        farm.plant("CORN")\n    farm.move()')}
                    className="flex items-center gap-1 text-[#3fb950] hover:underline text-[11px]"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copiar
                  </button>
                </div>
                <pre className="bg-[#0d1117] p-3 rounded text-xs font-mono text-[#3fb950] overflow-x-auto leading-relaxed border border-[#30363d]">
{`# Colhe apenas com 100% de crescimento
if farm.can_harvest():
    farm.harvest()
elif world.get_growth() < 100 and world.get_crop() != "NONE":
    # Aguarda o crescimento completo sem gastar sementes
    pass`}
                </pre>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
