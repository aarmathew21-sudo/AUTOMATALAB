import { type FormalAutomaton, type ConversionStep } from '../types/conversion';

export function reduceNFA(nfa: FormalAutomaton): { nfa: FormalAutomaton; steps: ConversionStep[] } {
  const steps: ConversionStep[] = [];
  const result = cloneNFA(nfa);

  const reachable = new Set<string>();
  if (result.startState) {
    const queue = [result.startState];
    reachable.add(result.startState);
    
    while (queue.length > 0) {
      const curr = queue.shift()!;
      const symbolMap = result.transitions.get(curr);
      if (symbolMap) {
        for (const targets of symbolMap.values()) {
          for (const target of targets) {
            if (!reachable.has(target)) {
              reachable.add(target);
              queue.push(target);
            }
          }
        }
      }
    }
  }

  const unreachable = [...result.states].filter(s => !reachable.has(s));
  if (unreachable.length > 0) {
    unreachable.forEach(s => removeState(result, s));
    steps.push({
      id: `red_unreach_${Date.now()}`,
      title: 'Remove Unreachable States',
      description: `Removed ${unreachable.length} state(s) that cannot be reached from the start state: ${unreachable.join(', ')}`,
      ruleApplied: 'Reachability Pruning'
    });
  }

  const reverseTransitions = new Map<string, Set<string>>();
  for (const [src, symbolMap] of result.transitions.entries()) {
    for (const targets of symbolMap.values()) {
      for (const tgt of targets) {
        if (!reverseTransitions.has(tgt)) reverseTransitions.set(tgt, new Set());
        reverseTransitions.get(tgt)!.add(src);
      }
    }
  }

  const live = new Set<string>(result.acceptingStates);
  const liveQueue = [...result.acceptingStates];
  
  while (liveQueue.length > 0) {
    const curr = liveQueue.shift()!;
    const sources = reverseTransitions.get(curr);
    if (sources) {
      for (const src of sources) {
        if (!live.has(src)) {
          live.add(src);
          liveQueue.push(src);
        }
      }
    }
  }

  const dead = [...result.states].filter(s => !live.has(s));
  if (dead.length > 0) {
    dead.forEach(s => removeState(result, s));
    steps.push({
      id: `red_dead_${Date.now()}`,
      title: 'Remove Dead States',
      description: `Removed ${dead.length} state(s) that can never reach an accepting state: ${dead.join(', ')}`,
      ruleApplied: 'Liveness Pruning'
    });
  }

  let mergedAny = false;
  let changed = true;
  let mergeCount = 0;

  while (changed) {
    changed = false;
    const stateList = [...result.states];

    for (let i = 0; i < stateList.length; i++) {
      for (let j = i + 1; j < stateList.length; j++) {
        const u = stateList[i];
        const v = stateList[j];

        if (!result.states.has(u) || !result.states.has(v)) continue;

        if (areDuplicates(result, u, v)) {
          let survivor = u;
          let duplicate = v;
          if (result.startState === v) {
            survivor = v;
            duplicate = u;
          }

          mergeStates(result, survivor, duplicate);
          changed = true;
          mergedAny = true;
          mergeCount++;
        }
      }
    }
  }

  if (mergedAny) {
    steps.push({
      id: `red_dup_${Date.now()}`,
      title: 'Merge Duplicate States',
      description: `Merged ${mergeCount} redundant state pair(s) that possessed identical transitions and accepting statuses.`,
      ruleApplied: 'Duplicate State Merging'
    });
  }

  return { nfa: result, steps };
}

function cloneNFA(nfa: FormalAutomaton): FormalAutomaton {
  const newTransitions = new Map<string, Map<string, Set<string>>>();
  for (const [src, symbolMap] of nfa.transitions.entries()) {
    const newSymbolMap = new Map<string, Set<string>>();
    for (const [sym, targets] of symbolMap.entries()) {
      newSymbolMap.set(sym, new Set(targets));
    }
    newTransitions.set(src, newSymbolMap);
  }

  return {
    kind: nfa.kind,
    states: new Set(nfa.states),
    alphabet: new Set(nfa.alphabet),
    transitions: newTransitions,
    startState: nfa.startState,
    acceptingStates: new Set(nfa.acceptingStates),
    stateLabels: nfa.stateLabels ? new Map(nfa.stateLabels) : undefined,
    stateSetMap: nfa.stateSetMap ? new Map(nfa.stateSetMap) : undefined,
  };
}

function removeState(nfa: FormalAutomaton, stateToRemove: string) {
  nfa.states.delete(stateToRemove);
  nfa.acceptingStates.delete(stateToRemove);
  nfa.transitions.delete(stateToRemove);
  if (nfa.startState === stateToRemove) {
    nfa.startState = null;
  }

  for (const symbolMap of nfa.transitions.values()) {
    for (const targets of symbolMap.values()) {
      targets.delete(stateToRemove);
    }
  }
}

function areDuplicates(nfa: FormalAutomaton, u: string, v: string): boolean {
  if (nfa.acceptingStates.has(u) !== nfa.acceptingStates.has(v)) return false;

  const transU = nfa.transitions.get(u);
  const transV = nfa.transitions.get(v);

  for (const symbol of nfa.alphabet) {
    const targetsU = transU?.get(symbol) || new Set<string>();
    const targetsV = transV?.get(symbol) || new Set<string>();
    
    if (targetsU.size !== targetsV.size) return false;
    for (const target of targetsU) {
      if (!targetsV.has(target)) return false;
    }
  }

  return true;
}

function mergeStates(nfa: FormalAutomaton, survivor: string, duplicate: string) {
  nfa.states.delete(duplicate);
  nfa.acceptingStates.delete(duplicate);
  nfa.transitions.delete(duplicate);

  for (const symbolMap of nfa.transitions.values()) {
    for (const targets of symbolMap.values()) {
      if (targets.has(duplicate)) {
        targets.delete(duplicate);
        targets.add(survivor);
      }
    }
  }
}