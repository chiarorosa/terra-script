import React, { useState } from 'react';
import { Bot, Code2, Rocket, User, Palette, GraduationCap, Check, Sparkles, Layers, ArrowRight, ArrowLeft } from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';
import { audioManager } from '../utils/audioManager';

interface WelcomeModalProps {
  engine: GameEngine;
  onClose: (programmerName: string) => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ engine, onClose }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [nameInput, setNameInput] = useState<string>('Dev Master');
  const [selectedStyle, setSelectedStyle] = useState<string>('default');
  const [educationalErrors, setEducationalErrors] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('terrascript_educational_errors') !== 'false';
    }
    return true;
  });

  const presetTitles = [
    'Dev Master',
    'Cmd. Python',
    'Ninja do JS',
    'Senior do Café',
    'Ninja do Indent',
    'Engenheiro(a) Chefe'
  ];

  const handleNextStep = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    audioManager.playClick();
    setStep(2);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = nameInput.trim() || 'Dev Master';
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('terrascript_programmer_name', finalName);
      localStorage.setItem('terrascript_welcome_seen', 'true');
      localStorage.setItem('terrascript_ui_style', selectedStyle);
      localStorage.setItem('terrascript_educational_errors', educationalErrors ? 'true' : 'false');
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
    <div className="fixed inset-0 z-50 bg-[#08090a]/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans select-none">
      <div className="bg-[#0f1011] border border-[#23252a] rounded-[12px] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col">
        
        {/* Banner Header */}
        <div className="bg-[#08090a] p-5 border-b border-[#23252a] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Bot className="w-40 h-40 text-[#ffffff]" />
          </div>

          <div className="flex items-center justify-between">
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

            {/* Step Badge */}
            <div className="px-2.5 py-1 bg-[#161718] border border-[#23252a] rounded-[6px] text-[10px] font-mono text-[#8a8f98]">
              Etapa <span className="text-white font-bold">{step}</span>/2
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs leading-relaxed text-[#d0d6e0] max-h-[65vh] overflow-y-auto">
          
          {step === 1 ? (
            /* STEP 1: Name & Introduction */
            <form onSubmit={handleNextStep} className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              <div className="p-3.5 bg-[#161718] border border-[#23252a] rounded-[8px] space-y-2">
                <p className="font-medium text-[#ffffff]">
                  Saudações, nobre Programador(a) das Naves ETs!
                </p>
                <p className="text-[#8a8f98]">
                  A Terra foi colonizada por seres extraterrestres avançados para o cultivo biotecnológico planetário. Sua missão é criar scripts em <span className="text-[#ffffff] font-mono font-medium">Python</span> e <span className="text-[#ffffff] font-mono font-medium">JavaScript</span> para comandar nossas Naves de Trabalho e cultivar todo este quadrante!
                </p>
              </div>

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
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#08090a] border border-[#23252a] focus:border-[#5e6ad2] text-[#ffffff] font-medium text-xs rounded-[6px] outline-none transition-all placeholder:text-[#62666d]"
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
                      className={`px-2.5 py-1 rounded-[6px] text-[10px] font-mono transition-all cursor-pointer ${
                        nameInput === title
                          ? 'bg-[#5e6ad2]/20 text-[#ffffff] border border-[#5e6ad2] font-medium'
                          : 'bg-[#08090a] text-[#8a8f98] border border-[#23252a] hover:text-[#ffffff] hover:bg-[#161718]'
                      }`}
                    >
                      + {title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button for Step 1 */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#5e6ad2] hover:bg-[#4f52b2] text-white font-medium text-xs rounded-[6px] transition-all flex items-center justify-center gap-2 active:scale-98 shadow-[0_0_15px_rgba(94,106,210,0.3)] cursor-pointer"
                >
                  <span>Avançar para Preferências</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: Progressive UI Notice, Auxílio Educativo & Interface Style */
            <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              
              {/* Highlight Notice: Game Interface Evolution */}
              <div className="p-3.5 bg-[#0f1011] border-2 border-[#5e6ad2] rounded-[10px] shadow-[0_0_20px_rgba(94,106,210,0.3)] space-y-1.5 relative overflow-hidden">
                <div className="flex items-center gap-2 text-[#5e6ad2] font-semibold text-xs">
                  <div className="p-1.5 bg-[#5e6ad2]/20 rounded-md shrink-0">
                    <Layers className="w-4 h-4 text-[#5e6ad2]" />
                  </div>
                  <span className="text-white text-xs font-semibold">
                    Evolução Progressiva da Interface
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-[#5e6ad2] ml-auto animate-pulse" />
                </div>
                <p className="text-[11px] text-[#d0d6e0] leading-relaxed">
                  <strong>A interface do jogo evolui junto com o seu progresso!</strong> Novos menus, botões avançados, barra de prestígio e robôs de frota surgirão organicamente à medida que você explora o código e desbloqueia pesquisas.
                </p>
              </div>

              {/* Educational Errors Toggle */}
              <div>
                <label className="block text-xs font-medium text-[#ffffff] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-[#8b5cf6]" />
                    <span>Auxílio Educativo para Erros (Modo Iniciante)</span>
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => setEducationalErrors(!educationalErrors)}
                  className={`w-full p-3 bg-[#08090a] border rounded-[8px] flex items-start gap-3 transition-all text-left cursor-pointer ${
                    educationalErrors
                      ? 'border-[#8b5cf6]/60 bg-[#8b5cf6]/10'
                      : 'border-[#23252a] hover:border-[#383b3f]'
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-all ${
                    educationalErrors
                      ? 'bg-[#8b5cf6] border-[#8b5cf6] text-white'
                      : 'border-[#383b3f] bg-[#161718]'
                  }`}>
                    {educationalErrors && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="font-medium text-xs text-[#ffffff]">
                      Exibir dicas explicativas em português quando houver erros no console
                    </div>
                    <div className="text-[11px] text-[#8a8f98] mt-0.5 leading-normal">
                      Caso ocorra um erro de código ou execução, um card educativo explicará a causa exata e a solução.
                    </div>
                  </div>
                </button>
              </div>

              {/* UI Style Selector */}
              <div>
                <label className="block text-xs font-medium text-[#ffffff] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-[#d0d6e0]" />
                    <span>Estilo da Interface (UI Style)</span>
                  </span>
                </label>

                <div className="p-3 bg-[#08090a] border border-[#23252a] rounded-[8px] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#5e6ad2] shadow-[0_0_8px_#5e6ad2]" />
                    <span className="text-xs text-white font-medium">Padrão (Linear - Dark Midnight)</span>
                  </div>
                  <span className="text-[10px] text-[#8a8f98] italic font-mono">
                    Ativo
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#ffffff] hover:bg-[#d0d6e0] text-[#08090a] font-semibold text-xs rounded-[6px] transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer shadow-md"
                >
                  <Code2 className="w-4 h-4" />
                  <span>Assumir Comando e Iniciar Código!</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-1.5 text-[#8a8f98] hover:text-white text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Voltar para Nome do Programador</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer info */}
        <div className="px-6 py-2.5 bg-[#08090a] border-t border-[#23252a] flex items-center justify-between text-[10px] text-[#8a8f98] font-mono">
          <span>SISTEMA: ONLINE</span>
          <span>PROGRAMADOR: {nameInput.trim() || 'DEV MASTER'}</span>
        </div>

      </div>
    </div>
  );
};
