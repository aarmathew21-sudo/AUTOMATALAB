import { type FormalAutomaton, type ConversionStep } from '../types/conversion';
import { addTransition } from './epsilonClosure';

export interface MinimizationResult {
  minimizedDFA: FormalAutomaton;
  steps: ConversionStep[];
}

export function minimizeDFA(dfa: FormalAutomaton): MinimizationResult {
  const steps: ConversionStep[] = [];
  let stepCounter = 1;

  const createStepId = () => `min_${stepCounter++}_${Date.now()}`;

  // 1. Remove unreachable states
  const reachableStates = new Set<string>();
  const queue: string[] = [];
  if (dfa.startState) {
    reachableStates.add(dfa.startState);
    queue.push(dfa.startState);
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const stateTransitions = dfa.transitions.get(current);
    if (stateTransitions) {
      for (const targets of stateTransitions.values()) {
        for (const target of targets) {
          if (!reachableStates.has(target)) {
            reachableStates.add(target);
            queue.push(target);
          }
        }
      }
    }
  }

  const unreachable = new Set([...dfa.states].filter((s) => !reachableStates.has(s)));
  if (unreachable.size > 0) {
    steps.push({
      id: createStepId(),
      title: 'Remove Unreachable States',
      description: `Removed ${unreachable.size} unreachable states: ${Array.from(unreachable).join(', ')}`,
      ruleApplied: 'unreachable_removal'
    });
  }

  const activeStates = new Set(reachableStates);
  const activeAccepting = new Set([...dfa.acceptingStates].filter(s => activeStates.has(s)));
  const activeNonAccepting = new Set([...activeStates].filter(s => !activeAccepting.has(s)));

  if (activeStates.size <= 1 && unreachable.size === 0) {
    steps.push({
      id: createStepId(),
      title: 'DFA is already minimal',
      description: `The DFA has ${activeStates.size} reachable states.`,
      ruleApplied: 'already_minimal'
    });
    return { minimizedDFA: dfa, steps };
  }

  // Ensure DFA is complete for Hopcroft. Add a dead state if needed.
  const alphabet = Array.from(dfa.alphabet);
  let needsDeadState = false;
  for (const state of activeStates) {
    const stateTransitions = dfa.transitions.get(state);
    for (const symbol of alphabet) {
      if (!stateTransitions || !stateTransitions.has(symbol) || stateTransitions.get(symbol)!.size === 0) {
        needsDeadState = true;
        break;
      }
    }
    if (needsDeadState) break;
  }

  let deadState = 'DEAD';
  while (activeStates.has(deadState)) deadState += '_';

  if (needsDeadState) {
    activeStates.add(deadState);
    activeNonAccepting.add(deadState);
  }

  // 2. Initial partition
  let partitions: Set<string>[] = [];
  if (activeAccepting.size > 0) partitions.push(activeAccepting);
  if (activeNonAccepting.size > 0) partitions.push(activeNonAccepting);

  // 3. Refinement loop
  let partitionsChanged = true;
  while (partitionsChanged) {
    partitionsChanged = false;
    const newPartitions: Set<string>[] = [];

    for (const partition of partitions) {
      if (partition.size <= 1) {
        newPartitions.push(partition);
        continue;
      }

      const subGroups = new Map<string, Set<string>>();

      for (const state of partition) {
        let signature = '';
        const stateTransitions = dfa.transitions.get(state);
        
        for (const symbol of alphabet) {
          let target = needsDeadState ? deadState : null;
          if (stateTransitions && stateTransitions.has(symbol) && stateTransitions.get(symbol)!.size > 0) {
            target = Array.from(stateTransitions.get(symbol)!)[0];
          } else if (state === deadState) {
            target = deadState;
          }

          if (target === null) target = deadState;

          let targetPartitionIndex = -1;
          for (let i = 0; i < partitions.length; i++) {
            if (partitions[i].has(target!)) {
              targetPartitionIndex = i;
              break;
            }
          }
          signature += `${targetPartitionIndex},`;
        }

        if (!subGroups.has(signature)) {
          subGroups.set(signature, new Set<string>());
        }
        subGroups.get(signature)!.add(state);
      }

      if (subGroups.size > 1) {
        partitionsChanged = true;
        for (const subGroup of subGroups.values()) {
          newPartitions.push(subGroup);
        }
        steps.push({
          id: createStepId(),
          title: 'Split Partition',
          description: `Partition {${Array.from(partition).join(', ')}} split into ${subGroups.size} groups.`,
          ruleApplied: 'partition_refinement'
        });
      } else {
        newPartitions.push(partition);
      }
    }
    partitions = newPartitions;
  }

  // 5. Check if already minimal
  let isMinimal = false;
  if (!needsDeadState && partitions.length === reachableStates.size) isMinimal = true;
  if (needsDeadState && partitions.length === reachableStates.size + 1) isMinimal = true;

  if (isMinimal && unreachable.size === 0) {
    steps.push({
      id: createStepId(),
      title: 'DFA is already minimal',
      description: `The DFA already has the minimal number of states (${reachableStates.size}).`,
      ruleApplied: 'already_minimal'
    });
    return { minimizedDFA: dfa, steps };
  }

  // 4. Build minimized DFA
  const minimizedDFA: FormalAutomaton = {
    kind: 'DFA',
    states: new Set<string>(),
    alphabet: new Set(dfa.alphabet),
    transitions: new Map(),
    startState: null,
    acceptingStates: new Set<string>(),
    stateLabels: new Map(),
    stateSetMap: new Map()
  };

  const partitionToName = new Map<Set<string>, string>();
  let stateCounter = 0;
  for (const partition of partitions) {
    const name = `m${stateCounter++}`;
    partitionToName.set(partition, name);
    minimizedDFA.states.add(name);
    
    if (dfa.startState && partition.has(dfa.startState)) {
      minimizedDFA.startState = name;
    }
    
    let isAccepting = false;
    for (const state of partition) {
      if (dfa.acceptingStates.has(state)) {
        isAccepting = true;
        break;
      }
    }
    if (isAccepting) minimizedDFA.acceptingStates.add(name);

    minimizedDFA.stateLabels!.set(name, Array.from(partition).join(','));
    minimizedDFA.stateSetMap!.set(name, Array.from(partition));
  }

  for (const partition of partitions) {
    const fromName = partitionToName.get(partition)!;
    const rep = Array.from(partition)[0];
    const repTransitions = dfa.transitions.get(rep);

    for (const symbol of alphabet) {
      let target = needsDeadState ? deadState : null;
      if (rep === deadState) {
        target = deadState;
      } else if (repTransitions && repTransitions.has(symbol) && repTransitions.get(symbol)!.size > 0) {
        target = Array.from(repTransitions.get(symbol)!)[0];
      }
      
      if (target === null) target = deadState;

      let targetPartition = null;
      for (const p of partitions) {
        if (p.has(target!)) {
          targetPartition = p;
          break;
        }
      }
      
      if (targetPartition) {
        const toName = partitionToName.get(targetPartition)!;
        addTransition(minimizedDFA.transitions, fromName, symbol, toName);
      }
    }
  }

  // 6. Record final step
  steps.push({
    id: createStepId(),
    title: 'Minimized DFA Created',
    description: `Minimized DFA has ${minimizedDFA.states.size} states (from original ${dfa.states.size} states).`,
    ruleApplied: 'build_minimized',
    partialResult: minimizedDFA
  });

  return { minimizedDFA, steps };
}
