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
    description: 'Estrutura condicional. Executa o bloco se a condição for verdadeira.',
    snippet: 'if '
  },
  {
    keyword: 'if',
    lang: 'js',
    techId: 'AUTO_3',
    signature: 'if (condição) { ... }',
    description: 'Estrutura condicional. Executa o bloco se a condição for verdadeira.',
    snippet: 'if ('
  },
  {
    keyword: 'else',
    lang: 'python',
    techId: 'AUTO_3',
    signature: 'else:',
    description: 'Ramo alternativo executado quando a condição do if for falsa.',
    snippet: 'else:\n    '
  },
  {
    keyword: 'else',
    lang: 'js',
    techId: 'AUTO_3',
    signature: 'else { ... }',
    description: 'Ramo alternativo executado quando a condição do if for falsa.',
    snippet: 'else {\n  '
  },
  {
    keyword: 'elif',
    lang: 'python',
    techId: 'AUTO_3',
    signature: 'elif condição:',
    description: 'Condição alternativa adicional no fluxo condicional.',
    snippet: 'elif '
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
    description: 'Define uma função personalizada reutilizável.',
    snippet: 'def '
  },
  {
    keyword: 'function',
    lang: 'js',
    techId: 'AUTO_5',
    signature: 'function nomeFunção(parâmetros) { ... }',
    description: 'Define uma função personalizada reutilizável.',
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
    lang: 'both',
    techId: 'SYS_1',
    signature: 'print(mensagem)',
    description: 'Imprime mensagens de log no console stdout.',
    snippet: 'print('
  },
  {
    keyword: 'console',
    lang: 'js',
    techId: 'SYS_1',
    signature: 'console.log(mensagem)',
    description: 'Imprime mensagens de log no console stdout.',
    snippet: 'console.log('
  },

  // Variables (AUTO_2)
  {
    keyword: 'let',
    lang: 'js',
    techId: 'AUTO_2',
    signature: 'let x = valor;',
    description: 'Declara uma variável local no escopo de bloco.',
    snippet: 'let '
  },
  {
    keyword: 'const',
    lang: 'js',
    techId: 'AUTO_2',
    signature: 'const x = valor;',
    description: 'Declara uma constante imutável.',
    snippet: 'const '
  }
];

export function createGameEngineCompletionExtension(engine: GameEngine, isPython: boolean = true) {
  return autocompletion({
    override: [
      (context: CompletionContext): CompletionResult | null => {
        const line = context.state.doc.lineAt(context.pos);
        const textUntilPosition = line.text.slice(0, context.pos - line.from);

        // Verifica se o cursor está após notação de ponto, ex: "farm." ou "world." ou "inventory."
        const matchDot = textUntilPosition.match(/(farm|world|inventory)\.([a-zA-Z0-9_]*)$/);
        
        // Verifica se o usuário está digitando palavras-chave
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
          const namespace = matchDot[1] as 'farm' | 'world' | 'inventory';
          const prefix = matchDot[2] || '';
          const from = context.pos - prefix.length;

          const items = API_CATALOG.filter(a => a.namespace === namespace);

          items.forEach(item => {
            const unlocked = isTechUnlocked(item.techId, techTree);
            const techNode = getTechForApiItem(item.techId, techTree);
            const methodOnly = item.displayText.replace(/^(farm|world|inventory)\./, '');

            if (!prefix || methodOnly.toLowerCase().includes(prefix.toLowerCase())) {
              options.push({
                label: methodOnly,
                type: unlocked ? 'method' : 'text',
                detail: item.signature,
                info: `Sintaxe: ${item.signature}\nUso: ${item.displayText}\n\n${item.description}\n\n${unlocked ? 'STATUS: Desbloqueado e pronto para uso!' : `STATUS: Bloqueado (Requer pesquisa: ${techNode?.name || item.techId} - Nível ${techNode?.tier})`}`,
                apply: methodOnly,
                boost: unlocked ? 50 : -20
              });
            }
          });

          return {
            from,
            options,
            validFor: /^[a-zA-Z0-9_]*$/
          };
        }

        if (matchWord) {
          const word = matchWord[1];
          const from = context.pos - word.length;
          const currentLang = isPython ? 'python' : 'js';

          // 1. Palavras-chave de linguagem (FOR, WHILE, IF, DEF, etc)
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

          // 2. Se estiver digitando farm / world / inventory
          if ('farm'.startsWith(word.toLowerCase())) {
            options.push({ label: 'farm', type: 'namespace', detail: 'API de Comandos da Fazenda', boost: 20 });
          }
          if ('world'.startsWith(word.toLowerCase())) {
            options.push({ label: 'world', type: 'namespace', detail: 'API de Sensores do Mundo', boost: 20 });
          }
          if ('inventory'.startsWith(word.toLowerCase())) {
            options.push({ label: 'inventory', type: 'namespace', detail: 'API do Inventário', boost: 20 });
          }

          // 3. Sugere também assinaturas de API (somente farm / world / inventory)
          API_CATALOG.forEach(item => {
            if (item.namespace !== 'syntax' && item.displayText.toLowerCase().includes(word.toLowerCase())) {
              const unlocked = isTechUnlocked(item.techId, techTree);
              const techNode = getTechForApiItem(item.techId, techTree);
              options.push({
                label: item.displayText,
                type: unlocked ? 'function' : 'text',
                detail: item.signature,
                info: `Sintaxe: ${item.signature}\n\n${item.description}\n\n${unlocked ? 'API Desbloqueada' : `Bloqueado (Requer pesquisa: ${techNode?.name})`}`,
                apply: item.displayText,
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

