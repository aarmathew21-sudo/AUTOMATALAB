/**
 * NFA → DFA: Subset Construction + DFA Minimization
 */

import { type FormalAutomaton, type ConversionResult } from '../types/conversion';
import { subsetConstruction } from '../algorithms/subsetConstruction';
import { minimizeDFA } from '../algorithms/minimizeDFA';

/**
 * Converts an NFA to a DFA using subset construction and minimizes the resulting DFA.
 */
export function nfaToDFA(nfa: FormalAutomaton): ConversionResult {
  const { dfa: rawDfa, steps: subsetSteps } = subsetConstruction(nfa, false);
  const { minimizedDFA, steps: minSteps } = minimizeDFA(rawDfa);

  return {
    success: true,
    sourceKind: 'NFA',
    targetKind: 'DFA',
    steps: [...subsetSteps, ...minSteps],
    result: minimizedDFA,
    intermediates: [{ kind: 'DFA', value: rawDfa, label: 'DFA (raw subset construction)' }],
  };
}
