import React from 'react';
import { getBezierPath, EdgeLabelRenderer, type EdgeProps } from 'reactflow';

/**
 * Presentational-only transition edge for the Conversion Lab result canvas.
 * Geometry (self-loops, bidirectional arcs, bezier curves) mirrors the
 * editor's `TransitionEdge`, but with no store access and no click/edit
 * handlers, since this renders a computed conversion result, not the
 * live editable automaton.
 */
export interface ReadOnlyTransitionEdgeData {
  symbols: string[];
  isBidirectional?: boolean;
}

export const ReadOnlyTransitionEdge: React.FC<EdgeProps<ReadOnlyTransitionEdgeData>> = ({
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data
}) => {
  const isSelfLoop = source === target;
  let edgePath = '';
  let labelX = 0;
  let labelY = 0;

  if (isSelfLoop) {
    const loopRadiusX = 24;
    const loopHeight = 48;
    const startX = sourceX - 10;
    const startY = sourceY;
    const endX = sourceX + 10;
    const endY = sourceY;

    edgePath = `M ${startX} ${startY} C ${startX - loopRadiusX} ${startY - loopHeight}, ${endX + loopRadiusX} ${endY - loopHeight}, ${endX} ${endY}`;
    labelX = sourceX;
    labelY = sourceY - loopHeight + 6;
  } else if (data?.isBidirectional) {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const normX = -dy / dist;
    const normY = dx / dist;
    const curvature = Math.min(Math.max(dist * 0.22, 22), 48);
    const midX = (sourceX + targetX) / 2 + normX * curvature;
    const midY = (sourceY + targetY) / 2 + normY * curvature;

    edgePath = `M ${sourceX} ${sourceY} Q ${midX} ${midY} ${targetX} ${targetY}`;
    labelX = midX;
    labelY = midY;
  } else {
    const [path, lx, ly] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      curvature: 0.12
    });
    edgePath = path;
    labelX = lx;
    labelY = ly;
  }

  const symbolLabel = data?.symbols && data.symbols.length > 0 ? data.symbols.join(', ') : '';

  return (
    <>
      <path
        d={edgePath}
        fill="none"
        style={style}
        className="stroke-zinc-500"
        markerEnd={markerEnd}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'none'
          }}
          className="z-20 nodrag nopan"
        >
          <div className="flex items-center justify-center rounded px-2 py-0.5 font-mono text-[11px] font-semibold bg-zinc-900 text-zinc-300 border border-zinc-700/80 shadow-sm">
            <span>{symbolLabel}</span>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
