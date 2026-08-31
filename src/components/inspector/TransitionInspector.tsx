import React, { useState, useEffect } from 'react';
import { useAutomataStore } from '../../store/automataStore';
import { Badge } from '../common/Badge';
import { Trash2, ArrowRight, CornerDownRight, Sparkles } from 'lucide-react';

interface TransitionInspectorProps {
  transitionId: string;
}

export const TransitionInspector: React.FC<TransitionInspectorProps> = ({ transitionId }) => {
  const transitions = useAutomataStore(s => s.transitions);
  const states = useAutomataStore(s => s.states);
  const updateTransitionSymbols = useAutomataStore(s => s.updateTransitionSymbols);
  const deleteTransition = useAutomataStore(s => s.deleteTransition);
  const setSelectedElement = useAutomataStore(s => s.setSelectedElement);

  const transition = transitions.find(t => t.id === transitionId);
  const [symbolsInput, setSymbolsInput] = useState(transition?.symbols.join(', ') || '0');

  useEffect(() => {
    if (transition) {
      setSymbolsInput(transition.symbols.join(', '));
    }
  }, [transition]);

  if (!transition) return null;

  const stateMap = new Map(states.map(s => [s.id, s.name]));
  const fromName = stateMap.get(transition.from) || transition.from;
  const toName = stateMap.get(transition.to) || transition.to;
  const isSelfLoop = transition.from === transition.to;

  const handleSymbolsBlur = () => {
    const parsed = symbolsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (parsed.length > 0) {
      updateTransitionSymbols(transition.id, parsed);
    } else {
      setSymbolsInput(transition.symbols.join(', ') || '0');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSymbolsBlur();
    }
  };

  const insertSymbol = (sym: string) => {
    const current = symbolsInput.split(',').map(s => s.trim()).filter(Boolean);
    if (!current.includes(sym)) {
      const next = [...current, sym].join(', ');
      setSymbolsInput(next);
      updateTransitionSymbols(transition.id, [...current, sym]);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-zinc-300">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase">Transition Inspector</span>
          <Badge variant={isSelfLoop ? 'accent' : 'default'} size="sm">
            {isSelfLoop ? 'Self Loop' : 'Directed'}
          </Badge>
        </div>
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight mt-1 flex items-center gap-2">
          <ArrowRight className="w-5 h-5 text-violet-400" />
          <span>Transition <span className="font-mono text-violet-300">{fromName} → {toName}</span></span>
        </h2>
      </div>

      {/* Endpoints Card */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400">Source State</span>
          <button
            onClick={() => setSelectedElement({ type: 'state', id: transition.from })}
            className="font-mono font-bold text-violet-300 hover:underline flex items-center gap-1"
          >
            {fromName}
            <CornerDownRight className="w-3 h-3 text-zinc-500" />
          </button>
        </div>

        <div className="h-px bg-zinc-800/80" />

        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-400">Target State</span>
          <button
            onClick={() => setSelectedElement({ type: 'state', id: transition.to })}
            className="font-mono font-bold text-violet-300 hover:underline flex items-center gap-1"
          >
            {toName}
            <CornerDownRight className="w-3 h-3 text-zinc-500" />
          </button>
        </div>
      </div>

      {/* Symbol Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-400">Transition Symbol(s)</label>
          <span className="text-[11px] text-zinc-500">Comma separated</span>
        </div>
        <input
          type="text"
          value={symbolsInput}
          onChange={(e) => setSymbolsInput(e.target.value)}
          onBlur={handleSymbolsBlur}
          onKeyDown={handleKeyDown}
          placeholder="e.g. 0, 1 or a, b"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2 font-mono text-sm text-zinc-100 placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        />

        {/* Symbol Helper Buttons */}
        <div className="flex items-center gap-1.5 pt-1">
          <span className="text-[11px] text-zinc-500 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-violet-400" /> Quick:
          </span>
          {['0', '1', 'a', 'b', 'ε'].map(sym => (
            <button
              key={sym}
              onClick={() => insertSymbol(sym)}
              className="rounded bg-zinc-800 hover:bg-zinc-700 px-2 py-0.5 text-xs font-mono text-zinc-300 border border-zinc-700 transition-colors"
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* Delete Transition Action */}
      <div className="pt-4 border-t border-zinc-800">
        <button
          onClick={() => deleteTransition(transition.id)}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete Transition
        </button>
      </div>
    </div>
  );
};
