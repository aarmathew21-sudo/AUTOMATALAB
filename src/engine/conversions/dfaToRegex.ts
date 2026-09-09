/**
 * DFA → Regular Expression: Arden's Theorem
 */

import { type FormalAutomaton, type ConversionResult } from '../types/conversion';
import { ardensTheorem } from '../algorithms/ardensTheorem';
import { minimizeDFA } from '../algorithms/minimizeDFA';

/**
 * Converts a DFA to a regular expression using Arden's Theorem.
 * Pre-minimizes the DFA for cleaner results.
 */
export function dfaToRegex(dfa: FormalAutomaton): ConversionResult {
  const { minimizedDFA, steps: minSteps } = minimizeDFA(dfa);
  const { regexString, steps: ardenSteps } = ardensTheorem(minimizedDFA);

  return {
    success: true,
    sourceKind: 'DFA',
    targetKind: 'REGEX',
    steps: [...minSteps, ...ardenSteps],
    result: regexString,
    intermediates: minSteps.length > 0 ? [{ kind: 'DFA', value: minimizedDFA, label: 'Minimized DFA' }] : [],
  };
}
