/**
 * NFA → REGEX Pipeline: NFA → DFA → Minimize → Arden's Theorem
 */

import { type FormalAutomaton, type ConversionResult } from '../types/conversion';
import { subsetConstruction } from '../algorithms/subsetConstruction';
import { minimizeDFA } from '../algorithms/minimizeDFA';
import { ardensTheorem } from '../algorithms/ardensTheorem';

export function nfaToRegex(nfa: FormalAutomaton): ConversionResult {
  // Step 1: NFA → DFA
  const { dfa: rawDfa, steps: dfaSteps } = subsetConstruction(nfa, false);

  // Step 2: Minimize DFA
  const { minimizedDFA, steps: minSteps } = minimizeDFA(rawDfa);

  // Step 3: DFA → Regex via Arden's Theorem
  const { regexString, steps: regexSteps } = ardensTheorem(minimizedDFA);

  return {
    success: true,
    sourceKind: 'NFA',
    targetKind: 'REGEX',
    steps: [...dfaSteps, ...minSteps, ...regexSteps],
    result: regexString,
    intermediates: [
      { kind: 'DFA', value: rawDfa, label: 'DFA (via Subset Construction)' },
      { kind: 'DFA', value: minimizedDFA, label: 'Minimized DFA' },
    ],
  };
}
