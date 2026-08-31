import React, { useMemo } from 'react';
import { useAutomataStore } from '../../store/automataStore';
import { validateAutomaton } from '../../engine/validation';
import { Badge } from '../common/Badge';
import { SimulationTester } from './SimulationTester';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Hash, 
  ArrowRight, 
  CheckCircle,
  Trash2
} from 'lucide-react';

export const AutomatonInspector: React.FC = () => {
  const states = useAutomataStore(s => s.states);
  const transitions = useAutomataStore(s => s.transitions);
  const automatonType = useAutomataStore(s => s.automatonType);
  const startStateId = useAutomataStore(s => s.startStateId);
  const acceptingStateIds = useAutomataStore(s => s.acceptingStateIds);
  const setAutomatonType = useAutomataStore(s => s.setAutomatonType);
  const clearCanvas = useAutomataStore(s => s.clearCanvas);

  const validation = useMemo(() => {
    return validateAutomaton(states, transitions, automatonType, startStateId, acceptingStateIds);
  }, [states, transitions, automatonType, startStateId, acceptingStateIds]);

  const stateMap = useMemo(() => new Map(states.map(s => [s.id, s.name])), [states]);
  const startStateName = startStateId ? stateMap.get(startStateId) || 'None' : 'None';

  return (
    <div className="flex flex-col gap-6 text-zinc-300">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase">Automaton Overview</span>
          <Badge variant={automatonType === 'DFA' ? 'accent' : 'default'} size="sm">
            {automatonType}
          </Badge>
        </div>
        <h2 className="text-xl font-bold text-zinc-100 tracking-tight mt-1">Formal Specification</h2>
      </div>

      {/* Model Type Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-400">Model Type</label>
        <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          <button
            onClick={() => setAutomatonType('DFA')}
            className={`py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
              automatonType === 'DFA'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            DFA (Deterministic)
          </button>
          <button
            onClick={() => setAutomatonType('NFA')}
            className={`py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
              automatonType === 'NFA'
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            NFA (Non-Deterministic)
          </button>
        </div>
      </div>

      {/* Interactive Live String Simulation Tester */}
      <SimulationTester />

      {/* 5-Tuple Mathematical Metric Summary */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
        <div className="flex items-center justify-between text-xs py-1 border-b border-zinc-800/80">
          <span className="flex items-center gap-2 text-zinc-400">
            <Layers className="w-3.5 h-3.5 text-violet-400" />
            States (Q)
          </span>
          <span className="font-mono font-bold text-zinc-200">{validation.stateCount}</span>
        </div>

        <div className="flex items-center justify-between text-xs py-1 border-b border-zinc-800/80">
          <span className="flex items-center gap-2 text-zinc-400">
            <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
            Transitions (δ)
          </span>
          <span className="font-mono font-bold text-zinc-200">{validation.transitionCount}</span>
        </div>

        <div className="flex items-center justify-between text-xs py-1 border-b border-zinc-800/80">
          <span className="flex items-center gap-2 text-zinc-400">
            <Hash className="w-3.5 h-3.5 text-emerald-400" />
            Alphabet (Σ)
          </span>
          <span className="font-mono font-bold text-zinc-200">
            {validation.alphabet.length > 0 ? `{ ${validation.alphabet.join(', ')} }` : '∅'}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs py-1 border-b border-zinc-800/80">
          <span className="flex items-center gap-2 text-zinc-400">
            <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
            Start State (q₀)
          </span>
          <span className="font-mono font-bold text-zinc-200">
            {startStateName !== 'None' ? (
              <Badge variant="accent" size="sm">{startStateName}</Badge>
            ) : (
              <span className="text-zinc-500 italic">None</span>
            )}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs py-1">
          <span className="flex items-center gap-2 text-zinc-400">
            <CheckCircle className="w-3.5 h-3.5 text-rose-400" />
            Accepting States (F)
          </span>
          <div className="flex items-center gap-1">
            {validation.acceptingStates.length > 0 ? (
              <div className="flex flex-wrap gap-1 justify-end max-w-[120px]">
                {validation.acceptingStates.map(name => (
                  <Badge key={name} variant="success" size="sm">{name}</Badge>
                ))}
              </div>
            ) : (
              <span className="text-zinc-500 italic">0 (∅)</span>
            )}
          </div>
        </div>
      </div>

      {/* Automaton Validation Status */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-400">Analysis & Integrity</span>
          {validation.isValid && validation.isDeterministic ? (
            <Badge variant="success" size="sm">Valid DFA</Badge>
          ) : automatonType === 'NFA' && validation.isValid ? (
            <Badge variant="accent" size="sm">Valid NFA</Badge>
          ) : (
            <Badge variant="warning" size="sm">Attention Required</Badge>
          )}
        </div>

        {validation.warnings.length > 0 && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-1.5">
            {validation.warnings.map((warn, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-amber-400/90">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{warn}</span>
              </div>
            ))}
          </div>
        )}

        {validation.errors.length > 0 && (
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 space-y-1.5">
            {validation.errors.map((err, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{err}</span>
              </div>
            ))}
          </div>
        )}

        {validation.warnings.length === 0 && validation.errors.length === 0 && states.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Automaton is mathematically consistent and fully defined.</span>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="pt-4 border-t border-zinc-800 space-y-2">
        <button
          onClick={clearCanvas}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/20 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Clear Entire Canvas
        </button>
      </div>
    </div>
  );
};
