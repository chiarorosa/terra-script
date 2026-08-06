import React, { useEffect, useState } from 'react';
import { 
  Trophy, 
  X, 
  RefreshCw, 
  Sparkles, 
  Coins, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  CloudUpload,
  User,
  Bot
} from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';
import { 
  fetchLeaderboard, 
  submitLeaderboardScore, 
  calculateWealthScore,
  LeaderboardEntry 
} from '../utils/supabaseClient';
import { PixelResourceIcon } from './PixelResourceIcon';

interface LeaderboardModalProps {
  engine: GameEngine;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ engine, onClose }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardSubTab, setLeaderboardSubTab] = useState<'prestige' | 'wealth'>('prestige');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmittingScore, setIsSubmittingScore] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const programmerName = typeof window !== 'undefined' 
    ? (localStorage.getItem('terrascript_programmer_name') || 'Dev Master') 
    : 'Dev Master';

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadLeaderboardData = async (rankingType: 'prestige' | 'wealth' = leaderboardSubTab) => {
    setIsLoading(true);
    setLeaderboardSubTab(rankingType);
    const res = await fetchLeaderboard(rankingType);
    if (res.success && res.entries) {
      setLeaderboard(res.entries);
    } else if (res.message) {
      showFeedback('error', res.message);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadLeaderboardData('prestige');
  }, []);

  const handleSubmitMyScore = async () => {
    setIsSubmittingScore(true);
    const resources = engine.getResources();
    const prestigeObj = engine.getPrestige();
    const prestigeLevel = prestigeObj.level;
    const prestigePoints = prestigeObj.totalPoints || 0;
    const agents = engine.getAgents().length;
    const techs = typeof engine.getUnlockedTechIds === 'function' 
      ? engine.getUnlockedTechIds().length 
      : (engine.getTechTree?.() || []).filter(t => t.unlocked).length;

    const res = await submitLeaderboardScore({
      playerName: programmerName,
      fiber: resources.fiber,
      wood: resources.wood,
      roots: resources.roots,
      fruits: resources.fruits,
      energy: resources.energy,
      biomass: resources.biomass,
      catalyst: resources.catalyst,
      crystals: resources.crystals,
      prestigeLevel: prestigeLevel,
      prestigePoints: prestigePoints,
      agentsCount: agents,
      techsUnlocked: techs
    });

    setIsSubmittingScore(false);

    if (res.success) {
      showFeedback('success', res.message);
      loadLeaderboardData(leaderboardSubTab);
    } else {
      showFeedback('error', res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 font-pixel-body">
      <div className="bg-[#0f1011] pixel-box-amber w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 bg-[#08090a] border-b-2 border-[#23252a] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 pixel-box bg-[#161718] flex items-center justify-center text-[#facc15]">
              <Trophy className="w-5 h-5 text-[#facc15]" />
            </div>
            <div>
              <h2 className="text-sm font-pixel-header text-[#ffffff] flex items-center gap-2">
                Leaderboard Global de Automatizadores
              </h2>
              <p className="text-xs text-[#8a8f98] font-pixel-body">
                Compita nos rankings globais de Prestígio Acumulado e Riqueza em Estoque
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#8a8f98] hover:text-[#ffffff] pixel-btn transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert Toast */}
        {notification && (
          <div className={`px-4 py-2.5 text-xs font-medium flex items-center gap-2 ${
            notification.type === 'success' 
              ? 'bg-[#27a644]/10 text-[#27a644] border-b border-[#27a644]/30' 
              : 'bg-[#eb5757]/10 text-[#eb5757] border-b border-[#eb5757]/30'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#27a644] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#eb5757] shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto">

          {/* User Record Sync Banner */}
          <div className="p-3.5 bg-[#161718] border border-[#facc15]/30 rounded-xl flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#facc15]/10 rounded-lg border border-[#facc15]/30 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-[#facc15]" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">{programmerName}</span>
                <span className="text-[11px] text-[#8a8f98] font-mono">
                  Prestígio: <strong className="text-[#facc15]">Nível {engine.getPrestige().level}</strong> ({engine.getPrestige().totalPoints || 0} EXP)
                </span>
              </div>
            </div>

            <button
              onClick={handleSubmitMyScore}
              disabled={isSubmittingScore}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#facc15] hover:bg-[#eab308] text-[#0f172a] rounded-lg text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md active:scale-95"
            >
              <CloudUpload className="w-4 h-4" />
              {isSubmittingScore ? 'Enviando...' : 'Publicar / Atualizar Meu Recorde'}
            </button>
          </div>

          {/* Sub-Tabs: Prestígio vs Riqueza */}
          <div className="flex items-center justify-between border-b border-[#23252a] pb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadLeaderboardData('prestige')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  leaderboardSubTab === 'prestige'
                    ? 'bg-[#facc15]/20 text-[#facc15] border border-[#facc15]/40'
                    : 'bg-[#161718] text-[#8a8f98] border border-[#23252a] hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Prestígio Mais Alto</span>
              </button>

              <button
                onClick={() => loadLeaderboardData('wealth')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  leaderboardSubTab === 'wealth'
                    ? 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40'
                    : 'bg-[#161718] text-[#8a8f98] border border-[#23252a] hover:text-white'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Maior Riqueza (Estoque)</span>
              </button>
            </div>

            <button
              onClick={() => loadLeaderboardData(leaderboardSubTab)}
              disabled={isLoading}
              className="flex items-center gap-1 px-2.5 py-1 text-xs text-[#8a8f98] hover:text-white bg-[#161718] border border-[#23252a] rounded-lg transition-all cursor-pointer"
              title="Atualizar Tabela"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#facc15]' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>

          {/* Formula Explanation for Wealth Ranking */}
          {leaderboardSubTab === 'wealth' && (
            <div className="p-2.5 bg-[#0284c7]/10 border border-[#0284c7]/30 rounded-lg text-[11px] text-[#7dd3fc] font-sans flex items-start gap-2">
              <Coins className="w-4 h-4 shrink-0 mt-0.5 text-[#38bdf8]" />
              <span>
                <strong className="text-white">Métrica de Riqueza Balanceada:</strong> Cálculo do estoque em inventário ponderado por complexidade (Fibra=1, Madeira=2, Raízes=3, Frutas=4, Energia=5, Biomassa=8, Catalisador=15, Cristais=25).
              </span>
            </div>
          )}

          {/* Leaderboard Table Container */}
          <div className="bg-[#161718] border border-[#23252a] rounded-xl p-4 space-y-3">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-[#8a8f98] flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#facc15]" />
                Carregando dados do Leaderboard global...
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8a8f98] bg-[#08090a] rounded-lg border border-[#23252a]">
                Nenhuma pontuação registrada neste ranking ainda. Seja o primeiro publicando sua pontuação acima!
              </div>
            ) : (
              <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1 font-pixel-mono text-xs">
                {/* Header based on active SubTab */}
                {leaderboardSubTab === 'prestige' ? (
                  <div className="grid grid-cols-12 px-3 py-1.5 text-[10px] text-[#8a8f98] uppercase tracking-wider font-bold border-b border-[#23252a]">
                    <span className="col-span-1">#</span>
                    <span className="col-span-4">Programador(a)</span>
                    <span className="col-span-2 text-center">Nível</span>
                    <span className="col-span-3 text-right">EXP Prestígio</span>
                    <span className="col-span-2 text-right">Agentes</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-12 px-3 py-1.5 text-[10px] text-[#8a8f98] uppercase tracking-wider font-bold border-b border-[#23252a]">
                    <span className="col-span-1">#</span>
                    <span className="col-span-4">Programador(a)</span>
                    <span className="col-span-3 text-right">Pontos Riqueza</span>
                    <span className="col-span-4 text-right">Amostra Estoque</span>
                  </div>
                )}

                {leaderboard.map((entry, idx) => {
                  const computedWealth = entry.wealth_score || calculateWealthScore(entry);
                  const computedExp = entry.prestige_points || ((entry.prestige_level || 1) * 100);

                  return (
                    <div key={entry.id || entry.player_name} className={`grid grid-cols-12 px-3 py-2 items-center rounded-lg border text-xs ${
                      idx === 0 ? 'bg-[#facc15]/10 border-[#facc15]/40 text-[#facc15]' :
                      idx === 1 ? 'bg-slate-800/40 border-slate-600 text-slate-200' :
                      idx === 2 ? 'bg-amber-950/30 border-amber-800/50 text-amber-300' :
                      'bg-[#08090a] border-[#23252a] text-[#d0d6e0]'
                    }`}>
                      <span className="col-span-1 font-bold">{idx + 1}º</span>
                      <span className="col-span-4 font-bold truncate flex items-center gap-1.5">
                        {idx === 0 && <Sparkles className="w-3.5 h-3.5 text-[#facc15] shrink-0" />}
                        {entry.player_name}
                      </span>

                      {leaderboardSubTab === 'prestige' ? (
                        <>
                          <span className="col-span-2 text-center font-bold text-amber-400">
                            Lv. {entry.prestige_level || 1}
                          </span>
                          <span className="col-span-3 text-right font-bold text-[#facc15]">
                            {computedExp.toLocaleString()} EXP
                          </span>
                          <span className="col-span-2 text-right text-[#a855f7] inline-flex items-center justify-end gap-1">
                            <Bot className="w-3.5 h-3.5 shrink-0 text-[#a855f7]" /> {entry.agents_count || 1}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="col-span-3 text-right font-bold text-[#38bdf8]">
                            {computedWealth.toLocaleString()} pts
                          </span>
                          <span className="col-span-4 text-right text-[11px] text-[#a1a1aa] font-mono truncate inline-flex items-center justify-end gap-2">
                            <span className="inline-flex items-center gap-0.5"><PixelResourceIcon type="fiber" className="w-3 h-3" />{entry.fiber || 0}</span>
                            <span className="inline-flex items-center gap-0.5"><PixelResourceIcon type="wood" className="w-3 h-3" />{entry.wood || 0}</span>
                            <span className="inline-flex items-center gap-0.5"><PixelResourceIcon type="energy" className="w-3 h-3" />{entry.energy || 0}</span>
                            {entry.crystals ? <span className="inline-flex items-center gap-0.5"><Sparkles className="w-3 h-3 text-cyan-400" />{entry.crystals}</span> : null}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#010409] border-t border-[#30363d] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
