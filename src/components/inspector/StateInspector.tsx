import React, { useState, useEffect } from 'react';
import { useAutomataStore } from '../../store/automataStore';
import { Badge } from '../common/Badge';
import { Trash2, ArrowRight, PlayCircle, Disc3, Layers } from 'lucide-react';

interface StateInspectorProps {
  stateId: string;
}

export const StateInspector: React.FC<StateInspectorProps> = ({ stateId }) => {
  const states = useAutomataStore(s => s.states);
  const transitions = useAutomataStore(s => s.transitions);
  const renameState = useAutomataStore(s => s.renameState);
  const toggleStartState = useAutomataStore(s => s.toggleStartState);
  const toggleAcceptingState = useAutomataStore(s => s.toggleAcceptingState);
  const deleteState = useAutomataStore(s => s.deleteState);
  const deleteTransition = useAutomataStore(s => s.deleteTransition);
  const setSelectedElement = useAutomataStore(s => s.setSelectedElement);

  const state = states.find(s => s.id === stateId);
  const [nameInput, setNameInput] = useState(state?.name || '');

  useEffect(() => {
    if (state) {
      setNameInput(state.name);
    }
  }, [state]);

  if (!state) return null;

  const stateMap = new Map(states.map(s => [s.id, s.name]));
  const outgoingTransitions = transitions.filter(t => t.from === stateId);
  const incomingTransitions = transitions.filter(t => t.to === stateId);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameInput(e.target.value);
  };

  const handleNameBlur = () => {
    const trimmed = nameInput.trim();
    if (trimmed && trimmed !== state.name) {
      renameState(state.id, trimmed);
    } else {
      setNameInput(state.name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleNameBlur();
    }
  };

  return (
    <div className="flex flex-col gap-6 text-zinc-700 dark:text-zinc-300">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase">State Inspector</span>
          <div className="flex gap-1.5">
            {state.isStart && <Badge variant="accent" size="sm">Start</Badge>}
            {state.isAccepting && <Badge variant="success" size="sm">Accepting</Badge>}
          </div>
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight mt-1 flex items-center gap-2">
          <Layers className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          <span>State <span className="font-mono text-violet-600 dark:text-violet-300">{state.name}</span></span>
        </h2>
      </div>

      {/* State Name Field */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">State Identifier / Name</label>
        <div className="relative">
          <input
            type="text"
            value={nameInput}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            onKeyDown={handleKeyDown}
            placeholder="e.g. q0"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 font-mono text-sm text-zinc-900 placeholder-zinc-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder-zinc-600"
          />
        </div>
      </div>

      {/* State Properties Switches */}
      <div className="rounded-xl border border-zinc-200 bg-white/70 dark:border-zinc-800 dark:bg-zinc-950/60 p-3.5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <PlayCircle className={`w-4 h-4 ${state.isStart ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-400 dark:text-zinc-500'}`} />
            <div>
              <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200">Start State (q₀)</div>
              <div className="text-[11px] text-zinc-500">Designated entry point</div>
            </div>
          </div>
          <button
            onClick={() => toggleStartState(state.id)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              state.isStart ? 'bg-violet-600' : 'bg-zinc-200 dark:bg-zinc-800'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                state.isStart ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="h-px bg-zinc-100 dark:bg-zinc-800/80" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Disc3 className={`w-4 h-4 ${state.isAccepting ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'}`} />
            <div>
              <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200">Accepting State (F)</div>
              <div className="text-[11px] text-zinc-500">Concentric double circle</div>
            </div>
          </div>
          <button
            onClick={() => toggleAcceptingState(state.id)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              state.isAccepting ? 'bg-emerald-600' : 'bg-zinc-200 dark:bg-zinc-800'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                state.isAccepting ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Connected Transitions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Outgoing Transitions</span>
          <Badge variant="outline" size="sm">{outgoingTransitions.length}</Badge>
        </div>

        {outgoingTransitions.length === 0 ? (
          <p className="text-xs text-zinc-500 italic">No outgoing transitions from this state.</p>
        ) : (
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {outgoingTransitions.map(trans => {
              const targetName = stateMap.get(trans.to) || trans.to;
              return (
                <div
                  key={trans.id}
                  onClick={() => setSelectedElement({ type: 'transition', id: trans.id })}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-2 text-xs hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 cursor-pointer group transition-colors shadow-xs"
                >
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-violet-600 dark:text-violet-400 font-semibold">{state.name}</span>
                    <ArrowRight className="w-3 h-3 text-zinc-400 dark:text-zinc-600" />
                    <span className="text-zinc-800 dark:text-zinc-300 font-semibold">{targetName}</span>
                    <Badge variant="default" size="sm">
                      {trans.symbols.join(', ')}
                    </Badge>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTransition(trans.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 rounded transition-opacity cursor-pointer"
                    title="Delete transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Incoming Transitions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Incoming Transitions</span>
          <Badge variant="outline" size="sm">{incomingTransitions.length}</Badge>
        </div>
        {incomingTransitions.length === 0 ? (
          <p className="text-xs text-zinc-500 italic">No incoming transitions to this state.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {incomingTransitions.map(trans => {
              const fromName = stateMap.get(trans.from) || trans.from;
              return (
                <button
                  key={trans.id}
                  onClick={() => setSelectedElement({ type: 'transition', id: trans.id })}
                  className="inline-flex items-center gap-1 text-[11px] font-mono bg-zinc-100 border border-zinc-200 rounded px-2 py-1 hover:border-zinc-300 text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:hover:border-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  <span>{fromName}</span>
                  <span className="text-zinc-400 dark:text-zinc-500">[{trans.symbols.join(',')}]</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete State Action */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => deleteState(state.id)}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          Delete State
        </button>
      </div>
    </div>
  );
};
