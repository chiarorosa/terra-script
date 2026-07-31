import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles, BookOpen, X } from 'lucide-react';
import { VirtualFS } from './engine/virtualFs';
import { GameEngine } from './engine/GameEngine';
import { TechNode } from './types/game';
import { HeaderBar } from './components/HeaderBar';
import { ExplorerPanel } from './components/ExplorerPanel';
import { CodeEditor } from './components/CodeEditor';
import { World3DCanvas } from './components/World3DCanvas';
import { BottomPanel } from './components/BottomPanel';
import { TechTreeModal } from './components/TechTreeModal';
import { AgentsPanel } from './components/AgentsPanel';
import { TutorialModal } from './components/TutorialModal';
import { SaveManagerModal } from './components/SaveManagerModal';
import { WelcomeModal } from './components/WelcomeModal';
import { QuickStartModal } from './components/QuickStartModal';
import { PrestigeBar } from './components/PrestigeBar';
import { audioManager } from './utils/audioManager';

export default function App() {
  const vfs = useMemo(() => new VirtualFS(), []);
  const engine = useMemo(() => new GameEngine(vfs), [vfs]);

  const [, setRenderTick] = useState(0);
  const [activeFilePath, setActiveFilePath] = useState<string>('main.py');
  const [activeTab, setActiveTab] = useState<'workspace' | 'research' | 'agents' | 'tutorial'>('workspace');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('terrascript_welcome_seen') !== 'true';
    }
    return false;
  });
  const [isQuickStartModalOpen, setIsQuickStartModalOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const welcomeSeen = localStorage.getItem('terrascript_welcome_seen') === 'true';
      const milestones = engine.getMilestones();
      return welcomeSeen && !milestones.quickStartProminentDone;
    }
    return false;
  });
  const [selectedGuideDocId, setSelectedGuideDocId] = useState<string | null>(null);
  const [toastNotification, setToastNotification] = useState<{ 
    title: string; 
    subtitle: string; 
    description: string; 
    type: 'tech' | 'milestone'; 
    techId?: string;
  } | null>(null);

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
      const newlyUnlocked = engine.popLatestUnlockedTech();
      if (newlyUnlocked) {
        setToastNotification({
          title: 'Pesquisa Desbloqueada!',
          subtitle: newlyUnlocked.name,
          description: newlyUnlocked.description,
          type: 'tech',
          techId: newlyUnlocked.id
        });
      }

      const newlyMilestone = engine.popLatestMilestone();
      if (newlyMilestone) {
        setToastNotification({
          title: newlyMilestone.title,
          subtitle: 'Conquista de Progresso',
          description: newlyMilestone.description,
          type: 'milestone'
        });
      }

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
    <div className="w-screen h-screen flex flex-col bg-[#08090a] text-[#d0d6e0] font-sans overflow-hidden select-none">
      {/* Top Header Toolbar */}
      <HeaderBar
        engine={engine}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSaveManager={() => setIsSaveModalOpen(true)}
        onOpenWelcome={() => setIsWelcomeModalOpen(true)}
      />

      {/* Prestige Progress Bar (v2.1.0 - Progressive Disclosure) */}
      {(engine.getPrestige().level >= 2 || engine.getPrestige().worldChangeUnlocked || engine.getMilestones().prestigeUnlocked) && (
        <PrestigeBar engine={engine} />
      )}

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

            {/* Bottom Toggleable Console & Output Panel */}
            <BottomPanel engine={engine} />
          </div>
        )}

        {activeTab === 'research' && (
          <TechTreeModal 
            engine={engine} 
            onOpenGuideForTech={(techId) => {
              setSelectedGuideDocId(techId);
              setActiveTab('tutorial');
            }}
          />
        )}

        {activeTab === 'agents' && <AgentsPanel engine={engine} vfs={vfs} />}

        {activeTab === 'tutorial' && (
          <TutorialModal 
            engine={engine} 
            vfs={vfs} 
            initialSelectedItemId={selectedGuideDocId}
            onNavigateToTab={(tab) => setActiveTab(tab)} 
          />
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
          onResetGame={() => {
            setIsWelcomeModalOpen(true);
            setIsQuickStartModalOpen(false);
            setRenderTick(t => t + 1);
          }}
        />
      )}

      {/* Welcome & Programmer Name Modal */}
      {isWelcomeModalOpen && (
        <WelcomeModal
          engine={engine}
          onClose={() => {
            setIsWelcomeModalOpen(false);
            setIsQuickStartModalOpen(true);
            setRenderTick(t => t + 1);
          }}
        />
      )}

      {/* Quick Start Spotlight Pop-Up Modal */}
      {isQuickStartModalOpen && !isWelcomeModalOpen && (
        <QuickStartModal
          engine={engine}
          onClose={() => {
            setIsQuickStartModalOpen(false);
            setRenderTick(t => t + 1);
          }}
        />
      )}

      {/* Unlock / Milestone Toast Notification */}
      {toastNotification && (
        <div className="fixed bottom-14 right-6 z-50 max-w-sm bg-[#08090a] border border-[#5e6ad2]/60 shadow-[0_0_20px_rgba(94,106,210,0.3)] rounded-[12px] p-4 text-white animate-in slide-in-from-bottom-5 duration-300 flex items-start gap-3">
          <div className="p-2 bg-[#5e6ad2]/20 text-[#5e6ad2] rounded-[8px] shrink-0">
            <Sparkles className="w-5 h-5 text-[#5e6ad2]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#5e6ad2] font-bold">
                {toastNotification.title}
              </span>
              <button 
                onClick={() => setToastNotification(null)} 
                className="text-[#8a8f98] hover:text-white p-0.5 rounded hover:bg-[#161718] transition-all"
                title="Fechar notificação"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="font-semibold text-sm text-white mt-0.5">{toastNotification.subtitle}</div>
            <p className="text-xs text-[#8a8f98] mt-1 leading-snug">{toastNotification.description}</p>
            {toastNotification.type === 'tech' && (
              <button
                onClick={() => {
                  if (toastNotification.techId) {
                    setSelectedGuideDocId(toastNotification.techId);
                  }
                  setActiveTab('tutorial');
                  setToastNotification(null);
                }}
                className="mt-2.5 px-3 py-1.5 bg-[#5e6ad2] hover:bg-[#4f52b2] text-white rounded-[6px] text-xs font-medium transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Ver no Guia de API ➔</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
