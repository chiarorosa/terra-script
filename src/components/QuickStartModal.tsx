import React, { useEffect } from 'react';
import { Sparkles, Terminal, Play, Cpu, Check } from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';
import { audioManager } from '../utils/audioManager';

interface QuickStartModalProps {
  engine: GameEngine;
  onClose: () => void;
}

export const QuickStartModal: React.FC<QuickStartModalProps> = ({ engine, onClose }) => {
  useEffect(() => {
    // Play welcoming sound when modal appears
    audioManager.playSuccess();
  }, []);

  const handleConfirm = () => {
    audioManager.playClick();
    engine.markQuickStartProminentDone();
    engine.markQuickStartSeen();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#08090a]/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none font-sans">
      <div className="max-w-md w-full bg-[#0f1011] border border-[#23252a] shadow-2xl rounded-[12px] p-5 text-white space-y-4 relative">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-[#5e6ad2] font-semibold">
            Boas-vindas
          </span>
          <h2 className="text-sm font-semibold text-white tracking-tight leading-tight">
            Primeiros Passos no TerraScript
          </h2>
        </div>

        <p className="text-xs text-[#8a8f98] leading-relaxed">
          Para iniciar sua jornada de automação agrícola com código, siga os 3 passos simples abaixo:
        </p>

        {/* 3 Step Cards */}
        <div className="space-y-2">
          <div className="flex items-start gap-3 p-3 bg-[#161718] border border-[#23252a] rounded-[8px] transition-all hover:border-[#383b3f]">
            <div className="w-5 h-5 rounded-[6px] bg-[#5e6ad2]/20 border border-[#5e6ad2]/40 text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div className="text-xs text-[#d0d6e0] leading-snug">
              <span className="text-white font-medium flex items-center gap-1 mb-0.5">
                <Terminal className="w-3.5 h-3.5 text-[#5e6ad2]" /> Edite o código em <code className="text-[#5e6ad2] font-mono bg-[#08090a] px-1 rounded border border-[#23252a]">main.py</code>
              </span>
              Escreva instruções Python para controlar o movimento e ação do seu Agente.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-[#161718] border border-[#23252a] rounded-[8px] transition-all hover:border-[#383b3f]">
            <div className="w-5 h-5 rounded-[6px] bg-[#5e6ad2]/20 border border-[#5e6ad2]/40 text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div className="text-xs text-[#d0d6e0] leading-snug">
              <span className="text-white font-medium flex items-center gap-1 mb-0.5">
                <Play className="w-3.5 h-3.5 text-[#27a644]" /> Clique em <strong className="text-[#27a644]">▶ Executar (F5)</strong>
              </span>
              Inicie a simulação para enviar o script direto para o motor do seu Agente.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-[#161718] border border-[#23252a] rounded-[8px] transition-all hover:border-[#383b3f]">
            <div className="w-5 h-5 rounded-[6px] bg-[#5e6ad2]/20 border border-[#5e6ad2]/40 text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div className="text-xs text-[#d0d6e0] leading-snug">
              <span className="text-white font-medium flex items-center gap-1 mb-0.5">
                <Cpu className="w-3.5 h-3.5 text-[#5e6ad2]" /> Colha e Libere <strong className="text-[#ffffff]">Pesquisas</strong>
              </span>
              Acumule pontos de colheita e libere novas tecnologias na Árvore de Pesquisas.
            </div>
          </div>
        </div>

        <div className="p-2.5 bg-[#08090a] border border-[#23252a] rounded-[8px] text-[11px] text-[#8a8f98] flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#5e6ad2] shrink-0" />
          <span>O <strong className="text-[#d0d6e0]">Guia Rápido</strong> permanecerá acessível no topo do Explorador de Arquivos à esquerda.</span>
        </div>

        {/* Action Button */}
        <button
          onClick={handleConfirm}
          className="w-full py-2.5 bg-[#ffffff] hover:bg-[#e5e5e6] active:scale-[0.98] text-[#08090a] font-semibold text-xs rounded-[6px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <Check className="w-4 h-4" />
          <span>Entendi, Começar Automação!</span>
        </button>
      </div>
    </div>
  );
};
