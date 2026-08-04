import React, { useState, useRef, useEffect } from 'react';
import { Trophy, ChevronDown, Globe, Lock, CheckCircle2 } from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';

interface PrestigeBarProps {
  engine: GameEngine;
}

export const PrestigeBar: React.FC<PrestigeBarProps> = ({ engine }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const prestige = engine.getPrestige();
  const reqPoints = engine.getRequiredPrestigePoints();
  const progressPercent = prestige.level >= 100 
    ? 100 
    : Math.min(100, Math.max(0, (prestige.points / reqPoints) * 100));

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="w-full bg-[#0f1011] border-y-2 border-[#23252a] px-3.5 py-2 flex items-center gap-3.5 text-sm select-none shrink-0 z-10 font-pixel-body relative">
      {/* Prestige Level Badge */}
      <div className="flex items-center gap-2 px-3 py-1 pixel-box-amber text-[#ffffff] font-medium text-xs sm:text-sm shrink-0">
        <Trophy className="w-4 h-4 text-[#facc15]" />
        <span className="text-[#fef08a] font-pixel-header text-xs">Nível</span>
        <span className="text-[#ffffff] font-pixel-mono text-base font-bold">{prestige.level}</span>
        <span className="text-xs text-[#fef08a]/80 font-mono">/100</span>
      </div>

      {/* Prestige Progress Bar Container */}
      <div className="flex-1 relative h-6 pixel-box bg-[#08090a] overflow-hidden flex items-center px-1 group cursor-pointer">
        {/* Progress Fill */}
        <div 
          className="absolute left-0 top-0 bottom-0 bg-[#facc15] transition-all duration-300 shadow-[inset_0_-2px_0_0_#b45309]"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Text Overlay inside bar */}
        <div className="relative w-full flex items-center justify-between px-3 text-xs sm:text-sm font-pixel-mono font-bold z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
          <span className="text-[#ffffff] font-bold">
            <span className="hidden sm:inline">Progresso de Prestígio</span>
          </span>

          <span className="text-[#ffffff] font-bold tracking-wide">
            {prestige.level >= 100 
              ? 'NÍVEL MÁXIMO ALCANÇADO!' 
              : `${prestige.points.toLocaleString()} / ${reqPoints.toLocaleString()} XP (${progressPercent.toFixed(1)}%)`
            }
          </span>
        </div>
      </div>

      {/* World Change Dropdown Container */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1 pixel-btn transition-all text-[11px] cursor-pointer ${
            prestige.worldChangeUnlocked 
              ? 'pixel-btn-amber text-[#0f172a]' 
              : 'text-[#8a8f98] hover:text-[#d0d6e0]'
          }`}
          title="Mudanças do Mundo"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-pixel-body">Mudança do Mundo</span>
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-80 bg-[#0f1011] pixel-box-amber p-3 z-50 text-xs space-y-2.5 font-pixel-body">
            <div className="flex items-center justify-between pb-2 border-b border-[#23252a]">
              <span className="font-pixel-header text-[10px] text-[#facc15] flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#06b6d4]" />
                Mudanças do Mundo
              </span>
              <span className="text-[10px] text-[#8a8f98] font-pixel-mono">Fenômenos Globais</span>
            </div>

            {/* List of World Changes */}
            <div className="space-y-2">
              <div className={`p-2.5 pixel-box transition-all ${
                prestige.worldChangeUnlocked 
                  ? 'bg-[#161718]' 
                  : 'bg-[#08090a] opacity-75'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-pixel-body text-xs text-[#ffffff] flex items-center gap-1.5">
                    {prestige.worldChangeUnlocked ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-[#8a8f98]" />
                    )}
                    Bloco de Prestígio
                  </span>
                  <span className={`text-[10px] font-pixel-mono px-1.5 py-0.2 pixel-badge ${
                    prestige.worldChangeUnlocked 
                      ? 'bg-[#22c55e] text-[#052e16]' 
                      : 'bg-[#23252a] text-[#8a8f98]'
                  }`}>
                    {prestige.worldChangeUnlocked ? 'Ativo' : 'Latente'}
                  </span>
                </div>
                
                {/* Intriguing description */}
                <p className="text-[11px] text-[#8a8f98] leading-relaxed font-pixel-body italic">
                  {prestige.worldChangeUnlocked 
                    ? '"Uma ressonância antiga despertou no ecossistema. Um ponto de convergência reluzente manifestou-se na terra."' 
                    : '"Transformação latente. Os pilares primordiais do conhecimento buscam equilíbrio para alterar a realidade do mundo."'
                  }
                </p>
              </div>
            </div>

            {/* Subtle clue footer */}
            <div className="pt-2 border-t border-[#23252a] text-[10px] text-[#8a8f98] font-pixel-body leading-tight">
              Investigue a documentação, métodos de API e registros para encontrar pistas.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

