import React, { useState, useRef, useEffect } from 'react';
import { Trophy, Award, ChevronDown, Sparkles, Globe, Lock, CheckCircle2 } from 'lucide-react';
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
    <div className="w-full bg-[#0d1117]/95 border-y border-[#d29922]/30 px-3 py-1.5 flex items-center gap-3 text-xs select-none shadow-inner shrink-0 z-10 backdrop-blur-sm relative">
      {/* Prestige Level Badge */}
      <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-gradient-to-r from-[#d29922]/20 to-[#e3b341]/30 border border-[#d29922]/60 text-[#f0f6fc] font-bold text-xs shrink-0 shadow-sm">
        <Trophy className="w-3.5 h-3.5 text-[#e3b341] animate-bounce" />
        <span className="text-[#e3b341]">Nível</span>
        <span className="text-[#f0f6fc] font-mono text-sm">{prestige.level}</span>
        <span className="text-[10px] text-[#8b949e]">/100</span>
      </div>

      {/* Prestige Progress Bar Container */}
      <div className="flex-1 relative h-5 rounded-full bg-[#161b22] border border-[#30363d] overflow-hidden flex items-center px-1 shadow-inner group cursor-pointer">
        {/* Progress Fill */}
        <div 
          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#d29922] via-[#e3b341] to-[#f1e05a] transition-all duration-300 rounded-full shadow-[0_0_10px_rgba(210,153,34,0.5)]"
          style={{ width: `${progressPercent}%` }}
        />

        {/* Text Overlay inside bar */}
        <div className="relative w-full flex items-center justify-between px-3 text-[11px] font-mono font-semibold z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          <span className="text-[#f0f6fc]">
            <span className="hidden sm:inline">Progresso de Prestígio</span>
          </span>

          <span className="text-[#ffffff] font-bold tracking-wider">
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
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all text-[11px] font-medium cursor-pointer ${
            prestige.worldChangeUnlocked 
              ? 'border-[#d29922]/60 bg-[#161b22] text-[#e3b341] hover:bg-[#d29922]/10 shadow-[0_0_10px_rgba(210,153,34,0.2)]' 
              : 'border-[#30363d] bg-[#161b22] text-[#8b949e] hover:bg-[#21262d]'
          }`}
          title="Mudanças do Mundo"
        >
          <Globe className={`w-3.5 h-3.5 ${prestige.worldChangeUnlocked ? 'text-[#e3b341]' : 'text-[#8b949e]'}`} />
          <span className="hidden sm:inline">Mudança do Mundo</span>
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-80 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl p-3 z-50 text-xs space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-[#30363d]">
              <span className="font-bold text-[#f0f6fc] flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#e3b341]" />
                Mudanças do Mundo
              </span>
              <span className="text-[10px] text-[#8b949e]">Fenômenos Globais</span>
            </div>

            {/* List of World Changes */}
            <div className="space-y-2">
              <div className={`p-2.5 rounded-lg border transition-all ${
                prestige.worldChangeUnlocked 
                  ? 'bg-[#0d1117] border-[#d29922]/50 shadow-[0_0_12px_rgba(210,153,34,0.1)]' 
                  : 'bg-[#0d1117]/60 border-[#30363d] opacity-75'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-[#f0f6fc] flex items-center gap-1.5">
                    {prestige.worldChangeUnlocked ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#3fb950]" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-[#8b949e]" />
                    )}
                    O Bloco Reluzente
                  </span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                    prestige.worldChangeUnlocked 
                      ? 'border-[#3fb950]/40 text-[#3fb950] bg-[#3fb950]/10' 
                      : 'border-[#8b949e]/40 text-[#8b949e] bg-[#8b949e]/10'
                  }`}>
                    {prestige.worldChangeUnlocked ? 'Ativo' : 'Latente'}
                  </span>
                </div>
                
                {/* Intriguing description */}
                <p className="text-[11px] text-[#8b949e] leading-relaxed font-sans italic">
                  {prestige.worldChangeUnlocked 
                    ? '"Uma ressonância antiga despertou no ecossistema. Um ponto de convergência reluzente manifestou-se na terra."' 
                    : '"Transformação latente. Os pilares primordiais do conhecimento buscam equilíbrio para alterar a realidade do mundo."'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
