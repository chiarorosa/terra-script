import React from 'react';
import { Bot, Cpu, Play, Pause, FileCode, CheckCircle2 } from 'lucide-react';
import { GameEngine } from '../engine/GameEngine';
import { VirtualFS } from '../engine/virtualFs';

interface AgentsPanelProps {
  engine: GameEngine;
  vfs: VirtualFS;
}

export const AgentsPanel: React.FC<AgentsPanelProps> = ({ engine, vfs }) => {
  const agents = engine.getAgents();
  const files = vfs.getFiles();

  return (
    <div className="flex-1 bg-[#0d1117] p-6 overflow-y-auto font-sans text-[#c9d1d9]">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="border-b border-[#30363d] pb-4">
          <h1 className="text-xl font-bold text-[#f0f6fc] flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#bc8cff]" />
            Gerenciamento de Agentes Drones Paralelos
          </h1>
          <p className="text-xs text-[#8b949e] mt-1">
            Atribua arquivos de script independentes para cada drone robótico. Múltiplos agentes operam simultaneamente na fazenda 3D!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((ag) => (
            <div key={ag.id} className="bg-[#161b22] border border-[#30363d] rounded-lg p-4 space-y-3 shadow-md">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-2">
                <div className="flex items-center gap-2 font-bold text-sm text-[#f0f6fc]">
                  <span className="w-3 h-3 rounded-full shadow" style={{ backgroundColor: ag.color }} />
                  <span>{ag.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#010409] text-[#8b949e] border border-[#30363d]">
                    ID #{ag.id}
                  </span>
                </div>

                <span className={`text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded ${
                  ag.status === 'RUNNING' 
                    ? 'bg-[#238636]/20 text-[#3fb950] border border-[#238636]/50' 
                    : 'bg-[#010409] text-[#8b949e]'
                }`}>
                  {ag.status}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Coordenadas Atuais:</span>
                  <span className="text-[#f0f6fc] font-bold">({ag.x}, {ag.y})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Linha em Execução:</span>
                  <span className="text-[#3fb950] font-bold">Linha {ag.currentLine}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8b949e]">Última Ação:</span>
                  <span className="text-[#d29922] italic truncate max-w-[180px]">{ag.actionMessage || 'Ocioso'}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#30363d]">
                <label className="text-[11px] font-semibold text-[#8b949e] block mb-1">Arquivo de Script Atribuído:</label>
                <select
                  value={ag.assignedFile}
                  onChange={(e) => engine.assignAgentFile(ag.id, e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] text-xs rounded px-2 py-1.5 font-mono focus:border-[#58a6ff]"
                >
                  {files.map(f => (
                    <option key={f.path} value={f.path}>{f.name} ({f.language})</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
