/**
 * NFA → REGEX Pipeline: NFA → DFA → REGEX
 */

import { type FormalAutomaton, type ConversionResult } from '../types/conversion';
import { subsetConstruction } from '../algorithms/subsetConstruction';
import { stateElimination } from '../algorithms/stateElimination';

export function nfaToRegex(nfa: FormalAutomaton): ConversionResult {
  // Step 1: NFA → DFA
  const { dfa, steps: dfaSteps } = subsetConstruction(nfa, false);

  // Step 2: DFA → Regex
  const { regexString, steps: regexSteps } = stateElimination(dfa);

  return {
    success: true,
    sourceKind: 'NFA',
    targetKind: 'REGEX',
    steps: [...dfaSteps, ...regexSteps],
    result: regexString,
    intermediates: [{ kind: 'DFA', value: dfa, label: 'DFA (via Subset Construction)' }],
  };
}
