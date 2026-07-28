import { Agent, ConsoleLog, Diagnostic, VariableScope } from '../../types/game';
import { GameEngine } from '../GameEngine';

export interface ExecutionContext {
  agentId: number;
  filePath: string;
  language: 'python' | 'javascript';
  lines: string[];
  currentLineIndex: number;
  scope: VariableScope;
  callStack: string[];
  loopStack: Array<{
    type?: 'while' | 'for';
    startLineIndex: number;
    endLineIndex: number;
    condition?: string;
    varName?: string;
    currentIter?: number;
    maxIter?: number;
    step?: number;
    items?: any[];
    condStr?: string;
    incStr?: string;
  }>;
  conditionalStack: Array<{
    blockEndLineIdx: number;
    chainEndLineIdx: number;
    indent?: number;
  }>;
  functionRegistry: Map<string, { params: string[]; bodyLines: string[]; startLine: number }>;
  instructionCount: number;
  actionsPerformedInRun: number;
  isCompleted: boolean;
}

export class ScriptRunner {
  private engine: GameEngine;

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  public createExecutionContext(agentId: number, filePath: string, code: string, language: 'python' | 'javascript'): ExecutionContext {
    const rawLines = code.split('\n');
    return {
      agentId,
      filePath,
      language,
      lines: rawLines,
      currentLineIndex: 0,
      scope: {
        width: 1,
        height: 1,
        step_count: 0
      },
      callStack: ['main()'],
      loopStack: [],
      conditionalStack: [],
      functionRegistry: new Map(),
      instructionCount: 0,
      actionsPerformedInRun: 0,
      isCompleted: false
    };
  }

  public executeStep(ctx: ExecutionContext, breakpoints: Set<number>): { paused: boolean; hitBreakpoint?: boolean; error?: string; completed?: boolean } {
    if (ctx.isCompleted || ctx.currentLineIndex >= ctx.lines.length) {
      if (ctx.loopStack.length > 0) {
        ctx.currentLineIndex = ctx.loopStack[ctx.loopStack.length - 1].startLineIndex;
      } else {
        ctx.isCompleted = true;
        return { paused: true, completed: true };
      }
    }

    const currentLineNum = ctx.currentLineIndex + 1;

    // Check budget
    ctx.instructionCount++;
    if (ctx.instructionCount > 100000 && ctx.actionsPerformedInRun === 0) {
      const err = `ExecutionBudgetExceeded: ${ctx.filePath}:${currentLineNum}\nExecuted 100,000 instructions without producing a world action. Potential infinite loop.`;
      this.engine.addLog(ctx.agentId, 'stderr', err, currentLineNum, ctx.filePath);
      return { paused: true, error: err };
    }

    const rawLine = ctx.lines[ctx.currentLineIndex];
    const line = rawLine.trim();

    // Skip empty lines & comments
    if (!line || line.startsWith('#') || line.startsWith('//') || line.startsWith('/*')) {
      ctx.currentLineIndex++;
      this.checkConditionalBoundary(ctx);
      this.checkLoopBoundary(ctx);
      if (ctx.currentLineIndex >= ctx.lines.length) {
        if (ctx.loopStack.length > 0) {
          ctx.currentLineIndex = ctx.loopStack[ctx.loopStack.length - 1].startLineIndex;
        } else {
          ctx.isCompleted = true;
          return { paused: true, completed: true };
        }
      }
      return { paused: false };
    }

    // Handle Function Definitions
    if (line.startsWith('def ') || line.startsWith('function ')) {
      if (!this.engine.isTechUnlocked('AUTO_5')) {
        throw new Error("'Functions' feature is locked! Research AUTO_5 in the Research Tree.");
      }
      this.parseFunctionDef(line, ctx);
      return { paused: false };
    }

    // Execute statement
    try {
      this.evaluateStatement(line, ctx);
    } catch (e: any) {
      const err = `RuntimeError: ${ctx.filePath}:${currentLineNum} - ${e.message || String(e)}`;
      this.engine.addLog(ctx.agentId, 'stderr', err, currentLineNum, ctx.filePath);
      return { paused: true, error: err };
    }

    // Advance line
    ctx.currentLineIndex++;
    this.checkConditionalBoundary(ctx);
    this.checkLoopBoundary(ctx);
    if (ctx.currentLineIndex >= ctx.lines.length) {
      if (ctx.loopStack.length > 0) {
        ctx.currentLineIndex = ctx.loopStack[ctx.loopStack.length - 1].startLineIndex;
      } else {
        ctx.isCompleted = true;
        return { paused: true, completed: true };
      }
    }

    // Check Breakpoint hit
    const nextLineNum = ctx.currentLineIndex + 1;
    if (breakpoints.has(nextLineNum)) {
      return { paused: true, hitBreakpoint: true };
    }

    return { paused: false };
  }

  private checkConditionalBoundary(ctx: ExecutionContext) {
    while (ctx.conditionalStack.length > 0) {
      const top = ctx.conditionalStack[ctx.conditionalStack.length - 1];

      if (ctx.currentLineIndex >= ctx.lines.length) {
        ctx.conditionalStack.pop();
        continue;
      }

      if (ctx.language === 'python') {
        const raw = ctx.lines[ctx.currentLineIndex];
        const trimmed = raw.trim();
        if (!trimmed || trimmed.startsWith('#')) {
          if (ctx.currentLineIndex > top.blockEndLineIdx) {
            ctx.conditionalStack.pop();
            ctx.currentLineIndex = top.chainEndLineIdx;
            continue;
          }
          break;
        }
        const lineIndent = raw.search(/\S|$/);
        if (lineIndent <= (top.indent ?? 0) || ctx.currentLineIndex > top.blockEndLineIdx) {
          ctx.conditionalStack.pop();
          ctx.currentLineIndex = top.chainEndLineIdx;
          continue;
        }
      } else {
        if (ctx.currentLineIndex > top.blockEndLineIdx) {
          ctx.conditionalStack.pop();
          ctx.currentLineIndex = top.chainEndLineIdx;
          continue;
        }
      }
      break;
    }
  }

  private checkLoopBoundary(ctx: ExecutionContext) {
    if (ctx.loopStack.length > 0 && ctx.currentLineIndex < ctx.lines.length) {
      const topLoop = ctx.loopStack[ctx.loopStack.length - 1];
      const loopLine = ctx.lines[topLoop.startLineIndex];
      const currentRawLine = ctx.lines[ctx.currentLineIndex];
      const trimmed = currentRawLine.trim();

      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('//')) {
        if (ctx.language === 'python') {
          const loopIndent = loopLine.search(/\S|$/);
          const currentIndent = currentRawLine.search(/\S|$/);
          if (currentIndent <= loopIndent) {
            ctx.currentLineIndex = topLoop.startLineIndex;
          }
        } else if (ctx.language === 'javascript') {
          if (topLoop.endLineIndex !== undefined && topLoop.endLineIndex !== -1) {
            if (ctx.currentLineIndex === topLoop.endLineIndex) {
              ctx.currentLineIndex = topLoop.startLineIndex;
            }
          } else if (trimmed === '}') {
            ctx.currentLineIndex = topLoop.startLineIndex;
          }
        }
      }
    }
  }

  private skipLoopBlock(ctx: ExecutionContext, startLineIdx: number) {
    const startLine = ctx.lines[startLineIdx];
    let idx = startLineIdx + 1;

    if (ctx.language === 'python') {
      const loopIndent = startLine.search(/\S|$/);
      while (idx < ctx.lines.length) {
        const raw = ctx.lines[idx];
        const trimmed = raw.trim();
        if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('//')) {
          const currentIndent = raw.search(/\S|$/);
          if (currentIndent <= loopIndent) {
            break;
          }
        }
        idx++;
      }
      ctx.currentLineIndex = idx - 1;
    } else {
      let braceDepth = (startLine.match(/\{/g) || []).length;
      let foundOpen = braceDepth > 0;
      while (idx < ctx.lines.length) {
        const line = ctx.lines[idx];
        if (line.includes('{')) {
          braceDepth += (line.match(/\{/g) || []).length;
          foundOpen = true;
        }
        if (line.includes('}')) {
          braceDepth -= (line.match(/\}/g) || []).length;
        }
        if (foundOpen && braceDepth <= 0) {
          break;
        }
        idx++;
      }
      ctx.currentLineIndex = idx;
    }
  }

  private handleWhileLoop(line: string, ctx: ExecutionContext) {
    if (!this.engine.isTechUnlocked('AUTO_4')) {
      throw new Error("'Loops (while/for)' feature is locked! Research AUTO_4 in the Research Tree.");
    }

    const existingIndex = ctx.loopStack.findIndex(l => l.startLineIndex === ctx.currentLineIndex);

    let condStr = 'true';
    if (line.includes('(') && line.includes(')')) {
      condStr = line.substring(line.indexOf('(') + 1, line.lastIndexOf(')'));
    } else if (line.startsWith('while ')) {
      condStr = line.replace('while ', '').replace(':', '').replace('{', '').trim();
    }
    if (condStr === 'True') condStr = 'true';

    const condVal = this.evalExpression(condStr, ctx);

    if (condVal) {
      if (existingIndex === -1) {
        let endLineIndex = -1;
        if (ctx.language === 'javascript') {
          let braceDepth = (line.match(/\{/g) || []).length;
          let endIdx = ctx.currentLineIndex + 1;
          while (endIdx < ctx.lines.length) {
            const l = ctx.lines[endIdx];
            if (l.includes('{')) braceDepth += (l.match(/\{/g) || []).length;
            if (l.includes('}')) braceDepth -= (l.match(/\}/g) || []).length;
            if (braceDepth <= 0 && endIdx > ctx.currentLineIndex) {
              break;
            }
            endIdx++;
          }
          endLineIndex = endIdx;
        }
        ctx.loopStack.push({
          type: 'while',
          startLineIndex: ctx.currentLineIndex,
          endLineIndex,
          condition: condStr
        });
      }
    } else {
      if (existingIndex !== -1) {
        ctx.loopStack.splice(existingIndex, 1);
      }
      this.skipLoopBlock(ctx, ctx.currentLineIndex);
    }
  }

  private handlePythonForLoop(line: string, ctx: ExecutionContext) {
    if (!this.engine.isTechUnlocked('AUTO_4')) {
      throw new Error("'Loops (while/for)' feature is locked! Research AUTO_4 in the Research Tree.");
    }

    const existingIndex = ctx.loopStack.findIndex(l => l.startLineIndex === ctx.currentLineIndex);

    if (existingIndex !== -1) {
      const loop = ctx.loopStack[existingIndex];
      if (loop.items) {
        loop.currentIter = (loop.currentIter ?? 0) + 1;
        if (loop.currentIter < (loop.maxIter ?? 0)) {
          ctx.scope[loop.varName!] = loop.items[loop.currentIter];
          return;
        }
      } else {
        const step = loop.step ?? 1;
        loop.currentIter = (loop.currentIter ?? 0) + step;
        const cur = loop.currentIter;
        const max = loop.maxIter ?? 0;
        if ((step > 0 && cur < max) || (step < 0 && cur > max)) {
          ctx.scope[loop.varName!] = cur;
          return;
        }
      }

      ctx.loopStack.splice(existingIndex, 1);
      this.skipLoopBlock(ctx, ctx.currentLineIndex);
      return;
    }

    const rangeMatch = line.match(/for\s+([a-zA-Z0-9_]+)\s+in\s+range\s*\((.*?)\)\s*:?/);
    if (rangeMatch) {
      const varName = rangeMatch[1];
      const argsStr = rangeMatch[2].trim();
      const args = argsStr ? argsStr.split(',').map(a => this.evalExpression(a.trim(), ctx)) : [0];

      let startVal = 0;
      let maxVal = 0;
      let stepVal = 1;

      if (args.length === 1) {
        maxVal = Number(args[0]) || 0;
      } else if (args.length === 2) {
        startVal = Number(args[0]) || 0;
        maxVal = Number(args[1]) || 0;
      } else if (args.length >= 3) {
        startVal = Number(args[0]) || 0;
        maxVal = Number(args[1]) || 0;
        stepVal = Number(args[2]) || 1;
      }

      if ((stepVal > 0 && startVal < maxVal) || (stepVal < 0 && startVal > maxVal)) {
        ctx.scope[varName] = startVal;
        ctx.loopStack.push({
          type: 'for',
          startLineIndex: ctx.currentLineIndex,
          endLineIndex: -1,
          varName,
          currentIter: startVal,
          maxIter: maxVal,
          step: stepVal
        });
      } else {
        this.skipLoopBlock(ctx, ctx.currentLineIndex);
      }
      return;
    }

    const listMatch = line.match(/for\s+([a-zA-Z0-9_]+)\s+in\s+\[(.*?)\]\s*:?/);
    if (listMatch) {
      const varName = listMatch[1];
      const itemsStr = listMatch[2].trim();
      const items = itemsStr ? itemsStr.split(',').map(s => this.evalExpression(s.trim(), ctx)) : [];

      if (items.length > 0) {
        ctx.scope[varName] = items[0];
        ctx.loopStack.push({
          type: 'for',
          startLineIndex: ctx.currentLineIndex,
          endLineIndex: -1,
          varName,
          items,
          currentIter: 0,
          maxIter: items.length,
          step: 1
        });
      } else {
        this.skipLoopBlock(ctx, ctx.currentLineIndex);
      }
      return;
    }

    this.skipLoopBlock(ctx, ctx.currentLineIndex);
  }

  private handleJSForLoop(line: string, ctx: ExecutionContext) {
    if (!this.engine.isTechUnlocked('AUTO_4')) {
      throw new Error("'Loops (while/for)' feature is locked! Research AUTO_4 in the Research Tree.");
    }

    const existingIndex = ctx.loopStack.findIndex(l => l.startLineIndex === ctx.currentLineIndex);

    if (existingIndex !== -1) {
      const loop = ctx.loopStack[existingIndex];
      if (loop.incStr) {
        this.evaluateStatement(loop.incStr, ctx);
      }
      const condVal = loop.condStr ? this.evalExpression(loop.condStr, ctx) : false;
      if (condVal) {
        return;
      } else {
        ctx.loopStack.splice(existingIndex, 1);
        this.skipLoopBlock(ctx, ctx.currentLineIndex);
        return;
      }
    }

    const match = line.match(/for\s*\((.*?);(.*?);(.*?)\)/);
    if (match) {
      const initStr = match[1].trim();
      const condStr = match[2].trim();
      const incStr = match[3].trim();

      if (initStr) {
        this.evaluateStatement(initStr, ctx);
      }

      const condVal = condStr ? this.evalExpression(condStr, ctx) : true;

      let braceDepth = (line.match(/\{/g) || []).length;
      let endIdx = ctx.currentLineIndex + 1;
      while (endIdx < ctx.lines.length) {
        const l = ctx.lines[endIdx];
        if (l.includes('{')) braceDepth += (l.match(/\{/g) || []).length;
        if (l.includes('}')) braceDepth -= (l.match(/\}/g) || []).length;
        if (braceDepth <= 0 && endIdx > ctx.currentLineIndex) {
          break;
        }
        endIdx++;
      }

      if (condVal) {
        ctx.loopStack.push({
          type: 'for',
          startLineIndex: ctx.currentLineIndex,
          endLineIndex: endIdx,
          condStr,
          incStr
        });
      } else {
        this.skipLoopBlock(ctx, ctx.currentLineIndex);
      }
      return;
    }

    this.skipLoopBlock(ctx, ctx.currentLineIndex);
  }

  private parsePythonConditionalChain(startLineIdx: number, ctx: ExecutionContext) {
    const baseLine = ctx.lines[startLineIdx];
    const baseIndent = baseLine.search(/\S|$/);

    const branches: Array<{
      type: 'if' | 'elif' | 'else';
      headerLineIdx: number;
      condStr?: string;
      blockStartIdx: number;
      blockEndIdx: number;
    }> = [];

    let currIdx = startLineIdx;

    while (currIdx < ctx.lines.length) {
      const raw = ctx.lines[currIdx];
      const trimmed = raw.trim();
      const indent = raw.search(/\S|$/);

      if (indent !== baseIndent) break;

      let type: 'if' | 'elif' | 'else' | null = null;
      let condStr = '';

      if (trimmed.startsWith('if ') || trimmed.startsWith('if(') || trimmed === 'if:' || trimmed.startsWith('if ')) {
        type = 'if';
        condStr = trimmed.replace(/^if\s*/, '').replace(/:$/, '').trim();
      } else if (trimmed.startsWith('elif ') || trimmed.startsWith('elif(') || trimmed === 'elif:' || trimmed.startsWith('elif ')) {
        type = 'elif';
        condStr = trimmed.replace(/^elif\s*/, '').replace(/:$/, '').trim();
      } else if (trimmed.startsWith('else:') || trimmed.startsWith('else ') || trimmed === 'else:') {
        type = 'else';
        condStr = '';
      } else {
        break;
      }

      if (condStr.startsWith('(') && condStr.endsWith(')')) {
        condStr = condStr.slice(1, -1);
      }

      const blockStartIdx = currIdx + 1;
      let scanIdx = blockStartIdx;
      let lastBlockLineIdx = currIdx;

      while (scanIdx < ctx.lines.length) {
        const scanRaw = ctx.lines[scanIdx];
        const scanTrimmed = scanRaw.trim();
        if (!scanTrimmed || scanTrimmed.startsWith('#')) {
          scanIdx++;
          continue;
        }
        const scanIndent = scanRaw.search(/\S|$/);
        if (scanIndent <= baseIndent) {
          break;
        }
        lastBlockLineIdx = scanIdx;
        scanIdx++;
      }

      branches.push({
        type,
        headerLineIdx: currIdx,
        condStr,
        blockStartIdx,
        blockEndIdx: lastBlockLineIdx
      });

      currIdx = scanIdx;
    }

    const chainEndIdx = currIdx;
    return { branches, chainEndIdx, baseIndent };
  }

  private parseJSConditionalChain(startLineIdx: number, ctx: ExecutionContext) {
    const branches: Array<{
      type: 'if' | 'elif' | 'else';
      headerLineIdx: number;
      condStr?: string;
      blockStartIdx: number;
      blockEndIdx: number;
    }> = [];

    let currIdx = startLineIdx;

    while (currIdx < ctx.lines.length) {
      const raw = ctx.lines[currIdx];
      const trimmed = raw.trim();

      let type: 'if' | 'elif' | 'else' | null = null;
      let condStr = '';

      if (trimmed.includes('if') && !trimmed.includes('else if')) {
        type = 'if';
        condStr = trimmed.replace(/.*if\s*\(/, '').replace(/\)\s*\{?.*$/, '').trim();
      } else if (trimmed.includes('else if')) {
        type = 'elif';
        condStr = trimmed.replace(/.*else if\s*\(/, '').replace(/\)\s*\{?.*$/, '').trim();
      } else if (trimmed.includes('else')) {
        type = 'else';
        condStr = '';
      } else {
        break;
      }

      let blockStartIdx = currIdx + 1;
      let blockEndIdx = currIdx;

      let braceDepth = (raw.match(/\{/g) || []).length - (raw.match(/\}/g) || []).length;

      if (braceDepth > 0) {
        let scanIdx = currIdx + 1;
        while (scanIdx < ctx.lines.length) {
          const line = ctx.lines[scanIdx];
          braceDepth += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
          if (braceDepth <= 0) {
            blockEndIdx = scanIdx;
            break;
          }
          scanIdx++;
        }
        if (scanIdx >= ctx.lines.length) blockEndIdx = ctx.lines.length - 1;
      } else {
        blockEndIdx = currIdx + 1;
      }

      branches.push({
        type,
        headerLineIdx: currIdx,
        condStr,
        blockStartIdx,
        blockEndIdx
      });

      const nextLineIdx = blockEndIdx;
      const nextRaw = ctx.lines[nextLineIdx] ? ctx.lines[nextLineIdx].trim() : '';

      if (nextRaw.includes('else')) {
        currIdx = nextLineIdx;
      } else if (nextLineIdx + 1 < ctx.lines.length && ctx.lines[nextLineIdx + 1].trim().startsWith('else')) {
        currIdx = nextLineIdx + 1;
      } else {
        currIdx = blockEndIdx + 1;
        break;
      }
    }

    const chainEndIdx = currIdx;
    return { branches, chainEndIdx, baseIndent: 0 };
  }

  private handleConditional(line: string, ctx: ExecutionContext) {
    if (!this.engine.isTechUnlocked('AUTO_3')) {
      throw new Error("'Conditionals (if/else)' feature is locked! Research AUTO_3 in the Research Tree.");
    }

    const chain = ctx.language === 'python'
      ? this.parsePythonConditionalChain(ctx.currentLineIndex, ctx)
      : this.parseJSConditionalChain(ctx.currentLineIndex, ctx);

    for (const branch of chain.branches) {
      let matched = false;

      if (branch.type === 'if' || branch.type === 'elif') {
        const condVal = this.evalExpression(branch.condStr || 'true', ctx);
        if (condVal) {
          matched = true;
        }
      } else if (branch.type === 'else') {
        matched = true;
      }

      if (matched) {
        ctx.conditionalStack.push({
          blockEndLineIdx: branch.blockEndIdx,
          chainEndLineIdx: chain.chainEndIdx,
          indent: chain.baseIndent
        });
        ctx.currentLineIndex = branch.headerLineIdx;
        return;
      }
    }

    // If no branch matched
    ctx.currentLineIndex = chain.chainEndIdx - 1;
  }

  private parseFunctionDef(line: string, ctx: ExecutionContext) {
    // Basic def/function parsing
    let name = '';
    const params: string[] = [];
    if (ctx.language === 'python') {
      const match = line.match(/def\s+([a-zA-Z0-9_]+)\s*\((.*?)\):/);
      if (match) {
        name = match[1];
        if (match[2]) params.push(...match[2].split(',').map(s => s.trim()));
      }
    } else {
      const match = line.match(/function\s+([a-zA-Z0-9_]+)\s*\((.*?)\)/);
      if (match) {
        name = match[1];
        if (match[2]) params.push(...match[2].split(',').map(s => s.trim()));
      }
    }

    // Skip over function body
    const startLineIndex = ctx.currentLineIndex;
    let idx = ctx.currentLineIndex + 1;
    const bodyLines: string[] = [];
    while (idx < ctx.lines.length) {
      const l = ctx.lines[idx];
      if (ctx.language === 'python') {
        if (l.trim() && !l.startsWith(' ') && !l.startsWith('\t')) break;
      } else {
        if (l.trim() === '}') {
          idx++;
          break;
        }
      }
      bodyLines.push(l);
      idx++;
    }
    if (name) {
      ctx.functionRegistry.set(name, { params, bodyLines, startLine: startLineIndex });
    }
    ctx.currentLineIndex = idx;
  }

  private evaluateStatement(line: string, ctx: ExecutionContext) {
    const agent = this.engine.getAgent(ctx.agentId);
    if (!agent) return;

    // Update dimensions in scope
    ctx.scope.width = this.engine.getGridWidth();
    ctx.scope.height = this.engine.getGridHeight();

    // Print statements
    if (line.startsWith('print(') || line.startsWith('console.log(')) {
      const match = line.match(/(?:print|console\.log)\((.*)\)/);
      if (match) {
        const expr = match[1].trim();
        const val = this.evalExpression(expr, ctx);
        this.engine.addLog(ctx.agentId, 'stdout', String(val), ctx.currentLineIndex + 1, ctx.filePath);
      }
      return;
    }

    // Loop structures
    if (line.startsWith('while ') || line.startsWith('while(') || line === 'while True:' || line === 'while (true) {' || line.startsWith('while(')) {
      this.handleWhileLoop(line, ctx);
      return;
    }

    if (line.startsWith('for ') || line.startsWith('for(') || line.startsWith('for (')) {
      if (ctx.language === 'python') {
        this.handlePythonForLoop(line, ctx);
      } else {
        this.handleJSForLoop(line, ctx);
      }
      return;
    }

    // Conditionals (if, elif, else, else if)
    if (line.startsWith('if ') || line.startsWith('if(') || line.startsWith('if (') || line.startsWith('if:') ||
        line.startsWith('elif ') || line.startsWith('elif(') || line.startsWith('elif:') ||
        line.startsWith('else ') || line.startsWith('else:') || line.startsWith('else{') || line.startsWith('else {') ||
        line.startsWith('} else')) {
      this.handleConditional(line, ctx);
      return;
    }

    // Direct Game API Calls or Assignments
    if (line.includes('=')) {
      if (!this.engine.isTechUnlocked('AUTO_2')) {
        throw new Error("'Variables & Operators' feature is locked! Research AUTO_2 in the Research Tree.");
      }
      const parts = line.split('=');
      const varName = parts[0].trim().replace(/^(let|var|const)\s+/, '');
      const rhs = parts.slice(1).join('=').trim().replace(/;$/, '');
      const val = this.evalExpression(rhs, ctx);
      ctx.scope[varName] = val;
      return;
    }

    // Pure API evaluation
    this.evalExpression(line.replace(/;$/, ''), ctx);
  }

  private evalExpression(expr: string, ctx: ExecutionContext): any {
    expr = expr.trim();
    const agent = this.engine.getAgent(ctx.agentId);
    if (!agent) return false;

    // Direct game API invocations
    // farm.*
    if (expr.includes('farm.can_harvest()') || expr.includes('farm.canHarvest()')) {
      return this.engine.canHarvestTile(agent.x, agent.y);
    }
    if (expr.includes('farm.harvest()')) {
      ctx.actionsPerformedInRun++;
      return this.engine.harvestTile(ctx.agentId, agent.x, agent.y);
    }
    if (expr.includes('farm.till()')) {
      if (!this.engine.isTechUnlocked('AGRO_3')) {
        throw new Error("'Soil & Cultivated Roots' feature is locked! Research AGRO_3 in the Research Tree.");
      }
      ctx.actionsPerformedInRun++;
      return this.engine.tillTile(ctx.agentId, agent.x, agent.y);
    }
    if (expr.includes('farm.water()')) {
      if (!this.engine.isTechUnlocked('AGRO_1')) {
        throw new Error("'Irrigation' feature is locked! Research AGRO_1 in the Research Tree.");
      }
      ctx.actionsPerformedInRun++;
      return this.engine.waterTile(ctx.agentId, agent.x, agent.y);
    }
    if (expr.includes('farm.plant(')) {
      const cropArg = expr.match(/farm\.plant\((.*?)\)/)?.[1]?.replace(/['"]/g, '').trim() || 'WILD_FIBER';
      const upper = cropArg.toUpperCase();
      if ((upper.includes('BUSH') || upper.includes('WOODY')) && !this.engine.isTechUnlocked('AGRO_2')) {
        throw new Error("'Woody Bush' crop is locked! Research AGRO_2 in the Research Tree.");
      }
      if ((upper.includes('ROOT') || upper.includes('CULTIVATED') || upper.includes('CORN')) && !this.engine.isTechUnlocked('AGRO_3')) {
        throw new Error("'Cultivated Roots' crop is locked! Research AGRO_3 in the Research Tree.");
      }
      if ((upper.includes('TREE') || upper.includes('TIMBER')) && !this.engine.isTechUnlocked('AGRO_4')) {
        throw new Error("'Trees & Timber' crop is locked! Research AGRO_4 in the Research Tree.");
      }
      if ((upper.includes('FRUIT') || upper.includes('BERRY')) && !this.engine.isTechUnlocked('AGRO_5')) {
        throw new Error("'Fruit Colonies' crop is locked! Research AGRO_5 in the Research Tree.");
      }
      if ((upper.includes('FLOWER') || upper.includes('ENERGY')) && !this.engine.isTechUnlocked('AGRO_6')) {
        throw new Error("'Energy Flowers' crop is locked! Research AGRO_6 in the Research Tree.");
      }
      if (upper.includes('GRADED') && !this.engine.isTechUnlocked('AGRO_7')) {
        throw new Error("'Graded Plants' crop is locked! Research AGRO_7 in the Research Tree.");
      }
      ctx.actionsPerformedInRun++;
      return this.engine.plantCrop(ctx.agentId, agent.x, agent.y, cropArg);
    }
    if (
      expr.includes('world.get_growth()') || expr.includes('world.getGrowth()') || expr.includes('world.growth()') ||
      expr.includes('farm.get_growth()') || expr.includes('farm.getGrowth()') || expr.includes('farm.growth()')
    ) {
      return this.engine.getTile(agent.x, agent.y).growth;
    }
    if (
      expr.includes('world.get_crop()') || expr.includes('world.getCrop()') || expr.includes('world.crop()') ||
      expr.includes('farm.get_crop()') || expr.includes('farm.getCrop()') || expr.includes('farm.crop()')
    ) {
      return this.engine.getTile(agent.x, agent.y).crop;
    }
    if (expr.includes('farm.prestige(') || expr.includes('prestige(')) {
      const match = expr.match(/(?:farm\.)?prestige\s*\((.*?)\)/);
      if (match) {
        const rawArgs = match[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
        const resourceArg = rawArgs[0] || 'fiber';
        const parsedAmt = parseInt(rawArgs[1] || '1', 10);
        const amountArg = isNaN(parsedAmt) ? 1 : parsedAmt;
        ctx.actionsPerformedInRun++;
        return this.engine.offerPrestigeResource(ctx.agentId, agent.x, agent.y, resourceArg, amountArg);
      }
    }
    if (expr.includes('farm.swap(')) {
      if (!this.engine.isTechUnlocked('AGRO_7')) {
        throw new Error("'Swap Tiles' feature is locked! Research AGRO_7 in the Research Tree.");
      }
      const dirArg = expr.match(/farm\.swap\((.*?)\)/)?.[1]?.replace(/['"]/g, '').trim() || 'EAST';
      ctx.actionsPerformedInRun++;
      return this.engine.swapTiles(ctx.agentId, agent.x, agent.y, dirArg);
    }
    if (expr.includes('farm.get_companion()')) {
      return this.engine.getCompanionRequest(agent.x, agent.y);
    }

    if (expr.includes('world.clear()') || expr.includes('farm.clear()') || expr === 'clear()' || expr === 'clear') {
      this.engine.clearWorld();
      return true;
    }

    // world.*
    if (expr.includes('world.move(')) {
      const dirArg = expr.match(/world\.move\((.*?)\)/)?.[1]?.replace(/['"]/g, '').trim() || 'EAST';
      ctx.actionsPerformedInRun++;
      return this.engine.moveAgent(ctx.agentId, dirArg);
    }
    if (expr.includes('world.can_move(') || expr.includes('world.canMove(')) {
      const dirArg = expr.match(/world\.can_?move\((.*?)\)/)?.[1]?.replace(/['"]/g, '').trim() || 'EAST';
      return this.engine.canMoveAgent(ctx.agentId, dirArg);
    }
    if (expr.includes('world.x()')) {
      if (!this.engine.isTechUnlocked('SYS_2')) {
        throw new Error("'Basic Sensors & Coords' is locked! Research SYS_2 in the Research Tree.");
      }
      return agent.x;
    }
    if (expr.includes('world.y()')) {
      if (!this.engine.isTechUnlocked('SYS_2')) {
        throw new Error("'Basic Sensors & Coords' is locked! Research SYS_2 in the Research Tree.");
      }
      return agent.y;
    }
    if (expr.includes('world.width()')) {
      if (!this.engine.isTechUnlocked('SYS_2')) {
        throw new Error("'Basic Sensors & Coords' is locked! Research SYS_2 in the Research Tree.");
      }
      return this.engine.getGridWidth();
    }
    if (expr.includes('world.height()')) {
      if (!this.engine.isTechUnlocked('SYS_2')) {
        throw new Error("'Basic Sensors & Coords' is locked! Research SYS_2 in the Research Tree.");
      }
      return this.engine.getGridHeight();
    }
    if (expr.includes('world.area()')) {
      if (!this.engine.isTechUnlocked('SYS_2')) {
        throw new Error("'Basic Sensors & Coords' is locked! Research SYS_2 in the Research Tree.");
      }
      return this.engine.getGridWidth() * this.engine.getGridHeight();
    }
    if (
      expr.includes('world.ground()') ||
      expr.includes('world.get_ground()')
    ) {
      if (!this.engine.isTechUnlocked('SYS_2')) {
        throw new Error("'Basic Sensors & Coords' is locked! Research SYS_2 in the Research Tree.");
      }
      return this.engine.getTile(agent.x, agent.y).ground;
    }
    if (
      expr.includes('world.entity()') ||
      expr.includes('world.get_entity()')
    ) {
      if (!this.engine.isTechUnlocked('SYS_2')) {
        throw new Error("'Basic Sensors & Coords' is locked! Research SYS_2 in the Research Tree.");
      }
      return this.engine.getTile(agent.x, agent.y).crop;
    }
    if (
      expr.includes('world.moisture()') ||
      expr.includes('world.get_moisture()')
    ) {
      if (!this.engine.isTechUnlocked('SYS_2')) {
        throw new Error("'Basic Sensors & Coords' is locked! Research SYS_2 in the Research Tree.");
      }
      return this.engine.getTile(agent.x, agent.y).moisture;
    }
    if (expr.includes('world.measure()')) {
      if (!this.engine.isTechUnlocked('SYS_3')) {
        throw new Error("'Tile Measurement' is locked! Research SYS_3 in the Research Tree.");
      }
      return this.engine.measureTile(agent.x, agent.y);
    }
    if (expr.includes('world.is_maze_core()')) return this.engine.isMazeCore(agent.x, agent.y);

    // inventory.*
    if (expr.includes('inventory.count(')) {
      if (!this.engine.isTechUnlocked('SYS_2')) {
        throw new Error("'Inventory Sensor' is locked! Research SYS_2 in the Research Tree.");
      }
      const res = expr.match(/inventory\.count\((.*?)\)/)?.[1]?.replace(/['"]/g, '').trim() || 'fiber';
      return this.engine.getResourceCount(res);
    }

    // Literal evaluations & variable resolution
    if (expr === 'true' || expr === 'True') return true;
    if (expr === 'false' || expr === 'False') return false;
    if (!isNaN(Number(expr))) return Number(expr);
    if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
      return expr.slice(1, -1);
    }

    // Logical operators (and, or, not)
    if (expr.includes(' and ')) {
      const [l, r] = expr.split(' and ');
      return Boolean(this.evalExpression(l, ctx)) && Boolean(this.evalExpression(r, ctx));
    }
    if (expr.includes(' or ')) {
      const [l, r] = expr.split(' or ');
      return Boolean(this.evalExpression(l, ctx)) || Boolean(this.evalExpression(r, ctx));
    }
    if (expr.startsWith('not ')) {
      return !Boolean(this.evalExpression(expr.substring(4), ctx));
    }

    // Comparisons (==, !=, >, <, >=, <=)
    if (expr.includes('==')) {
      const [l, r] = expr.split('==');
      return this.evalExpression(l, ctx) == this.evalExpression(r, ctx);
    }
    if (expr.includes('!=')) {
      const [l, r] = expr.split('!=');
      return this.evalExpression(l, ctx) != this.evalExpression(r, ctx);
    }
    if (expr.includes('>=')) {
      const [l, r] = expr.split('>=');
      return Number(this.evalExpression(l, ctx)) >= Number(this.evalExpression(r, ctx));
    }
    if (expr.includes('<=')) {
      const [l, r] = expr.split('<=');
      return Number(this.evalExpression(l, ctx)) <= Number(this.evalExpression(r, ctx));
    }
    if (expr.includes('>')) {
      const [l, r] = expr.split('>');
      return Number(this.evalExpression(l, ctx)) > Number(this.evalExpression(r, ctx));
    }
    if (expr.includes('<')) {
      const [l, r] = expr.split('<');
      return Number(this.evalExpression(l, ctx)) < Number(this.evalExpression(r, ctx));
    }

    // Arithmetic operators
    if (expr.includes(' % ')) {
      const [l, r] = expr.split(' % ');
      return Number(this.evalExpression(l, ctx)) % Number(this.evalExpression(r, ctx));
    }
    if (expr.includes(' + ')) {
      const [l, r] = expr.split(' + ');
      return Number(this.evalExpression(l, ctx)) + Number(this.evalExpression(r, ctx));
    }
    if (expr.includes(' - ')) {
      const [l, r] = expr.split(' - ');
      return Number(this.evalExpression(l, ctx)) - Number(this.evalExpression(r, ctx));
    }
    if (expr.includes(' * ')) {
      const [l, r] = expr.split(' * ');
      return Number(this.evalExpression(l, ctx)) * Number(this.evalExpression(r, ctx));
    }
    if (expr.includes(' / ')) {
      const [l, r] = expr.split(' / ');
      return Number(this.evalExpression(l, ctx)) / Number(this.evalExpression(r, ctx));
    }

    // Lookup in local scope
    if (expr in ctx.scope) {
      return ctx.scope[expr];
    }

    return expr;
  }
}
