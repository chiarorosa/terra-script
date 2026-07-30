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
    <div className="w-full bg-[#0f1011] border-y border-[#23252a] px-3 py-1.5 flex items-center gap-3 text-xs select-none shrink-0 z-10 font-sans relative">
      {/* Prestige Level Badge */}
      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] bg-[#161718] border border-[#23252a] text-[#ffffff] font-medium text-xs shrink-0">
        <Trophy className="w-3.5 h-3.5 text-[#e4f222]" />
        <span className="text-[#8a8f98]">Nível</span>
        <span className="text-[#ffffff] font-mono text-xs font-semibold">{prestige.level}</span>
        <span className="text-[10px] text-[#62666d]">/100</span>
      </div>

      {/* Prestige Progress Bar Container */}
      <div className="flex-1 relative h-5 rounded-[6px] bg-[#08090a] border border-[#23252a] overflow-hidden flex items-center px-1 group cursor-pointer">
        {/* Progress Fill */}
        <div 
          className="absolute left-0 top-0 bottom-0 bg-[#e4f222] transition-all duration-300 rounded-[4px] shadow-[0_0_10px_rgba(228,242,34,0.3)]"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Text Overlay inside bar */}
        <div className="relative w-full flex items-center justify-between px-3 text-[11px] font-mono font-medium z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
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
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border transition-all text-[11px] font-medium cursor-pointer ${
            prestige.worldChangeUnlocked 
              ? 'border-[#23252a] bg-[#161718] text-[#ffffff] hover:border-[#383b3f]' 
              : 'border-[#23252a] bg-[#161718] text-[#8a8f98] hover:text-[#d0d6e0]'
          }`}
          title="Mudanças do Mundo"
        >
          <Globe className={`w-3.5 h-3.5 ${prestige.worldChangeUnlocked ? 'text-[#27a644]' : 'text-[#8a8f98]'}`} />
          <span className="hidden sm:inline">Mudança do Mundo</span>
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-80 bg-[#0f1011] border border-[#23252a] rounded-[12px] shadow-2xl p-3 z-50 text-xs space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#23252a]">
              <span className="font-medium text-[#ffffff] flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#02b8cc]" />
                Mudanças do Mundo
              </span>
              <span className="text-[10px] text-[#8a8f98]">Fenômenos Globais</span>
            </div>

            {/* List of World Changes */}
            <div className="space-y-2">
              <div className={`p-2.5 rounded-[8px] border transition-all ${
                prestige.worldChangeUnlocked 
                  ? 'bg-[#161718] border-[#383b3f]' 
                  : 'bg-[#08090a] border-[#23252a] opacity-75'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-xs text-[#ffffff] flex items-center gap-1.5">
                    {prestige.worldChangeUnlocked ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#27a644]" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-[#8a8f98]" />
                    )}
                    Bloco de Prestígio
                  </span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded-[4px] border ${
                    prestige.worldChangeUnlocked 
                      ? 'border-[#27a644]/30 text-[#27a644] bg-[#27a644]/10' 
                      : 'border-[#23252a] text-[#8a8f98] bg-[#161718]'
                  }`}>
                    {prestige.worldChangeUnlocked ? 'Ativo' : 'Latente'}
                  </span>
                </div>
                
                {/* Intriguing description */}
                <p className="text-[11px] text-[#8a8f98] leading-relaxed font-sans italic">
                  {prestige.worldChangeUnlocked 
                    ? '"Uma ressonância antiga despertou no ecossistema. Um ponto de convergência reluzente manifestou-se na terra."' 
                    : '"Transformação latente. Os pilares primordiais do conhecimento buscam equilíbrio para alterar a realidade do mundo."'
                  }
                </p>
              </div>
            </div>

            {/* Subtle clue footer */}
            <div className="pt-2 border-t border-[#23252a] text-[10px] text-[#8a8f98] font-sans leading-tight">
              Investigue a documentação, métodos de API e registros para encontrar pistas.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
