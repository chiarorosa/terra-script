export interface ChangelogRelease {
  version: string;
  date: string;
  title: string;
  changes: string[];
  isCurrent?: boolean;
}

export const CHANGELOG_HISTORY: ChangelogRelease[] = [
  {
    version: 'v2.0.2',
    date: '2026-07-28',
    title: 'Mecânicas de Evaporação, Consumo de Umidade e Reversão de Solo',
    isCurrent: true,
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
