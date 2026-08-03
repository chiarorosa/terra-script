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
import { 
  PixelFiberIcon, 
  PixelWoodIcon, 
  PixelRootsIcon, 
  PixelFruitsIcon, 
  PixelEnergyIcon, 
  PixelBiomassIcon 
} from './PixelResourceIcon';

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
    <header className="h-13 bg-[#0f1011] border-b-2 border-[#23252a] flex items-center justify-between px-3 text-[#d0d6e0] select-none shrink-0 z-20 font-pixel-body text-xs">
      {/* App Branding */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 bg-[#08090a] pixel-box flex items-center justify-center p-1 group hover:brightness-125 transition-all cursor-pointer">
          <GameLogo className="w-6 h-6 pixelated" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-pixel-header text-xs tracking-tight text-[#ffffff]">TerraScript <span className="text-[#facc15]">3D</span></span>
            {onOpenWelcome && (
              <button
                onClick={onOpenWelcome}
                title="Clique para alterar seu nome de programador(a)"
                className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 pixel-btn text-[11px] text-[#d0d6e0] font-pixel-mono transition-all cursor-pointer"
              >
                <User className="w-3 h-3 text-[#22c55e]" />
                <span className="font-normal truncate max-w-[120px]">{programmerName}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 bg-[#08090a] p-1 pixel-box">
        <button
          onClick={() => setActiveTab('workspace')}
          className={`flex items-center gap-1.5 px-3 py-1 pixel-btn text-xs font-normal transition-all ${
            activeTab === 'workspace' 
              ? 'pixel-btn-amber text-[#0f172a]' 
              : 'text-[#8a8f98] hover:text-[#ffffff]'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          IDE
        </button>

        <button
          onClick={() => setActiveTab('research')}
          className={`relative flex items-center gap-1.5 px-3 py-1 pixel-btn text-xs font-normal transition-all ${
            activeTab === 'research' 
              ? 'pixel-btn-purple text-[#ffffff]' 
              : hasUpgrades
                ? 'pixel-btn-cyan text-[#083344]'
                : 'text-[#8a8f98] hover:text-[#ffffff]'
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5" />
          <span>Árvore de Pesquisa</span>
          {hasUpgrades && (
            <span className="ml-0.5 pixel-badge bg-[#a855f7] text-white">
              {unlockableCount}
            </span>
          )}
        </button>

        {(engine.isTechUnlocked('SCALE_5') || engine.isTechUnlocked('AUTO_6') || engine.getAgents().length > 1) && (
          <button
            onClick={() => setActiveTab('agents')}
            className={`flex items-center gap-1.5 px-3 py-1 pixel-btn text-xs font-normal transition-all ${
              activeTab === 'agents' 
                ? 'pixel-btn-cyan text-[#083344]' 
                : 'text-[#8a8f98] hover:text-[#ffffff]'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            Agentes ({engine.getAgents().length})
          </button>
        )}

        <button
          onClick={() => setActiveTab('tutorial')}
          className={`flex items-center gap-1.5 px-3 py-1 pixel-btn text-xs font-normal transition-all ${
            activeTab === 'tutorial' 
              ? 'pixel-btn-green text-[#052e16]' 
              : 'text-[#8a8f98] hover:text-[#ffffff]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Guia
        </button>
      </div>

      {/* Resource Indicators Bar (Progressive Disclosure) */}
      <div className="hidden lg:flex items-center gap-3 bg-[#08090a] px-3 py-1 pixel-box text-xs font-pixel-mono">
        <div className="flex items-center gap-1.5 text-[#facc15]" title="Fibra Selvagem">
          <PixelFiberIcon className="w-4 h-4" />
          <span>{resources.fiber}</span>
        </div>

        {(resources.wood > 0 || engine.isTechUnlocked('AGRO_2')) && (
          <>
            <div className="w-px h-3 bg-[#23252a]" />
            <div className="flex items-center gap-1.5 text-[#22c55e]" title="Madeira">
              <PixelWoodIcon className="w-4 h-4" />
              <span>{resources.wood}</span>
            </div>
          </>
        )}

        {(resources.roots > 0 || engine.isTechUnlocked('AGRO_3')) && (
          <>
            <div className="w-px h-3 bg-[#23252a]" />
            <div className="flex items-center gap-1.5 text-[#f97316]" title="Raízes Cultivadas">
              <PixelRootsIcon className="w-4 h-4" />
              <span>{resources.roots}</span>
            </div>
          </>
        )}

        {(resources.fruits > 0 || engine.isTechUnlocked('AGRO_5')) && (
          <>
            <div className="w-px h-3 bg-[#23252a]" />
            <div className="flex items-center gap-1.5 text-[#ef4444]" title="Frutas">
              <PixelFruitsIcon className="w-4 h-4" />
              <span>{resources.fruits}</span>
            </div>
          </>
        )}

        {(resources.energy > 0 || engine.isTechUnlocked('AGRO_6')) && (
          <>
            <div className="w-px h-3 bg-[#23252a]" />
            <div className="flex items-center gap-1.5 text-[#06b6d4]" title="Flor de Energia">
              <PixelEnergyIcon className="w-4 h-4" />
              <span>{resources.energy}</span>
            </div>
          </>
        )}

        {(resources.biomass > 0 || engine.isTechUnlocked('AGRO_7')) && (
          <>
            <div className="w-px h-3 bg-[#23252a]" />
            <div className="flex items-center gap-1.5 text-[#a855f7]" title="Biomassa">
              <PixelBiomassIcon className="w-4 h-4" />
              <span>{resources.biomass}</span>
            </div>
          </>
        )}
      </div>

      {/* Execution Controls */}
      <div className="flex items-center gap-2">
        {/* Speed Controls */}
        <div className="flex items-center gap-1 bg-[#08090a] px-1.5 py-0.5 pixel-box text-xs">
          {[1, 2].map(s => (
            <button
              key={s}
              onClick={() => engine.setSpeed(s)}
              className={`px-1.5 py-0.5 pixel-btn text-[10px] font-pixel-mono transition-all ${
                speed === s
                  ? 'pixel-btn-amber'
                  : 'text-[#8a8f98] hover:text-[#ffffff]'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {/* Audio Controls (SFX & Music) */}
        <div className="flex items-center gap-1 bg-[#08090a] p-0.5 pixel-box">
          <button
            onClick={handleToggleSfx}
            className={`p-1 pixel-btn text-xs transition-all ${
              !sfxMuted
                ? 'pixel-btn-green'
                : 'text-[#8a8f98]'
            }`}
            title={sfxMuted ? 'Ativar Efeitos Sonoros (SFX)' : 'Silenciar Efeitos Sonoros (SFX)'}
          >
            {!sfxMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-[#ef4444]" />}
          </button>

          <button
            onClick={handleToggleBgm}
            className={`p-1 pixel-btn text-xs transition-all flex items-center gap-1.5 px-2 ${
              bgmVolume === 1.0
                ? 'pixel-btn-purple'
                : bgmVolume === 0.5
                ? 'pixel-btn-cyan'
                : 'text-[#8a8f98]'
            }`}
            title={
              bgmVolume === 1.0
                ? 'Música de Fundo: 100% (Clique para 50%)'
                : bgmVolume === 0.5
                ? 'Música de Fundo: 50% (Clique para Mudo)'
                : 'Música de Fundo: Mudo (Clique para 100%)'
            }
          >
            <Music className={`w-3.5 h-3.5 ${bgmVolume === 0 ? 'text-[#ef4444]' : ''}`} />
            <span className="text-[10px] font-pixel-mono hidden md:inline">
              {bgmVolume === 1.0 ? 'Música 100%' : bgmVolume === 0.5 ? 'Música 50%' : 'Música Mudo'}
            </span>
            <span className="text-[10px] font-pixel-mono md:hidden">
              {bgmVolume === 1.0 ? '100%' : bgmVolume === 0.5 ? '50%' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Playback Buttons */}
        <div className="flex items-center gap-1.5">
          {mode === 'RUNNING' ? (
            <button
              onClick={() => engine.pauseSimulation()}
              className="flex items-center gap-1 px-3 py-1 pixel-btn pixel-btn-amber text-xs transition-all"
              title="Pausar Execução"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              Pausar
            </button>
          ) : (
            <button
              onClick={() => engine.startSimulation()}
              className="flex items-center gap-1 px-3 py-1 pixel-btn pixel-btn-green text-xs transition-all"
              title="Executar Código (F5)"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Run (F5)
            </button>
          )}

          <button
            onClick={() => engine.stepSimulation()}
            className="p-1.5 pixel-btn pixel-btn-cyan transition-all"
            title="Avançar Uma Linha (F10)"
          >
            <StepForward className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => engine.stopSimulation()}
            className="p-1.5 pixel-btn text-[#ef4444] hover:bg-[#ef4444]/20 transition-all"
            title="Parar & Reiniciar Execução (Shift+F5)"
          >
            <Square className="w-3.5 h-3.5 fill-current text-[#ef4444]" />
          </button>
        </div>
      </div>
    </header>
  );
};
