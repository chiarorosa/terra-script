import React from 'react';
import { Bot, Cpu, Play, Pause, FileCode, CheckCircle2, Star } from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';
import { VirtualFS } from '../engine/virtualFs';

interface AgentsPanelProps {
  engine: GameEngine;
  vfs: VirtualFS;
}

export const AgentsPanel: React.FC<AgentsPanelProps> = ({ engine, vfs }) => {
  const agents = engine.getAgents();
  const files = vfs.getFiles();
  const primaryAgentId = engine.getPrimaryAgentId();

  return (
    <div className="flex-1 bg-[#08090a] p-6 overflow-y-auto font-sans text-[#d0d6e0]">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="border-b border-[#23252a] pb-4">
          <h1 className="text-lg font-medium text-[#ffffff] flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#8b5cf6]" />
            Gerenciamento de Drones e Threads
          </h1>
          <p className="text-xs text-[#8a8f98] mt-1 flex items-center gap-1 flex-wrap leading-relaxed">
            <span>Sua frota de subprocessos concorrentes. Configure threads dedicadas de TerraScript para rodar em paralelo, monitore a posição de cada worker e defina qual drone executa o script principal. O Drone Principal (marcado com</span>
            <Star className="w-3 h-3 text-[#d0d6e0] fill-[#d0d6e0] inline shrink-0" />
            <span>) é acionado instantaneamente ao clicar no botão PLAY no Explorador.</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((ag) => {
            const isPrimary = ag.id === primaryAgentId;

            return (
              <div key={ag.id} className="bg-[#0f1011] border border-[#23252a] rounded-[12px] p-4 space-y-3 relative">
                <div className="flex items-center justify-between border-b border-[#23252a] pb-2">
                  <div className="flex items-center gap-2 font-medium text-xs text-[#ffffff]">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ag.color }} />
                    <span>{ag.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-[#161718] text-[#8a8f98] border border-[#23252a]">
                      ID #{ag.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isPrimary ? (
                      <span 
                        className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-[#161718] text-[#ffffff] border border-[#383b3f] font-medium flex items-center gap-1"
                        title="Drone Principal atrelado ao botão PLAY no Explorador"
                      >
                        <Star className="w-2.5 h-2.5 text-[#d0d6e0] fill-[#d0d6e0]" /> Principal
                      </span>
                    ) : (
                      <button
                        onClick={() => engine.setPrimaryAgentId(ag.id)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-[#161718] text-[#8a8f98] hover:text-[#ffffff] border border-[#23252a] hover:border-[#383b3f] transition-all flex items-center gap-1"
                        title="Tornar este drone o Drone Principal do Explorador"
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

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-[#8a8f98]">Coordenadas Atuais:</span>
                  <span className="text-[#ffffff] font-medium">({ag.x}, {ag.y})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8a8f98]">Linha em Execução:</span>
                  <span className="text-[#27a644] font-medium">Linha {ag.currentLine}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8a8f98]">Última Ação:</span>
                  <span className="text-[#d0d6e0] italic truncate max-w-[180px]">{ag.actionMessage || 'Ocioso'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#23252a]">
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
