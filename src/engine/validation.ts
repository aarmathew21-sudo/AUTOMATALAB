import type { AutomatonState, AutomatonTransition, AutomatonType, AutomatonValidationResult } from '../types/automata';
import { createFormalAutomaton } from './types';

/**
 * Validates the automaton structure mathematically.
 * Checks completeness, determinism, reachability, start states, and symbol definitions.
 */
export function validateAutomaton(
  states: AutomatonState[],
  transitions: AutomatonTransition[],
  type: AutomatonType,
  startStateId: string | null,
  acceptingStateIds: string[]
): AutomatonValidationResult {
  const formal = createFormalAutomaton(states, transitions, type, startStateId, acceptingStateIds);
  const alphabet = Array.from(formal.alphabet).sort();
  const errors: string[] = [];
  const warnings: string[] = [];
  const stateMap = new Map(states.map(s => [s.id, s.name]));

  // 1. Start state check
  if (!formal.startState && states.length > 0) {
    warnings.push('No start state designated. Please set an initial state (q0).');
  }

  // 2. Accepting states check
  if (formal.acceptingStates.size === 0 && states.length > 0) {
    warnings.push('No accepting states designated.');
  }

  // 3. Reachability analysis (BFS from start state)
  const reachable = new Set<string>();
  if (formal.startState) {
    const queue = [formal.startState];
    reachable.add(formal.startState);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const stateTransitions = formal.transitions.get(current);
      if (stateTransitions) {
        for (const targets of stateTransitions.values()) {
          for (const target of targets) {
            if (!reachable.has(target)) {
              reachable.add(target);
              queue.push(target);
            }
          }
        }
      }
    }
  }

  const unreachableStates = states
    .filter(s => !reachable.has(s.id))
    .map(s => s.name);

  if (formal.startState && unreachableStates.length > 0) {
    warnings.push(`Unreachable state(s) detected: ${unreachableStates.join(', ')}`);
  }

  // 4. Determinism check (DFA requirements)
  let isDeterministic = true;
  const nonDeterministicReasons: string[] = [];

  for (const state of states) {
    const stateTransitions = formal.transitions.get(state.id) || new Map();

    // Check for epsilon transitions in DFA
    const hasEpsilon = Array.from(stateTransitions.keys()).some(
      sym => sym === 'ε' || sym === 'E' || sym === 'eps' || sym === 'lambda' || sym === ''
    );
    if (hasEpsilon) {
      isDeterministic = false;
      nonDeterministicReasons.push(`State ${state.name} contains ε-transitions.`);
    }

    // Check for multiple transitions on the same symbol
    for (const [sym, targets] of stateTransitions.entries()) {
      if (targets.size > 1) {
        isDeterministic = false;
        nonDeterministicReasons.push(
          `State ${state.name} has ${targets.size} transitions on symbol '${sym}'.`
        );
      }
    }

    // Check for missing transitions in DFA
    if (type === 'DFA' && alphabet.length > 0) {
      const missingSymbols = alphabet.filter(sym => !stateTransitions.has(sym) || stateTransitions.get(sym)!.size === 0);
      if (missingSymbols.length > 0) {
        // Missing transitions in a DFA make it incomplete
        warnings.push(`State ${state.name} is missing transitions for: ${missingSymbols.map(s => `'${s}'`).join(', ')}`);
      }
    }
  }

  if (type === 'DFA' && !isDeterministic) {
    errors.push(...nonDeterministicReasons);
  }

  // 5. Dead / Trap states check (cannot reach any accepting state)
  const deadStates: string[] = [];
  if (formal.acceptingStates.size > 0) {
    for (const state of states) {
      if (formal.acceptingStates.has(state.id)) continue;
      
      // BFS to see if an accept state is reachable
      const visited = new Set<string>([state.id]);
      const queue = [state.id];
      let canReachAccept = false;

      while (queue.length > 0) {
        const curr = queue.shift()!;
        if (formal.acceptingStates.has(curr)) {
          canReachAccept = true;
          break;
        }

        const stateTrans = formal.transitions.get(curr);
        if (stateTrans) {
          for (const targets of stateTrans.values()) {
            for (const t of targets) {
              if (!visited.has(t)) {
                visited.add(t);
                queue.push(t);
              }
            }
          }
        }
      }

      if (!canReachAccept) {
        deadStates.push(state.name);
      }
    }
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    alphabet,
    errors,
    warnings,
    isDeterministic,
    stateCount: states.length,
    transitionCount: transitions.length,
    startState: formal.startState ? stateMap.get(formal.startState) || null : null,
    acceptingStates: Array.from(formal.acceptingStates).map(id => stateMap.get(id) || id),
    unreachableStates,
    deadStates
  };
}
