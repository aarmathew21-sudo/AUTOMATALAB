/**
 * Conversion Engine Type Definitions
 * 
 * These types model the input/output of all mathematical conversion algorithms.
 * They are independent of React and Zustand.
 */

export type AutomatonKind = 'DFA' | 'NFA' | 'ENFA' | 'REGEX';

/** Epsilon transition symbol — canonical representation */
export const EPSILON = 'ε';

/**
 * The core formal automaton structure used by all engine algorithms.
 * Represents DFA, NFA, or ε-NFA (ENFA).
 * 
 * Transition map: state → (symbol → Set<state>)
 * For ENFA, symbol can be EPSILON ('ε').
 */
export interface FormalAutomaton {
  kind: AutomatonKind;
  states: Set<string>;
  alphabet: Set<string>; // Does NOT include epsilon even for ENFA
  /** transitions: fromState → symbol → Set<toState> */
  transitions: Map<string, Map<string, Set<string>>>;
  startState: string | null;
  acceptingStates: Set<string>;
  /** Optional human-readable labels: state id → display name */
  stateLabels?: Map<string, string>;
  /** Optional metadata: for subset construction, maps DFA state → set of NFA states */
  stateSetMap?: Map<string, string[]>;
}

/**
 * A single step in a conversion algorithm, corresponding to one
 * concrete algorithmic operation (not just a visual frame).
 */
export interface ConversionStep {
  id: string;
  /** Short title, e.g. "Apply Union Rule" or "Compute ε-closure({q0})" */
  title: string;
  /** Longer explanation of what was mathematically computed in this step */
  description: string;
  /** Which rule was applied (Thompson, subset construction, etc.) */
  ruleApplied?: string;

  // --- For Thompson construction ---
  /** Regex fragment being processed */
  regexFragment?: string;
  /** NFA fragment produced: [startId, endId] */
  fragmentStates?: [string, string];

  // --- For subset construction ---
  /** The NFA/ENFA state set being analyzed */
  currentStateSet?: string[];
  /** The symbol being consumed */
  symbol?: string;
  /** States reachable via that symbol */
  reachableStates?: string[];
  /** After ε-closure, the resulting state set */
  resultStateSet?: string[];
  /** Name of new DFA state created */
  newDFAState?: string;
  /** Whether that new state is accepting */
  newDFAStateIsAccepting?: boolean;

  // --- For state elimination ---
  /** State being eliminated */
  eliminatedState?: string;
  /** Pairs of (from, to) states whose regex labels were updated */
  updatedTransitions?: Array<{ from: string; to: string; oldRegex: string; newRegex: string }>;

  // --- Highlighting ---
  highlightedStates?: string[];
  highlightedTransitions?: string[];

  // --- Snapshot of the partially built result ---
  partialResult?: FormalAutomaton;
  partialRegex?: string;
}

/**
 * The full result of a conversion operation.
 */
export interface ConversionResult {
  success: boolean;
  error?: string;
  sourceKind: AutomatonKind;
  targetKind: AutomatonKind;
  /** All steps in the algorithm, in order */
  steps: ConversionStep[];
  /**
   * The final result.
   * FormalAutomaton when target is DFA/NFA/ENFA.
   * string (regex) when target is REGEX.
   */
  result: FormalAutomaton | string;
  /** Intermediate pipeline stages, e.g. [ENFA, NFA, DFA] for ε-NFA → DFA → Regex */
  intermediates: Array<{
    kind: AutomatonKind;
    value: FormalAutomaton | string;
    label: string; // e.g. "ε-NFA after Thompson"
  }>;
}

/**
 * Result of equivalence checking between two automata/regex.
 */
export interface EquivalenceResult {
  equivalent: boolean;
  /** A string accepted by one but not the other, if not equivalent */
  counterexample?: string;
  /** Which automaton accepted the counterexample: 'source' | 'result' */
  counterexampleAcceptedBy?: 'source' | 'result';
  /** How many strings were tested */
  stringsChecked?: number;
}

/**
 * A saved conversion session that can be persisted to localStorage.
 */
export interface ConversionSession {
  id: string;
  createdAt: string;
  sourceKind: AutomatonKind;
  targetKind: AutomatonKind;
  sourceInput: string | object; // regex string or automaton JSON
  result: ConversionResult;
}
