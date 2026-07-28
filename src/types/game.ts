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
  | 'FOSSIL_TRAIL';

export type GroundType = 'NATURAL' | 'SOIL' | 'TILLED' | 'IRRIGATED' | 'SOAKED';

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
  fossils: number;
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
  tailLength?: number; // For fossil trail snake challenge
  tailCoords?: Array<{ x: number; y: number }>;
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

export interface ProfilerMetrics {
  ticksExecuted: number;
  actionsPerformed: number;
  idleTicks: number;
  opsPerSecond: number;
  throughputPerTile: number;
  activeAgentsCount: number;
}

export type ExecutionMode = 'IDLE' | 'RUNNING' | 'PAUSED' | 'STEPPING';

export interface AgentMessage {
  id: string;
  fromAgentId: number;
  toAgentId: number;
  payload: any;
  tickSent: number;
}
