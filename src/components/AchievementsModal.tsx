import React, { useState } from 'react';
import { 
  Trophy, 
  X, 
  Search, 
  Sparkles, 
  Code2, 
  Boxes, 
  Zap, 
  Bot, 
  Droplets, 
  Shovel, 
  FlaskConical, 
  Award, 
  Footprints, 
  Cpu, 
  ShieldCheck, 
  Flame, 
  HeartHandshake, 
  Compass, 
  Lock, 
  CheckCircle2,
  TreeDeciduous,
  Gift
} from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';
import { Achievement, AchievementCategory } from '../types/game';
import { audioManager } from '../utils/audioManager';
import { PixelGiftIcon } from './PixelGiftIcon';

interface AchievementsModalProps {
  engine: GameEngine;
  onClose: () => void;
}

const formatXP = (amount: number): string => {
  if (amount >= 1000) {
    const k = amount / 1000;
    return Number.isInteger(k) ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return `${amount}`;
};

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ engine, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterUnlockedOnly, setFilterUnlockedOnly] = useState<boolean>(false);
  const [, setTick] = useState(0);

  const forceUpdate = () => setTick(t => t + 1);

  const achievements = engine.getAchievements();

  const totalCount = achievements.length;
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const progressPercent = Math.round((unlockedCount / Math.max(1, totalCount)) * 100);

  const unclaimedAchievements = achievements.filter(a => a.unlocked && !a.claimed);
  const unclaimedCount = unclaimedAchievements.length;
  const totalUnclaimedXP = unclaimedAchievements.reduce((acc, a) => acc + (a.expReward || 100), 0);

  const handleClaim = (achId: string) => {
    audioManager.playLevelUp();
    engine.claimAchievementReward(achId);
    forceUpdate();
  };

  const handleClaimAll = () => {
    audioManager.playLevelUp();
    engine.claimAllAchievementRewards();
    forceUpdate();
  };

  // Helper to render dynamic Lucide Icon for achievement
  const renderIcon = (iconName: string, className: string) => {
    switch (iconName) {
      case 'Code2': return <Code2 className={className} />;
      case 'Boxes': return <Boxes className={className} />;
      case 'Zap': return <Zap className={className} />;
      case 'Bot': return <Bot className={className} />;
      case 'Sparkles': return <Sparkles className={className} />;
      case 'Droplets': return <Droplets className={className} />;
      case 'Shovel': return <Shovel className={className} />;
      case 'FlaskConical': return <FlaskConical className={className} />;
      case 'Award': return <Award className={className} />;
      case 'TreeTrunk': return <TreeDeciduous className={className} />;
      case 'Footprints': return <Footprints className={className} />;
      case 'Cpu': return <Cpu className={className} />;
      case 'Trophy': return <Trophy className={className} />;
      case 'ShieldCheck': return <ShieldCheck className={className} />;
      case 'Flame': return <Flame className={className} />;
      case 'HeartHandshake': return <HeartHandshake className={className} />;
      case 'Compass': return <Compass className={className} />;
      default: return <Award className={className} />;
    }
  };

  const getCategoryBadge = (cat: AchievementCategory) => {
    switch (cat) {
      case 'UI_UNLOCK':
        return <span className="text-xs font-pixel-mono px-2 py-0.5 bg-[#a855f7]/15 text-[#c084fc] border border-[#a855f7]/40 rounded font-bold">Desbloqueio de UI</span>;
      case 'MECHANIC':
        return <span className="text-xs font-pixel-mono px-2 py-0.5 bg-[#22c55e]/15 text-[#4ade80] border border-[#22c55e]/40 rounded font-bold">Mecânica de Jogo</span>;
      case 'STATS':
        return <span className="text-xs font-pixel-mono px-2 py-0.5 bg-[#facc15]/15 text-[#fde047] border border-[#facc15]/40 rounded font-bold">Estatística</span>;
      case 'SPECIAL':
        return <span className="text-xs font-pixel-mono px-2 py-0.5 bg-[#06b6d4]/15 text-[#22d3ee] border border-[#06b6d4]/40 rounded font-bold">Segredo / Especial</span>;
    }
  };

  const filteredAchievements = achievements.filter(ach => {
    if (selectedCategory !== 'ALL' && ach.category !== selectedCategory) return false;
    if (filterUnlockedOnly && !ach.unlocked) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ach.title.toLowerCase().includes(q);
      const matchDesc = ach.description.toLowerCase().includes(q);
      const matchReward = ach.rewardText ? ach.rewardText.toLowerCase().includes(q) : false;
      if (!matchTitle && !matchDesc && !matchReward) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-[#08090a]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200 font-pixel-body select-none">
      <div className="bg-[#0f1011] pixel-box-amber w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden border-2 border-[#facc15]">
        
        {/* Header Bar */}
        <div className="bg-[#08090a] p-4 border-b-2 border-[#23252a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#facc15]/10 text-[#facc15] pixel-box border border-[#facc15]/40 shrink-0">
              <Trophy className="w-6 h-6 text-[#facc15] drop-shadow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-pixel-header text-white tracking-wide">
                  Central de Conquistas & Desbloqueios
                </h2>
              </div>
              <p className="text-sm text-[#8a8f98] mt-0.5">
                Alcance metas, libere recursos da interface e domine a automação agro-planetária.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              audioManager.playClick();
              onClose();
            }}
            className="p-1.5 text-[#8a8f98] hover:text-white bg-[#161718] hover:bg-[#23252a] pixel-btn transition-all cursor-pointer"
            title="Fechar menu de conquistas"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Progress Overview Banner */}
        <div className="bg-[#141517] px-4 py-3 border-b border-[#23252a] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="w-full sm:w-auto flex flex-wrap items-center gap-3">
            <div className="text-sm font-pixel-mono text-[#d0d6e0]">
              <span className="text-[#8a8f98]">Progresso Total: </span>
              <strong className="text-[#facc15] text-base">{unlockedCount}</strong> / {totalCount} Conquistas ({progressPercent}%)
            </div>
            {unclaimedCount > 0 && (
              <button
                onClick={handleClaimAll}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#facc15] hover:bg-[#fef08a] text-[#0f172a] text-xs font-pixel-header font-bold rounded-xs border border-[#fef08a] shadow-sm active:scale-95 cursor-pointer transition-all animate-pulse"
                title="Coletar a experiência de todas as conquistas desbloqueadas de uma só vez"
              >
                <Gift className="w-4 h-4 text-[#0f172a]" />
                <span>COLETAR TODOS (+{formatXP(totalUnclaimedXP)} XP)</span>
              </button>
            )}
          </div>

          <div className="w-full sm:w-64 bg-[#08090a] h-3.5 pixel-box border border-[#23252a] p-0.5 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#eab308] to-[#facc15] transition-all duration-500 rounded-xs"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="p-3 bg-[#0c0d0e] border-b border-[#23252a] flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {(['ALL', 'UI_UNLOCK', 'MECHANIC', 'STATS', 'SPECIAL'] as const).map(cat => {
              const count = cat === 'ALL' 
                ? achievements.length 
                : achievements.filter(a => a.category === cat).length;

              const label = cat === 'ALL' 
                ? 'Todas' 
                : cat === 'UI_UNLOCK' ? 'Interface' 
                : cat === 'MECHANIC' ? 'Mecânicas' 
                : cat === 'STATS' ? 'Estatísticas' : 'Especiais';

              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => {
                    audioManager.playClick();
                    setSelectedCategory(cat);
                  }}
                  className={`px-3 py-1.5 pixel-btn text-xs font-pixel-mono font-bold transition-all cursor-pointer shrink-0 ${
                    isSelected 
                      ? 'pixel-btn-amber text-[#0f172a]' 
                      : 'text-[#8a8f98] hover:text-white hover:bg-[#161718]'
                  }`}
                >
                  {label} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Input & Checkbox Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-[#8a8f98] absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar conquistas..."
                className="w-full bg-[#08090a] border border-[#23252a] rounded-[4px] pl-8 pr-2 py-1 text-xs text-white font-pixel-body focus:outline-none focus:border-[#facc15]"
              />
            </div>

            <button
              onClick={() => {
                audioManager.playClick();
                setFilterUnlockedOnly(!filterUnlockedOnly);
              }}
              className={`px-2.5 py-1 pixel-btn text-xs font-pixel-mono font-bold transition-all cursor-pointer shrink-0 ${
                filterUnlockedOnly 
                  ? 'pixel-btn-green text-[#052e16]' 
                  : 'text-[#8a8f98] hover:text-white bg-[#161718]'
              }`}
              title="Filtrar apenas conquistas que você já desbloqueou"
            >
              Concluídas
            </button>
          </div>
        </div>

        {/* Achievements Single Column List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 bg-[#08090a]">
          {filteredAchievements.length === 0 ? (
            <div className="col-span-full py-12 text-center text-[#8a8f98] font-pixel-mono text-xs">
              Nenhuma conquista encontrada com os filtros selecionados.
            </div>
          ) : (
            filteredAchievements.map(ach => {
              const isSecretLocked = ach.secret && !ach.unlocked;

              return (
                <div
                  key={ach.id}
                  className={`p-3.5 pixel-box transition-all relative flex flex-col justify-between gap-2.5 ${
                    ach.unlocked
                      ? 'bg-[#121315] border-2 border-[#facc15]/80 shadow-[0_0_15px_rgba(250,204,21,0.12)]'
                      : 'bg-[#0f1011] border border-[#23252a] opacity-80 hover:opacity-100'
                  }`}
                >
                  {/* Top Bar inside card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`p-2.5 pixel-box shrink-0 ${
                        ach.unlocked
                          ? 'bg-[#facc15]/20 text-[#facc15] border border-[#facc15]/50'
                          : 'bg-[#161718] text-[#62666d] border border-[#23252a]'
                      }`}>
                        {isSecretLocked ? (
                          <Lock className="w-5 h-5 text-[#62666d]" />
                        ) : (
                          renderIcon(ach.icon, 'w-5 h-5')
                        )}
                      </div>

                      {/* Title & Description */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className={`font-pixel-header text-xs ${
                            ach.unlocked ? 'text-white' : 'text-[#a1a1aa]'
                          }`}>
                            {isSecretLocked ? 'Conquista Secreta (???)' : ach.title}
                          </h3>
                        </div>

                        <p className="text-xs sm:text-sm text-[#94a3b8] leading-snug font-pixel-body mt-1">
                          {isSecretLocked ? 'Realize ações misteriosas no jogo para desvendar este segredo.' : ach.description}
                        </p>
                      </div>
                    </div>

                    {/* Status Check / Claim Button */}
                    <div className="shrink-0 flex items-center gap-2">
                      {ach.unlocked ? (
                        ach.claimed ? (
                          <span className="flex items-center gap-1 text-xs font-pixel-mono text-[#22c55e] font-bold bg-[#22c55e]/15 px-2.5 py-1 border border-[#22c55e]/40 rounded-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" />
                            Coletado (+{formatXP(ach.expReward || 100)} XP)
                          </span>
                        ) : (
                          <button
                            onClick={() => handleClaim(ach.id)}
                            className="flex items-center gap-1.5 px-3 py-1 bg-[#facc15] hover:bg-[#fef08a] text-[#0f172a] font-pixel-header text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer rounded-xs border border-[#fef08a] animate-pulse"
                            title={`Coletar Experiência de Prestígio (+${formatXP(ach.expReward || 100)} XP)`}
                          >
                            <Gift className="w-3.5 h-3.5 text-[#0f172a]" />
                            <span>COLETAR (+{formatXP(ach.expReward || 100)} XP)</span>
                          </button>
                        )
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-pixel-mono text-[#71717a] font-bold bg-[#18181b] px-2.5 py-1 border border-[#27272a] rounded-xs">
                          <Lock className="w-3.5 h-3.5 text-[#71717a]" />
                          Bloqueado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar (if available and not unlocked) */}
                  {ach.progress && !ach.unlocked && !isSecretLocked && (
                    <div className="space-y-1 mt-1 bg-[#161718] p-2 rounded border border-[#23252a]">
                      <div className="flex items-center justify-between text-xs font-pixel-mono text-[#8a8f98]">
                        <span>Progresso:</span>
                        <span className="text-[#facc15] font-bold">
                          {ach.progress.current} / {ach.progress.max} {ach.progress.unit || ''}
                        </span>
                      </div>
                      <div className="w-full bg-[#08090a] h-2 rounded overflow-hidden">
                        <div 
                          className="bg-[#facc15] h-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.round((ach.progress.current / ach.progress.max) * 100))}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Reward Text or Hint Footer */}
                  <div className="pt-2 border-t border-[#23252a]/60 flex flex-wrap items-center justify-between gap-2 text-xs font-pixel-body">
                    <div className="flex items-center gap-2 min-w-0">
                      {getCategoryBadge(ach.category)}
                      {ach.rewardText && (
                        <span className="text-[#facc15] truncate font-pixel-mono text-xs flex items-center gap-1" title={ach.rewardText}>
                          <PixelGiftIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{ach.rewardText}</span>
                        </span>
                      )}
                    </div>

                    {!ach.unlocked && ach.hint && !isSecretLocked && (
                      <span className="text-[#94a3b8] italic truncate font-sans text-xs" title={ach.hint}>
                        Dica: {ach.hint}
                      </span>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-[#08090a] border-t-2 border-[#23252a]" />

      </div>
    </div>
  );
};
