/**
 * Conversion Engine Index — Unified Dispatch
 * 
 * Routes conversion requests to the appropriate algorithm.
 * Also exports utilities for converting UI automata (store format) to FormalAutomaton.
 */

import { parseRegex } from '../regex/parser';
import {
  type FormalAutomaton,
  type ConversionResult,
  type AutomatonKind,
  EPSILON,
} from '../types/conversion';
import type { AutomatonState, AutomatonTransition } from '../../types/automata';
import { layoutAutomaton } from '../layout';

// Conversion modules
import { regexToENFA } from './regexToENFA';
import { regexToNFA } from './regexToNFA';
import { regexToDFA } from './regexToDFA';
import { enfaToNFA } from './enfaToNFA';
import { enfaToDFA } from './enfaToDFA';
import { enfaToRegex } from './enfaToRegex';
import { nfaToDFA } from './nfaToDFA';
import { nfaToRegex } from './nfaToRegex';
import { nfaToENFA } from './nfaToENFA';
import { dfaToNFA } from './dfaToNFA';
import { dfaToENFA } from './dfaToENFA';
import { dfaToRegex } from './dfaToRegex';

export type { FormalAutomaton, ConversionResult, AutomatonKind };
export { EPSILON };

/**
 * Converts a UI automaton (from the Zustand store) to a FormalAutomaton.
 */
export function uiAutomatonToFormal(
  states: AutomatonState[],
  transitions: AutomatonTransition[],
  startStateId: string | null,
  acceptingStateIds: string[],
  kind: AutomatonKind
): FormalAutomaton {
  const stateSet = new Set(states.map(s => s.id));
  const alphabet = new Set<string>();
  const transMap = new Map<string, Map<string, Set<string>>>();

  // Initialize all states in transition map
  for (const s of states) {
    transMap.set(s.id, new Map());
  }

  for (const t of transitions) {
    if (!stateSet.has(t.from) || !stateSet.has(t.to)) continue;
    const symMap = transMap.get(t.from)!;

    for (const rawSym of t.symbols) {
      const sym = rawSym.trim();
      if (!sym) continue;

      // Normalize epsilon representations
      const canonical = normalizeEpsilon(sym);
      
      if (canonical !== EPSILON) {
        alphabet.add(canonical);
      }

      if (!symMap.has(canonical)) symMap.set(canonical, new Set());
      symMap.get(canonical)!.add(t.to);
    }
  }

  // Create label map (id → name)
  const stateLabels = new Map(states.map(s => [s.id, s.name]));

  return {
    kind,
    states: stateSet,
    alphabet,
    transitions: transMap,
    startState: startStateId && stateSet.has(startStateId) ? startStateId : null,
    acceptingStates: new Set(acceptingStateIds.filter(id => stateSet.has(id))),
    stateLabels,
  };
}

/**
 * Converts a FormalAutomaton back to UI state/transition arrays.
 * Places states using layout positions.
 */
export function formalAutomatonToUI(
  automaton: FormalAutomaton
): {
  states: AutomatonState[];
  transitions: AutomatonTransition[];
  startStateId: string | null;
  acceptingStateIds: string[];
  kind: AutomatonKind;
} {
  const positions = layoutAutomaton(automaton);

  const states: AutomatonState[] = Array.from(automaton.states).map(id => {
    const pos = positions.get(id) ?? { x: 100, y: 100 };
    const label = automaton.stateLabels?.get(id) ?? id;
    return {
      id,
      name: label,
      isStart: id === automaton.startState,
      isAccepting: automaton.acceptingStates.has(id),
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
    };
  });

  const transitionMap = new Map<string, AutomatonTransition>();
  for (const [from, symMap] of automaton.transitions.entries()) {
    for (const [sym, targets] of symMap.entries()) {
      for (const to of targets) {
        const key = `${from}__${to}`;
        if (transitionMap.has(key)) {
          transitionMap.get(key)!.symbols.push(sym);
        } else {
          transitionMap.set(key, {
            id: `t_${from}_${sym}_${to}`,
            from,
            to,
            symbols: [sym],
          });
        }
      }
    }
  }

  return {
    states,
    transitions: Array.from(transitionMap.values()),
    startStateId: automaton.startState,
    acceptingStateIds: Array.from(automaton.acceptingStates),
    kind: automaton.kind,
  };
}

/** Normalize epsilon string representations */
function normalizeEpsilon(sym: string): string {
  if (sym === 'ε' || sym === 'E' || sym === 'eps' || sym === 'epsilon' || sym === 'lambda') {
    return EPSILON;
  }
  return sym;
}

/**
 * Main conversion dispatcher.
 * 
 * @param source - The source: FormalAutomaton or regex string
 * @param sourceKind - Kind of the source
 * @param targetKind - Kind of the target
 */
export function convert(
  source: FormalAutomaton | string,
  sourceKind: AutomatonKind,
  targetKind: AutomatonKind
): ConversionResult {
  // Same type conversions
  if (sourceKind === targetKind) {
    return {
      success: true,
      sourceKind,
      targetKind,
      steps: [{
        id: `id_${Date.now()}`,
        title: `${sourceKind} → ${targetKind} (identity)`,
        description: `Source and target types are the same. No conversion needed.`,
        ruleApplied: 'Identity',
        partialResult: typeof source === 'string' ? undefined : source,
      }],
      result: source,
      intermediates: [],
    };
  }

  // REGEX → *
  if (sourceKind === 'REGEX') {
    const regexStr = source as string;
    const parseResult = parseRegex(regexStr);
    if (!parseResult.success || !parseResult.node) {
      return {
        success: false,
        error: `Invalid regular expression: ${parseResult.error}`,
        sourceKind,
        targetKind,
        steps: [],
        result: '',
        intermediates: [],
      };
    }
    const node = parseResult.node;

    switch (targetKind) {
      case 'ENFA': return regexToENFA(node);
      case 'NFA':  return regexToNFA(node);
      case 'DFA':  return regexToDFA(node);
      case 'REGEX': return { success: true, sourceKind, targetKind, steps: [], result: regexStr, intermediates: [] };
    }
  }

  // * → REGEX
  if (targetKind === 'REGEX') {
    const automaton = source as FormalAutomaton;
    switch (sourceKind) {
      case 'ENFA': return enfaToRegex(automaton);
      case 'NFA':  return nfaToRegex(automaton);
      case 'DFA':  return dfaToRegex(automaton);
    }
  }

  // Automaton → Automaton
  const automaton = source as FormalAutomaton;

  if (sourceKind === 'ENFA') {
    switch (targetKind) {
      case 'NFA': return enfaToNFA(automaton);
      case 'DFA': return enfaToDFA(automaton);
    }
  }

  if (sourceKind === 'NFA') {
    switch (targetKind) {
      case 'DFA':  return nfaToDFA(automaton);
      case 'ENFA': return nfaToENFA(automaton);
    }
  }

  if (sourceKind === 'DFA') {
    switch (targetKind) {
      case 'NFA':  return dfaToNFA(automaton);
      case 'ENFA': return dfaToENFA(automaton);
    }
  }

  return {
    success: false,
    error: `Unsupported conversion: ${sourceKind} → ${targetKind}`,
    sourceKind,
    targetKind,
    steps: [],
    result: '',
    intermediates: [],
  };
}

// Re-export individual converters for direct use
export {
  regexToENFA, regexToNFA, regexToDFA,
  enfaToNFA, enfaToDFA, enfaToRegex,
  nfaToDFA, nfaToRegex, nfaToENFA,
  dfaToNFA, dfaToENFA, dfaToRegex,
};
