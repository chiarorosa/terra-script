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
  FlaskConical,
  TreePine,
  Wheat,
  Sprout,
  Apple,
  Flame,
  RotateCcw,
  Save,
  Download,
  Upload,
  Volume2,
  VolumeX,
  Music,
  User
} from 'lucide-react';
import { GameLogo } from './GameLogo';
import { GameEngine } from '../engine/GameEngine';
import { audioManager } from '../utils/audioManager';

interface HeaderBarProps {
  engine: GameEngine;
  activeTab: 'workspace' | 'research' | 'agents' | 'tutorial';
  setActiveTab: (tab: 'workspace' | 'research' | 'agents' | 'tutorial') => void;
  onOpenSaveManager?: () => void;
  onOpenWelcome?: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ engine, activeTab, setActiveTab, onOpenSaveManager, onOpenWelcome }) => {
  const resources = engine.getResources();
  const mode = engine.getMode();
  const speed = engine.getSpeed();
  const unlockableCount = engine.getUnlockableTechCount();
  const hasUpgrades = unlockableCount > 0;

  const programmerName = typeof window !== 'undefined' ? (localStorage.getItem('terrascript_programmer_name') || 'Dev Master') : 'Dev Master';

  const [sfxMuted, setSfxMuted] = useState(audioManager.getSfxMuted());
  const [bgmVolume, setBgmVolume] = useState<number>(audioManager.getBgmVolume());

  const handleToggleSfx = () => {
    const muted = audioManager.toggleSfx();
    setSfxMuted(muted);
    if (!muted) audioManager.playClick();
  };

  const handleToggleBgm = () => {
    const newVol = audioManager.cycleBgmVolume();
    setBgmVolume(newVol);
    if (!audioManager.getSfxMuted()) audioManager.playClick();
  };

  return (
    <header className="h-13 bg-[#0f1011] border-b border-[#23252a] flex items-center justify-between px-3 text-[#d0d6e0] select-none shrink-0 z-20 font-sans text-xs">
      {/* App Branding */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-[6px] bg-[#08090a] border border-[#23252a] flex items-center justify-center p-1 group hover:border-[#383b3f] transition-all cursor-pointer">
          <GameLogo className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-xs tracking-tight text-[#ffffff]">TerraScript <span className="text-[#27a644] font-semibold">3D</span></span>
            {onOpenWelcome && (
              <button
                onClick={onOpenWelcome}
                title="Clique para alterar seu nome de programador(a)"
                className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-[#161718] hover:bg-[#23252a] border border-[#23252a] hover:border-[#383b3f] text-[11px] text-[#d0d6e0] font-mono transition-all cursor-pointer"
              >
                <User className="w-3 h-3 text-[#27a644]" />
                <span className="font-normal truncate max-w-[120px]">{programmerName}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 bg-[#08090a] p-1 rounded-[6px] border border-[#23252a]">
        <button
          onClick={() => setActiveTab('workspace')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-normal transition-all ${
            activeTab === 'workspace' 
              ? 'bg-[#161718] text-[#ffffff] border border-[#23252a]' 
              : 'text-[#8a8f98] hover:text-[#ffffff] hover:bg-[#0f1011]'
          }`}
        >
          <Cpu className="w-3.5 h-3.5 text-[#02b8cc]" />
          IDE
        </button>

        <button
          onClick={() => setActiveTab('research')}
          className={`relative flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-normal transition-all ${
            activeTab === 'research' 
              ? 'bg-[#161718] text-[#ffffff] border border-[#23252a]' 
              : hasUpgrades
                ? 'bg-[#e4f222]/10 text-[#ffffff] border border-[#e4f222]/40 hover:bg-[#e4f222]/20'
                : 'text-[#8a8f98] hover:text-[#ffffff] hover:bg-[#0f1011]'
          }`}
        >
          <FlaskConical className={`w-3.5 h-3.5 ${hasUpgrades ? 'text-[#e4f222]' : 'text-[#8a8f98]'}`} />
          <span>Árvore de Pesquisa</span>
          {hasUpgrades && (
            <span className="ml-0.5 px-1.5 py-0.2 rounded-[4px] text-[10px] font-medium bg-[#e4f222] text-[#08090a]">
              {unlockableCount}
            </span>
          )}
        </button>

        {(engine.isTechUnlocked('SCALE_5') || engine.isTechUnlocked('AUTO_6') || engine.getAgents().length > 1) && (
          <button
            onClick={() => setActiveTab('agents')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-normal transition-all ${
              activeTab === 'agents' 
                ? 'bg-[#161718] text-[#ffffff] border border-[#23252a]' 
                : 'text-[#8a8f98] hover:text-[#ffffff] hover:bg-[#0f1011]'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-[#8b5cf6]" />
            Agentes ({engine.getAgents().length})
          </button>
        )}

        <button
          onClick={() => setActiveTab('tutorial')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-[6px] text-xs font-normal transition-all ${
            activeTab === 'tutorial' 
              ? 'bg-[#161718] text-[#ffffff] border border-[#23252a]' 
              : 'text-[#8a8f98] hover:text-[#ffffff] hover:bg-[#0f1011]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 text-[#27a644]" />
          Guia
        </button>
      </div>

      {/* Resource Indicators Bar (Progressive Disclosure) */}
      <div className="hidden lg:flex items-center gap-3 bg-[#08090a] px-3 py-1 rounded-[6px] border border-[#23252a] text-xs font-mono">
        <div className="flex items-center gap-1.5 text-[#e4f222]" title="Fibra Selvagem">
          <Wheat className="w-3.5 h-3.5 text-[#e4f222]" />
          <span>{resources.fiber}</span>
        </div>

        {(resources.wood > 0 || engine.isTechUnlocked('AGRO_3')) && (
          <>
            <div className="w-px h-3 bg-[#23252a]" />
            <div className="flex items-center gap-1.5 text-[#27a644]" title="Madeira">
              <TreePine className="w-3.5 h-3.5 text-[#27a644]" />
              <span>{resources.wood}</span>
            </div>
          </>
        )}

        {(resources.roots > 0 || engine.isTechUnlocked('AGRO_4')) && (
          <>
            <div className="w-px h-3 bg-[#23252a]" />
            <div className="flex items-center gap-1.5 text-[#f97316]" title="Raízes Cultivadas">
              <Sprout className="w-3.5 h-3.5 text-[#f97316]" />
              <span>{resources.roots}</span>
            </div>
          </>
        )}

        {(resources.fruits > 0 || engine.isTechUnlocked('AGRO_5')) && (
          <>
            <div className="w-px h-3 bg-[#23252a]" />
            <div className="flex items-center gap-1.5 text-[#eb5757]" title="Frutas">
              <Apple className="w-3.5 h-3.5 text-[#eb5757]" />
              <span>{resources.fruits}</span>
            </div>
          </>
        )}

        {(resources.energy > 0 || engine.isTechUnlocked('AGRO_6')) && (
          <>
            <div className="w-px h-3 bg-[#23252a]" />
            <div className="flex items-center gap-1.5 text-[#02b8cc]" title="Flor de Energia">
              <Zap className="w-3.5 h-3.5 text-[#02b8cc]" />
              <span>{resources.energy}</span>
            </div>
          </>
        )}

        {(resources.biomass > 0 || engine.isTechUnlocked('AGRO_7')) && (
          <>
            <div className="w-px h-3 bg-[#23252a]" />
            <div className="flex items-center gap-1.5 text-[#8b5cf6]" title="Biomassa">
              <Flame className="w-3.5 h-3.5 text-[#8b5cf6]" />
              <span>{resources.biomass}</span>
            </div>
          </>
        )}
      </div>

      {/* Execution Controls */}
      <div className="flex items-center gap-2">
        {/* Speed Controls */}
        <div className="flex items-center gap-1 bg-[#08090a] px-1.5 py-0.5 rounded-[6px] border border-[#23252a] text-xs">
          {[1, 2].map(s => (
            <button
              key={s}
              onClick={() => engine.setSpeed(s)}
              className={`px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono transition-all ${
                speed === s
                  ? 'bg-[#ffffff] text-[#08090a] font-medium'
                  : 'text-[#8a8f98] hover:text-[#ffffff] hover:bg-[#161718]'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Audio Controls (SFX & Music) */}
        <div className="flex items-center gap-1 bg-[#08090a] p-0.5 rounded-[6px] border border-[#23252a]">
          <button
            onClick={handleToggleSfx}
            className={`p-1 rounded-[4px] text-xs transition-all ${
              !sfxMuted
                ? 'text-[#27a644] bg-[#27a644]/10 border border-[#27a644]/30'
                : 'text-[#8a8f98] hover:text-[#d0d6e0]'
            }`}
            title={sfxMuted ? 'Ativar Efeitos Sonoros (SFX)' : 'Silenciar Efeitos Sonoros (SFX)'}
          >
            {!sfxMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-[#eb5757]" />}
          </button>

          <button
            onClick={handleToggleBgm}
            className={`p-1 rounded-[4px] text-xs transition-all flex items-center gap-1.5 px-2 ${
              bgmVolume === 1.0
                ? 'text-[#8b5cf6] bg-[#8b5cf6]/10 border border-[#8b5cf6]/30'
                : bgmVolume === 0.5
                ? 'text-[#a78bfa] bg-[#8b5cf6]/10 border border-[#8b5cf6]/20'
                : 'text-[#8a8f98] hover:text-[#d0d6e0] bg-[#161718] border border-[#23252a]'
            }`}
            title={
              bgmVolume === 1.0
                ? 'Música de Fundo: 100% (Clique para 50%)'
                : bgmVolume === 0.5
                ? 'Música de Fundo: 50% (Clique para Mudo)'
                : 'Música de Fundo: Mudo (Clique para 100%)'
            }
          >
            <Music className={`w-3.5 h-3.5 ${bgmVolume === 0 ? 'text-[#eb5757]' : ''}`} />
            <span className="text-[10px] font-mono hidden md:inline">
              {bgmVolume === 1.0 ? 'Música 100%' : bgmVolume === 0.5 ? 'Música 50%' : 'Música Mudo'}
            </span>
            <span className="text-[10px] font-mono md:hidden">
              {bgmVolume === 1.0 ? '100%' : bgmVolume === 0.5 ? '50%' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Playback Buttons */}
        <div className="flex items-center gap-1.5">
          {mode === 'RUNNING' ? (
            <button
              onClick={() => engine.pauseSimulation()}
              className="flex items-center gap-1 px-3 py-1 bg-[#ffffff] hover:bg-[#e5e5e6] text-[#08090a] rounded-[6px] text-xs font-medium transition-all active:scale-95"
              title="Pausar Execução"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              Pausar
            </button>
          ) : (
            <button
              onClick={() => engine.startSimulation()}
              className="flex items-center gap-1 px-3 py-1 bg-[#5e6ad2] hover:bg-[#5e6ad2]/90 text-[#ffffff] rounded-[6px] text-xs font-medium transition-all active:scale-95 shadow-[0_0_12px_rgba(94,106,210,0.3)]"
              title="Executar Código (F5)"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Run (F5)
            </button>
          )}

          <button
            onClick={() => engine.stepSimulation()}
            className="p-1.5 bg-[#161718] hover:bg-[#23252a] text-[#d0d6e0] rounded-[6px] transition-all active:scale-95 border border-[#23252a]"
            title="Avançar Uma Linha (F10)"
          >
            <StepForward className="w-3.5 h-3.5 text-[#02b8cc]" />
          </button>

          <button
            onClick={() => engine.stopSimulation()}
            className="p-1.5 bg-[#161718] hover:bg-[#eb5757]/20 text-[#8a8f98] hover:text-[#eb5757] rounded-[6px] transition-all active:scale-95 border border-[#23252a]"
            title="Parar & Reiniciar Execução (Shift+F5)"
          >
            <Square className="w-3.5 h-3.5 fill-current text-[#eb5757]" />
          </button>
        </div>
      </div>
    </header>
  );
};
