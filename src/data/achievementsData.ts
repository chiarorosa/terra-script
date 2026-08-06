import { Achievement } from '../types/game';

export function getInitialAchievements(): Achievement[] {
  return [
    // 1. UI UNLOCKS
    {
      id: 'ui_first_code',
      title: 'Primeiro Código Executado',
      description: 'Executou seu primeiro script Python ou JavaScript no Agente Principal.',
      category: 'UI_UNLOCK',
      icon: 'Code2',
      unlocked: false,
      expReward: 100,
      rewardText: 'Desbloqueia a criação de arquivos (+) e a pasta /fazenda.',
      hint: 'Edite um script e clique no botão ▶ Run (F5) para executar.'
    },
    {
      id: 'ui_land_expand',
      title: 'Expansão Espacial',
      description: 'Expandiu a matriz de terreno da fazenda para 3x1 ou maior.',
      category: 'UI_UNLOCK',
      icon: 'Boxes',
      unlocked: false,
      expReward: 300,
      rewardText: 'Ativa a barra de Referência da API (farm.*) no rodapé da IDE.',
      hint: 'Pesquise a tecnologia de Expansão de Terreno (SCALE_2) na Árvore de Pesquisas.'
    },
    {
      id: 'ui_prestige_level',
      title: 'Salto Dimensional',
      description: 'Alcançou o Nível 2 de Prestígio ou realizou a primeira Troca de Mundo.',
      category: 'UI_UNLOCK',
      icon: 'Zap',
      unlocked: false,
      expReward: 500,
      rewardText: 'Desbloqueia a Barra de Prestígio e o indicador de nível no topo.',
      hint: 'Acumule experiência na matriz de prestígio ou complete a primeira Troca de Mundo.'
    },
    {
      id: 'ui_fleet_tab',
      title: 'Comandante de Frota',
      description: 'Desbloqueou o segundo Agente Robótico (Gepeto) na pesquisa de Escala.',
      category: 'UI_UNLOCK',
      icon: 'Bot',
      unlocked: false,
      expReward: 1000,
      rewardText: 'Desbloqueia a Aba de Gestão de Agentes na barra superior.',
      hint: 'Pesquise a tecnologia Frota de Agentes II (SCALE_5) na Árvore de Pesquisas.'
    },

    // 2. MECHANIC UNLOCKS
    {
      id: 'mech_first_harvest',
      title: 'Primeira Colheita',
      description: 'Colheu com sucesso o primeiro recurso agrícola usando a API de colheita.',
      category: 'MECHANIC',
      icon: 'Sparkles',
      unlocked: false,
      expReward: 150,
      rewardText: 'Troféu comemorativo da primeira colheita.',
      hint: 'Execute o comando farm.harvest() posicionado sobre uma planta pronta.'
    },
    {
      id: 'mech_irrigation',
      title: 'Mestre da Irrigação',
      description: 'Regou pelo menos 10 terrenos usando o comando farm.water().',
      category: 'MECHANIC',
      icon: 'Droplets',
      unlocked: false,
      expReward: 200,
      rewardText: 'Insígnia de Mestre da Irrigação.',
      hint: 'Programe seu agente para executar farm.water() nos canteiros da fazenda.',
      progress: { current: 0, max: 10, unit: 'solos regados' }
    },
    {
      id: 'mech_tilled_field',
      title: 'Agrônomo Dedicado',
      description: 'Aratou a terra 15 vezes para preparar o solo com farm.till().',
      category: 'MECHANIC',
      icon: 'Shovel',
      unlocked: false,
      expReward: 250,
      rewardText: 'Insígnia de Agrônomo Dedicado.',
      hint: 'Programe o robô para preparar terrenos com o comando farm.till().',
      progress: { current: 0, max: 15, unit: 'solos arados' }
    },
    {
      id: 'mech_tech_pioneer',
      title: 'Cientista da Fazenda',
      description: 'Desbloqueou 3 tecnologias na Árvore de Pesquisas.',
      category: 'MECHANIC',
      icon: 'FlaskConical',
      unlocked: false,
      expReward: 600,
      rewardText: 'Insígnia de Cientista da Fazenda.',
      hint: 'Junte Fibras e Madeiras e desbloqueie pesquisas na aba Pesquisas.',
      progress: { current: 0, max: 3, unit: 'tecnologias' }
    },

    // 3. STATS ACHIEVEMENTS
    {
      id: 'stat_fiber_100',
      title: 'Colecionador de Fibras',
      description: 'Acumulou 100 Fibras Selvagens colhidas pelos seus Agentes.',
      category: 'STATS',
      icon: 'Award',
      unlocked: false,
      expReward: 400,
      rewardText: 'Insígnia de Colecionador de Fibras.',
      hint: 'Mantenha seus agentes colhendo plantas na fazenda.',
      progress: { current: 0, max: 100, unit: 'Fibras' }
    },
    {
      id: 'stat_wood_250',
      title: 'Mestre das Madeiras',
      description: 'Acumulou 250 Madeiras de Arbustos Leñosos.',
      category: 'STATS',
      icon: 'TreeTrunk',
      unlocked: false,
      expReward: 1200,
      rewardText: 'Insígnia de Mestre das Madeiras.',
      hint: 'Cultive e colha arbustos de madeira.',
      progress: { current: 0, max: 250, unit: 'Madeiras' }
    },
    {
      id: 'stat_steps_500',
      title: 'Maratonista Agrícola',
      description: 'Seus Agentes percorreram mais de 500 passos no terreno.',
      category: 'STATS',
      icon: 'Footprints',
      unlocked: false,
      expReward: 800,
      rewardText: 'Insígnia de Maratonista Agrícola.',
      hint: 'Mantenha scripts de movimentação rodando.',
      progress: { current: 0, max: 500, unit: 'passos' }
    },
    {
      id: 'stat_actions_1000',
      title: 'Automação em Massa',
      description: 'Concluiu mais de 1.000 ações robóticas executadas pelo simulador.',
      category: 'STATS',
      icon: 'Cpu',
      unlocked: false,
      expReward: 2000,
      rewardText: 'Insígnia de Automação em Massa.',
      hint: 'Execute scripts complexos em malhas e laços de repetição.',
      progress: { current: 0, max: 1000, unit: 'ações' }
    },
    {
      id: 'stat_prestige_10',
      title: 'Mestre da Galáxia',
      description: 'Alcançou o Nível 10 de Prestígio na Estação Agro-Planetária.',
      category: 'STATS',
      icon: 'Trophy',
      unlocked: false,
      expReward: 5000,
      rewardText: 'Insígnia de Mestre da Galáxia.',
      hint: 'Realize trocas de mundo e acumule pontos de experiência.',
      progress: { current: 1, max: 10, unit: 'Nível' }
    },

    // 4. SPECIAL
    {
      id: 'spec_clean_code',
      title: 'Engenheiro Limpo',
      description: 'Executou 200 ticks contínuos sem disparar nenhum erro de código.',
      category: 'SPECIAL',
      icon: 'ShieldCheck',
      unlocked: false,
      expReward: 3000,
      rewardText: 'Insígnia de Engenheiro Senior de Software.',
      hint: 'Escreva rotinas seguras e sem erros nos loops de execução.',
      progress: { current: 0, max: 200, unit: 'ticks sem erros' }
    }
  ];
}
