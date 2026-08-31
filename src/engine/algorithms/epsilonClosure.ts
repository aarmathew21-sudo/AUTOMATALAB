/**
 * Epsilon Closure Algorithm
 * 
 * Core algorithms for computing ε-closures and symbol moves,
 * used by both ε-NFA → NFA and ε-NFA → DFA conversions.
 */

import { EPSILON, type FormalAutomaton } from '../types/conversion';

/**
 * Computes the ε-closure of a set of states.
 * 
 * ε-closure(S) = the set of all states reachable from any state in S
 *                using zero or more ε-transitions.
 * 
 * Algorithm: BFS/DFS on ε-transitions.
 */
export function epsilonClosure(
  stateIds: Iterable<string>,
  transitions: Map<string, Map<string, Set<string>>>
): Set<string> {
  const closure = new Set<string>();
  const queue: string[] = [];

  for (const s of stateIds) {
    if (!closure.has(s)) {
      closure.add(s);
      queue.push(s);
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const stateTrans = transitions.get(current);
    if (!stateTrans) continue;

    const epsilonTargets = stateTrans.get(EPSILON);
    if (!epsilonTargets) continue;

    for (const target of epsilonTargets) {
      if (!closure.has(target)) {
        closure.add(target);
        queue.push(target);
      }
    }
  }

  return closure;
}

/**
 * Computes the set of states reachable from a set of states
 * on a single input symbol (without ε-transitions).
 * 
 * move(S, a) = ∪ { δ(q, a) | q ∈ S }
 */
export function move(
  stateIds: Iterable<string>,
  symbol: string,
  transitions: Map<string, Map<string, Set<string>>>
): Set<string> {
  const result = new Set<string>();

  for (const s of stateIds) {
    const stateTrans = transitions.get(s);
    if (!stateTrans) continue;

    const targets = stateTrans.get(symbol);
    if (!targets) continue;

    for (const t of targets) {
      result.add(t);
    }
  }

  return result;
}

/**
 * Computes ε-closure(move(S, a)) in one step.
 * Used in subset construction for ε-NFAs.
 */
export function epsilonMove(
  stateIds: Iterable<string>,
  symbol: string,
  transitions: Map<string, Map<string, Set<string>>>
): Set<string> {
  const moved = move(stateIds, symbol, transitions);
  return epsilonClosure(moved, transitions);
}

/**
 * Returns a sorted, canonical string key for a set of state IDs.
 * Used to identify DFA states in subset construction.
 */
export function setKey(states: Iterable<string>): string {
  const arr = Array.from(states).sort();
  return arr.length === 0 ? '∅' : `{${arr.join(',')}}`;
}

/**
 * Extracts all non-epsilon symbols used in an automaton's transitions.
 */
export function extractAlphabet(
  transitions: Map<string, Map<string, Set<string>>>
): Set<string> {
  const alphabet = new Set<string>();
  for (const symMap of transitions.values()) {
    for (const sym of symMap.keys()) {
      if (sym !== EPSILON) {
        alphabet.add(sym);
      }
    }
  }
  return alphabet;
}

/**
 * Checks if a set of states contains any accepting state from the original automaton.
 */
export function isAcceptingSet(
  stateSet: Iterable<string>,
  acceptingStates: Set<string>
): boolean {
  for (const s of stateSet) {
    if (acceptingStates.has(s)) return true;
  }
  return false;
}

/**
 * Creates an empty transition map entry for a state if not present.
 */
export function ensureStateEntry(
  transitions: Map<string, Map<string, Set<string>>>,
  stateId: string
): Map<string, Set<string>> {
  if (!transitions.has(stateId)) {
    transitions.set(stateId, new Map());
  }
  return transitions.get(stateId)!;
}

/**
 * Adds a transition to a transition map.
 */
export function addTransition(
  transitions: Map<string, Map<string, Set<string>>>,
  from: string,
  symbol: string,
  to: string
): void {
  const symMap = ensureStateEntry(transitions, from);
  if (!symMap.has(symbol)) {
    symMap.set(symbol, new Set());
  }
  symMap.get(symbol)!.add(to);
}

/**
 * Simulates whether a FormalAutomaton accepts a given string.
 * Supports DFA, NFA, and ε-NFA.
 */
export function simulateAutomaton(
  automaton: FormalAutomaton,
  input: string
): boolean {
  if (!automaton.startState) return false;

  // Start with ε-closure of start state (handles ENFA and DFA/NFA equally)
  let currentStates = epsilonClosure([automaton.startState], automaton.transitions);

  for (const ch of input) {
    const nextStates = new Set<string>();
    for (const s of currentStates) {
      const symMap = automaton.transitions.get(s);
      if (!symMap) continue;
      const targets = symMap.get(ch);
      if (!targets) continue;
      for (const t of targets) nextStates.add(t);
    }
    // Apply ε-closure after each move
    currentStates = epsilonClosure(nextStates, automaton.transitions);
    
    if (currentStates.size === 0) return false; // trapped
  }

  // Accept if any current state is an accepting state
  for (const s of currentStates) {
    if (automaton.acceptingStates.has(s)) return true;
  }
  return false;
}
