export interface ChangelogRelease {
  version: string;
  date: string;
  title: string;
  changes: string[];
  isCurrent?: boolean;
}

export const CHANGELOG_HISTORY: ChangelogRelease[] = [
  {
    version: 'v2.1.0',
    date: '2026-07-28',
    title: 'Grande Atualização: Sistema de Prestígio & Mudança do Mão (World Change)',
    isCurrent: true,
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
