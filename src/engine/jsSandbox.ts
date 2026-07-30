import * as acorn from 'acorn';
import { GameEngine } from './GameEngine';

export class JavaScriptSandbox {
  public static instrumentJsToGenerator(code: string): string {
    let ast: any;
    try {
      ast = acorn.parse(code, { ecmaVersion: 'latest', locations: true, allowReturnOutsideFunction: true });
    } catch (err) {
      // If syntax error, return code as is so native runtime throws error cleanly
      return code;
    }

    const transformNode = (node: any): string => {
      if (!node) return '';

      switch (node.type) {
        case 'Program':
        case 'BlockStatement': {
          const bodyCode = node.body.map((stmt: any) => transformStatement(stmt)).join('\n');
          return node.type === 'BlockStatement' ? `{\n${bodyCode}\n}` : bodyCode;
        }
        case 'IfStatement': {
          const line = node.loc?.start?.line || 1;
          const testCode = code.slice(node.test.start, node.test.end);
          const consequentCode = transformBranch(node.consequent);
          const alternateCode = node.alternate ? ` else ${transformBranch(node.alternate)}` : '';
          return `yield { line: ${line} };\nif (${testCode}) ${consequentCode}${alternateCode}`;
        }
        case 'WhileStatement': {
          const line = node.loc?.start?.line || 1;
          const testCode = code.slice(node.test.start, node.test.end);
          const bodyCode = transformBranch(node.body);
          return `yield { line: ${line} };\nwhile (${testCode}) ${bodyCode}`;
        }
        case 'DoWhileStatement': {
          const line = node.loc?.start?.line || 1;
          const testCode = code.slice(node.test.start, node.test.end);
          const bodyCode = transformBranch(node.body);
          return `yield { line: ${line} };\ndo ${bodyCode} while (${testCode});`;
        }
        case 'ForStatement': {
          const line = node.loc?.start?.line || 1;
          const initCode = node.init ? code.slice(node.init.start, node.init.end) : '';
          const testCode = node.test ? code.slice(node.test.start, node.test.end) : '';
          const updateCode = node.update ? code.slice(node.update.start, node.update.end) : '';
          const bodyCode = transformBranch(node.body);
          return `yield { line: ${line} };\nfor (${initCode}; ${testCode}; ${updateCode}) ${bodyCode}`;
        }
        case 'ForOfStatement':
        case 'ForInStatement': {
          const line = node.loc?.start?.line || 1;
          const keyword = node.type === 'ForOfStatement' ? 'of' : 'in';
          const leftCode = code.slice(node.left.start, node.left.end);
          const rightCode = code.slice(node.right.start, node.right.end);
          const bodyCode = transformBranch(node.body);
          return `yield { line: ${line} };\nfor (${leftCode} ${keyword} ${rightCode}) ${bodyCode}`;
        }
        case 'FunctionDeclaration': {
          const funcName = node.id ? node.id.name : '';
          const params = node.params.map((p: any) => code.slice(p.start, p.end)).join(', ');
          const body = transformNode(node.body);
          return `function ${funcName}(${params}) ${body}`;
        }
        case 'ExpressionStatement':
        case 'VariableDeclaration':
        case 'ReturnStatement':
        case 'BreakStatement':
        case 'ContinueStatement': {
          const line = node.loc?.start?.line || 1;
          const stmtCode = code.slice(node.start, node.end);
          return `yield { line: ${line} };\n${stmtCode}`;
        }
        default: {
          return code.slice(node.start, node.end);
        }
      }
    };

    const transformStatement = (stmt: any): string => transformNode(stmt);

    const transformBranch = (branch: any): string => {
      if (!branch) return '';
      if (branch.type === 'BlockStatement') {
        return transformNode(branch);
      } else {
        return `{\n${transformNode(branch)}\n}`;
      }
    };

    return transformNode(ast);
  }

  public static createStepGenerator(
    code: string,
    agentId: number,
    engine: GameEngine,
    filePath: string
  ): { next: () => { done: boolean; value?: number } } {
    const agent = engine.getAgent(agentId);
    if (!agent) {
      throw new Error('Agente não encontrado');
    }

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
      },
      prestige: (resource = 'fiber', amount = 1) => {
        return engine.offerPrestigeResource(agentId, agent.x, agent.y, resource, amount);
      },
      clear: () => {
        engine.clearWorld();
        return true;
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
      measure: () => engine.measureTile(agent.x, agent.y),
      getCompanion: () => engine.getCompanionRequest(agent.x, agent.y),
      get_companion: () => engine.getCompanionRequest(agent.x, agent.y),
      clear: () => {
        engine.clearWorld();
        return true;
      }
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

    const instrumentedCode = this.instrumentJsToGenerator(code);
    const GeneratorFunction = Object.getPrototypeOf(function* () {}).constructor;
    const genFunc = new GeneratorFunction('farm', 'world', 'inventory', 'console', instrumentedCode);
    const gen = genFunc(farm, world, inventory, customConsole);

    return {
      next: () => {
        const res = gen.next();
        if (res.done) {
          return { done: true };
        }
        return { done: false, value: res.value?.line || 1 };
      }
    };
  }

  public static async executeJsScript(
    code: string,
    agentId: number,
    engine: GameEngine,
    filePath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const gen = this.createStepGenerator(code, agentId, engine, filePath);
      let stepRes = gen.next();
      while (!stepRes.done) {
        stepRes = gen.next();
      }
      return { success: true };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      engine.addLog(agentId, 'stderr', `JSRuntimeError: ${errMsg}`, undefined, filePath);
      return { success: false, error: errMsg };
    }
  }
}
