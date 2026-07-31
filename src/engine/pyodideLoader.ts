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

    const getAg = () => engine.getAgent(agentId);

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
        const ag = getAg();
        return engine.plantCrop(agentId, ag?.x ?? 0, ag?.y ?? 0, crop || 'WILD_FIBER');
      },
      farm_harvest: () => {
        const ag = getAg();
        return engine.harvestTile(agentId, ag?.x ?? 0, ag?.y ?? 0);
      },
      farm_can_harvest: () => {
        const ag = getAg();
        return engine.canHarvestTile(ag?.x ?? 0, ag?.y ?? 0);
      },
      farm_water: () => {
        if (!engine.isTechUnlocked('AGRO_1')) {
          throw new Error("Recurso 'Irrigação' bloqueado!");
        }
        const ag = getAg();
        return engine.waterTile(agentId, ag?.x ?? 0, ag?.y ?? 0);
      },
      farm_till: () => {
        if (!engine.isTechUnlocked('AGRO_3')) {
          throw new Error("Recurso 'Solo Arado' bloqueado!");
        }
        const ag = getAg();
        return engine.tillTile(agentId, ag?.x ?? 0, ag?.y ?? 0);
      },
      farm_swap: (dir: string) => {
        if (!engine.isTechUnlocked('AGRO_7')) {
          throw new Error("Recurso 'Swap' bloqueado!");
        }
        const ag = getAg();
        return engine.swapTiles(agentId, ag?.x ?? 0, ag?.y ?? 0, dir || 'RIGHT');
      },
      farm_prestige: (resource: string, amount: number) => {
        const ag = getAg();
        return engine.offerPrestigeResource(agentId, ag?.x ?? 0, ag?.y ?? 0, resource || 'fiber', amount || 1);
      },
      world_clear: () => {
        engine.clearWorld();
        return true;
      },
      world_move: (dir: string) => engine.moveAgent(agentId, dir || 'RIGHT'),
      world_can_move: (dir: string) => engine.canMoveAgent(agentId, dir || 'RIGHT'),
      world_x: () => getAg()?.x ?? 0,
      world_y: () => getAg()?.y ?? 0,
      world_width: () => engine.getGridWidth(),
      world_height: () => engine.getGridHeight(),
      world_ground: () => {
        const ag = getAg();
        return engine.getTile(ag?.x ?? 0, ag?.y ?? 0).ground;
      },
      world_entity: () => {
        const ag = getAg();
        return engine.getTile(ag?.x ?? 0, ag?.y ?? 0).crop;
      },
      world_crop: () => {
        const ag = getAg();
        return engine.getTile(ag?.x ?? 0, ag?.y ?? 0).crop;
      },
      world_moisture: () => {
        const ag = getAg();
        return engine.getTile(ag?.x ?? 0, ag?.y ?? 0).moisture;
      },
      world_growth: () => {
        const ag = getAg();
        return engine.getTile(ag?.x ?? 0, ag?.y ?? 0).growth;
      },
      world_measure: () => {
        const ag = getAg();
        return engine.measureTile(ag?.x ?? 0, ag?.y ?? 0);
      },
      world_companion: () => {
        const ag = getAg();
        return engine.getCompanionRequest(ag?.x ?? 0, ag?.y ?? 0);
      },
      inventory_count: (res: string) => engine.getResourceCount(res || 'fiber'),
      sys_get_agent_stats: () => engine.getAgentStats(agentId)
    };

    const initScript = `
import ast

class _GuardrailChecker(ast.NodeVisitor):
    def __init__(self, bridge):
        self.bridge = bridge

    def visit_If(self, node):
        if not self.bridge.is_tech_unlocked('AUTO_3'):
            raise Exception("Recurso 'Condicionais (if/else)' está bloqueado! Pesquise AUTO_3 na Árvore de Pesquisa.")
        self.generic_visit(node)

    def visit_IfExp(self, node):
        if not self.bridge.is_tech_unlocked('AUTO_3'):
            raise Exception("Recurso 'Condicionais (if/else)' está bloqueado! Pesquise AUTO_3 na Árvore de Pesquisa.")
        self.generic_visit(node)

    def visit_BoolOp(self, node):
        if not self.bridge.is_tech_unlocked('AUTO_3'):
            raise Exception("Recurso 'Operadores Lógicos' está bloqueado! Pesquise AUTO_3 na Árvore de Pesquisa.")
        self.generic_visit(node)

    def visit_UnaryOp(self, node):
        if isinstance(node.op, ast.Not):
            if not self.bridge.is_tech_unlocked('AUTO_3'):
                raise Exception("Recurso 'Operadores Lógicos' está bloqueado! Pesquise AUTO_3 na Árvore de Pesquisa.")
        self.generic_visit(node)

    def visit_While(self, node):
        if not self.bridge.is_tech_unlocked('AUTO_4'):
            raise Exception("Recurso 'Loops (while / for)' está bloqueado! Pesquise AUTO_4 na Árvore de Pesquisa.")
        self.generic_visit(node)

    def visit_For(self, node):
        if not self.bridge.is_tech_unlocked('AUTO_4'):
            raise Exception("Recurso 'Loops (while / for)' está bloqueado! Pesquise AUTO_4 na Árvore de Pesquisa.")
        self.generic_visit(node)

    def visit_FunctionDef(self, node):
        if not self.bridge.is_tech_unlocked('AUTO_5'):
            raise Exception("Recurso 'Funções' está bloqueado! Pesquise AUTO_5 na Árvore de Pesquisa.")
        self.generic_visit(node)

    def visit_AsyncFunctionDef(self, node):
        if not self.bridge.is_tech_unlocked('AUTO_5'):
            raise Exception("Recurso 'Funções' está bloqueado! Pesquise AUTO_5 na Árvore de Pesquisa.")
        self.generic_visit(node)

    def visit_Lambda(self, node):
        if not self.bridge.is_tech_unlocked('AUTO_5'):
            raise Exception("Recurso 'Funções' está bloqueado! Pesquise AUTO_5 na Árvore de Pesquisa.")
        self.generic_visit(node)

    def visit_Assign(self, node):
        if not self.bridge.is_tech_unlocked('AUTO_2'):
            raise Exception("Recurso 'Variáveis & Operadores' está bloqueado! Pesquise AUTO_2 na Árvore de Pesquisa.")
        self.generic_visit(node)

    def visit_AugAssign(self, node):
        if not self.bridge.is_tech_unlocked('AUTO_2'):
            raise Exception("Recurso 'Variáveis & Operadores' está bloqueado! Pesquise AUTO_2 na Árvore de Pesquisa.")
        self.generic_visit(node)

    def visit_AnnAssign(self, node):
        if not self.bridge.is_tech_unlocked('AUTO_2'):
            raise Exception("Recurso 'Variáveis & Operadores' está bloqueado! Pesquise AUTO_2 na Árvore de Pesquisa.")
        self.generic_visit(node)

    def visit_BinOp(self, node):
        if not self.bridge.is_tech_unlocked('AUTO_2'):
            raise Exception("Recurso 'Variáveis & Operadores' está bloqueado! Pesquise AUTO_2 na Árvore de Pesquisa.")
        self.generic_visit(node)

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

def _create_py_step_generator(code_str, _jsBridge):
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

    class SysAPI:
        def get_agent_stats(self):
            res = _jsBridge.sys_get_agent_stats()
            if hasattr(res, 'to_py'):
                return res.to_py()
            return dict(res)
        def getAgentStats(self):
            return self.get_agent_stats()
        def get_stats(self):
            return self.get_agent_stats()
        def getStats(self):
            return self.get_agent_stats()

    class AgentAPI:
        def get_stats(self):
            res = _jsBridge.sys_get_agent_stats()
            if hasattr(res, 'to_py'):
                return res.to_py()
            return dict(res)
        def getStats(self):
            return self.get_stats()

    farm = FarmAPI()
    world = WorldAPI()
    inventory = InventoryAPI()
    sys = SysAPI()
    agent = AgentAPI()

    def print(*args, **kwargs):
        _jsBridge.print(*[str(a) for a in args])

    env = {
        'farm': farm,
        'world': world,
        'inventory': inventory,
        'sys': sys,
        'agent': agent,
        'print': print,
        '__builtins__': __builtins__
    }

    parsed = ast.parse(code_str)
    _GuardrailChecker(_jsBridge).visit(parsed)
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
    exec(compiled, env)
    return env['__user_step_gen__']()
`;

    py.runPython(initScript);

    const pyGenFunc = py.globals.get('_create_py_step_generator');
    const pyGen = pyGenFunc(code, jsBridge);

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

    const getAg = () => engine.getAgent(agentId);
    if (!getAg()) return { success: false, error: 'Agente não encontrado' };

    // Setup bridge callbacks in JS namespace
    const jsBridge = {
      is_tech_unlocked: (techId: string) => engine.isTechUnlocked(techId),
      print: (...args: any[]) => {
        const msg = args.map(a => (a === null || a === undefined ? '' : String(a))).join(' ');
        engine.addLog(agentId, 'stdout', msg, undefined, filePath);
      },
      farm_plant: (crop: string) => {
        const upper = (crop || 'WILD_FIBER').toUpperCase();
        if ((upper.includes('BUSH') || upper.includes('WOODY') || upper === 'WOOD') && !engine.isTechUnlocked('AGRO_2')) {
          throw new Error("Cultura 'Arbusto de Madeira' está bloqueada! Pesquise AGRO_2 na Árvore de Pesquisa.");
        }
        if ((upper.includes('ROOT') || upper.includes('CULTIVATED') || upper === 'CORN') && !engine.isTechUnlocked('AGRO_3')) {
          throw new Error("Cultura 'Raízes Cultivadas' está bloqueada! Pesquise AGRO_3 na Árvore de Pesquisa.");
        }
        if ((upper.includes('TREE') || upper.includes('TIMBER')) && !engine.isTechUnlocked('AGRO_4')) {
          throw new Error("Cultura 'Árvores & Madeira Nobre' está bloqueada! Pesquise AGRO_4 na Árvore de Pesquisa.");
        }
        if ((upper.includes('FRUIT') || upper.includes('BERRY')) && !engine.isTechUnlocked('AGRO_5')) {
          throw new Error("Cultura 'Colônias de Frutas' está bloqueada! Pesquise AGRO_5 na Árvore de Pesquisa.");
        }
        if ((upper.includes('FLOWER') || upper.includes('ENERGY')) && !engine.isTechUnlocked('AGRO_6')) {
          throw new Error("Cultura 'Flores Energéticas' está bloqueada! Pesquise AGRO_6 na Árvore de Pesquisa.");
        }
        if (upper.includes('GRADED') && !engine.isTechUnlocked('AGRO_7')) {
          throw new Error("Cultura 'Culturas Graduadas' está bloqueada! Pesquise AGRO_7 na Árvore de Pesquisa.");
        }
        if (!engine.isTechUnlocked('AGRO_1')) {
          throw new Error("Recurso 'Fibra Selvagem' bloqueado! Pesquise AGRO_1 na Árvore de Pesquisa.");
        }
        const ag = getAg();
        return engine.plantCrop(agentId, ag?.x ?? 0, ag?.y ?? 0, crop || 'WILD_FIBER');
      },
      farm_harvest: () => {
        const ag = getAg();
        return engine.harvestTile(agentId, ag?.x ?? 0, ag?.y ?? 0);
      },
      farm_can_harvest: () => {
        const ag = getAg();
        return engine.canHarvestTile(ag?.x ?? 0, ag?.y ?? 0);
      },
      farm_water: () => {
        if (!engine.isTechUnlocked('AGRO_1')) {
          throw new Error("Recurso 'Irrigação' bloqueado! Pesquise AGRO_1 na Árvore de Pesquisa.");
        }
        const ag = getAg();
        return engine.waterTile(agentId, ag?.x ?? 0, ag?.y ?? 0);
      },
      farm_till: () => {
        if (!engine.isTechUnlocked('AGRO_3')) {
          throw new Error("Recurso 'Solo Arado & Raízes Cultivadas' está bloqueado! Pesquise AGRO_3 na Árvore de Pesquisa.");
        }
        const ag = getAg();
        return engine.tillTile(agentId, ag?.x ?? 0, ag?.y ?? 0);
      },
      farm_swap: (dir: string) => {
        if (!engine.isTechUnlocked('AGRO_7')) {
          throw new Error("Recurso 'Trocar Terrenos (Swap)' está bloqueado! Pesquise AGRO_7 na Árvore de Pesquisa.");
        }
        const ag = getAg();
        return engine.swapTiles(agentId, ag?.x ?? 0, ag?.y ?? 0, dir || 'RIGHT');
      },
      farm_prestige: (resource: string, amount: number) => {
        const ag = getAg();
        return engine.offerPrestigeResource(agentId, ag?.x ?? 0, ag?.y ?? 0, resource || 'fiber', amount || 1);
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
      world_x: () => {
        if (!engine.isTechUnlocked('SYS_2')) {
          throw new Error("Recurso 'Sensores Básicos & Coordenadas' está bloqueado! Pesquise SYS_2 na Árvore de Pesquisa.");
        }
        return getAg()?.x ?? 0;
      },
      world_y: () => {
        if (!engine.isTechUnlocked('SYS_2')) {
          throw new Error("Recurso 'Sensores Básicos & Coordenadas' está bloqueado! Pesquise SYS_2 na Árvore de Pesquisa.");
        }
        return getAg()?.y ?? 0;
      },
      world_width: () => {
        if (!engine.isTechUnlocked('SYS_2')) {
          throw new Error("Recurso 'Sensores Básicos & Coordenadas' está bloqueado! Pesquise SYS_2 na Árvore de Pesquisa.");
        }
        return engine.getGridWidth();
      },
      world_height: () => {
        if (!engine.isTechUnlocked('SYS_2')) {
          throw new Error("Recurso 'Sensores Básicos & Coordenadas' está bloqueado! Pesquise SYS_2 na Árvore de Pesquisa.");
        }
        return engine.getGridHeight();
      },
      world_ground: () => {
        if (!engine.isTechUnlocked('SYS_2')) {
          throw new Error("Recurso 'Sensores Básicos & Coordenadas' está bloqueado! Pesquise SYS_2 na Árvore de Pesquisa.");
        }
        const ag = getAg();
        return engine.getTile(ag?.x ?? 0, ag?.y ?? 0).ground;
      },
      world_entity: () => {
        if (!engine.isTechUnlocked('SYS_2')) {
          throw new Error("Recurso 'Sensores Básicos & Coordenadas' está bloqueado! Pesquise SYS_2 na Árvore de Pesquisa.");
        }
        const ag = getAg();
        return engine.getTile(ag?.x ?? 0, ag?.y ?? 0).crop;
      },
      world_crop: () => {
        if (!engine.isTechUnlocked('SYS_2')) {
          throw new Error("Recurso 'Sensores Básicos & Coordenadas' está bloqueado! Pesquise SYS_2 na Árvore de Pesquisa.");
        }
        const ag = getAg();
        return engine.getTile(ag?.x ?? 0, ag?.y ?? 0).crop;
      },
      world_moisture: () => {
        if (!engine.isTechUnlocked('SYS_2')) {
          throw new Error("Recurso 'Sensores Básicos & Coordenadas' está bloqueado! Pesquise SYS_2 na Árvore de Pesquisa.");
        }
        const ag = getAg();
        return engine.getTile(ag?.x ?? 0, ag?.y ?? 0).moisture;
      },
      world_growth: () => {
        if (!engine.isTechUnlocked('SYS_2')) {
          throw new Error("Recurso 'Sensores Básicos & Coordenadas' está bloqueado! Pesquise SYS_2 na Árvore de Pesquisa.");
        }
        const ag = getAg();
        return engine.getTile(ag?.x ?? 0, ag?.y ?? 0).growth;
      },
      world_measure: () => {
        if (!engine.isTechUnlocked('SYS_3')) {
          throw new Error("Recurso 'Medição de Bloco' está bloqueado! Pesquise SYS_3 na Árvore de Pesquisa.");
        }
        const ag = getAg();
        return engine.measureTile(ag?.x ?? 0, ag?.y ?? 0);
      },
      world_companion: () => {
        const ag = getAg();
        return engine.getCompanionRequest(ag?.x ?? 0, ag?.y ?? 0);
      },
      inventory_count: (res: string) => {
        if (!engine.isTechUnlocked('SYS_2')) {
          throw new Error("Recurso 'Sensor de Inventário' está bloqueado! Pesquise SYS_2 na Árvore de Pesquisa.");
        }
        return engine.getResourceCount(res || 'fiber');
      },
      sys_get_agent_stats: () => {
        if (!engine.isTechUnlocked('SYS_4')) {
          throw new Error("Recurso 'Telemetria & Estatísticas do Agente' está bloqueado! Pesquise SYS_4 na Árvore de Pesquisa.");
        }
        return engine.getAgentStats(agentId);
      }
    };

    const pythonIsolatedExec = `
def _exec_isolated_py(code_str, _jsBridge):
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

    class SysAPI:
        def get_agent_stats(self):
            res = _jsBridge.sys_get_agent_stats()
            if hasattr(res, 'to_py'):
                return res.to_py()
            return dict(res)
        def getAgentStats(self):
            return self.get_agent_stats()
        def get_stats(self):
            return self.get_agent_stats()
        def getStats(self):
            return self.get_agent_stats()

    class AgentAPI:
        def get_stats(self):
            res = _jsBridge.sys_get_agent_stats()
            if hasattr(res, 'to_py'):
                return res.to_py()
            return dict(res)
        def getStats(self):
            return self.get_stats()

    farm = FarmAPI()
    world = WorldAPI()
    inventory = InventoryAPI()
    sys = SysAPI()
    agent = AgentAPI()

    def print(*args, **kwargs):
        _jsBridge.print(*[str(a) for a in args])

    env = {
        'farm': farm,
        'world': world,
        'inventory': inventory,
        'sys': sys,
        'agent': agent,
        'print': print,
        '__builtins__': __builtins__
    }

    parsed = ast.parse(code_str)
    _GuardrailChecker(_jsBridge).visit(parsed)
    exec(code_str, env)
`;

    try {
      await py.runPythonAsync(pythonIsolatedExec);
      const runner = py.globals.get('_exec_isolated_py');
      runner(code, jsBridge);
      return { success: true };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      engine.addLog(agentId, 'stderr', `PyodideError: ${errMsg}`, undefined, filePath);
      return { success: false, error: errMsg };
    }
  }
}
