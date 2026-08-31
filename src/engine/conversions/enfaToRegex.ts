/**
 * ε-NFA → REGEX Pipeline: ε-NFA → NFA → DFA → REGEX
 */

import { type FormalAutomaton, type ConversionResult } from '../types/conversion';
import { enfaToNFA } from './enfaToNFA';
import { subsetConstruction } from '../algorithms/subsetConstruction';
import { stateElimination } from '../algorithms/stateElimination';

export function enfaToRegex(enfa: FormalAutomaton): ConversionResult {
  // Step 1: ε-NFA → NFA
  const nfaResult = enfaToNFA(enfa);
  if (!nfaResult.success || typeof nfaResult.result === 'string') {
    return { ...nfaResult, sourceKind: 'ENFA', targetKind: 'REGEX' };
  }
  const nfa = nfaResult.result as FormalAutomaton;

  // Step 2: NFA → DFA
  const { dfa, steps: dfaSteps } = subsetConstruction(nfa, false);

  // Step 3: DFA → Regex
  const { regexString, steps: regexSteps } = stateElimination(dfa);

  return {
    success: true,
    sourceKind: 'ENFA',
    targetKind: 'REGEX',
    steps: [...nfaResult.steps, ...dfaSteps, ...regexSteps],
    result: regexString,
    intermediates: [
      { kind: 'NFA', value: nfa, label: 'NFA (ε-eliminated)' },
      { kind: 'DFA', value: dfa, label: 'DFA (subset construction)' },
    ],
  };
}
