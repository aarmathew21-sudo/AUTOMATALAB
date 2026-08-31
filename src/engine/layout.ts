/**
 * Automatic Layout for Generated Automata
 * 
 * Implements a layered BFS layout:
 * 1. BFS from start state assigns each state a layer (depth)
 * 2. States in the same layer are distributed vertically
 * 3. Disconnected states fall back to circular layout
 */

import { type FormalAutomaton } from './types/conversion';

export interface LayoutPosition {
  x: number;
  y: number;
}

const LAYER_SPACING = 200;  // horizontal spacing between layers
const STATE_SPACING = 120;  // vertical spacing within a layer
const START_X = 120;        // x offset for first layer
const START_Y = 80;         // y offset for top of layout

/**
 * Computes 2D positions for all states in an automaton.
 * Returns a Map: stateId → {x, y}.
 */
export function layoutAutomaton(
  automaton: FormalAutomaton
): Map<string, LayoutPosition> {
  const positions = new Map<string, LayoutPosition>();
  const states = Array.from(automaton.states);

  if (states.length === 0) return positions;

  // BFS from start state to assign layers
  const layers = new Map<string, number>(); // state → layer index
  const visited = new Set<string>();
  const queue: string[] = [];

  const startState = automaton.startState ?? states[0];
  queue.push(startState);
  visited.add(startState);
  layers.set(startState, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentLayer = layers.get(current)!;

    const symMap = automaton.transitions.get(current);
    if (!symMap) continue;

    for (const targets of symMap.values()) {
      for (const target of targets) {
        if (!visited.has(target) && automaton.states.has(target)) {
          visited.add(target);
          layers.set(target, currentLayer + 1);
          queue.push(target);
        }
      }
    }
  }

  // Assign unreachable states to extra layer
  const maxLayer = layers.size > 0 ? Math.max(...layers.values()) : 0;
  let extraLayer = maxLayer + 1;
  for (const s of states) {
    if (!layers.has(s)) {
      layers.set(s, extraLayer++);
    }
  }

  // Group states by layer
  const layerGroups = new Map<number, string[]>();
  for (const [state, layer] of layers.entries()) {
    if (!layerGroups.has(layer)) layerGroups.set(layer, []);
    layerGroups.get(layer)!.push(state);
  }

  // Assign positions
  for (const [layer, statesInLayer] of layerGroups.entries()) {
    const x = START_X + layer * LAYER_SPACING;
    const totalHeight = (statesInLayer.length - 1) * STATE_SPACING;
    const startY = START_Y + Math.max(0, (400 - totalHeight) / 2); // center vertically

    statesInLayer.forEach((state, index) => {
      positions.set(state, {
        x,
        y: startY + index * STATE_SPACING,
      });
    });
  }

  return positions;
}

/**
 * Computes a circular layout for a set of states.
 * Useful as fallback or for small automata.
 */
export function circularLayout(
  stateIds: string[],
  centerX = 400,
  centerY = 300,
  radius = 200
): Map<string, LayoutPosition> {
  const positions = new Map<string, LayoutPosition>();
  const n = stateIds.length;

  stateIds.forEach((id, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2; // start from top
    positions.set(id, {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  });

  return positions;
}
