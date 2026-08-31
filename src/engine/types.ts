import type { AutomatonState, AutomatonTransition, AutomatonType } from '../types/automata';

/**
 * Formal Mathematical Definition of Finite Automata
 * 5-Tuple M = (Q, Σ, δ, q0, F)
 */
export interface FormalAutomaton {
  // Q: Finite set of states
  states: Set<string>;
  
  // Σ: Finite set of input symbols (Alphabet)
  alphabet: Set<string>;
  
  // δ: Transition function (Q x (Σ ∪ {ε}) -> P(Q) or Q)
  // Maps: (fromState, symbol) -> Set of toStates
  transitions: Map<string, Map<string, Set<string>>>;
  
  // q0: Start state (q0 ∈ Q)
  startState: string | null;
  
  // F: Set of accepting / final states (F ⊆ Q)
  acceptingStates: Set<string>;
  
  // Type: DFA or NFA
  type: AutomatonType;
}

/**
 * Converts UI states and transitions into a pure formal mathematical automaton
 */
export function createFormalAutomaton(
  states: AutomatonState[],
  transitions: AutomatonTransition[],
  type: AutomatonType,
  startStateId: string | null,
  acceptingStateIds: string[]
): FormalAutomaton {
  const stateSet = new Set(states.map(s => s.id));
  const alphabet = new Set<string>();
  const transitionMap = new Map<string, Map<string, Set<string>>>();

  // Initialize transition map for all states
  for (const state of states) {
    transitionMap.set(state.id, new Map());
  }

  // Populate transitions and discover alphabet
  for (const trans of transitions) {
    if (!stateSet.has(trans.from) || !stateSet.has(trans.to)) continue;

    let stateTransitions = transitionMap.get(trans.from);
    if (!stateTransitions) {
      stateTransitions = new Map();
      transitionMap.set(trans.from, stateTransitions);
    }

    for (const sym of trans.symbols) {
      const trimmedSym = sym.trim();
      if (!trimmedSym) continue;

      if (trimmedSym !== 'ε' && trimmedSym !== 'E' && trimmedSym !== 'eps' && trimmedSym !== 'lambda') {
        alphabet.add(trimmedSym);
      }

      let targets = stateTransitions.get(trimmedSym);
      if (!targets) {
        targets = new Set();
        stateTransitions.set(trimmedSym, targets);
      }
      targets.add(trans.to);
    }
  }

  const acceptingSet = new Set(acceptingStateIds.filter(id => stateSet.has(id)));
  const validStart = startStateId && stateSet.has(startStateId) ? startStateId : null;

  return {
    states: stateSet,
    alphabet,
    transitions: transitionMap,
    startState: validStart,
    acceptingStates: acceptingSet,
    type
  };
}
