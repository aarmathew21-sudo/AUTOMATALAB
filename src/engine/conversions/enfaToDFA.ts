/**
 * ε-NFA → DFA: ε-closure + Subset Construction
 */

import { type FormalAutomaton, type ConversionResult } from '../types/conversion';
import { subsetConstruction } from '../algorithms/subsetConstruction';

/**
 * Converts an ε-NFA directly to a DFA using subset construction
 * with ε-closure computation at each step.
 */
export function enfaToDFA(enfa: FormalAutomaton): ConversionResult {
  const { dfa, steps } = subsetConstruction(enfa, true);

  return {
    success: true,
    sourceKind: 'ENFA',
    targetKind: 'DFA',
    steps,
    result: dfa,
    intermediates: [],
  };
}
