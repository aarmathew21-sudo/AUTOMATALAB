import React, { useState, useRef, useEffect, useMemo } from 'react';
import { getBezierPath, EdgeLabelRenderer, type EdgeProps } from 'reactflow';
import { useAutomataStore } from '../../store/automataStore';

export interface TransitionEdgeData {
  id: string;
  symbols: string[];
  isBidirectional?: boolean;
}

export const TransitionEdge: React.FC<EdgeProps<TransitionEdgeData>> = ({
  id,
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
  selected,
  data
}) => {
  const activeTool = useAutomataStore(s => s.activeTool);
  const deleteTransition = useAutomataStore(s => s.deleteTransition);
  const updateTransitionSymbols = useAutomataStore(s => s.updateTransitionSymbols);
  const setSelectedElement = useAutomataStore(s => s.setSelectedElement);
  const showToast = useAutomataStore(s => s.showToast);
  const transitions = useAutomataStore(s => s.transitions);
  const simulationState = useAutomataStore(s => s.simulationState);

  const [isEditing, setIsEditing] = useState(false);
  const [editSymbols, setEditSymbols] = useState(data?.symbols.join(', ') || '0');
  const inputRef = useRef<HTMLInputElement>(null);

  const isTraversed = simulationState?.traversedTransitionId === id;

  useEffect(() => {
    if (data?.symbols) {
      setEditSymbols(data.symbols.join(', '));
    }
  }, [data?.symbols]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleFinishEdit = () => {
    setIsEditing(false);
    const parsed = editSymbols
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (parsed.length > 0) {
      updateTransitionSymbols(id, parsed);
    } else {
      setEditSymbols(data?.symbols.join(', ') || '0');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishEdit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditSymbols(data?.symbols.join(', ') || '0');
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeTool === 'delete') {
      deleteTransition(id);
      showToast('Deleted transition', 'info');
      return;
    }
    setSelectedElement({ type: 'transition', id });
  };

  // 1. SELF LOOP HANDLING (source === target)
  const isSelfLoop = source === target;
  let edgePath = '';
  let labelX = 0;
  let labelY = 0;

  if (isSelfLoop) {
    // Exact live coordinate passed by React Flow on every drag frame
    const loopRadiusX = 24;
    const loopHeight = 48;
    const startX = sourceX - 10;
    const startY = sourceY;
    const endX = sourceX + 10;
    const endY = sourceY;

    // Cubic bezier forming a clean self-loop above the state
    edgePath = `M ${startX} ${startY} C ${startX - loopRadiusX} ${startY - loopHeight}, ${endX + loopRadiusX} ${endY - loopHeight}, ${endX} ${endY}`;
    labelX = sourceX;
    labelY = sourceY - loopHeight + 6;
  } else {
    // 2. CHECK FOR BIDIRECTIONAL TRANSITION
    const hasReverse = transitions.some(t => t.from === target && t.to === source);

    if (hasReverse) {
      const dx = targetX - sourceX;
      const dy = targetY - sourceY;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      // Normal vector
      const normX = -dy / dist;
      const normY = dx / dist;

      // Curved arc offset
      const curvature = Math.min(Math.max(dist * 0.22, 22), 48);
      const midX = (sourceX + targetX) / 2 + normX * curvature;
      const midY = (sourceY + targetY) / 2 + normY * curvature;

      edgePath = `M ${sourceX} ${sourceY} Q ${midX} ${midY} ${targetX} ${targetY}`;
      labelX = midX;
      labelY = midY;
    } else {
      // 3. REGULAR DIRECTED EDGE
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
  }

  const symbolLabel = data?.symbols && data.symbols.length > 0 ? data.symbols.join(', ') : '0';

  // Professional Edge Styling
  const edgeStrokeClass = useMemo(() => {
    if (isTraversed) {
      return 'stroke-sky-400 stroke-[2.5px] drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]';
    }
    if (selected) {
      return 'stroke-violet-400 stroke-[2.25px] drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]';
    }
    return 'stroke-zinc-500 hover:stroke-zinc-300 stroke-[1.75px]';
  }, [isTraversed, selected]);

  return (
    <>
      {/* Invisible wider hit area for effortless clicking */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={28}
        style={{ pointerEvents: 'all' }}
        className="cursor-pointer pointer-events-auto"
        onClick={handleClick}
      />

      {/* Visible Transition Path */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        style={{ ...style, pointerEvents: 'all' }}
        className={`cursor-pointer pointer-events-auto transition-colors duration-150 ${edgeStrokeClass}`}
        markerEnd={markerEnd}
        onClick={handleClick}
      />

      {/* Floating Glass Capsule Symbol Badge */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all'
          }}
          className="z-20 nodrag nopan pointer-events-auto"
          onClick={handleClick}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (activeTool === 'select') {
              setIsEditing(true);
            }
          }}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editSymbols}
              onChange={(e) => setEditSymbols(e.target.value)}
              onBlur={handleFinishEdit}
              onKeyDown={handleKeyDown}
              className="w-14 bg-zinc-950 text-center text-xs font-mono font-bold text-violet-300 outline-none rounded border border-violet-400 px-1 py-0.5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <div
              className={`flex items-center justify-center rounded px-2 py-0.5 font-mono text-[11px] font-semibold cursor-pointer select-none transition-all border shadow-sm ${
                isTraversed
                  ? 'bg-sky-950 text-sky-200 border-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)] scale-105'
                  : selected
                  ? 'bg-violet-950 text-violet-100 border-violet-400 shadow-[0_0_8px_rgba(168,85,247,0.4)]'
                  : 'bg-zinc-900 text-zinc-300 border-zinc-700/80 hover:border-zinc-500 hover:text-zinc-100'
              }`}
              title="Click to select, double-click to edit symbol"
            >
              <span>{symbolLabel}</span>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
