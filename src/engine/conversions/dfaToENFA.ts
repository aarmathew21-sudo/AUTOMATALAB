/**
 * DFA → ε-NFA: Trivial conversion
 * Same transitions, no ε-transitions added, kind changed to ENFA.
 */

import { type FormalAutomaton, type ConversionResult } from '../types/conversion';

export function dfaToENFA(dfa: FormalAutomaton): ConversionResult {
  const enfa: FormalAutomaton = {
    kind: 'ENFA',
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
    targetKind: 'ENFA',
    steps: [{
      id: `dtoe_${Date.now()}`,
      title: 'DFA → ε-NFA (trivial)',
      description:
        `Every DFA is already an ε-NFA where no ε-transitions are used.\n\n` +
        `All transitions are preserved. No ε-transitions are added.\n` +
        `States: ${Array.from(dfa.states).join(', ')}\n` +
        `The ε-NFA is identical to the DFA but typed as ε-NFA.`,
      ruleApplied: 'Trivial: DFA ⊆ ε-NFA',
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
