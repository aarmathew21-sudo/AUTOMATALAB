/**
 * DFA → Regular Expression: State Elimination
 */

import { type FormalAutomaton, type ConversionResult } from '../types/conversion';
import { stateElimination } from '../algorithms/stateElimination';

/**
 * Converts a DFA to a regular expression using state elimination (GNFA method).
 */
export function dfaToRegex(dfa: FormalAutomaton): ConversionResult {
  const { regexString, steps } = stateElimination(dfa);

  return {
    success: true,
    sourceKind: 'DFA',
    targetKind: 'REGEX',
    steps,
    result: regexString,
    intermediates: [],
  };
}
