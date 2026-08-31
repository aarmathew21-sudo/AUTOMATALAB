/**
 * State Elimination Algorithm — DFA/GNFA → Regular Expression
 * 
 * Converts a DFA to a regular expression via the GNFA (Generalized NFA) method.
 * 
 * Algorithm:
 * 1. Add a new start state s_new → original start (via ε)
 * 2. Add a new final state f_new ← all original accepting states (via ε)
 * 3. Merge all transitions to produce regex-labeled GNFA
 * 4. Eliminate states one at a time (not s_new or f_new):
 *    For each pair (i, j): R_ij := R_ij | R_ik (R_kk)* R_kj
 * 5. The label on the edge s_new → f_new is the final regex
 */

import {
  type RegexNode,
  emptyNode,
  epsilonNode,
  symNode,
  unionNode,
  concatNode,
  starNode,
  toRegexString,
} from '../regex/ast';
import { type FormalAutomaton, type ConversionStep, EPSILON } from '../types/conversion';

let stepCounter = 0;
function nextStepId(): string {
  return `se_${++stepCounter}_${Date.now()}`;
}

export interface StateEliminationResult {
  regex: RegexNode;
  regexString: string;
  steps: ConversionStep[];
}

/**
 * GNFA transition table: (from, to) → RegexNode
 */
type GNFATable = Map<string, Map<string, RegexNode>>;

function getEdge(table: GNFATable, from: string, to: string): RegexNode {
  return table.get(from)?.get(to) ?? emptyNode();
}

function setEdge(table: GNFATable, from: string, to: string, regex: RegexNode): void {
  if (!table.has(from)) table.set(from, new Map());
  table.get(from)!.set(to, regex);
}

/**
 * Combines two regex nodes as a union (R|S), simplifying if one is empty.
 */
function regexUnion(a: RegexNode, b: RegexNode): RegexNode {
  return unionNode(a, b);
}

/**
 * Combines two regex nodes as concatenation (RS).
 */
function regexConcat(a: RegexNode, b: RegexNode): RegexNode {
  return concatNode(a, b);
}

/**
 * Converts a DFA to a regular expression using state elimination.
 */
export function stateElimination(dfa: FormalAutomaton): StateEliminationResult {
  stepCounter = 0;
  const steps: ConversionStep[] = [];

  const NEW_START = '__start__';
  const NEW_FINAL = '__final__';

  if (!dfa.startState || dfa.states.size === 0) {
    const regex = emptyNode();
    steps.push({
      id: nextStepId(),
      title: 'Empty Automaton',
      description: 'The automaton has no states. The resulting regex is ∅ (empty language).',
      partialRegex: '∅',
    });
    return { regex, regexString: '∅', steps };
  }

  // Build GNFA transition table
  const table: GNFATable = new Map();
  const gnfaStates = new Set<string>([NEW_START, ...dfa.states, NEW_FINAL]);

  // Initialize all edges to ∅
  for (const s of gnfaStates) {
    for (const t of gnfaStates) {
      setEdge(table, s, t, emptyNode());
    }
  }

  // Add ε from NEW_START to DFA start
  setEdge(table, NEW_START, dfa.startState, epsilonNode());

  // Add ε from all accepting DFA states to NEW_FINAL
  for (const acc of dfa.acceptingStates) {
    setEdge(table, acc, NEW_FINAL, epsilonNode());
  }

  // Copy DFA transitions into GNFA (merge with union if multiple)
  for (const [from, symMap] of dfa.transitions.entries()) {
    for (const [sym, targets] of symMap.entries()) {
      if (sym === EPSILON) continue; // DFAs don't have ε, but just in case
      for (const to of targets) {
        const existing = getEdge(table, from, to);
        const label: RegexNode = sym === EPSILON ? epsilonNode() : symNode(sym);
        setEdge(table, from, to, regexUnion(existing, label));
      }
    }
  }

  steps.push({
    id: nextStepId(),
    title: 'Build GNFA',
    description:
      `Convert the DFA to a Generalized NFA (GNFA):\n` +
      `• Added new start state ${NEW_START} → ${dfa.startState} (via ε)\n` +
      `• Added new final state ${NEW_FINAL} ← each accepting state (via ε)\n` +
      `• DFA transitions become regex-labeled edges\n` +
      `• All other pairs: ∅\n\n` +
      `States to eliminate: ${Array.from(dfa.states).join(', ')}`,
    ruleApplied: 'GNFA construction',
  });

  // Eliminate DFA states one by one (not NEW_START or NEW_FINAL)
  const eliminationOrder = Array.from(dfa.states);

  for (const qrip of eliminationOrder) {
    const loop = getEdge(table, qrip, qrip);  // R_kk
    const loopStar = starNode(loop);           // (R_kk)*

    const updatedTransitions: Array<{ from: string; to: string; oldRegex: string; newRegex: string }> = [];

    // For all other state pairs (i, j) — i ≠ qrip, j ≠ qrip
    for (const qi of gnfaStates) {
      if (qi === qrip) continue;
      for (const qj of gnfaStates) {
        if (qj === qrip) continue;

        const Rij = getEdge(table, qi, qj);     // R_ij
        const Rik = getEdge(table, qi, qrip);   // R_ik
        const Rkj = getEdge(table, qrip, qj);   // R_kj

        // Skip if there's no path through qrip
        if (Rik.type === 'Empty' && Rij.type === 'Empty') continue;
        if (Rik.type === 'Empty') continue; // No incoming path through qrip

        // R_ij := R_ij | R_ik (R_kk)* R_kj
        const newPath = regexConcat(regexConcat(Rik, loopStar), Rkj);
        const newRij = regexUnion(Rij, newPath);

        const oldStr = toRegexString(Rij);
        const newStr = toRegexString(newRij);

        setEdge(table, qi, qj, newRij);
        updatedTransitions.push({ from: qi, to: qj, oldRegex: oldStr, newRegex: newStr });
      }
    }

    // Remove qrip from GNFA
    gnfaStates.delete(qrip);
    table.delete(qrip);
    for (const row of table.values()) {
      row.delete(qrip);
    }

    steps.push({
      id: nextStepId(),
      title: `Eliminate state: ${qrip}`,
      description:
        `Eliminating state ${qrip}:\n` +
        `Self-loop: ${toRegexString(loop)}\n` +
        `For each pair (i, j): R_ij := R_ij | R_i${qrip} · (${toRegexString(loop)})* · R_${qrip}j\n\n` +
        (updatedTransitions.length > 0
          ? `Updated edges:\n` + updatedTransitions.map(u =>
              `  (${u.from} → ${u.to}): ${u.oldRegex} → ${u.newRegex}`
            ).join('\n')
          : `No edges updated (${qrip} was unreachable or had no outgoing connections to non-eliminated states).`),
      eliminatedState: qrip,
      updatedTransitions,
      ruleApplied: 'R_ij := R_ij | R_ik(R_kk)*R_kj',
      partialRegex: toRegexString(getEdge(table, NEW_START, NEW_FINAL)),
    });
  }

  // The final regex is the label from NEW_START to NEW_FINAL
  const finalRegex = getEdge(table, NEW_START, NEW_FINAL);
  const finalRegexString = toRegexString(finalRegex);

  steps.push({
    id: nextStepId(),
    title: 'State Elimination Complete',
    description:
      `All states eliminated.\n` +
      `The regex label from ${NEW_START} to ${NEW_FINAL} is the final result:\n\n` +
      `  ${finalRegexString}`,
    partialRegex: finalRegexString,
    ruleApplied: 'Final regex extraction',
  });

  return {
    regex: finalRegex,
    regexString: finalRegexString,
    steps,
  };
}
