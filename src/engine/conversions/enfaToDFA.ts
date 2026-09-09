/**
 * ε-NFA → DFA: ε-closure + Subset Construction + DFA Minimization
 */

import { type FormalAutomaton, type ConversionResult } from '../types/conversion';
import { subsetConstruction } from '../algorithms/subsetConstruction';
import { minimizeDFA } from '../algorithms/minimizeDFA';

/**
 * Converts an ε-NFA directly to a DFA using subset construction
 * with ε-closure computation, then minimizes the resulting DFA.
 */
export function enfaToDFA(enfa: FormalAutomaton): ConversionResult {
  const { dfa: rawDfa, steps: subsetSteps } = subsetConstruction(enfa, true);
  const { minimizedDFA, steps: minSteps } = minimizeDFA(rawDfa);

  return {
    success: true,
    sourceKind: 'ENFA',
    targetKind: 'DFA',
    steps: [...subsetSteps, ...minSteps],
    result: minimizedDFA,
    intermediates: [{ kind: 'DFA', value: rawDfa, label: 'DFA (raw subset construction)' }],
  };
}
