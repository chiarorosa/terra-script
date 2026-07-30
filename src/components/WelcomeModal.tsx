import React, { useState } from 'react';
import { Bot, Terminal, Code2, Rocket, User, Palette } from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';
import { audioManager } from '../utils/audioManager';

interface WelcomeModalProps {
  engine: GameEngine;
  onClose: (programmerName: string) => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ engine, onClose }) => {
  const [nameInput, setNameInput] = useState<string>('Dev Master');
  const [selectedStyle, setSelectedStyle] = useState<string>('default');

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
      localStorage.setItem('terrascript_ui_style', selectedStyle);
    }

    engine.addLog(
      1,
      'system',
      `🎉 Seja bem-vindo(a), ${finalName}! Claudio está inicializado no tema Linear Slate e aguardando instruções em main.py!`
    );

    audioManager.playSuccess();
    onClose(finalName);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#08090a]/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans">
      <div className="bg-[#0f1011] border border-[#23252a] rounded-[12px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        
        {/* Banner Header */}
        <div className="bg-[#08090a] p-6 border-b border-[#23252a] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Bot className="w-40 h-40 text-[#ffffff]" />
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-[8px] bg-[#161718] border border-[#23252a] text-[#27a644] shrink-0">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-medium uppercase tracking-widest text-[#27a644] bg-[#27a644]/10 px-2 py-0.5 rounded-[4px] border border-[#27a644]/30">
                Estação Agro-Planetária
              </span>
              <h2 className="text-base font-medium text-[#ffffff] tracking-tight mt-0.5">
                Boas-vindas ao TerraScript 3D!
              </h2>
            </div>
          </div>
        </div>

        {/* Humorous Story Body */}
        <div className="p-6 space-y-4 text-xs leading-relaxed text-[#d0d6e0] max-h-[65vh] overflow-y-auto">
          
          <div className="p-3.5 bg-[#161718] border border-[#23252a] rounded-[8px] space-y-2">
            <p className="font-medium text-[#ffffff] flex items-center justify-between">
              <span>Saudações, nobre Programador(a)!</span>
              <span className="text-[10px] bg-[#27a644]/10 text-[#27a644] border border-[#27a644]/30 px-1.5 py-0.5 rounded font-mono font-medium">
                v2.3.0
              </span>
            </p>
            <p className="text-[#8a8f98]">
              Você acaba de assumir o comando da Estação de Automação. Agora na versão <span className="text-[#27a644] font-mono font-semibold">v2.3.0</span>, seus scripts de <span className="text-[#ffffff] font-mono font-medium">Python</span> e <span className="text-[#ffffff] font-mono font-medium">JavaScript</span> são executados diretamente por motores nativos (<span className="text-[#02b8cc] font-mono">Pyodide WASM</span> e <span className="text-[#02b8cc] font-mono">V8 JS Sandbox</span>) no seu navegador, suportando algoritmos complexos, estruturas aninhadas e recursão!
            </p>
          </div>

          {/* Funny Note */}
          <div className="p-3 bg-[#161718] border border-[#23252a] rounded-[8px] flex items-start gap-3 text-[#d0d6e0]">
            <Bot className="w-4 h-4 shrink-0 text-[#27a644] mt-0.5" />
            <div className="text-[11px] leading-normal space-y-1">
              <p className="font-medium text-[#ffffff]">Lembrete do seu drone auxiliar Claudio:</p>
              <p className="text-[#8a8f98]">
                &quot;Eu obedeço cegamente ao seu código em <code className="bg-[#08090a] px-1 py-0.5 rounded-[4px] text-[#27a644] font-mono">main.py</code>. Se você esquecer de regar o solo antes de plantar, eu tentarei plantar na terra seca mesmo assim!&quot;
              </p>
            </div>
          </div>

          {/* Form: Name Input & Suggestions */}
          <form onSubmit={handleSubmit} className="space-y-3.5 pt-2">
            <div>
              <label className="block text-xs font-medium text-[#ffffff] mb-1.5 flex items-center justify-between">
                <span>Como deseja ser chamado(a) no Painel de Controle?</span>
                <span className="text-[10px] text-[#8a8f98] font-normal">Identificação do(a) Dev</span>
              </label>

              {/* Name Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8a8f98]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Ex: Dev Master, PythonNinja..."
                  maxLength={24}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#08090a] border border-[#23252a] focus:border-[#383b3f] text-[#ffffff] font-medium text-xs rounded-[6px] outline-none transition-all placeholder:text-[#62666d]"
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
                    className={`px-2.5 py-1 rounded-[6px] text-[10px] font-mono transition-all ${
                      nameInput === title
                        ? 'bg-[#161718] text-[#ffffff] border border-[#383b3f] font-medium'
                        : 'bg-[#08090a] text-[#8a8f98] border border-[#23252a] hover:text-[#ffffff] hover:bg-[#161718]'
                    }`}
                  >
                    + {title}
                  </button>
                ))}
              </div>
            </div>

            {/* UI Style Selector (v2.2.0 Spec) */}
            <div className="pt-1">
              <label className="block text-xs font-medium text-[#ffffff] mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#d0d6e0]" />
                  <span>Estilo da Interface (UI Style)</span>
                </span>
                <span className="text-[10px] bg-[#161718] text-[#27a644] border border-[#27a644]/30 px-1.5 py-0.2 rounded font-mono font-medium">
                  v2.3.0
                </span>
              </label>

              <div className="p-3 bg-[#08090a] border border-[#23252a] rounded-[8px] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStyle('default')}
                  className={`px-3 py-1.5 rounded-[6px] text-xs font-medium flex items-center gap-2 transition-all border ${
                    selectedStyle === 'default'
                      ? 'bg-[#161718] text-[#ffffff] border-[#383b3f] font-medium'
                      : 'bg-[#08090a] text-[#8a8f98] border-[#23252a] hover:text-[#ffffff]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#27a644]" />
                  <span>Padrão (Linear - Dark Midnight)</span>
                </button>
                <span className="text-[10px] text-[#8a8f98] italic">
                  (Seleção única disponível)
                </span>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-[#ffffff] hover:bg-[#d0d6e0] text-[#08090a] font-medium text-xs rounded-[6px] transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <Code2 className="w-4 h-4" />
                <span>Assumir Comando e Iniciar Código!</span>
              </button>
            </div>
          </form>

        </div>

        {/* Footer info */}
        <div className="px-6 py-2.5 bg-[#08090a] border-t border-[#23252a] flex items-center justify-between text-[10px] text-[#8a8f98] font-mono">
          <span>SISTEMA: ONLINE</span>
          <span>DRONE CLAUDIO: PRONTO</span>
        </div>

      </div>
    </div>
  );
};
