import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { useAutomataStore } from '../../store/automataStore';
import { ArrowRight } from 'lucide-react';

export interface StateNodeData {
  id: string;
  name: string;
  isStart: boolean;
  isAccepting: boolean;
}

export const StateNode: React.FC<NodeProps<StateNodeData>> = ({ id, data, selected, dragging }) => {
  const activeTool = useAutomataStore(s => s.activeTool);
  const transitionSourceId = useAutomataStore(s => s.transitionSourceId);
  const renameState = useAutomataStore(s => s.renameState);
  const toggleStartState = useAutomataStore(s => s.toggleStartState);
  const toggleAcceptingState = useAutomataStore(s => s.toggleAcceptingState);
  const deleteState = useAutomataStore(s => s.deleteState);
  const addTransition = useAutomataStore(s => s.addTransition);
  const setTransitionSourceId = useAutomataStore(s => s.setTransitionSourceId);
  const setSelectedElement = useAutomataStore(s => s.setSelectedElement);
  const showToast = useAutomataStore(s => s.showToast);
  const simulationState = useAutomataStore(s => s.simulationState);
  const canvasSettings = useAutomataStore(s => s.canvasSettings);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(data.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Elastic physical movement states
  const [stretchStyle, setStretchStyle] = useState<{ transform: string }>({ transform: 'none' });
  const [isSettling, setIsSettling] = useState(false);
  const lastPosRef = useRef<{ x: number; y: number; time: number; speed: number } | null>(null);
  const settleTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setEditName(data.name);
  }, [data.name]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Live Velocity Tracking for Bouncy Drag: drag → stretch → overshoot → bounce → settle
  useEffect(() => {
    if (canvasSettings.reducedMotion) return;

    if (dragging) {
      setIsSettling(false);
      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);

      const handlePointerMove = (e: MouseEvent) => {
        const now = performance.now();
        if (lastPosRef.current) {
          const dt = Math.max(now - lastPosRef.current.time, 8);
          const dx = e.clientX - lastPosRef.current.x;
          const dy = e.clientY - lastPosRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const speed = dist / dt; // px/ms

          lastPosRef.current = { x: e.clientX, y: e.clientY, time: now, speed };

          // Calculate stretch along motion vector & squash across perpendicular axis
          const stretchFactor = Math.min(speed * 0.08, 0.24); // up to 24% stretch
          const squashFactor = stretchFactor * 0.5;

          // Motion angle
          const angleRad = Math.atan2(dy, dx);
          const angleDeg = (angleRad * 180) / Math.PI;

          // Deform along motion vector
          if (dist > 1.5) {
            setStretchStyle({
              transform: `rotate(${angleDeg}deg) scale(${1 + stretchFactor}, ${1 - squashFactor}) rotate(${-angleDeg}deg)`
            });
          }
        } else {
          lastPosRef.current = { x: e.clientX, y: e.clientY, time: now, speed: 0 };
        }
      };

      window.addEventListener('mousemove', handlePointerMove);
      return () => window.removeEventListener('mousemove', handlePointerMove);
    } else {
      // Just stopped dragging: check if release had velocity for overshoot & soft bounce
      const lastSpeed = lastPosRef.current?.speed || 0;
      lastPosRef.current = null;
      setStretchStyle({ transform: 'none' });

      if (lastSpeed > 0.45) {
        setIsSettling(true);
        settleTimeoutRef.current = window.setTimeout(() => {
          setIsSettling(false);
        }, 450);
      }
    }
  }, [dragging, canvasSettings.reducedMotion]);

  const handleFinishRename = () => {
    setIsEditing(false);
    if (editName.trim() && editName.trim() !== data.name) {
      renameState(id, editName.trim());
    } else {
      setEditName(data.name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFinishRename();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(data.name);
    }
  };

  const isTransitionSource = transitionSourceId === id;
  const isSimulationActive = simulationState?.currentStateIds?.includes(id);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (activeTool === 'set-start') {
      toggleStartState(id);
      showToast(`Toggled start state for ${data.name}`, 'success');
      return;
    }

    if (activeTool === 'toggle-accepting') {
      toggleAcceptingState(id);
      showToast(`Toggled accepting state for ${data.name}`, 'success');
      return;
    }

    if (activeTool === 'delete') {
      deleteState(id);
      showToast(`Deleted state ${data.name}`, 'info');
      return;
    }

    if (activeTool === 'add-transition') {
      if (!transitionSourceId) {
        setTransitionSourceId(id);
        showToast(`Selected "${data.name}" as source. Click target state (or click "${data.name}" again for self-loop).`, 'info');
      } else {
        addTransition(transitionSourceId, id, ['0']);
        showToast(`Created transition: ${transitionSourceId === id ? 'loop on ' + data.name : 'to ' + data.name}`, 'success');
        setTransitionSourceId(null);
      }
      return;
    }

    // Default select
    setSelectedElement({ type: 'state', id });
  };

  // Clean Professional State Styling
  const stateBorderClass = useMemo(() => {
    if (isSimulationActive) {
      return 'border-sky-400 bg-sky-950/80 shadow-[0_0_15px_rgba(56,189,248,0.5)]';
    }
    if (selected) {
      return 'border-violet-400 bg-violet-950/70 shadow-[0_0_15px_rgba(168,85,247,0.4)] ring-2 ring-violet-500/30';
    }
    if (isTransitionSource) {
      return 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-500/30 animate-pulse';
    }
    if (data.isStart) {
      return 'border-violet-500/80 bg-zinc-900/90 hover:border-violet-400';
    }
    if (data.isAccepting) {
      return 'border-emerald-500/80 bg-zinc-900/90 hover:border-emerald-400';
    }
    return 'border-zinc-600 bg-zinc-900/90 hover:border-zinc-400';
  }, [isSimulationActive, selected, isTransitionSource, data.isStart, data.isAccepting]);

  return (
    <div
      onClick={handleClick}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (activeTool === 'select') {
          setIsEditing(true);
        }
      }}
      className="group relative flex items-center justify-center cursor-pointer select-none"
    >
      {/* Start State Incoming Arrow Indicator */}
      {data.isStart && (
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex items-center pointer-events-none z-20">
          <div className="flex items-center gap-0.5 rounded-md border border-violet-500/40 bg-zinc-950 px-1.5 py-0.5 shadow">
            <span className="font-mono text-[9px] font-bold text-violet-300 uppercase tracking-wider">Start</span>
            <ArrowRight className="w-3 h-3 text-violet-400 stroke-[2.5]" />
          </div>
        </div>
      )}

      {/* Main Physical State Circle with Dynamic Stretch & Overshoot Bounce */}
      <div
        style={stretchStyle}
        className={`relative flex items-center justify-center rounded-full border-2 transition-colors duration-150 ${
          data.isAccepting ? 'w-[58px] h-[58px]' : 'w-[54px] h-[54px]'
        } ${stateBorderClass} ${isSettling ? 'animate-settle' : ''}`}
      >
        {/* Concentric Double Circle for Accepting States */}
        {data.isAccepting && (
          <div
            className={`absolute rounded-full pointer-events-none w-[46px] h-[46px] border-2 ${
              selected
                ? 'border-violet-400'
                : isSimulationActive
                ? 'border-sky-400'
                : isTransitionSource
                ? 'border-amber-400'
                : 'border-emerald-400/80'
            }`}
          />
        )}

        {/* State Label / Inline Name Editor */}
        <div className="z-10 flex items-center justify-center px-1 text-center font-mono font-semibold text-xs">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleFinishRename}
              onKeyDown={handleKeyDown}
              className="w-11 bg-zinc-950 text-center text-xs font-mono font-bold text-violet-300 outline-none rounded border border-violet-400 px-0.5 py-0.5"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className={`truncate max-w-[38px] tracking-tight ${
                isSimulationActive
                  ? 'text-sky-200 font-bold'
                  : selected
                  ? 'text-violet-100 font-bold'
                  : 'text-zinc-100'
              }`}
              title={data.name}
            >
              {data.name}
            </span>
          )}
        </div>
      </div>

      {/* Connection Handles (Top, Right, Bottom, Left) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="!w-2 !h-2 !bg-violet-400 opacity-0 group-hover:opacity-100 transition-opacity !border-none"
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="!w-2 !h-2 !bg-violet-400 opacity-0 group-hover:opacity-100 transition-opacity !border-none"
      />

      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="!w-2 !h-2 !bg-violet-400 opacity-0 group-hover:opacity-100 transition-opacity !border-none"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="!w-2 !h-2 !bg-violet-400 opacity-0 group-hover:opacity-100 transition-opacity !border-none"
      />

      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="!w-2 !h-2 !bg-violet-400 opacity-0 group-hover:opacity-100 transition-opacity !border-none"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="!w-2 !h-2 !bg-violet-400 opacity-0 group-hover:opacity-100 transition-opacity !border-none"
      />

      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!w-2 !h-2 !bg-violet-400 opacity-0 group-hover:opacity-100 transition-opacity !border-none"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className="!w-2 !h-2 !bg-violet-400 opacity-0 group-hover:opacity-100 transition-opacity !border-none"
      />
    </div>
  );
};
