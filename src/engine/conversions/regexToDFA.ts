/**
 * REGEX → DFA Pipeline: Regex → ε-NFA → DFA
 */

import { type RegexNode } from '../regex/ast';
import { type FormalAutomaton, type ConversionResult } from '../types/conversion';
import { regexToENFA } from './regexToENFA';
import { subsetConstruction } from '../algorithms/subsetConstruction';

export function regexToDFA(regexNode: RegexNode, _alphabet?: Set<string>): ConversionResult {
  // Step 1: Regex → ε-NFA (Thompson construction)
  const enfaResult = regexToENFA(regexNode);
  if (!enfaResult.success || typeof enfaResult.result === 'string') {
    return { ...enfaResult, sourceKind: 'REGEX', targetKind: 'DFA' };
  }
  const enfa = enfaResult.result as FormalAutomaton;

  // Step 2: ε-NFA → DFA (subset construction with ε-closure)
  const { dfa, steps: dfaSteps } = subsetConstruction(enfa, true);

  return {
    success: true,
    sourceKind: 'REGEX',
    targetKind: 'DFA',
    steps: [...enfaResult.steps, ...dfaSteps],
    result: dfa,
    intermediates: [
      { kind: 'ENFA', value: enfa, label: 'ε-NFA (Thompson construction)' },
    ],
  };
}
