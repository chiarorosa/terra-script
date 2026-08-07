export type CropType = 
  | 'NONE'
  | 'WILD_FIBER'
  | 'WOODY_BUSH'
  | 'TREE'
  | 'CULTIVATED_ROOT'
  | 'FRUIT_COLONY'
  | 'ENERGY_FLOWER'
  | 'GRADED_PLANT'
  | 'COMPANION_CROP'
  | 'MAZE_WALL'
  | 'MAZE_CORE'
  | 'PRESTIGE';

export type GroundType = 'NATURAL' | 'SOIL' | 'TILLED' | 'IRRIGATED' | 'SOAKED' | 'PRESTIGE';

export interface PrestigeState {
  level: number; // 1 to 100
  points: number; // current level XP
  totalPoints: number; // cumulative total XP
  worldChangeUnlocked: boolean; // whether World Change has been triggered
  comboMultiplier?: number;
  comboChainActive?: boolean;
  comboStep?: number;
  targetComboTile?: { x: number; y: number } | null;
  targetComboIndex?: number | null;
}

export interface PlayerMilestones {
  quickStartSeen: boolean;            // Has seen Quick Start banner
  quickStartProminentDone: boolean;  // Has experienced the prominent eye-catcher highlight
  firstExecutionDone: boolean;       // Has executed main.py/main.js for the first time
  createFileUnlocked: boolean;       // Has unlocked custom file creation (+) & template scripts
  prestigeUnlocked: boolean;         // Has unlocked Prestige Level >= 2
  apiReferenceUnlocked: boolean;     // Has unlocked API Reference bar by expanding land for the first time
}

export type AchievementCategory = 'UI_UNLOCK' | 'MECHANIC' | 'STATS' | 'SPECIAL';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  rewardText?: string;
  hint?: string;
  secret?: boolean;
  claimed?: boolean;
  expReward?: number;
  progress?: {
    current: number;
    max: number;
    unit?: string;
  };
}

export type Direction = 'NORTH' | 'EAST' | 'SOUTH' | 'WEST';

export interface ResourceMap {
  fiber: number;
  wood: number;
  roots: number;
  fruits: number;
  energy: number;
  biomass: number;
  catalyst: number;
  crystals: number;
}

export interface CompanionRequest {
  targetCrop: CropType;
  targetX: number;
  targetY: number;
  satisfied: boolean;
}

export interface TileState {
  x: number;
  y: number;
  ground: GroundType;
  crop: CropType;
  growth: number; // 0 to 100%
  moisture: number; // 0.0 to 1.0
  grade?: number; // 1 to 9 for GRADED_PLANT
  energyValue?: number; // 1 to 100 for ENERGY_FLOWER
  companionRequest?: CompanionRequest;
  isMazeWall?: boolean;
  isMazeCore?: boolean;
  occupyingAgentId?: number;
}

export interface AgentStats {
  harvestedResources: ResourceMap;
  plantedCount: number;
  harvestedCount: number;
  wateredCount: number;
  tilledCount: number;
  stepsCount: number;
}

export function createDefaultAgentStats(): AgentStats {
  return {
    harvestedResources: {
      fiber: 0,
      wood: 0,
      roots: 0,
      fruits: 0,
      energy: 0,
      biomass: 0,
      catalyst: 0,
      crystals: 0
    },
    plantedCount: 0,
    harvestedCount: 0,
    wateredCount: 0,
    tilledCount: 0,
    stepsCount: 0
  };
}

export interface Agent {
  id: number;
  name: string;
  x: number;
  y: number;
  color: string;
  assignedFile: string;
  status: 'IDLE' | 'RUNNING' | 'PAUSED' | 'ERROR' | 'COMPLETED';
  currentLine: number;
  actionMessage?: string;
  lastActionTick?: number;
  runStartTime?: number;
  tailCoords?: Array<{ x: number; y: number }>;
  stats: AgentStats;
}

export type TechBranch = 'AUTOMATION' | 'AGRONOMY' | 'SYSTEMS' | 'SCALE';

export interface TechNode {
  id: string;
  branch: TechBranch;
  name: string;
  description: string;
  tier: number;
  cost: Partial<ResourceMap>;
  unlocked: boolean;
  requires?: string[];
  unlockCapability?: string; // e.g. 'VAR_LOOPS', 'TREE_CROP', 'WORLD_3X3', 'PRINT_SENSOR', etc.
}

export interface VirtualFile {
  path: string;
  name: string;
  content: string;
  language: 'python' | 'javascript';
  isEntrypoint?: boolean;
  modified?: boolean;
  folder?: 'guia' | 'fazenda' | string;
  readOnly?: boolean;
}

export interface VirtualFolder {
  path: string;
  name: string;
}

export interface ConsoleLog {
  id: string;
  timestamp: string;
  agentId: number;
  type: 'stdout' | 'stderr' | 'system' | 'action';
  message: string;
  line?: number;
  file?: string;
}

export interface Diagnostic {
  file: string;
  line: number;
  column?: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface VariableScope {
  [key: string]: any;
}

export type ExecutionMode = 'IDLE' | 'RUNNING' | 'PAUSED' | 'STEPPING';

export interface AgentMessage {
  id: string;
  fromAgentId: number;
  toAgentId: number;
  payload: any;
  tickSent: number;
}
