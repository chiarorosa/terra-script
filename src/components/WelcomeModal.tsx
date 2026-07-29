import React, { useState } from 'react';
import { Bot, Terminal, Code2, Rocket, User } from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';
import { audioManager } from '../utils/audioManager';

interface WelcomeModalProps {
  engine: GameEngine;
  onClose: (programmerName: string) => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ engine, onClose }) => {
  const [nameInput, setNameInput] = useState<string>('Dev Master');

  const presetTitles = [
    'Dev Master',
    'Cmd. Python',
    'Ninja do JS',
    'Senior do Café',
    'Ninja do Indent',
    'Engenheiro(a) Chefe'
  ];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = nameInput.trim() || 'Dev Master';
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('terrascript_programmer_name', finalName);
      localStorage.setItem('terrascript_welcome_seen', 'true');
    }

    engine.addLog(
      1,
      'system',
      `🎉 Seja bem-vindo(a), ${finalName}! Claudio está inicializado e aguardando suas instruções em main.py!`
    );

    audioManager.playSuccess();
    onClose(finalName);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col border-t-4 border-t-[#3fb950]">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-[#0d1117] via-[#161b22] to-[#0d1117] p-6 border-b border-[#30363d] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Bot className="w-40 h-40 text-[#3fb950]" />
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#238636]/20 border border-[#238636]/50 text-[#3fb950] shadow-inner shrink-0">
              <Rocket className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#3fb950] bg-[#238636]/20 px-2 py-0.5 rounded border border-[#238636]/40">
                Estação Agro-Planetária
              </span>
              <h2 className="text-lg font-bold text-[#f0f6fc] tracking-tight">
                Boas-vindas ao TerraScript 3D! 🚀
              </h2>
            </div>
          </div>
        </div>

        {/* Humorous Story Body */}
        <div className="p-6 space-y-4 text-xs leading-relaxed text-[#c9d1d9] max-h-[65vh] overflow-y-auto">
          
          <div className="p-3.5 bg-[#0d1117] border border-[#30363d] rounded-xl space-y-2">
            <p className="font-semibold text-[#f0f6fc]">
              Saudações, nobre Programador(a)!
            </p>
            <p className="text-[#8b949e]">
              Você acaba de assumir o comando da Estação de Automação. Sua missão é criar scripts em <span className="text-[#3fb950] font-mono font-bold">Python</span>, <span className="text-[#3fb950] font-mono font-bold">JavaScript</span> (e novas linguagens em breve!) para automatizar nossos drones e transformar este quadrante num próspero ecossistema biotecnológico.
            </p>
          </div>

          {/* Funny Note */}
          <div className="p-3 bg-[#1f1a0e] border border-[#d29922]/50 rounded-xl flex items-start gap-3 text-[#e3b341]">
            <Bot className="w-5 h-5 shrink-0 text-[#d29922] mt-0.5" />
            <div className="text-[11px] leading-normal space-y-1">
              <p className="font-bold">Lembrete do seu drone auxiliar Claudio:</p>
              <p className="text-[#d29922]/90">
                &quot;Eu obedeço cegamente ao seu código em <code className="bg-[#0d1117] px-1 py-0.5 rounded text-[#3fb950] font-mono">main.py</code>. Se você esquecer de regar o solo antes de plantar, eu tentarei plantar na terra seca mesmo assim!&quot;
              </p>
            </div>
          </div>

          {/* Form: Name Input & Suggestions */}
          <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
            <div>
              <label className="block text-xs font-bold text-[#f0f6fc] mb-1.5 flex items-center justify-between">
                <span>Como deseja ser chamado(a) no Painel de Controle?</span>
                <span className="text-[10px] text-[#8b949e] font-normal">Identificação do(a) Dev</span>
              </label>

              {/* Name Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8b949e]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Ex: Dev Master, PythonNinja..."
                  maxLength={24}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#0d1117] border border-[#30363d] focus:border-[#3fb950] text-[#f0f6fc] font-semibold text-xs rounded-xl outline-none transition-all placeholder:text-[#484f58]"
                  autoFocus
                />
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {presetTitles.map((title) => (
                  <button
                    type="button"
                    key={title}
                    onClick={() => setNameInput(title)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all ${
                      nameInput === title
                        ? 'bg-[#21262d] text-[#3fb950] border border-[#3fb950]/60 font-bold shadow-sm'
                        : 'bg-[#0d1117] text-[#8b949e] border border-[#30363d] hover:text-[#c9d1d9] hover:bg-[#161b22]'
                    }`}
                  >
                    + {title}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-[#238636] hover:bg-[#2ea043] text-white font-bold text-xs rounded-xl shadow-lg shadow-[#238636]/20 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <Code2 className="w-4 h-4" />
                <span>Assumir Comando e Iniciar Código!</span>
              </button>
            </div>
          </form>

        </div>

        {/* Footer info */}
        <div className="px-6 py-2.5 bg-[#0d1117] border-t border-[#30363d] flex items-center justify-between text-[10px] text-[#8b949e] font-mono">
          <span>SISTEMA: ONLINE</span>
          <span>DRONE CLAUDIO: PRONTO</span>
        </div>

      </div>
    </div>
  );
};
