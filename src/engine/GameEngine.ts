import { 
  Agent, 
  AgentMessage, 
  ConsoleLog, 
  CropType, 
  Diagnostic, 
  ExecutionMode, 
  GroundType, 
  ProfilerMetrics, 
  ResourceMap, 
  TechBranch, 
  TechNode, 
  TileState 
} from '../types/game';
import { ExecutionContext, ScriptRunner } from './interpreters/ScriptRunner';
import { VirtualFS } from './virtualFs';
import { audioManager } from '../utils/audioManager';

export const INITIAL_TECH_TREE: TechNode[] = [
  // AUTOMATION BRANCH
  { id: 'AUTO_1', branch: 'AUTOMATION', name: 'Comandos Sequenciais', description: 'Desbloqueia execução em sequência e comandos básicos de fazenda.', tier: 0, cost: {}, unlocked: true },
  { id: 'AUTO_2', branch: 'AUTOMATION', name: 'Variáveis e Operadores', description: 'Permite atribuição de variáveis e expressões matemáticas.', tier: 1, cost: { fiber: 10 }, unlocked: false, requires: ['AUTO_1'] },
  { id: 'AUTO_3', branch: 'AUTOMATION', name: 'Condicionais (if/else)', description: 'Permite lógica de ramificação e checagem de estados.', tier: 2, cost: { fiber: 25, wood: 10 }, unlocked: false, requires: ['AUTO_2'] },
  { id: 'AUTO_4', branch: 'AUTOMATION', name: 'Loops (while / for)', description: 'Permite loops repetitivos contínuos.', tier: 3, cost: { fiber: 50, wood: 25 }, unlocked: false, requires: ['AUTO_3'] },
  { id: 'AUTO_5', branch: 'AUTOMATION', name: 'Funções', description: 'Agrupa código reutilizável em funções modulares.', tier: 4, cost: { fiber: 100, wood: 50, roots: 20 }, unlocked: false, requires: ['AUTO_4'] },
  { id: 'AUTO_6', branch: 'AUTOMATION', name: 'Comunicação Inter-Drones (IPC)', description: 'Sinais em tempo real e barramento de mensagens para coordenação entre robôs.', tier: 8, cost: { roots: 100, fruits: 50, energy: 20 }, unlocked: false, requires: ['AUTO_5'] },

  // AGRONOMY BRANCH
  { id: 'AGRO_1', branch: 'AGRONOMY', name: 'Fibra Selvagem e Irrigação', description: 'Colha fibras e use farm.water() para irrigar e restaurar a umidade do solo.', tier: 0, cost: {}, unlocked: true },
  { id: 'AGRO_2', branch: 'AGRONOMY', name: 'Arbustos de Madeira', description: 'Plante arbustos para produzir madeira estrutural.', tier: 1, cost: { fiber: 15 }, unlocked: false, requires: ['AGRO_1'] },
  { id: 'AGRO_3', branch: 'AGRONOMY', name: 'Solo Arado e Raízes', description: 'Arare o solo e cultive raízes agrícolas.', tier: 2, cost: { fiber: 30, wood: 15 }, unlocked: false, requires: ['AGRO_2'] },
  { id: 'AGRO_4', branch: 'AGRONOMY', name: 'Árvores e Madeira Nobre', description: 'Plante árvores. Evite árvores adjacentes para acelerar o crescimento.', tier: 3, cost: { wood: 50, roots: 25 }, unlocked: false, requires: ['AGRO_3'] },
  { id: 'AGRO_5', branch: 'AGRONOMY', name: 'Colônias de Frutas', description: 'Plantações de frutas conectadas geram recompensas multiplicadas.', tier: 5, cost: { wood: 100, roots: 50 }, unlocked: false, requires: ['AGRO_4'] },
  { id: 'AGRO_6', branch: 'AGRONOMY', name: 'Flores de Energia', description: 'Meça o nível de energia das flores com measure() e colha no pico.', tier: 6, cost: { roots: 100, fruits: 40 }, unlocked: false, requires: ['AGRO_5'] },
  { id: 'AGRO_7', branch: 'AGRONOMY', name: 'Culturas Graduadas', description: 'Plante culturas graduadas e ordene fileiras com swap() para biomassa.', tier: 8, cost: { fruits: 80, energy: 50 }, unlocked: false, requires: ['AGRO_6'] },
  { id: 'AGRO_8', branch: 'AGRONOMY', name: 'Labirinto Vivo', description: 'Transforme a terra em um labirinto e navegue para colher o núcleo.', tier: 9, cost: { energy: 100, biomass: 50 }, unlocked: false, requires: ['AGRO_7'] },

  // SYSTEMS BRANCH
  { id: 'SYS_1', branch: 'SYSTEMS', name: 'Saída do Console print()', description: 'Exiba mensagens e dados de depuração no console stdout.', tier: 0, cost: {}, unlocked: true },
  { id: 'SYS_2', branch: 'SYSTEMS', name: 'Sensores Básicos e Coordenadas', description: 'Inspecione o ambiente com os sensores world.ground(), world.entity() e world.moisture().', tier: 1, cost: { fiber: 10 }, unlocked: false, requires: ['SYS_1'] },
  { id: 'SYS_3', branch: 'SYSTEMS', name: 'Medição de Lotes', description: 'Use world.measure() para inspecionar graus de plantas e valores de energia.', tier: 3, cost: { fiber: 40, wood: 20 }, unlocked: false, requires: ['SYS_2'] },
  { id: 'SYS_4', branch: 'SYSTEMS', name: 'Debugger Passo a Passo e Breakpoints', description: 'Defina breakpoints com F9 e execute passo a passo com F10.', tier: 5, cost: { wood: 60, roots: 30 }, unlocked: false, requires: ['SYS_3'] },
  { id: 'SYS_5', branch: 'SYSTEMS', name: 'Profiler e Métricas', description: 'Rastreie rendimento, ticks e eficiência dos algoritmos.', tier: 7, cost: { roots: 80, fruits: 40 }, unlocked: false, requires: ['SYS_4'] },

  // SCALE BRANCH
  { id: 'SCALE_1', branch: 'SCALE', name: 'Micro Fazenda 1x1', description: 'Lote inicial de terreno com um único bloco.', tier: 0, cost: {}, unlocked: true },
  { id: 'SCALE_2', branch: 'SCALE', name: 'Corredor 1x3', description: 'Expanda o terreno para um corredor horizontal 1x3.', tier: 1, cost: { fiber: 20 }, unlocked: false, requires: ['SCALE_1'] },
  { id: 'SCALE_3', branch: 'SCALE', name: 'Matriz 3x3', description: 'Expanda o terreno para uma matriz de grade 3x3.', tier: 2, cost: { fiber: 50, wood: 20 }, unlocked: false, requires: ['SCALE_2'] },
  { id: 'SCALE_4', branch: 'SCALE', name: 'Fazenda Expandida 5x5', description: 'Expanda o terreno para uma zona agrícola 5x5.', tier: 4, cost: { wood: 100, roots: 40 }, unlocked: false, requires: ['SCALE_3'] },
  { id: 'SCALE_5', branch: 'SCALE', name: 'Segundo Agente Drone', description: 'Desbloqueie o Drone nº 2 para automatizar em paralelo.', tier: 5, cost: { roots: 100, fruits: 30 }, unlocked: false, requires: ['SCALE_4'] },
  { id: 'SCALE_6', branch: 'SCALE', name: 'Grade Industrial 7x7', description: 'Expanda o terreno para uma grade 7x7.', tier: 6, cost: { fruits: 100, energy: 50 }, unlocked: false, requires: ['SCALE_5'] },
  { id: 'SCALE_7', branch: 'SCALE', name: 'Matriz Complexa 9x9', description: 'Expanda o terreno para uma grade 9x9.', tier: 7, cost: { energy: 100, biomass: 50 }, unlocked: false, requires: ['SCALE_6'] },
  { id: 'SCALE_8', branch: 'SCALE', name: 'Terceiro Agente Drone', description: 'Desbloqueie o Drone nº 3 para automatizar em paralelo.', tier: 8, cost: { biomass: 100, crystals: 25 }, unlocked: false, requires: ['SCALE_7'] },
  { id: 'SCALE_9', branch: 'SCALE', name: 'Mega Zona 12x12', description: 'Expanda o terreno para um lote mega agrícola 12x12.', tier: 9, cost: { biomass: 200, crystals: 50 }, unlocked: false, requires: ['SCALE_8'] }
];

const ENGINE_STORAGE_KEY = 'terrascript_engine_state_v1';

export class GameEngine {
  private width: number = 1;
  private height: number = 1;
  private tiles: Map<string, TileState> = new Map();
  private agents: Agent[] = [];
  private resources: ResourceMap = {
    fiber: 10,
    wood: 0,
    roots: 0,
    fruits: 0,
    energy: 0,
    biomass: 0,
    catalyst: 0,
    crystals: 0,
    fossils: 0
  };
  private techTree: TechNode[] = [...INITIAL_TECH_TREE];
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

  private listeners: Array<() => void> = [];

  constructor(vfs: VirtualFS) {
    this.vfs = vfs;
    this.runner = new ScriptRunner(this);
    this.initDefaultState();
    this.loadEngineState();
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
    // Initial 1x1 grid
    this.rebuildGrid(1, 1);

    // Initial Drone Agent 1 (Claudio)
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
        actionMessage: 'Ready'
      }
    ];

    this.addLog(1, 'system', 'TerraScript 3D Simulation initialized. Single 1x1 tile active.');
  }

  private saveEngineState() {
    try {
      const state = {
        width: this.width,
        height: this.height,
        resources: this.resources,
        techTree: this.techTree,
        currentTick: this.currentTick,
        totalActions: this.totalActionsPerformed,
        primaryAgentId: this.primaryAgentId
      };
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
        if (parsed.width && parsed.height) {
          this.width = parsed.width;
          this.height = parsed.height;
          this.rebuildGrid(this.width, this.height);
        }
        if (parsed.primaryAgentId) {
          this.primaryAgentId = parsed.primaryAgentId;
        }
        if (parsed.resources) {
          this.resources = { ...this.resources, ...parsed.resources };
          // Guarantee new players starting with older 0-fiber save without research get 10 starting fibers
          if (this.resources.fiber === 0 && (!parsed.techTree || !parsed.techTree.some((t: any) => t.unlocked))) {
            this.resources.fiber = 10;
          }
        }
        if (parsed.techTree) {
          parsed.techTree.forEach((savedNode: TechNode) => {
            const node = this.techTree.find(n => n.id === savedNode.id);
            if (node) node.unlocked = savedNode.unlocked;
          });
        }
        if (parsed.currentTick) this.currentTick = parsed.currentTick;
        if (parsed.totalActions) this.totalActionsPerformed = parsed.totalActions;

        // Restore Gepeto if SCALE_5 is unlocked
        const scale5 = this.techTree.find(n => n.id === 'SCALE_5');
        if (scale5 && scale5.unlocked && !this.agents.find(a => a.id === 2)) {
          this.agents.push({
            id: 2,
            name: 'Gepeto',
            x: 1,
            y: 1,
            color: '#10b981',
            assignedFile: 'checkerboard.py',
            status: 'IDLE',
            currentLine: 1,
            actionMessage: 'Ready'
          });
        }

        // Restore Gemilson if SCALE_8 is unlocked
        const scale8 = this.techTree.find(n => n.id === 'SCALE_8');
        if (scale8 && scale8.unlocked && !this.agents.find(a => a.id === 3)) {
          this.agents.push({
            id: 3,
            name: 'Gemilson',
            x: 2,
            y: 2,
            color: '#a855f7',
            assignedFile: 'main.py',
            status: 'IDLE',
            currentLine: 1,
            actionMessage: 'Ready'
          });
        }

        // Migrate/sync agent names
        this.agents.forEach(a => {
          if (a.id === 1) a.name = 'Claudio';
          if (a.id === 2) a.name = 'Gepeto';
          if (a.id === 3) a.name = 'Gemilson';
        });
      }
    } catch (e) {
      console.warn('Failed to load engine state:', e);
    }
  }

  public rebuildGrid(width: number, height: number) {
    this.width = width;
    this.height = height;
    const oldTiles = new Map(this.tiles);
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
    this.saveEngineState();
    this.notify();
  }

  // Engine Execution Control Methods
  public startSimulation() {
    this.mode = 'RUNNING';
    audioManager.playExecute();
    this.agents.forEach(agent => {
      const ctx = this.agentContexts.get(agent.id);
      if (!ctx || ctx.isCompleted) {
        this.prepareAgentContext(agent);
      }
      agent.status = 'RUNNING';
      agent.actionMessage = 'Running';
    });
    this.addLog(1, 'system', `Simulation STARTED at ${this.speed}x speed.`);
    this.notify();
  }

  public pauseSimulation() {
    this.mode = 'PAUSED';
    this.agents.forEach(agent => {
      agent.status = 'PAUSED';
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
    this.addLog(1, 'system', 'World reset (clearWorld() executed). Drones returned to (0,0). Player progress & inventory preserved.');
    this.saveEngineState();
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
    const ctx = this.runner.createExecutionContext(agent.id, file.path, file.content, file.language);
    this.agentContexts.set(agent.id, ctx);
  }

  // Simulation Tick
  public tick(isSingleStep: boolean = false) {
    this.currentTick++;

    // 1. Grow Crops across Grid (v2.0.1 Rules)
    this.tiles.forEach(tile => {
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
          const hasAdjTree = this.hasAdjacentCrop(tile.x, tile.y, 'TREE');
          baseRate = hasAdjTree ? 1 : 2;
        } else if (tile.crop === 'CULTIVATED_ROOT') {
          baseRate = tile.ground === 'TILLED' ? 4 : 2;
        } else if (tile.crop === 'FRUIT_COLONY' || tile.crop === 'ENERGY_FLOWER' || tile.crop === 'GRADED_PLANT') {
          baseRate = 2;
        }

        const effectiveRate = baseRate * moistureFactor;
        tile.growth = Math.min(100, tile.growth + effectiveRate);
        
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
      
      // Auto-grow wild fiber on any unplanted ground periodically (excluding soaked soil)
      if (tile.crop === 'NONE' && tile.ground !== 'SOAKED' && tile.moisture <= 1.0 && Math.random() < 0.03) {
        tile.crop = 'WILD_FIBER';
        tile.growth = 20;
      }
    });

    // 2. Run active Agent Scripts
    let anyAction = false;
    this.agents.forEach(agent => {
      if (agent.status === 'RUNNING' || isSingleStep) {
        let ctx = this.agentContexts.get(agent.id);
        if (!ctx || (isSingleStep && ctx.isCompleted)) {
          this.prepareAgentContext(agent);
          ctx = this.agentContexts.get(agent.id);
        }
        if (ctx && !ctx.isCompleted) {
          const fileBps = this.breakpoints.get(ctx.filePath) || new Set();
          const res = this.runner.executeStep(ctx, fileBps);
          agent.currentLine = ctx.currentLineIndex + 1;

          if (res.error) {
            agent.status = 'ERROR';
            agent.actionMessage = `Error: Line ${agent.currentLine}`;
          } else if (res.hitBreakpoint) {
            this.pauseSimulation();
            this.addLog(agent.id, 'system', `Breakpoint hit at ${ctx.filePath}:${agent.currentLine}`);
          } else if (res.completed) {
            agent.status = 'PAUSED';
            agent.actionMessage = 'Finished';
            this.addLog(agent.id, 'system', `Script '${ctx.filePath}' finished execution.`);
          }
          anyAction = true;
        }
      }
    });

    if (this.mode === 'RUNNING') {
      const activeAgents = this.agents.filter(a => a.status === 'RUNNING');
      if (activeAgents.length === 0) {
        this.mode = 'PAUSED';
      }
    }

    if (!anyAction) this.idleTicks++;

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
    if (t.crop === 'NONE') return false;
    if (t.growth < 100) return false;

    audioManager.playHarvest();
    this.totalActionsPerformed++;
    const ag = this.getAgent(agentId);
    if (ag) ag.actionMessage = `Harvested ${t.crop} at (${x},${y})`;

    let yieldAmt = 1;
    if (t.crop === 'WILD_FIBER') {
      this.resources.fiber += yieldAmt;
    } else if (t.crop === 'WOODY_BUSH') {
      this.resources.wood += yieldAmt;
    } else if (t.crop === 'TREE') {
      const bonus = this.hasAdjacentCrop(x, y, 'TREE') ? 2 : 5;
      this.resources.wood += bonus;
    } else if (t.crop === 'CULTIVATED_ROOT') {
      this.resources.roots += 2;
    } else if (t.crop === 'FRUIT_COLONY') {
      this.resources.fruits += 4;
    } else if (t.crop === 'ENERGY_FLOWER') {
      const bonus = Math.floor((t.energyValue || 50) / 10);
      this.resources.energy += bonus;
    } else if (t.crop === 'GRADED_PLANT') {
      this.resources.biomass += (t.grade || 1) * 2;
    } else if (t.crop === 'MAZE_CORE') {
      this.resources.crystals += 5;
      this.addLog(agentId, 'system', 'MAZE CORE HARVESTED! +5 Crystals');
    }

    t.crop = 'NONE';
    t.growth = 0;
    if (t.moisture <= 0.25 && t.ground === 'IRRIGATED') {
      t.ground = 'NATURAL';
    }
    this.saveEngineState();
    return true;
  }

  public tillTile(agentId: number, x: number, y: number): boolean {
    const t = this.getTile(x, y);
    t.ground = 'TILLED';
    this.totalActionsPerformed++;
    const ag = this.getAgent(agentId);
    if (ag) ag.actionMessage = `Tilled soil at (${x},${y})`;
    return true;
  }

  public waterTile(agentId: number, x: number, y: number): boolean {
    const t = this.getTile(x, y);
    this.totalActionsPerformed++;
    const ag = this.getAgent(agentId);

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
      if (t.ground !== 'TILLED') {
        t.ground = 'IRRIGATED';
      }
      t.moisture = 1.0;
      if (ag) ag.actionMessage = `Watered tile at (${x},${y})`;
    }
    return true;
  }

  public plantCrop(agentId: number, x: number, y: number, cropStr: string): boolean {
    const t = this.getTile(x, y);
    this.totalActionsPerformed++;
    const ag = this.getAgent(agentId);

    if (t.ground === 'SOAKED' || t.moisture > 1.0) {
      t.crop = 'NONE';
      t.growth = 0;
      audioManager.playPlant();
      if (ag) ag.actionMessage = `Solo encharcado! Falha ao plantar em (${x},${y})`;
      this.addLog(agentId, 'system', `🚨 Falha no plantio em (${x},${y}): Solo encharcado (umidade > 100%). Cultura definhou (NONE).`);
      return true;
    }

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

    t.crop = crop;
    t.growth = 0;
    audioManager.playPlant();
    if (ag) ag.actionMessage = `Planted ${crop} at (${x},${y})`;
    return true;
  }

  public swapTiles(agentId: number, x: number, y: number, dirStr: string): boolean {
    const dir = dirStr.toUpperCase();
    let targetX = x;
    let targetY = y;
    if (dir === 'EAST') targetX = (x + 1) % this.width;
    else if (dir === 'WEST') targetX = (x - 1 + this.width) % this.width;
    else if (dir === 'NORTH') targetY = (y + 1) % this.height;
    else if (dir === 'SOUTH') targetY = (y - 1 + this.height) % this.height;

    const t1 = this.getTile(x, y);
    const t2 = this.getTile(targetX, targetY);

    // Swap crops and grades
    const tempCrop = t1.crop;
    const tempGrade = t1.grade;
    t1.crop = t2.crop;
    t1.grade = t2.grade;
    t2.crop = tempCrop;
    t2.grade = tempGrade;

    this.totalActionsPerformed++;
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

    const dir = dirStr.toUpperCase();
    if (dir === 'EAST') ag.x = (ag.x + 1) % this.width;
    else if (dir === 'WEST') ag.x = (ag.x - 1 + this.width) % this.width;
    else if (dir === 'NORTH') ag.y = (ag.y + 1) % this.height;
    else if (dir === 'SOUTH') ag.y = (ag.y - 1 + this.height) % this.height;

    audioManager.playMove();
    this.totalActionsPerformed++;
    ag.actionMessage = `Moved ${dir} to (${ag.x},${ag.y})`;
    return true;
  }

  public canMoveAgent(agentId: number, dirStr: string): boolean {
    const ag = this.getAgent(agentId);
    if (!ag) return false;
    const dir = dirStr.toUpperCase();
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
    audioManager.playResearch();
    this.addLog(1, 'system', `TECH UNLOCKED: ${node.name}!`);

    // Handle Scale expansion triggers
    if (node.id === 'SCALE_2') this.rebuildGrid(1, 3);
    else if (node.id === 'SCALE_3') this.rebuildGrid(3, 3);
    else if (node.id === 'SCALE_4') this.rebuildGrid(5, 5);
    else if (node.id === 'SCALE_5') {
      this.agents.push({
        id: 2,
        name: 'Gepeto',
        x: 1,
        y: 1,
        color: '#10b981',
        assignedFile: 'checkerboard.py',
        status: 'IDLE',
        currentLine: 1,
        actionMessage: 'Ready'
      });
      this.addLog(2, 'system', 'Drone Gepeto desbloqueado e juntou-se à fazenda!');
    } else if (node.id === 'SCALE_6') this.rebuildGrid(7, 7);
    else if (node.id === 'SCALE_7') this.rebuildGrid(9, 9);
    else if (node.id === 'SCALE_8') {
      if (!this.agents.find(a => a.id === 3)) {
        this.agents.push({
          id: 3,
          name: 'Gemilson',
          x: 2,
          y: 2,
          color: '#a855f7',
          assignedFile: 'main.py',
          status: 'IDLE',
          currentLine: 1,
          actionMessage: 'Ready'
        });
        this.addLog(3, 'system', 'Drone Gemilson desbloqueado e juntou-se à fazenda!');
      }
    } else if (node.id === 'SCALE_9') this.rebuildGrid(12, 12);

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
  public getBreakpoints(file: string): Set<number> {
    return this.breakpoints.get(file) || new Set();
  }
  public toggleBreakpoint(file: string, line: number) {
    if (!this.breakpoints.has(file)) {
      this.breakpoints.set(file, new Set());
    }
    const set = this.breakpoints.get(file)!;
    if (set.has(line)) set.delete(line);
    else set.add(line);
    this.notify();
  }

  public getProfilerMetrics(): ProfilerMetrics {
    return {
      ticksExecuted: this.currentTick,
      actionsPerformed: this.totalActionsPerformed,
      idleTicks: this.idleTicks,
      opsPerSecond: Math.round((this.totalActionsPerformed / Math.max(1, this.currentTick)) * 100),
      throughputPerTile: Number((this.totalActionsPerformed / Math.max(1, this.width * this.height)).toFixed(2)),
      activeAgentsCount: this.agents.filter(a => a.status === 'RUNNING').length
    };
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
      this.addLog(id, 'system', `Drone ${ag.name} definido como Drone Principal`);
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

    // Assign file to primary agent
    primaryAgent.assignedFile = filePath;

    // Re-prepare context for primary agent to execute from beginning
    this.prepareAgentContext(primaryAgent);

    // Set primary agent state to RUNNING
    primaryAgent.status = 'RUNNING';
    primaryAgent.actionMessage = 'Running';
    primaryAgent.currentLine = 1;

    // Start simulation mode if not running
    this.mode = 'RUNNING';
    audioManager.playExecute();

    this.addLog(
      primaryAgent.id,
      'system',
      `Execução do script "${filePath}" iniciada no Drone Principal (${primaryAgent.name})`
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
      version: '2.0.4',
      appName: 'TerraScript 3D',
      timestamp: new Date().toISOString(),
      grid: {
        width: this.width,
        height: this.height,
        tiles: tilesArray
      },
      resources: { ...this.resources },
      techTree: this.techTree.map(n => ({ id: n.id, unlocked: n.unlocked })),
      agents: this.agents.map(a => ({ ...a })),
      primaryAgentId: this.primaryAgentId,
      currentTick: this.currentTick,
      totalActionsPerformed: this.totalActionsPerformed,
      scripts: this.vfs.getFiles()
    };
  }

  public importSaveData(saveObj: any): boolean {
    try {
      if (!saveObj || typeof saveObj !== 'object') return false;

      // 1. Grid & Tiles
      if (saveObj.grid && typeof saveObj.grid.width === 'number' && typeof saveObj.grid.height === 'number') {
        this.width = saveObj.grid.width;
        this.height = saveObj.grid.height;
        this.tiles.clear();
        if (Array.isArray(saveObj.grid.tiles) && saveObj.grid.tiles.length > 0) {
          saveObj.grid.tiles.forEach((t: TileState) => {
            if (typeof t.x === 'number' && typeof t.y === 'number') {
              this.tiles.set(`${t.x},${t.y}`, { ...t });
            }
          });
        } else {
          this.rebuildGrid(this.width, this.height);
        }
      }

      // 2. Resources
      if (saveObj.resources) {
        this.resources = { ...this.resources, ...saveObj.resources };
      }

      // 3. Tech Tree
      if (Array.isArray(saveObj.techTree)) {
        saveObj.techTree.forEach((savedNode: any) => {
          const node = this.techTree.find(n => n.id === savedNode.id);
          if (node && typeof savedNode.unlocked === 'boolean') {
            node.unlocked = savedNode.unlocked;
          }
        });
      }

      // 4. Agents
      if (Array.isArray(saveObj.agents) && saveObj.agents.length > 0) {
        this.agents = saveObj.agents.map((ag: any) => ({
          ...ag,
          name: ag.id === 1 ? 'Claudio' : ag.id === 2 ? 'Gepeto' : ag.id === 3 ? 'Gemilson' : ag.name,
          status: 'IDLE',
          actionMessage: 'Ready'
        }));
      }
      if (typeof saveObj.primaryAgentId === 'number') {
        this.primaryAgentId = saveObj.primaryAgentId;
      }

      // 5. Statistics
      if (typeof saveObj.currentTick === 'number') this.currentTick = saveObj.currentTick;
      if (typeof saveObj.totalActionsPerformed === 'number') this.totalActionsPerformed = saveObj.totalActionsPerformed;

      // 6. Virtual Filesystem
      if (Array.isArray(saveObj.scripts) && saveObj.scripts.length > 0) {
        this.vfs.loadFromFiles(saveObj.scripts);
      }

      this.saveEngineState();
      this.addLog(1, 'system', 'Progresso importado com sucesso a partir do arquivo de Save!');
      this.notify();
      return true;
    } catch (err) {
      console.error('Failed to import save:', err);
      return false;
    }
  }
}
