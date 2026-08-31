/**
 * Thompson Construction: Regex AST → ε-NFA
 * 
 * Each regex sub-expression is compiled to an NFA "fragment" with:
 * - Exactly one start state
 * - Exactly one accept state
 * - No transitions into the start state
 * - No transitions out of the accept state
 * 
 * These fragments are then assembled using Thompson's rules:
 * 
 *   Symbol 'a':   start --a--> end
 *
 *   Union A|B:    start --ε--> [A_start..A_end] --ε--> end
 *                 start --ε--> [B_start..B_end] --ε--> end
 *
 *   Concat AB:    [A_start..A_end] --ε--> [B_start..B_end]
 *                 (A_end merged into B_start)
 *
 *   Star A*:      start --ε--> A_start
 *                 A_end --ε--> A_start  (loop)
 *                 start --ε--> end      (skip)
 *                 A_end --ε--> end      (exit)
 */

import { type RegexNode } from '../regex/ast';
import {
  type FormalAutomaton,
  type ConversionStep,
  type ConversionResult,
  EPSILON,
} from '../types/conversion';
import { addTransition, ensureStateEntry } from '../algorithms/epsilonClosure';

/** An NFA fragment: (startState, acceptState) within the larger transition map */
interface NFAFragment {
  start: string;
  accept: string;
}

let stateCounter = 0;

function freshState(prefix = 'q'): string {
  return `${prefix}${stateCounter++}`;
}

function resetCounter() {
  stateCounter = 0;
}

let stepCounter = 0;
function nextStepId(): string {
  return `tc_${++stepCounter}_${Date.now()}`;
}

/**
 * Thompson construction: builds an ε-NFA from a RegexNode AST.
 * 
 * @param regexNode - The parsed regex AST
 * @param hint - Optional alphabet hint for symbols in the regex
 */
export function regexToENFA(regexNode: RegexNode): ConversionResult {
  resetCounter();
  stepCounter = 0;

  const transitions = new Map<string, Map<string, Set<string>>>();
  const allStates = new Set<string>();
  const steps: ConversionStep[] = [];
  const alphabet = new Set<string>();

  // Collect alphabet from AST
  collectAlphabet(regexNode, alphabet);

  steps.push({
    id: nextStepId(),
    title: 'Start Thompson Construction',
    description:
      `Building an ε-NFA using Thompson's Construction for the regex.\n` +
      `Each sub-expression compiles to an NFA fragment with one start and one accept state.\n` +
      `Alphabet: {${Array.from(alphabet).join(', ')}}`,
    ruleApplied: 'Thompson Construction initialization',
  });

  // Build the NFA recursively
  const fragment = buildFragment(regexNode, transitions, allStates, steps, alphabet);

  // The ε-NFA: start = fragment.start, accept = fragment.accept
  const acceptingStates = new Set([fragment.accept]);

  const enfa: FormalAutomaton = {
    kind: 'ENFA',
    states: allStates,
    alphabet,
    transitions,
    startState: fragment.start,
    acceptingStates,
  };

  steps.push({
    id: nextStepId(),
    title: 'Thompson Construction Complete',
    description:
      `ε-NFA construction complete.\n` +
      `States: ${Array.from(allStates).join(', ')}\n` +
      `Start: ${fragment.start}\n` +
      `Accept: ${fragment.accept}\n` +
      `Total states: ${allStates.size}`,
    partialResult: enfa,
  });

  return {
    success: true,
    sourceKind: 'REGEX',
    targetKind: 'ENFA',
    steps,
    result: enfa,
    intermediates: [],
  };
}

// ─── Recursive Fragment Builder ───────────────────────────────────────────────

function buildFragment(
  node: RegexNode,
  transitions: Map<string, Map<string, Set<string>>>,
  allStates: Set<string>,
  steps: ConversionStep[],
  alphabet: Set<string>
): NFAFragment {
  switch (node.type) {
    case 'Symbol':
      return buildSymbol(node.value, transitions, allStates, steps);

    case 'Epsilon':
      return buildEpsilon(transitions, allStates, steps);

    case 'Empty':
      return buildEmpty(transitions, allStates, steps);

    case 'Union':
      return buildUnion(node.left, node.right, transitions, allStates, steps, alphabet);

    case 'Concat':
      return buildConcat(node.left, node.right, transitions, allStates, steps, alphabet);

    case 'Star':
      return buildStar(node.child, transitions, allStates, steps, alphabet);
  }
}

/** Thompson Rule: Symbol 'a'
 *   q_start --a--> q_accept
 */
function buildSymbol(
  symbol: string,
  transitions: Map<string, Map<string, Set<string>>>,
  allStates: Set<string>,
  steps: ConversionStep[]
): NFAFragment {
  const start = freshState('q');
  const accept = freshState('q');
  allStates.add(start);
  allStates.add(accept);
  addTransition(transitions, start, symbol, accept);

  steps.push({
    id: nextStepId(),
    title: `Symbol '${symbol}': ${start} --${symbol}--> ${accept}`,
    description:
      `Thompson Rule — Symbol:\n` +
      `Create two new states ${start} and ${accept}.\n` +
      `Add transition: ${start} --'${symbol}'--> ${accept}`,
    regexFragment: symbol,
    fragmentStates: [start, accept],
    ruleApplied: 'Symbol rule',
    highlightedStates: [start, accept],
  });

  return { start, accept };
}

/** Thompson Rule: Epsilon ε
 *   q_start --ε--> q_accept
 */
function buildEpsilon(
  transitions: Map<string, Map<string, Set<string>>>,
  allStates: Set<string>,
  steps: ConversionStep[]
): NFAFragment {
  const start = freshState('q');
  const accept = freshState('q');
  allStates.add(start);
  allStates.add(accept);
  addTransition(transitions, start, EPSILON, accept);

  steps.push({
    id: nextStepId(),
    title: `Epsilon ε: ${start} --ε--> ${accept}`,
    description:
      `Thompson Rule — Epsilon:\n` +
      `Create two states ${start} and ${accept} connected by a single ε-transition.`,
    regexFragment: 'ε',
    fragmentStates: [start, accept],
    ruleApplied: 'Epsilon rule',
    highlightedStates: [start, accept],
  });

  return { start, accept };
}

/** Thompson Rule: Empty language ∅
 *   q_start   q_accept  (no transition)
 */
function buildEmpty(
  transitions: Map<string, Map<string, Set<string>>>,
  allStates: Set<string>,
  steps: ConversionStep[]
): NFAFragment {
  const start = freshState('q');
  const accept = freshState('q');
  allStates.add(start);
  allStates.add(accept);
  // Empty language: both states exist, but no symbols connect them.
  ensureStateEntry(transitions, start);
  ensureStateEntry(transitions, accept);

  steps.push({
    id: nextStepId(),
    title: `Empty language ∅: ${start} (no path to) ${accept}`,
    description:
      `Thompson Rule — Empty Language:\n` +
      `Create two states ${start} and ${accept} with no transition.\n` +
      `This fragment accepts no strings.`,
    regexFragment: '∅',
    fragmentStates: [start, accept],
    ruleApplied: 'Empty language rule',
    highlightedStates: [start, accept],
  });

  return { start, accept };
}

/** Thompson Rule: Union A|B
 *
 *       ε → A_start -- ... -- A_accept → ε
 *      /                                  \
 *  start                                  accept
 *      \                                  /
 *       ε → B_start -- ... -- B_accept → ε
 */
function buildUnion(
  left: RegexNode,
  right: RegexNode,
  transitions: Map<string, Map<string, Set<string>>>,
  allStates: Set<string>,
  steps: ConversionStep[],
  alphabet: Set<string>
): NFAFragment {
  const fragA = buildFragment(left, transitions, allStates, steps, alphabet);
  const fragB = buildFragment(right, transitions, allStates, steps, alphabet);

  const start = freshState('q');
  const accept = freshState('q');
  allStates.add(start);
  allStates.add(accept);

  // ε transitions
  addTransition(transitions, start, EPSILON, fragA.start);
  addTransition(transitions, start, EPSILON, fragB.start);
  addTransition(transitions, fragA.accept, EPSILON, accept);
  addTransition(transitions, fragB.accept, EPSILON, accept);

  steps.push({
    id: nextStepId(),
    title: `Union A|B: new start ${start}, new accept ${accept}`,
    description:
      `Thompson Rule — Union:\n` +
      `New start state ${start} branches to both sub-fragments via ε.\n` +
      `${start} --ε--> ${fragA.start} (fragment A)\n` +
      `${start} --ε--> ${fragB.start} (fragment B)\n` +
      `Both fragments converge: ${fragA.accept} --ε--> ${accept}\n` +
      `${fragB.accept} --ε--> ${accept}`,
    ruleApplied: 'Union rule',
    fragmentStates: [start, accept],
    highlightedStates: [start, accept, fragA.start, fragA.accept, fragB.start, fragB.accept],
  });

  return { start, accept };
}

/** Thompson Rule: Concatenation AB
 *   A_start -- ... -- A_accept --ε--> B_start -- ... -- B_accept
 */
function buildConcat(
  left: RegexNode,
  right: RegexNode,
  transitions: Map<string, Map<string, Set<string>>>,
  allStates: Set<string>,
  steps: ConversionStep[],
  alphabet: Set<string>
): NFAFragment {
  const fragA = buildFragment(left, transitions, allStates, steps, alphabet);
  const fragB = buildFragment(right, transitions, allStates, steps, alphabet);

  // Connect A's accept to B's start via ε
  addTransition(transitions, fragA.accept, EPSILON, fragB.start);

  steps.push({
    id: nextStepId(),
    title: `Concatenation AB: ${fragA.accept} --ε--> ${fragB.start}`,
    description:
      `Thompson Rule — Concatenation:\n` +
      `Connect the accept state of A (${fragA.accept}) to the start state of B (${fragB.start}) via ε.\n` +
      `The concatenated fragment: start=${fragA.start}, accept=${fragB.accept}`,
    ruleApplied: 'Concatenation rule',
    fragmentStates: [fragA.start, fragB.accept],
    highlightedStates: [fragA.accept, fragB.start],
  });

  return { start: fragA.start, accept: fragB.accept };
}

/** Thompson Rule: Kleene Star A*
 *
 *            ┌──────── ε ────────┐
 *            ↓                   │
 *   start --ε--> A_start -- ... -- A_accept --ε--> accept
 *     │                                              ↑
 *     └─────────────── ε ───────────────────────────┘
 */
function buildStar(
  child: RegexNode,
  transitions: Map<string, Map<string, Set<string>>>,
  allStates: Set<string>,
  steps: ConversionStep[],
  alphabet: Set<string>
): NFAFragment {
  const frag = buildFragment(child, transitions, allStates, steps, alphabet);

  const start = freshState('q');
  const accept = freshState('q');
  allStates.add(start);
  allStates.add(accept);

  // ε transitions for star
  addTransition(transitions, start, EPSILON, frag.start);   // enter A
  addTransition(transitions, start, EPSILON, accept);        // skip A (ε acceptance)
  addTransition(transitions, frag.accept, EPSILON, frag.start); // loop A
  addTransition(transitions, frag.accept, EPSILON, accept);  // exit A

  steps.push({
    id: nextStepId(),
    title: `Star A*: new start ${start}, new accept ${accept}`,
    description:
      `Thompson Rule — Kleene Star:\n` +
      `${start} --ε--> ${frag.start}  (enter A)\n` +
      `${start} --ε--> ${accept}      (skip: accept ε)\n` +
      `${frag.accept} --ε--> ${frag.start}  (loop: repeat A)\n` +
      `${frag.accept} --ε--> ${accept}      (exit A)`,
    ruleApplied: 'Kleene Star rule',
    fragmentStates: [start, accept],
    highlightedStates: [start, accept, frag.start, frag.accept],
  });

  return { start, accept };
}

// ─── Helper: Collect alphabet ─────────────────────────────────────────────────

function collectAlphabet(node: RegexNode, alphabet: Set<string>): void {
  switch (node.type) {
    case 'Symbol':
      alphabet.add(node.value);
      break;
    case 'Union':
      collectAlphabet(node.left, alphabet);
      collectAlphabet(node.right, alphabet);
      break;
    case 'Concat':
      collectAlphabet(node.left, alphabet);
      collectAlphabet(node.right, alphabet);
      break;
    case 'Star':
      collectAlphabet(node.child, alphabet);
      break;
    case 'Epsilon':
    case 'Empty':
      break;
  }
}
