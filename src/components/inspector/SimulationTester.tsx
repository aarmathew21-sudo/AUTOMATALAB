import React, { useState, useEffect, useRef } from 'react';
import { useAutomataStore } from '../../store/automataStore';
import { Play, RotateCcw, StepForward, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { Badge } from '../common/Badge';

export const SimulationTester: React.FC = () => {
  const states = useAutomataStore(s => s.states);
  const startStateId = useAutomataStore(s => s.startStateId);
  const simulationState = useAutomataStore(s => s.simulationState);
  const startSimulation = useAutomataStore(s => s.startSimulation);
  const stepSimulationForward = useAutomataStore(s => s.stepSimulationForward);
  const resetSimulation = useAutomataStore(s => s.resetSimulation);

  const [inputVal, setInputVal] = useState('01');
  const [autoRun, setAutoRun] = useState(false);
  const autoRunTimerRef = useRef<number | null>(null);

  const handleStartOrStep = () => {
    if (!simulationState) {
      startSimulation(inputVal);
    } else {
      stepSimulationForward();
    }
  };

  const handleReset = () => {
    setAutoRun(false);
    resetSimulation();
  };

  // Auto-play timer
  useEffect(() => {
    if (autoRun && simulationState && simulationState.isRunning) {
      autoRunTimerRef.current = window.setTimeout(() => {
        stepSimulationForward();
      }, 700);
    } else if (autoRun && simulationState && !simulationState.isRunning) {
      setAutoRun(false);
    }

    return () => {
      if (autoRunTimerRef.current) clearTimeout(autoRunTimerRef.current);
    };
  }, [autoRun, simulationState, stepSimulationForward]);

  const stateMap = new Map(states.map(s => [s.id, s.name]));
  const hasStartState = Boolean(startStateId);

  return (
    <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/70 p-4 backdrop-blur-md shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
          Interactive String Tester
        </span>
        {simulationState && (
          <Badge
            variant={
              simulationState.status === 'accepted'
                ? 'success'
                : simulationState.status === 'rejected'
                ? 'error'
                : 'accent'
            }
            size="sm"
          >
            {simulationState.status.toUpperCase()}
          </Badge>
        )}
      </div>

      {/* Input String Field */}
      <div className="space-y-1.5">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.target.value);
            if (simulationState) resetSimulation();
          }}
          disabled={Boolean(simulationState?.isRunning)}
          placeholder="e.g. 0101 or 110"
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 font-mono text-xs text-zinc-900 placeholder-zinc-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-600"
        />
      </div>

      {/* Interactive Tape Visualization */}
      {simulationState && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 space-y-2 dark:border-zinc-800 dark:bg-zinc-900/90 shadow-xs">
          <div className="text-[10px] text-zinc-500 font-mono flex items-center justify-between">
            <span>INPUT TAPE</span>
            <span>Index: {simulationState.currentIndex}/{simulationState.inputString.length}</span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto py-1">
            {simulationState.inputString.split('').map((char, idx) => {
              const isCurrent = idx === simulationState.currentIndex;
              const isPassed = idx < simulationState.currentIndex;
              return (
                <span
                  key={idx}
                  className={`w-7 h-7 rounded flex items-center justify-center font-mono text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-sky-500 text-white shadow-[0_0_10px_rgba(56,189,248,0.5)] scale-110'
                      : isPassed
                      ? 'bg-zinc-200 text-zinc-600 border border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700/60'
                      : 'bg-white text-zinc-400 border border-zinc-200 dark:bg-zinc-900 dark:text-zinc-600 dark:border-zinc-800'
                  }`}
                >
                  {char}
                </span>
              );
            })}
            {simulationState.inputString.length === 0 && (
              <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500 italic">ε (Empty String)</span>
            )}
          </div>

          {/* Active States Banner */}
          <div className="flex items-center justify-between pt-1 border-t border-zinc-200 dark:border-zinc-800 text-xs">
            <span className="text-zinc-500">Active State:</span>
            <div className="flex gap-1">
              {simulationState.currentStateIds.length > 0 ? (
                simulationState.currentStateIds.map(id => (
                  <Badge key={id} variant="accent" size="sm">
                    {stateMap.get(id) || id}
                  </Badge>
                ))
              ) : (
                <span className="text-rose-600 dark:text-rose-400 text-xs italic">Trapped / None</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <button
          onClick={handleStartOrStep}
          disabled={!hasStartState}
          className="flex items-center justify-center gap-1 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 py-1.5 text-xs font-semibold text-white shadow-md shadow-sky-600/30 transition-all cursor-pointer"
        >
          <StepForward className="w-3.5 h-3.5" />
          <span>{!simulationState ? 'Start' : 'Step'}</span>
        </button>

        <button
          onClick={() => {
            if (!simulationState) startSimulation(inputVal);
            setAutoRun(!autoRun);
          }}
          disabled={!hasStartState}
          className={`flex items-center justify-center gap-1 rounded-lg border py-1.5 text-xs font-semibold transition-all cursor-pointer ${
            autoRun
              ? 'bg-amber-600 text-white border-amber-500 shadow-md'
              : 'border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 shadow-xs'
          } disabled:opacity-40`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>{autoRun ? 'Pause' : 'Auto'}</span>
        </button>

        <button
          onClick={handleReset}
          disabled={!simulationState}
          className="flex items-center justify-center gap-1 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 py-1.5 text-xs font-semibold disabled:opacity-30 transition-all cursor-pointer shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {!hasStartState && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400 italic">Please designate a start state (q0) to test strings.</p>
      )}

      {/* Result Card */}
      {simulationState && !simulationState.isRunning && (
        <div
          className={`flex items-center gap-2 rounded-xl p-3 text-xs font-medium border transition-all animate-in fade-in duration-200 ${
            simulationState.status === 'accepted'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
          }`}
        >
          {simulationState.status === 'accepted' ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>String <strong>&quot;{simulationState.inputString}&quot;</strong> is ACCEPTED by the automaton.</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>String <strong>&quot;{simulationState.inputString}&quot;</strong> is REJECTED.</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
