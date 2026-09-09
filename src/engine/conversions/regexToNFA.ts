/**
 * REGEX → NFA Pipeline: Regex → ε-NFA → DFA (Minimized) → NFA
 */

import { type RegexNode } from '../regex/ast';
import { type FormalAutomaton, type ConversionResult } from '../types/conversion';
import { regexToDFA } from './regexToDFA';

export function regexToNFA(regexNode: RegexNode): ConversionResult {
  const dfaResult = regexToDFA(regexNode);
  if (!dfaResult.success || typeof dfaResult.result === 'string') {
    return { ...dfaResult, sourceKind: 'REGEX', targetKind: 'NFA' };
  }
  const dfa = dfaResult.result as FormalAutomaton;
  const nfa: FormalAutomaton = {
    ...dfa,
    kind: 'NFA',
  };

  return {
    success: true,
    sourceKind: 'REGEX',
    targetKind: 'NFA',
    steps: dfaResult.steps,
    result: nfa,
    intermediates: dfaResult.intermediates,
  };
}
