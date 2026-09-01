import { create } from 'zustand';
import type { 
  AutomatonState, 
  AutomatonTransition, 
  AutomatonType, 
  ToolType, 
  SelectedElement, 
  ThemeMode,
  NavigationPage,
  CanvasSettings,
  BackgroundTheme,
  AlignmentGuide,
  SimulationState
} from '../types/automata';
import { saveAutomatonToStorage, loadAutomatonFromStorage, autoSaveState, loadAutoSaveState } from '../engine/storage';
import { importAutomatonFromJSON } from '../engine/serializer';
import { AUTOMATA_PRESETS } from '../engine/presets';
import { initSimulation, stepSimulation } from '../engine/simulation';

export interface HistorySnapshot {
  states: AutomatonState[];
  transitions: AutomatonTransition[];
  automatonType: AutomatonType;
  startStateId: string | null;
  acceptingStateIds: string[];
  stateCounter: number;
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface AutomataStoreState {
  // Navigation & theme
  activePage: NavigationPage;
  theme: ThemeMode;
  
  // Canvas Visual & Physics Settings
  canvasSettings: CanvasSettings;
  activeAlignmentGuides: AlignmentGuide[];
  draggedNodeId: string | null;

  // Simulation
  simulationState: SimulationState | null;

  // Automaton core data
  states: AutomatonState[];
  transitions: AutomatonTransition[];
  automatonType: AutomatonType;
  startStateId: string | null;
  acceptingStateIds: string[];
  stateCounter: number;

  // UI / Editor interaction state
  activeTool: ToolType;
  selectedElement: SelectedElement | null;
  transitionSourceId: string | null; // For 2-step transition creation tool
  toast: ToastNotification | null;

  // History stack
  past: HistorySnapshot[];
  future: HistorySnapshot[];

  // Actions
  setActivePage: (page: NavigationPage) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setCanvasSettings: (settings: Partial<CanvasSettings>) => void;
  toggleCanvasSetting: (key: keyof CanvasSettings) => void;
  setBackgroundTheme: (theme: BackgroundTheme) => void;
  setAlignmentGuides: (guides: AlignmentGuide[]) => void;
  setDraggedNodeId: (id: string | null) => void;
  setActiveTool: (tool: ToolType) => void;
  setSelectedElement: (element: SelectedElement | null) => void;
  setTransitionSourceId: (id: string | null) => void;
  setAutomatonType: (type: AutomatonType) => void;

  // Simulation Actions
  startSimulation: (inputString: string) => void;
  stepSimulationForward: () => void;
  resetSimulation: () => void;

  // Automata manipulations
  addState: (x: number, y: number, customName?: string) => AutomatonState;
  updateState: (id: string, updates: Partial<AutomatonState>) => void;
  updateStatePosition: (id: string, x: number, y: number) => void;
  setStatesBatch: (states: AutomatonState[]) => void;
  renameState: (id: string, newName: string) => void;
  toggleStartState: (id: string) => void;
  toggleAcceptingState: (id: string) => void;
  deleteState: (id: string) => void;

  addTransition: (from: string, to: string, symbols?: string[]) => AutomatonTransition | null;
  updateTransitionSymbols: (id: string, symbols: string[]) => void;
  deleteTransition: (id: string) => void;

  // Bulk operations
  clearCanvas: () => void;
  loadPreset: (presetId: string) => boolean;
  importJSON: (jsonString: string) => { success: boolean; error?: string };

  // Undo / Redo
  undo: () => void;
  redo: () => void;
  snapshotHistory: () => void;

  // Storage
  saveToStorage: () => boolean;
  loadFromStorage: () => boolean;

  // Toast
  showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  dismissToast: () => void;
}

const MAX_HISTORY = 40;

function createSnapshot(state: AutomataStoreState): HistorySnapshot {
  return {
    states: state.states.map(s => ({ ...s })),
    transitions: state.transitions.map(t => ({ ...t, symbols: [...t.symbols] })),
    automatonType: state.automatonType,
    startStateId: state.startStateId,
    acceptingStateIds: [...state.acceptingStateIds],
    stateCounter: state.stateCounter
  };
}

// Initial default automaton: A clean, minimal start setup (or load autosave if present)
const initialAutosave = loadAutoSaveState();
const defaultPreset = AUTOMATA_PRESETS[0]; // Strings ending with 01

const defaultStates: AutomatonState[] = initialAutosave && initialAutosave.states.length > 0 
  ? initialAutosave.states 
  : defaultPreset.states;

const defaultTransitions: AutomatonTransition[] = initialAutosave && initialAutosave.transitions.length > 0
  ? initialAutosave.transitions
  : defaultPreset.transitions;

const defaultType: AutomatonType = initialAutosave ? initialAutosave.type : defaultPreset.type;
const defaultStart: string | null = initialAutosave ? initialAutosave.startStateId : defaultPreset.startStateId;
const defaultAccepting: string[] = initialAutosave ? initialAutosave.acceptingStateIds : defaultPreset.acceptingStateIds;

// Extract highest state counter number
const initialCounter = defaultStates.reduce((max, s) => {
  const match = s.name.match(/^q(\d+)$/);

  if (match) {
    const num = parseInt(match[1], 10);
    return Math.max(max, num + 1);
  }

  return max;
}, 0);

// Extract saved theme or default to 'dark'
const savedTheme =
  (typeof window !== 'undefined' &&
    (localStorage.getItem('automatalab_theme') as ThemeMode)) ||
  'dark';

if (typeof document !== 'undefined') {
  document.documentElement.classList.toggle('dark', savedTheme === 'dark');
}

export const useAutomataStore = create<AutomataStoreState>((set, get) => ({
  activePage: 'home',
  theme: savedTheme,

  canvasSettings: {
    showGrid: true,
    showParticles: true,
    showFlowField: true,
    physicsEnabled: false,
    magnetEnabled: true,
    backgroundTheme: 'nebula',
    reducedMotion: false
  },
  activeAlignmentGuides: [],
  draggedNodeId: null,
  simulationState: null,

  states: defaultStates,
  transitions: defaultTransitions,
  automatonType: defaultType,
  startStateId: defaultStart,
  acceptingStateIds: defaultAccepting,
  stateCounter: initialCounter,

  activeTool: 'select',
  selectedElement: null,
  transitionSourceId: null,
  toast: null,

  past: [],
  future: [],

  setActivePage: (page) => set({ activePage: page }),

  setTheme: (theme) => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('automatalab_theme', theme);
    }
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', next === 'dark');
      localStorage.setItem('automatalab_theme', next);
    }
    set({ theme: next });
  },

  setCanvasSettings: (settings) => {
    set(state => ({
      canvasSettings: { ...state.canvasSettings, ...settings }
    }));
  },

  toggleCanvasSetting: (key) => {
    set(state => ({
      canvasSettings: {
        ...state.canvasSettings,
        [key]: !state.canvasSettings[key]
      }
    }));
  },

  setBackgroundTheme: (theme) => {
    set(state => ({
      canvasSettings: { ...state.canvasSettings, backgroundTheme: theme }
    }));
  },

  setAlignmentGuides: (guides) => set({ activeAlignmentGuides: guides }),
  setDraggedNodeId: (id) => set({ draggedNodeId: id }),

  setActiveTool: (tool) => {
    set({ 
      activeTool: tool, 
      transitionSourceId: tool === 'add-transition' ? get().transitionSourceId : null 
    });
  },

  setSelectedElement: (element) => set({ selectedElement: element }),

  setTransitionSourceId: (id) => set({ transitionSourceId: id }),

  setAutomatonType: (type) => {
    get().snapshotHistory();
    set({ automatonType: type });
    autoSaveState(get().states, get().transitions, type, get().startStateId, get().acceptingStateIds);
  },

  startSimulation: (inputString) => {
    const sim = initSimulation(get().startStateId, inputString);
    set({ simulationState: sim });
  },

  stepSimulationForward: () => {
    const current = get().simulationState;
    if (!current) return;
    const next = stepSimulation(
      current,
      get().states,
      get().transitions,
      get().automatonType,
      get().acceptingStateIds
    );
    set({ simulationState: next });
  },

  resetSimulation: () => {
    set({ simulationState: null });
  },

  snapshotHistory: () => {
    const current = createSnapshot(get());
    set((state) => ({
      past: [...state.past.slice(-(MAX_HISTORY - 1)), current],
      future: []
    }));
  },

  addState: (x, y, customName) => {
    get().snapshotHistory();
    const counter = get().stateCounter;
    const name = customName || `q${counter}`;
    const id = `state_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // If it's the very first state, make it the start state by default
    const isFirst = get().states.length === 0;

    const newState: AutomatonState = {
      id,
      name,
      isStart: isFirst,
      isAccepting: false,
      x,
      y,
      vx: 0,
      vy: 0
    };

    const newStates = [...get().states, newState];
    const newStart = isFirst ? id : get().startStateId;

    set({
      states: newStates,
      startStateId: newStart,
      stateCounter: counter + 1,
      selectedElement: { type: 'state', id }
    });

    autoSaveState(newStates, get().transitions, get().automatonType, newStart, get().acceptingStateIds);
    return newState;
  },

  updateState: (id, updates) => {
    get().snapshotHistory();
    const states = get().states.map(s => s.id === id ? { ...s, ...updates } : s);
    set({ states });
    autoSaveState(states, get().transitions, get().automatonType, get().startStateId, get().acceptingStateIds);
  },

  updateStatePosition: (id, x, y) => {
    const states = get().states.map(s => s.id === id ? { ...s, x, y } : s);
    set({ states });
    autoSaveState(states, get().transitions, get().automatonType, get().startStateId, get().acceptingStateIds);
  },

  setStatesBatch: (newStates) => {
    set({ states: newStates });
  },

  renameState: (id, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    get().snapshotHistory();
    const states = get().states.map(s => s.id === id ? { ...s, name: trimmed } : s);
    set({ states });
    autoSaveState(states, get().transitions, get().automatonType, get().startStateId, get().acceptingStateIds);
  },

  toggleStartState: (id) => {
    get().snapshotHistory();
    const currentStart = get().startStateId;
    const nextStart = currentStart === id ? null : id;

    const states = get().states.map(s => ({
      ...s,
      isStart: s.id === nextStart
    }));

    set({
      states,
      startStateId: nextStart
    });

    autoSaveState(states, get().transitions, get().automatonType, nextStart, get().acceptingStateIds);
  },

  toggleAcceptingState: (id) => {
    get().snapshotHistory();
    const acceptingSet = new Set(get().acceptingStateIds);
    if (acceptingSet.has(id)) {
      acceptingSet.delete(id);
    } else {
      acceptingSet.add(id);
    }
    const acceptingStateIds = Array.from(acceptingSet);

    const states = get().states.map(s => ({
      ...s,
      isAccepting: acceptingSet.has(s.id)
    }));

    set({
      states,
      acceptingStateIds
    });

    autoSaveState(states, get().transitions, get().automatonType, get().startStateId, acceptingStateIds);
  },

  deleteState: (id) => {
    get().snapshotHistory();
    const states = get().states.filter(s => s.id !== id);
    const transitions = get().transitions.filter(t => t.from !== id && t.to !== id);
    const startStateId = get().startStateId === id ? null : get().startStateId;
    const acceptingStateIds = get().acceptingStateIds.filter(sId => sId !== id);
    const selectedElement = get().selectedElement?.id === id ? null : get().selectedElement;

    set({
      states,
      transitions,
      startStateId,
      acceptingStateIds,
      selectedElement,
      transitionSourceId: get().transitionSourceId === id ? null : get().transitionSourceId
    });

    autoSaveState(states, transitions, get().automatonType, startStateId, acceptingStateIds);
  },

  addTransition: (from, to, symbols = ['0']) => {
    get().snapshotHistory();
    const existing = get().transitions.find(t => t.from === from && t.to === to);

    if (existing) {
      const combined = Array.from(new Set([...existing.symbols, ...symbols])).filter(Boolean);
      const transitions = get().transitions.map(t => 
        t.id === existing.id ? { ...t, symbols: combined } : t
      );
      set({ 
        transitions,
        selectedElement: { type: 'transition', id: existing.id }
      });
      autoSaveState(get().states, transitions, get().automatonType, get().startStateId, get().acceptingStateIds);
      return existing;
    }

    const newTrans: AutomatonTransition = {
      id: `trans_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      from,
      to,
      symbols: symbols.length > 0 ? symbols : ['0']
    };

    const transitions = [...get().transitions, newTrans];
    set({
      transitions,
      selectedElement: { type: 'transition', id: newTrans.id },
      transitionSourceId: null
    });

    autoSaveState(get().states, transitions, get().automatonType, get().startStateId, get().acceptingStateIds);
    return newTrans;
  },

  updateTransitionSymbols: (id, symbols) => {
    get().snapshotHistory();
    const filtered = symbols.map(s => s.trim()).filter(Boolean);
    const transitions = get().transitions.map(t => 
      t.id === id ? { ...t, symbols: filtered.length > 0 ? filtered : ['0'] } : t
    );
    set({ transitions });
    autoSaveState(get().states, transitions, get().automatonType, get().startStateId, get().acceptingStateIds);
  },

  deleteTransition: (id) => {
    get().snapshotHistory();
    const transitions = get().transitions.filter(t => t.id !== id);
    const selectedElement = get().selectedElement?.id === id ? null : get().selectedElement;
    set({
      transitions,
      selectedElement
    });
    autoSaveState(get().states, transitions, get().automatonType, get().startStateId, get().acceptingStateIds);
  },

  clearCanvas: () => {
    get().snapshotHistory();
    set({
      states: [],
      transitions: [],
      startStateId: null,
      acceptingStateIds: [],
      selectedElement: null,
      stateCounter: 0,
      transitionSourceId: null,
      simulationState: null
    });
    autoSaveState([], [], get().automatonType, null, []);
    get().showToast('Canvas cleared', 'info');
  },

  loadPreset: (presetId) => {
    const preset = AUTOMATA_PRESETS.find(p => p.id === presetId);
    if (!preset) return false;

    get().snapshotHistory();
    const clonedStates = preset.states.map(s => ({ ...s }));
    const clonedTrans = preset.transitions.map(t => ({ ...t, symbols: [...t.symbols] }));

    set({
      states: clonedStates,
      transitions: clonedTrans,
      automatonType: preset.type,
      startStateId: preset.startStateId,
      acceptingStateIds: [...preset.acceptingStateIds],
      selectedElement: null,
      simulationState: null,
      stateCounter: clonedStates.length + 1
    });

    autoSaveState(clonedStates, clonedTrans, preset.type, preset.startStateId, preset.acceptingStateIds);
    get().showToast(`Loaded preset: "${preset.name}"`, 'success');
    return true;
  },

  importJSON: (jsonString) => {
    const result = importAutomatonFromJSON(jsonString);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    get().snapshotHistory();
    set({
      states: result.states,
      transitions: result.transitions,
      automatonType: result.type,
      startStateId: result.startStateId,
      acceptingStateIds: result.acceptingStateIds,
      selectedElement: null,
      simulationState: null,
      stateCounter: result.states.length + 1
    });

    autoSaveState(result.states, result.transitions, result.type, result.startStateId, result.acceptingStateIds);
    get().showToast('Automaton imported successfully', 'success');
    return { success: true };
  },

  undo: () => {
    const { past, future } = get();
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    const current = createSnapshot(get());

    set({
      past: newPast,
      future: [current, ...future],
      states: previous.states,
      transitions: previous.transitions,
      automatonType: previous.automatonType,
      startStateId: previous.startStateId,
      acceptingStateIds: previous.acceptingStateIds,
      stateCounter: previous.stateCounter,
      selectedElement: null,
      simulationState: null
    });

    autoSaveState(previous.states, previous.transitions, previous.automatonType, previous.startStateId, previous.acceptingStateIds);
  },

  redo: () => {
    const { past, future } = get();
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);
    const current = createSnapshot(get());

    set({
      past: [...past, current],
      future: newFuture,
      states: next.states,
      transitions: next.transitions,
      automatonType: next.automatonType,
      startStateId: next.startStateId,
      acceptingStateIds: next.acceptingStateIds,
      stateCounter: next.stateCounter,
      selectedElement: null,
      simulationState: null
    });

    autoSaveState(next.states, next.transitions, next.automatonType, next.startStateId, next.acceptingStateIds);
  },

  saveToStorage: () => {
    const { states, transitions, automatonType, startStateId, acceptingStateIds } = get();
    const success = saveAutomatonToStorage(states, transitions, automatonType, startStateId, acceptingStateIds);
    if (success) {
      get().showToast('Automaton saved to localStorage', 'success');
    } else {
      get().showToast('Failed to save to localStorage', 'error');
    }
    return success;
  },

  loadFromStorage: () => {
    const result = loadAutomatonFromStorage();
    if (!result || !result.success) {
      get().showToast('No saved automaton found in localStorage', 'warning');
      return false;
    }

    get().snapshotHistory();
    set({
      states: result.states,
      transitions: result.transitions,
      automatonType: result.type,
      startStateId: result.startStateId,
      acceptingStateIds: result.acceptingStateIds,
      selectedElement: null,
      simulationState: null,
      stateCounter: result.states.length + 1
    });

    get().showToast('Loaded automaton from localStorage', 'success');
    return true;
  },

  showToast: (message, type = 'info') => {
    const id = `${Date.now()}_${Math.random()}`;
    set({ toast: { id, message, type } });
  },

  dismissToast: () => set({ toast: null })
}));
