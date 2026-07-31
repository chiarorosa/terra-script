import { autocompletion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { API_CATALOG, isTechUnlocked, getTechForApiItem } from '../engine/techApiMap';
import { GameEngine } from '../engine/GameEngine';

interface KeywordSpec {
  keyword: string;
  lang: 'python' | 'js' | 'both';
  techId: string;
  signature: string;
  description: string;
  snippet: string;
}

const SYNTAX_KEYWORDS: KeywordSpec[] = [
  // Conditionals (AUTO_3)
  {
    keyword: 'if',
    lang: 'python',
    techId: 'AUTO_3',
    signature: 'if condição:',
    description: 'Estrutura condicional Python. Executa o bloco se a condição for verdadeira.',
    snippet: 'if '
  },
  {
    keyword: 'if',
    lang: 'js',
    techId: 'AUTO_3',
    signature: 'if (condição) { ... }',
    description: 'Estrutura condicional JavaScript. Executa o bloco se a condição for verdadeira.',
    snippet: 'if ('
  },
  {
    keyword: 'else',
    lang: 'python',
    techId: 'AUTO_3',
    signature: 'else:',
    description: 'Ramo alternativo executado quando a condição do if for falsa em Python.',
    snippet: 'else:\n    '
  },
  {
    keyword: 'else',
    lang: 'js',
    techId: 'AUTO_3',
    signature: 'else { ... }',
    description: 'Ramo alternativo executado quando a condição do if for falsa em JavaScript.',
    snippet: 'else {\n  '
  },
  {
    keyword: 'elif',
    lang: 'python',
    techId: 'AUTO_3',
    signature: 'elif condição:',
    description: 'Condição alternativa adicional no fluxo condicional em Python.',
    snippet: 'elif '
  },
  {
    keyword: 'else if',
    lang: 'js',
    techId: 'AUTO_3',
    signature: 'else if (condição) { ... }',
    description: 'Condição alternativa adicional no fluxo condicional em JavaScript.',
    snippet: 'else if ('
  },

  // Loops (AUTO_4)
  {
    keyword: 'while',
    lang: 'python',
    techId: 'AUTO_4',
    signature: 'while condição:',
    description: 'Executa um bloco de código repetidamente enquanto a condição for verdadeira.',
    snippet: 'while '
  },
  {
    keyword: 'while',
    lang: 'js',
    techId: 'AUTO_4',
    signature: 'while (condição) { ... }',
    description: 'Executa um bloco de código repetidamente enquanto a condição for verdadeira.',
    snippet: 'while ('
  },
  {
    keyword: 'for',
    lang: 'python',
    techId: 'AUTO_4',
    signature: 'for i in range(n):',
    description: 'Itera em um intervalo de números ou elementos de uma coleção.',
    snippet: 'for i in range('
  },
  {
    keyword: 'for',
    lang: 'js',
    techId: 'AUTO_4',
    signature: 'for (let i = 0; i < n; i++) { ... }',
    description: 'Itera um número específico de vezes.',
    snippet: 'for (let i = 0; i < '
  },

  // Functions (AUTO_5)
  {
    keyword: 'def',
    lang: 'python',
    techId: 'AUTO_5',
    signature: 'def nome_função(parâmetros):',
    description: 'Define uma função personalizada em Python.',
    snippet: 'def '
  },
  {
    keyword: 'function',
    lang: 'js',
    techId: 'AUTO_5',
    signature: 'function nomeFunção(parâmetros) { ... }',
    description: 'Define uma função personalizada em JavaScript.',
    snippet: 'function '
  },
  {
    keyword: 'return',
    lang: 'both',
    techId: 'AUTO_5',
    signature: 'return valor',
    description: 'Retorna um valor e encerra a execução da função atual.',
    snippet: 'return '
  },

  // Print (SYS_1)
  {
    keyword: 'print',
    lang: 'python',
    techId: 'SYS_1',
    signature: 'print(mensagem)',
    description: 'Imprime mensagens de log no console stdout em Python.',
    snippet: 'print('
  },
  {
    keyword: 'console',
    lang: 'js',
    techId: 'SYS_1',
    signature: 'console.log(mensagem)',
    description: 'Imprime mensagens de log no console stdout em JavaScript.',
    snippet: 'console.log('
  },

  // Variables (AUTO_2)
  {
    keyword: 'let',
    lang: 'js',
    techId: 'AUTO_2',
    signature: 'let x = valor;',
    description: 'Declara uma variável local em JavaScript.',
    snippet: 'let '
  },
  {
    keyword: 'const',
    lang: 'js',
    techId: 'AUTO_2',
    signature: 'const x = valor;',
    description: 'Declara uma constante imutável em JavaScript.',
    snippet: 'const '
  },
  {
    keyword: 'var',
    lang: 'js',
    techId: 'AUTO_2',
    signature: 'var x = valor;',
    description: 'Declara uma variável em JavaScript.',
    snippet: 'var '
  }
];

export function createGameEngineCompletionExtension(engine: GameEngine, isPython: boolean = true) {
  return autocompletion({
    override: [
      (context: CompletionContext): CompletionResult | null => {
        const line = context.state.doc.lineAt(context.pos);
        const textUntilPosition = line.text.slice(0, context.pos - line.from);

        // Verifica se o cursor está após notação de ponto, ex: "farm." ou "world." ou "inventory." ou "sys." ou "agent."
        const matchDot = textUntilPosition.match(/(farm|world|inventory|sys|agent)\.([a-zA-Z0-9_]*)$/);
        
        // Verifica se o usuário está digitando palavras-chave ou métodos sem ponto
        const matchWord = textUntilPosition.match(/([a-zA-Z0-9_.]+)$/);

        if (!matchDot && !matchWord && !context.explicit) return null;

        const techTree = engine.getTechTree();
        const options: Array<{
          label: string;
          type: string;
          detail?: string;
          info?: string;
          apply?: string;
          boost?: number;
        }> = [];

        if (matchDot) {
          const namespace = matchDot[1] as 'farm' | 'world' | 'inventory' | 'sys' | 'agent';
          const prefix = matchDot[2] || '';
          const from = context.pos - prefix.length;

          if (namespace === 'sys' || namespace === 'agent') {
            const unlocked = isTechUnlocked('SYS_4', techTree);
            const techNode = getTechForApiItem('SYS_4', techTree);
            const statMethod = isPython ? 'get_agent_stats()' : 'getAgentStats()';
            if (!prefix || statMethod.toLowerCase().includes(prefix.toLowerCase())) {
              options.push({
                label: statMethod,
                type: unlocked ? 'method' : 'text',
                detail: `${namespace}.${statMethod}: object`,
                info: `Retorna o dicionário/objeto com as estatísticas e métricas do agente.\n\n${unlocked ? 'STATUS: Desbloqueado' : `STATUS: Bloqueado (Requer pesquisa: ${techNode?.name || 'SYS_4'})`}`,
                apply: statMethod,
                boost: unlocked ? 50 : -20
              });
            }
          } else {
            const items = API_CATALOG.filter(a => a.namespace === namespace);

            items.forEach(item => {
              const unlocked = isTechUnlocked(item.techId, techTree);
              const techNode = getTechForApiItem(item.techId, techTree);
              const rawSnippet = isPython ? item.pythonSnippet : item.jsSnippet;
              const methodSnippet = rawSnippet.replace(/^(farm|world|inventory)\./, '');
              const methodNameOnly = item.methodName;

              if (!prefix || methodSnippet.toLowerCase().includes(prefix.toLowerCase()) || methodNameOnly.toLowerCase().includes(prefix.toLowerCase())) {
                options.push({
                  label: methodSnippet,
                  type: unlocked ? 'method' : 'text',
                  detail: item.signature,
                  info: `Sintaxe: ${item.signature}\nUso: ${item.displayText}\n\n${item.description}\n\n${unlocked ? 'STATUS: Desbloqueado e pronto para uso!' : `STATUS: Bloqueado (Requer pesquisa: ${techNode?.name || item.techId} - Nível ${techNode?.tier})`}`,
                  apply: methodSnippet,
                  boost: unlocked ? 50 : -20
                });
              }
            });
          }

          return {
            from,
            options,
            validFor: /^[a-zA-Z0-9_"'()]*$/
          };
        }

        if (matchWord) {
          const word = matchWord[1];
          const from = context.pos - word.length;
          const currentLang = isPython ? 'python' : 'js';

          // 1. Palavras-chave de linguagem atreladas ao arquivo atual
          SYNTAX_KEYWORDS.forEach(kw => {
            if ((kw.lang === 'both' || kw.lang === currentLang) && kw.keyword.toLowerCase().startsWith(word.toLowerCase())) {
              const unlocked = isTechUnlocked(kw.techId, techTree);
              const techNode = getTechForApiItem(kw.techId, techTree);

              options.push({
                label: kw.keyword,
                type: unlocked ? 'keyword' : 'text',
                detail: kw.signature,
                info: `Sintaxe: ${kw.signature}\n\n${kw.description}\n\n${unlocked ? 'STATUS: Desbloqueado' : `STATUS: Bloqueado (Requer pesquisa: ${techNode?.name || kw.techId})`}`,
                apply: kw.snippet,
                boost: unlocked ? 80 : -10
              });
            }
          });

          // 2. Namespaces da API
          if ('farm'.startsWith(word.toLowerCase())) {
            options.push({ label: 'farm', type: 'namespace', detail: 'API de Comandos da Fazenda', boost: 20 });
          }
          if ('world'.startsWith(word.toLowerCase())) {
            options.push({ label: 'world', type: 'namespace', detail: 'API de Sensores do Mundo', boost: 20 });
          }
          if ('inventory'.startsWith(word.toLowerCase())) {
            options.push({ label: 'inventory', type: 'namespace', detail: 'API do Inventário', boost: 20 });
          }
          if ('sys'.startsWith(word.toLowerCase())) {
            options.push({ label: 'sys', type: 'namespace', detail: 'API de Telemetria e IPC', boost: 20 });
          }
          if ('agent'.startsWith(word.toLowerCase())) {
            options.push({ label: 'agent', type: 'namespace', detail: 'API do Agente', boost: 20 });
          }

          // 3. Assinaturas de API completas com base na linguagem do arquivo
          API_CATALOG.forEach(item => {
            const rawSnippet = isPython ? item.pythonSnippet : item.jsSnippet;
            if (item.namespace !== 'syntax' && (item.displayText.toLowerCase().includes(word.toLowerCase()) || rawSnippet.toLowerCase().includes(word.toLowerCase()))) {
              const unlocked = isTechUnlocked(item.techId, techTree);
              const techNode = getTechForApiItem(item.techId, techTree);
              options.push({
                label: rawSnippet,
                type: unlocked ? 'function' : 'text',
                detail: item.signature,
                info: `Sintaxe: ${item.signature}\n\n${item.description}\n\n${unlocked ? 'API Desbloqueada' : `Bloqueado (Requer pesquisa: ${techNode?.name})`}`,
                apply: rawSnippet,
                boost: unlocked ? 10 : -30
              });
            }
          });

          if (options.length > 0) {
            return {
              from,
              options,
              validFor: /^[a-zA-Z0-9_.]*$/
            };
          }
        }

        return null;
      }
    ]
  });
}


