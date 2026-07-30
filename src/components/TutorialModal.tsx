import React, { useState } from 'react';
import { 
  BookOpen, 
  Cpu, 
  FlaskConical, 
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
  HelpCircle,
  Boxes,
  Award,
  Globe,
  Maximize2,
  AlertTriangle,
  Star,
  Wheat,
  Apple
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
          capabilities: ['Execução sequencial de código linha a linha', 'Movimento básico: world.move("RIGHT")', 'Verificação básica de obstáculo: world.can_move("RIGHT")', 'Reset de bloco: world.clear()'],
          snippet: 'farm.harvest()\nworld.move("RIGHT")'
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
          snippet: 'while True:\n    if farm.can_harvest():\n        farm.harvest()\n    world.move("RIGHT")'
        };
      case 'AUTO_5':
        return {
          capabilities: ['Definição de funções: def minha_func() / function minhaFunc()', 'Procedimentos de código modulares e reutilizáveis'],
          snippet: 'def harvest_tile():\n    if farm.can_harvest():\n        farm.harvest()\n    world.move("RIGHT")'
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
          capabilities: ['Plantar Plantas com Nota: farm.plant("GRADED_PLANT")', 'Trocar blocos de cultivo com vizinho: farm.swap("RIGHT")', 'Executar algoritmos de ordenação (ex: Bubble Sort) para ordenar fileiras para Máxima Biomassa'],
          snippet: 'if world.measure() > next_grade:\n    farm.swap("RIGHT")'
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
          capabilities: [
            'Sensores de posição: world.x(), world.y()',
            'Sensores de dimensão: world.width(), world.height()',
            'Inspeção do solo: world.ground()',
            'Inspeção da cultura: world.entity()',
            'Inspeção da umidade: world.moisture()',
            'Contagem de inventário: inventory.count("fiber")'
          ],
          snippet: 'if world.ground() == "NATURAL" and world.moisture() < 0.5:\n    farm.till()\n    farm.water()'
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
    <div className="flex-1 bg-[#08090a] p-6 overflow-y-auto font-sans text-[#d0d6e0] select-none">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Title & Research Progress Bar */}
        <div className="border-b border-[#23252a] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-medium text-[#ffffff] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#27a644]" />
              Guia do Desenvolvedor & Documentação de API
            </h1>
            <p className="text-xs text-[#8a8f98] mt-1">
              Manual de referência técnica para automação agrícola. Consulte sintaxes da linguagem, métodos das APIs <code className="text-[#27a644] font-mono">farm</code> e <code className="text-[#8b5cf6] font-mono">world</code>, e regras físicas do ambiente.
            </p>
          </div>

          {/* Research Progress Widget */}
          <div className="bg-[#0f1011] border border-[#23252a] p-3 rounded-[12px] flex items-center gap-4 shrink-0">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#8a8f98] font-medium">Pesquisas Desbloqueadas:</span>
                <span className="text-[#27a644] font-medium ml-2">{unlockedTechCount} / {totalTech} ({unlockPercentage}%)</span>
              </div>
              <div className="w-48 h-2 bg-[#08090a] rounded-[4px] overflow-hidden border border-[#23252a]">
                <div 
                  className="h-full bg-[#27a644] transition-all duration-500" 
                  style={{ width: `${unlockPercentage}%` }}
                />
              </div>
            </div>

            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('research')}
                className="px-3 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0 border border-[#3fb950]/30"
              >
                <FlaskConical className="w-3.5 h-3.5" />
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
            <Zap className="w-4 h-4 text-[#27a644]" />
            Matriz de Desbloqueios
          </button>

          <button
            onClick={() => setActiveGuideTab('mechanics')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold transition-all ${
              activeGuideTab === 'mechanics' 
                ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm' 
                : 'bg-[#161b22]/60 text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d]'
            }`}
          >
            <Sprout className="w-4 h-4 text-[#27a644]" />
            Mecânicas
          </button>

          <button
            onClick={() => setActiveGuideTab('farm')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold transition-all ${
              activeGuideTab === 'farm' 
                ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm' 
                : 'bg-[#161b22]/60 text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d]'
            }`}
          >
            <Sprout className="w-4 h-4 text-[#27a644]" />
            API da Fazenda (<code className="text-[#27a644]">farm.*</code>)
          </button>

          <button
            onClick={() => setActiveGuideTab('world')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold transition-all ${
              activeGuideTab === 'world' 
                ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm' 
                : 'bg-[#161b22]/60 text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d]'
            }`}
          >
            <Terminal className="w-4 h-4 text-[#8b5cf6]" />
            Mundo e Sensores (<code className="text-[#8b5cf6]">world.*</code>)
          </button>

          <button
            onClick={() => setActiveGuideTab('syntax')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold transition-all ${
              activeGuideTab === 'syntax' 
                ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm' 
                : 'bg-[#161b22]/60 text-[#8b949e] hover:text-[#f0f6fc] border border-[#30363d]'
            }`}
          >
            <Cpu className="w-4 h-4 text-[#02b8cc]" />
            Linguagem e Sintaxe
          </button>
        </div>

        {/* TAB 1: RESEARCH UNLOCKS MATRIX */}
        {activeGuideTab === 'matrix' && (
          <div className="space-y-6">
            
            {/* AUTOMATION BRANCH */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
                <h2 className="font-bold text-sm text-[#02b8cc] flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  Automação e Linguagem
                </h2>
                <span className="text-xs font-mono text-[#02b8cc]">
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
                          ? 'bg-[#010409] border-[#02b8cc]/40 text-[#f0f6fc] shadow-sm' 
                          : 'bg-[#010409]/50 border-[#30363d] text-[#8b949e] opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-[#02b8cc] flex items-center gap-1.5">
                          {node.unlocked ? <CheckCircle2 className="w-4 h-4 text-[#02b8cc]" /> : <Lock className="w-4 h-4 text-[#d29922]" />}
                          {node.name} <span className="text-[10px] text-[#8b949e] font-mono">({node.id})</span>
                        </span>
                        <span className={`text-[10px] font-sans px-2 py-0.5 rounded font-bold ${
                          node.unlocked ? 'bg-[#02b8cc]/15 text-[#02b8cc] border border-[#02b8cc]/30' : 'bg-[#d29922]/15 text-[#d29922] border border-[#d29922]/30'
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
                          <code className="text-xs font-mono text-[#02b8cc] whitespace-pre leading-relaxed">{details.snippet}</code>
                          {node.unlocked && (
                            <button 
                              onClick={() => copyCode(details.snippet)}
                              className="p-1.5 hover:bg-[#21262d] rounded text-[#8b949e] hover:text-[#f0f6fc] transition-all opacity-0 group-hover:opacity-100 shrink-0"
                              title="Copiar código"
                            >
                              {copiedSnippet === details.snippet ? <Check className="w-4 h-4 text-[#27a644]" /> : <Copy className="w-4 h-4" />}
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
                <h2 className="font-bold text-sm text-[#27a644] flex items-center gap-2">
                  <Sprout className="w-4 h-4" />
                  Agronomia e Culturas
                </h2>
                <span className="text-xs font-mono text-[#27a644]">
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
                          ? 'bg-[#010409] border-[#27a644]/40 text-[#f0f6fc] shadow-sm' 
                          : 'bg-[#010409]/50 border-[#30363d] text-[#8b949e] opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-[#27a644] flex items-center gap-1.5">
                          {node.unlocked ? <CheckCircle2 className="w-4 h-4 text-[#27a644]" /> : <Lock className="w-4 h-4 text-[#d29922]" />}
                          {node.name} <span className="text-[10px] text-[#8b949e] font-mono">({node.id})</span>
                        </span>
                        <span className={`text-[10px] font-sans px-2 py-0.5 rounded font-bold ${
                          node.unlocked ? 'bg-[#27a644]/15 text-[#27a644] border border-[#27a644]/30' : 'bg-[#d29922]/15 text-[#d29922] border border-[#d29922]/30'
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
                          <code className="text-xs font-mono text-[#27a644] whitespace-pre leading-relaxed">{details.snippet}</code>
                          {node.unlocked && (
                            <button 
                              onClick={() => copyCode(details.snippet)}
                              className="p-1.5 hover:bg-[#21262d] rounded text-[#8b949e] hover:text-[#f0f6fc] transition-all opacity-0 group-hover:opacity-100 shrink-0"
                              title="Copiar código"
                            >
                              {copiedSnippet === details.snippet ? <Check className="w-4 h-4 text-[#27a644]" /> : <Copy className="w-4 h-4" />}
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
                <h2 className="font-bold text-sm text-[#8b5cf6] flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Sistemas e Depuração
                </h2>
                <span className="text-xs font-mono text-[#8b5cf6]">
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
                          ? 'bg-[#010409] border-[#8b5cf6]/40 text-[#f0f6fc] shadow-sm' 
                          : 'bg-[#010409]/50 border-[#30363d] text-[#8b949e] opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-[#8b5cf6] flex items-center gap-1.5">
                          {node.unlocked ? <CheckCircle2 className="w-4 h-4 text-[#8b5cf6]" /> : <Lock className="w-4 h-4 text-[#d29922]" />}
                          {node.name} <span className="text-[10px] text-[#8b949e] font-mono">({node.id})</span>
                        </span>
                        <span className={`text-[10px] font-sans px-2 py-0.5 rounded font-bold ${
                          node.unlocked ? 'bg-[#8b5cf6]/15 text-[#8b5cf6] border border-[#8b5cf6]/30' : 'bg-[#d29922]/15 text-[#d29922] border border-[#d29922]/30'
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
                          <code className="text-xs font-mono text-[#8b5cf6] whitespace-pre leading-relaxed">{details.snippet}</code>
                          {node.unlocked && (
                            <button 
                              onClick={() => copyCode(details.snippet)}
                              className="p-1.5 hover:bg-[#21262d] rounded text-[#8b949e] hover:text-[#f0f6fc] transition-all opacity-0 group-hover:opacity-100 shrink-0"
                              title="Copiar código"
                            >
                              {copiedSnippet === details.snippet ? <Check className="w-4 h-4 text-[#27a644]" /> : <Copy className="w-4 h-4" />}
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
                <h2 className="font-bold text-sm text-[#d0d6e0] flex items-center gap-2">
                  <Maximize2 className="w-4 h-4" />
                  Escala e Expansão de Terreno
                </h2>
                <span className="text-xs font-mono text-[#d0d6e0]">
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
                          ? 'bg-[#010409] border-[#d0d6e0]/40 text-[#f0f6fc] shadow-sm' 
                          : 'bg-[#010409]/50 border-[#30363d] text-[#8b949e] opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-[#d0d6e0] flex items-center gap-1.5">
                          {node.unlocked ? <CheckCircle2 className="w-4 h-4 text-[#d0d6e0]" /> : <Lock className="w-4 h-4 text-[#d29922]" />}
                          {node.name} <span className="text-[10px] text-[#8b949e] font-mono">({node.id})</span>
                        </span>
                        <span className={`text-[10px] font-sans px-2 py-0.5 rounded font-bold ${
                          node.unlocked ? 'bg-[#d0d6e0]/15 text-[#d0d6e0] border border-[#d0d6e0]/30' : 'bg-[#d29922]/10 text-[#d29922] border border-[#d29922]/20'
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
              <h2 className="font-bold text-sm text-[#27a644] flex items-center gap-2">
                <Sprout className="w-4 h-4" />
                Comandos da Fazenda (<code className="text-[#27a644]">farm.*</code>)
              </h2>
              <span className="text-xs text-[#8b949e] font-mono">
                {farmApis.filter(a => isUnlocked(a.techId)).length} / {farmApis.length} Desbloqueados
              </span>
            </div>

            {/* Growth Notice Callout */}
            <div className="bg-[#27a644]/10 border border-[#27a644]/30 p-3 rounded-lg flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#27a644] shrink-0" />
                <span className="text-[#f0f6fc] font-sans">
                  <strong>Regra de Colheita:</strong> A colheita com <code className="text-[#27a644] font-mono">farm.harvest()</code> exige <strong>100% de crescimento</strong> no bloco.
                </span>
              </div>
              <button 
                onClick={() => setActiveGuideTab('mechanics')}
                className="text-[11px] font-bold text-[#27a644] hover:underline shrink-0"
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
                        ? 'bg-[#010409] border-[#27a644]/40 text-[#f0f6fc]' 
                        : 'bg-[#010409]/50 border-[#30363d] text-[#8b949e] opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[#27a644] flex items-center gap-1.5 text-xs">
                        {unlocked ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#27a644]" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-[#d29922]" />
                        )}
                        {api.displayText}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-sans font-bold ${
                        unlocked ? 'bg-[#27a644]/15 text-[#27a644] border border-[#27a644]/30' : 'bg-[#d29922]/15 text-[#d29922] border border-[#d29922]/30'
                      }`}>
                        {unlocked ? 'DESBLOQUEADO' : `Req: ${techNode?.name || api.techId}`}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-[#27a644] mb-2 bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]">
                      <span className="text-[#8b949e] font-sans font-semibold mr-1">Sintaxe:</span>
                      <code>{api.signature}</code>
                    </div>

                    <p className="text-xs font-sans text-[#c9d1d9] mb-3 leading-relaxed">{api.docDetail}</p>

                    <div className="bg-[#0d1117] p-2.5 rounded border border-[#30363d] flex items-center justify-between group">
                      <code className="text-xs text-[#27a644]">{api.exampleCode}</code>
                      {unlocked && (
                        <button 
                          onClick={() => copyCode(api.exampleCode)}
                          className="p-1 hover:bg-[#21262d] rounded text-[#8b949e] hover:text-[#f0f6fc] transition-all opacity-0 group-hover:opacity-100"
                          title="Copiar código"
                        >
                          {copiedSnippet === api.exampleCode ? <Check className="w-3.5 h-3.5 text-[#27a644]" /> : <Copy className="w-3.5 h-3.5" />}
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
              <h2 className="font-bold text-sm text-[#8b5cf6] flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                API de Mundo e Sensores (<code className="text-[#8b5cf6]">world.*</code>)
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
                        ? 'bg-[#010409] border-[#8b5cf6]/40 text-[#f0f6fc]' 
                        : 'bg-[#010409]/50 border-[#30363d] text-[#8b949e] opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[#8b5cf6] flex items-center gap-1.5 text-xs">
                        {unlocked ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#8b5cf6]" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-[#d29922]" />
                        )}
                        {api.displayText}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-sans font-bold ${
                        unlocked ? 'bg-[#8b5cf6]/15 text-[#8b5cf6] border border-[#8b5cf6]/30' : 'bg-[#d29922]/15 text-[#d29922] border border-[#d29922]/30'
                      }`}>
                        {unlocked ? 'DESBLOQUEADO' : `Req: ${techNode?.name || api.techId}`}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-[#8b5cf6] mb-2 bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]">
                      <span className="text-[#8b949e] font-sans font-semibold mr-1">Sintaxe:</span>
                      <code>{api.signature}</code>
                    </div>

                    <p className="text-xs font-sans text-[#c9d1d9] mb-3 leading-relaxed">{api.docDetail}</p>

                    <div className="bg-[#0d1117] p-2.5 rounded border border-[#30363d] flex items-center justify-between group">
                      <code className="text-xs text-[#8b5cf6]">{api.exampleCode}</code>
                      {unlocked && (
                        <button 
                          onClick={() => copyCode(api.exampleCode)}
                          className="p-1 hover:bg-[#21262d] rounded text-[#8b949e] hover:text-[#f0f6fc] transition-all opacity-0 group-hover:opacity-100"
                          title="Copiar código"
                        >
                          {copiedSnippet === api.exampleCode ? <Check className="w-3.5 h-3.5 text-[#27a644]" /> : <Copy className="w-3.5 h-3.5" />}
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
              <h2 className="font-bold text-sm text-[#02b8cc] flex items-center gap-2">
                <Cpu className="w-4 h-4" />
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
                        ? 'bg-[#010409] border-[#02b8cc]/40 text-[#f0f6fc]' 
                        : 'bg-[#010409]/50 border-[#30363d] text-[#8b949e] opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[#02b8cc] flex items-center gap-1.5 text-xs">
                        {unlocked ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#02b8cc]" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-[#d29922]" />
                        )}
                        {syn.displayText}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-sans font-bold ${
                        unlocked ? 'bg-[#02b8cc]/15 text-[#02b8cc] border border-[#02b8cc]/30' : 'bg-[#d29922]/15 text-[#d29922] border border-[#d29922]/30'
                      }`}>
                        {unlocked ? 'Desbloqueado' : `Pesquisa: ${techNode?.name}`}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-[#02b8cc] mb-2 bg-[#0d1117] px-2 py-1 rounded border border-[#30363d]">
                      <span className="text-[#8b949e] font-sans font-semibold mr-1">Sintaxe:</span>
                      <code>{syn.signature}</code>
                    </div>

                    <p className="text-xs font-sans text-[#c9d1d9] mb-3 leading-relaxed">{syn.description}</p>

                    <div className="bg-[#0d1117] p-2.5 rounded border border-[#30363d] flex items-center justify-between group">
                      <code className="text-xs text-[#02b8cc] whitespace-pre">{syn.exampleCode}</code>
                      {unlocked && (
                        <button 
                          onClick={() => copyCode(syn.exampleCode)}
                          className="p-1 hover:bg-[#21262d] rounded text-[#8b949e] hover:text-[#f0f6fc] transition-all opacity-0 group-hover:opacity-100"
                          title="Copiar código"
                        >
                          {copiedSnippet === syn.exampleCode ? <Check className="w-3.5 h-3.5 text-[#27a644]" /> : <Copy className="w-3.5 h-3.5" />}
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
                
                {/* Prestige System & World Change Card */}
                <div className="bg-[#010409] p-4 rounded-xl border border-[#d29922]/50 space-y-3 md:col-span-2 shadow-[0_0_15px_rgba(210,153,34,0.15)]">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#e3b341]">
                    <Award className="w-4 h-4 text-[#e3b341]" />
                    Sistema de Prestígio (Nível 1 a 100) e Mudança do Mundo (World Change)
                  </div>
                  <p className="text-xs text-[#c9d1d9] leading-relaxed">
                    O <strong>Prestígio</strong> é a mecânica de engajamento e longo prazo do jogo. Ele incentiva o jogador a acumular e entregar recursos valiosos (Fibras, Madeira, Raízes, Frutas, Energia, etc.) além do limite da árvore de pesquisas.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                    <div className="bg-[#161b22] p-3 rounded-lg border border-[#30363d]">
                      <span className="font-bold text-[#e3b341] flex items-center gap-1.5 mb-1">
                        <Award className="w-3.5 h-3.5 text-[#e3b341]" />
                        Fonte 1: Desbloqueios da Árvore
                      </span>
                      <span className="text-[#8b949e]">Cada nó pesquisado na Árvore de Tecnologia concede Pontos de Prestígio imediatamente (entre 50 XP e 250.000 XP dependendo do Tier).</span>
                    </div>
                    <div className="bg-[#161b22] p-3 rounded-lg border border-[#30363d]">
                      <span className="font-bold text-[#e3b341] flex items-center gap-1.5 mb-1">
                        <Boxes className="w-3.5 h-3.5 text-[#e3b341]" />
                        Fonte 2: Upload de Recursos
                      </span>
                      <span className="text-[#8b949e]">Com o drone sobre o <strong>Bloco Dourado</strong>, execute <code className="text-[#e3b341] font-mono">farm.prestige("recurso", qtd)</code> para realizar o upload de itens do seu Estoque para a rede de Prestígio.</span>
                    </div>
                  </div>
                  <div className="bg-[#161b22] p-3 rounded-lg border border-[#d29922]/30 text-xs text-[#c9d1d9] space-y-1">
                    <span className="font-bold text-[#e3b341] flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#e3b341]" />
                      Mudança do Mundo (World Change): Bloco Dourado Sagrado
                    </span>
                    <p className="text-[#8b949e]">
                      Ao completar os 4 nós de Nível 1 (<code className="text-[#e3b341]">AUTO_2</code>, <code className="text-[#e3b341]">AGRO_2</code>, <code className="text-[#e3b341]">SYS_2</code>, <code className="text-[#e3b341]">SCALE_2</code>), a primeira <em>World Change</em> é ativada no mundo: exatamente <strong>1 bloco da grade</strong> se torna o Bloco Dourado de Prestígio. Ele é indestrutível, imune a limpezas de mundo (<code className="text-[#e3b341]">clear()</code>) e se reposiciona automaticamente para o centro do mundo em expansões de mapa.
                    </p>
                  </div>
                </div>

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

                <div className="bg-[#010409] p-4 rounded-xl border border-[#388bfd]/50 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#58a6ff]">
                    <Droplets className="w-4 h-4 text-[#58a6ff]" />
                    5. Solo Encharcado (SOAKED) e Perda de Cultura
                  </div>
                  <p className="text-xs text-[#c9d1d9] leading-relaxed">
                    <AlertTriangle className="w-3.5 h-3.5 text-[#eb5757] inline mr-1" /> <strong>Cuidado com o excesso de água!</strong> Regar um bloco que já possui <strong>&gt; 95% de umidade</strong> eleva o nível para <strong>110% (1.10)</strong> e altera o solo para <strong>Encharcado (<code className="text-[#58a6ff] font-mono">SOAKED</code>)</strong>.<br/>
                    • <strong>Efeito Destrutivo:</strong> Destrói a cultura atual imediatamente (<code className="text-[#f85149] font-mono">crop = NONE</code>).<br/>
                    • <strong>Bloqueio de Plantio:</strong> Tentar plantar com <code className="text-[#58a6ff] font-mono">farm.plant()</code> em solo encharcado resultará em falha.<br/>
                    • <strong>Recuperação:</strong> É necessário aguardar a evaporação dos ticks até a umidade cair para &le; 100% (<code className="text-[#58a6ff] font-mono">IRRIGATED</code>) para voltar a cultivar.
                  </p>
                </div>

                <div className="bg-[#010409] p-4 rounded-xl border border-[#bc8cff]/50 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-[#bc8cff]">
                    <Bot className="w-4 h-4 text-[#bc8cff]" />
                    6. Drone Principal e Execução Instantânea
                  </div>
                  <p className="text-xs text-[#c9d1d9] leading-relaxed">
                    <Star className="w-3.5 h-3.5 text-[#e3b341] fill-[#e3b341] inline shrink-0 mr-1" /> <strong>Execução direta pelo Explorador:</strong> Na lista de arquivos do Explorador, o botão <strong>PLAY</strong> executa o script diretamente no <strong>Drone Principal</strong>.<br/>
                    • O Drone Principal atual é indicado com um ícone de estrela.<br/>
                    • Alterne qual drone é o Principal na aba <strong>Drones</strong> a qualquer momento.<br/>
                    • <strong>Rastreamento do Drone no Painel INFO:</strong> Na janela de informações do bloco (canto inferior direito do visualizador 3D), alterne o botão <strong>Seguir: ON/OFF</strong> para que o inspetor acompanhe a posição do Drone Principal em tempo real. Clicar em qualquer bloco fixa a inspeção naquele bloco.
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
                      <div className="flex items-center gap-2 font-bold text-xs text-[#e4f222]">
                        <Wheat className="w-4 h-4 text-[#e4f222]" />
                        <span>Fibra Selvagem</span>
                        <code className="text-[10px] text-[#8b949e] font-mono">"WILD_FIBER"</code>
                      </div>
                      <span className="text-[10px] bg-[#e4f222]/15 text-[#e4f222] border border-[#e4f222]/30 px-2 py-0.5 rounded font-mono font-semibold">
                        Base: 5%/tick
                      </span>
                    </div>
                    <p className="text-xs text-[#c9d1d9] leading-relaxed">
                      Cultura silvestre inicial. Rebrota de forma espontânea e natural em qualquer solo não plantado (<code className="text-[#e4f222] font-mono">crop = "NONE"</code>).
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
                        <span className="text-[#27a644]">Livre</span>
                      </div>
                    </div>
                  </div>

                  {/* WOODY_BUSH */}
                  <div className="bg-[#010409] p-4 rounded-xl border border-[#30363d] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs text-[#27a644]">
                        <TreePine className="w-4 h-4 text-[#27a644]" />
                        <span>Arbusto de Madeira</span>
                        <code className="text-[10px] text-[#8b949e] font-mono">"WOODY_BUSH"</code>
                      </div>
                      <span className="text-[10px] bg-[#27a644]/15 text-[#27a644] border border-[#27a644]/30 px-2 py-0.5 rounded font-mono font-semibold">
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
                        <span className="text-[#27a644]">Livre</span>
                      </div>
                    </div>
                  </div>

                  {/* CULTIVATED_ROOT */}
                  <div className="bg-[#010409] p-4 rounded-xl border border-[#30363d] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs text-[#f97316]">
                        <Sprout className="w-4 h-4 text-[#f97316]" />
                        <span>Raízes Cultivadas</span>
                        <code className="text-[10px] text-[#8b949e] font-mono">"CULTIVATED_ROOT"</code>
                      </div>
                      <span className="text-[10px] bg-[#f97316]/15 text-[#f97316] border border-[#f97316]/30 px-2 py-0.5 rounded font-mono font-semibold">
                        Base: 4%/tick (Arado)
                      </span>
                    </div>
                    <p className="text-xs text-[#c9d1d9] leading-relaxed">
                      Exige preparação do terreno. Cresce <strong>duas vezes mais rápido (4%/tick)</strong> em solo Arado (<code className="text-[#f97316] font-mono">farm.till()</code>) do que em solo natural.
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-[#0d1117] p-2 rounded border border-[#30363d]">
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Solo Ideal:</span>
                        <span className="text-[#f97316]">Arado (TILLED)</span>
                      </div>
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Umidade:</span>
                        <span className="text-[#58a6ff]">&gt; 25%</span>
                      </div>
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Adjacência:</span>
                        <span className="text-[#27a644]">Livre</span>
                      </div>
                    </div>
                  </div>

                  {/* TREE */}
                  <div className="bg-[#010409] p-4 rounded-xl border border-[#30363d] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs text-[#a16207]">
                        <TreePine className="w-4 h-4 text-[#a16207]" />
                        <span>Árvore (Madeira Nobre)</span>
                        <code className="text-[10px] text-[#8b949e] font-mono">"TREE"</code>
                      </div>
                      <span className="text-[10px] bg-[#a16207]/15 text-[#a16207] border border-[#a16207]/30 px-2 py-0.5 rounded font-mono font-semibold">
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
                        <span className="text-[#eb5757]">Evitar Vizinho</span>
                      </div>
                    </div>
                  </div>

                  {/* FRUIT_COLONY */}
                  <div className="bg-[#010409] p-4 rounded-xl border border-[#30363d] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs text-[#eb5757]">
                        <Apple className="w-4 h-4 text-[#eb5757]" />
                        <span>Colônia de Frutas</span>
                        <code className="text-[10px] text-[#8b949e] font-mono">"FRUIT_COLONY"</code>
                      </div>
                      <span className="text-[10px] bg-[#eb5757]/15 text-[#eb5757] border border-[#eb5757]/30 px-2 py-0.5 rounded font-mono font-semibold">
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
                        <span className="text-[#eb5757] font-bold">&ge; 75%</span>
                      </div>
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Adjacência:</span>
                        <span className="text-[#27a644]">Colônias</span>
                      </div>
                    </div>
                  </div>

                  {/* ENERGY_FLOWER */}
                  <div className="bg-[#010409] p-4 rounded-xl border border-[#30363d] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-[#02b8cc] text-xs">
                        <Zap className="w-4 h-4 text-[#02b8cc]" />
                        <span>Flor de Energia</span>
                        <code className="text-[10px] text-[#8b949e] font-mono">"ENERGY_FLOWER"</code>
                      </div>
                      <span className="text-[10px] bg-[#02b8cc]/15 text-[#02b8cc] border border-[#02b8cc]/30 px-2 py-0.5 rounded font-mono font-semibold">
                        Delicada (Umidade &ge; 75%)
                      </span>
                    </div>
                    <p className="text-xs text-[#c9d1d9] leading-relaxed">
                      Gera energia elétrica. Requer umidade alta (&ge; 75%). Utilize <code className="text-[#02b8cc] font-mono">world.measure()</code> para ler o acúmulo de energia e colher no valor de pico (&gt; 50).
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-[#0d1117] p-2 rounded border border-[#30363d]">
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Solo:</span>
                        <span className="text-[#58a6ff]">Irrigado (water)</span>
                      </div>
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Umidade Min:</span>
                        <span className="text-[#eb5757] font-bold">&ge; 75%</span>
                      </div>
                      <div>
                        <span className="text-[#8b949e] block text-[9px] uppercase font-sans font-bold">Sensor:</span>
                        <span className="text-[#02b8cc]">measure()</span>
                      </div>
                    </div>
                  </div>

                  {/* GRADED_PLANT */}
                  <div className="bg-[#010409] p-4 rounded-xl border border-[#30363d] space-y-2.5 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-xs text-[#8b5cf6]">
                        <Cpu className="w-4 h-4 text-[#8b5cf6]" />
                        <span>Planta Graduada (Ordenação de Biomassa)</span>
                        <code className="text-[10px] text-[#8b949e] font-mono">"GRADED_PLANT"</code>
                      </div>
                      <span className="text-[10px] bg-[#8b5cf6]/15 text-[#8b5cf6] border border-[#8b5cf6]/30 px-2 py-0.5 rounded font-mono font-semibold">
                        Delicada (Umidade &ge; 75%)
                      </span>
                    </div>
                    <p className="text-xs text-[#c9d1d9] leading-relaxed">
                      Cultura avançada para algoritmos de ordenação (ex: Bubble Sort). Cada planta possui um grau numérico lido via <code className="text-[#58a6ff] font-mono">world.measure()</code>. Troque posições com blocos vizinhos via <code className="text-[#bc8cff] font-mono">farm.swap("RIGHT")</code> para criar sequências ordenadas e maximizar a biomassa gerada.
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
