import * as acorn from 'acorn';
import { GameEngine } from './GameEngine';

export class JavaScriptSandbox {
  public static checkJsGuardrails(node: any, engine: GameEngine): void {
    if (!node || typeof node !== 'object') return;

    switch (node.type) {
      case 'IfStatement':
      case 'ConditionalExpression': {
        if (!engine.isTechUnlocked('AUTO_3')) {
          throw new Error("Recurso 'Condicionais (if/else)' está bloqueado! Pesquise AUTO_3 na Árvore de Pesquisa.");
        }
        break;
      }
      case 'LogicalExpression': {
        if (!engine.isTechUnlocked('AUTO_3')) {
          throw new Error("Recurso 'Operadores Lógicos' está bloqueado! Pesquise AUTO_3 na Árvore de Pesquisa.");
        }
        break;
      }
      case 'UnaryExpression': {
        if (node.operator === '!' && !engine.isTechUnlocked('AUTO_3')) {
          throw new Error("Recurso 'Operadores Lógicos' está bloqueado! Pesquise AUTO_3 na Árvore de Pesquisa.");
        }
        break;
      }
      case 'WhileStatement':
      case 'DoWhileStatement':
      case 'ForStatement':
      case 'ForInStatement':
      case 'ForOfStatement': {
        if (!engine.isTechUnlocked('AUTO_4')) {
          throw new Error("Recurso 'Loops (while / for)' está bloqueado! Pesquise AUTO_4 na Árvore de Pesquisa.");
        }
        break;
      }
      case 'FunctionDeclaration':
      case 'FunctionExpression':
      case 'ArrowFunctionExpression': {
        if (!engine.isTechUnlocked('AUTO_5')) {
          throw new Error("Recurso 'Funções' está bloqueado! Pesquise AUTO_5 na Árvore de Pesquisa.");
        }
        break;
      }
      case 'VariableDeclaration':
      case 'AssignmentExpression': {
        if (!engine.isTechUnlocked('AUTO_2')) {
          throw new Error("Recurso 'Variáveis & Operadores' está bloqueado! Pesquise AUTO_2 na Árvore de Pesquisa.");
        }
        break;
      }
      case 'BinaryExpression': {
        if (['+', '-', '*', '/', '%'].includes(node.operator) && !engine.isTechUnlocked('AUTO_2')) {
          throw new Error("Recurso 'Variáveis & Operadores' está bloqueado! Pesquise AUTO_2 na Árvore de Pesquisa.");
        }
        break;
      }
    }

    for (const key of Object.keys(node)) {
      if (key === 'loc' || key === 'range') continue;
      const child = (node as any)[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          if (item && typeof item === 'object' && item.type) {
            this.checkJsGuardrails(item, engine);
          }
        }
      } else if (child && typeof child === 'object' && child.type) {
        this.checkJsGuardrails(child, engine);
      }
    }
  }

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
    // 1. AST Guardrails check for JS syntax
    try {
      const ast = acorn.parse(code, { ecmaVersion: 'latest', locations: true, allowReturnOutsideFunction: true });
      this.checkJsGuardrails(ast, engine);
    } catch (e: any) {
      if (e?.message && e.message.includes('bloqueado')) {
        throw e;
      }
    }

    const getAg = () => engine.getAgent(agentId);

    const farm = {
      plant: (crop = 'WILD_FIBER') => {
        const upper = String(crop || 'WILD_FIBER').toUpperCase();
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
          throw new Error("Recurso 'Fibra Selvagem' está bloqueado! Pesquise AGRO_1 na Árvore de Pesquisa.");
        }
        const ag = getAg();
        return engine.plantCrop(agentId, ag?.x ?? 0, ag?.y ?? 0, crop);
      },
      harvest: () => {
        const ag = getAg();
        return engine.harvestTile(agentId, ag?.x ?? 0, ag?.y ?? 0);
      },
      canHarvest: () => {
        const ag = getAg();
        return engine.canHarvestTile(ag?.x ?? 0, ag?.y ?? 0);
      },
      can_harvest: () => {
        const ag = getAg();
        return engine.canHarvestTile(ag?.x ?? 0, ag?.y ?? 0);
      },
      water: () => {
        if (!engine.isTechUnlocked('AGRO_1')) {
          throw new Error("Recurso 'Irrigação' está bloqueado! Pesquise AGRO_1 na Árvore de Pesquisa.");
        }
        const ag = getAg();
        return engine.waterTile(agentId, ag?.x ?? 0, ag?.y ?? 0);
      },
      till: () => {
        if (!engine.isTechUnlocked('AGRO_3')) {
          throw new Error("Recurso 'Solo Arado & Raízes Cultivadas' está bloqueado! Pesquise AGRO_3 na Árvore de Pesquisa.");
        }
        const ag = getAg();
        return engine.tillTile(agentId, ag?.x ?? 0, ag?.y ?? 0);
      },
      swap: (dir = 'RIGHT') => {
        if (!engine.isTechUnlocked('AGRO_7')) {
          throw new Error("Recurso 'Trocar Terrenos (Swap)' está bloqueado! Pesquise AGRO_7 na Árvore de Pesquisa.");
        }
        const ag = getAg();
        return engine.swapTiles(agentId, ag?.x ?? 0, ag?.y ?? 0, dir);
      },
      prestige: (resource = 'fiber', amount = 1) => {
        const ag = getAg();
        return engine.offerPrestigeResource(agentId, ag?.x ?? 0, ag?.y ?? 0, resource, amount);
      },
      clear: () => {
        engine.clearWorld();
        return true;
      }
    };

    const checkSys2 = () => {
      if (!engine.isTechUnlocked('SYS_2')) {
        throw new Error("Recurso 'Sensores Básicos & Coordenadas' está bloqueado! Pesquise SYS_2 na Árvore de Pesquisa.");
      }
    };

    const world = {
      move: (dir = 'RIGHT') => engine.moveAgent(agentId, dir),
      canMove: (dir = 'RIGHT') => engine.canMoveAgent(agentId, dir),
      can_move: (dir = 'RIGHT') => engine.canMoveAgent(agentId, dir),
      x: () => { checkSys2(); return getAg()?.x ?? 0; },
      y: () => { checkSys2(); return getAg()?.y ?? 0; },
      width: () => { checkSys2(); return engine.getGridWidth(); },
      height: () => { checkSys2(); return engine.getGridHeight(); },
      ground: () => {
        checkSys2();
        const ag = getAg();
        return engine.getTile(ag?.x ?? 0, ag?.y ?? 0).ground;
      },
      entity: () => {
        checkSys2();
        const ag = getAg();
        return engine.getTile(ag?.x ?? 0, ag?.y ?? 0).crop;
      },
      crop: () => {
        checkSys2();
        const ag = getAg();
        return engine.getTile(ag?.x ?? 0, ag?.y ?? 0).crop;
      },
      moisture: () => {
        checkSys2();
        const ag = getAg();
        return engine.getTile(ag?.x ?? 0, ag?.y ?? 0).moisture;
      },
      growth: () => {
        checkSys2();
        const ag = getAg();
        return engine.getTile(ag?.x ?? 0, ag?.y ?? 0).growth;
      },
      measure: () => {
        if (!engine.isTechUnlocked('SYS_3')) {
          throw new Error("Recurso 'Medição de Bloco' está bloqueado! Pesquise SYS_3 na Árvore de Pesquisa.");
        }
        const ag = getAg();
        return engine.measureTile(ag?.x ?? 0, ag?.y ?? 0);
      },
      getCompanion: () => {
        const ag = getAg();
        return engine.getCompanionRequest(ag?.x ?? 0, ag?.y ?? 0);
      },
      get_companion: () => {
        const ag = getAg();
        return engine.getCompanionRequest(ag?.x ?? 0, ag?.y ?? 0);
      },
      clear: () => {
        engine.clearWorld();
        return true;
      }
    };

    const inventory = {
      count: (item = 'fiber') => {
        if (!engine.isTechUnlocked('SYS_2')) {
          throw new Error("Recurso 'Sensor de Inventário' está bloqueado! Pesquise SYS_2 na Árvore de Pesquisa.");
        }
        return engine.getResourceCount(item);
      }
    };

    const checkSys4 = () => {
      if (!engine.isTechUnlocked('SYS_4')) {
        throw new Error("Recurso 'Telemetria & Estatísticas do Agente' está bloqueado! Pesquise SYS_4 na Árvore de Pesquisa.");
      }
    };

    const sys = {
      getAgentStats: () => { checkSys4(); return engine.getAgentStats(agentId); },
      get_agent_stats: () => { checkSys4(); return engine.getAgentStats(agentId); },
      getStats: () => { checkSys4(); return engine.getAgentStats(agentId); },
      get_stats: () => { checkSys4(); return engine.getAgentStats(agentId); }
    };

    const agentObj = {
      getStats: () => { checkSys4(); return engine.getAgentStats(agentId); },
      get_stats: () => { checkSys4(); return engine.getAgentStats(agentId); }
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
    const genFunc = new GeneratorFunction('farm', 'world', 'inventory', 'sys', 'agent', 'console', instrumentedCode);
    const gen = genFunc(farm, world, inventory, sys, agentObj, customConsole);

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
