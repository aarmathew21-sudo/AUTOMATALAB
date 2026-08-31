import type { AutomatonState, AutomatonTransition, AutomatonType, SimulationState } from '../types/automata';

export interface SimulationStepResult {
  nextStateIds: string[];
  traversedTransitionId: string | null;
  status: 'running' | 'accepted' | 'rejected';
  finished: boolean;
}

/**
 * Initializes a simulation session for a given input string
 */
export function initSimulation(
  startStateId: string | null,
  inputString: string
): SimulationState {
  if (!startStateId) {
    return {
      isRunning: false,
      inputString,
      currentIndex: 0,
      currentStateIds: [],
      traversedTransitionId: null,
      status: 'rejected',
      history: []
    };
  }

  return {
    isRunning: true,
    inputString,
    currentIndex: 0,
    currentStateIds: [startStateId],
    traversedTransitionId: null,
    status: inputString.length === 0 ? 'idle' : 'running',
    history: []
  };
}

/**
 * Executes a single step of the simulation
 */
export function stepSimulation(
  currentState: SimulationState,
  _states: AutomatonState[],
  transitions: AutomatonTransition[],
  _type: AutomatonType,
  acceptingStateIds: string[]
): SimulationState {
  if (!currentState.isRunning || currentState.currentIndex >= currentState.inputString.length) {
    // Check acceptance
    const isAccepted = currentState.currentStateIds.some(id => acceptingStateIds.includes(id));
    return {
      ...currentState,
      isRunning: false,
      status: isAccepted ? 'accepted' : 'rejected',
      traversedTransitionId: null
    };
  }

  const char = currentState.inputString[currentState.currentIndex];
  const nextStateIdsSet = new Set<string>();
  let lastTransitionId: string | null = null;

  for (const currId of currentState.currentStateIds) {
    const matchingTrans = transitions.filter(
      t => t.from === currId && t.symbols.includes(char)
    );

    for (const trans of matchingTrans) {
      nextStateIdsSet.add(trans.to);
      lastTransitionId = trans.id;
    }
  }

  const nextStateIds = Array.from(nextStateIdsSet);
  const nextIndex = currentState.currentIndex + 1;
  const isEndOfString = nextIndex >= currentState.inputString.length;

  if (nextStateIds.length === 0) {
    // Trapped / rejected
    return {
      ...currentState,
      isRunning: false,
      currentIndex: nextIndex,
      currentStateIds: [],
      traversedTransitionId: null,
      status: 'rejected',
      history: [
        ...currentState.history,
        { stateIds: currentState.currentStateIds, char, transitionId: null }
      ]
    };
  }

  const isAccepted = isEndOfString && nextStateIds.some(id => acceptingStateIds.includes(id));

  return {
    ...currentState,
    isRunning: !isEndOfString,
    currentIndex: nextIndex,
    currentStateIds: nextStateIds,
    traversedTransitionId: lastTransitionId,
    status: isEndOfString ? (isAccepted ? 'accepted' : 'rejected') : 'running',
    history: [
      ...currentState.history,
      { stateIds: currentState.currentStateIds, char, transitionId: lastTransitionId }
    ]
  };
}
