import { GameEngine } from './GameEngine';

export class JavaScriptSandbox {
  public static async executeJsScript(
    code: string,
    agentId: number,
    engine: GameEngine,
    filePath: string
  ): Promise<{ success: boolean; error?: string }> {
    const agent = engine.getAgent(agentId);
    if (!agent) return { success: false, error: 'Agente não encontrado' };

    const farm = {
      plant: (crop = 'WILD_FIBER') => {
        if (!engine.isTechUnlocked('AGRO_1')) {
          throw new Error("Recurso 'Fibra Selvagem' está bloqueado!");
        }
        return engine.plantCrop(agentId, agent.x, agent.y, crop);
      },
      harvest: () => engine.harvestTile(agentId, agent.x, agent.y),
      canHarvest: () => engine.canHarvestTile(agent.x, agent.y),
      can_harvest: () => engine.canHarvestTile(agent.x, agent.y),
      water: () => {
        if (!engine.isTechUnlocked('AGRO_1')) {
          throw new Error("Recurso 'Irrigação' está bloqueado!");
        }
        return engine.waterTile(agentId, agent.x, agent.y);
      },
      till: () => {
        if (!engine.isTechUnlocked('AGRO_3')) {
          throw new Error("Recurso 'Solo Arado' está bloqueado!");
        }
        return engine.tillTile(agentId, agent.x, agent.y);
      },
      swap: (dir = 'RIGHT') => {
        if (!engine.isTechUnlocked('AGRO_7')) {
          throw new Error("Recurso 'Swap' está bloqueado!");
        }
        return engine.swapTiles(agentId, agent.x, agent.y, dir);
      }
    };

    const world = {
      move: (dir = 'RIGHT') => engine.moveAgent(agentId, dir),
      canMove: (dir = 'RIGHT') => engine.canMoveAgent(agentId, dir),
      can_move: (dir = 'RIGHT') => engine.canMoveAgent(agentId, dir),
      x: () => agent.x,
      y: () => agent.y,
      width: () => engine.getGridWidth(),
      height: () => engine.getGridHeight(),
      ground: () => engine.getTile(agent.x, agent.y).ground,
      entity: () => engine.getTile(agent.x, agent.y).crop,
      crop: () => engine.getTile(agent.x, agent.y).crop,
      moisture: () => engine.getTile(agent.x, agent.y).moisture,
      growth: () => engine.getTile(agent.x, agent.y).growth,
      measure: () => engine.measureTile(agent.x, agent.y)
    };

    const inventory = {
      count: (item = 'fiber') => engine.getResourceCount(item)
    };

    const customConsole = {
      log: (...args: any[]) => {
        const msg = args.map(a => (a === null || a === undefined ? '' : typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
        engine.addLog(agentId, 'stdout', msg, undefined, filePath);
      },
      error: (...args: any[]) => {
        const msg = args.map(a => String(a)).join(' ');
        engine.addLog(agentId, 'stderr', msg, undefined, filePath);
      }
    };

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    try {
      // Create async function sandbox
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      const runner = new AsyncFunction('farm', 'world', 'inventory', 'console', 'sleep', code);
      await runner(farm, world, inventory, customConsole, sleep);
      return { success: true };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      engine.addLog(agentId, 'stderr', `JSRuntimeError: ${errMsg}`, undefined, filePath);
      return { success: false, error: errMsg };
    }
  }
}
