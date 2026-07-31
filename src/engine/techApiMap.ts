import { TechNode } from '../types/game';

export interface ApiItem {
  id: string;
  namespace: 'farm' | 'world' | 'inventory' | 'syntax';
  methodName: string; // e.g. "harvest", "plant", "move"
  displayText: string; // e.g. "farm.harvest()"
  signature: string; // e.g. "farm.harvest(): boolean"
  pythonSnippet: string; // e.g. "farm.harvest()"
  jsSnippet: string; // e.g. "farm.harvest()"
  description: string;
  techId: string; // TechNode ID that unlocks this
  category: 'Farm Commands' | 'World Sensors' | 'Inventory' | 'Language Features';
  docDetail: string; // Explanation for the Guide
  exampleCode: string; // Code snippet for the Guide
}

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
    description: 'Colhe a cultura madura no bloco atual.',
    techId: 'AGRO_1',
    category: 'Farm Commands',
    docDetail: 'Colhe fibra selvagem ou plantas cultivadas quando o crescimento atinge 100%. Adiciona o rendimento diretamente ao inventário.',
    exampleCode: 'if farm.can_harvest():\n    farm.harvest()'
  },
  {
    id: 'farm_can_harvest',
    namespace: 'farm',
    methodName: 'can_harvest',
    displayText: 'farm.can_harvest()',
    signature: 'farm.can_harvest(): boolean',
    pythonSnippet: 'farm.can_harvest()',
    jsSnippet: 'farm.can_harvest()',
    description: 'Retorna true se a cultura do bloco atual estiver totalmente madura (crescimento == 100%).',
    techId: 'AGRO_1',
    category: 'Farm Commands',
    docDetail: 'Verifica o estado de crescimento do bloco sem consumir um tick de ação.',
    exampleCode: 'while True:\n    if farm.can_harvest():\n        farm.harvest()\n    world.move("RIGHT")'
  },
  {
    id: 'farm_prestige',
    namespace: 'farm',
    methodName: 'prestige',
    displayText: 'farm.prestige(recurso, qtd)',
    signature: 'farm.prestige(resource: string, amount: number): boolean',
    pythonSnippet: 'farm.prestige("fiber", 10)',
    jsSnippet: 'farm.prestige("fiber", 10)',
    description: 'Entrega recursos ao Bloco de Prestígio Dourado para ganhar Pontos e subir o Nível de Prestígio (1 a 100).',
    techId: 'AUTO_2',
    category: 'Farm Commands',
    docDetail: 'Disponível após a Mudança do Mundo (World Change) ao desbloquear os 4 nós de Nível 1. O agente deve estar sobre o Bloco Dourado.',
    exampleCode: 'if world.ground() == "PRESTIGE":\n    farm.prestige("fiber", 50)'
  },
  {
    id: 'farm_plant_fiber',
    namespace: 'farm',
    methodName: 'plant("WILD_FIBER")',
    displayText: 'farm.plant("WILD_FIBER")',
    signature: 'farm.plant(cropName: string): boolean',
    pythonSnippet: 'farm.plant("WILD_FIBER")',
    jsSnippet: 'farm.plant("WILD_FIBER")',
    description: 'Planta fibra selvagem no bloco atual.',
    techId: 'AGRO_1',
    category: 'Farm Commands',
    docDetail: 'Comando básico de plantio. A fibra cresce naturalmente em solo natural ou quando semada.',
    exampleCode: 'farm.plant("WILD_FIBER")'
  },
  {
    id: 'farm_plant_bush',
    namespace: 'farm',
    methodName: 'plant("WOODY_BUSH")',
    displayText: 'farm.plant("WOODY_BUSH")',
    signature: 'farm.plant("WOODY_BUSH"): boolean',
    pythonSnippet: 'farm.plant("WOODY_BUSH")',
    jsSnippet: 'farm.plant("WOODY_BUSH")',
    description: 'Planta arbustos de madeira para colher o recurso madeira.',
    techId: 'AGRO_2',
    category: 'Farm Commands',
    docDetail: 'Arbustos produzem madeira ao serem colhidos. A madeira é essencial para pesquisas de nível 2+.',
    exampleCode: 'farm.plant("WOODY_BUSH")'
  },
  {
    id: 'farm_till',
    namespace: 'farm',
    methodName: 'till',
    displayText: 'farm.till()',
    signature: 'farm.till(): boolean',
    pythonSnippet: 'farm.till()',
    jsSnippet: 'farm.till()',
    description: 'Aram o terreno natural em solo fértil.',
    techId: 'AGRO_3',
    category: 'Farm Commands',
    docDetail: 'O solo arado triplica a taxa de crescimento de raízes cultivadas.',
    exampleCode: 'if world.ground() == "NATURAL":\n    farm.till()\nfarm.plant("CULTIVATED_ROOT")'
  },
  {
    id: 'farm_water',
    namespace: 'farm',
    methodName: 'water',
    displayText: 'farm.water()',
    signature: 'farm.water(): boolean',
    pythonSnippet: 'farm.water()',
    jsSnippet: 'farm.water()',
    description: 'Irriga o bloco atual para umidade máxima (100%).',
    techId: 'AGRO_1',
    category: 'Farm Commands',
    docDetail: 'Define o estado do solo do bloco como IRRIGATED e acelera a hidratação da cultura.',
    exampleCode: 'farm.water()'
  },
  {
    id: 'farm_plant_root',
    namespace: 'farm',
    methodName: 'plant("CULTIVATED_ROOT")',
    displayText: 'farm.plant("CULTIVATED_ROOT")',
    signature: 'farm.plant("CULTIVATED_ROOT"): boolean',
    pythonSnippet: 'farm.plant("CULTIVATED_ROOT")',
    jsSnippet: 'farm.plant("CULTIVATED_ROOT")',
    description: 'Planta raízes que prosperam em solo arado.',
    techId: 'AGRO_3',
    category: 'Farm Commands',
    docDetail: 'Gera o recurso raízes, usado para ramos de tecnologia avançada e melhorias de agentes.',
    exampleCode: 'farm.till()\nfarm.plant("CULTIVATED_ROOT")'
  },
  {
    id: 'farm_plant_tree',
    namespace: 'farm',
    methodName: 'plant("TREE")',
    displayText: 'farm.plant("TREE")',
    signature: 'farm.plant("TREE"): boolean',
    pythonSnippet: 'farm.plant("TREE")',
    jsSnippet: 'farm.plant("TREE")',
    description: 'Planta árvores para obtenção de madeira nobre.',
    techId: 'AGRO_4',
    category: 'Farm Commands',
    docDetail: 'Árvores crescem mais rápido quando plantadas em padrão xadrez, sem árvores vizinhas diretas.',
    exampleCode: 'if (world.x() + world.y()) % 2 == 0:\n    farm.plant("TREE")'
  },
  {
    id: 'farm_plant_fruit',
    namespace: 'farm',
    methodName: 'plant("FRUIT_COLONY")',
    displayText: 'farm.plant("FRUIT_COLONY")',
    signature: 'farm.plant("FRUIT_COLONY"): boolean',
    pythonSnippet: 'farm.plant("FRUIT_COLONY")',
    jsSnippet: 'farm.plant("FRUIT_COLONY")',
    description: 'Planta colônias de frutas com recompensas superlineares.',
    techId: 'AGRO_5',
    category: 'Farm Commands',
    docDetail: 'Colônias de frutas maduras conectadas geram recompensas multiplicadas ao serem colhidas.',
    exampleCode: 'farm.plant("FRUIT_COLONY")'
  },
  {
    id: 'farm_plant_flower',
    namespace: 'farm',
    methodName: 'plant("ENERGY_FLOWER")',
    displayText: 'farm.plant("ENERGY_FLOWER")',
    signature: 'farm.plant("ENERGY_FLOWER"): boolean',
    pythonSnippet: 'farm.plant("ENERGY_FLOWER")',
    jsSnippet: 'farm.plant("ENERGY_FLOWER")',
    description: 'Planta flores de energia. Meça o valor com measure() antes de colher.',
    techId: 'AGRO_6',
    category: 'Farm Commands',
    docDetail: 'Use world.measure() para verificar os níveis de energia das flores e colher nos picos.',
    exampleCode: 'farm.plant("ENERGY_FLOWER")\nif world.measure() > 50:\n    farm.harvest()'
  },
  {
    id: 'farm_plant_graded',
    namespace: 'farm',
    methodName: 'plant("GRADED_PLANT")',
    displayText: 'farm.plant("GRADED_PLANT")',
    signature: 'farm.plant("GRADED_PLANT"): boolean',
    pythonSnippet: 'farm.plant("GRADED_PLANT")',
    jsSnippet: 'farm.plant("GRADED_PLANT")',
    description: 'Planta culturas graduadas para ordenação e colheita de biomassa.',
    techId: 'AGRO_7',
    category: 'Farm Commands',
    docDetail: 'Cada planta possui uma nota (1-9). Ordene os blocos usando farm.swap() para recompensas máximas de biomassa.',
    exampleCode: 'farm.plant("GRADED_PLANT")'
  },
  {
    id: 'farm_swap',
    namespace: 'farm',
    methodName: 'swap',
    displayText: 'farm.swap("RIGHT")',
    signature: 'farm.swap(direction: string): boolean',
    pythonSnippet: 'farm.swap("RIGHT")',
    jsSnippet: 'farm.swap("RIGHT")',
    description: 'Troca a planta e sua nota com o bloco vizinho na direção informada.',
    techId: 'AGRO_7',
    category: 'Farm Commands',
    docDetail: 'Permite implementar algoritmos de ordenação como Bubble Sort nas fileiras da fazenda.',
    exampleCode: 'if world.measure() > next_val:\n    farm.swap("RIGHT")'
  },
  {
    id: 'farm_get_companion',
    namespace: 'farm',
    methodName: 'get_companion',
    displayText: 'farm.get_companion()',
    signature: 'farm.get_companion(): object',
    pythonSnippet: 'farm.get_companion()',
    jsSnippet: 'farm.get_companion()',
    description: 'Retorna a solicitação de planta companheira para bônus de produção.',
    techId: 'AGRO_8',
    category: 'Farm Commands',
    docDetail: 'Inspecione os requisitos e coordenadas da cultura alvo para plantio consorciado companheiro.',
    exampleCode: 'req = farm.get_companion()'
  },

  // WORLD APIs
  {
    id: 'world_clear',
    namespace: 'world',
    methodName: 'clear',
    displayText: 'world.clear()',
    signature: 'world.clear(): void',
    pythonSnippet: 'world.clear()',
    jsSnippet: 'world.clear()',
    description: 'Limpa todos os blocos da fazenda e retorna o Agente para (0,0).',
    techId: 'AUTO_1',
    category: 'World Sensors',
    docDetail: 'Remove todas as culturas plantadas e solo arado (retornando ao terreno natural) e reposiciona os Agentes de volta para (0,0). Inventário, pesquisas e arquivos permanecem intocados.',
    exampleCode: 'world.clear()'
  },
  {
    id: 'world_move',
    namespace: 'world',
    methodName: 'move',
    displayText: 'world.move("RIGHT")',
    signature: 'world.move(direction: string): boolean',
    pythonSnippet: 'world.move("RIGHT")',
    jsSnippet: 'world.move("RIGHT")',
    description: 'Move o agente 1 passo ("FORWARD", "BACKWARD", "LEFT", "RIGHT" ou "NORTH", "SOUTH", "WEST", "EAST").',
    techId: 'AUTO_1',
    category: 'World Sensors',
    docDetail: 'Navega o agente na grade. Suporta direções intuitivas ("FORWARD", "BACKWARD", "LEFT", "RIGHT") e cardinais ("NORTH", "SOUTH", "WEST", "EAST"). Retorna true se o movimento foi bem-sucedido.',
    exampleCode: 'world.move("RIGHT")'
  },
  {
    id: 'world_can_move',
    namespace: 'world',
    methodName: 'can_move',
    displayText: 'world.can_move("RIGHT")',
    signature: 'world.can_move(direction: string): boolean',
    pythonSnippet: 'world.can_move("RIGHT")',
    jsSnippet: 'world.can_move("RIGHT")',
    description: 'Verifica se a direção está livre para caminhada (sem paredes de labirinto).',
    techId: 'AUTO_1',
    category: 'World Sensors',
    docDetail: 'Retorna true se a direção estiver aberta para movimentação.',
    exampleCode: 'if world.can_move("FORWARD"):\n    world.move("FORWARD")'
  },
  {
    id: 'world_x',
    namespace: 'world',
    methodName: 'x',
    displayText: 'world.x()',
    signature: 'world.x(): number',
    pythonSnippet: 'world.x()',
    jsSnippet: 'world.x()',
    description: 'Obtém a coordenada X atual do agente (0 até largura-1).',
    techId: 'SYS_2',
    category: 'World Sensors',
    docDetail: 'Retorna a posição horizontal.',
    exampleCode: 'curr_x = world.x()'
  },
  {
    id: 'world_y',
    namespace: 'world',
    methodName: 'y',
    displayText: 'world.y()',
    signature: 'world.y(): number',
    pythonSnippet: 'world.y()',
    jsSnippet: 'world.y()',
    description: 'Obtém a coordenada Y atual do agente (0 até altura-1).',
    techId: 'SYS_2',
    category: 'World Sensors',
    docDetail: 'Retorna a posição vertical.',
    exampleCode: 'curr_y = world.y()'
  },
  {
    id: 'world_width',
    namespace: 'world',
    methodName: 'width',
    displayText: 'world.width()',
    signature: 'world.width(): number',
    pythonSnippet: 'world.width()',
    jsSnippet: 'world.width()',
    description: 'Retorna a largura total da grade.',
    techId: 'SYS_2',
    category: 'World Sensors',
    docDetail: 'Dimensão de largura da grade.',
    exampleCode: 'w = world.width()'
  },
  {
    id: 'world_height',
    namespace: 'world',
    methodName: 'height',
    displayText: 'world.height(): number',
    signature: 'world.height(): number',
    pythonSnippet: 'world.height()',
    jsSnippet: 'world.height()',
    description: 'Retorna a altura total da grade.',
    techId: 'SYS_2',
    category: 'World Sensors',
    docDetail: 'Dimensão de altura da grade.',
    exampleCode: 'h = world.height()'
  },
  {
    id: 'world_ground',
    namespace: 'world',
    methodName: 'ground',
    displayText: 'world.ground()',
    signature: 'world.ground(): string',
    pythonSnippet: 'world.ground()',
    jsSnippet: 'world.ground()',
    description: 'Retorna o estado do solo do bloco ("NATURAL", "SOIL", "TILLED", "IRRIGATED", "SOAKED").',
    techId: 'SYS_2',
    category: 'World Sensors',
    docDetail: 'Inspeciona o tipo de solo sob o agente (NATURAL, SOIL, TILLED, IRRIGATED, SOAKED).',
    exampleCode: 'if world.ground() == "SOAKED":\n    # solo encharcado\n    pass'
  },
  {
    id: 'world_entity',
    namespace: 'world',
    methodName: 'entity',
    displayText: 'world.entity()',
    signature: 'world.entity(): string',
    pythonSnippet: 'world.entity()',
    jsSnippet: 'world.entity()',
    description: 'Retorna a entidade de cultura presente no bloco atual ("NONE", "WILD_FIBER", "CULTIVATED_ROOT", etc.).',
    techId: 'SYS_2',
    category: 'World Sensors',
    docDetail: 'Retorna o nome da espécie da cultura ou "NONE".',
    exampleCode: 'crop = world.entity()'
  },
  {
    id: 'world_moisture',
    namespace: 'world',
    methodName: 'moisture',
    displayText: 'world.moisture()',
    signature: 'world.moisture(): number',
    pythonSnippet: 'world.moisture()',
    jsSnippet: 'world.moisture()',
    description: 'Retorna o nível de umidade do solo do bloco atual (0.0 a 1.10).',
    techId: 'SYS_2',
    category: 'World Sensors',
    docDetail: 'Mede a umidade do solo. Umidade > 0.95 (95%) regada novamente torna o solo encharcado (SOAKED).',
    exampleCode: 'if world.moisture() > 0.95:\n    # atencao: solo perto do limite de encharcar!\n    pass'
  },
  {
    id: 'world_measure',
    namespace: 'world',
    methodName: 'measure',
    displayText: 'world.measure()',
    signature: 'world.measure(): number',
    pythonSnippet: 'world.measure()',
    jsSnippet: 'world.measure()',
    description: 'Meça o valor numérico do bloco (energia / nota da planta / crescimento).',
    techId: 'SYS_3',
    category: 'World Sensors',
    docDetail: 'Usado para otimização de flores de energia e ordenação por grau de plantas.',
    exampleCode: 'val = world.measure()'
  },
  {
    id: 'world_is_maze_core',
    namespace: 'world',
    methodName: 'is_maze_core',
    displayText: 'world.is_maze_core()',
    signature: 'world.is_maze_core(): boolean',
    pythonSnippet: 'world.is_maze_core()',
    jsSnippet: 'world.is_maze_core()',
    description: 'Retorna true se o bloco atual for o núcleo do labirinto de cristal.',
    techId: 'AGRO_8',
    category: 'World Sensors',
    docDetail: 'Detecta o cristal central no desafio do Labirinto Vivo.',
    exampleCode: 'if world.is_maze_core():\n    farm.harvest()'
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
    description: 'Retorna a quantidade atual do recurso especificado no inventário.',
    techId: 'SYS_2',
    category: 'Inventory',
    docDetail: 'Consulta quantidades de recursos ("fiber", "wood", "roots", "fruits", "energy", "biomass", "crystals").',
    exampleCode: 'fiber_cnt = inventory.count("fiber")'
  },

  // LANGUAGE SYNTAX FEATURES
  {
    id: 'syntax_print',
    namespace: 'syntax',
    methodName: 'print',
    displayText: 'print(...) / console.log(...)',
    signature: 'print(msg) / console.log(msg)',
    pythonSnippet: 'print("Hello Farm")',
    jsSnippet: 'console.log("Hello Farm")',
    description: 'Exibe mensagens de log no console stdout.',
    techId: 'SYS_1',
    category: 'Language Features',
    docDetail: 'Saída básica de mensagens no console.',
    exampleCode: 'print("Agente ativo em", world.x(), world.y())'
  },
  {
    id: 'syntax_vars',
    namespace: 'syntax',
    methodName: 'variables',
    displayText: 'Variáveis e Operadores Matemáticos',
    signature: 'x = 10 / let x = 10',
    pythonSnippet: 'counter = counter + 1',
    jsSnippet: 'let counter = counter + 1',
    description: 'Armazenamento de variáveis e aritmética matemática.',
    techId: 'AUTO_2',
    category: 'Language Features',
    docDetail: 'Atribua e manipule variáveis no escopo de execução do script.',
    exampleCode: 'x = world.x()\ny = world.y()'
  },
  {
    id: 'syntax_conditionals',
    namespace: 'syntax',
    methodName: 'conditionals',
    displayText: 'Condicionais & Operadores Lógicos (and/or/&&/||)',
    signature: 'if c1 and c2: ... else: ... | if (c1 && c2) { ... }',
    pythonSnippet: 'if farm.can_harvest() and world.moisture() > 0.5:\n    farm.harvest()',
    jsSnippet: 'if (farm.can_harvest() && world.moisture() > 0.5) {\n  farm.harvest();\n}',
    description: 'Lógica condicional (if/elif/else) e operadores lógicos e/ou (Python: and, or | JS: &&, ||).',
    techId: 'AUTO_3',
    category: 'Language Features',
    docDetail: 'Liberado com AUTO_3. Permite tomar decisões no script combinando múltiplas condições com os operadores lógicos e/ou (Python: and, or | JS: &&, ||).',
    exampleCode: 'if world.ground() == "NATURAL" and world.moisture() < 0.5:\n    farm.till()\n    farm.water()'
  },
  {
    id: 'syntax_loops',
    namespace: 'syntax',
    methodName: 'loops',
    displayText: 'Loops (while / for)',
    signature: 'while condição: ... / for i in range(n): ...',
    pythonSnippet: 'while True:\n    farm.harvest()',
    jsSnippet: 'while (true) {\n  farm.harvest();\n}',
    description: 'Execução de loops contínuos.',
    techId: 'AUTO_4',
    category: 'Language Features',
    docDetail: 'Automatiza algoritmos contínuos de agricultura.',
    exampleCode: 'while True:\n    if farm.can_harvest():\n        farm.harvest()\n    world.move("RIGHT")'
  },
  {
    id: 'syntax_functions',
    namespace: 'syntax',
    methodName: 'functions',
    displayText: 'Funções (def / function)',
    signature: 'def nome(): ... / function nome() { ... }',
    pythonSnippet: 'def harvest_row():\n    for i in range(5):\n        farm.harvest()\n        world.move("RIGHT")',
    jsSnippet: 'function harvestRow() {\n  farm.harvest();\n}',
    description: 'Funções de código reutilizáveis e modulares.',
    techId: 'AUTO_5',
    category: 'Language Features',
    docDetail: 'Agrupa procedimentos reutilizáveis em funções nomeadas.',
    exampleCode: 'def clear_tile():\n    if farm.can_harvest():\n        farm.harvest()\n    farm.till()'
  },
  {
    id: 'syntax_ipc',
    namespace: 'syntax',
    methodName: 'ipc_messages',
    displayText: 'Sinais Inter-Processos (IPC / Transmissão)',
    signature: 'sys.send(agent_id, msg) / sys.receive()',
    pythonSnippet: 'sys.send(2, "HARVEST_READY")\nmsg = sys.receive()',
    jsSnippet: 'sys.send(2, "HARVEST_READY");\nconst msg = sys.receive();',
    description: 'Comunicação e sincronização por mensagens entre agentes em tempo real.',
    techId: 'AUTO_6',
    category: 'Language Features',
    docDetail: 'Permite que múltiplos agentes troquem mensagens, sinais de conclusão e coordenadas em tempo real através de um barramento de mensagens IPC.',
    exampleCode: 'if farm.can_harvest():\n    farm.harvest()\n    sys.send(2, "TASK_COMPLETE")'
  },
  {
    id: 'sys_get_agent_stats',
    namespace: 'syntax',
    methodName: 'get_agent_stats',
    displayText: 'sys.get_agent_stats() / agent.get_stats()',
    signature: 'sys.get_agent_stats(): object',
    pythonSnippet: 'stats = sys.get_agent_stats()\nprint(stats["harvested_count"])',
    jsSnippet: 'const stats = sys.getAgentStats();\nconsole.log(stats.harvested_count);',
    description: 'Acessa o dicionário chave-valor com métricas e estatísticas individuais do agente.',
    techId: 'SYS_4',
    category: 'Language Features',
    docDetail: 'Retorna um dicionário/objeto contendo contadores de ações (planted_count, harvested_count, watered_count, tilled_count, steps_count) e recursos coletados individualmente por este agente (harvested_fiber, harvested_wood, etc.).',
    exampleCode: 'stats = sys.get_agent_stats()\nprint("Plantou:", stats["planted_count"])\nprint("Colheu:", stats["harvested_count"])\nprint("Passos:", stats["steps_count"])'
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
