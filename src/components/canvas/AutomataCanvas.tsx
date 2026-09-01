import React, { useCallback, useState, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  MiniMap,
  MarkerType,
  useReactFlow,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  type Connection,
  type Node,
  type Edge,
  type NodeDragHandler
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useAutomataStore } from '../../store/automataStore';
import { StateNode } from './StateNode';
import { TransitionEdge } from './TransitionEdge';
import { CanvasControls } from './CanvasControls';
import { LivingBackground } from './LivingBackground';
import { AlignmentGuides } from './AlignmentGuides';
import { stepPhysics } from '../../engine/physics';
import { calculateMagneticSnap } from '../../engine/magneticAlignment';

const nodeTypes = {
  stateNode: StateNode
};

const edgeTypes = {
  transitionEdge: TransitionEdge
};

const InnerCanvas: React.FC = () => {
  const { project } = useReactFlow();

  const theme = useAutomataStore(s => s.theme);
  const states = useAutomataStore(s => s.states);
  const transitions = useAutomataStore(s => s.transitions);
  const activeTool = useAutomataStore(s => s.activeTool);
  const selectedElement = useAutomataStore(s => s.selectedElement);
  const transitionSourceId = useAutomataStore(s => s.transitionSourceId);
  const canvasSettings = useAutomataStore(s => s.canvasSettings);
  const setStatesBatch = useAutomataStore(s => s.setStatesBatch);
  const addState = useAutomataStore(s => s.addState);
  const addTransition = useAutomataStore(s => s.addTransition);
  const toggleStartState = useAutomataStore(s => s.toggleStartState);
  const toggleAcceptingState = useAutomataStore(s => s.toggleAcceptingState);
  const deleteState = useAutomataStore(s => s.deleteState);
  const deleteTransition = useAutomataStore(s => s.deleteTransition);
  const updateStatePosition = useAutomataStore(s => s.updateStatePosition);
  const setSelectedElement = useAutomataStore(s => s.setSelectedElement);
  const setTransitionSourceId = useAutomataStore(s => s.setTransitionSourceId);
  const setAlignmentGuides = useAutomataStore(s => s.setAlignmentGuides);
  const setDraggedNodeId = useAutomataStore(s => s.setDraggedNodeId);
  const showToast = useAutomataStore(s => s.showToast);

  const [showMinimap, setShowMinimap] = useState(false);
  const draggedNodeIdRef = useRef<string | null>(null);

  // Controlled nodes & edges for real-time smooth 60fps dragging
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Sync React Flow nodes with Zustand states
  useEffect(() => {
    setNodes(
      states.map(state => ({
        id: state.id,
        type: 'stateNode',
        position: { x: state.x, y: state.y },
        data: {
          id: state.id,
          name: state.name,
          isStart: state.isStart,
          isAccepting: state.isAccepting
        },
        selected: selectedElement?.type === 'state' && selectedElement.id === state.id,
        dragHandle: activeTool === 'select' ? undefined : '.nodrag'
      }))
    );
  }, [states, selectedElement, activeTool, setNodes]);

  // Sync React Flow edges with Zustand transitions (intelligent cardinal handle routing)
  useEffect(() => {
    const stateMap = new Map(states.map(s => [s.id, s]));

    setEdges(
      transitions.map(trans => {
        const isSelected = selectedElement?.type === 'transition' && selectedElement.id === trans.id;
        const sourceState = stateMap.get(trans.from);
        const targetState = stateMap.get(trans.to);

        const isSelfLoop = trans.from === trans.to;
        let sourceHandle = 'top-source';
        let targetHandle = 'top-target';

        if (!isSelfLoop && sourceState && targetState) {
          const dx = targetState.x - sourceState.x;
          const dy = targetState.y - sourceState.y;

          if (Math.abs(dx) >= Math.abs(dy)) {
            // Horizontal dominant
            if (dx > 0) {
              sourceHandle = 'right-source';
              targetHandle = 'left-target';
            } else {
              sourceHandle = 'left-source';
              targetHandle = 'right-target';
            }
          } else {
            // Vertical dominant
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
          type: 'transitionEdge',
          data: {
            id: trans.id,
            symbols: trans.symbols
          },
          selected: isSelected,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isSelected ? '#a855f7' : (theme === 'dark' ? '#71717a' : '#94a3b8'),
            width: 15,
            height: 15
          }
        };
      })
    );
  }, [states, transitions, selectedElement, theme, setEdges]);

  // Force-Directed Physics Settling Loop (when enabled)
  useEffect(() => {
    if (!canvasSettings.physicsEnabled || canvasSettings.reducedMotion) return;

    let animId: number;
    let isRunning = true;

    const tick = () => {
      if (!isRunning) return;
      const currentStates = useAutomataStore.getState().states;
      const currentTrans = useAutomataStore.getState().transitions;
      const activeDragged = draggedNodeIdRef.current;

      const { updatedStates, isMoving } = stepPhysics(currentStates, currentTrans, activeDragged);

      if (isMoving) {
        setStatesBatch(updatedStates);
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
    };
  }, [canvasSettings.physicsEnabled, canvasSettings.reducedMotion, setStatesBatch]);

  // Handle Canvas Pane Click
  const handlePaneClick = useCallback(
    (event: React.MouseEvent) => {
      if (activeTool === 'add-state') {
        const bounds = event.currentTarget.getBoundingClientRect();
        const clientX = event.clientX - bounds.left;
        const clientY = event.clientY - bounds.top;
        const pos = project({ x: clientX, y: clientY });
        
        addState(pos.x - 27, pos.y - 27);
      } else {
        setSelectedElement(null);
        setTransitionSourceId(null);
        setAlignmentGuides([]);
      }
    },
    [activeTool, project, addState, setSelectedElement, setTransitionSourceId, setAlignmentGuides]
  );

  // Handle Node Click
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.stopPropagation();
      const id = node.id;
      const stateObj = states.find(s => s.id === id);
      const stateName = stateObj?.name || id;

      if (activeTool === 'set-start') {
        toggleStartState(id);
        showToast(`Toggled start state for ${stateName}`, 'success');
        return;
      }

      if (activeTool === 'toggle-accepting') {
        toggleAcceptingState(id);
        showToast(`Toggled accepting state for ${stateName}`, 'success');
        return;
      }

      if (activeTool === 'delete') {
        deleteState(id);
        showToast(`Deleted state ${stateName}`, 'info');
        return;
      }

      if (activeTool === 'add-transition') {
        if (!transitionSourceId) {
          setTransitionSourceId(id);
          showToast(`Selected "${stateName}" as source. Click target state (or click same state for self-loop).`, 'info');
        } else {
          addTransition(transitionSourceId, id, ['0']);
          const sourceObj = states.find(s => s.id === transitionSourceId);
          const sourceName = sourceObj?.name || transitionSourceId;
          showToast(`Created transition: ${sourceName} → ${stateName}`, 'success');
          setTransitionSourceId(null);
        }
        return;
      }

      // Default select
      setSelectedElement({ type: 'state', id });
    },
    [
      activeTool, 
      transitionSourceId, 
      states, 
      toggleStartState, 
      toggleAcceptingState, 
      deleteState, 
      setTransitionSourceId, 
      addTransition, 
      setSelectedElement, 
      showToast
    ]
  );

  // Handle Edge Click
  const handleEdgeClick = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.stopPropagation();
      const id = edge.id;

      if (activeTool === 'delete') {
        deleteTransition(id);
        showToast('Deleted transition', 'info');
        return;
      }

      setSelectedElement({ type: 'transition', id });
    },
    [activeTool, deleteTransition, setSelectedElement, showToast]
  );

  // Handle Drag Connection
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        addTransition(connection.source, connection.target, ['0']);
        showToast('Created transition via handle connect', 'success');
      }
    },
    [addTransition, showToast]
  );

  // Handle Node Drag Start
  const handleNodeDragStart: NodeDragHandler = useCallback(
    (_, node) => {
      draggedNodeIdRef.current = node.id;
      setDraggedNodeId(node.id);
    },
    [setDraggedNodeId]
  );

  // Handle Live Node Drag (Magnetic Snapping)
  const handleNodeDrag: NodeDragHandler = useCallback(
    (_, node) => {
      draggedNodeIdRef.current = node.id;

      if (canvasSettings.magnetEnabled) {
        const snap = calculateMagneticSnap(node.id, node.position.x, node.position.y, states);
        if (snap.guides.length > 0) {
          node.position.x = snap.snappedX;
          node.position.y = snap.snappedY;
        }
        setAlignmentGuides(snap.guides);
      } else {
        setAlignmentGuides([]);
      }
    },
    [canvasSettings.magnetEnabled, states, setAlignmentGuides]
  );

  // Handle Node Drag Stop
  const handleNodeDragStop: NodeDragHandler = useCallback(
    (_, node) => {
      draggedNodeIdRef.current = null;
      setDraggedNodeId(null);
      setAlignmentGuides([]);
      updateStatePosition(node.id, Math.round(node.position.x), Math.round(node.position.y));
    },
    [setDraggedNodeId, setAlignmentGuides, updateStatePosition]
  );

  // Determine cursor based on active tool
  const cursorClass = React.useMemo(() => {
    switch (activeTool) {
      case 'add-state':
        return 'cursor-crosshair';
      case 'add-transition':
        return 'cursor-cell';
      case 'delete':
        return 'cursor-not-allowed';
      case 'set-start':
      case 'toggle-accepting':
        return 'cursor-pointer';
      default:
        return 'cursor-default';
    }
  }, [activeTool]);

  return (
    <div className={`relative w-full h-full select-none overflow-hidden bg-slate-50 dark:bg-zinc-950 ${cursorClass} transition-colors duration-200`}>
      {/* 1. Clean Professional Background */}
      <LivingBackground />

      {/* 2. Magnetic Alignment Guide Lines */}
      <AlignmentGuides />

      {/* 3. React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onPaneClick={handlePaneClick}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onConnect={handleConnect}
        onNodeDragStart={handleNodeDragStart}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={3.0}
        nodesDraggable={activeTool === 'select'}
        nodesConnectable={activeTool === 'select' || activeTool === 'add-transition'}
        elementsSelectable={true}
        proOptions={{ hideAttribution: true }}
      >
        {/* Subtle, Crisp Engineering Dot Grid */}
        {canvasSettings.showGrid && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1.1}
            color={theme === 'dark' ? '#27272a' : '#cbd5e1'}
            className="opacity-70 pointer-events-none"
          />
        )}

        {showMinimap && (
          <MiniMap
            nodeColor="#8b5cf6"
            maskColor={theme === 'dark' ? 'rgba(9, 9, 11, 0.75)' : 'rgba(241, 245, 249, 0.75)'}
            className="!bg-white/90 !border-zinc-300 dark:!bg-zinc-900/90 dark:!border-zinc-800 !rounded-xl overflow-hidden shadow-2xl !bottom-5 !right-5 backdrop-blur-md"
          />
        )}

        <CanvasControls
          showMinimap={showMinimap}
          setShowMinimap={setShowMinimap}
        />
      </ReactFlow>
    </div>
  );
};

export const AutomataCanvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <InnerCanvas />
    </ReactFlowProvider>
  );
};
