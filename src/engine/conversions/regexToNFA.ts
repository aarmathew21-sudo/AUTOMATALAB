import { type RegexNode } from '../regex/ast';
import { type FormalAutomaton, type ConversionResult } from '../types/conversion';
import { regexToENFA } from './regexToENFA';
import { enfaToNFA } from './enfaToNFA';
import { reduceNFA } from '../algorithms/nfaReduction';

export function regexToNFA(regexNode: RegexNode): ConversionResult {
  const enfaResult = regexToENFA(regexNode);
  if (!enfaResult.success || typeof enfaResult.result === 'string') {
    return { ...enfaResult, sourceKind: 'REGEX', targetKind: 'NFA' };
  }
  const enfa = enfaResult.result as FormalAutomaton;

  const nfaResult = enfaToNFA(enfa);
  if (!nfaResult.success || typeof nfaResult.result === 'string') {
    return { ...nfaResult, sourceKind: 'REGEX', targetKind: 'NFA' };
  }
  const rawNFA = nfaResult.result as FormalAutomaton;

  const { nfa: reducedNFA, steps: reductionSteps } = reduceNFA(rawNFA);

  return {
    success: true,
    sourceKind: 'REGEX',
    targetKind: 'NFA',
    steps: [...enfaResult.steps, ...nfaResult.steps, ...reductionSteps],
    result: reducedNFA,
    intermediates: [
      { kind: 'ENFA', value: enfa, label: 'ε-NFA (Thompson construction)' },
    ],
  };
}