import { GameEngine } from './GameEngine';

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<any>;
    pyodideInstance?: any;
    pyodideLoadingPromise?: Promise<any>;
  }
}

export class PyodideManager {
  private static pyodideInstance: any = null;
  private static isInitializing = false;
  private static initPromise: Promise<any> | null = null;

  public static isReady(): boolean {
    return !!this.pyodideInstance;
  }

  public static async getInstance(): Promise<any> {
    if (this.pyodideInstance) return this.pyodideInstance;

    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        if (typeof window === 'undefined') return null;

        if (!window.loadPyodide) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Falha ao carregar CDN do Pyodide WASM.'));
            document.head.appendChild(script);
          });
        }

        if (window.loadPyodide) {
          const py = await window.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'
          });
          this.pyodideInstance = py;
          window.pyodideInstance = py;
          return py;
        }
      } catch (err) {
        console.warn('Pyodide WASM init fallback:', err);
        this.initPromise = null;
        return null;
      }
      return null;
    })();

    return this.initPromise;
  }

  public static async createStepGenerator(
    code: string,
    agentId: number,
    engine: GameEngine,
    filePath: string
  ): Promise<{ next: () => { done: boolean; value?: number } }> {
    const py = await this.getInstance();
    if (!py) {
      throw new Error('Pyodide WASM não está pronto.');
    }

    const agent = engine.getAgent(agentId);
    if (!agent) {
      throw new Error('Agente não encontrado.');
    }

    const jsBridge = {
      print: (...args: any[]) => {
        const msg = args.map(a => (a === null || a === undefined ? '' : String(a))).join(' ');
        engine.addLog(agentId, 'stdout', msg, undefined, filePath);
      },
      farm_plant: (crop: string) => {
        if (!engine.isTechUnlocked('AGRO_1')) {
          throw new Error("Recurso 'Fibra Selvagem' bloqueado! Pesquise na Árvore de Pesquisa.");
        }
        return engine.plantCrop(agentId, agent.x, agent.y, crop || 'WILD_FIBER');
      },
      farm_harvest: () => engine.harvestTile(agentId, agent.x, agent.y),
      farm_can_harvest: () => engine.canHarvestTile(agent.x, agent.y),
      farm_water: () => {
        if (!engine.isTechUnlocked('AGRO_1')) {
          throw new Error("Recurso 'Irrigação' bloqueado!");
        }
        return engine.waterTile(agentId, agent.x, agent.y);
      },
      farm_till: () => {
        if (!engine.isTechUnlocked('AGRO_3')) {
          throw new Error("Recurso 'Solo Arado' bloqueado!");
        }
        return engine.tillTile(agentId, agent.x, agent.y);
      },
      farm_swap: (dir: string) => {
        if (!engine.isTechUnlocked('AGRO_7')) {
          throw new Error("Recurso 'Swap' bloqueado!");
        }
        return engine.swapTiles(agentId, agent.x, agent.y, dir || 'RIGHT');
      },
      farm_prestige: (resource: string, amount: number) => engine.offerPrestigeResource(agentId, agent.x, agent.y, resource || 'fiber', amount || 1),
      world_clear: () => { engine.clearWorld(); return true; },
      world_move: (dir: string) => engine.moveAgent(agentId, dir || 'RIGHT'),
      world_can_move: (dir: string) => engine.canMoveAgent(agentId, dir || 'RIGHT'),
      world_x: () => agent.x,
      world_y: () => agent.y,
      world_width: () => engine.getGridWidth(),
      world_height: () => engine.getGridHeight(),
      world_ground: () => engine.getTile(agent.x, agent.y).ground,
      world_entity: () => engine.getTile(agent.x, agent.y).crop,
      world_crop: () => engine.getTile(agent.x, agent.y).crop,
      world_moisture: () => engine.getTile(agent.x, agent.y).moisture,
      world_growth: () => engine.getTile(agent.x, agent.y).growth,
      world_measure: () => engine.measureTile(agent.x, agent.y),
      world_companion: () => engine.getCompanionRequest(agent.x, agent.y),
      inventory_count: (res: string) => engine.getResourceCount(res || 'fiber')
    };

    py.globals.set('_jsBridge', jsBridge);

    const initScript = `
import ast, js

class FarmAPI:
    def plant(self, crop="WILD_FIBER"):
        return _jsBridge.farm_plant(str(crop))
    def harvest(self):
        return _jsBridge.farm_harvest()
    def can_harvest(self):
        return _jsBridge.farm_can_harvest()
    def canHarvest(self):
        return _jsBridge.farm_can_harvest()
    def water(self):
        return _jsBridge.farm_water()
    def till(self):
        return _jsBridge.farm_till()
    def swap(self, dir="RIGHT"):
        return _jsBridge.farm_swap(str(dir))
    def prestige(self, resource="fiber", amount=1):
        return _jsBridge.farm_prestige(str(resource), int(amount))
    def clear(self):
        return _jsBridge.world_clear()

class WorldAPI:
    def move(self, direction="RIGHT"):
        return _jsBridge.world_move(str(direction))
    def can_move(self, direction="RIGHT"):
        return _jsBridge.world_can_move(str(direction))
    def canMove(self, direction="RIGHT"):
        return _jsBridge.world_can_move(str(direction))
    def x(self):
        return _jsBridge.world_x()
    def y(self):
        return _jsBridge.world_y()
    def width(self):
        return _jsBridge.world_width()
    def height(self):
        return _jsBridge.world_height()
    def ground(self):
        return _jsBridge.world_ground()
    def entity(self):
        return _jsBridge.world_entity()
    def crop(self):
        return _jsBridge.world_crop()
    def moisture(self):
        return _jsBridge.world_moisture()
    def growth(self):
        return _jsBridge.world_growth()
    def measure(self):
        return _jsBridge.world_measure()
    def get_companion(self):
        return _jsBridge.world_companion()
    def getCompanion(self):
        return _jsBridge.world_companion()
    def clear(self):
        return _jsBridge.world_clear()

class InventoryAPI:
    def count(self, item="fiber"):
        return _jsBridge.inventory_count(str(item))

farm = FarmAPI()
world = WorldAPI()
inventory = InventoryAPI()

def print(*args, **kwargs):
    _jsBridge.print(*[str(a) for a in args])

class _StepInserter(ast.NodeTransformer):
    def generic_visit(self, node):
        super().generic_visit(node)
        if hasattr(node, 'body') and isinstance(node.body, list):
            new_body = []
            for stmt in node.body:
                if hasattr(stmt, 'lineno'):
                    yield_node = ast.Expr(value=ast.Yield(value=ast.Constant(value=stmt.lineno)))
                    ast.copy_location(yield_node, stmt)
                    new_body.append(yield_node)
                new_body.append(stmt)
            node.body = new_body
        if hasattr(node, 'orelse') and isinstance(node.orelse, list):
            new_orelse = []
            for stmt in node.orelse:
                if hasattr(stmt, 'lineno'):
                    yield_node = ast.Expr(value=ast.Yield(value=ast.Constant(value=stmt.lineno)))
                    ast.copy_location(yield_node, stmt)
                    new_orelse.append(yield_node)
                new_orelse.append(stmt)
            node.orelse = new_orelse
        return node

def _create_py_step_generator(code_str):
    parsed = ast.parse(code_str)
    transformed = _StepInserter().visit(parsed)
    gen_func_def = ast.FunctionDef(
        name='__user_step_gen__',
        args=ast.arguments(
            posonlyargs=[], args=[], vararg=None, kwonlyargs=[],
            kw_defaults=[], kwarg=None, defaults=[]
        ),
        body=transformed.body,
        decorator_list=[],
        returns=None
    )
    module = ast.Module(body=[gen_func_def], type_ignores=[])
    ast.fix_missing_locations(module)
    compiled = compile(module, filename="<user_script>", mode="exec")
    namespace = {}
    exec(compiled, globals(), namespace)
    return namespace['__user_step_gen__']()
`;

    py.runPython(initScript);

    py.globals.set('_user_code_raw', code);
    const pyGen = py.runPython(`_create_py_step_generator(_user_code_raw)`);

    return {
      next: () => {
        try {
          const val = pyGen.__next__ ? pyGen.__next__() : pyGen.next().value;
          return { done: false, value: Number(val) };
        } catch (e: any) {
          if (e?.type === 'StopIteration' || String(e).includes('StopIteration')) {
            return { done: true };
          }
          throw e;
        }
      }
    };
  }

  public static async executePythonScript(
    code: string,
    agentId: number,
    engine: GameEngine,
    filePath: string
  ): Promise<{ success: boolean; output?: any; error?: string }> {
    const py = await this.getInstance();
    if (!py) {
      throw new Error('Pyodide WASM não está carregado. Usando interpretador padrão.');
    }

    const agent = engine.getAgent(agentId);
    if (!agent) return { success: false, error: 'Agente não encontrado' };

    // Setup bridge callbacks in JS namespace
    const jsBridge = {
      print: (...args: any[]) => {
        const msg = args.map(a => (a === null || a === undefined ? '' : String(a))).join(' ');
        engine.addLog(agentId, 'stdout', msg, undefined, filePath);
      },
      farm_plant: (crop: string) => {
        if (!engine.isTechUnlocked('AGRO_1')) {
          throw new Error("Recurso 'Fibra Selvagem' bloqueado! Pesquise na Árvore de Pesquisa.");
        }
        return engine.plantCrop(agentId, agent.x, agent.y, crop || 'WILD_FIBER');
      },
      farm_harvest: () => {
        return engine.harvestTile(agentId, agent.x, agent.y);
      },
      farm_can_harvest: () => {
        return engine.canHarvestTile(agent.x, agent.y);
      },
      farm_water: () => {
        if (!engine.isTechUnlocked('AGRO_1')) {
          throw new Error("Recurso 'Irrigação' bloqueado!");
        }
        return engine.waterTile(agentId, agent.x, agent.y);
      },
      farm_till: () => {
        if (!engine.isTechUnlocked('AGRO_3')) {
          throw new Error("Recurso 'Solo Arado' bloqueado!");
        }
        return engine.tillTile(agentId, agent.x, agent.y);
      },
      farm_swap: (dir: string) => {
        if (!engine.isTechUnlocked('AGRO_7')) {
          throw new Error("Recurso 'Swap' bloqueado!");
        }
        return engine.swapTiles(agentId, agent.x, agent.y, dir || 'RIGHT');
      },
      farm_prestige: (resource: string, amount: number) => {
        return engine.offerPrestigeResource(agentId, agent.x, agent.y, resource || 'fiber', amount || 1);
      },
      world_clear: () => {
        engine.clearWorld();
        return true;
      },
      world_move: (dir: string) => {
        return engine.moveAgent(agentId, dir || 'RIGHT');
      },
      world_can_move: (dir: string) => {
        return engine.canMoveAgent(agentId, dir || 'RIGHT');
      },
      world_x: () => agent.x,
      world_y: () => agent.y,
      world_width: () => engine.getGridWidth(),
      world_height: () => engine.getGridHeight(),
      world_ground: () => engine.getTile(agent.x, agent.y).ground,
      world_entity: () => engine.getTile(agent.x, agent.y).crop,
      world_crop: () => engine.getTile(agent.x, agent.y).crop,
      world_moisture: () => engine.getTile(agent.x, agent.y).moisture,
      world_growth: () => engine.getTile(agent.x, agent.y).growth,
      world_measure: () => engine.measureTile(agent.x, agent.y),
      world_companion: () => engine.getCompanionRequest(agent.x, agent.y),
      inventory_count: (res: string) => engine.getResourceCount(res || 'fiber')
    };

    py.globals.set('_jsBridge', jsBridge);

    // Define Python wrapper classes/modules inside Pyodide environment
    const pythonEnvInit = `
import js
from pyodide.ffi import JsProxy

class FarmAPI:
    def plant(self, crop="WILD_FIBER"):
        return _jsBridge.farm_plant(str(crop))
    def harvest(self):
        return _jsBridge.farm_harvest()
    def can_harvest(self):
        return _jsBridge.farm_can_harvest()
    def canHarvest(self):
        return _jsBridge.farm_can_harvest()
    def water(self):
        return _jsBridge.farm_water()
    def till(self):
        return _jsBridge.farm_till()
    def swap(self, dir="RIGHT"):
        return _jsBridge.farm_swap(str(dir))
    def prestige(self, resource="fiber", amount=1):
        return _jsBridge.farm_prestige(str(resource), int(amount))
    def clear(self):
        return _jsBridge.world_clear()

class WorldAPI:
    def move(self, direction="RIGHT"):
        return _jsBridge.world_move(str(direction))
    def can_move(self, direction="RIGHT"):
        return _jsBridge.world_can_move(str(direction))
    def canMove(self, direction="RIGHT"):
        return _jsBridge.world_can_move(str(direction))
    def x(self):
        return _jsBridge.world_x()
    def y(self):
        return _jsBridge.world_y()
    def width(self):
        return _jsBridge.world_width()
    def height(self):
        return _jsBridge.world_height()
    def ground(self):
        return _jsBridge.world_ground()
    def entity(self):
        return _jsBridge.world_entity()
    def crop(self):
        return _jsBridge.world_crop()
    def moisture(self):
        return _jsBridge.world_moisture()
    def growth(self):
        return _jsBridge.world_growth()
    def measure(self):
        return _jsBridge.world_measure()
    def get_companion(self):
        return _jsBridge.world_companion()
    def getCompanion(self):
        return _jsBridge.world_companion()
    def clear(self):
        return _jsBridge.world_clear()

class InventoryAPI:
    def count(self, item="fiber"):
        return _jsBridge.inventory_count(str(item))

farm = FarmAPI()
world = WorldAPI()
inventory = InventoryAPI()

def print(*args, **kwargs):
    _jsBridge.print(*[str(a) for a in args])
`;

    try {
      await py.runPythonAsync(pythonEnvInit);
      await py.runPythonAsync(code);
      return { success: true };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      engine.addLog(agentId, 'stderr', `PyodideError: ${errMsg}`, undefined, filePath);
      return { success: false, error: errMsg };
    }
  }
}
