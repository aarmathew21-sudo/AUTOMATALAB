import React, { useMemo } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  MarkerType,
  ReactFlowProvider,
  type Node,
  type Edge
} from 'reactflow';
import 'reactflow/dist/style.css';

import type { AutomatonState, AutomatonTransition } from '../../types/automata';
import { ReadOnlyStateNode } from './ReadOnlyStateNode';
import { ReadOnlyTransitionEdge } from './ReadOnlyTransitionEdge';

const nodeTypes = { readOnlyStateNode: ReadOnlyStateNode };
const edgeTypes = { readOnlyTransitionEdge: ReadOnlyTransitionEdge };

interface ReadOnlyAutomatonViewProps {
  states: AutomatonState[];
  transitions: AutomatonTransition[];
}

const InnerView: React.FC<ReadOnlyAutomatonViewProps> = ({ states, transitions }) => {
  const nodes: Node[] = useMemo(
    () =>
      states.map(state => ({
        id: state.id,
        type: 'readOnlyStateNode',
        position: { x: state.x, y: state.y },
        data: {
          name: state.name,
          isStart: state.isStart,
          isAccepting: state.isAccepting
        },
        draggable: false,
        selectable: false,
        connectable: false
      })),
    [states]
  );

  const edges: Edge[] = useMemo(() => {
    const stateMap = new Map(states.map(s => [s.id, s]));

    return transitions.map(trans => {
      const isSelfLoop = trans.from === trans.to;
      const hasReverse = !isSelfLoop && transitions.some(t => t.from === trans.to && t.to === trans.from);

      const sourceState = stateMap.get(trans.from);
      const targetState = stateMap.get(trans.to);

      let sourceHandle = 'top-source';
      let targetHandle = 'top-target';

      if (!isSelfLoop && sourceState && targetState) {
        const dx = targetState.x - sourceState.x;
        const dy = targetState.y - sourceState.y;

        if (Math.abs(dx) >= Math.abs(dy)) {
          if (dx > 0) {
            sourceHandle = 'right-source';
            targetHandle = 'left-target';
          } else {
            sourceHandle = 'left-source';
            targetHandle = 'right-target';
          }
        } else {
          if (dy > 0) {
            sourceHandle = 'bottom-source';
            targetHandle = 'top-target';
          } else {
            sourceHandle = 'top-source';
            targetHandle = 'bottom-target';
          }
        }
      }

      return {
        id: trans.id,
        source: trans.from,
        target: trans.to,
        sourceHandle,
        targetHandle,
        type: 'readOnlyTransitionEdge',
        data: {
          symbols: trans.symbols,
          isBidirectional: hasReverse
        },
        selectable: false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#71717a',
          width: 15,
          height: 15
        }
      };
    });
  }, [states, transitions]);

  if (states.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-zinc-500">
        No states to display.
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={{ padding: 0.35 }}
      minZoom={0.15}
      maxZoom={3}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnScroll
      zoomOnScroll
      proOptions={{ hideAttribution: true }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1.1}
        color="#27272a"
        className="opacity-70 pointer-events-none"
      />
    </ReactFlow>
  );
};

/** Renders a computed conversion result automaton, styled to match the AutomataLab editor. */
export const ReadOnlyAutomatonView: React.FC<ReadOnlyAutomatonViewProps> = props => (
  <div className="relative w-full h-full min-h-[320px] bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800">
    <ReactFlowProvider>
      <InnerView {...props} />
    </ReactFlowProvider>
  </div>
);
