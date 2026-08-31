export type AutomatonType = 'DFA' | 'NFA' | 'ENFA' | 'REGEX';

export type ToolType = 
  | 'select'
  | 'add-state'
  | 'add-transition'
  | 'set-start'
  | 'toggle-accepting'
  | 'delete';

export interface AutomatonState {
  id: string;
  name: string;
  isStart: boolean;
  isAccepting: boolean;
  x: number;
  y: number;
  vx?: number; // physics velocity X
  vy?: number; // physics velocity Y
}

export interface AutomatonTransition {
  id: string;
  from: string; // State ID
  to: string;   // State ID
  symbols: string[]; // e.g. ['0', '1'] or ['a', 'ε']
}

export interface AutomatonJSON {
  type: AutomatonType;
  states: {
    id: string;
    name: string;
    isStart?: boolean;
    isAccepting?: boolean;
    x?: number;
    y?: number;
  }[];
  transitions: {
    id?: string;
    from: string; // state id or state name
    to: string;   // state id or state name
    symbols: string[] | string;
  }[];
  startState?: string | null;
  acceptingStates?: string[];
  metadata?: {
    name?: string;
    description?: string;
    createdAt?: string;
    version?: string;
  };
}

export interface AutomatonValidationResult {
  isValid: boolean;
  alphabet: string[];
  errors: string[];
  warnings: string[];
  isDeterministic: boolean;
  stateCount: number;
  transitionCount: number;
  startState: string | null;
  acceptingStates: string[];
  unreachableStates: string[];
  deadStates: string[];
}

export interface SelectedElement {
  type: 'state' | 'transition';
  id: string;
}

export type ThemeMode = 'dark' | 'light';

export type BackgroundTheme = 'nebula' | 'midnight' | 'graph' | 'minimal';

export interface CanvasSettings {
  showGrid: boolean;
  showParticles: boolean;
  showFlowField: boolean;
  physicsEnabled: boolean;
  magnetEnabled: boolean;
  backgroundTheme: BackgroundTheme;
  reducedMotion: boolean;
}

export interface AlignmentGuide {
  type: 'horizontal' | 'vertical';
  coordinate: number; // canvas X or Y
  start: number;
  end: number;
}

export interface SimulationState {
  isRunning: boolean;
  inputString: string;
  currentIndex: number;
  currentStateIds: string[];
  traversedTransitionId: string | null;
  status: 'idle' | 'running' | 'accepted' | 'rejected';
  history: {
    stateIds: string[];
    char: string;
    transitionId: string | null;
  }[];
}

export type NavigationPage = 'home' | 'editor' | 'practice' | 'learn';
