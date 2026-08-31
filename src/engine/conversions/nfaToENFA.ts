/**
 * NFA → ε-NFA: Trivial conversion
 * Preserve transitions, allow empty ε-sets, change kind to ENFA.
 */

import { type FormalAutomaton, type ConversionResult } from '../types/conversion';

export function nfaToENFA(nfa: FormalAutomaton): ConversionResult {
  const enfa: FormalAutomaton = {
    kind: 'ENFA',
    states: new Set(nfa.states),
    alphabet: new Set(nfa.alphabet),
    transitions: deepCopyTransitions(nfa.transitions),
    startState: nfa.startState,
    acceptingStates: new Set(nfa.acceptingStates),
    stateLabels: nfa.stateLabels ? new Map(nfa.stateLabels) : undefined,
  };

  return {
    success: true,
    sourceKind: 'NFA',
    targetKind: 'ENFA',
    steps: [{
      id: `ntoe_${Date.now()}`,
      title: 'NFA → ε-NFA (trivial)',
      description:
        `Every NFA is already an ε-NFA where the ε-transition sets are empty.\n\n` +
        `All transitions are preserved. No ε-transitions are added.\n` +
        `States: ${Array.from(nfa.states).join(', ')}\n` +
        `The ε-NFA is identical to the NFA but typed as ε-NFA.`,
      ruleApplied: 'Trivial: NFA ⊆ ε-NFA',
      partialResult: enfa,
    }],
    result: enfa,
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
