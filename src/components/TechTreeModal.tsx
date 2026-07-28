import React from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  Lock, 
  CheckCircle2, 
  Wheat, 
  TreePine, 
  Sprout, 
  Apple, 
  Zap, 
  Cpu, 
  Grid3X3, 
  Terminal, 
  Bot, 
  Maximize2 
} from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';
import { TechBranch, TechNode } from '../types/game';

interface TechTreeModalProps {
  engine: GameEngine;
}

export const TechTreeModal: React.FC<TechTreeModalProps> = ({ engine }) => {
  const techTree = engine.getTechTree();
  const resources = engine.getResources();

  const handleUnlock = (node: TechNode) => {
    const success = engine.unlockTech(node.id);
    if (success) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } else {
      alert('Recursos insuficientes ou pré-requisitos não atendidos!');
    }
  };

  const renderBranch = (branch: TechBranch, title: string, icon: React.ReactNode, colorClass: string) => {
    const branchNodes = techTree.filter(n => n.branch === branch);

    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 flex flex-col gap-3">
        <div className={`flex items-center gap-2 font-bold text-sm border-b border-[#30363d] pb-2 ${colorClass}`}>
          {icon}
          {title}
        </div>

        <div className="space-y-3">
          {branchNodes.map((node) => {
            const isUnlocked = node.unlocked;

            // Check if prerequisites met
            const reqsMet = !node.requires || node.requires.every(reqId => {
              const reqNode = techTree.find(n => n.id === reqId);
              return reqNode && reqNode.unlocked;
            });

            // Check cost affordability
            const canAfford = Object.entries(node.cost).every(([res, cost]) => {
              return (resources[res as keyof typeof resources] || 0) >= (cost || 0);
            });

            return (
              <div
                key={node.id}
                className={`p-3 rounded-md border transition-all ${
                  isUnlocked
                    ? 'bg-[#238636]/15 border-[#238636]/50 text-[#f0f6fc]'
                    : reqsMet
                      ? 'bg-[#010409] border-[#30363d] text-[#c9d1d9] hover:border-[#8b949e]'
                      : 'bg-[#010409]/40 border-[#21262d] text-[#6e7681] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold text-xs flex items-center gap-2">
                    {isUnlocked ? (
                      <CheckCircle2 className="w-4 h-4 text-[#3fb950] shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-[#6e7681] shrink-0" />
                    )}
                    <span className={isUnlocked ? 'text-[#3fb950] font-bold' : ''}>{node.name}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#21262d] border border-[#30363d] text-[#8b949e]">
                    Nível {node.tier}
                  </span>
                </div>

                <p className="text-[11px] text-[#8b949e] mb-2 leading-relaxed">{node.description}</p>

                {/* Costs & Unlock Button */}
                {!isUnlocked && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#30363d]">
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      {Object.entries(node.cost).map(([res, cost]) => {
                        const hasEnough = (resources[res as keyof typeof resources] || 0) >= (cost || 0);
                        return (
                          <span
                            key={res}
                            className={`px-1.5 py-0.5 rounded border ${
                              hasEnough 
                                ? 'bg-[#21262d] border-[#30363d] text-[#c9d1d9]' 
                                : 'bg-[#da3633]/20 border-[#da3633]/50 text-[#f85149]'
                            }`}
                          >
                            {cost} {res}
                          </span>
                        );
                      })}
                      {Object.keys(node.cost).length === 0 && (
                        <span className="text-[#3fb950]">GRÁTIS</span>
                      )}
                    </div>

                    <button
                      disabled={!reqsMet || !canAfford}
                      onClick={() => handleUnlock(node)}
                      className={`px-3 py-1 rounded text-xs font-semibold shadow transition-all ${
                        reqsMet && canAfford
                          ? 'bg-[#238636] hover:bg-[#2ea043] text-white active:scale-95 cursor-pointer border border-[#3fb950]/30'
                          : 'bg-[#21262d] text-[#6e7681] cursor-not-allowed border border-[#30363d]'
                      }`}
                    >
                      Desbloquear
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-[#0d1117] p-6 overflow-y-auto font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Title */}
        <div className="flex items-center justify-between border-b border-[#30363d] pb-4">
          <div>
            <h1 className="text-xl font-bold text-[#f0f6fc] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#d29922]" />
              Árvore de Tecnologia e Pesquisa
            </h1>
            <p className="text-xs text-[#8b949e] mt-0.5">
              Desbloqueie sintaxes de programação, novas espécies de culturas, sensores, ferramentas de depuração e expansão de terreno!
            </p>
          </div>
        </div>

        {/* 4 Branches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderBranch('AUTOMATION', 'Automação e Linguagem', <Cpu className="w-4 h-4" />, 'text-[#58a6ff]')}
          {renderBranch('AGRONOMY', 'Agronomia e Culturas', <Sprout className="w-4 h-4" />, 'text-[#3fb950]')}
          {renderBranch('SYSTEMS', 'Sistemas e Depuração', <Terminal className="w-4 h-4" />, 'text-[#bc8cff]')}
          {renderBranch('SCALE', 'Escala e Expansão de Terreno', <Maximize2 className="w-4 h-4" />, 'text-[#d29922]')}
        </div>
      </div>
    </div>
  );
};
