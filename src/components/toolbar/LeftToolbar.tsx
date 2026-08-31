import React from 'react';
import { 
  MousePointer, 
  CirclePlus, 
  ArrowUpRight, 
  PlayCircle, 
  Disc3, 
  Trash2,
  Undo2,
  Redo2
} from 'lucide-react';
import { useAutomataStore } from '../../store/automataStore';
import type { ToolType } from '../../types/automata';
import { Tooltip } from '../common/Tooltip';

interface ToolItem {
  id: ToolType;
  label: string;
  description: string;
  icon: React.ReactNode;
  shortcut: string;
}

export const LeftToolbar: React.FC = () => {
  const activeTool = useAutomataStore(s => s.activeTool);
  const setActiveTool = useAutomataStore(s => s.setActiveTool);
  const undo = useAutomataStore(s => s.undo);
  const redo = useAutomataStore(s => s.redo);
  const past = useAutomataStore(s => s.past);
  const future = useAutomataStore(s => s.future);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const tools: ToolItem[] = [
    {
      id: 'select',
      label: 'Select & Move',
      description: 'Select elements, drag to move, double-click to edit',
      icon: <MousePointer className="w-5 h-5" />,
      shortcut: 'V'
    },
    {
      id: 'add-state',
      label: 'Add State',
      description: 'Click anywhere on canvas to create a new state',
      icon: <CirclePlus className="w-5 h-5" />,
      shortcut: 'S'
    },
    {
      id: 'add-transition',
      label: 'Add Transition',
      description: 'Click source state then target state, or drag handles',
      icon: <ArrowUpRight className="w-5 h-5" />,
      shortcut: 'T'
    },
    {
      id: 'set-start',
      label: 'Set Start State',
      description: 'Click any state to set or unset as initial state (q0)',
      icon: <PlayCircle className="w-5 h-5" />,
      shortcut: 'I'
    },
    {
      id: 'toggle-accepting',
      label: 'Toggle Accepting',
      description: 'Click any state to toggle double circle (accept state)',
      icon: <Disc3 className="w-5 h-5" />,
      shortcut: 'A'
    },
    {
      id: 'delete',
      label: 'Delete Tool',
      description: 'Click any state or transition to remove it',
      icon: <Trash2 className="w-5 h-5" />,
      shortcut: 'D'
    }
  ];

  return (
    <aside className="w-16 border-r border-zinc-800 bg-zinc-900/90 backdrop-blur-md flex flex-col items-center py-4 justify-between select-none z-20 shrink-0">
      {/* Tool items list */}
      <div className="flex flex-col items-center gap-2 w-full px-2">
        {tools.map(tool => {
          const isActive = activeTool === tool.id;
          return (
            <Tooltip
              key={tool.id}
              content={tool.label}
              shortcut={tool.shortcut}
              side="right"
            >
              <button
                onClick={() => setActiveTool(tool.id)}
                className={`group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 ring-2 ring-violet-400/50'
                    : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100'
                }`}
                aria-label={tool.label}
              >
                {tool.icon}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-violet-400 rounded-r-full" />
                )}
              </button>
            </Tooltip>
          );
        })}
      </div>

      {/* Undo & Redo quick actions in toolbar */}
      <div className="flex flex-col items-center gap-2 w-full px-2 pt-4 border-t border-zinc-800">
        <Tooltip content="Undo" shortcut="Ctrl+Z" side="right">
          <button
            onClick={undo}
            disabled={!canUndo}
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
              canUndo
                ? 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
                : 'text-zinc-600 cursor-not-allowed'
            }`}
            aria-label="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
        </Tooltip>

        <Tooltip content="Redo" shortcut="Ctrl+Y" side="right">
          <button
            onClick={redo}
            disabled={!canRedo}
            className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
              canRedo
                ? 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
                : 'text-zinc-600 cursor-not-allowed'
            }`}
            aria-label="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
    </aside>
  );
};
