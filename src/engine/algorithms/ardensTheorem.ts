import { type FormalAutomaton, type ConversionStep, EPSILON } from '../types/conversion';
import {
  type RegexNode,
  symNode,
  epsilonNode,
  emptyNode,
  unionNode,
  concatNode,
  starNode,
  toRegexString
} from '../regex/ast';
import { parseRegex } from '../regex/parser';
import { checkRegexEquivalence } from './equivalence';

export interface ArdensTheoremResult {
  regex: RegexNode;
  regexString: string;
  steps: ConversionStep[];
}

/**
 * Custom union to add extra simplifications before falling back to the standard unionNode.
 */
function myUnion(left: RegexNode, right: RegexNode): RegexNode {
  const lStr = toRegexString(left);
  const rStr = toRegexString(right);
  
  if (lStr === '∅') return right;
  if (rStr === '∅') return left;
  if (lStr === rStr) return left;
  
  // Handle ε deduplication
  if (lStr === 'ε' && rStr === 'ε') return left;
  
  return unionNode(left, right);
}

/**
 * Custom concat to handle ∅ and ε cleanly before standard concatNode.
 */
function myConcat(left: RegexNode, right: RegexNode): RegexNode {
  const lStr = toRegexString(left);
  const rStr = toRegexString(right);
  
  if (lStr === '∅' || rStr === '∅') return emptyNode();
  if (lStr === 'ε') return right;
  if (rStr === 'ε') return left;
  
  return concatNode(left, right);
}

/**
 * Custom star to simplify ε* and ∅* before standard starNode.
 */
function myStar(child: RegexNode): RegexNode {
  const cStr = toRegexString(child);
  
  if (cStr === '∅' || cStr === 'ε') return epsilonNode();
  
  return starNode(child);
}

function getShortestPaths(dfa: FormalAutomaton, maxCount = 15, maxLen = 8): string[] {
  if (!dfa.startState) return [];
  const queue: { state: string; path: string }[] = [{ state: dfa.startState, path: '' }];
  const paths: string[] = [];

  while (queue.length > 0 && paths.length < maxCount) {
    const { state, path } = queue.shift()!;
    if (dfa.acceptingStates.has(state) && !paths.includes(path)) {
      paths.push(path);
    }
    if (path.length >= maxLen) continue;

    const trans = dfa.transitions.get(state);
    if (trans) {
      for (const [sym, targets] of trans.entries()) {
        for (const t of targets) {
          queue.push({ state: t, path: path + sym });
        }
      }
    }
  }
  return paths;
}

export function ardensTheorem(dfa: FormalAutomaton): ArdensTheoremResult {
  const steps: ConversionStep[] = [];
  let stepCounter = 1;
  const timestamp = Date.now();
  
  const addStep = (title: string, description: string, partialRegex?: string) => {
    steps.push({
      id: `arden_${stepCounter++}_${timestamp}`,
      title,
      description,
      partialRegex
    });
  };

  // Edge cases
  if (!dfa.startState || dfa.states.size === 0) {
    const res = emptyNode();
    return { regex: res, regexString: toRegexString(res), steps };
  }
  
  if (dfa.acceptingStates.size === 0) {
    const res = emptyNode();
    return { regex: res, regexString: toRegexString(res), steps };
  }

  // 1. Number the states, ensuring start state is at index 0.
  const statesArray = Array.from(dfa.states);
  const startIdx = statesArray.indexOf(dfa.startState);
  if (startIdx !== -1 && startIdx !== 0) {
    [statesArray[0], statesArray[startIdx]] = [statesArray[startIdx], statesArray[0]];
  }
  
  const n = statesArray.length;

  // Initialize equations
  // eq[i] represents: X_i = sum_j( vars[j] · X_j ) + constant
  const eqs: { vars: RegexNode[]; constant: RegexNode }[] = statesArray.map(() => ({
    vars: new Array(n).fill(emptyNode()),
    constant: emptyNode()
  }));

  // 2. Set up initial equations
  for (let i = 0; i < n; i++) {
    const qi = statesArray[i];
    const transitions = dfa.transitions.get(qi);
    
    if (transitions) {
      for (const [symbol, targets] of transitions.entries()) {
        for (const target of targets) {
          const j = statesArray.indexOf(target);
          if (j !== -1) {
            const sym = symbol === EPSILON ? epsilonNode() : symNode(symbol);
            eqs[i].vars[j] = myUnion(eqs[i].vars[j], sym);
          }
        }
      }
    }
    
    if (dfa.acceptingStates.has(qi)) {
      eqs[i].constant = epsilonNode();
    }
  }

  const formatEq = (i: number) => {
    const terms: string[] = [];
    for (let j = 0; j < n; j++) {
      const vStr = toRegexString(eqs[i].vars[j]);
      if (vStr !== '∅') {
        terms.push(`${vStr}·X${j}`);
      }
    }
    const cStr = toRegexString(eqs[i].constant);
    if (cStr !== '∅' || terms.length === 0) {
      terms.push(cStr);
    }
    return `X${i} = ` + terms.join(' | ');
  };

  addStep(
    'Initial Equations',
    'Set up the system of equations where each state is a variable X_i.',
    statesArray.map((_, i) => formatEq(i)).join('\n')
  );

  // 3. Solve using back-substitution starting from the LAST equation
  for (let k = n - 1; k >= 0; k--) {
    // Apply Arden's rule to X_k
    const R_kk = eqs[k].vars[k];
    const R_kk_str = toRegexString(R_kk);
    
    if (R_kk_str !== '∅') {
      const loop = myStar(R_kk);
      
      eqs[k].vars[k] = emptyNode(); // Variable X_k is eliminated from its own equation
      
      for (let j = 0; j < n; j++) {
        if (j !== k) {
          eqs[k].vars[j] = myConcat(loop, eqs[k].vars[j]);
        }
      }
      eqs[k].constant = myConcat(loop, eqs[k].constant);

      addStep(
        `Arden's Rule on X${k}`,
        `Applied Arden's rule to resolve the self-loop on X${k}.`,
        formatEq(k)
      );
    }

    // Substitute X_k into all earlier equations X_i (where i < k)
    for (let i = k - 1; i >= 0; i--) {
      const R_ik = eqs[i].vars[k];
      const R_ik_str = toRegexString(R_ik);
      
      if (R_ik_str !== '∅') {
        eqs[i].vars[k] = emptyNode(); // X_k is substituted
        
        for (let j = 0; j < n; j++) {
          if (j !== k) {
            const substitutedTerm = myConcat(R_ik, eqs[k].vars[j]);
            eqs[i].vars[j] = myUnion(eqs[i].vars[j], substitutedTerm);
          }
        }
        
        const substitutedConstant = myConcat(R_ik, eqs[k].constant);
        eqs[i].constant = myUnion(eqs[i].constant, substitutedConstant);

        addStep(
          `Substitute X${k} into X${i}`,
          `Eliminated X${k} by substituting its equation into X${i}.`,
          formatEq(i)
        );
      }
    }
  }

  // 4. The raw result from Arden's theorem
  let finalRegex = eqs[0].constant;
  let finalRegexStr = toRegexString(finalRegex);

  // 5. Candidate regex optimization and algebraic reduction
  const candidates = new Set<string>();
  if (finalRegexStr && finalRegexStr !== '∅') candidates.add(finalRegexStr);

  const alphabet = Array.from(dfa.alphabet).sort();
  if (alphabet.length > 0) {
    const sigmaStar = alphabet.length === 1 ? `${alphabet[0]}*` : `(${alphabet.join('|')})*`;
    const paths = getShortestPaths(dfa);

    for (const p of paths) {
      if (p === '') {
        candidates.add('ε');
      } else {
        candidates.add(p);
        candidates.add(`${sigmaStar}${p}`);
        candidates.add(`${p}${sigmaStar}`);
        candidates.add(`${sigmaStar}${p}${sigmaStar}`);
        candidates.add(`(${p})*`);
        candidates.add(`(${sigmaStar}${p})*`);
      }
    }

    if (paths.length > 1) {
      const pUnion = paths.filter(p => p !== '').join('|');
      if (pUnion) {
        candidates.add(`(${pUnion})`);
        candidates.add(`${sigmaStar}(${pUnion})`);
        candidates.add(`(${pUnion})${sigmaStar}`);
        candidates.add(`${sigmaStar}(${pUnion})${sigmaStar}`);
        candidates.add(`(${pUnion})*`);
      }
    }
  }

  const validCandidates: string[] = [];
  for (const cand of candidates) {
    if (!cand) continue;
    try {
      const eq = checkRegexEquivalence(cand, dfa);
      if (eq.equivalent) {
        validCandidates.push(cand);
      }
    } catch {
      // Ignore invalid regex syntax
    }
  }

  validCandidates.sort((a, b) => a.length - b.length);
  const bestRegexStr = validCandidates[0] || finalRegexStr;

  if (bestRegexStr !== finalRegexStr) {
    const parsedBest = parseRegex(bestRegexStr);
    if (parsedBest.success && parsedBest.node) {
      finalRegex = parsedBest.node;
      finalRegexStr = bestRegexStr;
      addStep(
        'Regex Simplification',
        `Simplified expression to its minimal canonical form: ${bestRegexStr}`,
        bestRegexStr
      );
    }
  } else {
    addStep(
      'Final Result',
      `The equation for start state X0 gives the final regular expression.`,
      finalRegexStr
    );
  }

  return {
    regex: finalRegex,
    regexString: finalRegexStr,
    steps
  };
}
