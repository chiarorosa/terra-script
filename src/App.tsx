import React, { useEffect, useMemo, useState } from 'react';
import { VirtualFS } from './engine/virtualFs';
import { GameEngine } from './engine/GameEngine';
import { HeaderBar } from './components/HeaderBar';
import { ExplorerPanel } from './components/ExplorerPanel';
import { CodeEditor } from './components/CodeEditor';
import { World3DCanvas } from './components/World3DCanvas';
import { BottomPanel } from './components/BottomPanel';
import { TechTreeModal } from './components/TechTreeModal';
import { AgentsPanel } from './components/AgentsPanel';
import { TutorialModal } from './components/TutorialModal';
import { SaveManagerModal } from './components/SaveManagerModal';
import { audioManager } from './utils/audioManager';

export default function App() {
  const vfs = useMemo(() => new VirtualFS(), []);
  const engine = useMemo(() => new GameEngine(vfs), [vfs]);

  const [, setRenderTick] = useState(0);
  const [activeFilePath, setActiveFilePath] = useState<string>('main.py');
  const [activeTab, setActiveTab] = useState<'workspace' | 'research' | 'agents' | 'tutorial'>('workspace');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);

  // Kickstart audio on initial user interaction
  useEffect(() => {
    const handleGesture = () => {
      audioManager.toggleAudioOnUserGesture();
    };
    window.addEventListener('click', handleGesture, { once: true });
    window.addEventListener('keydown', handleGesture, { once: true });
    return () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('keydown', handleGesture);
    };
  }, []);

  // Subscribe to engine state updates (throttled to animation frames for maximum UI responsiveness & low CPU usage)
  useEffect(() => {
    let animFrameId: number | null = null;
    let isPending = false;

    const unsubscribe = engine.subscribe(() => {
      if (!isPending) {
        isPending = true;
        animFrameId = requestAnimationFrame(() => {
          setRenderTick(t => t + 1);
          isPending = false;
        });
      }
    });

    return () => {
      unsubscribe();
      if (animFrameId !== null) cancelAnimationFrame(animFrameId);
    };
  }, [engine]);

  // World Simulation interval timer (runs continuously for world growth regardless of code execution mode)
  useEffect(() => {
    const speed = engine.getSpeed();
    const delayMs = speed === 2 ? 150 : 300;
    const intervalId = setInterval(() => {
      engine.tick();
    }, delayMs);

    return () => clearInterval(intervalId);
  }, [engine, engine.getSpeed()]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F5') {
        e.preventDefault();
        if (e.shiftKey) {
          engine.stopSimulation();
        } else {
          if (engine.getMode() === 'RUNNING') engine.pauseSimulation();
          else engine.startSimulation();
        }
      } else if (e.key === 'F10') {
        e.preventDefault();
        engine.stepSimulation();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [engine]);

  const activeFile = vfs.getFile(activeFilePath) || vfs.getEntrypoint();

  // Active executing line for agent assigned to current file
  const activeAgent = engine.getAgents().find(a => a.assignedFile === activeFilePath && a.status === 'RUNNING')
    || engine.getAgents().find(a => a.assignedFile === activeFilePath && a.status === 'PAUSED')
    || engine.getAgents().find(a => a.assignedFile === activeFilePath);
  const activeLine = activeAgent ? activeAgent.currentLine : undefined;

  return (
    <div className="w-screen h-screen flex flex-col bg-[#0d1117] text-[#c9d1d9] font-sans overflow-hidden select-none">
      {/* Top Header Toolbar */}
      <HeaderBar
        engine={engine}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSaveManager={() => setIsSaveModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {activeTab === 'workspace' && (
          <div className="w-full h-full flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 flex overflow-hidden">
              {/* Left Explorer Panel */}
              <ExplorerPanel
                vfs={vfs}
                engine={engine}
                activeFilePath={activeFile ? activeFile.path : 'main.py'}
                onSelectFile={(path) => setActiveFilePath(path)}
                onOpenSaveManager={() => setIsSaveModalOpen(true)}
              />

              {/* Middle Code Editor */}
              {activeFile ? (
                <CodeEditor
                  file={activeFile}
                  vfs={vfs}
                  engine={engine}
                  activeLine={activeLine}
                  onCodeChange={() => setRenderTick(t => t + 1)}
                />
              ) : (
                <div className="flex-1 bg-slate-950 flex items-center justify-center text-slate-500 font-mono text-sm">
                  Selecione ou crie um arquivo para começar a editar o código.
                </div>
              )}

              {/* Right 3D World Canvas View */}
              <World3DCanvas engine={engine} />
            </div>

            {/* Bottom Toggleable Output & Profiler Panel */}
            <BottomPanel engine={engine} />
          </div>
        )}

        {activeTab === 'research' && <TechTreeModal engine={engine} />}

        {activeTab === 'agents' && <AgentsPanel engine={engine} vfs={vfs} />}

        {activeTab === 'tutorial' && (
          <TutorialModal 
            engine={engine} 
            vfs={vfs} 
            onNavigateToTab={(tab) => setActiveTab(tab)} 
          />
        )}

        {/* Game Version Badge for non-workspace tabs */}
        {activeTab !== 'workspace' && (
          <div className="fixed bottom-3 right-4 z-30 pointer-events-none select-none">
            <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-[#161b22]/90 text-[#3fb950] border border-[#30363d] shadow-md backdrop-blur-sm">
              v2.0.5S
            </span>
          </div>
        )}
      </div>

      {/* Save Manager Modal */}
      {isSaveModalOpen && (
        <SaveManagerModal
          engine={engine}
          vfs={vfs}
          activeFilePath={activeFile ? activeFile.path : 'main.py'}
          onClose={() => setIsSaveModalOpen(false)}
          onFileImported={(newPath) => {
            setActiveFilePath(newPath);
            setRenderTick(t => t + 1);
          }}
        />
      )}
    </div>
  );
}
