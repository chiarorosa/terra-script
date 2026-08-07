export interface ChangelogRelease {
  version: string;
  date: string;
  title: string;
  changes: string[];
  isCurrent?: boolean;
}

export const CHANGELOG_HISTORY: ChangelogRelease[] = [
  {
    version: 'v2.8.3',
    date: '2026-08-07',
    title: 'Ajuste de Interface: Centralização do Reset Total na Aba Nuvem',
    isCurrent: true,
    changes: [
      'Remoção do Botão Duplicado de Reset Total: A funcionalidade "Começar do Zero" foi removida da aba de Saves Locais para evitar redundância na interface, permanecendo exclusivamente na aba de Saves na Nuvem.',
      'Sincronização da Engine de Jogo: Atualização do cliente para a versão v2.8.3 do TerraScript.'
    ]
  },
  {
    version: 'v2.8.2',
    date: '2026-08-07',
    title: 'Sistema de Resgate de Códigos (Redeem Codes) & Reorganização do Menu da Nuvem',
    isCurrent: false,
    changes: [
      'Sistema de Resgate de Códigos Promocionais (Redeem Codes): Implementada a funcionalidade para resgate de códigos de presentes na aba de Saves na Nuvem, permitindo que os jogadores recebam pacotes de recursos e experiência de prestígio.',
      'Mapeamento Unificado de Reinício do Jogo: A opção "Começar do Zero" (Reset Total) foi movida para o menu da Nuvem e aprimorada para realizar um reinício completo e limpo de todas as informações salvas no navegador.',
      'Atualização da Engine de Jogo: Sincronização automática para a nova versão v2.8.2 do motor do TerraScript.'
    ]
  },
  {
    version: 'v2.8.1',
    date: '2026-08-07',
    title: 'Sincronização Obrigatória de Versão da Engine (Auto Engine Reload & Safe Cloud Saves)',
    isCurrent: false,
    changes: [
      'Controle e Sincronização de Versão: Sincronização automática entre o cliente local do jogo e o servidor online para garantir que todos estejam executando o motor do jogo atualizado.',
      'Proteção e Bloqueio de Saves Incompatíveis: Caso o jogador esteja rodando uma versão do cliente desatualizada em relação ao servidor, o salvamento na nuvem é interrompido para proteger a integridade dos dados de progresso.',
      'Recarregamento em Segundo Plano sem Quebrar Jogabilidade Offline: O processo de verificação roda de forma transparente em segundo plano. Se houver conexão com a internet e uma nova versão estiver disponível, o navegador atualiza automaticamente. Em modo offline, o jogador continua jogando normalmente.',
      'Rebalanciamento de XP do Bloco de Prestígio: Ajuste do Valor Base do Upload de Frutas (80 XP), Energia (200 XP) e Biomassa (350 XP), e introdução de uma 2ª curva de experiência acima do Nível 70 (+15% de XP por nível).'
    ]
  },
  {
    version: 'v2.8.0',
    date: '2026-08-06',
    title: 'Novo Sistema e Menu de Conquistas (Achievements Engine & UI)',
    isCurrent: false,
    changes: [
      'Novo Menu de Conquistas (Achievements UI): Substituição e expansão da antiga estrutura rígida de Marcos (Milestones) por um Menu de Conquistas completo, dinâmico e expansível.',
      'Desbloqueios de Interface e Mecânicas: Conquistas divididas em categorias estratégicas (Interface, Mecânicas de Jogo, Estatísticas de Progresso e Ações Especiais/Segredos).',
      'Indícios de Progressão e Metas Claras: Listagem não-linear com barras de progresso visual, recompensas de desbloqueio de UI e dicas de conquistas a serem alcançadas.',
      'Sincronização com Garantia Zero Bugs (Migração Transparente): Compatibilidade total com dados de versões anteriores, convertendo automaticamente o progresso histórico para a nova matriz de conquistas sem perda de dados.',
      'Notificações Toast de Conquista Desbloqueada: Efeito sonoro retro e notificação visual imediata ao completar qualquer conquista durante o gameplay.'
    ]
  },
  {
    version: 'v2.7.2',
    date: '2026-08-06',
    title: 'Escalonamento de Experiência de Prestígio 50+',
    isCurrent: false,
    changes: [
      'Aumento da Curva de XP de Prestígio (Nível 50+): A quantidade de pontos de experiência necessários para avançar a partir do Nível 50 passa a contar com um escalonamento exponencial mais rigoroso (fator de escala progressivo a cada nível acima do 50).',
      'Atualização na documentação do Guia farm.prestige e Bloco de Prestígio refletindo a nova curva de experiência de níveis altos.'
    ]
  },
  {
    version: 'v2.7.1',
    date: '2026-08-06',
    title: 'Progressão do Prestígio & Tabela de Pontos Base no Guia farm.prestige',
    isCurrent: false,
    changes: [
      'Rebalanceamento de Progressão do Prestígio: Aplicação de penalidades graduais de metade do valor (0.5x) para recursos no Upload do Bloco de Prestígio conforme o Nível de Prestígio avança (>nv25: fibra; >nv50: madeira e raízes + anteriores; >nv60: frutas + anteriores; >nv70: energia + anteriores; >nv80: biomassa + anteriores).',
      'Documentação Detalhada no Guia farm.prestige: Adição da tabela completa de Pontos Base por recurso (Fibra: 1, Madeira: 5, Raízes: 25, Frutas: 100, Energia: 500, Biomassa: 2000) e explicação da curva de atenuação por nível.'
    ]
  },
  {
    version: 'v2.7.0',
    date: '2026-08-05',
    title: 'Sistema de Leaderboards, Sincronização em Nuvem & Conta Online',
    isCurrent: false,
    changes: [
      'Implementação do sistema de Leaderboards',
      'Migração para sincronização em Nuvem',
      'Criação de Conta Online do jogador'
    ]
  },
  {
    version: 'v2.6.2',
    date: '2026-08-04',
    title: 'Mecanismo Anti-Preguiça Silencioso (Timer 5 Minutos), Limite de 100 Linhas de Código & Ajustes de Interface',
    isCurrent: false,
    changes: [
      'Limite Estrito de 100 Linhas por Script: Trava automática de segurança que impede a execução de scripts com mais de 100 linhas de código. Exibe indicador em tempo real no cabeçalho do editor e alertas educativos no Console.',
      'Mecanismo Anti-Preguiça Interno (5 Minutos Corridos): Execuções contínuas de scripts em laço infinito são limitadas a 5 minutos corridos por agente sem poluir a interface. Ao estourar o tempo, o script é pausado e registra no Console uma mensagem divertida ao jogador.',
      'Ajuste Visual no Guia Rápido: Remoção dos ícones de faísca (sparkles) no botão "Guia Rápido" do Explorador e do ícone de cadeado no selo de Leitura da pasta /guia.',
      'Dica Essencial de Início: Adição do aviso destacado orientando o jogador a consultar a aba GUIA antes de começar nas telas de boas-vindas dos Primeiros Passos.'
    ]
  },
  {
    version: 'v2.6.1',
    date: '2026-08-04',
    title: 'Mecanismo de Pastas no Explorador (/guia e /fazenda), Filtro Discreto de Extensões & Sistema de Integridade',
    isCurrent: false,
    changes: [
      'Estrutura de Pastas no Explorador de Arquivos (/guia e /fazenda): Organização do workspace em duas pastas principais com suporte a clique para maximizar e minimizar o conteúdo. Sugestão enviada por @jeronimofeijo.',
      'Diretório /guia (Somente Leitura): Contém todos os scripts padrão e guias de início do jogo protegidos contra exclusão e renomeação para preservar os exemplos.',
      'Diretório /fazenda (Espaço do Jogador): Todos os novos arquivos criados ou importados são salvos automaticamente em /fazenda, com suporte completo a criação, renomeação, exclusão e alteração de arquivo principal.',
      'Escopo do Botão Restaurar Arquivos: O botão de restauração do explorador agora restaura exclusivamente os arquivos da pasta /guia, preservando todos os scripts criados pelo jogador na pasta /fazenda.',
      'Barra de Filtro Discreto de Extensões: Localizada no pé do Explorador de Arquivos, permite alternar a exibição de linguagens (.PY, .JS, etc.) sem a necessidade de excluir scripts do jogo.',
      'Sistema de Integridade do Jogo: Proteções internas para garantir a estabilidade do ambiente e a integridade do progresso.'
    ]
  },
  {
    version: 'v2.6.0',
    date: '2026-08-03',
    title: 'Trilha Sonora Original 16-Bit Zero-Click & Redesign Visual Pixel Art Retro UI',
    isCurrent: false,
    changes: [
      'Trilha Sonora Original "TerraScript: Vale da Automação": Composição e síntese procedural 100% autoral em 4 compassos cativantes (~107 BPM), combinando melodia flautada 16-bit (Sine/Triangle blend), linha de baixo aveludada NES/SNES e percussão chiptune leve.',
      'Sistema de Áudio Zero-Click (Fim dos Estalos): Implementação de rampas de envelope de amplitude ultra-suaves (attack de 15ms e release de 35ms), buffer de ruído rosa pré-gerado e canal de saída com filtro Lowpass Global (2200Hz, Q=0.7) eliminando qualquer ruído ou estalo de frequências e cortes de DC Offset.',
      'Redesign Geral de Interface Pixel Art 8-Bit: Toda a interface do jogo (cabeçalho, modais, painéis laterais e barra inferior) foi adaptada para o estilo Pixel Art com bordas biseladas dithered/stepped, cantos retos sem arredondamento e sombras projetadas em pixels.',
      'Tipografia Arcade e Fontes Pixeladas: Integração das fontes de estilo arcade "Press Start 2P" para títulos e badges, "Pixelify Sans" para botões/cabeçalhos e "VT323" para contadores e status.',
      'Botões e Modais Retro Reativos: Todos os botões e painéis foram remodelados com efeitos táteis 3D de relevo estilo botão de fliperama e cores vibrantes (Ouro, Verde Cibernético, Ciano e Violeta).',
      'Insignia e Selo de Versão v2.6.0: Atualização dos marcadores de versão no cabeçalho e modais para a versão v2.6.0 (Pixel Art UI).',
      'Ponto de Restauração (Git Checkpoint): Criação de checkpoint completo da versão v2.5.0 no repositório do projeto antes do lançamento da v2.6.0.'
    ]
  },
  {
    version: 'v2.5.1',
    date: '2026-08-03',
    title: 'Rebalanceamento de Colheitas, Exigências de Solo e Reestruturação da Árvore de Pesquisas',
    isCurrent: false,
    changes: [
      'Transições Mutuamente Exclusivas de Solo: farm.water() converte solo Arado (TILLED) em IRRIGATED (elevação da umidade a 100%), enquanto farm.till() cancela a irrigação convertendo solo Irrigado (IRRIGATED) em TILLED.',
      'Crescimento Restrito a Solo Arado (TILLED): Raízes Cultivadas (CULTIVATED_ROOT) e Árvores Nobres (TREE) agora exigem EXCLUSIVAMENTE Solo Arado para crescer (taxa de crescimento zerada em solos NATURAL ou IRRIGATED). Estratégia recomendada: irrigue primeiro para elevar a umidade e are em seguida.',
      'Rebalanceamento e Sinergias de Colheita: Grama Selvagem (+1 Fibra), Arbusto (+1 Madeira), Raízes (+2 Raízes), Árvores (+5 Madeira em xadrez / +2 com vizinho), Colônias de Frutas (+4 Frutas base +2 por vizinho maduro, até 12 Frutas por lote) e Flores de Energia (+1 a +9 Energia com oscilação contínua medida via world.measure()).',
      'Rebalanceamento Completo da Árvore de Pesquisas: Reajuste progressivo dos custos de desbloqueio em todas as ramificações (Automação, Agronomia, Sistemas e Escala), estendendo a vida útil do gameplay e valorizando a automação de recursos avançados.',
      'Atualização Abrangente da Wiki de API & Guia de Jogo: Documentação atualizada para farm.water(), farm.till(), farm.plant() e guias de mecânicas de solo (mech_soil_water) e crescimento de culturas (mech_crop_growth).'
    ]
  },
  {
    version: 'v2.5.0',
    date: '2026-07-31',
    title: 'Redesign Motor 3D Pixel Art & Ativos Voxel Procedurais (Nave, Terrenos, Solos e Culturas)',
    isCurrent: false,
    changes: [
      'Renderizador Pixelated 3D Postprocessing: Integração nativa do RenderPixelatedPass com alternância instantânea entre Pixel 3D e 3D Nativo, controle de tamanho de pixel (2p, 3p, 4p, 6p) e shader de contorno estilizado.',
      'Texturização Procedural em Pixel Art (Texturas Canvas 32x32 com NearestFilter): Cada tipo de solo possui textura exclusiva desenhada via código com dithering, grãos minerais e padrões de textura pixel-art.',
      'Detalhamento de Solos e Terrenos Trabalhados: NATURAL com gramado denso e tufos em relevo; SOIL com terra arada e pedriscos; TILLED com sulcos de aração em relevo roxo/escuro; IRRIGATED com brilho de umidade cyan e gotas; SOAKED com poça alagada e efeito de ondulação; PRESTIGE com placa dourada e circuitos cibernéticos de LED.',
      'Estrutura de Blocos Voxel com Estratigrafia Lateral: Os blocos de solo possuem paredes laterais com camadas geológicas (camada superior de cultivo, subsolo de rocha dithered e leito rochoso).',
      'Redesign Completo de Culturas em Voxel 3D: FIBRA SILVESTRE com feixes de espigas douradas e palha detalhada; ARBUSTO MADEIRÁVEL com blocos de folhagem sobrepostos e bagas coloridas; ÁRVORE com tronco robusto e copa de pinheiro em camadas com sombra pixelada; RAIZ CULTIVADA com tubérculos salientes da terra; COLÔNIA DE FRUTAS com arbusto pontilhado por cristais rubi; FLOR DE ENERGIA cibernética com núcleo flutuante reluzente; PLANTA GRADUADA com espiral de DNA bioluminescente; CRISTAL DE PRESTÍGIO dourado flutuante com anel de partículas.',
      'Redesign da Nave Harvest Drone Sci-Fi: Casco metálico multifacetado com painéis pixelados, propulsores duplos de plasma, cúpula de vidro futurista, feixe de escaneamento holográfico e anel levitante com iluminação orbital.',
      'Melhorias de Performance e Animações em Tempo Real: Preservação total do pool de geometrias e materiais, rotação animada de cristais/flores e efeito de pulso flutuante do drone sem causar vazamento de memória ou sobrecarga de draw calls.'
    ]
  },
  {
    version: 'v2.4.1',
    date: '2026-07-31',
    title: 'Sincronização da Árvore de Pesquisas, Atalho do Editor & Barra de Recursos Progressiva',
    isCurrent: false,
    changes: [
      'Sincronização do Executador de Código: Verificações no ambiente de execução garantem que comandos e métodos fiquem bloqueados de acordo com as pesquisas ativas na Árvore de Tecnologias.',
      'Aprimoramento da Documentação Técnica: Atualização dos guias técnicos internos e exemplos para acompanhar as pesquisas.',
      'Execução via Atalho Ctrl/Cmd + Enter: O atalho de teclado executa o arquivo aberto sem inserir quebras de linha no código.',
      'Exibição Progressiva da Barra de Recursos: Recursos e moedas agora aparecem na barra superior no exato instante em que a tecnologia associada é liberada na Árvore de Pesquisas.'
    ]
  },
  {
    version: 'v2.4.0',
    date: '2026-07-31',
    title: 'UI Limpa, Revelação Progressiva & Onboarding Amigável para Iniciantes',
    isCurrent: false,
    changes: [
      'Sistema de Marcos do Jogador (Player Milestones Engine): Nova estrutura dedicada para salvar o progresso de conquistas do jogador (Primeira execução do script, desbloqueio de novo arquivo +, revelação da barra de Prestígio Nível 2 e destaques de onboarding).',
      'Pop-up de Boas-Vindas "Primeiros Passos" com Áudio: Modal em destaque na primeira visita com efeito sonoro alegre, apresentando os 3 passos fundamentais para colocar o primeiro Agente em ação.',
      'Guia Rápido no Explorador (Tema Linear): Card pulsante no topo do Explorador de Arquivos com paleta de cores do Tema Linear (#5e6ad2), permitindo consulta constante aos passos iniciais sem distração.',
      'Desbloqueio Progressivo de Arquivos: A criação de novos scripts (+) e arquivos padrão adicionais permanecem ocultos até que o jogador execute o main.py/main.js pela 1ª vez.',
      'Revelação Progressiva de Prestígio e Interface: A barra de Prestígio superior e a Mudança do Mundo são reveladas automaticamente a partir do Nível 2 de Prestígio, com notificação Toast contextual.',
      'Notificações Toast de Desbloqueio de Pesquisa: Pop-up contextual no canto inferior direito notificando instantaneamente cada pesquisa desbloqueada com atalho direto para a documentação técnica no Guia de API.',
      'Suporte Educativo a Erros de Código (Modo Iniciante): Quando ocorrem erros de sintaxe ou tempo de execução no console, o jogo exibe um card educativo explicando em português claro a causa do erro e como corrigi-lo.',
      'Controle de Preferências de Auxílio: Chave de ativação/desativação do Auxílio Educativo no menu de perfil, no card de erro e no Guia de API.',
      'Ajustes de Nomenclatura e Identidade: Padronização completa do termo "Agente" em toda a interface e mensagens do sistema.'
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
    title: 'Correção de Persistência de Umidade & Validações de Árvore',
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
      'Suporte a varredura e inteligência multi-drone individualizada via identificador de agente DRONE_ID.',
      'Inclusão do script modelo `fazenda_multi_drone.py` no sistema de arquivos virtual.'
    ]
  },
  {
    version: 'v1.1.0',
    date: '2026-07-26',
    title: 'Sistema de Salvamento e Assinatura de Integridade',
    changes: [
      'Exportação e importação de saves com verificação de assinatura de integridade para prevenir corrupções de estado.',
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
