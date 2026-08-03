import React from 'react';
import confetti from 'canvas-confetti';
import { 
  FlaskConical, 
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
  Maximize2,
  BookOpen
} from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';
import { TechBranch, TechNode } from '../types/game';
import { PixelResourceIcon } from './PixelResourceIcon';

interface TechTreeModalProps {
  engine: GameEngine;
  onOpenGuideForTech?: (techId: string) => void;
}

export const TechTreeModal: React.FC<TechTreeModalProps> = ({ engine, onOpenGuideForTech }) => {
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
      <div className="bg-[#0f1011] pixel-box p-4 flex flex-col gap-3 font-pixel-body">
        <div className={`flex items-center gap-2 font-pixel-header text-xs border-b-2 border-[#23252a] pb-2 ${colorClass}`}>
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
                className={`p-3 pixel-box transition-all ${
                  isUnlocked
                    ? 'bg-[#22c55e]/15 text-[#ffffff]'
                    : reqsMet
                      ? 'bg-[#161718] text-[#d0d6e0]'
                      : 'bg-[#08090a]/60 text-[#62666d] opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-pixel-header text-xs flex items-center gap-2">
                    {isUnlocked ? (
                      <CheckCircle2 className="w-4 h-4 text-[#22c55e] shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-[#62666d] shrink-0" />
                    )}
                    <span className={isUnlocked ? 'text-[#22c55e]' : ''}>{node.name}</span>
                  </div>
                  <span className="text-[10px] uppercase font-pixel-mono px-1.5 py-0.5 pixel-badge bg-[#08090a] text-[#8a8f98]">
                    Nível {node.tier}
                  </span>
                </div>

                <p className="text-[11px] text-[#8a8f98] mb-2 leading-relaxed font-pixel-body">{node.description}</p>

                {/* Ver no Guia Button for Unlocked Techs */}
                {isUnlocked && onOpenGuideForTech && (
                  <div className="flex items-center justify-end mt-2 pt-2 border-t border-[#22c55e]/20">
                    <button
                      onClick={() => onOpenGuideForTech(node.id)}
                      className="flex items-center gap-1.5 px-2.5 py-1 pixel-btn pixel-btn-green text-[11px] transition-all cursor-pointer"
                      title="Ver documentação técnica no Guia de API"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Ver no Guia ➔</span>
                    </button>
                  </div>
                )}

                {/* Costs & Unlock Button */}
                {!isUnlocked && (
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#23252a]">
                    <div className="flex items-center gap-1.5 text-[10px] font-pixel-mono">
                      {Object.entries(node.cost).map(([res, cost]) => {
                        const hasEnough = (resources[res as keyof typeof resources] || 0) >= (cost || 0);
                        const resMap: Record<string, { name: string; color: string }> = {
                          fiber: { name: 'Fibra', color: '#facc15' },
                          wood: { name: 'Madeira', color: '#22c55e' },
                          roots: { name: 'Raízes', color: '#f97316' },
                          fruits: { name: 'Frutas', color: '#ef4444' },
                          energy: { name: 'Energia', color: '#06b6d4' },
                          biomass: { name: 'Biomassa', color: '#a855f7' }
                        };
                        const info = resMap[res] || { name: res, color: '#d0d6e0' };

                        return (
                          <span
                            key={res}
                            style={{ color: hasEnough ? info.color : '#ef4444' }}
                            className={`px-1.5 py-0.5 pixel-badge flex items-center gap-1 ${
                              hasEnough 
                                ? 'bg-[#161718]' 
                                : 'bg-[#ef4444]/20'
                            }`}
                          >
                            <PixelResourceIcon type={res} className="w-3 h-3 shrink-0" />
                            <span>{cost} {info.name}</span>
                          </span>
                        );
                      })}
                      {Object.keys(node.cost).length === 0 && (
                        <span className="text-[#22c55e]">GRÁTIS</span>
                      )}
                    </div>

                    <button
                      disabled={!reqsMet || !canAfford}
                      onClick={() => handleUnlock(node)}
                      className={`px-3 py-1 pixel-btn text-xs font-pixel-header transition-all ${
                        reqsMet && canAfford
                          ? 'pixel-btn-green text-[#ffffff] cursor-pointer'
                          : 'opacity-50 cursor-not-allowed text-[#62666d]'
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
    <div className="flex-1 bg-[#08090a] p-6 overflow-y-auto font-pixel-body">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Title */}
        <div className="flex items-center justify-between border-b-2 border-[#23252a] pb-4">
          <div>
            <h1 className="text-sm font-pixel-header text-[#ffffff] flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-[#22c55e]" />
              Árvore de Tecnologia e Pesquisa
            </h1>
            <p className="text-xs text-[#8a8f98] mt-1 leading-relaxed font-pixel-body">
              O compilador da sua fazenda. Invista recursos agrícolas para liberar sintaxes de programação, métodos de API, sensores de terreno e expansão de memória da grade.
            </p>
          </div>
        </div>

        {/* 4 Branches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderBranch('AUTOMATION', 'Automação e Linguagem', <Cpu className="w-4 h-4" />, 'text-[#02b8cc]')}
          {renderBranch('AGRONOMY', 'Agronomia e Culturas', <Sprout className="w-4 h-4" />, 'text-[#27a644]')}
          {renderBranch('SYSTEMS', 'Sistemas e Depuração', <Terminal className="w-4 h-4" />, 'text-[#8b5cf6]')}
          {renderBranch('SCALE', 'Escala e Expansão de Terreno', <Maximize2 className="w-4 h-4" />, 'text-[#d0d6e0]')}
        </div>
      </div>
    </div>
  );
};
