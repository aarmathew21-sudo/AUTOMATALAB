import React from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { ArrowRight } from 'lucide-react';

/**
 * Presentational-only state node for the Conversion Lab result canvas.
 *
 * This intentionally does NOT reuse the editor's `StateNode` component:
 * that component reads/writes the global Zustand automaton store directly
 * on click (rename, delete, toggle start/accept, etc). Reusing it here
 * would let interacting with a conversion *result* mutate the user's
 * live editor automaton. Instead this mirrors the same visual language
 * (circle styling, double-circle accept ring, start arrow badge) as a
 * pure, non-interactive presentation.
 */
export interface ReadOnlyStateNodeData {
  name: string;
  isStart: boolean;
  isAccepting: boolean;
}

export const ReadOnlyStateNode: React.FC<NodeProps<ReadOnlyStateNodeData>> = ({ data }) => {
  const borderClass = data.isStart
    ? 'border-violet-500/80 bg-zinc-900/90'
    : data.isAccepting
    ? 'border-emerald-500/80 bg-zinc-900/90'
    : 'border-zinc-600 bg-zinc-900/90';

  return (
    <div className="relative flex items-center justify-center select-none">
      {data.isStart && (
        <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex items-center pointer-events-none z-20">
          <div className="flex items-center gap-0.5 rounded-md border border-violet-500/40 bg-zinc-950 px-1.5 py-0.5 shadow">
            <span className="font-mono text-[9px] font-bold text-violet-300 uppercase tracking-wider">Start</span>
            <ArrowRight className="w-3 h-3 text-violet-400 stroke-[2.5]" />
          </div>
        </div>
      )}

      <div
        className={`relative flex items-center justify-center rounded-full border-2 ${
          data.isAccepting ? 'w-[58px] h-[58px]' : 'w-[54px] h-[54px]'
        } ${borderClass}`}
      >
        {data.isAccepting && (
          <div className="absolute rounded-full pointer-events-none w-[46px] h-[46px] border-2 border-emerald-400/80" />
        )}

        <div className="z-10 flex items-center justify-center px-1 text-center font-mono font-semibold text-xs">
          <span className="truncate max-w-[38px] tracking-tight text-zinc-100" title={data.name}>
            {data.name}
          </span>
        </div>
      </div>

      {/* Handles kept for edge geometry only — not user-interactive */}
      <Handle type="target" position={Position.Top} id="top-target" className="!opacity-0 !pointer-events-none" />
      <Handle type="source" position={Position.Top} id="top-source" className="!opacity-0 !pointer-events-none" />
      <Handle type="target" position={Position.Right} id="right-target" className="!opacity-0 !pointer-events-none" />
      <Handle type="source" position={Position.Right} id="right-source" className="!opacity-0 !pointer-events-none" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" className="!opacity-0 !pointer-events-none" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" className="!opacity-0 !pointer-events-none" />
      <Handle type="target" position={Position.Left} id="left-target" className="!opacity-0 !pointer-events-none" />
      <Handle type="source" position={Position.Left} id="left-source" className="!opacity-0 !pointer-events-none" />
    </div>
  );
};
