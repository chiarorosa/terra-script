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
    <div className="fixed inset-0 z-50 bg-[#08090a]/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 font-pixel-body select-none">
      <div className="bg-[#0f1011] pixel-box-amber w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* Banner Header */}
        <div className="bg-[#08090a] p-5 border-b-2 border-[#23252a] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Bot className="w-40 h-40 text-[#ffffff]" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 pixel-box bg-[#161718] text-[#22c55e] shrink-0">
                <Rocket className="w-5 h-5" />
              </div>
              <div>
                <span className="pixel-badge bg-[#22c55e] text-[#052e16] font-bold">
                  Estação Agro-Planetária
                </span>
                <h2 className="text-sm font-pixel-header text-[#ffffff] tracking-tight mt-1">
                  Boas-vindas ao TerraScript 3D!
                </h2>
              </div>
            </div>

            {/* Step Badge */}
            <div className="px-2.5 py-1 pixel-badge bg-[#161718] text-[#8a8f98]">
              Etapa <span className="text-white font-bold">{step}</span>/2
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs leading-relaxed text-[#d0d6e0] max-h-[65vh] overflow-y-auto font-pixel-body">
          
          {step === 1 ? (
            /* STEP 1: Name & Introduction */
            <form onSubmit={handleNextStep} className="space-y-4 animate-in fade-in slide-in-from-right-3 duration-200">
              <div className="p-3.5 pixel-box bg-[#161718] space-y-2">
                <p className="font-pixel-header text-xs text-[#facc15]">
                  Saudações, nobre Programador(a) das Naves ETs!
                </p>
                <p className="text-[#8a8f98] font-pixel-body text-xs">
                  A Terra foi colonizada por seres extraterrestres avançados para o cultivo biotecnológico planetário. Sua missão é criar scripts em <span className="text-[#ffffff] font-pixel-mono font-medium">Python</span> e <span className="text-[#ffffff] font-pixel-mono font-medium">JavaScript</span> para comandar nossas Naves de Trabalho e cultivar todo este quadrante!
                </p>
              </div>

              <div>
                <label className="block text-xs font-pixel-body text-[#ffffff] mb-1.5 flex items-center justify-between">
                  <span>Como deseja ser chamado(a) no Painel de Controle?</span>
                  <span className="text-[10px] text-[#8a8f98]">Identificação do(a) Dev</span>
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
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#08090a] pixel-box focus:border-[#facc15] text-[#ffffff] font-pixel-mono text-xs outline-none transition-all placeholder:text-[#62666d]"
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
                      className={`px-2.5 py-1 pixel-btn text-[10px] transition-all cursor-pointer ${
                        nameInput === title
                          ? 'pixel-btn-amber text-[#0f172a]'
                          : 'text-[#8a8f98] hover:text-[#ffffff]'
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
                  className="w-full py-2.5 pixel-btn pixel-btn-amber font-pixel-header text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
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
              <div className="p-3.5 pixel-box-amber bg-[#0f1011] space-y-1.5 relative overflow-hidden">
                <div className="flex items-center gap-2 text-[#facc15] font-pixel-header text-xs">
                  <div className="p-1.5 bg-[#facc15]/20 shrink-0">
                    <Layers className="w-4 h-4 text-[#facc15]" />
                  </div>
                  <span className="text-white text-xs font-pixel-header">
                    Evolução Progressiva da Interface
                  </span>
                  <Sparkles className="w-3.5 h-3.5 text-[#facc15] ml-auto animate-pulse" />
                </div>
                <p className="text-[11px] text-[#d0d6e0] leading-relaxed font-pixel-body">
                  <strong>A interface do jogo evolui junto com o seu progresso!</strong> Novos menus, botões avançados, barra de prestígio e robôs de frota surgirão organicamente à medida que você explora o código e desbloqueia pesquisas.
                </p>
              </div>

              {/* Educational Errors Toggle */}
              <div>
                <label className="block text-xs font-pixel-body text-[#ffffff] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-[#a855f7]" />
                    <span>Auxílio Educativo para Erros (Modo Iniciante)</span>
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => setEducationalErrors(!educationalErrors)}
                  className={`w-full p-3 pixel-box flex items-start gap-3 transition-all text-left cursor-pointer ${
                    educationalErrors
                      ? 'bg-[#a855f7]/20 border-[#a855f7]'
                      : 'bg-[#08090a]'
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 flex items-center justify-center shrink-0 transition-all ${
                    educationalErrors
                      ? 'bg-[#a855f7] text-white'
                      : 'bg-[#161718]'
                  }`}>
                    {educationalErrors && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="font-pixel-header text-xs text-[#ffffff]">
                      Exibir dicas explicativas em português quando houver erros no console
                    </div>
                    <div className="text-[11px] text-[#8a8f98] mt-0.5 leading-normal font-pixel-body">
                      Caso ocorra um erro de código ou execução, um card educativo explicará a causa exata e a solução.
                    </div>
                  </div>
                </button>
              </div>

              {/* UI Style Selector */}
              <div>
                <label className="block text-xs font-pixel-body text-[#ffffff] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-[#d0d6e0]" />
                    <span>Estilo da Interface (UI Style)</span>
                  </span>
                </label>

                <div className="p-3 bg-[#08090a] pixel-box-amber flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-[#facc15] shadow-[0_0_8px_#facc15]" />
                    <span className="text-xs text-white font-pixel-header">Pixel Art UI Arcade (v2.6.0)</span>
                  </div>
                  <span className="text-[10px] text-[#facc15] font-pixel-mono">
                    Ativo
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full py-2.5 pixel-btn pixel-btn-green font-pixel-header text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Code2 className="w-4 h-4" />
                  <span>Assumir Comando e Iniciar Código!</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full py-1.5 text-[#8a8f98] hover:text-white text-[11px] flex items-center justify-center gap-1 transition-all cursor-pointer font-pixel-body"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Voltar para Nome do Programador</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer info */}
        <div className="px-6 py-2.5 bg-[#08090a] border-t-2 border-[#23252a] flex items-center justify-between text-[10px] text-[#8a8f98] font-pixel-mono">
          <span>SISTEMA: ONLINE</span>
          <span>PROGRAMADOR: {nameInput.trim() || 'DEV MASTER'}</span>
        </div>

      </div>
    </div>
  );
};
