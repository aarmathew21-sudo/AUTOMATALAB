/**
 * ε-NFA → NFA Conversion: Epsilon Elimination
 * 
 * For every state q and input symbol a:
 *   δ'(q, a) = ε-closure(move(ε-closure(q), a))
 * 
 * A state becomes accepting if its ε-closure contains any accepting state.
 * No ε-transitions remain in the output NFA.
 */

import { type FormalAutomaton, type ConversionResult, type ConversionStep } from '../types/conversion';
import { epsilonClosure, move, isAcceptingSet, addTransition } from '../algorithms/epsilonClosure';

let stepCounter = 0;
function nextStepId(): string {
  return `en_${++stepCounter}_${Date.now()}`;
}

/**
 * Converts an ε-NFA to an NFA by eliminating all ε-transitions.
 */
export function enfaToNFA(enfa: FormalAutomaton): ConversionResult {
  stepCounter = 0;
  const steps: ConversionStep[] = [];

  if (!enfa.startState || enfa.states.size === 0) {
    const emptyNFA: FormalAutomaton = {
      kind: 'NFA',
      states: new Set(),
      alphabet: new Set(enfa.alphabet),
      transitions: new Map(),
      startState: null,
      acceptingStates: new Set(),
    };
    return {
      success: true,
      sourceKind: 'ENFA',
      targetKind: 'NFA',
      steps: [{
        id: nextStepId(),
        title: 'Empty ε-NFA',
        description: 'The ε-NFA has no states. The result is an empty NFA.',
      }],
      result: emptyNFA,
      intermediates: [],
    };
  }

  const alphabet = new Set(enfa.alphabet); // non-epsilon symbols only
  const nfaTransitions = new Map<string, Map<string, Set<string>>>();
  const nfaAccepting = new Set<string>();
  const nfaStates = new Set<string>(enfa.states);

  steps.push({
    id: nextStepId(),
    title: 'Start ε-Elimination',
    description:
      `Converting ε-NFA to NFA by eliminating ε-transitions.\n\n` +
      `For each state q and input symbol a:\n` +
      `  δ'(q, a) = ε-closure(move(ε-closure(q), a))\n\n` +
      `States: ${Array.from(enfa.states).join(', ')}\n` +
      `Alphabet (non-ε): ${Array.from(alphabet).sort().join(', ')}`,
  });

  // Process each state
  for (const state of Array.from(enfa.states).sort()) {
    // Compute ε-closure of this state
    const closure = epsilonClosure([state], enfa.transitions);
    const closureArr = Array.from(closure).sort();

    // Check if this state becomes accepting
    const becomesAccepting = isAcceptingSet(closure, enfa.acceptingStates);
    if (becomesAccepting) {
      nfaAccepting.add(state);
    }

    steps.push({
      id: nextStepId(),
      title: `ε-closure(${state}) = {${closureArr.join(', ')}}`,
      description:
        `Processing state ${state}:\n` +
        `ε-closure(${state}) = {${closureArr.join(', ')}}\n` +
        (becomesAccepting
          ? `→ ${state} becomes an accepting state (closure contains accepting state(s): ${
              closureArr.filter(s => enfa.acceptingStates.has(s)).join(', ')
            })`
          : `→ ${state} is NOT accepting (no accepting states in ε-closure)`),
      currentStateSet: closureArr,
      highlightedStates: [state, ...closureArr],
      ruleApplied: 'ε-closure computation',
    });

    // For each non-epsilon symbol, compute new transitions
    for (const sym of Array.from(alphabet).sort()) {
      // move(ε-closure(q), a)
      const moved = move(closure, sym, enfa.transitions);
      // ε-closure of the result
      const resultClosure = epsilonClosure(moved, enfa.transitions);
      const resultArr = Array.from(resultClosure).sort();

      if (resultClosure.size === 0) {
        steps.push({
          id: nextStepId(),
          title: `δ'(${state}, '${sym}') = ∅`,
          description:
            `State ${state}, symbol '${sym}':\n` +
            `move({${closureArr.join(', ')}}, '${sym}') = {${Array.from(moved).sort().join(', ')}}\n` +
            `ε-closure(∅) = ∅\n` +
            `No transition added.`,
          currentStateSet: closureArr,
          symbol: sym,
          reachableStates: [],
          resultStateSet: [],
          ruleApplied: 'δ\'(q, a) = ε-closure(move(ε-closure(q), a))',
        });
        continue;
      }

      // Add transitions from state → each state in resultClosure
      for (const target of resultClosure) {
        addTransition(nfaTransitions, state, sym, target);
      }

      steps.push({
        id: nextStepId(),
        title: `δ'(${state}, '${sym}') = {${resultArr.join(', ')}}`,
        description:
          `State ${state}, symbol '${sym}':\n` +
          `ε-closure(${state}) = {${closureArr.join(', ')}}\n` +
          `move({${closureArr.join(', ')}}, '${sym}') = {${Array.from(moved).sort().join(', ')}}\n` +
          `ε-closure({${Array.from(moved).sort().join(', ')}}) = {${resultArr.join(', ')}}\n` +
          `Added transitions: ${state} --'${sym}'--> {${resultArr.join(', ')}}`,
        currentStateSet: closureArr,
        symbol: sym,
        reachableStates: Array.from(moved).sort(),
        resultStateSet: resultArr,
        highlightedStates: [state, ...resultArr],
        ruleApplied: 'δ\'(q, a) = ε-closure(move(ε-closure(q), a))',
      });
    }

    // Initialize entry in nfaTransitions if not present
    if (!nfaTransitions.has(state)) {
      nfaTransitions.set(state, new Map());
    }
  }

  const nfa: FormalAutomaton = {
    kind: 'NFA',
    states: nfaStates,
    alphabet,
    transitions: nfaTransitions,
    startState: enfa.startState,
    acceptingStates: nfaAccepting,
  };

  steps.push({
    id: nextStepId(),
    title: 'ε-Elimination Complete',
    description:
      `NFA construction complete. All ε-transitions removed.\n` +
      `States: ${Array.from(nfaStates).join(', ')}\n` +
      `Accepting states: ${nfaAccepting.size > 0 ? Array.from(nfaAccepting).sort().join(', ') : '(none)'}\n` +
      `Start state: ${enfa.startState}`,
    partialResult: nfa,
  });

  return {
    success: true,
    sourceKind: 'ENFA',
    targetKind: 'NFA',
    steps,
    result: nfa,
    intermediates: [],
  };
}
