import React, { useEffect } from 'react';
import { Sparkles, Terminal, Play, Cpu, Check, GraduationCap } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-[#08090a]/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none font-pixel-body">
      <div className="max-w-md w-full bg-[#0f1011] pixel-box-amber p-5 text-white space-y-4 relative">
        <div>
          <span className="pixel-badge bg-[#22c55e] text-[#052e16] font-bold">
            Boas-vindas
          </span>
          <h2 className="text-sm font-pixel-header text-white tracking-tight leading-tight mt-1">
            Primeiros Passos no TerraScript
          </h2>
        </div>

        <p className="text-xs text-[#8a8f98] leading-relaxed font-pixel-body">
          Para iniciar sua jornada de automação agrícola com código, siga os 3 passos simples abaixo:
        </p>

        {/* 3 Step Cards */}
        <div className="space-y-2">
          <div className="flex items-start gap-3 p-3 bg-[#161718] pixel-box transition-all">
            <div className="w-5 h-5 bg-[#facc15] text-[#0f172a] font-pixel-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div className="text-xs text-[#d0d6e0] leading-snug font-pixel-body">
              <span className="text-white font-pixel-header flex items-center gap-1 mb-0.5">
                <Terminal className="w-3.5 h-3.5 text-[#facc15]" /> Edite o código em <code className="text-[#facc15] font-pixel-mono bg-[#08090a] px-1">main.py</code>
              </span>
              Escreva instruções Python para controlar o movimento e ação do seu Agente.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-[#161718] pixel-box transition-all">
            <div className="w-5 h-5 bg-[#22c55e] text-[#052e16] font-pixel-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              2
            </div>
            <div className="text-xs text-[#d0d6e0] leading-snug font-pixel-body">
              <span className="text-white font-pixel-header flex items-center gap-1 mb-0.5">
                <Play className="w-3.5 h-3.5 text-[#22c55e]" /> Clique em <strong className="text-[#22c55e]">▶ Executar (F5)</strong>
              </span>
              Inicie a simulação para enviar o script direto para o motor do seu Agente.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-[#161718] pixel-box transition-all">
            <div className="w-5 h-5 bg-[#06b6d4] text-[#083344] font-pixel-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              3
            </div>
            <div className="text-xs text-[#d0d6e0] leading-snug font-pixel-body">
              <span className="text-white font-pixel-header flex items-center gap-1 mb-0.5">
                <Cpu className="w-3.5 h-3.5 text-[#06b6d4]" /> Colha e Libere <strong className="text-[#ffffff]">Pesquisas</strong>
              </span>
              Acumule pontos de colheita e libere novas tecnologias na Árvore de Pesquisas.
            </div>
          </div>
        </div>

        {/* Highlighted Notice: Read GUIA tab first */}
        <div className="p-3.5 pixel-box-amber bg-[#0f1011] space-y-1.5 relative overflow-hidden">
          <div className="flex items-center gap-2 text-[#facc15] font-pixel-header text-xs">
            <div className="p-1.5 bg-[#facc15]/20 shrink-0">
              <GraduationCap className="w-4 h-4 text-[#facc15]" />
            </div>
            <span className="text-white text-xs font-pixel-header">
              Dica Importante ao Jogador
            </span>
          </div>
          <p className="text-[11px] text-[#d0d6e0] leading-relaxed font-pixel-body">
            <strong>Recomendamos ler ANTES a aba GUIA no menu superior!</strong> Ela contém todas as mecânicas do terreno, comandos da API (<code className="text-[#facc15] font-pixel-mono">farm.*</code> e <code className="text-[#facc15] font-pixel-mono">world.*</code>) e tutoriais para programar com sucesso.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleConfirm}
          className="w-full py-2.5 pixel-btn pixel-btn-green font-pixel-header text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>Entendi, Começar Automação!</span>
        </button>
      </div>
    </div>
  );
};
