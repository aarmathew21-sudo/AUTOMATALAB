/**
 * Subset Construction Algorithm
 * 
 * Converts an NFA (or ε-NFA with useEpsilonClosure=true) to a DFA.
 * Generates ConversionStep[] recording each algorithmic operation.
 */

import { type FormalAutomaton, type ConversionStep } from '../types/conversion';
import {
  epsilonClosure,
  move,
  setKey,
  isAcceptingSet,
  addTransition,
} from './epsilonClosure';

/** Result of the subset construction algorithm */
export interface SubsetConstructionResult {
  dfa: FormalAutomaton;
  steps: ConversionStep[];
  /** Maps DFA state name → array of NFA state IDs */
  stateSetMap: Map<string, string[]>;
}

let stepCounter = 0;
function nextStepId(): string {
  return `sc_${++stepCounter}_${Date.now()}`;
}

/**
 * Runs subset construction on an NFA or ε-NFA.
 * 
 * @param nfa - The source automaton (NFA or ε-NFA)
 * @param useEpsilonClosure - true for ε-NFA → DFA, false for NFA → DFA
 * @returns DFA + recorded steps
 */
export function subsetConstruction(
  nfa: FormalAutomaton,
  useEpsilonClosure: boolean = false
): SubsetConstructionResult {
  stepCounter = 0;
  const steps: ConversionStep[] = [];

  if (!nfa.startState) {
    return {
      dfa: emptyDFA(nfa.alphabet),
      steps: [{
        id: nextStepId(),
        title: 'No start state',
        description: 'The source automaton has no start state. The resulting DFA accepts no strings.',
      }],
      stateSetMap: new Map()
    };
  }

  // Extract alphabet (non-epsilon symbols)
  const alphabet = new Set<string>(nfa.alphabet);

  // Initial DFA state: ε-closure of NFA start, or just {start}
  const initialSet = useEpsilonClosure
    ? epsilonClosure([nfa.startState], nfa.transitions)
    : new Set([nfa.startState]);

  const initialKey = setKey(initialSet);
  const initialStates = Array.from(initialSet).sort();

  // Track DFA states: key → DFA state name
  const dfaStateMap = new Map<string, string>(); // setKey → dfaStateName
  const stateSetMap = new Map<string, string[]>(); // dfaStateName → [nfa state ids]

  let dfaStateCounter = 0;
  const getDFAName = (key: string, stateSet: string[]): string => {
    if (dfaStateMap.has(key)) return dfaStateMap.get(key)!;
    const name = `D${dfaStateCounter++}`;
    dfaStateMap.set(key, name);
    stateSetMap.set(name, stateSet);
    return name;
  };

  const initialDFAName = getDFAName(initialKey, initialStates);

  // Initialize DFA
  const dfaStates = new Set<string>();
  const dfaTransitions = new Map<string, Map<string, Set<string>>>();
  const dfaAccepting = new Set<string>();

  // Check if initial state is accepting
  if (isAcceptingSet(initialSet, nfa.acceptingStates)) {
    dfaAccepting.add(initialDFAName);
  }

  const worklist: string[] = [initialKey];
  const processed = new Set<string>();

  steps.push({
    id: nextStepId(),
    title: useEpsilonClosure
      ? `Initial DFA state: ε-closure({${nfa.startState}})`
      : `Initial DFA state: {${nfa.startState}}`,
    description: useEpsilonClosure
      ? `The initial DFA state is the ε-closure of the start state of the ε-NFA.\n` +
        `ε-closure({${nfa.startState}}) = {${initialStates.join(', ')}}\n` +
        `This becomes DFA state ${initialDFAName}.` +
        (isAcceptingSet(initialSet, nfa.acceptingStates) ? `\n${initialDFAName} is an accepting state (contains an accepting NFA state).` : '')
      : `The initial DFA state is {${nfa.startState}}.\n` +
        `This becomes DFA state ${initialDFAName}.` +
        (isAcceptingSet(initialSet, nfa.acceptingStates) ? `\n${initialDFAName} is an accepting state.` : ''),
    currentStateSet: initialStates,
    newDFAState: initialDFAName,
    newDFAStateIsAccepting: isAcceptingSet(initialSet, nfa.acceptingStates),
    ruleApplied: useEpsilonClosure ? 'ε-closure of start state' : 'Initial state singleton',
  });

  while (worklist.length > 0) {
    const currentKey = worklist.shift()!;
    if (processed.has(currentKey)) continue;
    processed.add(currentKey);

    const currentDFAName = dfaStateMap.get(currentKey)!;
    const currentNFAStates = stateSetMap.get(currentDFAName)!;
    dfaStates.add(currentDFAName);

    // Process each alphabet symbol
    for (const sym of Array.from(alphabet).sort()) {
      // Compute move(currentSet, sym)
      const moved = move(currentNFAStates, sym, nfa.transitions);

      // Apply ε-closure if needed
      const resultSet = useEpsilonClosure
        ? epsilonClosure(moved, nfa.transitions)
        : moved;

      const resultArr = Array.from(resultSet).sort();
      const resultKey = setKey(resultSet);

      // If dead state (empty), add a dead-state transition
      if (resultSet.size === 0) {
        // Find or create dead state
        const deadKey = '∅';
        if (!dfaStateMap.has(deadKey)) {
          const deadName = getDFAName(deadKey, []);
          dfaStates.add(deadName);
          // Dead state loops on all symbols
        }
        const deadName = dfaStateMap.get(deadKey)!;
        addTransition(dfaTransitions, currentDFAName, sym, deadName);

        steps.push({
          id: nextStepId(),
          title: `${currentDFAName} —${sym}→ ∅ (dead state)`,
          description:
            `From DFA state ${currentDFAName} = {${currentNFAStates.join(', ')}}:\n` +
            `move({${currentNFAStates.join(', ')}}, ${sym}) = ∅ (no NFA states reachable)\n` +
            (useEpsilonClosure ? `ε-closure(∅) = ∅\n` : '') +
            `Transition to dead/trap state ${deadName}.`,
          currentStateSet: currentNFAStates,
          symbol: sym,
          reachableStates: [],
          resultStateSet: [],
          newDFAState: deadName,
          newDFAStateIsAccepting: false,
          highlightedStates: [currentDFAName],
        });
        continue;
      }

      const isNew = !dfaStateMap.has(resultKey);
      const resultDFAName = getDFAName(resultKey, resultArr);
      const isResultAccepting = isAcceptingSet(resultSet, nfa.acceptingStates);

      if (isResultAccepting) {
        dfaAccepting.add(resultDFAName);
      }

      addTransition(dfaTransitions, currentDFAName, sym, resultDFAName);

      steps.push({
        id: nextStepId(),
        title: `${currentDFAName} —${sym}→ ${resultDFAName} = {${resultArr.join(', ')}}`,
        description:
          `From DFA state ${currentDFAName} = {${currentNFAStates.join(', ')}}:\n` +
          `move({${currentNFAStates.join(', ')}}, '${sym}') = {${Array.from(moved).sort().join(', ')}}\n` +
          (useEpsilonClosure && moved.size > 0
            ? `ε-closure({${Array.from(moved).sort().join(', ')}}) = {${resultArr.join(', ')}}\n`
            : '') +
          `${isNew ? `New DFA state ${resultDFAName} = {${resultArr.join(', ')}}` : `DFA state ${resultDFAName} already exists`}` +
          (isResultAccepting ? `\n${resultDFAName} is an accepting state.` : ''),
        currentStateSet: currentNFAStates,
        symbol: sym,
        reachableStates: Array.from(moved).sort(),
        resultStateSet: resultArr,
        newDFAState: isNew ? resultDFAName : undefined,
        newDFAStateIsAccepting: isNew ? isResultAccepting : undefined,
        highlightedStates: [currentDFAName],
        ruleApplied: useEpsilonClosure ? 'ε-closure(move(S, a))' : 'move(S, a)',
      });

      if (isNew) {
        worklist.push(resultKey);
      }
    }
  }

  // Also ensure dead state has self-loops if it was created
  const deadKey = '∅';
  if (dfaStateMap.has(deadKey)) {
    const deadName = dfaStateMap.get(deadKey)!;
    dfaStates.add(deadName);
    for (const sym of alphabet) {
      addTransition(dfaTransitions, deadName, sym, deadName);
    }
  }

  // Initialize transition map for all states
  for (const s of dfaStates) {
    if (!dfaTransitions.has(s)) {
      dfaTransitions.set(s, new Map());
    }
  }

  // Build state labels map (DFA state → "D0 = {q0, q1}")
  const stateLabels = new Map<string, string>();
  for (const [name, nfaStates] of stateSetMap.entries()) {
    stateLabels.set(name, `${name} = {${nfaStates.join(', ')}}`);
  }

  const dfa: FormalAutomaton = {
    kind: 'DFA',
    states: dfaStates,
    alphabet,
    transitions: dfaTransitions,
    startState: initialDFAName,
    acceptingStates: dfaAccepting,
    stateLabels,
    stateSetMap,
  };

  steps.push({
    id: nextStepId(),
    title: 'Subset Construction Complete',
    description:
      `The DFA has been fully constructed.\n` +
      `States: ${Array.from(dfaStates).sort().join(', ')}\n` +
      `Accepting states: ${dfaAccepting.size > 0 ? Array.from(dfaAccepting).sort().join(', ') : '(none)'}\n` +
      `Start state: ${initialDFAName}\n` +
      `Total transitions: ${countTransitions(dfaTransitions)}`,
    partialResult: dfa,
  });

  return { dfa, steps, stateSetMap };
}

function countTransitions(transitions: Map<string, Map<string, Set<string>>>): number {
  let count = 0;
  for (const symMap of transitions.values()) {
    for (const targets of symMap.values()) {
      count += targets.size;
    }
  }
  return count;
}

function emptyDFA(alphabet: Set<string>): FormalAutomaton {
  return {
    kind: 'DFA',
    states: new Set(),
    alphabet,
    transitions: new Map(),
    startState: null,
    acceptingStates: new Set(),
  };
}
