/**
 * NFA → DFA: Standard Subset Construction (no ε-closures)
 */

import { type FormalAutomaton, type ConversionResult } from '../types/conversion';
import { subsetConstruction } from '../algorithms/subsetConstruction';

/**
 * Converts an NFA to a DFA using the standard subset construction algorithm.
 * Does not compute ε-closures (assumes no ε-transitions).
 */
export function nfaToDFA(nfa: FormalAutomaton): ConversionResult {
  const { dfa, steps } = subsetConstruction(nfa, false);

  return {
    success: true,
    sourceKind: 'NFA',
    targetKind: 'DFA',
    steps,
    result: dfa,
    intermediates: [],
  };
}
