import React from 'react';
import { Bot, Cpu, Play, Pause, FileCode, CheckCircle2, Star, Footprints, Sprout, Droplets, Shovel, BarChart2, Info } from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';
import { VirtualFS } from '../engine/virtualFs';
import { createDefaultAgentStats } from '../types/game';

interface AgentsPanelProps {
  engine: GameEngine;
  vfs: VirtualFS;
}

export const AgentsPanel: React.FC<AgentsPanelProps> = ({ engine, vfs }) => {
  const agents = engine.getAgents();
  const files = vfs.getFiles();
  const primaryAgentId = engine.getPrimaryAgentId();
  const isSys4Unlocked = engine.isTechUnlocked('SYS_4');

  return (
    <div className="flex-1 bg-[#08090a] p-6 overflow-y-auto font-sans text-[#d0d6e0]">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="border-b border-[#23252a] pb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-medium text-[#ffffff] flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#8b5cf6]" />
              Gerenciamento de Agentes e Telemetria
            </h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-mono flex items-center gap-1.5 border ${
              isSys4Unlocked
                ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30'
                : 'bg-[#161718] text-[#8a8f98] border-[#23252a]'
            }`}>
              <BarChart2 className="w-3.5 h-3.5" />
              {isSys4Unlocked ? 'Telemetria SYS_4 Ativa' : 'Leitura Via Código Requer SYS_4'}
            </span>
          </div>
          <p className="text-xs text-[#8a8f98] mt-1 flex items-center gap-1 flex-wrap leading-relaxed">
            <span>Sua frota de Naves Agentes alienígenas. Monitore o desempenho individual, histórico de ações e recursos coletados por cada worker desde o início. O Agente Principal (marcado com</span>
            <Star className="w-3 h-3 text-[#d0d6e0] fill-[#d0d6e0] inline shrink-0" />
            <span>) é acionado instantaneamente ao clicar no botão PLAY no Explorador.</span>
          </p>
        </div>

        {!isSys4Unlocked && (
          <div className="bg-[#161718] border border-[#23252a] rounded-[10px] p-3 text-xs text-[#8a8f98] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#8b5cf6] shrink-0 mt-0.5" />
            <div>
              <span className="text-[#ffffff] font-medium block mb-0.5">💡 Desbloqueio de Telemetria no Código (SYS_4):</span>
              Para ler esse dicionário de estatísticas chave-valor diretamente no seu código Python ou JavaScript usando <code className="text-[#8b5cf6] bg-[#0a0b0c] px-1 py-0.5 rounded border border-[#23252a]">sys.get_agent_stats()</code> ou <code className="text-[#8b5cf6] bg-[#0a0b0c] px-1 py-0.5 rounded border border-[#23252a]">agent.get_stats()</code>, pesquise o nó <strong className="text-[#ffffff]">Nível 4 de Sistemas e Depuração (SYS_4)</strong> na Árvore de Pesquisa.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {agents.map((ag) => {
            const isPrimary = ag.id === primaryAgentId;
            const stats = ag.stats || createDefaultAgentStats();
            const harvested = stats.harvestedResources || createDefaultAgentStats().harvestedResources;

            const resourceList = [
              { label: 'Fibra', key: 'fiber', value: harvested.fiber || 0, color: '#10b981' },
              { label: 'Madeira', key: 'wood', value: harvested.wood || 0, color: '#f59e0b' },
              { label: 'Raízes', key: 'roots', value: harvested.roots || 0, color: '#8b5cf6' },
              { label: 'Frutas', key: 'fruits', value: harvested.fruits || 0, color: '#ec4899' },
              { label: 'Energia', key: 'energy', value: harvested.energy || 0, color: '#eab308' },
              { label: 'Biomassa', key: 'biomass', value: harvested.biomass || 0, color: '#06b6d4' },
              { label: 'Cristais', key: 'crystals', value: harvested.crystals || 0, color: '#3b82f6' },
            ];

            return (
              <div key={ag.id} className="bg-[#0f1011] border border-[#23252a] rounded-[12px] p-4 space-y-4 relative flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-[#23252a] pb-2">
                    <div className="flex items-center gap-2 font-medium text-xs text-[#ffffff]">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ag.color }} />
                      <span className="text-sm font-semibold">{ag.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-[#161718] text-[#8a8f98] border border-[#23252a]">
                        ID #{ag.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isPrimary ? (
                        <span 
                          className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-[#161718] text-[#ffffff] border border-[#383b3f] font-medium flex items-center gap-1"
                          title="Agente Principal atrelado ao botão PLAY no Explorador"
                        >
                          <Star className="w-2.5 h-2.5 text-[#d0d6e0] fill-[#d0d6e0]" /> Principal
                        </span>
                      ) : (
                        <button
                          onClick={() => engine.setPrimaryAgentId(ag.id)}
                          className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-[#161718] text-[#8a8f98] hover:text-[#ffffff] border border-[#23252a] hover:border-[#383b3f] transition-all flex items-center gap-1"
                          title="Tornar este agente o Agente Principal do Explorador"
                        >
                          <Star className="w-2.5 h-2.5" /> Tornar Principal
                        </button>
                      )}

                      <span className={`text-[10px] uppercase font-medium font-mono px-2 py-0.5 rounded-[4px] ${
                        ag.status === 'RUNNING' 
                          ? 'bg-[#27a644]/10 text-[#27a644] border border-[#27a644]/30' 
                          : 'bg-[#161718] text-[#8a8f98]'
                      }`}>
                        {ag.status}
                      </span>
                    </div>
                  </div>

                  {/* Operational Status */}
                  <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-[#141516] p-2.5 rounded-[8px] border border-[#23252a]">
                    <div>
                      <span className="text-[#8a8f98] block text-[10px] uppercase">Posição</span>
                      <span className="text-[#ffffff] font-medium">({ag.x}, {ag.y})</span>
                    </div>
                    <div>
                      <span className="text-[#8a8f98] block text-[10px] uppercase">Linha</span>
                      <span className="text-[#27a644] font-medium">L#{ag.currentLine}</span>
                    </div>
                    <div>
                      <span className="text-[#8a8f98] block text-[10px] uppercase">Última Ação</span>
                      <span className="text-[#d0d6e0] truncate block max-w-[100px]" title={ag.actionMessage || 'Ocioso'}>
                        {ag.actionMessage || 'Ocioso'}
                      </span>
                    </div>
                  </div>

                  {/* Individual Statistics */}
                  <div className="space-y-2">
                    <h3 className="text-[11px] font-medium text-[#ffffff] uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-[#1f2125] pb-1">
                      <BarChart2 className="w-3.5 h-3.5 text-[#8b5cf6]" /> Estatísticas do Agente
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="bg-[#141516] p-2 rounded-[6px] border border-[#23252a] flex items-center justify-between">
                        <span className="text-[#8a8f98] flex items-center gap-1">
                          <Footprints className="w-3.5 h-3.5 text-[#3b82f6]" /> Passos:
                        </span>
                        <span className="text-[#ffffff] font-bold">{stats.stepsCount || 0}</span>
                      </div>

                      <div className="bg-[#141516] p-2 rounded-[6px] border border-[#23252a] flex items-center justify-between">
                        <span className="text-[#8a8f98] flex items-center gap-1">
                          <Sprout className="w-3.5 h-3.5 text-[#10b981]" /> Plantou:
                        </span>
                        <span className="text-[#ffffff] font-bold">{stats.plantedCount || 0}</span>
                      </div>

                      <div className="bg-[#141516] p-2 rounded-[6px] border border-[#23252a] flex items-center justify-between">
                        <span className="text-[#8a8f98] flex items-center gap-1">
                          <Droplets className="w-3.5 h-3.5 text-[#06b6d4]" /> Regou:
                        </span>
                        <span className="text-[#ffffff] font-bold">{stats.wateredCount || 0}</span>
                      </div>

                      <div className="bg-[#141516] p-2 rounded-[6px] border border-[#23252a] flex items-center justify-between">
                        <span className="text-[#8a8f98] flex items-center gap-1">
                          <Shovel className="w-3.5 h-3.5 text-[#f59e0b]" /> Arou:
                        </span>
                        <span className="text-[#ffffff] font-bold">{stats.tilledCount || 0}</span>
                      </div>
                    </div>

                    <div className="bg-[#141516] p-2 rounded-[6px] border border-[#23252a] flex items-center justify-between font-mono text-xs">
                      <span className="text-[#8a8f98] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#27a644]" /> Total Colhido:
                      </span>
                      <span className="text-[#27a644] font-bold">{stats.harvestedCount || 0} vezes</span>
                    </div>
                  </div>

                  {/* Resource Breakdown */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-[#8a8f98] block uppercase">Recursos Coletados desde o início:</span>
                    <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                      {resourceList.map(res => (
                        <div key={res.key} className="bg-[#141516] px-2 py-1 rounded border border-[#23252a] flex items-center justify-between">
                          <span className="text-[#8a8f98] flex items-center gap-1 text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: res.color }} />
                            {res.label}:
                          </span>
                          <span className={res.value > 0 ? 'text-[#ffffff] font-medium' : 'text-[#525866]'}>
                            {res.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#23252a]">
                  <label className="text-[11px] font-medium text-[#8a8f98] block mb-1">Arquivo de Script Atribuído:</label>
                  <select
                    value={ag.assignedFile}
                    onChange={(e) => engine.assignAgentFile(ag.id, e.target.value)}
                    className="w-full bg-[#161718] border border-[#23252a] text-[#d0d6e0] text-xs rounded-[6px] px-2 py-1.5 font-mono focus:border-[#383b3f]"
                  >
                    {files.map(f => (
                      <option key={f.path} value={f.path}>{f.name} ({f.language})</option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
