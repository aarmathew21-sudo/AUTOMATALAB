import type { AutomatonState, AlignmentGuide } from '../types/automata';

const SNAP_THRESHOLD = 14;

export interface MagnetSnapResult {
  snappedX: number;
  snappedY: number;
  guides: AlignmentGuide[];
}

/**
 * Calculates smart magnetic alignment snapping when dragging a state
 */
export function calculateMagneticSnap(
  draggedId: string,
  targetX: number,
  targetY: number,
  otherStates: AutomatonState[]
): MagnetSnapResult {
  let snappedX = targetX;
  let snappedY = targetY;
  const guides: AlignmentGuide[] = [];

  let closestXDiff = SNAP_THRESHOLD;
  let closestYDiff = SNAP_THRESHOLD;
  let matchingStateX: AutomatonState | null = null;
  let matchingStateY: AutomatonState | null = null;

  for (const other of otherStates) {
    if (other.id === draggedId) continue;

    // Check Horizontal Center alignment (Y is same)
    const diffY = Math.abs(other.y - targetY);
    if (diffY < closestYDiff) {
      closestYDiff = diffY;
      snappedY = other.y;
      matchingStateY = other;
    }

    // Check Vertical Center alignment (X is same)
    const diffX = Math.abs(other.x - targetX);
    if (diffX < closestXDiff) {
      closestXDiff = diffX;
      snappedX = other.x;
      matchingStateX = other;
    }
  }

  // Generate guide line for Y alignment (Horizontal line)
  if (matchingStateY) {
    const minX = Math.min(snappedX, matchingStateY.x) - 40;
    const maxX = Math.max(snappedX, matchingStateY.x) + 40;
    guides.push({
      type: 'horizontal',
      coordinate: snappedY,
      start: minX,
      end: maxX
    });
  }

  // Generate guide line for X alignment (Vertical line)
  if (matchingStateX) {
    const minY = Math.min(snappedY, matchingStateX.y) - 40;
    const maxY = Math.max(snappedY, matchingStateX.y) + 40;
    guides.push({
      type: 'vertical',
      coordinate: snappedX,
      start: minY,
      end: maxY
    });
  }

  return {
    snappedX,
    snappedY,
    guides
  };
}
