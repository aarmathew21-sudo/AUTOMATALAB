/**
 * ε-NFA → REGEX Pipeline: ε-NFA → NFA → DFA → Minimize → Arden's Theorem
 */

import { type FormalAutomaton, type ConversionResult } from '../types/conversion';
import { enfaToNFA } from './enfaToNFA';
import { subsetConstruction } from '../algorithms/subsetConstruction';
import { minimizeDFA } from '../algorithms/minimizeDFA';
import { ardensTheorem } from '../algorithms/ardensTheorem';

export function enfaToRegex(enfa: FormalAutomaton): ConversionResult {
  // Step 1: ε-NFA → NFA
  const nfaResult = enfaToNFA(enfa);
  if (!nfaResult.success || typeof nfaResult.result === 'string') {
    return { ...nfaResult, sourceKind: 'ENFA', targetKind: 'REGEX' };
  }
  const nfa = nfaResult.result as FormalAutomaton;

  // Step 2: NFA → DFA
  const { dfa: rawDfa, steps: dfaSteps } = subsetConstruction(nfa, false);

  // Step 3: Minimize DFA
  const { minimizedDFA, steps: minSteps } = minimizeDFA(rawDfa);

  // Step 4: DFA → Regex via Arden's Theorem
  const { regexString, steps: regexSteps } = ardensTheorem(minimizedDFA);

  return {
    success: true,
    sourceKind: 'ENFA',
    targetKind: 'REGEX',
    steps: [...nfaResult.steps, ...dfaSteps, ...minSteps, ...regexSteps],
    result: regexString,
    intermediates: [
      { kind: 'NFA', value: nfa, label: 'NFA (ε-eliminated)' },
      { kind: 'DFA', value: rawDfa, label: 'DFA (subset construction)' },
      { kind: 'DFA', value: minimizedDFA, label: 'Minimized DFA' },
    ],
  };
}
