import { Agent, ConsoleLog, Diagnostic, VariableScope } from '../../types/game';
import { GameEngine } from '../GameEngine';
import { PyodideManager } from '../pyodideLoader';
import { JavaScriptSandbox } from '../jsSandbox';

export interface ExecutionContext {
  agentId: number;
  filePath: string;
  language: 'python' | 'javascript';
  lines: string[];
  codeRaw?: string;
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
  nativeGenerator?: { next: () => { done: boolean; value?: number } } | null;
  nativeGenFailed?: boolean;
  nativeGenInitStarted?: boolean;
}

function stripOuterParens(str: string): string {
  let s = str.trim();
  while (s.startsWith('(') && s.endsWith(')')) {
    let depth = 0;
    let matched = true;
    for (let i = 0; i < s.length - 1; i++) {
      if (s[i] === '(') depth++;
      else if (s[i] === ')') depth--;
      if (depth === 0) {
        matched = false;
        break;
      }
    }
    if (matched) {
      s = s.slice(1, -1).trim();
    } else {
      break;
    }
  }
  return s;
}

function splitCommaTopLevel(str: string): string[] {
  const result: string[] = [];
  let current = '';
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let inString: string | null = null;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (inString) {
      current += char;
      if (char === inString && str[i - 1] !== '\\') {
        inString = null;
      }
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      inString = char;
      current += char;
      continue;
    }
    if (char === '(') parenDepth++;
    else if (char === ')') parenDepth--;
    else if (char === '[') bracketDepth++;
    else if (char === ']') bracketDepth--;
    else if (char === '{') braceDepth++;
    else if (char === '}') braceDepth--;

    if (char === ',' && parenDepth === 0 && bracketDepth === 0 && braceDepth === 0) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) {
    result.push(current.trim());
  }
  return result;
}

function splitTopLevel(expr: string, op: string): [string, string] | null {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let inString: string | null = null;
  const opLen = op.length;
  let lastMatchIdx = -1;

  for (let i = 0; i <= expr.length - opLen; i++) {
    const char = expr[i];

    if (inString) {
      if (char === inString && expr[i - 1] !== '\\') {
        inString = null;
      }
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      inString = char;
      continue;
    }

    if (char === '(') parenDepth++;
    else if (char === ')') parenDepth--;
    else if (char === '[') bracketDepth++;
    else if (char === ']') bracketDepth--;
    else if (char === '{') braceDepth++;
    else if (char === '}') braceDepth--;

    if (
      parenDepth === 0 &&
      bracketDepth === 0 &&
      braceDepth === 0 &&
      !inString
    ) {
      if (expr.substring(i, i + opLen) === op) {
        if (op === '==' && (expr[i - 1] === '=' || expr[i + opLen] === '=' || expr[i - 1] === '!')) {
          continue;
        }
        if (op === '!=' && (expr[i - 1] === '=' || expr[i + opLen] === '=')) {
          continue;
        }
        if (op === '>' && (expr[i - 1] === '=' || expr[i + opLen] === '=' || expr[i - 1] === '>')) {
          continue;
        }
        if (op === '<' && (expr[i - 1] === '=' || expr[i + opLen] === '=' || expr[i - 1] === '<')) {
          continue;
        }
        lastMatchIdx = i;
      }
    }
  }

  if (lastMatchIdx !== -1) {
    const left = expr.substring(0, lastMatchIdx).trim();
    const right = expr.substring(lastMatchIdx + opLen).trim();
    return [left, right];
  }

  return null;
}

export class ScriptRunner {
  private engine: GameEngine;

  constructor(engine: GameEngine) {
    this.engine = engine;
    // Kick off background Pyodide WASM pre-fetch
    PyodideManager.getInstance().catch(() => {});
  }

  public async executeNativeScript(
    code: string,
    agentId: number,
    filePath: string,
    language: 'python' | 'javascript'
  ): Promise<{ success: boolean; error?: string }> {
    if (language === 'python' && PyodideManager.isReady()) {
      return await PyodideManager.executePythonScript(code, agentId, this.engine, filePath);
    } else if (language === 'javascript') {
      return await JavaScriptSandbox.executeJsScript(code, agentId, this.engine, filePath);
    }
    return { success: false, error: 'Native engine unavailable' };
  }

  public createExecutionContext(agentId: number, filePath: string, code: string, language: 'python' | 'javascript'): ExecutionContext {
    const rawLines = code.split('\n');
    const ctx: ExecutionContext = {
      agentId,
      filePath,
      language,
      lines: rawLines,
      codeRaw: code,
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
      isCompleted: false,
      nativeGenerator: null,
      nativeGenFailed: false,
      nativeGenInitStarted: false
    };

    if (language === 'javascript') {
      ctx.nativeGenInitStarted = true;
      try {
        ctx.nativeGenerator = JavaScriptSandbox.createStepGenerator(code, agentId, this.engine, filePath);
      } catch (e: any) {
        // Will fall back or throw on first step
      }
    } else if (language === 'python' && PyodideManager.isReady()) {
      ctx.nativeGenInitStarted = true;
      PyodideManager.createStepGenerator(code, agentId, this.engine, filePath)
        .then(gen => {
          ctx.nativeGenerator = gen;
        })
        .catch(() => {
          ctx.nativeGenFailed = true;
        });
    }

    return ctx;
  }

  public executeStep(ctx: ExecutionContext): { paused: boolean; error?: string; completed?: boolean } {
    if (ctx.isCompleted) {
      return { paused: true, completed: true };
    }

    // Try initializing or running Native Generator
    if (!ctx.nativeGenFailed) {
      const fullCode = ctx.codeRaw || ctx.lines.join('\n');

      if (!ctx.nativeGenerator && !ctx.nativeGenInitStarted) {
        if (ctx.language === 'javascript') {
          ctx.nativeGenInitStarted = true;
          try {
            ctx.nativeGenerator = JavaScriptSandbox.createStepGenerator(fullCode, ctx.agentId, this.engine, ctx.filePath);
          } catch (e: any) {
            const errMsg = e?.message || String(e);
            this.engine.addLog(ctx.agentId, 'stderr', `JSSyntaxError: ${errMsg}`, undefined, ctx.filePath);
            ctx.isCompleted = true;
            return { paused: true, error: errMsg };
          }
        } else if (ctx.language === 'python' && PyodideManager.isReady()) {
          ctx.nativeGenInitStarted = true;
          PyodideManager.createStepGenerator(fullCode, ctx.agentId, this.engine, ctx.filePath)
            .then(gen => {
              ctx.nativeGenerator = gen;
            })
            .catch(err => {
              const errMsg = err?.message || String(err);
              this.engine.addLog(ctx.agentId, 'stderr', `PythonSyntaxError: ${errMsg}`, undefined, ctx.filePath);
              ctx.nativeGenFailed = true;
              ctx.isCompleted = true;
            });
        }
      }

      if (ctx.nativeGenerator) {
        try {
          const res = ctx.nativeGenerator.next();
          if (res.done) {
            ctx.isCompleted = true;
            return { paused: true, completed: true };
          }
          if (typeof res.value === 'number' && res.value > 0) {
            ctx.currentLineIndex = res.value - 1;
          }
          return { paused: false };
        } catch (err: any) {
          const errMsg = err?.message || String(err);
          this.engine.addLog(ctx.agentId, 'stderr', `RuntimeError: ${errMsg}`, ctx.currentLineIndex + 1, ctx.filePath);
          ctx.isCompleted = true;
          return { paused: true, error: errMsg };
        }
      }
    }

    return this.executeFallbackStep(ctx);
  }

  public executeFallbackStep(ctx: ExecutionContext): { paused: boolean; error?: string; completed?: boolean } {
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
      const err = `ExecutionBudgetExceeded: ${ctx.filePath}:${currentLineNum}\nExecutou 100.000 instruções sem gerar ação no mundo. Possível loop infinito.`;
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

    // Validate Language Syntax strictly before executing
    try {
      this.validateLanguageSyntax(line, ctx);
    } catch (e: any) {
      const err = `SyntaxError: ${ctx.filePath}:${currentLineNum} - ${e.message || String(e)}`;
      this.engine.addLog(ctx.agentId, 'stderr', err, currentLineNum, ctx.filePath);
      return { paused: true, error: err };
    }

    // Handle Function Definitions
    if (line.startsWith('def ') || line.startsWith('function ')) {
      if (!this.engine.isTechUnlocked('AUTO_5')) {
        throw new Error("Recurso 'Funções' está bloqueado! Pesquise AUTO_5 na Árvore de Pesquisa.");
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

    return { paused: false };
  }

  private validateLanguageSyntax(line: string, ctx: ExecutionContext) {
    if (ctx.language === 'python') {
      if (line.startsWith('function ') || line.startsWith('function(') || /^function\b/.test(line)) {
        throw new Error(`'function' é sintaxe de JavaScript. Em arquivos Python (.py), declare funções com 'def nome_função():'.`);
      }
      if (line.startsWith('console.log(') || line.includes('console.log(')) {
        throw new Error(`'console.log()' é sintaxe de JavaScript. Em arquivos Python (.py), use 'print()'.`);
      }
      if (line.startsWith('let ') || line.startsWith('const ') || line.startsWith('var ')) {
        throw new Error(`As palavras-chave 'let/const/var' pertencem ao JavaScript. Em Python (.py), atribua diretamente: 'x = valor'.`);
      }
      if (line.startsWith('else if') || line.includes('else if(') || line.includes('else if ')) {
        throw new Error(`'else if' é sintaxe de JavaScript. Em arquivos Python (.py), use 'elif'.`);
      }
      if ((line.startsWith('if ') || line.startsWith('elif ') || line.startsWith('else:') || line.startsWith('while ') || line.startsWith('for ') || line.startsWith('def ')) && line.endsWith('{')) {
        throw new Error(`Blocos em Python usam dois-pontos (':') ao final da linha e sangria (identação), não chaves ('{}').`);
      }
    } else if (ctx.language === 'javascript') {
      if (line.startsWith('def ') || /^def\b/.test(line)) {
        throw new Error(`'def' é sintaxe de Python. Em arquivos JavaScript (.js), declare funções com 'function nomeFuncao() { ... }'.`);
      }
      if (line.startsWith('print(') || line.includes('print(')) {
        throw new Error(`'print()' é sintaxe de Python. Em arquivos JavaScript (.js), use 'console.log()'.`);
      }
      if (line.startsWith('elif ') || line.startsWith('elif(') || line === 'elif:' || line.startsWith('elif:')) {
        throw new Error(`'elif' é sintaxe de Python. Em arquivos JavaScript (.js), use 'else if (condição) { ... }'.`);
      }
      if (line.endsWith(':') && (line.startsWith('if') || line.startsWith('else') || line.startsWith('while') || line.startsWith('for') || line.startsWith('function'))) {
        throw new Error(`Estruturas de controle em JavaScript usam parênteses e chaves ('{ ... }'), não dois-pontos (':').`);
      }
    }
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
        if (ctx.currentLineIndex >= top.blockEndLineIdx) {
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
      throw new Error("Recurso 'Loops (while/for)' está bloqueado! Pesquise AUTO_4 na Árvore de Pesquisa.");
    }

    const existingIndex = ctx.loopStack.findIndex(l => l.startLineIndex === ctx.currentLineIndex);

    let condStr = 'true';
    if (line.includes('(') && line.includes(')')) {
      const openIdx = line.indexOf('(');
      let parenCount = 0;
      let closeIdx = -1;
      for (let i = openIdx; i < line.length; i++) {
        if (line[i] === '(') parenCount++;
        else if (line[i] === ')') parenCount--;
        if (parenCount === 0) {
          closeIdx = i;
          break;
        }
      }
      if (closeIdx !== -1) {
        condStr = line.substring(openIdx + 1, closeIdx).trim();
      }
    } else if (line.startsWith('while ')) {
      condStr = line.replace('while ', '').replace(':', '').replace('{', '').trim();
    }

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
      throw new Error("Recurso 'Loops (while/for)' está bloqueado! Pesquise AUTO_4 na Árvore de Pesquisa.");
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
      throw new Error("Recurso 'Loops (while/for)' está bloqueado! Pesquise AUTO_4 na Árvore de Pesquisa.");
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
      if (!trimmed || trimmed.startsWith('#')) {
        currIdx++;
        continue;
      }

      const indent = raw.search(/\S|$/);
      if (indent !== baseIndent) break;

      let type: 'if' | 'elif' | 'else' | null = null;
      let condStr = '';

      if (branches.length === 0) {
        if (/^if\b/.test(trimmed)) {
          type = 'if';
          condStr = trimmed.replace(/^if\b\s*/, '').replace(/:\s*$/, '').trim();
        } else if (/^(elif|else)\b/.test(trimmed)) {
          throw new Error(`Erro de Sintaxe (linha ${currIdx + 1}): Instrução '${trimmed}' encontrada sem um 'if' correspondente.`);
        } else {
          break;
        }
      } else {
        if (branches[branches.length - 1].type === 'else') {
          break;
        }
        if (/^elif\b/.test(trimmed)) {
          type = 'elif';
          condStr = trimmed.replace(/^elif\b\s*/, '').replace(/:\s*$/, '').trim();
        } else if (/^else\b/.test(trimmed)) {
          type = 'else';
          condStr = '';
        } else {
          break;
        }
      }

      condStr = stripOuterParens(condStr);

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
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
        currIdx++;
        continue;
      }

      let type: 'if' | 'elif' | 'else' | null = null;
      let condStr = '';

      if (branches.length === 0) {
        if (/^\}?\s*if\b/.test(trimmed) || (trimmed.includes('if') && !trimmed.includes('else'))) {
          type = 'if';
        } else if (/^\}?\s*(else\s+if|else)\b/.test(trimmed)) {
          throw new Error(`Erro de Sintaxe (linha ${currIdx + 1}): Instrução '${trimmed}' encontrada sem um 'if' correspondente.`);
        } else {
          break;
        }
      } else {
        if (branches[branches.length - 1].type === 'else') {
          break;
        }
        if (/^\}?\s*else\s+if\b/.test(trimmed) || trimmed.includes('else if')) {
          type = 'elif';
        } else if (/^\}?\s*else\b/.test(trimmed) || trimmed.includes('else')) {
          type = 'else';
        } else {
          break;
        }
      }

      if (type === 'if' || type === 'elif') {
        const openIdx = trimmed.indexOf('(');
        if (openIdx !== -1) {
          let parenCount = 0;
          let closeIdx = -1;
          for (let i = openIdx; i < trimmed.length; i++) {
            if (trimmed[i] === '(') parenCount++;
            else if (trimmed[i] === ')') parenCount--;
            if (parenCount === 0) {
              closeIdx = i;
              break;
            }
          }
          if (closeIdx !== -1) {
            condStr = trimmed.substring(openIdx + 1, closeIdx).trim();
          } else {
            throw new Error(`Erro de Sintaxe (linha ${currIdx + 1}): Parêntese de fechamento ')' ausente na instrução '${type}'.`);
          }
        } else {
          throw new Error(`Erro de Sintaxe (linha ${currIdx + 1}): Parêntese de abertura '(' ausente na instrução '${type}'.`);
        }
      }

      let blockStartIdx = currIdx + 1;
      let blockEndIdx = currIdx;

      // Extract text after header keyword to accurately count block braces
      let afterHeader = trimmed;
      if (type === 'elif') {
        const idx = afterHeader.indexOf('else if');
        if (idx !== -1) afterHeader = afterHeader.substring(idx + 7);
      } else if (type === 'if') {
        const idx = afterHeader.indexOf('if');
        if (idx !== -1) afterHeader = afterHeader.substring(idx + 2);
      } else if (type === 'else') {
        const idx = afterHeader.indexOf('else');
        if (idx !== -1) afterHeader = afterHeader.substring(idx + 4);
      }

      let braceDepth = (afterHeader.match(/\{/g) || []).length - (afterHeader.match(/\}/g) || []).length;

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
      } else if (nextLineIdx + 1 < ctx.lines.length && /^\}?\s*else\b/.test(ctx.lines[nextLineIdx + 1].trim())) {
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
      throw new Error("Recurso 'Condicionais (if/else)' está bloqueado! Pesquise AUTO_3 na Árvore de Pesquisa.");
    }

    const chain = ctx.language === 'python'
      ? this.parsePythonConditionalChain(ctx.currentLineIndex, ctx)
      : this.parseJSConditionalChain(ctx.currentLineIndex, ctx);

    for (const branch of chain.branches) {
      let matched = false;

      if (branch.type === 'if' || branch.type === 'elif') {
        if (!branch.condStr || !branch.condStr.trim()) {
          throw new Error(`Erro de Sintaxe (linha ${branch.headerLineIdx + 1}): Instrução '${branch.type}' requer uma condição válida.`);
        }
        const condVal = this.evalExpression(branch.condStr, ctx);
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
        if (branch.blockStartIdx <= branch.blockEndIdx) {
          ctx.currentLineIndex = branch.blockStartIdx - 1;
        } else {
          // Empty block: finish conditional chain immediately
          ctx.conditionalStack.pop();
          ctx.currentLineIndex = chain.chainEndIdx - 1;
        }
        return;
      }
    }

    // If no branch matched
    ctx.currentLineIndex = chain.chainEndIdx - 1;
  }

  private parseFunctionDef(line: string, ctx: ExecutionContext) {
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
        const rawArgsStr = match[1].trim();
        const args = splitCommaTopLevel(rawArgsStr);
        const evaluatedValues = args.map(arg => {
          const val = this.evalExpression(arg, ctx);
          return val !== undefined && val !== null ? String(val) : '';
        });
        const output = evaluatedValues.join(' ');
        this.engine.addLog(ctx.agentId, 'stdout', output, ctx.currentLineIndex + 1, ctx.filePath);
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
    const trimmedLine = line.trim();
    if (/^\}?\s*(if|else\s+if|elif|else)\b/.test(trimmedLine)) {
      this.handleConditional(line, ctx);
      return;
    }

    // Direct Game API Calls or Assignments
    const assignMatch = trimmedLine.match(/^((let|var|const)\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*(\+=|-=|\*=|\/=|=(?!=))\s*(.*)$/);
    if (assignMatch) {
      if (!this.engine.isTechUnlocked('AUTO_2')) {
        throw new Error("Recurso 'Variáveis & Operadores' está bloqueado! Pesquise AUTO_2 na Árvore de Pesquisa.");
      }
      const varName = assignMatch[3].trim();
      const op = assignMatch[4];
      const rhsStr = assignMatch[5].trim().replace(/;$/, '');
      const rhsVal = this.evalExpression(rhsStr, ctx);

      if (op === '=') {
        ctx.scope[varName] = rhsVal;
      } else if (op === '+=') {
        const cur = ctx.scope[varName] ?? 0;
        ctx.scope[varName] = typeof cur === 'string' || typeof rhsVal === 'string' ? String(cur) + String(rhsVal) : Number(cur) + Number(rhsVal);
      } else if (op === '-=') {
        const cur = ctx.scope[varName] ?? 0;
        ctx.scope[varName] = Number(cur) - Number(rhsVal);
      } else if (op === '*=') {
        const cur = ctx.scope[varName] ?? 0;
        ctx.scope[varName] = Number(cur) * Number(rhsVal);
      } else if (op === '/=') {
        const cur = ctx.scope[varName] ?? 0;
        ctx.scope[varName] = Number(cur) / Number(rhsVal);
      }
      return;
    }

    // Pure API evaluation
    this.evalExpression(line.replace(/;$/, ''), ctx);
  }

  private evalExpression(expr: string, ctx: ExecutionContext): any {
    expr = stripOuterParens(expr.trim());
    if (!expr) return false;

    const agent = this.engine.getAgent(ctx.agentId);
    if (!agent) return false;

    // 0. Literals & Template Strings (Evaluated before operators and API calls)
    if (expr.startsWith('`') && expr.endsWith('`')) {
      const raw = expr.slice(1, -1);
      return raw.replace(/\$\{([^}]+)\}/g, (_, subExpr) => {
        const val = this.evalExpression(subExpr, ctx);
        return val !== undefined && val !== null ? String(val) : '';
      });
    }

    if ((expr.startsWith('f"') && expr.endsWith('"')) || (expr.startsWith("f'") && expr.endsWith("'"))) {
      const raw = expr.slice(2, -1);
      return raw.replace(/\{([^}]+)\}/g, (_, subExpr) => {
        const val = this.evalExpression(subExpr, ctx);
        return val !== undefined && val !== null ? String(val) : '';
      });
    }

    if (expr === 'true' || expr === 'True') return true;
    if (expr === 'false' || expr === 'False') return false;
    if (!isNaN(Number(expr)) && expr.trim() !== '') return Number(expr);
    if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
      return expr.slice(1, -1);
    }

    // 1. Logical OR (||, or)
    const orMatch = splitTopLevel(expr, '||') || splitTopLevel(expr, ' or ');
    if (orMatch) {
      return Boolean(this.evalExpression(orMatch[0], ctx)) || Boolean(this.evalExpression(orMatch[1], ctx));
    }

    // 2. Logical AND (&&, and)
    const andMatch = splitTopLevel(expr, '&&') || splitTopLevel(expr, ' and ');
    if (andMatch) {
      return Boolean(this.evalExpression(andMatch[0], ctx)) && Boolean(this.evalExpression(andMatch[1], ctx));
    }

    // 3. Logical NOT (!, not)
    if (expr.startsWith('not ')) {
      return !Boolean(this.evalExpression(expr.substring(4), ctx));
    }
    if (expr.startsWith('!') && !expr.startsWith('!=')) {
      return !Boolean(this.evalExpression(expr.substring(1), ctx));
    }

    // 4. Equality & Relational Comparisons
    const tripleEq = splitTopLevel(expr, '===');
    if (tripleEq) {
      return this.evalExpression(tripleEq[0], ctx) === this.evalExpression(tripleEq[1], ctx);
    }
    const tripleNeq = splitTopLevel(expr, '!==');
    if (tripleNeq) {
      return this.evalExpression(tripleNeq[0], ctx) !== this.evalExpression(tripleNeq[1], ctx);
    }
    const doubleEq = splitTopLevel(expr, '==');
    if (doubleEq) {
      return this.evalExpression(doubleEq[0], ctx) == this.evalExpression(doubleEq[1], ctx);
    }
    const doubleNeq = splitTopLevel(expr, '!=');
    if (doubleNeq) {
      return this.evalExpression(doubleNeq[0], ctx) != this.evalExpression(doubleNeq[1], ctx);
    }
    const gte = splitTopLevel(expr, '>=');
    if (gte) {
      return Number(this.evalExpression(gte[0], ctx)) >= Number(this.evalExpression(gte[1], ctx));
    }
    const lte = splitTopLevel(expr, '<=');
    if (lte) {
      return Number(this.evalExpression(lte[0], ctx)) <= Number(this.evalExpression(lte[1], ctx));
    }
    const gt = splitTopLevel(expr, '>');
    if (gt) {
      return Number(this.evalExpression(gt[0], ctx)) > Number(this.evalExpression(gt[1], ctx));
    }
    const lt = splitTopLevel(expr, '<');
    if (lt) {
      return Number(this.evalExpression(lt[0], ctx)) < Number(this.evalExpression(lt[1], ctx));
    }

    // 5. Binary Arithmetic
    const mod = splitTopLevel(expr, '%');
    if (mod) {
      return Number(this.evalExpression(mod[0], ctx)) % Number(this.evalExpression(mod[1], ctx));
    }
    const add = splitTopLevel(expr, '+');
    if (add) {
      const leftVal = this.evalExpression(add[0], ctx);
      const rightVal = this.evalExpression(add[1], ctx);
      if (typeof leftVal === 'string' || typeof rightVal === 'string') {
        return String(leftVal) + String(rightVal);
      }
      return Number(leftVal) + Number(rightVal);
    }
    const sub = splitTopLevel(expr, '-');
    if (sub) {
      return Number(this.evalExpression(sub[0], ctx)) - Number(this.evalExpression(sub[1], ctx));
    }
    const mul = splitTopLevel(expr, '*');
    if (mul) {
      return Number(this.evalExpression(mul[0], ctx)) * Number(this.evalExpression(mul[1], ctx));
    }
    const div = splitTopLevel(expr, '/');
    if (div) {
      return Number(this.evalExpression(div[0], ctx)) / Number(this.evalExpression(div[1], ctx));
    }

    // 6. Direct game API invocations
    if (expr.includes('farm.can_harvest()') || expr.includes('farm.canHarvest()')) {
      return this.engine.canHarvestTile(agent.x, agent.y);
    }
    if (expr.includes('farm.harvest()')) {
      ctx.actionsPerformedInRun++;
      return this.engine.harvestTile(ctx.agentId, agent.x, agent.y);
    }
    if (expr.includes('farm.till()')) {
      if (!this.engine.isTechUnlocked('AGRO_3')) {
        throw new Error("Recurso 'Solo Arado & Raízes Cultivadas' está bloqueado! Pesquise AGRO_3 na Árvore de Pesquisa.");
      }
      ctx.actionsPerformedInRun++;
      return this.engine.tillTile(ctx.agentId, agent.x, agent.y);
    }
    if (expr.includes('farm.water()')) {
      if (!this.engine.isTechUnlocked('AGRO_1')) {
        throw new Error("Recurso 'Irrigação' está bloqueado! Pesquise AGRO_1 na Árvore de Pesquisa.");
      }
      ctx.actionsPerformedInRun++;
      return this.engine.waterTile(ctx.agentId, agent.x, agent.y);
    }
    if (expr.includes('farm.plant(')) {
      const rawArg = expr.match(/farm\.plant\((.*?)\)/)?.[1]?.trim();
      const evaluated = rawArg ? this.evalExpression(rawArg, ctx) : 'WILD_FIBER';
      const cropArg = evaluated !== undefined && evaluated !== null ? String(evaluated) : 'WILD_FIBER';
      const upper = cropArg.toUpperCase();
      if ((upper.includes('BUSH') || upper.includes('WOODY') || upper.includes('WOOD')) && !this.engine.isTechUnlocked('AGRO_2')) {
        throw new Error("Cultura 'Arbusto de Madeira' está bloqueada! Pesquise AGRO_2 na Árvore de Pesquisa.");
      }
      if ((upper.includes('ROOT') || upper.includes('CULTIVATED') || upper.includes('CORN') || upper.includes('CARROT')) && !this.engine.isTechUnlocked('AGRO_3')) {
        throw new Error("Cultura 'Raízes Cultivadas' está bloqueada! Pesquise AGRO_3 na Árvore de Pesquisa.");
      }
      if ((upper.includes('TREE') || upper.includes('TIMBER')) && !this.engine.isTechUnlocked('AGRO_4')) {
        throw new Error("Cultura 'Árvores & Madeira Nobre' está bloqueada! Pesquise AGRO_4 na Árvore de Pesquisa.");
      }
      if ((upper.includes('FRUIT') || upper.includes('BERRY')) && !this.engine.isTechUnlocked('AGRO_5')) {
        throw new Error("Cultura 'Colônias de Fruta' está bloqueada! Pesquise AGRO_5 na Árvore de Pesquisa.");
      }
      if ((upper.includes('FLOWER') || upper.includes('ENERGY')) && !this.engine.isTechUnlocked('AGRO_6')) {
        throw new Error("Cultura 'Flores Energéticas' está bloqueada! Pesquise AGRO_6 na Árvore de Pesquisa.");
      }
      if (upper.includes('GRADED') && !this.engine.isTechUnlocked('AGRO_7')) {
        throw new Error("Cultura 'Plantas Graduadas' está bloqueada! Pesquise AGRO_7 na Árvore de Pesquisa.");
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
        const rawArgs = splitCommaTopLevel(match[1]);
        const resVal = rawArgs[0] ? this.evalExpression(rawArgs[0], ctx) : 'fiber';
        const resourceArg = resVal !== undefined && resVal !== null ? String(resVal) : 'fiber';
        const amtVal = rawArgs[1] ? this.evalExpression(rawArgs[1], ctx) : 1;
        const parsedAmt = parseInt(String(amtVal), 10);
        const amountArg = isNaN(parsedAmt) ? 1 : parsedAmt;
        ctx.actionsPerformedInRun++;
        return this.engine.offerPrestigeResource(ctx.agentId, agent.x, agent.y, resourceArg, amountArg);
      }
    }
    if (expr.includes('farm.swap(')) {
      if (!this.engine.isTechUnlocked('AGRO_7')) {
        throw new Error("Recurso 'Trocar Terrenos (Swap)' está bloqueado! Pesquise AGRO_7 na Árvore de Pesquisa.");
      }
      const rawArg = expr.match(/farm\.swap\((.*?)\)/)?.[1]?.trim();
      const evaluated = rawArg ? this.evalExpression(rawArg, ctx) : 'RIGHT';
      const dirArg = evaluated !== undefined && evaluated !== null ? String(evaluated) : 'RIGHT';
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

    if (
      expr.includes('sys.get_agent_stats(') ||
      expr.includes('sys.getAgentStats(') ||
      expr.includes('agent.get_stats(') ||
      expr.includes('agent.getStats(') ||
      expr.includes('sys.get_stats(') ||
      expr.includes('sys.getStats(')
    ) {
      return this.engine.getAgentStats(ctx.agentId);
    }

    // world.*
    if (expr.includes('world.move(')) {
      const rawArg = expr.match(/world\.move\((.*?)\)/)?.[1]?.trim();
      const evaluated = rawArg ? this.evalExpression(rawArg, ctx) : 'RIGHT';
      const dirArg = evaluated !== undefined && evaluated !== null ? String(evaluated) : 'RIGHT';
      ctx.actionsPerformedInRun++;
      return this.engine.moveAgent(ctx.agentId, dirArg);
    }
    if (expr.includes('world.can_move(') || expr.includes('world.canMove(')) {
      const rawArg = expr.match(/world\.can_?move\((.*?)\)/)?.[1]?.trim();
      const evaluated = rawArg ? this.evalExpression(rawArg, ctx) : 'RIGHT';
      const dirArg = evaluated !== undefined && evaluated !== null ? String(evaluated) : 'RIGHT';
      return this.engine.canMoveAgent(ctx.agentId, dirArg);
    }
    if (expr.includes('world.x()')) {
      if (!this.engine.isTechUnlocked('SYS_2')) {
        throw new Error("Recurso 'Sensores Básicos & Coordenadas' está bloqueado! Pesquise SYS_2 na Árvore de Pesquisa.");
      }
      return agent.x;
    }
    if (expr.includes('world.y()')) {
      if (!this.engine.isTechUnlocked('SYS_2')) {
        throw new Error("Recurso 'Sensores Básicos & Coordenadas' está bloqueado! Pesquise SYS_2 na Árvore de Pesquisa.");
      }
      return agent.y;
    }
    if (expr.includes('world.width()')) {
      if (!this.engine.isTechUnlocked('SYS_2')) {
        throw new Error("Recurso 'Sensores Básicos & Coordenadas' está bloqueado! Pesquise SYS_2 na Árvore de Pesquisa.");
      }
      return this.engine.getGridWidth();
    }
    if (expr.includes('world.height()')) {
      if (!this.engine.isTechUnlocked('SYS_2')) {
        throw new Error("Recurso 'Sensores Básicos & Coordenadas' está bloqueado! Pesquise SYS_2 na Árvore de Pesquisa.");
      }
      return this.engine.getGridHeight();
    }
    if (expr.includes('world.area()')) {
      if (!this.engine.isTechUnlocked('SYS_2')) {
        throw new Error("Recurso 'Sensores Básicos & Coordenadas' está bloqueado! Pesquise SYS_2 na Árvore de Pesquisa.");
      }
      return this.engine.getGridWidth() * this.engine.getGridHeight();
    }
    if (
      expr.includes('world.ground()') ||
      expr.includes('world.get_ground()')
    ) {
      if (!this.engine.isTechUnlocked('SYS_2')) {
        throw new Error("Recurso 'Sensores Básicos & Coordenadas' está bloqueado! Pesquise SYS_2 na Árvore de Pesquisa.");
      }
      return this.engine.getTile(agent.x, agent.y).ground;
    }
    if (
      expr.includes('world.entity()') ||
      expr.includes('world.get_entity()')
    ) {
      if (!this.engine.isTechUnlocked('SYS_2')) {
        throw new Error("Recurso 'Sensores Básicos & Coordenadas' está bloqueado! Pesquise SYS_2 na Árvore de Pesquisa.");
      }
      return this.engine.getTile(agent.x, agent.y).crop;
    }
    if (
      expr.includes('world.moisture()') ||
      expr.includes('world.get_moisture()')
    ) {
      if (!this.engine.isTechUnlocked('SYS_2')) {
        throw new Error("Recurso 'Sensores Básicos & Coordenadas' está bloqueado! Pesquise SYS_2 na Árvore de Pesquisa.");
      }
      return this.engine.getTile(agent.x, agent.y).moisture;
    }
    if (expr.includes('world.measure()')) {
      if (!this.engine.isTechUnlocked('SYS_3')) {
        throw new Error("Recurso 'Medição de Bloco' está bloqueado! Pesquise SYS_3 na Árvore de Pesquisa.");
      }
      return this.engine.measureTile(agent.x, agent.y);
    }
    if (expr.includes('world.is_maze_core()')) return this.engine.isMazeCore(agent.x, agent.y);

    // inventory.*
    if (expr.includes('inventory.count(')) {
      if (!this.engine.isTechUnlocked('SYS_2')) {
        throw new Error("Recurso 'Sensor de Inventário' está bloqueado! Pesquise SYS_2 na Árvore de Pesquisa.");
      }
      const rawArg = expr.match(/inventory\.count\((.*?)\)/)?.[1]?.trim();
      const evaluated = rawArg ? this.evalExpression(rawArg, ctx) : 'fiber';
      const res = evaluated !== undefined && evaluated !== null ? String(evaluated) : 'fiber';
      return this.engine.getResourceCount(res);
    }

    // 7. Lookup in local scope or fallback
    if (expr in ctx.scope) {
      return ctx.scope[expr];
    }

    return expr;
  }
}
