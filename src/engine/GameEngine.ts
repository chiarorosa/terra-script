import { 
  Agent, 
  AgentMessage, 
  ConsoleLog, 
  CropType, 
  Diagnostic, 
  ExecutionMode, 
  GroundType, 
  ResourceMap, 
  TechBranch, 
  TechNode, 
  TileState,
  PrestigeState,
  PlayerMilestones,
  createDefaultAgentStats
} from '../types/game';

export function getRequiredPrestigePointsForLevel(level: number): number {
  if (level >= 100) return Infinity;
  const base = 100 * Math.pow(level, 2.5) + 200 * level;
  if (level >= 50) {
    const scaleFactor = Math.pow(1.08, level - 49);
    return Math.floor(base * scaleFactor);
  }
  return Math.floor(base);
}

export function getPrestigeResourceMultiplier(level: number, resourceKey: keyof ResourceMap): number {
  if (level > 80 && ['fiber', 'wood', 'roots', 'fruits', 'energy', 'biomass'].includes(resourceKey)) return 0.5;
  if (level > 70 && ['fiber', 'wood', 'roots', 'fruits', 'energy'].includes(resourceKey)) return 0.5;
  if (level > 60 && ['fiber', 'wood', 'roots', 'fruits'].includes(resourceKey)) return 0.5;
  if (level > 50 && ['fiber', 'wood', 'roots'].includes(resourceKey)) return 0.5;
  if (level > 25 && resourceKey === 'fiber') return 0.5;
  return 1.0;
}
import { ExecutionContext, ScriptRunner } from './interpreters/ScriptRunner';
import { PyodideManager } from './pyodideLoader';
import { VirtualFS } from './virtualFs';
import { audioManager } from '../utils/audioManager';
import { computeSyncChecksum, verifySyncChecksum } from '../utils/cryptoUtils';

export const INITIAL_TECH_TREE: TechNode[] = [
  // AUTOMATION BRANCH
  { id: 'AUTO_1', branch: 'AUTOMATION', name: 'Comandos Sequenciais', description: 'Desbloqueia execução em sequência e comandos básicos de fazenda.', tier: 0, cost: {}, unlocked: true },
  { id: 'AUTO_2', branch: 'AUTOMATION', name: 'Variáveis e Operadores', description: 'Permite atribuição de variáveis e expressões matemáticas.', tier: 1, cost: { fiber: 25 }, unlocked: false, requires: ['AUTO_1'] },
  { id: 'AUTO_3', branch: 'AUTOMATION', name: 'Condicionais & Operadores Lógicos', description: 'Permite lógica de ramificação (if/elif/else) e combinação de condições com operadores lógicos (and, or, &&, ||).', tier: 2, cost: { fiber: 60, wood: 25 }, unlocked: false, requires: ['AUTO_2'] },
  { id: 'AUTO_4', branch: 'AUTOMATION', name: 'Loops (while / for)', description: 'Permite loops repetitivos contínuos.', tier: 3, cost: { fiber: 150, wood: 75 }, unlocked: false, requires: ['AUTO_3'] },
  { id: 'AUTO_5', branch: 'AUTOMATION', name: 'Funções', description: 'Agrupa código reutilizável em funções modulares.', tier: 4, cost: { fiber: 250, wood: 125, roots: 60 }, unlocked: false, requires: ['AUTO_4'] },
  { id: 'AUTO_6', branch: 'AUTOMATION', name: 'Comunicação Inter-Agentes (IPC)', description: 'Sinais em tempo real e barramento de mensagens para coordenação entre naves agentes.', tier: 5, cost: { roots: 400, fruits: 250, energy: 150 }, unlocked: false, requires: ['AUTO_5'] },
  { id: 'AUTO_7', branch: 'AUTOMATION', name: 'SEGREDO', description: 'Conteúdo ultrassecreto em desenvolvimento. Instigação para futuras expansões.', tier: 10, cost: { energy: 9999, crystals: 42 }, unlocked: false, requires: ['AUTO_6'] },

  // AGRONOMY BRANCH
  { id: 'AGRO_1', branch: 'AGRONOMY', name: 'Fibra Selvagem e Irrigação', description: 'Colha fibras e use farm.water() para irrigar e restaurar a umidade do solo.', tier: 0, cost: {}, unlocked: true },
  { id: 'AGRO_2', branch: 'AGRONOMY', name: 'Arbustos de Madeira', description: 'Plante arbustos para produzir madeira estrutural.', tier: 1, cost: { fiber: 30 }, unlocked: false, requires: ['AGRO_1'] },
  { id: 'AGRO_3', branch: 'AGRONOMY', name: 'Solo Arado e Raízes', description: 'Arare o solo e cultive raízes agrícolas.', tier: 2, cost: { fiber: 80, wood: 40 }, unlocked: false, requires: ['AGRO_2'] },
  { id: 'AGRO_4', branch: 'AGRONOMY', name: 'Árvores e Madeira Nobre', description: 'Plante árvores. Evite árvores adjacentes para acelerar o crescimento.', tier: 3, cost: { wood: 150, roots: 60 }, unlocked: false, requires: ['AGRO_3'] },
  { id: 'AGRO_5', branch: 'AGRONOMY', name: 'Colônias de Frutas', description: 'Plantações de frutas conectadas geram recompensas multiplicadas.', tier: 4, cost: { wood: 300, roots: 150 }, unlocked: false, requires: ['AGRO_4'] },
  { id: 'AGRO_6', branch: 'AGRONOMY', name: 'Flores de Energia', description: 'Meça o nível de energia das flores com measure() e colha no pico.', tier: 5, cost: { roots: 300, fruits: 180 }, unlocked: false, requires: ['AGRO_5'] },
  { id: 'AGRO_7', branch: 'AGRONOMY', name: 'Culturas Graduadas', description: 'Plante culturas graduadas e ordene fileiras com swap() para biomassa.', tier: 6, cost: { fruits: 450, energy: 250 }, unlocked: false, requires: ['AGRO_6'] },
  { id: 'AGRO_8', branch: 'AGRONOMY', name: 'SEGREDO', description: 'Conteúdo ultrassecreto em desenvolvimento. Instigação para futuras expansões.', tier: 10, cost: { energy: 9999, crystals: 42 }, unlocked: false, requires: ['AGRO_7'] },

  // SYSTEMS BRANCH
  { id: 'SYS_1', branch: 'SYSTEMS', name: 'Saída do Console print()', description: 'Exiba mensagens e dados de depuração no console stdout.', tier: 0, cost: {}, unlocked: true },
  { id: 'SYS_2', branch: 'SYSTEMS', name: 'Sensores Básicos e Coordenadas', description: 'Inspecione o ambiente com os sensores world.ground(), world.entity() e world.moisture().', tier: 1, cost: { fiber: 20 }, unlocked: false, requires: ['SYS_1'] },
  { id: 'SYS_3', branch: 'SYSTEMS', name: 'Medição de Lotes', description: 'Use world.measure() para inspecionar graus de plantas e valores de energia.', tier: 2, cost: { fiber: 100, wood: 60 }, unlocked: false, requires: ['SYS_2'] },
  { id: 'SYS_4', branch: 'SYSTEMS', name: 'Estatísticas do Agente', description: 'Leitura do dicionário de telemetria e estatísticas individuais via sys.get_agent_stats() ou agent.get_stats().', tier: 3, cost: { fiber: 150, wood: 100, roots: 50 }, unlocked: false, requires: ['SYS_3'] },
  { id: 'SYS_5', branch: 'SYSTEMS', name: 'SEGREDO', description: 'Conteúdo ultrassecreto em desenvolvimento. Instigação para futuras expansões.', tier: 10, cost: { energy: 9999, crystals: 42 }, unlocked: false, requires: ['SYS_4'] },

  // SCALE BRANCH
  { id: 'SCALE_1', branch: 'SCALE', name: 'Micro Fazenda 1x1', description: 'Lote inicial de terreno com um único bloco.', tier: 0, cost: {}, unlocked: true },
  { id: 'SCALE_2', branch: 'SCALE', name: 'Corredor 1x3', description: 'Expanda o terreno para um corredor horizontal 1x3.', tier: 1, cost: { fiber: 40 }, unlocked: false, requires: ['SCALE_1'] },
  { id: 'SCALE_3', branch: 'SCALE', name: 'Matriz 3x3', description: 'Expanda o terreno para uma matriz de grade 3x3.', tier: 2, cost: { fiber: 120, wood: 50 }, unlocked: false, requires: ['SCALE_2'] },
  { id: 'SCALE_4', branch: 'SCALE', name: 'Fazenda Expandida 5x5', description: 'Expanda o terreno para uma zona agrícola 5x5.', tier: 3, cost: { wood: 250, roots: 100 }, unlocked: false, requires: ['SCALE_3'] },
  { id: 'SCALE_5', branch: 'SCALE', name: 'Segundo Agente', description: 'Desbloqueie a Nave Agente nº 2 para automatizar em paralelo.', tier: 4, cost: { roots: 250, fruits: 120 }, unlocked: false, requires: ['SCALE_4'] },
  { id: 'SCALE_6', branch: 'SCALE', name: 'Grade Industrial 7x7', description: 'Expanda o terreno para uma grade 7x7.', tier: 5, cost: { fruits: 350, energy: 150 }, unlocked: false, requires: ['SCALE_5'] },
  { id: 'SCALE_7', branch: 'SCALE', name: 'Matriz Complexa 9x9', description: 'Expanda o terreno para uma grade 9x9.', tier: 6, cost: { energy: 400, biomass: 200 }, unlocked: false, requires: ['SCALE_6'] },
  { id: 'SCALE_8', branch: 'SCALE', name: 'Terceiro Agente', description: 'Desbloqueie a Nave Agente nº 3 para automatizar em paralelo.', tier: 7, cost: { biomass: 350, crystals: 75 }, unlocked: false, requires: ['SCALE_7'] },
  { id: 'SCALE_9', branch: 'SCALE', name: 'Mega Zona 12x12', description: 'Expanda o terreno para um lote mega agrícola 12x12.', tier: 8, cost: { biomass: 600, crystals: 150 }, unlocked: false, requires: ['SCALE_8'] },
  { id: 'SCALE_10', branch: 'SCALE', name: 'SEGREDO', description: 'Conteúdo ultrassecreto em desenvolvimento. Instigação para futuras expansões.', tier: 10, cost: { energy: 9999, crystals: 42 }, unlocked: false, requires: ['SCALE_9'] }
];

export function getInitialTechTree(): TechNode[] {
  return INITIAL_TECH_TREE.map(node => ({
    ...node,
    cost: { ...node.cost },
    requires: node.requires ? [...node.requires] : undefined,
    unlocked: node.tier === 0
  }));
}

const ENGINE_STORAGE_KEY = 'terrascript_engine_state_v1';

export class GameEngine {
  private width: number = 1;
  private height: number = 1;
  private tiles: Map<string, TileState> = new Map();
  private agents: Agent[] = [];
  private resources: ResourceMap = {
    fiber: 20,
    wood: 0,
    roots: 0,
    fruits: 0,
    energy: 0,
    biomass: 0,
    catalyst: 0,
    crystals: 0
  };
  private techTree: TechNode[] = getInitialTechTree();
  private prestige: PrestigeState = {
    level: 1,
    points: 0,
    totalPoints: 0,
    worldChangeUnlocked: false
  };
  private logs: ConsoleLog[] = [];
  private breakpoints: Map<string, Set<number>> = new Map();
  private vfs: VirtualFS;
  private runner: ScriptRunner;
  private agentContexts: Map<number, ExecutionContext> = new Map();
  
  private mode: ExecutionMode = 'IDLE';
  private speed: number = 1; // 1x to 100x ticks per interval
  private currentTick: number = 0;
  private totalActionsPerformed: number = 0;
  private idleTicks: number = 0;
  private messageQueue: AgentMessage[] = [];
  private primaryAgentId: number = 1;
  private latestUnlockedTech: TechNode | null = null;
  private latestMilestoneUnlocked: { title: string; description: string } | null = null;

  private milestones: PlayerMilestones = {
    quickStartSeen: false,
    quickStartProminentDone: false,
    firstExecutionDone: false,
    createFileUnlocked: false,
    prestigeUnlocked: false,
    apiReferenceUnlocked: false
  };

  private listeners: Array<() => void> = [];

  constructor(vfs: VirtualFS) {
    this.vfs = vfs;
    this.runner = new ScriptRunner(this);
    this.initDefaultState();
    this.loadEngineState();

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.saveEngineState();
      });
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  private initDefaultState() {
    // Initial 1x1 grid (do not save to storage during default init, wait for loadEngineState)
    this.rebuildGrid(1, 1, false);

    // Initial Drone Agent 1 (Claudio)
    this.agents = [
      {
        id: 1,
        name: 'Claudio',
        x: 0,
        y: 0,
        color: '#3b82f6',
        assignedFile: 'guia/main.py',
        status: 'IDLE',
        currentLine: 1,
        actionMessage: 'Ready',
        stats: createDefaultAgentStats()
      }
    ];

    this.addLog(1, 'system', 'TerraScript 3D Simulation initialized. Single 1x1 tile active.');
  }

  private sanitizeTechTreePrerequisites() {
    let changed = true;
    while (changed) {
      changed = false;
      for (const node of this.techTree) {
        if (node.unlocked && node.requires && node.requires.length > 0) {
          const prereqsOk = node.requires.every(reqId => {
            const reqNode = this.techTree.find(n => n.id === reqId);
            return reqNode && reqNode.unlocked;
          });
          if (!prereqsOk) {
            console.warn(`🛡️ [Guardrail] Relocking ${node.id} (${node.name}): pré-requisito não desbloqueado.`);
            node.unlocked = false;
            changed = true;
          }
        }
      }
    }
  }

  private syncAgentsWithTechTree() {
    const scale5Unlocked = this.isTechUnlocked('SCALE_5');
    const scale8Unlocked = this.isTechUnlocked('SCALE_8');

    if (!this.agents.find(a => a.id === 1)) {
      this.agents.push({
        id: 1, name: 'Claudio', x: 0, y: 0, color: '#3b82f6',
        assignedFile: 'main.py', status: 'IDLE', currentLine: 1, actionMessage: 'Ready',
        stats: createDefaultAgentStats()
      });
    }

    if (scale5Unlocked) {
      if (!this.agents.find(a => a.id === 2)) {
        this.agents.push({
          id: 2, name: 'Gepeto', x: Math.min(1, this.width - 1), y: Math.min(1, this.height - 1),
          color: '#10b981', assignedFile: 'checkerboard.py', status: 'IDLE', currentLine: 1, actionMessage: 'Ready',
          stats: createDefaultAgentStats()
        });
      }
    } else {
      this.agents = this.agents.filter(a => a.id !== 2);
    }

    if (scale8Unlocked) {
      if (!this.agents.find(a => a.id === 3)) {
        this.agents.push({
          id: 3, name: 'Gemilson', x: Math.min(2, this.width - 1), y: Math.min(2, this.height - 1),
          color: '#a855f7', assignedFile: 'main.py', status: 'IDLE', currentLine: 1, actionMessage: 'Ready',
          stats: createDefaultAgentStats()
        });
      }
    } else {
      this.agents = this.agents.filter(a => a.id !== 3);
    }

    if (!this.agents.find(a => a.id === this.primaryAgentId)) {
      this.primaryAgentId = 1;
    }

    this.agents.forEach(a => {
      if (a.id === 1) a.name = 'Claudio';
      if (a.id === 2) a.name = 'Gepeto';
      if (a.id === 3) a.name = 'Gemilson';
      if (!a.stats) a.stats = createDefaultAgentStats();
    });
  }

  private saveEngineState() {
    try {
      const rawState = {
        width: this.width,
        height: this.height,
        resources: this.resources,
        prestige: this.prestige,
        milestones: this.milestones,
        techTree: this.techTree.map(n => ({ id: n.id, unlocked: n.unlocked })),
        currentTick: this.currentTick,
        totalActions: this.totalActionsPerformed,
        primaryAgentId: this.primaryAgentId,
        agents: this.agents.map(a => ({ id: a.id, stats: a.stats, assignedFile: a.assignedFile })),
        tiles: Array.from(this.tiles.values())
      };
      const checksum = computeSyncChecksum(rawState);
      const state = { ...rawState, checksum };
      localStorage.setItem(ENGINE_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save engine state:', e);
    }
  }

  private loadEngineState() {
    try {
      const stored = localStorage.getItem(ENGINE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const isValidSignature = verifySyncChecksum(parsed);

        if (!isValidSignature && parsed && typeof parsed === 'object') {
          console.warn('🛡️ [Guardrail] Integridade do LocalStorage alterada. Sanitizando progresso...');
          this.addLog(1, 'system', '🛡️ [Guardrail] Alteração manual detectada no armazenamento local! Progresso sanitizado.');
        }

        // 1. Sanitize Resources (finite non-negative numbers up to 1,000,000,000)
        if (parsed.resources && typeof parsed.resources === 'object') {
          for (const resKey of Object.keys(this.resources) as (keyof ResourceMap)[]) {
            const val = parsed.resources[resKey];
            if (typeof val === 'number' && Number.isFinite(val) && !Number.isNaN(val) && val >= 0) {
              this.resources[resKey] = Math.min(1000000000, Math.floor(val));
            }
          }
          if (this.resources.fiber === 0 && (!parsed.techTree || !parsed.techTree.some((t: any) => t.unlocked))) {
            this.resources.fiber = 20;
          }
        }

        // 2. Sanitize Tech Tree
        if (Array.isArray(parsed.techTree)) {
          parsed.techTree.forEach((savedNode: any) => {
            const node = this.techTree.find(n => n.id === savedNode.id);
            if (node && typeof savedNode.unlocked === 'boolean') {
              node.unlocked = savedNode.unlocked;
            }
          });
        }
        this.sanitizeTechTreePrerequisites();

        // 3. Restore Tiles state before grid calculation
        if (Array.isArray(parsed.tiles) && parsed.tiles.length > 0) {
          this.tiles.clear();
          parsed.tiles.forEach((t: TileState) => {
            if (typeof t.x === 'number' && typeof t.y === 'number') {
              this.tiles.set(`${t.x},${t.y}`, {
                x: t.x,
                y: t.y,
                ground: t.ground || 'NATURAL',
                crop: t.crop || 'NONE',
                growth: typeof t.growth === 'number' && Number.isFinite(t.growth) ? t.growth : 0,
                moisture: typeof t.moisture === 'number' && Number.isFinite(t.moisture) ? Math.max(0, Math.min(1.5, t.moisture)) : 0.75,
                grade: typeof t.grade === 'number' ? t.grade : Math.floor(Math.random() * 9) + 1,
                energyValue: typeof t.energyValue === 'number' ? t.energyValue : Math.floor(Math.random() * 80) + 20
              });
            }
          });
        }

        // 4. Calculate max permitted grid dimension based on legitimate tech tree
        let maxAllowedW = 1;
        let maxAllowedH = 1;
        if (this.isTechUnlocked('SCALE_9')) { maxAllowedW = 12; maxAllowedH = 12; }
        else if (this.isTechUnlocked('SCALE_7')) { maxAllowedW = 9; maxAllowedH = 9; }
        else if (this.isTechUnlocked('SCALE_6')) { maxAllowedW = 7; maxAllowedH = 7; }
        else if (this.isTechUnlocked('SCALE_4')) { maxAllowedW = 5; maxAllowedH = 5; }
        else if (this.isTechUnlocked('SCALE_3')) { maxAllowedW = 3; maxAllowedH = 3; }
        else if (this.isTechUnlocked('SCALE_2')) { maxAllowedW = 1; maxAllowedH = 3; }

        const targetW = typeof parsed.width === 'number' ? Math.min(parsed.width, maxAllowedW) : 1;
        const targetH = typeof parsed.height === 'number' ? Math.min(parsed.height, maxAllowedH) : 1;
        this.width = Math.max(1, targetW);
        this.height = Math.max(1, targetH);
        this.rebuildGrid(this.width, this.height, false);

        if (typeof parsed.primaryAgentId === 'number') {
          this.primaryAgentId = parsed.primaryAgentId;
        }
        if (typeof parsed.currentTick === 'number' && parsed.currentTick >= 0) {
          this.currentTick = Math.floor(parsed.currentTick);
        }
        if (typeof parsed.totalActions === 'number' && parsed.totalActions >= 0) {
          this.totalActionsPerformed = Math.floor(parsed.totalActions);
        }

        // 5. Restore Prestige State & Milestones
        if (parsed.prestige && typeof parsed.prestige === 'object') {
          this.prestige = {
            level: typeof parsed.prestige.level === 'number' ? Math.max(1, Math.min(100, parsed.prestige.level)) : 1,
            points: typeof parsed.prestige.points === 'number' ? Math.max(0, parsed.prestige.points) : 0,
            totalPoints: typeof parsed.prestige.totalPoints === 'number' ? Math.max(0, parsed.prestige.totalPoints) : 0,
            worldChangeUnlocked: Boolean(parsed.prestige.worldChangeUnlocked)
          };
        }

        if (parsed.milestones && typeof parsed.milestones === 'object') {
          this.milestones = {
            quickStartSeen: Boolean(parsed.milestones.quickStartSeen),
            quickStartProminentDone: Boolean(parsed.milestones.quickStartProminentDone),
            firstExecutionDone: Boolean(parsed.milestones.firstExecutionDone),
            createFileUnlocked: Boolean(parsed.milestones.createFileUnlocked),
            prestigeUnlocked: Boolean(parsed.milestones.prestigeUnlocked),
            apiReferenceUnlocked: Boolean(parsed.milestones.apiReferenceUnlocked)
          };
        }
        this.checkPrestigeMilestone();
        this.checkApiReferenceMilestone();

        // 6. Sync Agents & World Change Trigger
        this.syncAgentsWithTechTree();
        if (Array.isArray(parsed.agents)) {
          parsed.agents.forEach((savedAgent: any) => {
            const ag = this.agents.find(a => a.id === savedAgent.id);
            if (ag) {
              if (savedAgent.assignedFile) ag.assignedFile = savedAgent.assignedFile;
              if (savedAgent.stats) {
                ag.stats = {
                  harvestedResources: { ...createDefaultAgentStats().harvestedResources, ...(savedAgent.stats.harvestedResources || {}) },
                  plantedCount: typeof savedAgent.stats.plantedCount === 'number' ? savedAgent.stats.plantedCount : 0,
                  harvestedCount: typeof savedAgent.stats.harvestedCount === 'number' ? savedAgent.stats.harvestedCount : 0,
                  wateredCount: typeof savedAgent.stats.wateredCount === 'number' ? savedAgent.stats.wateredCount : 0,
                  tilledCount: typeof savedAgent.stats.tilledCount === 'number' ? savedAgent.stats.tilledCount : 0,
                  stepsCount: typeof savedAgent.stats.stepsCount === 'number' ? savedAgent.stats.stepsCount : 0,
                };
              }
            }
          });
        }
        this.checkWorldChangeTrigger();

        // Re-save clean, signed state
        this.saveEngineState();
      }
    } catch (e) {
      console.warn('Failed to load engine state:', e);
    }
  }

  public rebuildGrid(width: number, height: number, shouldSave: boolean = true, forceFreshTiles: boolean = false) {
    this.width = width;
    this.height = height;
    const oldTiles = forceFreshTiles ? new Map() : new Map(this.tiles);
    this.tiles.clear();

    for (let r = 0; r < height; r++) {
      for (let c = 0; c < width; c++) {
        const key = `${c},${r}`;
        const existing = oldTiles.get(key);
        if (existing) {
          this.tiles.set(key, existing);
        } else {
          this.tiles.set(key, {
            x: c,
            y: r,
            ground: 'NATURAL',
            crop: (c === 0 && r === 0) ? 'WILD_FIBER' : 'NONE',
            growth: (c === 0 && r === 0) ? 100 : 0,
            moisture: 0.75,
            grade: Math.floor(Math.random() * 9) + 1,
            energyValue: Math.floor(Math.random() * 80) + 20
          });
        }
      }
    }

    // Ensure strictly 1 Prestige Block exists and relocates to new center on expansion
    this.ensurePrestigeBlock();

    if (shouldSave) {
      this.saveEngineState();
    }
    this.notify();
  }

  // Engine Execution Control Methods
  public triggerSyntheticGuardrail() {
    this.addLog(1, 'stderr', '🛡️ [Guardrail Anti-Cheat] Cliques sintéticos via DevTools (console/setInterval) foram bloqueados! Escreva a automação em main.py usando a API farm.*.');
    audioManager.playError();
  }

  public startSimulation() {
    this.mode = 'RUNNING';
    audioManager.playExecute();
    this.handleFirstScriptExecuted();
    const now = Date.now();
    this.agents.forEach(agent => {
      const ctx = this.agentContexts.get(agent.id);
      if (!ctx || ctx.isCompleted) {
        this.prepareAgentContext(agent);
      }
      agent.status = 'RUNNING';
      agent.actionMessage = 'Running';
      agent.runStartTime = now;
    });
    this.addLog(1, 'system', `Simulation STARTED at ${this.speed}x speed.`);
    this.notify();
  }

  public pauseSimulation() {
    this.mode = 'PAUSED';
    this.agents.forEach(agent => {
      agent.status = 'PAUSED';
      agent.runStartTime = undefined;
    });
    this.addLog(1, 'system', 'Simulation PAUSED.');
    this.notify();
  }

  public stopSimulation() {
    this.mode = 'IDLE';
    this.agentContexts.clear();
    this.agents.forEach(agent => {
      agent.status = 'IDLE';
      agent.currentLine = 1;
      agent.actionMessage = 'Stopped';
      agent.runStartTime = undefined;
    });
    this.addLog(1, 'system', 'Simulation STOPPED and reset.');
    this.notify();
  }

  public isTechUnlocked(techId: string): boolean {
    const node = this.techTree.find(n => n.id === techId);
    return node ? node.unlocked : false;
  }

  public setSpeed(s: number) {
    this.speed = s >= 2 ? 2 : 1;
    this.saveEngineState();
    this.notify();
  }

  public onScriptModified(filePath: string) {
    let affected = false;
    this.agents.forEach(agent => {
      if (agent.assignedFile === filePath || agent.status === 'RUNNING') {
        if (agent.status === 'RUNNING') {
          agent.status = 'PAUSED';
          agent.actionMessage = 'Paused (script modified)';
          agent.runStartTime = undefined;
          affected = true;
        }
      }
      this.agentContexts.delete(agent.id);
    });

    if (affected || this.mode === 'RUNNING') {
      this.mode = 'PAUSED';
      this.addLog(1, 'system', `Script '${filePath}' modified: execution paused immediately.`);
    }
    this.notify();
  }

  public clearWorld() {
    for (let r = 0; r < this.height; r++) {
      for (let c = 0; c < this.width; c++) {
        const key = `${c},${r}`;
        const existing = this.tiles.get(key);
        if (existing && (existing.ground === 'PRESTIGE' || existing.crop === 'PRESTIGE')) {
          continue; // PRESTIGE block is indestructible and untouched by clear()
        }
        this.tiles.set(key, {
          x: c,
          y: r,
          ground: 'NATURAL',
          crop: 'NONE',
          growth: 0,
          moisture: 0.75,
          grade: Math.floor(Math.random() * 9) + 1,
          energyValue: Math.floor(Math.random() * 80) + 20
        });
      }
    }
    this.agents.forEach(agent => {
      agent.x = 0;
      agent.y = 0;
    });
    this.addLog(1, 'system', 'World reset (clearWorld() executed). Agentes retornados para (0,0). Progresso & inventário preservados.');
    this.saveEngineState();
    this.notify();
  }

  public resetEverything(vfs?: VirtualFS) {
    this.mode = 'PAUSED';
    this.currentTick = 0;
    this.totalActionsPerformed = 0;
    this.idleTicks = 0;
    this.logs = [];
    this.agentContexts.clear();
    this.messageQueue = [];

    // Reset resources
    this.resources = {
      fiber: 20,
      wood: 0,
      roots: 0,
      fruits: 0,
      energy: 0,
      biomass: 0,
      catalyst: 0,
      crystals: 0
    };

    // Reset Tech Tree with clean unmutated template
    this.techTree = getInitialTechTree();

    // Reset Prestige & Milestones
    this.prestige = {
      level: 1,
      points: 0,
      totalPoints: 0,
      worldChangeUnlocked: false
    };

    this.milestones = {
      quickStartSeen: false,
      quickStartProminentDone: false,
      firstExecutionDone: false,
      createFileUnlocked: false,
      prestigeUnlocked: false,
      apiReferenceUnlocked: false
    };

    // Reset Agents to Claudio only
    this.primaryAgentId = 1;
    this.agents = [
      {
        id: 1,
        name: 'Claudio',
        x: 0,
        y: 0,
        color: '#3b82f6',
        assignedFile: 'main.py',
        status: 'IDLE',
        currentLine: 1,
        actionMessage: 'Ready',
        stats: createDefaultAgentStats()
      }
    ];

    // Reset Grid to 1x1 from clean state (clear existing tile states)
    this.tiles.clear();
    this.rebuildGrid(1, 1, false, true);

    // Reset VirtualFS if provided or internal vfs
    const fsToReset = vfs || this.vfs;
    if (fsToReset) {
      fsToReset.resetToDefaults();
    }

    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ENGINE_STORAGE_KEY);
      localStorage.removeItem('terrascript_welcome_seen');
      localStorage.removeItem('terrascript_programmer_name');
      localStorage.removeItem('terrascript_follow_agent');
      localStorage.removeItem('terrascript_bottom_panel_expanded');
    }

    this.saveEngineState();
    this.addLog(1, 'system', 'Jogo e scripts completamente resetados do zero.');
    this.notify();
  }

  public stepSimulation() {
    this.mode = 'STEPPING';
    this.agents.forEach(agent => {
      const ctx = this.agentContexts.get(agent.id);
      if (!ctx || ctx.isCompleted) {
        this.prepareAgentContext(agent);
      }
    });
    this.tick(true);
    if (this.mode === 'STEPPING') {
      this.mode = 'PAUSED';
    }
    this.notify();
  }

  public prepareAgentContext(agent: Agent) {
    const file = this.vfs.getFile(agent.assignedFile) || this.vfs.getEntrypoint();
    if (!file) return;

    const lineCount = file.content.split('\n').length;
    if (lineCount > 100) {
      agent.status = 'ERROR';
      agent.actionMessage = 'Erro: >100 Linhas';
      agent.runStartTime = undefined;
      this.addLog(
        agent.id,
        'stderr',
        `🚨 Limite de Código Excedido! O script '${file.name}' possui ${lineCount} linhas, mas o limite máximo permitido pelo jogo é de 100 linhas por arquivo. Otimize e reduza seu código para executá-lo!`
      );
      audioManager.playError();
      this.agentContexts.delete(agent.id);
      return;
    }

    const ctx = this.runner.createExecutionContext(agent.id, file.path, file.content, file.language);
    this.agentContexts.set(agent.id, ctx);
  }

  // Simulation Tick
  public tick(isSingleStep: boolean = false) {
    this.currentTick++;

    // 1. Grow Crops across Grid (v2.0.1 Rules)
    this.tiles.forEach(tile => {
      // PRESTIGE tile is completely immune to crop growth, overwatering, evaporation or wild fiber spawn
      if (tile.ground === 'PRESTIGE' || tile.crop === 'PRESTIGE') {
        tile.ground = 'PRESTIGE';
        tile.crop = 'PRESTIGE';
        tile.growth = 0;
        tile.moisture = 0;
        return;
      }

      // Overwatered / Soaked soil handling
      if (tile.ground === 'SOAKED' || tile.moisture > 1.0) {
        tile.crop = 'NONE';
        tile.growth = 0;
        // Evaporate excess moisture down to <= 1.0 (100%)
        tile.moisture = Math.max(0, Math.round((tile.moisture - 0.005) * 1000) / 1000);
        if (tile.moisture <= 1.0) {
          tile.ground = 'IRRIGATED';
        }
      } else if (tile.crop !== 'NONE' && tile.growth < 100) {
        // Rule A: No crop grows if moisture <= 0.25
        if (tile.moisture <= 0.25) {
          return;
        }

        // Rule B: Delicate crops (FRUIT_COLONY, ENERGY_FLOWER, GRADED_PLANT) require moisture >= 0.75
        if (
          (tile.crop === 'FRUIT_COLONY' || tile.crop === 'ENERGY_FLOWER' || tile.crop === 'GRADED_PLANT') &&
          tile.moisture < 0.75
        ) {
          return;
        }

        // Rule C: Moisture Multiplier
        // 0.5 = normal (1.0x)
        // > 0.5 = accelerates
        // < 0.5 = decelerates
        let moistureFactor = 1.0;
        if (tile.moisture > 0.5) {
          moistureFactor = 1.0 + (tile.moisture - 0.5) * 1.2;
        } else if (tile.moisture < 0.5) {
          moistureFactor = tile.moisture / 0.5;
        }

        // Lower general base growth rates for higher difficulty & durability
        let baseRate = 2;
        if (tile.crop === 'WILD_FIBER') {
          baseRate = 5;
        } else if (tile.crop === 'WOODY_BUSH') {
          baseRate = 3;
        } else if (tile.crop === 'TREE') {
          // v2.5.1: Árvores exigem EXCLUSIVAMENTE Solo Arado (TILLED) para crescer. Em IRRIGATED ou NATURAL, baseRate = 0.
          const hasAdjTree = this.hasAdjacentCrop(tile.x, tile.y, 'TREE');
          const treeBase = hasAdjTree ? 1 : 2;
          baseRate = tile.ground === 'TILLED' ? treeBase : 0;
        } else if (tile.crop === 'CULTIVATED_ROOT') {
          // v2.5.1: Raízes Cultivadas crescem EXCLUSIVAMENTE em Solo Arado (TILLED). Em IRRIGATED ou NATURAL, baseRate = 0.
          baseRate = tile.ground === 'TILLED' ? 4 : 0;
        } else if (tile.crop === 'FRUIT_COLONY' || tile.crop === 'ENERGY_FLOWER' || tile.crop === 'GRADED_PLANT') {
          baseRate = 2;
        }

        const effectiveRate = baseRate * moistureFactor;
        tile.growth = Math.min(100, tile.growth + effectiveRate);
        
        // Oscilação de energia para ENERGY_FLOWER (faixa de 10 a 90)
        if (tile.crop === 'ENERGY_FLOWER') {
          tile.energyValue = Math.round(50 + 40 * Math.sin((this.currentTick * 0.15) + tile.x * 1.5 + tile.y * 2.5));
        }

        // Crops consume moisture as they grow
        tile.moisture = Math.max(0, Math.round((tile.moisture - 0.003) * 1000) / 1000);
      } else if (tile.crop === 'NONE' && tile.moisture > 0.5) {
        // Unplanted moist soil slowly evaporates
        tile.moisture = Math.max(0, Math.round((tile.moisture - 0.001) * 1000) / 1000);
      }

      // Revert IRRIGATED ground to NATURAL when moisture drops to 25% or below
      if (tile.moisture <= 0.25 && tile.ground === 'IRRIGATED') {
        tile.ground = 'NATURAL';
      }
      
      // Auto-grow wild fiber on any unplanted ground periodically (excluding soaked soil) - Increased spawn rate
      if (tile.crop === 'NONE' && tile.ground !== 'SOAKED' && tile.moisture <= 1.0 && Math.random() < 0.10) {
        tile.crop = 'WILD_FIBER';
        tile.growth = 30;
      }
    });

    // 2. Run active Agent Scripts (Internal 5-minute continuous run time limit / Mecanismo Anti-Preguiça)
    let anyAction = false;
    const MAX_CONTINUOUS_RUN_MS = 5 * 60 * 1000; // 5 minutos corridos (300.000 ms)
    const now = Date.now();

    this.agents.forEach(agent => {
      if (agent.status === 'RUNNING' || isSingleStep) {
        if (agent.status === 'RUNNING') {
          if (!agent.runStartTime) {
            agent.runStartTime = now;
          } else if (now - agent.runStartTime >= MAX_CONTINUOUS_RUN_MS) {
            // Anti-lazy mechanism triggered after 5 continuous minutes
            agent.status = 'PAUSED';
            agent.actionMessage = 'Pausa Forçada';
            agent.runStartTime = undefined;

            const funMessages = [
              `☕ Script parou! Claudio decidiu fazer uma pausa para o café e esticar os circuitos. Reative a simulação quando estiver pronto para continuar!`,
              `🤖 Script parou! O sindicato dos robôs ativou a pausa obrigatória de 5 minutos para evitar o superaquecimento dos transistores. Clique em Executar para continuar!`,
              `🔌 Script parou! O robô olhou para o relógio e decidiu fazer uma pausa reflexiva. Reative o script para continuar a automação!`,
              `💤 Script parou! Detector de descanso acionado: hora de tomar uma água e revisar sua estratégia de plantio.`
            ];
            const funMsg = funMessages[Math.floor(Math.random() * funMessages.length)];
            this.addLog(agent.id, 'stderr', `🛑 ${funMsg}`);
            audioManager.playError();
            return;
          }
        }

        const file = this.vfs.getFile(agent.assignedFile) || this.vfs.getEntrypoint();
        if (!file) return;

        const lineCount = file.content.split('\n').length;
        if (lineCount > 100) {
          agent.status = 'ERROR';
          agent.actionMessage = 'Erro: >100 Linhas';
          agent.runStartTime = undefined;
          this.addLog(
            agent.id,
            'stderr',
            `🚨 Limite Excedido: O script '${file.name}' possui ${lineCount} linhas (máximo 100). Otimize o código para continuar.`
          );
          audioManager.playError();
          return;
        }

        let ctx = this.agentContexts.get(agent.id);
        if (!ctx || (isSingleStep && ctx.isCompleted)) {
          this.prepareAgentContext(agent);
          ctx = this.agentContexts.get(agent.id);
        }
        if (ctx && !ctx.isCompleted) {
          const res = this.runner.executeStep(ctx);
          agent.currentLine = ctx.currentLineIndex + 1;

          if (res.error) {
            agent.status = 'ERROR';
            agent.actionMessage = `Error: Line ${agent.currentLine}`;
            agent.runStartTime = undefined;
          } else if (res.completed) {
            agent.status = 'PAUSED';
            agent.actionMessage = 'Finished';
            agent.runStartTime = undefined;
            this.addLog(agent.id, 'system', `Script '${ctx.filePath}' finished execution.`);
          }
          anyAction = true;
        }
      } else {
        agent.runStartTime = undefined;
      }
    });

    if (this.mode === 'RUNNING') {
      const activeAgents = this.agents.filter(a => a.status === 'RUNNING');
      if (activeAgents.length === 0) {
        this.mode = 'PAUSED';
      }
    }

    if (!anyAction) this.idleTicks++;

    if (this.currentTick % 10 === 0) {
      this.saveEngineState();
    }

    this.notify();
  }

  private hasAdjacentCrop(x: number, y: number, crop: CropType): boolean {
    const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
    for (const [dx, dy] of dirs) {
      const nx = (x + dx + this.width) % this.width;
      const ny = (y + dy + this.height) % this.height;
      const t = this.getTile(nx, ny);
      if (t.crop === crop) return true;
    }
    return false;
  }

  private countAdjacentMatureCrops(x: number, y: number, crop: CropType): number {
    const dirs = [[0,1], [0,-1], [1,0], [-1,0]];
    let count = 0;
    for (const [dx, dy] of dirs) {
      const nx = (x + dx + this.width) % this.width;
      const ny = (y + dy + this.height) % this.height;
      const t = this.getTile(nx, ny);
      if (t.crop === crop && t.growth >= 100) count++;
    }
    return count;
  }

  // Game API implementation
  public getTile(x: number, y: number): TileState {
    const key = `${x},${y}`;
    let tile = this.tiles.get(key);
    if (!tile) {
      tile = {
        x, y, ground: 'NATURAL', crop: 'NONE', growth: 0, moisture: 0.75
      };
      this.tiles.set(key, tile);
    }
    return tile;
  }

  public canHarvestTile(x: number, y: number): boolean {
    const t = this.getTile(x, y);
    return t.crop !== 'NONE' && t.growth >= 100;
  }

  public harvestTile(agentId: number, x: number, y: number): boolean {
    const t = this.getTile(x, y);
    if (t.crop === 'PRESTIGE' || t.ground === 'PRESTIGE') {
      this.addLog(agentId, 'stderr', `🚨 O Bloco de Prestígio Dourado não pode ser colhido!`);
      return false;
    }
    if (t.crop === 'NONE') return false;
    if (t.growth < 100) return false;

    audioManager.playHarvest();
    this.totalActionsPerformed++;
    const ag = this.getAgent(agentId);
    if (ag) {
      if (!ag.stats) ag.stats = createDefaultAgentStats();
      ag.actionMessage = `Harvested ${t.crop} at (${x},${y})`;
      ag.stats.harvestedCount++;
    }

    let yieldAmt = 1;
    if (t.crop === 'WILD_FIBER') {
      this.resources.fiber += yieldAmt;
      if (ag) ag.stats.harvestedResources.fiber += yieldAmt;
    } else if (t.crop === 'WOODY_BUSH') {
      this.resources.wood += yieldAmt;
      if (ag) ag.stats.harvestedResources.wood += yieldAmt;
    } else if (t.crop === 'TREE') {
      const bonus = this.hasAdjacentCrop(x, y, 'TREE') ? 1 : 5;
      this.resources.wood += bonus;
      if (ag) ag.stats.harvestedResources.wood += bonus;
    } else if (t.crop === 'CULTIVATED_ROOT') {
      this.resources.roots += 2;
      if (ag) ag.stats.harvestedResources.roots += 2;
    } else if (t.crop === 'FRUIT_COLONY') {
      // Sinergia de bloco: 4 frutas base + 2 por colônia vizinha madura (até 12 frutas por lote)
      const adjCount = this.countAdjacentMatureCrops(x, y, 'FRUIT_COLONY');
      const fruitBonus = 4 + (adjCount * 2);
      this.resources.fruits += fruitBonus;
      if (ag) ag.stats.harvestedResources.fruits += fruitBonus;
    } else if (t.crop === 'ENERGY_FLOWER') {
      const bonus = Math.max(1, Math.floor((t.energyValue || 50) / 10));
      this.resources.energy += bonus;
      if (ag) ag.stats.harvestedResources.energy += bonus;
    } else if (t.crop === 'GRADED_PLANT') {
      const bioBonus = (t.grade || 1) * 2;
      this.resources.biomass += bioBonus;
      if (ag) ag.stats.harvestedResources.biomass += bioBonus;
    } else if (t.crop === 'MAZE_CORE') {
      this.resources.crystals += 5;
      if (ag) ag.stats.harvestedResources.crystals += 5;
      this.addLog(agentId, 'system', 'MAZE CORE HARVESTED! +5 Crystals');
    }

    t.crop = 'NONE';
    t.growth = 0;
    // Consome 0.25 (25%) de umidade ao colher
    t.moisture = Math.max(0, Math.round((t.moisture - 0.25) * 1000) / 1000);
    if (t.moisture <= 0.25 && t.ground === 'IRRIGATED') {
      t.ground = 'NATURAL';
    }
    this.saveEngineState();
    return true;
  }

  public tillTile(agentId: number, x: number, y: number): boolean {
    const t = this.getTile(x, y);
    if (t.ground === 'PRESTIGE' || t.crop === 'PRESTIGE') {
      this.addLog(agentId, 'stderr', `🚨 O Bloco de Prestígio Dourado é sagrado e indestrutível! Não pode ser arado.`);
      return false;
    }

    if (!this.isTechUnlocked('AGRO_3')) {
      const ag = this.getAgent(agentId);
      if (ag) ag.actionMessage = 'Bloqueado: requer AGRO_3';
      this.addLog(agentId, 'stderr', `🚨 Guardrail de Progresso: farm.till() requer o desbloqueio de Solo Arado (AGRO_3)!`);
      return false;
    }

    t.ground = 'TILLED';
    this.totalActionsPerformed++;
    const ag = this.getAgent(agentId);
    if (ag) {
      if (!ag.stats) ag.stats = createDefaultAgentStats();
      ag.actionMessage = `Tilled soil at (${x},${y})`;
      ag.stats.tilledCount++;
    }
    this.saveEngineState();
    return true;
  }

  public waterTile(agentId: number, x: number, y: number): boolean {
    const t = this.getTile(x, y);
    if (t.ground === 'PRESTIGE' || t.crop === 'PRESTIGE') {
      this.addLog(agentId, 'stderr', `🚨 O Bloco de Prestígio Dourado possui energia própria e não altera umidade.`);
      return false;
    }

    this.totalActionsPerformed++;
    const ag = this.getAgent(agentId);
    if (ag) {
      if (!ag.stats) ag.stats = createDefaultAgentStats();
      ag.stats.wateredCount++;
    }

    if (t.moisture > 0.95 || t.ground === 'SOAKED') {
      t.ground = 'SOAKED';
      t.moisture = 1.10;
      if (t.crop !== 'NONE') {
        const killedCrop = t.crop;
        t.crop = 'NONE';
        t.growth = 0;
        this.addLog(agentId, 'system', `🚨 SOLO ENCHARCADO! Excesso de água destruiu a cultura (${killedCrop}) em (${x},${y})!`);
      }
      if (ag) ag.actionMessage = `Solo encharcado em (${x},${y})!`;
    } else {
      // v2.5.1: Se o solo for TILLED (ou NATURAL), a irrigação anula o estado TILLED e converte para IRRIGATED
      t.ground = 'IRRIGATED';
      t.moisture = 1.0;
      if (ag) ag.actionMessage = `Watered tile at (${x},${y})`;
    }
    this.saveEngineState();
    return true;
  }

  public plantCrop(agentId: number, x: number, y: number, cropStr: string): boolean {
    const t = this.getTile(x, y);
    if (t.ground === 'PRESTIGE' || t.crop === 'PRESTIGE') {
      this.addLog(agentId, 'stderr', `🚨 O Bloco de Prestígio Dourado não aceita plantas normais. Use farm.prestige("recurso", qtd).`);
      return false;
    }

    this.totalActionsPerformed++;
    const ag = this.getAgent(agentId);

    let crop: CropType = 'WILD_FIBER';
    const upper = cropStr.toUpperCase();
    if (upper.includes('TREE') || upper.includes('TIMBER')) {
      crop = 'TREE';
    } else if (upper.includes('BUSH') || upper.includes('WOODY') || upper.includes('WOOD')) {
      crop = 'WOODY_BUSH';
    } else if (upper.includes('ROOT') || upper.includes('CULTIVATED') || upper.includes('CORN') || upper.includes('CARROT')) {
      crop = 'CULTIVATED_ROOT';
    } else if (upper.includes('FRUIT') || upper.includes('BERRY')) {
      crop = 'FRUIT_COLONY';
    } else if (upper.includes('FLOWER') || upper.includes('ENERGY')) {
      crop = 'ENERGY_FLOWER';
    } else if (upper.includes('GRADED')) {
      crop = 'GRADED_PLANT';
    } else if (upper.includes('FIBER') || upper.includes('WILD') || upper.includes('GRASS')) {
      crop = 'WILD_FIBER';
    }

    // Guardrail: Research requirement check for crop
    const cropTechReq: Partial<Record<CropType, string>> = {
      WILD_FIBER: 'AGRO_1',
      WOODY_BUSH: 'AGRO_2',
      CULTIVATED_ROOT: 'AGRO_3',
      TREE: 'AGRO_4',
      FRUIT_COLONY: 'AGRO_5',
      ENERGY_FLOWER: 'AGRO_6',
      GRADED_PLANT: 'AGRO_7'
    };

    const reqTech = cropTechReq[crop];
    if (reqTech && !this.isTechUnlocked(reqTech)) {
      if (ag) ag.actionMessage = `Bloqueado: requer ${reqTech}`;
      this.addLog(agentId, 'stderr', `🚨 Guardrail de Progresso: Não é possível plantar ${crop} sem desbloquear a pesquisa ${reqTech}!`);
      return false;
    }

    if (t.ground === 'SOAKED' || t.moisture > 1.0) {
      t.crop = 'NONE';
      t.growth = 0;
      audioManager.playPlant();
      if (ag) ag.actionMessage = `Solo encharcado! Falha ao plantar em (${x},${y})`;
      this.addLog(agentId, 'system', `🚨 Falha no plantio em (${x},${y}): Solo encharcado (umidade > 100%). Cultura definhou (NONE).`);
      this.saveEngineState();
      return true;
    }

    t.crop = crop;
    t.growth = 0;
    audioManager.playPlant();
    if (ag) {
      if (!ag.stats) ag.stats = createDefaultAgentStats();
      ag.actionMessage = `Planted ${crop} at (${x},${y})`;
      ag.stats.plantedCount++;
    }
    this.saveEngineState();
    return true;
  }

  public normalizeDirection(dirStr: string): 'NORTH' | 'SOUTH' | 'EAST' | 'WEST' {
    const raw = (dirStr || '').toUpperCase().trim();
    if (raw === 'NORTH' || raw === 'FORWARD' || raw === 'FRONT' || raw === 'F') {
      return 'NORTH';
    }
    if (raw === 'SOUTH' || raw === 'BACKWARD' || raw === 'BACK' || raw === 'B') {
      return 'SOUTH';
    }
    if (raw === 'EAST' || raw === 'RIGHT' || raw === 'R') {
      return 'EAST';
    }
    if (raw === 'WEST' || raw === 'LEFT' || raw === 'L') {
      return 'WEST';
    }
    return 'EAST';
  }

  public swapTiles(agentId: number, x: number, y: number, dirStr: string): boolean {
    if (!this.isTechUnlocked('AGRO_7')) {
      this.addLog(agentId, 'stderr', `🚨 Guardrail de Progresso: farm.swap() requer o desbloqueio de Culturas Graduadas (AGRO_7)!`);
      return false;
    }

    const dir = this.normalizeDirection(dirStr);
    let targetX = x;
    let targetY = y;
    if (dir === 'EAST') targetX = (x + 1) % this.width;
    else if (dir === 'WEST') targetX = (x - 1 + this.width) % this.width;
    else if (dir === 'NORTH') targetY = (y + 1) % this.height;
    else if (dir === 'SOUTH') targetY = (y - 1 + this.height) % this.height;

    const t1 = this.getTile(x, y);
    const t2 = this.getTile(targetX, targetY);

    if (t1.ground === 'PRESTIGE' || t1.crop === 'PRESTIGE' || t2.ground === 'PRESTIGE' || t2.crop === 'PRESTIGE') {
      this.addLog(agentId, 'stderr', `🚨 O Bloco de Prestígio Dourado é fixo e não pode ser trocado de lugar!`);
      return false;
    }

    // Swap crops and grades
    const tempCrop = t1.crop;
    const tempGrade = t1.grade;
    t1.crop = t2.crop;
    t1.grade = t2.grade;
    t2.crop = tempCrop;
    t2.grade = tempGrade;

    this.totalActionsPerformed++;
    this.saveEngineState();
    return true;
  }

  public getCompanionRequest(x: number, y: number): any {
    return {
      targetCrop: 'WOODY_BUSH',
      targetX: (x + 2) % this.width,
      targetY: y
    };
  }

  public moveAgent(agentId: number, dirStr: string): boolean {
    const ag = this.getAgent(agentId);
    if (!ag) return false;

    const dir = this.normalizeDirection(dirStr);
    if (dir === 'EAST') ag.x = (ag.x + 1) % this.width;
    else if (dir === 'WEST') ag.x = (ag.x - 1 + this.width) % this.width;
    else if (dir === 'NORTH') ag.y = (ag.y + 1) % this.height;
    else if (dir === 'SOUTH') ag.y = (ag.y - 1 + this.height) % this.height;

    audioManager.playMove();
    this.totalActionsPerformed++;
    if (!ag.stats) ag.stats = createDefaultAgentStats();
    ag.stats.stepsCount++;
    ag.actionMessage = `Moved ${dirStr.toUpperCase()} to (${ag.x},${ag.y})`;
    return true;
  }

  public getAgentStats(agentId: number): Record<string, number> {
    if (!this.isTechUnlocked('SYS_4')) {
      throw new Error("Recurso 'Estatísticas do Agente' está bloqueado! Pesquise SYS_4 na Árvore de Pesquisa.");
    }
    const ag = this.getAgent(agentId);
    if (!ag) throw new Error(`Agente #${agentId} não encontrado.`);
    if (!ag.stats) ag.stats = createDefaultAgentStats();

    return {
      planted_count: ag.stats.plantedCount,
      harvested_count: ag.stats.harvestedCount,
      watered_count: ag.stats.wateredCount,
      tilled_count: ag.stats.tilledCount,
      steps_count: ag.stats.stepsCount,
      harvested_fiber: ag.stats.harvestedResources.fiber || 0,
      harvested_wood: ag.stats.harvestedResources.wood || 0,
      harvested_roots: ag.stats.harvestedResources.roots || 0,
      harvested_fruits: ag.stats.harvestedResources.fruits || 0,
      harvested_energy: ag.stats.harvestedResources.energy || 0,
      harvested_biomass: ag.stats.harvestedResources.biomass || 0,
      harvested_crystals: ag.stats.harvestedResources.crystals || 0,
      harvested_catalyst: ag.stats.harvestedResources.catalyst || 0
    };
  }

  public canMoveAgent(agentId: number, dirStr: string): boolean {
    const ag = this.getAgent(agentId);
    if (!ag) return false;
    const dir = this.normalizeDirection(dirStr);
    let targetX = ag.x;
    let targetY = ag.y;
    if (dir === 'EAST') targetX = (ag.x + 1) % this.width;
    else if (dir === 'WEST') targetX = (ag.x - 1 + this.width) % this.width;
    else if (dir === 'NORTH') targetY = (ag.y + 1) % this.height;
    else if (dir === 'SOUTH') targetY = (ag.y - 1 + this.height) % this.height;

    const t = this.getTile(targetX, targetY);
    return !t.isMazeWall;
  }

  public measureTile(x: number, y: number): number {
    const t = this.getTile(x, y);
    if (t.crop === 'ENERGY_FLOWER') return t.energyValue || 50;
    if (t.crop === 'GRADED_PLANT') return t.grade || 1;
    return t.growth;
  }

  public isMazeCore(x: number, y: number): boolean {
    const t = this.getTile(x, y);
    return !!t.isMazeCore;
  }

  public addLog(agentId: number, type: 'stdout' | 'stderr' | 'system' | 'action', message: string, line?: number, file?: string) {
    const newLog: ConsoleLog = {
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toLocaleTimeString(),
      agentId,
      type,
      message,
      line,
      file
    };
    this.logs.unshift(newLog);
    if (this.logs.length > 100) this.logs.pop();
    this.notify();
  }

  public unlockTech(nodeId: string): boolean {
    const node = this.techTree.find(n => n.id === nodeId);
    if (!node || node.unlocked) return false;

    // Check prerequisites
    if (node.requires && node.requires.length > 0) {
      const prereqsOk = node.requires.every(reqId => this.isTechUnlocked(reqId));
      if (!prereqsOk) {
        this.addLog(1, 'stderr', `🚨 Guardrail de Progresso: Não é possível pesquisar ${node.name} sem os pré-requisitos (${node.requires.join(', ')})!`);
        return false;
      }
    }

    // Check costs
    for (const [res, cost] of Object.entries(node.cost)) {
      if ((this.resources[res as keyof ResourceMap] || 0) < (cost || 0)) {
        return false;
      }
    }

    // Deduct costs
    for (const [res, cost] of Object.entries(node.cost)) {
      this.resources[res as keyof ResourceMap] -= (cost || 0);
    }

    node.unlocked = true;
    this.latestUnlockedTech = node;
    audioManager.playResearch();
    this.addLog(1, 'system', `TECH UNLOCKED: ${node.name}!`);

    // Prestige Points Source 1: Tech Unlocks
    const tierXP = [50, 150, 450, 1200, 3000, 7500, 18000, 40000, 100000, 250000];
    const pts = tierXP[node.tier] !== undefined ? tierXP[node.tier] : 50;
    this.addPrestigePoints(pts);

    // Handle Scale expansion triggers
    if (node.id === 'SCALE_2') this.rebuildGrid(1, 3);
    else if (node.id === 'SCALE_3') this.rebuildGrid(3, 3);
    else if (node.id === 'SCALE_4') this.rebuildGrid(5, 5);
    else if (node.id === 'SCALE_5') {
      this.syncAgentsWithTechTree();
      this.addLog(2, 'system', 'Agente Gepeto desbloqueado e juntou-se à frota!');
    } else if (node.id === 'SCALE_6') this.rebuildGrid(7, 7);
    else if (node.id === 'SCALE_7') this.rebuildGrid(9, 9);
    else if (node.id === 'SCALE_8') {
      this.syncAgentsWithTechTree();
      this.addLog(3, 'system', 'Agente Gemilson desbloqueado e juntou-se à frota!');
    } else if (node.id === 'SCALE_9') this.rebuildGrid(12, 12);

    this.checkWorldChangeTrigger();
    this.checkApiReferenceMilestone();
    this.saveEngineState();
    this.notify();
    return true;
  }

  // ==========================================
  // PRESTIGE & WORLD CHANGE SYSTEM
  // ==========================================
  public getPrestige(): PrestigeState {
    return { ...this.prestige };
  }

  public getPrestigeLevel(): number {
    return this.prestige.level;
  }

  public getPrestigeBlockCoords(): { x: number; y: number } | null {
    for (const tile of this.tiles.values()) {
      if (tile.ground === 'PRESTIGE' || tile.crop === 'PRESTIGE') {
        return { x: tile.x, y: tile.y };
      }
    }
    return null;
  }

  public getRequiredPrestigePoints(): number {
    return getRequiredPrestigePointsForLevel(this.prestige.level);
  }

  public addPrestigePoints(pts: number) {
    if (pts <= 0 || !Number.isFinite(pts)) return;
    this.prestige.points += pts;
    this.prestige.totalPoints += pts;

    let req = getRequiredPrestigePointsForLevel(this.prestige.level);
    let leveledUp = false;

    while (this.prestige.points >= req && this.prestige.level < 100) {
      this.prestige.points -= req;
      this.prestige.level++;
      leveledUp = true;
      req = getRequiredPrestigePointsForLevel(this.prestige.level);
      this.addLog(
        this.primaryAgentId,
        'system',
        `🎉 NÍVEL DE PRESTÍGIO ALCANÇADO! Você avançou para o Nível ${this.prestige.level}! 🏆`
      );
    }

    if (leveledUp) {
      audioManager.playLevelUp();
    }

    this.checkPrestigeMilestone();
    this.saveEngineState();
    this.notify();
  }

  public checkWorldChangeTrigger() {
    const tier1Ids = ['AUTO_2', 'AGRO_2', 'SYS_2', 'SCALE_2'];
    const allUnlocked = tier1Ids.every(id => this.isTechUnlocked(id));
    if (allUnlocked && !this.prestige.worldChangeUnlocked) {
      this.triggerWorldChange();
    } else if (this.prestige.worldChangeUnlocked) {
      this.ensurePrestigeBlock();
    }
  }

  public triggerWorldChange() {
    this.prestige.worldChangeUnlocked = true;
    this.ensurePrestigeBlock();
    this.addLog(
      this.primaryAgentId,
      'system',
      `🌟 MUDANÇA DO MUNDO (WORLD CHANGE)! Todos os 4 pilares de Nível 1 foram dominados! O Bloco Dourado de Prestígio manifestou-se na grade.`
    );
    audioManager.playLevelUp();
    this.saveEngineState();
    this.notify();
  }

  public ensurePrestigeBlock() {
    if (!this.prestige.worldChangeUnlocked) return;
    
    // Position target: center of the current grid layout
    const targetX = Math.floor(this.width / 2);
    const targetY = Math.floor(this.height / 2);
    const targetKey = `${targetX},${targetY}`;

    // Guarantee strictly 1 Prestige block by removing any old prestige blocks from former coordinates
    this.tiles.forEach((tile, key) => {
      if (key !== targetKey && (tile.ground === 'PRESTIGE' || tile.crop === 'PRESTIGE')) {
        tile.ground = 'NATURAL';
        tile.crop = 'NONE';
        tile.moisture = 0.75;
      }
    });

    const existing = this.tiles.get(targetKey);
    if (!existing || existing.ground !== 'PRESTIGE' || existing.crop !== 'PRESTIGE') {
      this.tiles.set(targetKey, {
        x: targetX,
        y: targetY,
        ground: 'PRESTIGE',
        crop: 'PRESTIGE',
        growth: 0,
        moisture: 0,
        grade: 0,
        energyValue: 0
      });
    }
  }

  public offerPrestigeResource(agentId: number, x: number, y: number, rawResource: string, amount: number): boolean {
    if (amount <= 0 || !Number.isFinite(amount)) return false;

    const t = this.getTile(x, y);
    if (t.ground !== 'PRESTIGE' && t.crop !== 'PRESTIGE') {
      this.addLog(agentId, 'stderr', `🚨 O comando prestige() só pode ser executado sobre o Bloco de Prestígio Dourado!`);
      return false;
    }

    const normalized = rawResource.toLowerCase().trim();
    let key: keyof ResourceMap = 'fiber';
    if (['fiber', 'fibra'].includes(normalized)) key = 'fiber';
    else if (['wood', 'madeira'].includes(normalized)) key = 'wood';
    else if (['roots', 'root', 'raiz', 'raizes'].includes(normalized)) key = 'roots';
    else if (['fruits', 'fruit', 'fruta', 'frutas'].includes(normalized)) key = 'fruits';
    else if (['energy', 'energia'].includes(normalized)) key = 'energy';
    else if (['biomass', 'biomassa'].includes(normalized)) key = 'biomass';
    else if (['crystals', 'crystal', 'cristal', 'cristais'].includes(normalized)) key = 'crystals';
    else {
      this.addLog(agentId, 'stderr', `🚨 Recurso inválido '${rawResource}' para prestígio. Use: 'fiber', 'wood', 'roots', 'fruits', 'energy', 'biomass', 'crystals' ou 'catalyst'.`);
      return false;
    }

    if ((this.resources[key] || 0) < amount) {
      this.addLog(agentId, 'stderr', `🚨 Recurso insuficiente! Você tem ${this.resources[key] || 0}x ${key}, mas tentou entregar ${amount}x.`);
      return false;
    }

    this.resources[key] -= amount;

    const rates: Record<keyof ResourceMap, number> = {
      fiber: 1,
      wood: 5,
      roots: 25,
      fruits: 100,
      energy: 500,
      biomass: 2000,
      catalyst: 0,
      crystals: 0
    };

    const baseRate = rates[key] || 1;
    const mult = getPrestigeResourceMultiplier(this.prestige.level, key);
    const ptsGained = amount * baseRate * mult;
    this.addPrestigePoints(ptsGained);

    this.totalActionsPerformed++;
    const ag = this.getAgent(agentId);
    if (ag) ag.actionMessage = `Prestige +${ptsGained} XP (${amount}x ${key})`;
    const isAttenuated = mult < 1.0;
    this.addLog(agentId, 'action', `Upload de Prestígio: ${amount}x ${key} transmitidos para a rede (+${ptsGained} XP de Prestígio${isAttenuated ? ' [Atenuado: 50%]' : ''})!`);

    this.saveEngineState();
    this.notify();
    return true;
  }

  // Getters & Setters
  public getGridWidth() { return this.width; }
  public getGridHeight() { return this.height; }
  public getAgents() { return this.agents; }
  public getAgent(id: number) { return this.agents.find(a => a.id === id); }
  public getResources() { return this.resources; }
  public getResourceCount(res: string) { return this.resources[res as keyof ResourceMap] || 0; }
  public getTechTree() { return this.techTree; }
  public getUnlockedTechIds(): string[] {
    return this.techTree.filter(t => t.unlocked).map(t => t.id);
  }

  public hasUnlockableTech(): boolean {
    return this.techTree.some(node => {
      if (node.unlocked) return false;

      const reqsMet = !node.requires || node.requires.every(reqId => {
        const reqNode = this.techTree.find(n => n.id === reqId);
        return reqNode && reqNode.unlocked;
      });
      if (!reqsMet) return false;

      return Object.entries(node.cost).every(([res, amount]) => {
        return (this.resources[res as keyof ResourceMap] || 0) >= (amount || 0);
      });
    });
  }

  public getUnlockableTechCount(): number {
    return this.techTree.filter(node => {
      if (node.unlocked) return false;

      const reqsMet = !node.requires || node.requires.every(reqId => {
        const reqNode = this.techTree.find(n => n.id === reqId);
        return reqNode && reqNode.unlocked;
      });
      if (!reqsMet) return false;

      return Object.entries(node.cost).every(([res, amount]) => {
        return (this.resources[res as keyof ResourceMap] || 0) >= (amount || 0);
      });
    }).length;
  }
  public getLogs() { return this.logs; }
  public getMode() { return this.mode; }
  public getSpeed() { return this.speed; }
  public getCurrentTick() { return this.currentTick; }
  public popLatestUnlockedTech(): TechNode | null {
    const node = this.latestUnlockedTech;
    this.latestUnlockedTech = null;
    return node;
  }

  public getMilestones(): PlayerMilestones {
    return { ...this.milestones };
  }

  public markQuickStartSeen() {
    if (!this.milestones.quickStartSeen) {
      this.milestones.quickStartSeen = true;
      this.saveEngineState();
      this.notify();
    }
  }

  public markQuickStartProminentDone() {
    if (!this.milestones.quickStartProminentDone) {
      this.milestones.quickStartProminentDone = true;
      this.saveEngineState();
      this.notify();
    }
  }

  public handleFirstScriptExecuted() {
    if (!this.milestones.firstExecutionDone) {
      this.milestones.firstExecutionDone = true;
      this.milestones.createFileUnlocked = true;
      this.milestones.quickStartProminentDone = true;

      this.latestMilestoneUnlocked = {
        title: 'Editor Expandido!',
        description: 'Você executou seu primeiro script! O Explorador de Arquivos agora possui o botão Novo Arquivo (+) e scripts modelo liberados.'
      };

      this.addLog(1, 'system', '🎉 PASSO DE JOGADOR: Primeiro script executado! Editor de código expandido e criação de arquivos liberada.');
      audioManager.playLevelUp();
      this.saveEngineState();
      this.notify();
    }
  }

  public checkPrestigeMilestone() {
    if (!this.milestones.prestigeUnlocked && (this.prestige.level >= 2 || this.prestige.worldChangeUnlocked)) {
      this.milestones.prestigeUnlocked = true;
      this.latestMilestoneUnlocked = {
        title: 'Prestígio Desbloqueado!',
        description: 'Você alcançou o Nível 2 de Prestígio! A barra de evolução superior e a Mudança do Mundo foram reveladas.'
      };
      this.addLog(1, 'system', '⭐ PASSO DE JOGADOR: Nível 2 de Prestígio alcançado! Painel de evolução superior revelado.');
      audioManager.playLevelUp();
      this.saveEngineState();
      this.notify();
    }
  }

  public getGridSize(): { cols: number; rows: number } {
    return { cols: this.width, rows: this.height };
  }

  public checkApiReferenceMilestone() {
    if (!this.milestones.apiReferenceUnlocked && (this.isTechUnlocked('SCALE_2') || this.width > 1 || this.height > 1)) {
      this.milestones.apiReferenceUnlocked = true;
      this.latestMilestoneUnlocked = {
        title: 'Referência de API Liberada!',
        description: 'Você expandiu o terreno pela primeira vez! A barra de Referência da API na base do editor de código foi ativada.'
      };
      this.addLog(1, 'system', '🧭 PASSO DE JOGADOR: Terreno expandido! Barra de Referência da API ativada no editor de código.');
      audioManager.playLevelUp();
      this.saveEngineState();
      this.notify();
    }
  }

  public popLatestMilestone(): { title: string; description: string } | null {
    const m = this.latestMilestoneUnlocked;
    this.latestMilestoneUnlocked = null;
    return m;
  }
  public getBreakpoints(file: string): Set<number> {
    return new Set();
  }

  public assignAgentFile(agentId: number, filePath: string) {
    const ag = this.getAgent(agentId);
    if (ag) {
      ag.assignedFile = filePath;
      this.agentContexts.delete(agentId);
      this.addLog(agentId, 'system', `Agent ${ag.name} assigned to ${filePath}`);
      this.notify();
    }
  }

  public getPrimaryAgentId(): number {
    return this.primaryAgentId;
  }

  public setPrimaryAgentId(id: number) {
    const ag = this.getAgent(id);
    if (ag) {
      this.primaryAgentId = id;
      this.addLog(id, 'system', `Agente ${ag.name} definido como Agente Principal`);
      this.saveEngineState();
      this.notify();
    }
  }

  public getPrimaryAgent(): Agent {
    return this.getAgent(this.primaryAgentId) || this.agents[0];
  }

  public runScriptOnPrimaryAgent(filePath: string) {
    const primaryAgent = this.getPrimaryAgent();
    if (!primaryAgent) return;

    // Pause non-primary agents so execution happens ONLY on primary agent
    this.agents.forEach(agent => {
      if (agent.id !== primaryAgent.id) {
        agent.status = 'PAUSED';
        agent.runStartTime = undefined;
      }
    });

    // Assign file to primary agent
    primaryAgent.assignedFile = filePath;

    // Re-prepare context for primary agent to execute from beginning
    this.prepareAgentContext(primaryAgent);

    if (primaryAgent.status === 'ERROR') {
      this.notify();
      return;
    }

    // Set primary agent state to RUNNING
    primaryAgent.status = 'RUNNING';
    primaryAgent.actionMessage = 'Running';
    primaryAgent.currentLine = 1;
    primaryAgent.runStartTime = Date.now();

    // Start simulation mode if not running
    this.mode = 'RUNNING';
    audioManager.playExecute();
    this.handleFirstScriptExecuted();

    this.addLog(
      primaryAgent.id,
      'system',
      `Execução do script "${filePath}" iniciada no Agente Principal (${primaryAgent.name})`
    );
    this.notify();
  }

  public clearLogs() {
    this.logs = [];
    this.notify();
  }

  public exportSaveData() {
    const tilesArray: TileState[] = Array.from(this.tiles.values());
    return {
      version: '2.0.5S',
      appName: 'TerraScript 3D',
      timestamp: new Date().toISOString(),
      grid: {
        width: this.width,
        height: this.height,
        tiles: tilesArray
      },
      resources: { ...this.resources },
      prestige: { ...this.prestige },
      milestones: { ...this.milestones },
      techTree: this.techTree.map(n => ({ id: n.id, unlocked: n.unlocked })),
      agents: this.agents.map(a => ({ id: a.id, stats: a.stats, assignedFile: a.assignedFile })),
      primaryAgentId: this.primaryAgentId,
      currentTick: this.currentTick,
      totalActionsPerformed: this.totalActionsPerformed,
      scripts: this.vfs.getFiles()
    };
  }

  public importSaveData(saveObj: any): boolean {
    try {
      if (!saveObj || typeof saveObj !== 'object') return false;

      // 1. Resources Sanitization
      if (saveObj.resources && typeof saveObj.resources === 'object') {
        for (const resKey of Object.keys(this.resources) as (keyof ResourceMap)[]) {
          const val = saveObj.resources[resKey];
          if (typeof val === 'number' && Number.isFinite(val) && !Number.isNaN(val) && val >= 0) {
            this.resources[resKey] = Math.floor(val);
          }
        }
      }

      // 2. Prestige Restoration
      if (saveObj.prestige && typeof saveObj.prestige === 'object') {
        this.prestige = {
          level: typeof saveObj.prestige.level === 'number' ? Math.max(1, Math.min(100, saveObj.prestige.level)) : 1,
          points: typeof saveObj.prestige.points === 'number' ? Math.max(0, saveObj.prestige.points) : 0,
          totalPoints: typeof saveObj.prestige.totalPoints === 'number' ? Math.max(0, saveObj.prestige.totalPoints) : 0,
          worldChangeUnlocked: Boolean(saveObj.prestige.worldChangeUnlocked)
        };
      } else if (typeof saveObj.prestige_level === 'number') {
        this.prestige.level = Math.max(1, Math.min(100, saveObj.prestige_level));
      }

      // 3. Milestones Restoration & Backward Compatibility Reconstruction
      if (saveObj.milestones && typeof saveObj.milestones === 'object') {
        this.milestones = {
          quickStartSeen: Boolean(saveObj.milestones.quickStartSeen),
          quickStartProminentDone: Boolean(saveObj.milestones.quickStartProminentDone),
          firstExecutionDone: Boolean(saveObj.milestones.firstExecutionDone),
          createFileUnlocked: Boolean(saveObj.milestones.createFileUnlocked),
          prestigeUnlocked: Boolean(saveObj.milestones.prestigeUnlocked),
          apiReferenceUnlocked: Boolean(saveObj.milestones.apiReferenceUnlocked)
        };
      } else {
        // Reconstruct milestones for legacy save files
        if ((saveObj.currentTick && saveObj.currentTick > 0) || (saveObj.totalActionsPerformed && saveObj.totalActionsPerformed > 0)) {
          this.milestones.quickStartSeen = true;
          this.milestones.quickStartProminentDone = true;
          this.milestones.firstExecutionDone = true;
          this.milestones.createFileUnlocked = true;
        }
        if (this.prestige.level >= 2 || this.prestige.worldChangeUnlocked) {
          this.milestones.prestigeUnlocked = true;
        }
      }

      // 4. Tech Tree Prerequisites Sanitization
      if (Array.isArray(saveObj.techTree)) {
        saveObj.techTree.forEach((savedNode: any) => {
          const node = this.techTree.find(n => n.id === savedNode.id);
          if (node && typeof savedNode.unlocked === 'boolean') {
            node.unlocked = savedNode.unlocked;
          }
        });
      }
      this.sanitizeTechTreePrerequisites();

      // Ensure milestones unlock if requirements are met
      this.checkPrestigeMilestone();
      this.checkApiReferenceMilestone();

      // 5. Grid & Tiles (Clamped to Max Allowed Dimension based on unlocked SCALE tech)
      let maxAllowedW = 1;
      let maxAllowedH = 1;
      if (this.isTechUnlocked('SCALE_9')) { maxAllowedW = 12; maxAllowedH = 12; }
      else if (this.isTechUnlocked('SCALE_7')) { maxAllowedW = 9; maxAllowedH = 9; }
      else if (this.isTechUnlocked('SCALE_6')) { maxAllowedW = 7; maxAllowedH = 7; }
      else if (this.isTechUnlocked('SCALE_4')) { maxAllowedW = 5; maxAllowedH = 5; }
      else if (this.isTechUnlocked('SCALE_3')) { maxAllowedW = 3; maxAllowedH = 3; }
      else if (this.isTechUnlocked('SCALE_2')) { maxAllowedW = 1; maxAllowedH = 3; }

      if (saveObj.grid && typeof saveObj.grid.width === 'number' && typeof saveObj.grid.height === 'number') {
        this.width = Math.max(1, Math.min(saveObj.grid.width, maxAllowedW));
        this.height = Math.max(1, Math.min(saveObj.grid.height, maxAllowedH));
        this.tiles.clear();
        if (Array.isArray(saveObj.grid.tiles) && saveObj.grid.tiles.length > 0) {
          saveObj.grid.tiles.forEach((t: TileState) => {
            if (typeof t.x === 'number' && typeof t.y === 'number' && t.x < this.width && t.y < this.height) {
              this.tiles.set(`${t.x},${t.y}`, { ...t });
            }
          });
        } else {
          this.rebuildGrid(this.width, this.height);
        }
      }

      // 6. Agents Sync
      if (typeof saveObj.primaryAgentId === 'number') {
        this.primaryAgentId = saveObj.primaryAgentId;
      }
      this.syncAgentsWithTechTree();
      if (Array.isArray(saveObj.agents)) {
        saveObj.agents.forEach((savedAgent: any) => {
          const ag = this.agents.find(a => a.id === savedAgent.id);
          if (ag) {
            if (savedAgent.assignedFile) ag.assignedFile = savedAgent.assignedFile;
            if (savedAgent.stats) {
              ag.stats = { ...savedAgent.stats };
            }
          }
        });
      }

      // 7. Statistics
      if (typeof saveObj.currentTick === 'number' && saveObj.currentTick >= 0) this.currentTick = Math.floor(saveObj.currentTick);
      if (typeof saveObj.totalActionsPerformed === 'number' && saveObj.totalActionsPerformed >= 0) this.totalActionsPerformed = Math.floor(saveObj.totalActionsPerformed);

      // 8. Virtual Filesystem
      if (Array.isArray(saveObj.scripts) && saveObj.scripts.length > 0) {
        this.vfs.loadFromFiles(saveObj.scripts);
      }

      this.saveEngineState();
      this.addLog(1, 'system', 'Progresso importado e verificado com sucesso pelo Guardrail!');
      this.notify();
      return true;
    } catch (err) {
      console.error('Failed to import save:', err);
      return false;
    }
  }
}
