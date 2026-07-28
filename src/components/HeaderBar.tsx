import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  StepForward, 
  Zap, 
  BookOpen, 
  Bot, 
  Cpu, 
  Gauge, 
  Sparkles,
  TreePine,
  Wheat,
  Sprout,
  Apple,
  RotateCcw,
  Save,
  Download,
  Upload,
  Volume2,
  VolumeX,
  Music
} from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';
import { audioManager } from '../utils/audioManager';

interface HeaderBarProps {
  engine: GameEngine;
  activeTab: 'workspace' | 'research' | 'agents' | 'tutorial';
  setActiveTab: (tab: 'workspace' | 'research' | 'agents' | 'tutorial') => void;
  onOpenSaveManager?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ engine, activeTab, setActiveTab, onOpenSaveManager }) => {
  const resources = engine.getResources();
  const mode = engine.getMode();
  const speed = engine.getSpeed();
  const unlockableCount = engine.getUnlockableTechCount();
  const hasUpgrades = unlockableCount > 0;

  const [sfxMuted, setSfxMuted] = useState(audioManager.getSfxMuted());
  const [bgmMuted, setBgmMuted] = useState(audioManager.getBgmMuted());

  const handleToggleSfx = () => {
    const muted = audioManager.toggleSfx();
    setSfxMuted(muted);
    if (!muted) audioManager.playClick();
  };

  const handleToggleBgm = () => {
    const muted = audioManager.toggleBgm();
    setBgmMuted(muted);
    if (!audioManager.getSfxMuted()) audioManager.playClick();
  };

  return (
    <header className="h-14 bg-[#161b22] border-b border-[#30363d] flex items-center justify-between px-4 text-[#c9d1d9] select-none shrink-0 z-20">
      {/* App Branding */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-[#238636] border border-[#2ea043]/40 flex items-center justify-center text-white shadow-sm">
          <Cpu className="w-5 h-5 text-[#f0f6fc]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-[#f0f6fc]">TerraScript <span className="text-[#3fb950] font-bold">3D</span></span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 bg-[#010409] p-1 rounded-md border border-[#30363d]">
        <button
          onClick={() => setActiveTab('workspace')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
            activeTab === 'workspace' 
              ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm' 
              : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-[#58a6ff]" />
          IDE & Farm 3D
        </button>

        <button
          onClick={() => setActiveTab('research')}
          className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
            activeTab === 'research' 
              ? 'bg-[#21262d] text-[#f0f6fc] border border-[#d29922]/60 shadow-sm' 
              : hasUpgrades
                ? 'bg-[#d29922]/20 text-[#e3b341] border border-[#d29922] shadow-[0_0_12px_rgba(210,153,34,0.35)] animate-pulse hover:bg-[#d29922]/30'
                : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]'
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${hasUpgrades ? 'text-[#e3b341]' : 'text-[#d29922]'}`} />
          <span>Árvore de Pesquisa</span>
          {hasUpgrades && (
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#d29922] text-[#010409]">
              {unlockableCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('agents')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
            activeTab === 'agents' 
              ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm' 
              : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-[#bc8cff]" />
          Drones ({engine.getAgents().length})
        </button>

        <button
          onClick={() => setActiveTab('tutorial')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
            activeTab === 'tutorial' 
              ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d] shadow-sm' 
              : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-[#3fb950]" />
          Guia
        </button>
      </div>

      {/* Resource Indicators Bar */}
      <div className="hidden lg:flex items-center gap-3 bg-[#010409] px-3 py-1 rounded-md border border-[#30363d] text-xs font-mono">
        <div className="flex items-center gap-1.5 text-[#d29922]" title="Fibra">
          <Wheat className="w-3.5 h-3.5" />
          <span>{resources.fiber}</span>
        </div>
        <div className="w-px h-3 bg-[#30363d]" />
        <div className="flex items-center gap-1.5 text-[#3fb950]" title="Madeira">
          <TreePine className="w-3.5 h-3.5" />
          <span>{resources.wood}</span>
        </div>
        <div className="w-px h-3 bg-[#30363d]" />
        <div className="flex items-center gap-1.5 text-[#e3b341]" title="Raízes">
          <Sprout className="w-3.5 h-3.5" />
          <span>{resources.roots}</span>
        </div>
        <div className="w-px h-3 bg-[#30363d]" />
        <div className="flex items-center gap-1.5 text-[#f85149]" title="Frutas">
          <Apple className="w-3.5 h-3.5" />
          <span>{resources.fruits}</span>
        </div>
        <div className="w-px h-3 bg-[#30363d]" />
        <div className="flex items-center gap-1.5 text-[#58a6ff]" title="Energia">
          <Zap className="w-3.5 h-3.5" />
          <span>{resources.energy}</span>
        </div>
      </div>

      {/* Execution Controls */}
      <div className="flex items-center gap-2.5">
        {/* Save / Export Manager Button */}
        {onOpenSaveManager && (
          <button
            onClick={onOpenSaveManager}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] hover:text-[#79c0ff] border border-[#30363d] rounded-md text-xs font-semibold transition-all active:scale-95"
            title="Exportar / Importar Save e Baixar Scripts"
          >
            <Save className="w-3.5 h-3.5 text-[#3fb950]" />
            <span className="hidden md:inline">Save & Scripts</span>
          </button>
        )}

        {/* Speed Controls */}
        <div className="flex items-center gap-2 bg-[#010409] px-2.5 py-1 rounded-md border border-[#30363d] text-xs">
          <span className="text-[#8b949e] font-mono text-[11px]">Velocidade:</span>
          <div className="flex items-center gap-1">
            {[1, 2].map(s => (
              <button
                key={s}
                onClick={() => engine.setSpeed(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all ${
                  speed === s
                    ? 'bg-[#238636] text-[#f0f6fc] font-bold'
                    : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Audio Controls (SFX & Music) */}
        <div className="flex items-center gap-1 bg-[#010409] p-1 rounded-md border border-[#30363d]">
          <button
            onClick={handleToggleSfx}
            className={`p-1 rounded text-xs transition-all ${
              !sfxMuted
                ? 'text-[#3fb950] bg-[#238636]/20 border border-[#2ea043]/40'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
            title={sfxMuted ? 'Ativar Efeitos Sonoros (SFX)' : 'Silenciar Efeitos Sonoros (SFX)'}
          >
            {!sfxMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-[#f85149]" />}
          </button>

          <button
            onClick={handleToggleBgm}
            className={`p-1 rounded text-xs transition-all flex items-center gap-1 px-1.5 ${
              !bgmMuted
                ? 'text-[#bc8cff] bg-[#bc8cff]/20 border border-[#bc8cff]/40'
                : 'text-[#8b949e] hover:text-[#c9d1d9]'
            }`}
            title={bgmMuted ? 'Ativar Música de Fundo (Lo-Fi)' : 'Pausar Música de Fundo (Lo-Fi)'}
          >
            <Music className="w-3.5 h-3.5" />
            <span className="text-[10px] font-medium hidden md:inline">Música</span>
          </button>
        </div>

        {/* Playback Buttons */}
        <div className="flex items-center gap-1.5">
          {mode === 'RUNNING' ? (
            <button
              onClick={() => engine.pauseSimulation()}
              className="flex items-center gap-1 px-3 py-1.5 bg-[#d29922] hover:bg-[#bb8009] text-[#0d1117] rounded-md text-xs font-semibold shadow-sm transition-all active:scale-95"
              title="Pausar Execução"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              Pausar
            </button>
          ) : (
            <button
              onClick={() => engine.startSimulation()}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white border border-[#3fb950]/30 rounded-md text-xs font-semibold shadow-sm transition-all active:scale-95"
              title="Executar Código (F5)"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Run (F5)
            </button>
          )}

          <button
            onClick={() => engine.stepSimulation()}
            className="p-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-md transition-all active:scale-95 border border-[#30363d]"
            title="Avançar Uma Linha (F10)"
          >
            <StepForward className="w-4 h-4 text-[#58a6ff]" />
          </button>

          <button
            onClick={() => engine.stopSimulation()}
            className="p-1.5 bg-[#21262d] hover:bg-[#da3633]/20 text-[#8b949e] hover:text-[#f85149] rounded-md transition-all active:scale-95 border border-[#30363d]"
            title="Parar & Reiniciar Execução (Shift+F5)"
          >
            <Square className="w-4 h-4 fill-current text-[#f85149]" />
          </button>
        </div>
      </div>
    </header>
  );
};
