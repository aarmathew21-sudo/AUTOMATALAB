/**
 * REGEX → NFA Pipeline: Regex → ε-NFA → NFA
 */

import { type RegexNode } from '../regex/ast';
import { type FormalAutomaton, type ConversionResult } from '../types/conversion';
import { regexToENFA } from './regexToENFA';
import { enfaToNFA } from './enfaToNFA';

export function regexToNFA(regexNode: RegexNode): ConversionResult {
  // Step 1: Regex → ε-NFA
  const enfaResult = regexToENFA(regexNode);
  if (!enfaResult.success || typeof enfaResult.result === 'string') {
    return { ...enfaResult, sourceKind: 'REGEX', targetKind: 'NFA' };
  }
  const enfa = enfaResult.result as FormalAutomaton;

  // Step 2: ε-NFA → NFA
  const nfaResult = enfaToNFA(enfa);

  return {
    success: true,
    sourceKind: 'REGEX',
    targetKind: 'NFA',
    steps: [...enfaResult.steps, ...nfaResult.steps],
    result: nfaResult.result,
    intermediates: [
      { kind: 'ENFA', value: enfa, label: 'ε-NFA (Thompson construction)' },
    ],
  };
}
