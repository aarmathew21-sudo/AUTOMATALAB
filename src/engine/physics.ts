import type { AutomatonState, AutomatonTransition } from '../types/automata';

const RESTING_DISTANCE = 200;
const REPULSION_STRENGTH = 4000;
const SPRING_STRENGTH = 0.035;
const DAMPING = 0.72;
const MAX_VELOCITY = 15;
const MIN_ENERGY_THRESHOLD = 0.08;

/**
 * Performs a single step of force-directed physics layout calculation.
 * Safe, predictable, damped: settles in 1-2 seconds and sleeps when stable.
 */
export function stepPhysics(
  states: AutomatonState[],
  transitions: AutomatonTransition[],
  draggedStateId: string | null = null
): { updatedStates: AutomatonState[]; isMoving: boolean } {
  if (states.length < 2) {
    return { updatedStates: states, isMoving: false };
  }

  let totalVelocity = 0;
  const stateCount = states.length;
  const nextStates = states.map(s => ({
    ...s,
    vx: s.vx || 0,
    vy: s.vy || 0
  }));

  const stateIndexMap = new Map(nextStates.map((s, i) => [s.id, i]));

  // 1. Repulsion between all pairs (prevents overlapping)
  for (let i = 0; i < stateCount; i++) {
    for (let j = i + 1; j < stateCount; j++) {
      const s1 = nextStates[i];
      const s2 = nextStates[j];

      const dx = s2.x - s1.x;
      const dy = s2.y - s1.y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq) || 1;

      if (dist < RESTING_DISTANCE * 1.5) {
        // Stronger repulsion if nodes are very close
        const force = Math.min(REPULSION_STRENGTH / (distSq + 100), 20);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (s1.id !== draggedStateId) {
          s1.vx -= fx;
          s1.vy -= fy;
        }
        if (s2.id !== draggedStateId) {
          s2.vx += fx;
          s2.vy += fy;
        }
      }
    }
  }

  // 2. Spring attraction along transitions
  for (const trans of transitions) {
    const i = stateIndexMap.get(trans.from);
    const j = stateIndexMap.get(trans.to);

    if (i !== undefined && j !== undefined && i !== j) {
      const s1 = nextStates[i];
      const s2 = nextStates[j];

      const dx = s2.x - s1.x;
      const dy = s2.y - s1.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      // Spring displacement
      const displacement = dist - RESTING_DISTANCE;
      const force = displacement * SPRING_STRENGTH;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (s1.id !== draggedStateId) {
        s1.vx += fx;
        s1.vy += fy;
      }
      if (s2.id !== draggedStateId) {
        s2.vx -= fx;
        s2.vy -= fy;
      }
    }
  }

  // 3. Integrate position & apply heavy damping
  for (const s of nextStates) {
    if (s.id === draggedStateId) {
      s.vx = 0;
      s.vy = 0;
      continue;
    }

    // Clamp max velocity
    const speed = Math.sqrt(s.vx * s.vx + s.vy * s.vy);
    if (speed > MAX_VELOCITY) {
      s.vx = (s.vx / speed) * MAX_VELOCITY;
      s.vy = (s.vy / speed) * MAX_VELOCITY;
    }

    s.x += s.vx;
    s.y += s.vy;

    // Apply damping
    s.vx *= DAMPING;
    s.vy *= DAMPING;

    // Zero out very small velocities
    if (Math.abs(s.vx) < 0.01) s.vx = 0;
    if (Math.abs(s.vy) < 0.01) s.vy = 0;

    totalVelocity += Math.abs(s.vx) + Math.abs(s.vy);
  }

  const isMoving = totalVelocity > MIN_ENERGY_THRESHOLD;
  return { updatedStates: nextStates, isMoving };
}
