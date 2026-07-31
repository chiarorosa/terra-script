export interface ChangelogRelease {
  version: string;
  date: string;
  title: string;
  changes: string[];
  isCurrent?: boolean;
}

export const CHANGELOG_HISTORY: ChangelogRelease[] = [
  {
    version: 'v2.4.0',
    date: '2026-07-31',
    title: 'UI Limpa, Revelação Progressiva & Onboarding Amigável para Iniciantes',
    isCurrent: true,
    changes: [
      'Revelação Progressiva de Interface (Progressive Disclosure): Elementos avançados da UI (como a barra de Prestígio, aba de Agentes/Frota e indicadores de recursos avançados) iniciam ocultos e são revelados organicamente conforme o jogador desbrava a árvore de tecnologias.',
      'Suporte Educativo a Erros de Código (Modo Iniciante): Quando ocorrem erros de sintaxe ou tempo de execução no console, o jogo exibe um card educativo em roxo explicando em português claro qual foi a causa do erro e como corrigi-lo.',
      'Controle de Preferências de Auxílio: Chave de ativação/desativação do Auxílio Educativo disponível tanto no menu inicial de perfil/tema quanto no próprio card de erro e na aba do Guia.',
      'Guia Rápido de Início no Explorador: Card expansível "Primeiros Passos" no topo do Explorador de Arquivos para orientar o novo jogador nos 3 passos essenciais para colocar o primeiro drone em ação.',
      'Revelação Gradual no Inspetor de Bloco: Propriedades avançadas como Valor de Energia e Nota do Solo no Inspetor 3D permanecem ocultas até o desbloqueio das respectivas culturas graduadas e flores de energia na pesquisa.',
      'Seleção de Código Violeta (#8b5cf6): Destaque de seleção de código atualizado para violeta harmônico em conformidade com a paleta visual do jogo.'
    ]
  },
  {
    version: 'v2.3.1',
    date: '2026-07-31',
    title: 'Reformulação do Guia em Wiki de API Didática & Otimização de UI',
    isCurrent: false,
    changes: [
      'Nova Estrutura do Guia em Formato Wiki de API: Reformulação completa do Guia Técnico para uma documentação no estilo Wiki/API, focada no ensino didático de programação com interface dividida (Navegação + Leitura em Foco).',
      'Navegação e Busca Integrada por Tópicos: Menu lateral com agrupamento por Namespace (farm, world, inventory, syntax, mecânicas) e campo de pesquisa dinâmica com filtros de estado (Todos, Desbloqueados, Bloqueados).',
      'Sete Pilares Didáticos por Entrada da API: Cada método/conceito exibe Descrição Didática, Declaração/Assinatura da Função (Python & JavaScript), Tabela de Parâmetros e Tipos, Valor de Retorno e Saída Esperada, Usabilidade e Casos de Uso Práticos, Exemplo Executável com botão Copiar, e Vínculo com a Árvore de Tecnologias.',
      'Simplificação do Painel Inferior e Câmera: O painel inferior passa a iniciar recolhido por padrão para uma visualização inicial limpa; o modo "Seguir Agente" vem habilitado por padrão; remoção do botão de girar câmera e do ícone redundante na IDE.',
      'Remoção de Selos de Versão Espalhados: Limpeza dos selos e badges de versão espalhados no cabeçalho e modais, concentrando a versão atual e histórico de lançamentos exclusivamente no Painel de Changelog.'
    ]
  },
  {
    version: 'v2.3.0',
    date: '2026-07-30',
    title: 'Motor de Execução Nativo WASM (Pyodide) & Sandbox JavaScript V8 no Navegador',
    isCurrent: false,
    changes: [
      'Integração do Pyodide WebAssembly (Python Nativo): Os scripts em Python agora rodam diretamente através da distribuição WebAssembly oficial do CPython (v0.26.4) carregada no navegador do jogador, garantindo suporte completo às especificações da linguagem.',
      'Suporte Algorítmico Total sem Limitações: Eliminação da necessidade de interpretador hardcoded linha a linha. Suporte completo a algoritmos avançados, estruturas de dados (listas, dicionários, conjuntos), funções nativas (len, range, map, filter, sorted), recursão e laços aninhados.',
      'Sandbox JavaScript V8 Nativo Async: Scripts em JavaScript (.js) são executados em ambiente de escopo assíncrono isolado com suporte a ES6+, métodos de array (map, filter, reduce), sleep(ms) e manipulação de objetos.',
      'Ponte de Comunicação JS/Pyodide de Alta Performance: Conexão direta entre as APIs do jogo (farm, world, inventory) e o runtime do navegador, garantindo direcionamento imediato de comandos de movimento, plantio, colheita e inspeção.',
      'Carregamento Transparente em Segundo Plano: O motor Pyodide WASM é inicializado em segundo plano com suporte a fallback automático, mantendo a inicialização do jogo instantânea e fluida.',
      'Atualização Global da Interface (v2.3.0): Atualização de badges e selos de versão no Cabeçalho (HeaderBar), Tela de Boas-Vindas (WelcomeModal), Guia Técnico (TutorialModal) e Painel Inferior (BottomPanel).'
    ]
  },
  {
    version: 'v2.2.1',
    date: '2026-07-30',
    title: 'Trilha Sonora Lo-Fi Marcante, Interpretador de Sintaxe Estrita & Autocomplete Inteligente',
    isCurrent: false,
    changes: [
      'Nova Trilha Sonora Lo-Fi Oficial ("Tema do Claudio"): Composição procedural icônica e marcante com arranjo de teclados Rhodes (Cmaj9 -> Am9 -> Fmaj7 -> G11), batida de bateria Lo-Fi Hip Hop (Kick, Snare, Hi-Hats), sub-baixo profundo e textura de vinil.',
      'Separação Estrita de Sintaxes (Python vs JavaScript): O interpretador agora valida rigorosamente a linguagem de cada arquivo (.py / .js) e exibe erros de sintaxe claros em português quando comandos de linguagens opostas são utilizados.',
      'Aprimoramento das Estruturas Condicionais (if/elif/else e if/else if/else): Correção do parser de expressões e atualização do Guia do Jogo explicitando que os operadores lógicos (and, or em Python; &&, || em JavaScript) são liberados simultaneamente com a pesquisa de Condicionais (AUTO_3).',
      'Avaliador de Expressões Robusto (Tick Sync): Avaliação precisa de múltiplos operadores lógicos (and, or, &&, ||) e relacionais sem discrepâncias entre leituras de print e avaliação no bloco condicional.',
      'Melhoria do Autocomplete de Código: Sugestões de autocompletar sincronizadas com o arquivo ativo, com extensão de regex mantida para evitar que o menu desapareça ao digitar parâmetros, aspas ou métodos com ponto.'
    ]
  },
  {
    version: 'v2.2.0',
    date: '2026-07-30',
    title: 'Redesign do Jogador: UI/UX Linear, Guia Refatorado & Experiência de Programação',
    isCurrent: false,
    changes: [
      'Novo Design System inspirado no Linear: Interface escura e sóbria de alto contraste com cantos arredondados matemáticos e tipografia técnica.',
      'Remoção de Emojis em Títulos e Modais: Substituição de emojis decorativos por ícones vetoriais do Lucide para uma estética de IDE limpa e profissional.',
      'Reorganização da Aba "Mecânicas": A aba de mecânicas de cultivo foi renomeada para "Mecânicas" e posicionada como a 2ª opção logo após a Matriz de Desbloqueios.',
      'Refatoração da Linguagem e Tom do Guia: Textos do modal de Árvore de Pesquisa, Drones e Guia de API reescritos com foco divertido no contexto de programação de autômatos (compilador da fazenda, threads paralelas, manual técnico de API).',
      'Harmonização de Cores das Ramos Técnicos: Identificação visual consistente para Automação (Cyan), Agronomia (Verde), Sistemas (Roxo) e Escala (Neutro).'
    ]
  },
  {
    version: 'v2.1.0',
    date: '2026-07-28',
    title: 'Grande Atualização: Sistema de Prestígio & Mudança do Mão (World Change)',
    isCurrent: false,
    changes: [
      'Novo Sistema de Prestígio (Nível 1 a 100): Barra de progresso dourada e elegante abaixo dos recursos da fazenda.',
      'Ganho de Pontos de Prestígio via Desbloqueio de Pesquisas: Cada nó desbloqueado na Árvore de Tecnologia concede XP de Prestígio de acordo com sua dificuldade.',
      'Mecânica "Mudança do Mundo" (World Change): Após desbloquear os 4 pilares de Nível 1 (SYS_2, AGRO_2, AUTO_2, SCALE_2), manifesta-se o Bloco Dourado de Prestígio na grade.',
      'Bloco Dourado Sagrado e Indestrutível: Resiste a rotações, troca de lugar e reinicializações de mundo (clear()).',
      'Nova Função API farm.prestige("recurso", qtd): Permite que os drones sobre o Bloco Dourado entreguem recursos para converter em Pontos de Prestígio.',
      'Curva de Progressão Balanceada: Ajustada para uma jornada duradoura até o Nível 100.'
    ]
  },
  {
    version: 'v2.0.5S',
    date: '2026-07-28',
    title: 'Correção de Persistência de Umidade & Guardrails Anti-Exploit',
    isCurrent: false,
    changes: [
      'Adicionado botão "Limpar Console" dedicado na barra de ferramentas e no cabeçalho do painel inferior para limpar logs de saída rapidamente.',
      'Correção definitiva do estado das células (Tiles) no LocalStorage: a umidade atual é mantida intacta ao plantar (sem resetar para 75%).',
      'Validação estrita de pré-requisitos em nós da árvore de tecnologia e sincronização automática de drones desbloqueados.'
    ]
  },
  {
    version: 'v2.0.5',
    date: '2026-07-28',
    title: 'Rastreamento de Drone no Painel de Informações do Bloco (INFO)',
    isCurrent: false,
    changes: [
      'Nova funcionalidade de rastreamento "Seguir ON/OFF" na janela de Informações do Bloco (INFO) do visualizador 3D.',
      'Acompanhamento em tempo real do bloco e estatísticas do solo onde o Drone Principal está localizado.',
      'Alternância minimalista e discreta: verde ativado ("Seguir ON") e apagado/cinza desativado ("Seguir OFF").',
      'Seleção de bloco via clique em qualquer célula do mapa para fixar o inspetor e desativar o rastreamento automático.',
      'Ajuste de persistência de umidade: plantios e colheitas agora preservam a umidade do solo (sem resetar para 75%), impedindo exploits em solos encharcados (SOAKED).'
    ]
  },
  {
    version: 'v2.0.4',
    date: '2026-07-28',
    title: 'Mecânica de Solo Encharcado (SOAKED), Novos Sensores e Guia Atualizado',
    isCurrent: false,
    changes: [
      'Nova Mecânica de Solo Encharcado (SOAKED): regar um bloco com umidade > 95% eleva a umidade a 110%, destrói a cultura atual (NONE) e bloqueia novos plantios.',
      'Evaporação gradual do excesso de umidade até o solo retornar a ≤ 100% (IRRIGATED).',
      'Novos sensores da API world: world.ground(), world.entity() e world.moisture() liberados na pesquisa de Sensores Básicos (SYS_2).',
      'Atribuição e indicação com ícone ⭐ para o Drone Principal com acionamento direto via botão PLAY (►) no Explorador de Arquivos.',
      'Manual e Guia do Jogo inteiramente atualizados com as regras de solo encharcado, novos sensores e atalhos do Drone Principal.'
    ]
  },
  {
    version: 'v2.0.3',
    date: '2026-07-28',
    title: 'Execução Direta no Explorador e Seleção de Drone Principal',
    changes: [
      'Substituição do botão de download individual de arquivo por um botão PLAY (►) direto na lista do Explorador.',
      'Execução forçada instantânea do script selecionado no Drone Principal (Claudio por padrão).',
      'Gerenciador de Drone Principal na aba Drones, permitindo alternar qual drone recebe o acionamento direto do Explorador.',
      'Destaque com ícone ⭐ para o Drone Principal na barra inferior de atribuição de drones.',
      'Mecânica de Solo Encharcado (SOAKED): regar um bloco com umidade > 99% eleva a umidade para 110%, destrói a cultura atual (NONE) e impede novos plantios até a umidade retornar a 100% por evaporação.'
    ]
  },
  {
    version: 'v2.0.2',
    date: '2026-07-28',
    title: 'Mecânicas de Evaporação, Consumo de Umidade e Reversão de Solo',
    changes: [
      'Implementação do consumo gradual de umidade do solo pelas plantas durante o crescimento (-0,3%/tick).',
      'Mecânica de evaporação natural: solos não cultivados com alta umidade (>50%) perdem água gradativamente (-0,1%/tick).',
      'Reversão dinâmica do solo Irrigado (IRRIGATED): quando a umidade do bloco cai para 25% ou menos (por absorção, evaporação ou colheita), o solo reverte automaticamente para o estado Natural (NATURAL).',
      'Inclusão dos detalhes de Evaporação, Consumo de Água e Reversão de Solo no Guia (Aba Mecânicas de Crescimento do Manual).'
    ]
  },
  {
    version: 'v2.0.1',
    date: '2026-07-28',
    title: 'Ajuste de Rebalanceamento e Mecânicas de Umidade',
    changes: [
      'Rebalanceamento global da taxa de crescimento das plantas para aumentar a durabilidade e o desafio do jogo.',
      'Crescimento bloqueado para qualquer cultura em solos com umidade igual ou menor que 25%.',
      'Exigência de umidade igual ou maior que 75% para o crescimento de culturas especiais (Frutas, Flores e Graduadas).',
      'Multiplicador de crescimento baseado em umidade: umidades acima de 50% aceleram o crescimento e abaixo de 50% desaceleram.',
      'Consumo de 25% de umidade do bloco a cada colheita realizada (farm.harvest).',
      'O comando farm.water() foi promovido para o nível inicial (AGRO_1), ficando habilitado por padrão desde o início do jogo.',
      'Correção de regerminação da Fibra Selvagem (WILD_FIBER): agora volta a germinar espontaneamente em qualquer bloco vazio, mesmo se o solo for Irrigado (IRRIGATED).',
      'Inclusão do Guia Detalhado de Culturas, Solos, Umidades e Regras de Adjacência no Manual do Jogo.',
      'Reversão dinâmica do solo Irrigado (IRRIGATED): quando a umidade do bloco cai para 25% ou menos (por colheita ou absorção), o solo deixa de ser IRRIGATED e retorna a NATURAL.',
      'Aba de Changelog integrada ao painel inferior para histórico detalhado de versões.'
    ]
  },
  {
    version: 'v2.0.0',
    date: '2026-07-27',
    title: 'Intérprete Python Otimizado e Suporte Multi-Drone',
    changes: [
      'Suporte expandido a operadores lógicos (and, or, not) e expressões aritméticas compostas no intérprete ScriptRunner.',
      'Suporte a varredura e inteligência multi-drone individualizada via variável DRONE_ID.',
      'Inclusão do script modelo `fazenda_multi_drone.py` no sistema de arquivos virtual.'
    ]
  },
  {
    version: 'v1.1.0',
    date: '2026-07-26',
    title: 'Sistema de Salvamento e Assinatura de Integridade',
    changes: [
      'Exportação e importação de saves com validação HMAC-SHA256 para prevenir corrupções de estado.',
      'Suporte a gerenciamento de arquivos de save em lote na interface.'
    ]
  },
  {
    version: 'v1.0.0',
    date: '2026-07-20',
    title: 'Lançamento Inicial do TerraScript 3D',
    changes: [
      'Ambiente 3D interativo para automação agrícola programável.',
      'Árvore de tecnologias com ramificações de Automação, Agronomia, Sistemas e Escala.',
      'Drones e robôs programáveis com suporte a Python/JS e execuções em lote.'
    ]
  }
];
