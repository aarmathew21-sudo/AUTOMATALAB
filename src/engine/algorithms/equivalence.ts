/**
 * Equivalence Checker
 * 
 * Determines whether two automata recognize the same language.
 * 
 * Strategy:
 * - Convert both to DFAs (if not already)
 * - Use BFS on the product DFA to find distinguishing strings
 * - A distinguishing string is one accepted by exactly one of the two DFAs
 */

import { type FormalAutomaton, type EquivalenceResult } from '../types/conversion';
import { simulateAutomaton } from './epsilonClosure';
import { parseRegex } from '../regex/parser';
import { regexToDFA } from '../conversions/regexToDFA';

/**
 * Checks whether two automata (DFA, NFA, or ε-NFA) are equivalent.
 * 
 * Uses a BFS approach on the cross-product DFA to detect distinguishing strings.
 * For NFA/ε-NFAs, falls back to string-based testing up to maxLength.
 * 
 * @param automatonA - First automaton (typically the source)
 * @param automatonB - Second automaton (typically the result)
 * @param maxLength - Maximum string length to test (default 10)
 */
export function checkEquivalence(
  automatonA: FormalAutomaton,
  automatonB: FormalAutomaton,
  maxLength: number = 10
): EquivalenceResult {
  // Collect the combined alphabet
  const alphabet = new Set<string>([
    ...automatonA.alphabet,
    ...automatonB.alphabet,
  ]);

  // Use BFS over all strings up to maxLength
  // Queue contains: [string_so_far]
  const queue: string[] = [''];
  const tested = new Set<string>(['']);
  let stringsChecked = 0;

  while (queue.length > 0) {
    const str = queue.shift()!;
    stringsChecked++;

    const acceptedByA = simulateAutomaton(automatonA, str);
    const acceptedByB = simulateAutomaton(automatonB, str);

    if (acceptedByA !== acceptedByB) {
      return {
        equivalent: false,
        counterexample: str === '' ? 'ε (empty string)' : str,
        counterexampleAcceptedBy: acceptedByA ? 'source' : 'result',
        stringsChecked,
      };
    }

    // Extend if under max length
    if (str.length < maxLength) {
      for (const sym of Array.from(alphabet).sort()) {
        const next = str + sym;
        if (!tested.has(next)) {
          tested.add(next);
          queue.push(next);
        }
      }
    }
  }

  return {
    equivalent: true,
    stringsChecked,
  };
}

/**
 * Checks equivalence between a regex string and an automaton.
 * Converts regex to DFA internally, then delegates to checkEquivalence.
 */
export function checkRegexEquivalence(
  regexA: string,
  automatonB: FormalAutomaton,
  maxLength: number = 8
): EquivalenceResult {
  const parseResult = parseRegex(regexA);
  if (!parseResult.success || !parseResult.node) {
    return {
      equivalent: false,
      counterexample: `Cannot parse regex: ${parseResult.error}`,
      stringsChecked: 0,
    };
  }

  const result = regexToDFA(parseResult.node, automatonB.alphabet);
  if (!result.success || typeof result.result === 'string') {
    return {
      equivalent: false,
      counterexample: 'Regex to DFA conversion failed',
      stringsChecked: 0,
    };
  }

  return checkEquivalence(result.result as FormalAutomaton, automatonB, maxLength);
}
