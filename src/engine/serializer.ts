import type { AutomatonJSON, AutomatonState, AutomatonTransition, AutomatonType } from '../types/automata';

/**
 * Serializes automaton state into a clean JSON string matching the specification
 */
export function exportAutomatonToJSON(
  states: AutomatonState[],
  transitions: AutomatonTransition[],
  type: AutomatonType,
  startStateId: string | null,
  acceptingStateIds: string[],
  name = 'Automaton Model'
): string {
  const stateMap = new Map(states.map(s => [s.id, s.name]));
  const startStateName = startStateId ? stateMap.get(startStateId) || startStateId : null;
  const acceptingStateNames = acceptingStateIds
    .map(id => stateMap.get(id) || id)
    .filter(Boolean);

  const jsonObject: AutomatonJSON = {
    type,
    states: states.map(s => ({
      id: s.id,
      name: s.name,
      isStart: s.isStart,
      isAccepting: s.isAccepting,
      x: Math.round(s.x),
      y: Math.round(s.y)
    })),
    transitions: transitions.map(t => ({
      id: t.id,
      from: stateMap.get(t.from) || t.from,
      to: stateMap.get(t.to) || t.to,
      symbols: t.symbols
    })),
    startState: startStateName,
    acceptingStates: acceptingStateNames,
    metadata: {
      name,
      createdAt: new Date().toISOString(),
      version: '1.0.0'
    }
  };

  return JSON.stringify(jsonObject, null, 2);
}

export interface ImportResult {
  success: boolean;
  error?: string;
  states: AutomatonState[];
  transitions: AutomatonTransition[];
  type: AutomatonType;
  startStateId: string | null;
  acceptingStateIds: string[];
}

/**
 * Parses and validates an imported JSON string into internal automaton state
 */
export function importAutomatonFromJSON(jsonString: string): ImportResult {
  try {
    const data = JSON.parse(jsonString);

    if (!data || typeof data !== 'object') {
      return {
        success: false,
        error: 'Invalid JSON format: root must be an object.',
        states: [],
        transitions: [],
        type: 'DFA',
        startStateId: null,
        acceptingStateIds: []
      };
    }

    const type: AutomatonType = (data.type === 'NFA' || data.type === 'DFA') ? data.type : 'DFA';
    
    if (!Array.isArray(data.states)) {
      return {
        success: false,
        error: 'Invalid JSON: "states" must be an array.',
        states: [],
        transitions: [],
        type,
        startStateId: null,
        acceptingStateIds: []
      };
    }

    // Build state map and list
    const nameToId = new Map<string, string>();
    const idToState = new Map<string, AutomatonState>();
    const states: AutomatonState[] = [];

    data.states.forEach((rawState: any, index: number) => {
      const id = String(rawState.id || `q_${index}`);
      const name = String(rawState.name || `q${index}`);
      const x = typeof rawState.x === 'number' ? rawState.x : 150 + (index % 4) * 160;
      const y = typeof rawState.y === 'number' ? rawState.y : 150 + Math.floor(index / 4) * 140;

      const state: AutomatonState = {
        id,
        name,
        isStart: Boolean(rawState.isStart),
        isAccepting: Boolean(rawState.isAccepting),
        x,
        y
      };

      states.push(state);
      nameToId.set(name, id);
      nameToId.set(id, id); // map both id and name to id
      idToState.set(id, state);
    });

    // Handle Start State
    let startStateId: string | null = null;
    if (data.startState) {
      startStateId = nameToId.get(String(data.startState)) || null;
    } else {
      const explicitStart = states.find(s => s.isStart);
      if (explicitStart) startStateId = explicitStart.id;
    }

    // Handle Accepting States
    const acceptingStateIds = new Set<string>();
    if (Array.isArray(data.acceptingStates)) {
      for (const acceptTarget of data.acceptingStates) {
        const id = nameToId.get(String(acceptTarget));
        if (id) acceptingStateIds.add(id);
      }
    }
    // Also include states marked with isAccepting: true
    for (const state of states) {
      if (state.isAccepting) {
        acceptingStateIds.add(state.id);
      }
    }

    // Sync start and accepting flags on state objects
    states.forEach(s => {
      s.isStart = s.id === startStateId;
      s.isAccepting = acceptingStateIds.has(s.id);
    });

    // Handle Transitions
    const transitions: AutomatonTransition[] = [];
    if (Array.isArray(data.transitions)) {
      data.transitions.forEach((rawTrans: any, index: number) => {
        const fromId = nameToId.get(String(rawTrans.from));
        const toId = nameToId.get(String(rawTrans.to));

        if (fromId && toId) {
          let symbols: string[] = [];
          if (Array.isArray(rawTrans.symbols)) {
            symbols = rawTrans.symbols.map((s: any) => String(s).trim()).filter(Boolean);
          } else if (typeof rawTrans.symbols === 'string') {
            symbols = rawTrans.symbols.split(',').map((s: string) => s.trim()).filter(Boolean);
          } else if (rawTrans.symbol) {
            symbols = [String(rawTrans.symbol).trim()];
          }

          if (symbols.length === 0) {
            symbols = ['0'];
          }

          transitions.push({
            id: String(rawTrans.id || `e_${fromId}_${toId}_${index}`),
            from: fromId,
            to: toId,
            symbols
          });
        }
      });
    }

    return {
      success: true,
      states,
      transitions,
      type,
      startStateId,
      acceptingStateIds: Array.from(acceptingStateIds)
    };
  } catch (err: any) {
    return {
      success: false,
      error: `JSON parse error: ${err.message || 'Unknown error'}`,
      states: [],
      transitions: [],
      type: 'DFA',
      startStateId: null,
      acceptingStateIds: []
    };
  }
}
