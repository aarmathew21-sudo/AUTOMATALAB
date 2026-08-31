/**
 * DFA → NFA: Trivial conversion
 * Preserve all DFA transitions as NFA singleton sets.
 * The structure is identical; only the kind label changes.
 */

import { type FormalAutomaton, type ConversionResult } from '../types/conversion';

export function dfaToNFA(dfa: FormalAutomaton): ConversionResult {
  const nfa: FormalAutomaton = {
    kind: 'NFA',
    states: new Set(dfa.states),
    alphabet: new Set(dfa.alphabet),
    transitions: deepCopyTransitions(dfa.transitions),
    startState: dfa.startState,
    acceptingStates: new Set(dfa.acceptingStates),
    stateLabels: dfa.stateLabels ? new Map(dfa.stateLabels) : undefined,
  };

  return {
    success: true,
    sourceKind: 'DFA',
    targetKind: 'NFA',
    steps: [{
      id: `dton_${Date.now()}`,
      title: 'DFA → NFA (trivial)',
      description:
        `Every DFA is already an NFA with the restriction that each state has exactly\n` +
        `one transition per symbol.\n\n` +
        `All transitions are preserved as-is.\n` +
        `States: ${Array.from(dfa.states).join(', ')}\n` +
        `The NFA is identical to the DFA but typed as NFA.`,
      ruleApplied: 'Trivial: DFA ⊆ NFA',
      partialResult: nfa,
    }],
    result: nfa,
    intermediates: [],
  };
}

function deepCopyTransitions(
  transitions: Map<string, Map<string, Set<string>>>
): Map<string, Map<string, Set<string>>> {
  const copy = new Map<string, Map<string, Set<string>>>();
  for (const [from, symMap] of transitions.entries()) {
    const newSymMap = new Map<string, Set<string>>();
    for (const [sym, targets] of symMap.entries()) {
      newSymMap.set(sym, new Set(targets));
    }
    copy.set(from, newSymMap);
  }
  return copy;
}
