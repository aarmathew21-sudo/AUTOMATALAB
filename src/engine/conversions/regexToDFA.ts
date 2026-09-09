/**
 * REGEX → DFA Pipeline: Regex → ε-NFA → DFA (Minimized)
 */

import { type RegexNode } from '../regex/ast';
import { type FormalAutomaton, type ConversionResult } from '../types/conversion';
import { regexToENFA } from './regexToENFA';
import { subsetConstruction } from '../algorithms/subsetConstruction';
import { minimizeDFA } from '../algorithms/minimizeDFA';

export function regexToDFA(regexNode: RegexNode, _alphabet?: Set<string>): ConversionResult {
  // Step 1: Regex → ε-NFA (Thompson construction)
  const enfaResult = regexToENFA(regexNode);
  if (!enfaResult.success || typeof enfaResult.result === 'string') {
    return { ...enfaResult, sourceKind: 'REGEX', targetKind: 'DFA' };
  }
  const enfa = enfaResult.result as FormalAutomaton;

  // Step 2: ε-NFA → DFA (subset construction with ε-closure)
  const { dfa: rawDfa, steps: dfaSteps } = subsetConstruction(enfa, true);

  // Step 3: DFA Minimization
  const { minimizedDFA, steps: minSteps } = minimizeDFA(rawDfa);

  return {
    success: true,
    sourceKind: 'REGEX',
    targetKind: 'DFA',
    steps: [...enfaResult.steps, ...dfaSteps, ...minSteps],
    result: minimizedDFA,
    intermediates: [
      { kind: 'ENFA', value: enfa, label: 'ε-NFA (Thompson construction)' },
      { kind: 'DFA', value: rawDfa, label: 'DFA (subset construction)' },
    ],
  };
}
