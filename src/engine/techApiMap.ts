import { TechNode } from '../types/game';

export interface ApiParam {
  name: string;
  type: string;
  description: string;
  required?: boolean;
  allowedValues?: string[];
}

export interface ApiItem {
  id: string;
  namespace: 'farm' | 'world' | 'inventory' | 'syntax' | 'mechanics';
  methodName: string; // e.g. "harvest", "plant", "move"
  displayText: string; // e.g. "farm.harvest()"
  signature: string; // e.g. "farm.harvest(): boolean"
  pythonSnippet: string; // e.g. "farm.harvest()"
  jsSnippet: string; // e.g. "farm.harvest()"
  description: string;
  techId: string; // TechNode ID that unlocks this
  category: 'Comandos da Fazenda' | 'Sensores do Mundo' | 'Consulta de Inventário' | 'Recursos da Linguagem' | 'Mecânicas de Jogo';
  docDetail: string; // Detailed explanation for the Wiki
  exampleCode: string; // Executable code snippet for the Wiki
  parameters?: ApiParam[];
  returns?: {
    type: string;
    description: string;
  };
  usabilityNotes?: string[];
  expectedOutput?: string;
}

/**
 * =========================================================================
 * GUIA E TEMPLATE PADRÃO PARA NOVOS MÉTODOS E CONCEITOS NA WIKI DA API
 * =========================================================================
 * 
 * REGRAS DE ESTRUTURAÇÃO E EXIBIÇÃO DYNAMICA:
 * 1. ORDENAÇÃO DE SEÇÕES:
 *    - A seção "Conceitos & Regras" (`namespace: 'mechanics'`) fica sempre
 *      posicionada no TOPO da navegação lateral da documentação.
 * 
 * 2. CONCEITOS X ESTRUTURAS ESPECÍFICAS:
 *    - Conceitos generalistas (ex: "Mudança do Mundo / World Change") possuem
 *      seção própria para explicar o funcionamento amplo do ecossistema.
 *    - Estruturas e mecânicas derivadas (ex: "Bloco de Prestígio") possuem
 *      um tópico dedicado logo em seguida, detalhando a interação direta.
 * 
 * 3. OCULTAÇÃO AUTOMÁTICA DE BLOCOS NÃO APLICÁVEIS (SEM NUMERAÇÃO RÍGIDA):
 *    - Os cartões da Wiki NÃO usam mais números fixos (ex: "1. Descrição", "2. Sintaxe")
 *      para permitir a ocultação de partes não aplicáveis sem deixar lacunas.
 *    - Para artigos puramente conceituais que NÃO possuem comandos de código:
 *        * Defina `pythonSnippet: ""` e `jsSnippet: ""`
 *        * Defina `exampleCode: ""`
 *        * Omita ou deixe vazio o array `parameters: []`
 *        * Deixe `returns` indefinido (`undefined`)
 *    - A interface (`TutorialModal.tsx`) identificará automaticamente os campos
 *      vazios e ocultará totalmente os blocos sem criar espaços em branco.
 * 
 * 4. MAPEAMENTO DE PESQUISAS (TECH TREE) PARA O GUIA DE API:
 *    - Toda pesquisa na Árvore de Pesquisa (ex: 'AUTO_3', 'AGRO_2', 'SCALE_5') possui
 *      um nó com ID único em `INITIAL_TECH_TREE`.
 *    - Para vincular uma pesquisa a um item do Guia de API, configure `techId: 'ID_DA_PESQUISA'`
 *      no respectivo `ApiItem` dentro do `API_CATALOG`.
 *    - Ao clicar em "Ver no Guia de API" (na notificação de desbloqueio ou no nó da Árvore),
 *      o sistema invoca `getPrimaryApiItemForTech(techId)`, que resolve a página exata da
 *      documentação referente àquela pesquisa.
 *    - Para novos updates/pesquisas: basta declarar o novo `ApiItem` com o `techId` da pesquisa.
 * 
 * 5. MANUTENÇÃO OBRIGATÓRIA DOS GUARDRAILS NOS INTERPRETADORES NATIVOS:
 *    - Sempre que a Árvore de Pesquisas (`INITIAL_TECH_TREE`) for modificada ou novos nós/funcionalidades forem criados,
 *      OS GUARDRAILS DE EXECUÇÃO DEVEM SER REVISADOS E ATUALIZADOS nos interpretadores nativos:
 *        * `jsSandbox.ts` -> Método `checkJsGuardrails(ast, engine)` e ponte de objetos (`farm`, `world`, `sys`, `inventory`, `agent`).
 *        * `pyodideLoader.ts` -> Classe Python AST `_GuardrailChecker` e ponte de objetos `jsBridge`.
 *        * `ScriptRunner.ts` -> Métodos de fallback `evaluateStatement`, `handleConditional`, `handleWhileLoop`, etc.
 *    - Regra essencial: NENHUMA funcionalidade da API ou recurso de linguagem (if/else, loops, funções, variáveis) pode ser
 *      executado sem que a respectiva tecnologia esteja desbloqueada (`engine.isTechUnlocked(techId)`).
 * 
 * =========================================================================
 */
export const API_ITEM_TEMPLATE_SAMPLE: ApiItem = {
  id: 'nome_do_namespace_e_metodo',
  namespace: 'farm', // 'farm' | 'world' | 'inventory' | 'syntax' | 'mechanics'
  methodName: 'nomeDoMetodo',
  displayText: 'namespace.nomeDoMetodo()',
  signature: 'namespace.nomeDoMetodo(param: tipo): retorno',
  pythonSnippet: 'namespace.nome_do_metodo()', // Deixe "" para artigos puramente conceituais
  jsSnippet: 'namespace.nomeDoMetodo()',        // Deixe "" para artigos puramente conceituais
  description: 'Resumo direto e conciso da funcionalidade.',
  techId: 'AGRO_1', // ID do nó de tecnologia correspondente na Árvore de Pesquisas
  category: 'Comandos da Fazenda', // 'Comandos da Fazenda' | 'Sensores do Mundo' | 'Consulta de Inventário' | 'Recursos da Linguagem' | 'Mecânicas de Jogo'
  docDetail: 'Explicação detalhada dos pilares e comportamento da função ou conceito.',
  exampleCode: 'if farm.can_harvest():\n    farm.harvest()', // Deixe "" para artigos sem código executável
  parameters: [
    {
      name: 'paramExemplo',
      type: 'string',
      description: 'Descrição do parâmetro.',
      required: true,
      allowedValues: ['"OPCAO_1"', '"OPCAO_2"']
    }
  ],
  returns: {
    type: 'boolean',
    description: 'Descrição do valor retornado pela execução.'
  },
  usabilityNotes: [
    'Dica de usabilidade ou boa prática 1.',
    'Dica de performance ou alerta de comportamento 2.'
  ],
  expectedOutput: 'Resultado ou efeito visual imediato esperado.'
};

export const API_CATALOG: ApiItem[] = [
  // FARM APIs
  {
    id: 'farm_harvest',
    namespace: 'farm',
    methodName: 'harvest',
    displayText: 'farm.harvest()',
    signature: 'farm.harvest(): boolean',
    pythonSnippet: 'farm.harvest()',
    jsSnippet: 'farm.harvest()',
    description: 'Colhe a cultura madura no bloco atual onde o Agente está posicionado.',
    techId: 'AGRO_1',
    category: 'Comandos da Fazenda',
    docDetail: 'Executa a colheita da cultura presente nas coordenadas atuais do agente. Se a planta estiver 100% madura, o rendimento é adicionado instantaneamente ao inventário do jogador.',
    exampleCode: 'if farm.can_harvest():\n    farm.harvest()',
    parameters: [],
    returns: {
      type: 'boolean',
      description: 'Retorna true se a colheita foi realizada com sucesso; false caso contrário (ex: bloco sem planta ou cultura imatura).'
    },
    usabilityNotes: [
      'Sempre combine com farm.can_harvest() para evitar consumir ticks de ação em plantas não maduras.',
      'A colheita de fibra selvagem e culturas cultivadas zera a planta do bloco, permitindo novo plantio.'
    ],
    expectedOutput: 'Cultura colhida e adicionada ao inventário (ex: +1 Fibra Selvagem).'
  },
  {
    id: 'farm_can_harvest',
    namespace: 'farm',
    methodName: 'can_harvest',
    displayText: 'farm.can_harvest()',
    signature: 'farm.can_harvest(): boolean',
    pythonSnippet: 'farm.can_harvest()',
    jsSnippet: 'farm.can_harvest()',
    description: 'Sensor que verifica se a cultura sob o agente atingiu 100% de maturação.',
    techId: 'AGRO_1',
    category: 'Comandos da Fazenda',
    docDetail: 'Inspeciona o estágio de crescimento da cultura no bloco atual sem alterar o estado do mundo nem gastar ação de colheita.',
    exampleCode: 'while True:\n    if farm.can_harvest():\n        farm.harvest()\n    world.move("RIGHT")',
    parameters: [],
    returns: {
      type: 'boolean',
      description: 'Retorna true se a planta no bloco estiver com 100% de crescimento pronto para colheita.'
    },
    usabilityNotes: [
      'Ideal para uso em estruturas de controle if e laços while para varredura de plantações.',
      'Não produz erro se o bloco estiver vazio; apenas retorna false.'
    ],
    expectedOutput: 'Retorno booleano (True/False) imediato.'
  },
  {
    id: 'farm_water',
    namespace: 'farm',
    methodName: 'water',
    displayText: 'farm.water()',
    signature: 'farm.water(): boolean',
    pythonSnippet: 'farm.water()',
    jsSnippet: 'farm.water()',
    description: 'Irriga o solo do bloco atual, elevando a umidade ao nível máximo (100%) e convertendo para IRRIGATED.',
    techId: 'AGRO_1',
    category: 'Comandos da Fazenda',
    docDetail: 'Muda o estado do solo para IRRIGATED e restaura o nível de umidade para 100%. Se o solo estiver Arado (TILLED), farm.water() anula o estado Arado e o converte em IRRIGATED.',
    exampleCode: 'if world.moisture() < 0.4:\n    farm.water()',
    parameters: [],
    returns: {
      type: 'boolean',
      description: 'Retorna true se o solo foi irrigado com sucesso.'
    },
    usabilityNotes: [
      'Atenção: Se o solo estiver Arado (TILLED), irrigar irá anular o estado Arado e transformá-lo em IRRIGATED!',
      'Culturas que exigem Solo Arado (ex: Raízes Cultivadas / CULTIVATED_ROOT) congelam seu crescimento se o solo for alterado para IRRIGATED.',
      'Irrigar repetidamente solo com umidade acima de 95% o deixa encharcado (SOAKED) e destrói a cultura!'
    ],
    expectedOutput: 'Solo atualizado para IRRIGATED e umidade definida em 1.0 (100%).'
  },
  {
    id: 'farm_plant_fiber',
    namespace: 'farm',
    methodName: 'plant("WILD_FIBER")',
    displayText: 'farm.plant("WILD_FIBER")',
    signature: 'farm.plant(cropName: string): boolean',
    pythonSnippet: 'farm.plant("WILD_FIBER")',
    jsSnippet: 'farm.plant("WILD_FIBER")',
    description: 'SemEia sementes de Fibra Selvagem no bloco atual.',
    techId: 'AGRO_1',
    category: 'Comandos da Fazenda',
    docDetail: 'Planta a cultura básica de fibra. A fibra é o recurso primordial usado para pesquisas de Nível 1 e combustível básico.',
    exampleCode: 'farm.plant("WILD_FIBER")',
    parameters: [
      {
        name: 'cropName',
        type: 'string',
        description: 'Nome identificador da espécie vegetal.',
        required: true,
        allowedValues: ['"WILD_FIBER"']
      }
    ],
    returns: {
      type: 'boolean',
      description: 'Retorna true se a semente foi plantada; false se o bloco já contiver outra cultura.'
    },
    usabilityNotes: [
      'Fibra cresce tanto em solo Natural quanto em Solo Arado.',
      'Excelente cultura para scripts de laço inicial de acúmulo de fibra.'
    ],
    expectedOutput: 'Broto de Fibra Selvagem visível na célula.'
  },
  {
    id: 'farm_plant_bush',
    namespace: 'farm',
    methodName: 'plant("WOODY_BUSH")',
    displayText: 'farm.plant("WOODY_BUSH")',
    signature: 'farm.plant(cropName: string): boolean',
    pythonSnippet: 'farm.plant("WOODY_BUSH")',
    jsSnippet: 'farm.plant("WOODY_BUSH")',
    description: 'Planta Arbusto Arbóreo para produção contínua do recurso Madeira.',
    techId: 'AGRO_2',
    category: 'Comandos da Fazenda',
    docDetail: 'Semeia arbustos produtores de madeira. A madeira é essencial para desbloquear tecnologias de Nível 2 e ferramentas avançadas.',
    exampleCode: 'farm.plant("WOODY_BUSH")',
    parameters: [
      {
        name: 'cropName',
        type: 'string',
        description: 'Nome identificador da espécie.',
        required: true,
        allowedValues: ['"WOODY_BUSH"']
      }
    ],
    returns: {
      type: 'boolean',
      description: 'Retorna true se o plantio for bem-sucedido.'
    },
    usabilityNotes: [
      'Arbustos demoram um pouco mais para crescer do que fibras, mas entregam madeira valiosa.'
    ],
    expectedOutput: 'Semente de Arbusto Arbóreo plantada.'
  },
  {
    id: 'farm_till',
    namespace: 'farm',
    methodName: 'till',
    displayText: 'farm.till()',
    signature: 'farm.till(): boolean',
    pythonSnippet: 'farm.till()',
    jsSnippet: 'farm.till()',
    description: 'Ara o terreno Natural ou Irrigado convertendo-o em Solo Arado (TILLED).',
    techId: 'AGRO_3',
    category: 'Comandos da Fazenda',
    docDetail: 'Prepara a terra para plantios exigentes. Se o solo for Irrigado (IRRIGATED), farm.till() anula a irrigação e o converte em TILLED. Solo Arado é indispensável para culturas como Raízes Cultivadas (CULTIVATED_ROOT).',
    exampleCode: 'if world.ground() == "NATURAL" or world.ground() == "IRRIGATED":\n    farm.till()',
    parameters: [],
    returns: {
      type: 'boolean',
      description: 'Retorna true se o solo foi arado com sucesso.'
    },
    usabilityNotes: [
      'Se o solo estiver Irrigado (IRRIGATED), farm.till() anula a irrigação e o transforma em TILLED.',
      'Raízes cultivadas (CULTIVATED_ROOT) exigem OBRIGATORIAMENTE solo arado (TILLED) para crescer.'
    ],
    expectedOutput: 'Textura do solo alterada para Solo Arado (TILLED).'
  },
  {
    id: 'farm_plant_root',
    namespace: 'farm',
    methodName: 'plant("CULTIVATED_ROOT")',
    displayText: 'farm.plant("CULTIVATED_ROOT")',
    signature: 'farm.plant(cropName: string): boolean',
    pythonSnippet: 'farm.plant("CULTIVATED_ROOT")',
    jsSnippet: 'farm.plant("CULTIVATED_ROOT")',
    description: 'Semeia Raízes Cultivadas que crescem EXCLUSIVAMENTE em Solo Arado (TILLED).',
    techId: 'AGRO_3',
    category: 'Comandos da Fazenda',
    docDetail: 'Raízes cultivadas fornecem o recurso Raízes, usado em pesquisas avançadas de sistemas e expansão de agentes. Esta cultura requer OBRIGATORIAMENTE Solo Arado (TILLED) para se desenvolver. Em solo Natural ou Irrigado, o crescimento permanece zerado (0%).',
    exampleCode: 'farm.till()\nfarm.plant("CULTIVATED_ROOT")',
    parameters: [
      {
        name: 'cropName',
        type: 'string',
        description: 'Identificador da cultura.',
        required: true,
        allowedValues: ['"CULTIVATED_ROOT"']
      }
    ],
    returns: {
      type: 'boolean',
      description: 'Retorna true se o plantio ocorreu sem erros.'
    },
    usabilityNotes: [
      'Sempre are o solo com farm.till() para que as Raízes Cultivadas possam crescer.',
      'Atenção: Não irrigue o solo (farm.water()) enquanto cultivar Raízes, pois farm.water() transforma o solo em IRRIGATED e congela o crescimento!'
    ],
    expectedOutput: 'Plantação de Raiz Cultivada visível no lote.'
  },
  {
    id: 'farm_plant_tree',
    namespace: 'farm',
    methodName: 'plant("TREE")',
    displayText: 'farm.plant("TREE")',
    signature: 'farm.plant(cropName: string): boolean',
    pythonSnippet: 'farm.plant("TREE")',
    jsSnippet: 'farm.plant("TREE")',
    description: 'Planta árvores nobres que crescem EXCLUSIVAMENTE em Solo Arado (TILLED).',
    techId: 'AGRO_4',
    category: 'Comandos da Fazenda',
    docDetail: 'Permite cultivar árvores de grande porte. Requer OBRIGATORIAMENTE Solo Arado (TILLED) para crescer. Árvores possuem padrão de crescimento otimizado quando plantadas em xadrez sem vizinhos diretos.',
    exampleCode: 'farm.water()  # Eleva umidade a 100%\nfarm.till()   # Converte em TILLED\nif (world.x() + world.y()) % 2 == 0:\n    farm.plant("TREE")',
    parameters: [
      {
        name: 'cropName',
        type: 'string',
        description: 'Nome identificador da espécie.',
        required: true,
        allowedValues: ['"TREE"']
      }
    ],
    returns: {
      type: 'boolean',
      description: 'Retorna true se a árvore foi plantada.'
    },
    usabilityNotes: [
      'Árvores requerem Solo Arado (TILLED) para crescer. Em solo Natural ou Irrigado, o crescimento permanece congelado (0%).',
      'Estratégia ideal: Irrigue o solo primeiro (farm.water()) e depois are (farm.till()). Isso garante Solo Arado com umidade máxima!',
      'Use a fórmula matemática (x + y) % 2 == 0 para garantir padrão xadrez e evitar desaceleração por vizinhança.'
    ],
    expectedOutput: 'Muda de árvore plantada na coordenada.'
  },
  {
    id: 'farm_plant_fruit',
    namespace: 'farm',
    methodName: 'plant("FRUIT_COLONY")',
    displayText: 'farm.plant("FRUIT_COLONY")',
    signature: 'farm.plant(cropName: string): boolean',
    pythonSnippet: 'farm.plant("FRUIT_COLONY")',
    jsSnippet: 'farm.plant("FRUIT_COLONY")',
    description: 'Planta Colônias de Frutas com sinergia de bloco (4 a 12 frutas por lote).',
    techId: 'AGRO_5',
    category: 'Comandos da Fazenda',
    docDetail: 'Colônias de Frutas são culturas delicadas que exigem umidade >= 75% para crescer. Quando maduras, concedem +4 Frutas base +2 Frutas por colônia madura vizinha (até 12 Frutas por lote em blocos 3x3).',
    exampleCode: 'farm.water()\nfarm.plant("FRUIT_COLONY")',
    parameters: [
      {
        name: 'cropName',
        type: 'string',
        description: 'Nome da espécie.',
        required: true,
        allowedValues: ['"FRUIT_COLONY"']
      }
    ],
    returns: {
      type: 'boolean',
      description: 'Retorna true se a colônia foi semeada.'
    },
    usabilityNotes: [
      'Requer umidade >= 75% para se desenvolver. Mantenha o solo bem irrigado com farm.water().',
      'Plante colônias em blocos contínuos (2x2 ou 3x3) para ativar a sinergia e obter até 12 Frutas por lote!'
    ],
    expectedOutput: 'Colônia de Frutas semeada.'
  },
  {
    id: 'farm_plant_flower',
    namespace: 'farm',
    methodName: 'plant("ENERGY_FLOWER")',
    displayText: 'farm.plant("ENERGY_FLOWER")',
    signature: 'farm.plant(cropName: string): boolean',
    pythonSnippet: 'farm.plant("ENERGY_FLOWER")',
    jsSnippet: 'farm.plant("ENERGY_FLOWER")',
    description: 'Semeia Flores de Energia com potencial oscilante (1 a 9 Energia por colheita).',
    techId: 'AGRO_6',
    category: 'Comandos da Fazenda',
    docDetail: 'Flores de Energia geram o recurso Energia. Exigem umidade >= 75% para crescer. O nível de energia oscila continuamente (10 a 90) e deve ser medido com world.measure(). Colha no pico (>= 70) para obter de 7 a 9 de Energia!',
    exampleCode: 'farm.plant("ENERGY_FLOWER")\nif world.measure() >= 70:\n    farm.harvest()',
    parameters: [
      {
        name: 'cropName',
        type: 'string',
        description: 'Identificador da flor.',
        required: true,
        allowedValues: ['"ENERGY_FLOWER"']
      }
    ],
    returns: {
      type: 'boolean',
      description: 'Retorna true se plantado.'
    },
    usabilityNotes: [
      'Requer umidade >= 75% para crescer.',
      'Consulte o valor numérico com world.measure() antes de colher para obter os maiores picos de energia (1 a 9 de Energia).'
    ],
    expectedOutput: 'Flor de Energia semeada.'
  },
  {
    id: 'farm_plant_graded',
    namespace: 'farm',
    methodName: 'plant("GRADED_PLANT")',
    displayText: 'farm.plant("GRADED_PLANT")',
    signature: 'farm.plant(cropName: string): boolean',
    pythonSnippet: 'farm.plant("GRADED_PLANT")',
    jsSnippet: 'farm.plant("GRADED_PLANT")',
    description: 'Planta culturas graduadas que recebem notas numéricas de 1 a 9.',
    techId: 'AGRO_7',
    category: 'Comandos da Fazenda',
    docDetail: 'Permite exercitar algoritmos de ordenação (ex: Bubble Sort). Troque os blocos com farm.swap() até alinhar a fileira em ordem crescente para bônus massivo de Biomassa.',
    exampleCode: 'farm.plant("GRADED_PLANT")',
    parameters: [
      {
        name: 'cropName',
        type: 'string',
        description: 'Espécie graduada.',
        required: true,
        allowedValues: ['"GRADED_PLANT"']
      }
    ],
    returns: {
      type: 'boolean',
      description: 'Retorna true se plantado.'
    },
    usabilityNotes: [
      'Mede-se a nota da planta atual com world.measure().'
    ],
    expectedOutput: 'Planta Graduada com nota atribuída.'
  },
  {
    id: 'farm_swap',
    namespace: 'farm',
    methodName: 'swap',
    displayText: 'farm.swap("RIGHT")',
    signature: 'farm.swap(direction: string): boolean',
    pythonSnippet: 'farm.swap("RIGHT")',
    jsSnippet: 'farm.swap("RIGHT")',
    description: 'Troca a planta atual com o lote vizinho na direção especificada.',
    techId: 'AGRO_7',
    category: 'Comandos da Fazenda',
    docDetail: 'Comando fundamental para ordenação de lavouras. Permite mover culturas para esquerda, direita, cima ou baixo sem precisar recalcular todo o solo.',
    exampleCode: 'if world.measure() > neighbor_val:\n    farm.swap("RIGHT")',
    parameters: [
      {
        name: 'direction',
        type: 'string',
        description: 'Direção do lote vizinho a ser trocado.',
        required: true,
        allowedValues: ['"RIGHT"', '"LEFT"', '"FORWARD"', '"BACKWARD"', '"NORTH"', '"SOUTH"', '"WEST"', '"EAST"']
      }
    ],
    returns: {
      type: 'boolean',
      description: 'Retorna true se a troca foi executada.'
    },
    usabilityNotes: [
      'Utilize em laços de troca para implementar algoritmos de ordenação por comparação.'
    ],
    expectedOutput: 'Plantas entre as duas células vizinhas trocadas de posição.'
  },
  {
    id: 'farm_prestige',
    namespace: 'farm',
    methodName: 'prestige',
    displayText: 'farm.prestige(recurso, quantidade)',
    signature: 'farm.prestige(resource: string, amount: number): boolean',
    pythonSnippet: 'farm.prestige("fiber", 50)',
    jsSnippet: 'farm.prestige("fiber", 50)',
    description: 'Entrega recursos no Bloco de Prestígio Dourado para subir o Nível de Prestígio e ganhar Pontos de Prestígio.',
    techId: 'AUTO_2',
    category: 'Comandos da Fazenda',
    docDetail: 'Disponível após a Mudança do Mundo ao completar as 4 pesquisas iniciais de Nível 1. O agente deve navegar até a célula Dourada do Bloco de Prestígio para depositar recursos.',
    exampleCode: 'if world.ground() == "PRESTIGE":\n    farm.prestige("fiber", 100)',
    parameters: [
      {
        name: 'resource',
        type: 'string',
        description: 'Nome do recurso a ser entregue.',
        required: true,
        allowedValues: ['"fiber"', '"wood"', '"roots"', '"fruits"', '"energy"', '"biomass"', '"crystals"']
      },
      {
        name: 'amount',
        type: 'number',
        description: 'Quantidade de unidades do recurso a entregar.',
        required: true
      }
    ],
    returns: {
      type: 'boolean',
      description: 'Retorna true se a entrega foi aceita e convertida em pontos de prestígio.'
    },
    usabilityNotes: [
      'Garante aumento no nível de prestígio e bônus passivos multiplicadores de colheita.'
    ],
    expectedOutput: 'Recursos consumidos e Pontos de Prestígio concedidos.'
  },

  // WORLD APIs
  {
    id: 'world_move',
    namespace: 'world',
    methodName: 'move',
    displayText: 'world.move("RIGHT")',
    signature: 'world.move(direction: string): boolean',
    pythonSnippet: 'world.move("RIGHT")',
    jsSnippet: 'world.move("RIGHT")',
    description: 'Desloca o Agente 1 passo na direção especificada.',
    techId: 'AUTO_1',
    category: 'Sensores do Mundo',
    docDetail: 'Navega o agente pela grade da fazenda. Suporta direções relativas ("FORWARD", "BACKWARD", "LEFT", "RIGHT") e cardinais ("NORTH", "SOUTH", "WEST", "EAST").',
    exampleCode: 'world.move("RIGHT")',
    parameters: [
      {
        name: 'direction',
        type: 'string',
        description: 'Direção do movimento.',
        required: true,
        allowedValues: ['"RIGHT"', '"LEFT"', '"FORWARD"', '"BACKWARD"', '"NORTH"', '"SOUTH"', '"WEST"', '"EAST"']
      }
    ],
    returns: {
      type: 'boolean',
      description: 'Retorna true se o movimento foi realizado; false se houver obstáculo ou borda da grade.'
    },
    usabilityNotes: [
      'Evite mover contra as paredes externas do mapa para não gastar chamadas inválidas.',
      'Sempre verifique world.can_move(dir) se estiver em mapas de labirinto.'
    ],
    expectedOutput: 'Agente deslocado para a célula adjacente.'
  },
  {
    id: 'world_can_move',
    namespace: 'world',
    methodName: 'can_move',
    displayText: 'world.can_move("RIGHT")',
    signature: 'world.can_move(direction: string): boolean',
    pythonSnippet: 'world.can_move("RIGHT")',
    jsSnippet: 'world.can_move("RIGHT")',
    description: 'Sensor de obstáculo: verifica se a célula vizinha na direção informada está livre.',
    techId: 'AUTO_1',
    category: 'Sensores do Mundo',
    docDetail: 'Garante navegação segura em terrenos expandidos e labirintos evitando colisão.',
    exampleCode: 'if world.can_move("FORWARD"):\n    world.move("FORWARD")',
    parameters: [
      {
        name: 'direction',
        type: 'string',
        description: 'Direção a inspecionar.',
        required: true,
        allowedValues: ['"RIGHT"', '"LEFT"', '"FORWARD"', '"BACKWARD"', '"NORTH"', '"SOUTH"', '"WEST"', '"EAST"']
      }
    ],
    returns: {
      type: 'boolean',
      description: 'Retorna true se o caminho estiver desimpedido.'
    },
    usabilityNotes: [
      'Fundamental para algoritmos de busca em profundidade/largura (DFS/BFS) e desvio de barreiras.'
    ],
    expectedOutput: 'Booleano (True / False).'
  },
  {
    id: 'world_clear',
    namespace: 'world',
    methodName: 'clear',
    displayText: 'world.clear()',
    signature: 'world.clear(): void',
    pythonSnippet: 'world.clear()',
    jsSnippet: 'world.clear()',
    description: 'Reseta todos os blocos do terreno para estado Natural e retorna o Agente para a origem (0,0).',
    techId: 'AUTO_1',
    category: 'Sensores do Mundo',
    docDetail: 'Limpa o campo da fazenda de forma instantânea. Não afeta o inventário do jogador, nem pesquisas, nem arquivos do editor.',
    exampleCode: 'world.clear()',
    parameters: [],
    returns: {
      type: 'void',
      description: 'Não possui retorno.'
    },
    usabilityNotes: [
      'Útil no início de scripts de testes para garantir um cenário limpo antes da execução.'
    ],
    expectedOutput: 'Terreno resetado para terra natural limpa e agente posicionado em (0,0).'
  },
  {
    id: 'world_x',
    namespace: 'world',
    methodName: 'x',
    displayText: 'world.x()',
    signature: 'world.x(): number',
    pythonSnippet: 'world.x()',
    jsSnippet: 'world.x()',
    description: 'Retorna a coordenada horizontal X atual do Agente (0 até largura - 1).',
    techId: 'SYS_2',
    category: 'Sensores do Mundo',
    docDetail: 'Sensor de posição no eixo horizontal.',
    exampleCode: 'posX = world.x()',
    parameters: [],
    returns: {
      type: 'number',
      description: 'Número inteiro representando a coluna atual na grade.'
    },
    usabilityNotes: [
      'Combine com world.width() para identificar se o agente atingiu a borda direita da fazenda.'
    ],
    expectedOutput: 'Número da coluna (ex: 0, 1, 2...).'
  },
  {
    id: 'world_y',
    namespace: 'world',
    methodName: 'y',
    displayText: 'world.y()',
    signature: 'world.y(): number',
    pythonSnippet: 'world.y()',
    jsSnippet: 'world.y()',
    description: 'Retorna a coordenada vertical Y atual do Agente (0 até altura - 1).',
    techId: 'SYS_2',
    category: 'Sensores do Mundo',
    docDetail: 'Sensor de posição no eixo vertical.',
    exampleCode: 'posY = world.y()',
    parameters: [],
    returns: {
      type: 'number',
      description: 'Número inteiro representando a linha atual na grade.'
    },
    usabilityNotes: [
      'Combine com world.height() para controle de navegação em matrizes 2D.'
    ],
    expectedOutput: 'Número da linha (ex: 0, 1, 2...).'
  },
  {
    id: 'world_width',
    namespace: 'world',
    methodName: 'width',
    displayText: 'world.width()',
    signature: 'world.width(): number',
    pythonSnippet: 'world.width()',
    jsSnippet: 'world.width()',
    description: 'Retorna a largura total da grade do terreno atual.',
    techId: 'SYS_2',
    category: 'Sensores do Mundo',
    docDetail: 'Dimensão total de colunas na fazenda. Varia conforme as expansões de escala desbloqueadas (1, 3, 5, 7, 9, 12).',
    exampleCode: 'limite_x = world.width()',
    parameters: [],
    returns: {
      type: 'number',
      description: 'Quantidade total de colunas.'
    },
    usabilityNotes: [
      'Permite escrever códigos adaptativos que funcionam em qualquer tamanho de terreno sem alterar o script.'
    ],
    expectedOutput: 'Dimensão total (ex: 3, 5, 7, 9, 12).'
  },
  {
    id: 'world_height',
    namespace: 'world',
    methodName: 'height',
    displayText: 'world.height()',
    signature: 'world.height(): number',
    pythonSnippet: 'world.height()',
    jsSnippet: 'world.height()',
    description: 'Retorna a altura total da grade do terreno atual.',
    techId: 'SYS_2',
    category: 'Sensores do Mundo',
    docDetail: 'Dimensão total de linhas na fazenda.',
    exampleCode: 'limite_y = world.height()',
    parameters: [],
    returns: {
      type: 'number',
      description: 'Quantidade total de linhas.'
    },
    usabilityNotes: [
      'Use em laços for encadeados para percorrer a matriz completa da fazenda.'
    ],
    expectedOutput: 'Dimensão total (ex: 3, 5, 7, 9, 12).'
  },
  {
    id: 'world_ground',
    namespace: 'world',
    methodName: 'ground',
    displayText: 'world.ground()',
    signature: 'world.ground(): string',
    pythonSnippet: 'world.ground()',
    jsSnippet: 'world.ground()',
    description: 'Retorna a classificação do tipo de solo sob o Agente.',
    techId: 'SYS_2',
    category: 'Sensores do Mundo',
    docDetail: 'Inspeciona o solo atual. Possíveis retornos: "NATURAL" (terreno virgem), "TILLED" (solo arado), "IRRIGATED" (solo irrigado), "SOAKED" (solo encharcado) ou "PRESTIGE" (bloco de prestígio).',
    exampleCode: 'if world.ground() == "NATURAL":\n    farm.till()',
    parameters: [],
    returns: {
      type: 'string',
      description: 'String com a constante do estado do terreno.'
    },
    usabilityNotes: [
      'Lógica essencial antes de executar farm.till() ou farm.water().'
    ],
    expectedOutput: '"NATURAL", "TILLED", "IRRIGATED", "SOAKED" ou "PRESTIGE".'
  },
  {
    id: 'world_entity',
    namespace: 'world',
    methodName: 'entity',
    displayText: 'world.entity()',
    signature: 'world.entity(): string',
    pythonSnippet: 'world.entity()',
    jsSnippet: 'world.entity()',
    description: 'Retorna o identificador da cultura/planta presente no bloco atual.',
    techId: 'SYS_2',
    category: 'Sensores do Mundo',
    docDetail: 'Inspeciona a espécie semeada. Retorna "NONE" se o bloco estiver sem sementes, ou o nome da cultura ("WILD_FIBER", "WOODY_BUSH", "CULTIVATED_ROOT", "TREE", "FRUIT_COLONY", "ENERGY_FLOWER", "GRADED_PLANT").',
    exampleCode: 'if world.entity() == "NONE":\n    farm.plant("WILD_FIBER")',
    parameters: [],
    returns: {
      type: 'string',
      description: 'Nome da espécie vegetal ou "NONE".'
    },
    usabilityNotes: [
      'Verifique se o bloco está vazio com world.entity() == "NONE" antes de tentar novo plantio.'
    ],
    expectedOutput: 'Nome da cultura ou "NONE".'
  },
  {
    id: 'world_moisture',
    namespace: 'world',
    methodName: 'moisture',
    displayText: 'world.moisture()',
    signature: 'world.moisture(): number',
    pythonSnippet: 'world.moisture()',
    jsSnippet: 'world.moisture()',
    description: 'Sensor de umidade do solo (valor decimal de 0.0 a 1.0).',
    techId: 'SYS_2',
    category: 'Sensores do Mundo',
    docDetail: 'Mede o nível numérico de hidratação da terra sob o agente.',
    exampleCode: 'if world.moisture() < 0.3:\n    farm.water()',
    parameters: [],
    returns: {
      type: 'number',
      description: 'Número entre 0.0 (totalmente seco) e 1.0 (100% irrigado).'
    },
    usabilityNotes: [
      'A umidade diminui gradualmente com o tempo (evaporação) e com a absorção das plantas.',
      'Quando a umidade cai abaixo de 25% (0.25), o solo irrigado reverte automaticamente para terreno natural.'
    ],
    expectedOutput: 'Valor de umidade (ex: 0.85).'
  },
  {
    id: 'world_measure',
    namespace: 'world',
    methodName: 'measure',
    displayText: 'world.measure()',
    signature: 'world.measure(): number',
    pythonSnippet: 'world.measure()',
    jsSnippet: 'world.measure()',
    description: 'Sensor numérico multiuso para medir níveis de energia de flores e notas de plantas graduadas.',
    techId: 'SYS_3',
    category: 'Sensores do Mundo',
    docDetail: 'Retorna a métrica especial do bloco atual (nota da planta graduada de 1 a 9, ou valor de oscilação de energia da flor).',
    exampleCode: 'nota = world.measure()',
    parameters: [],
    returns: {
      type: 'number',
      description: 'Valor numérico medido no bloco.'
    },
    usabilityNotes: [
      'Indispensável para tomar decisões em algoritmos de ordenação e otimização de flores.'
    ],
    expectedOutput: 'Número (ex: 7 ou 82.5).'
  },

  // INVENTORY APIs
  {
    id: 'inventory_count',
    namespace: 'inventory',
    methodName: 'count',
    displayText: 'inventory.count("fiber")',
    signature: 'inventory.count(resourceName: string): number',
    pythonSnippet: 'inventory.count("fiber")',
    jsSnippet: 'inventory.count("fiber")',
    description: 'Consulta o total estocado do recurso especificado no inventário global.',
    techId: 'SYS_2',
    category: 'Consulta de Inventário',
    docDetail: 'Inspeciona o saldo de matérias-primas e colheitas acumuladas no armazém.',
    exampleCode: 'fibra_atual = inventory.count("fiber")',
    parameters: [
      {
        name: 'resourceName',
        type: 'string',
        description: 'Identificador do recurso.',
        required: true,
        allowedValues: ['"fiber"', '"wood"', '"roots"', '"fruits"', '"energy"', '"biomass"', '"crystals"']
      }
    ],
    returns: {
      type: 'number',
      description: 'Quantidade inteira em estoque.'
    },
    usabilityNotes: [
      'Utilize para definir metas em laços: while inventory.count("fiber") < 100:'
    ],
    expectedOutput: 'Quantidade total estocada (ex: 45).'
  },

  // SYNTAX & LANGUAGE FEATURES
  {
    id: 'syntax_print',
    namespace: 'syntax',
    methodName: 'print',
    displayText: 'print(...) / console.log(...)',
    signature: 'print(*args) / console.log(...args)',
    pythonSnippet: 'print("Posição:", world.x(), world.y())',
    jsSnippet: 'console.log("Posição:", world.x(), world.y());',
    description: 'Imprime mensagens e valores no console stdout do Painel Inferior.',
    techId: 'SYS_1',
    category: 'Recursos da Linguagem',
    docDetail: 'Ferramenta primária para depuração e saída de dados do script.',
    exampleCode: 'print("Iniciando varredura da fazenda...")',
    parameters: [
      {
        name: 'message',
        type: 'any',
        description: 'Texto, variáveis ou objetos a serem exibidos no console.',
        required: true
      }
    ],
    returns: {
      type: 'void',
      description: 'Sem retorno.'
    },
    usabilityNotes: [
      'Logs aparecem em tempo real na aba Console no Painel Inferior.'
    ],
    expectedOutput: 'Linha impressa no Console.'
  },
  {
    id: 'syntax_vars',
    namespace: 'syntax',
    methodName: 'variables',
    displayText: 'Variáveis e Operadores Matemáticos',
    signature: 'x = 10 | let x = 10',
    pythonSnippet: 'x = world.x()\nproximo_x = x + 1',
    jsSnippet: 'let x = world.x();\nlet proximoX = x + 1;',
    description: 'Declaração de variáveis, acumulação e operações aritméticas (+, -, *, /, %).',
    techId: 'AUTO_2',
    category: 'Recursos da Linguagem',
    docDetail: 'Permite armazenar estados temporários, contadores, posições registradas e realizar cálculos.',
    exampleCode: 'total = 0\ntotal = total + inventory.count("fiber")',
    parameters: [],
    returns: {
      type: 'void',
      description: 'Atribuição de memória.'
    },
    usabilityNotes: [
      'Em Python não é necessário palavra-chave de declaração; em JS utilize let ou const.'
    ],
    expectedOutput: 'Variáveis alocadas na memória do agente.'
  },
  {
    id: 'syntax_conditionals',
    namespace: 'syntax',
    methodName: 'conditionals',
    displayText: 'Estruturas Condicionais & Operadores Lógicos (and/or/&&/||)',
    signature: 'if c1 and c2: ... elif ... else: | if (c1 && c2) { ... }',
    pythonSnippet: 'if farm.can_harvest() and world.moisture() > 0.5:\n    farm.harvest()\nelif world.moisture() < 0.2:\n    farm.water()',
    jsSnippet: 'if (farm.can_harvest() && world.moisture() > 0.5) {\n  farm.harvest();\n} else if (world.moisture() < 0.2) {\n  farm.water();\n}',
    description: 'Tomada de decisão lógica no código com suporte completo a operadores relacionais (==, !=, <, >) e lógicos (and, or / &&, ||).',
    techId: 'AUTO_3',
    category: 'Recursos da Linguagem',
    docDetail: 'Permite ao código tomar decisões dinâmicas baseadas no estado da fazenda e dos sensores.',
    exampleCode: 'if world.ground() == "NATURAL" and world.moisture() < 0.5:\n    farm.till()\n    farm.water()',
    parameters: [],
    returns: {
      type: 'void',
      description: 'Fluxo de controle.'
    },
    usabilityNotes: [
      'Liberado no nó AUTO_3 da Árvore de Pesquisas.',
      'Operadores e/ou (Python: and, or | JS: &&, ||) funcionam simultaneamente com condicionais.'
    ],
    expectedOutput: 'Bloco de código correspondente executado.'
  },
  {
    id: 'syntax_loops',
    namespace: 'syntax',
    methodName: 'loops',
    displayText: 'Laços de Repetição (while / for)',
    signature: 'while condicao: ... | for i in range(n): ...',
    pythonSnippet: 'while True:\n    if farm.can_harvest():\n        farm.harvest()\n    world.move("RIGHT")',
    jsSnippet: 'while (true) {\n  if (farm.can_harvest()) {\n    farm.harvest();\n  }\n  world.move("RIGHT");\n}',
    description: 'Execução repetitiva e contínua de blocos de automação agrícola.',
    techId: 'AUTO_4',
    category: 'Recursos da Linguagem',
    docDetail: 'Estruturas indispensáveis para criar robôs autônomos que percorrem a fazenda continuamente.',
    exampleCode: 'for i in range(5):\n    farm.water()\n    world.move("RIGHT")',
    parameters: [],
    returns: {
      type: 'void',
      description: 'Repetição de instruções.'
    },
    usabilityNotes: [
      'Em laços infinitos (while True:), a cada passo de ação do agente o motor do jogo sincroniza a renderização 3D.'
    ],
    expectedOutput: 'Sequência de instruções repetidas.'
  },
  {
    id: 'syntax_functions',
    namespace: 'syntax',
    methodName: 'functions',
    displayText: 'Modularização com Funções (def / function)',
    signature: 'def nome_funcao(params): ... | function nomeFuncao(params) { ... }',
    pythonSnippet: 'def cuidar_do_bloco():\n    if farm.can_harvest():\n        farm.harvest()\n    if world.ground() == "NATURAL":\n        farm.till()\n        farm.water()',
    jsSnippet: 'function cuidarDoBloco() {\n  if (farm.can_harvest()) {\n    farm.harvest();\n  }\n  if (world.ground() === "NATURAL") {\n    farm.till();\n    farm.water();\n  }\n}',
    description: 'Criação de procedimentos e funções personalizadas para reutilização de código.',
    techId: 'AUTO_5',
    category: 'Recursos da Linguagem',
    docDetail: 'Evita repetição de código (DRY). Agrupa rotinas de plantio, irrigação ou navegação em blocos modulares limpos.',
    exampleCode: 'def processar_fileira():\n    while world.x() < world.width() - 1:\n        cuidar_do_bloco()\n        world.move("RIGHT")',
    parameters: [],
    returns: {
      type: 'any',
      description: 'O valor retornado pelo comando return dentro da função.'
    },
    usabilityNotes: [
      'Defina suas funções no início do arquivo e chame-as dentro do laço principal do script.'
    ],
    expectedOutput: 'Rotina executada modularmente.'
  },
  {
    id: 'syntax_ipc',
    namespace: 'syntax',
    methodName: 'ipc_messages',
    displayText: 'Comunicação Inter-Agentes IPC (sys.send / sys.receive)',
    signature: 'sys.send(agentId, msg) | sys.receive()',
    pythonSnippet: '# Agente 1 envia sinal para Agente 2:\nsys.send(2, "LINHA_CONCLUIDA")\n\n# Agente 2 recebe:\nsignal = sys.receive()',
    jsSnippet: '// Agente 1 envia sinal para Agente 2:\nsys.send(2, "LINHA_CONCLUIDA");\n\n// Agente 2 recebe:\nconst signal = sys.receive();',
    description: 'Sincronização e troca de mensagens entre múltiplos Agentes Autônomos em tempo real.',
    techId: 'AUTO_6',
    category: 'Recursos da Linguagem',
    docDetail: 'Permite coordenar frotas de agentes (ex: Agente #1 ara e irriga o solo, enviando sinal para o Agente #2 realizar o plantio na linha limpa).',
    exampleCode: 'if farm.can_harvest():\n    farm.harvest()\n    sys.send(2, "AVANCAR")',
    parameters: [
      {
        name: 'agentId',
        type: 'number',
        description: 'ID numérico do agente destinatário (1, 2, 3).',
        required: true
      },
      {
        name: 'msg',
        type: 'string',
        description: 'Conteúdo da mensagem ou sinal transmitido.',
        required: true
      }
    ],
    returns: {
      type: 'string | null',
      description: 'sys.receive() retorna a próxima mensagem da fila ou null se a fila estiver vazia.'
    },
    usabilityNotes: [
      'Liberado no nó AUTO_6 da Árvore de Pesquisas.'
    ],
    expectedOutput: 'Mensagem transmitida para a fila do agente de destino.'
  },
  {
    id: 'sys_get_agent_stats',
    namespace: 'syntax',
    methodName: 'get_agent_stats',
    displayText: 'sys.get_agent_stats() / agent.get_stats()',
    signature: 'sys.get_agent_stats(): object',
    pythonSnippet: 'stats = sys.get_agent_stats()\nprint("Passos:", stats["steps_count"])\nprint("Colhidos:", stats["harvested_count"])',
    jsSnippet: 'const stats = sys.getAgentStats();\nconsole.log("Passos:", stats.steps_count);',
    description: 'Acessa o dicionário com estatísticas e contadores de telemetria individuais deste agente.',
    techId: 'SYS_4',
    category: 'Recursos da Linguagem',
    docDetail: 'Retorna um objeto com contadores em tempo real: planted_count, harvested_count, watered_count, tilled_count, steps_count e recursos colhidos individualmente.',
    exampleCode: 'stats = sys.get_agent_stats()\nif stats["harvested_count"] > 50:\n    print("Agente hiper produtivo!")',
    parameters: [],
    returns: {
      type: 'object',
      description: 'Dicionário/Objeto com as estatísticas do agente.'
    },
    usabilityNotes: [
      'Excelente para telemetria, diagnóstico de desempenho e relatórios customizados no console.'
    ],
    expectedOutput: 'Dicionário com estatísticas numéricas.'
  },

  // GAME MECHANICS CONCEPT ARTICLES
  {
    id: 'mech_soil_water',
    namespace: 'mechanics',
    methodName: 'Solo, Umidade e Transições',
    displayText: 'Mecânicas de Solo, Umidade e Transições v2.5.1',
    signature: 'Regras Físicas e Estados do Terreno Agrícola',
    pythonSnippet: '# Dica: Inspecione e prepare o solo conforme a cultura\nif world.ground() == "IRRIGATED":\n    farm.till()  # Converte IRRIGATED para TILLED\nelif world.ground() == "TILLED":\n    farm.water() # Converte TILLED para IRRIGATED',
    jsSnippet: '// Dica: Inspecione e prepare o solo conforme a cultura\nif (world.ground() === "IRRIGATED") {\n  farm.till();  // Converte IRRIGATED para TILLED\n} else if (world.ground() === "TILLED") {\n  farm.water(); // Converte TILLED para IRRIGATED\n}',
    description: 'Guia completo do solo: transições mutuamente exclusivas entre TILLED e IRRIGATED e exigências das plantas.',
    techId: 'AGRO_1',
    category: 'Mecânicas de Jogo',
    docDetail: 'O solo na fazenda possui 4 estados principais: NATURAL (terreno virgem), TILLED (arado), IRRIGATED (irrigado) e SOAKED (encharcado). As ações farm.till() e farm.water() alteram o estado do solo: se um solo estiver IRRIGATED, executar farm.till() anula a irrigação e o transforma em TILLED. Se o solo estiver TILLED, executar farm.water() anula o estado arado e o transforma em IRRIGATED. Culturas como Raízes Cultivadas (CULTIVATED_ROOT) exigem exclusivamente Solo Arado (TILLED) para crescer.',
    exampleCode: 'if world.ground() != "TILLED":\n    farm.till()\nfarm.plant("CULTIVATED_ROOT")',
    parameters: [],
    returns: {
      type: 'conceito',
      description: 'Compreensão das regras de solo do ambiente.'
    },
    usabilityNotes: [
      'Solo Arado (TILLED): Necessário exclusivamente para Raízes Cultivadas (CULTIVATED_ROOT). Irrigar o solo arado (farm.water()) cancela o estado TILLED e o transforma em IRRIGATED.',
      'Solo Irrigado (IRRIGATED): Eleva a umidade a 100% e acelera o crescimento de fibras e arbustos. Arar o solo irrigado (farm.till()) cancela o estado IRRIGATED e o transforma em TILLED.',
      'Se a umidade de um bloco IRRIGATED cair para <= 25%, ele reverte para NATURAL.',
      'Irrigar solo com umidade > 95% faz o solo ficar encharcado (SOAKED) e destrói a cultura atual.'
    ],
    expectedOutput: 'Otimização de preparação de solo e irrigação no código.'
  },
  {
    id: 'mech_crop_growth',
    namespace: 'mechanics',
    methodName: 'Crescimento e Colheita das Culturas',
    displayText: 'Sinergia e Regras de Crescimento das Plantas v2.5.1',
    signature: 'Mecânicas de Maturação e Rendimento',
    pythonSnippet: '# Padrão de verificação de maturação e medição antes de colher\nif farm.can_harvest():\n    if world.crop() == "ENERGY_FLOWER" and world.measure() < 70:\n        pass # Aguarda o pico de energia!\n    else:\n        farm.harvest()',
    jsSnippet: '// Padrão de verificação de maturação e medição antes de colher\nif (farm.can_harvest()) {\n  if (world.crop() === "ENERGY_FLOWER" && world.measure() < 70) {\n    // Aguarda o pico de energia!\n  } else {\n    farm.harvest();\n  }\n}',
    description: 'Guia detalhado de solo, maturação e rendimentos para as 6 culturas principais.',
    techId: 'AGRO_1',
    category: 'Mecânicas de Jogo',
    docDetail: 'Regras e rendimentos das culturas no v2.5.1:\n1. Grama Selvagem (WILD_FIBER): +1 Fibra. Cresce em qualquer solo e surge espontaneamente em terrenos desocupados.\n2. Arbusto de Madeira (WOODY_BUSH): +1 Madeira. Crescimento rápido em qualquer solo.\n3. Raízes Cultivadas (CULTIVATED_ROOT): +2 Raízes. Exige EXCLUSIVAMENTE Solo Arado (TILLED). Em solo NATURAL ou IRRIGATED, o crescimento fica zerado (0%).\n4. Árvore Nobre (TREE): +5 Madeira em xadrez sem vizinhos / +2 Madeira com vizinho. Exige EXCLUSIVAMENTE Solo Arado (TILLED).\n5. Colônia de Frutas (FRUIT_COLONY): +4 Frutas base +2 por vizinho maduro (até 12 Frutas por lote em bloco 3x3). Requer umidade >= 75%.\n6. Flor de Energia (ENERGY_FLOWER): +1 a +9 Energia conforme o pico de oscilação medido com world.measure(). Requer umidade >= 75%.',
    exampleCode: 'if farm.can_harvest():\n    farm.harvest()',
    parameters: [],
    returns: {
      type: 'conceito',
      description: 'Regras de maximização de rendimentos agrícolas.'
    },
    usabilityNotes: [
      'Grama Selvagem e Arbustos: Crescem em qualquer solo (NATURAL, TILLED, IRRIGATED).',
      'Raízes e Árvores: Requerem OBRIGATORIAMENTE Solo Arado (TILLED). Dica: irrigue antes (water) e are depois (till) para manter umidade alta no Solo Arado.',
      'Frutas e Flores: Exigem umidade >= 75%. Frutas rendem bônus quando plantadas juntas; Flores oscilam energia e devem ser colhidas no pico lido com world.measure().'
    ],
    expectedOutput: 'Aumento expressivo na taxa de colheita e acúmulo de recursos.'
  },
  {
    id: 'mech_world_change',
    namespace: 'mechanics',
    methodName: 'Mudança do Mundo (World Change)',
    displayText: 'Conceito: Mudança do Mundo (World Change)',
    signature: 'Mecânica Evolutiva de Transformação do Terreno',
    pythonSnippet: '',
    jsSnippet: '',
    description: 'Entenda o conceito de Mudança do Mundo: transformações dinâmicas e reestruturações permanentes do ambiente acionadas por marcos tecnológicos.',
    techId: 'AUTO_2',
    category: 'Mecânicas de Jogo',
    docDetail: 'A Mudança do Mundo (World Change) é um conceito central do ecossistema do jogo. Conforme o Programador conclui marcos de pesquisa (como finalizar todas as 4 pesquisas de Nível 1), o ambiente planetário passa por reestruturações físicas permanentes em tempo real. Cada Mudança do Mundo altera a matriz da fazenda, introduz novos edifícios, áreas de deposição, perigos ambientais ou oportunidades de automação. A primeira Mudança do Mundo gera o Bloco Dourado de Prestígio, e pesquisas futuras introduzirão novas expansões e transformações inéditas no ecossistema do jogo.',
    exampleCode: '',
    parameters: [],
    returns: undefined,
    usabilityNotes: [
      'As Mudanças do Mundo são eventos cumulativos e permanentes no progresso da sua frota.',
      'Nenhum arquivo de código no editor, inventário ou agente autônomo é perdido quando o mundo se transforma.',
      'Acompanhe os alertas em tela para identificar as novas áreas ou recursos introduzidos por cada transformação.'
    ],
    expectedOutput: 'Transformação do mapa e surgimento de novas estruturas.'
  },
  {
    id: 'mech_prestige_block',
    namespace: 'mechanics',
    methodName: 'Bloco de Prestígio (Prestige Block)',
    displayText: 'Bloco de Prestígio (Prestige Block)',
    signature: 'farm.prestige(recurso, quantidade)',
    pythonSnippet: 'if world.ground() == "PRESTIGE":\n    farm.prestige("fiber", 50)',
    jsSnippet: 'if (world.ground() === "PRESTIGE") {\n  farm.prestige("fiber", 50);\n}',
    description: 'Estrutura metálica dourada gerada na fazenda após a 1ª Mudança do Mundo para entrega de colheitas e ganho de Pontos de Prestígio.',
    techId: 'AUTO_2',
    category: 'Mecânicas de Jogo',
    docDetail: 'O Bloco de Prestígio é a primeira estrutura manifestada através do evento de Mudança do Mundo. Trata-se de um lote metálico dourado que atua como terminal de reciclagem e oferenda. Ao mover seu Agente até esta célula e executar farm.prestige(), os recursos colhidos são convertidos em Pontos de Prestígio. Elevar o Nível de Prestígio desbloqueia multiplicadores passivos permanentes de velocidade de cultivo e rendimento de colheita.',
    exampleCode: 'if world.ground() == "PRESTIGE":\n    farm.prestige("wood", 100)',
    parameters: [
      {
        name: 'resource',
        type: 'string',
        description: 'Identificador do recurso a ser entregue.',
        required: true,
        allowedValues: ['"fiber"', '"wood"', '"roots"', '"fruits"', '"energy"', '"biomass"', '"crystals"']
      },
      {
        name: 'amount',
        type: 'number',
        description: 'Quantidade de unidades do recurso a entregar.',
        required: true
      }
    ],
    returns: {
      type: 'boolean',
      description: 'Retorna true se a entrega foi aceita e convertida em pontos de prestígio.'
    },
    usabilityNotes: [
      'Programe robôs autônomos dedicados à logística para transportar materiais até o Bloco de Prestígio continuamente.',
      'Consulte world.ground() == "PRESTIGE" para detectar a célula de prestígio dinamicamente no seu código.'
    ],
    expectedOutput: 'Recursos consumidos e Pontos de Prestígio concedidos.'
  },
  {
    id: 'mech_scale_expansion',
    namespace: 'mechanics',
    methodName: 'Expansão de Terreno & Frotas (Scale)',
    displayText: 'Expansão de Terreno & Naves Agentes',
    signature: 'Aumento da Matriz Agrícola e Desbloqueio de Múltiplas Naves',
    pythonSnippet: '',
    jsSnippet: '',
    description: 'Expanda o tamanho da matriz agrícola da fazenda e libere novas naves robóticas autônomas para executar scripts em paralelo.',
    techId: 'SCALE_1',
    category: 'Mecânicas de Jogo',
    docDetail: 'Conforme novas tecnologias do ramo de Escala (SCALE) são pesquisadas na Árvore de Pesquisa, a dimensão da matriz da fazenda é ampliada dinamicamente (variando de 1x1 até 12x12). Além disso, pesquisas como "Segundo Agente" e "Terceiro Agente" liberam novas naves autônomas na frota (Gepeto, Gemilson), permitindo execução concorrente de múltiplos arquivos Python/JavaScript em paralelo.',
    exampleCode: '',
    parameters: [],
    returns: undefined,
    usabilityNotes: [
      'Naves adicionais possuem arquivos de código próprios atrelados no editor de código.',
      'Utilize IPC (Comunicação Inter-Agentes) para coordenar o envio de mensagens e sincronizar tarefas entre as naves.'
    ],
    expectedOutput: 'Matriz expandida e novas naves operacionais.'
  }
];

export function isTechUnlocked(techId: string, techTree: TechNode[]): boolean {
  const node = techTree.find(n => n.id === techId);
  return node ? node.unlocked : false;
}

export function getUnlockedApiCatalog(techTree: TechNode[]): ApiItem[] {
  return API_CATALOG.filter(item => isTechUnlocked(item.techId, techTree));
}

export function getTechForApiItem(techId: string, techTree: TechNode[]): TechNode | undefined {
  return techTree.find(n => n.id === techId);
}

/**
 * Resolve o ApiItem correspondente para uma pesquisa ou identificador de documento.
 * Permite navegação direta do "Ver no Guia" para a página exata da documentação.
 */
export function getPrimaryApiItemForTech(techIdOrItemId: string): ApiItem | undefined {
  if (!techIdOrItemId) return undefined;

  // 1. Tentar correspondência exata por ID do ApiItem (ex: 'farm_harvest', 'syntax_loops')
  const exactItem = API_CATALOG.find(item => item.id === techIdOrItemId);
  if (exactItem) return exactItem;

  // 2. Tentar correspondência por techId (ex: 'AUTO_3', 'AGRO_2', 'SYS_4')
  const matchTech = API_CATALOG.find(item => item.techId === techIdOrItemId);
  if (matchTech) return matchTech;

  // 3. Fallbacks inteligentes por prefixo de família tecnológica
  if (techIdOrItemId.startsWith('SCALE_')) {
    return API_CATALOG.find(item => item.id === 'mech_scale_expansion') || API_CATALOG.find(item => item.id === 'mech_world_change');
  }
  if (techIdOrItemId.startsWith('AGRO_')) {
    return API_CATALOG.find(item => item.techId === 'AGRO_1');
  }
  if (techIdOrItemId.startsWith('AUTO_')) {
    return API_CATALOG.find(item => item.techId === 'AUTO_1');
  }
  if (techIdOrItemId.startsWith('SYS_')) {
    return API_CATALOG.find(item => item.techId === 'SYS_1');
  }

  return API_CATALOG[0];
}
