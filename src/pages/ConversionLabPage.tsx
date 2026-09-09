import React, { useMemo, useState } from 'react';
import {
  Shuffle,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  PenTool,
  Sparkles,
  ListChecks
} from 'lucide-react';

import { useAutomataStore } from '../store/automataStore';
import { Badge } from '../components/common/Badge';
import { ReadOnlyAutomatonView } from '../components/conversion/ReadOnlyAutomatonView';
import { ENFA_SAMPLES, type ConversionSample } from '../components/conversion/sampleAutomata';
import { AUTOMATA_PRESETS } from '../engine/presets';
import {
  convert,
  uiAutomatonToFormal,
  formalAutomatonToUI,
  type AutomatonKind,
  type ConversionResult,
  type FormalAutomaton
} from '../engine/conversions';

import { autoSaveState } from '../engine/storage';

const KIND_LABELS: Record<AutomatonKind, string> = {
  REGEX: 'Regex',
  ENFA: 'ε-NFA',
  NFA: 'NFA',
  DFA: 'DFA'
};

const KIND_ORDER: AutomatonKind[] = ['REGEX', 'ENFA', 'NFA', 'DFA'];

function getTargetKinds(source: AutomatonKind): AutomatonKind[] {
  // Remove trivial DFA -> NFA and DFA -> ε-NFA conversions
  if (source === 'DFA') {
    return ['REGEX'];
  }
  return KIND_ORDER.filter(k => k !== source);
}

const DEFAULT_REGEX = '(a|b)*abb';

/** Returns the quick-test sample automata available for a given source kind. */
function getSamplesForKind(kind: AutomatonKind): ConversionSample[] {
  if (kind === 'ENFA') return ENFA_SAMPLES;
  if (kind === 'NFA') return AUTOMATA_PRESETS; // any DFA is also a valid NFA
  if (kind === 'DFA') return AUTOMATA_PRESETS.filter(p => p.category === 'DFA');
  return [];
}

/** Counts total transitions (symbol -> targets) inside a FormalAutomaton. */
function countTransitions(automaton: FormalAutomaton): number {
  let count = 0;
  for (const symMap of automaton.transitions.values()) {
    for (const targets of symMap.values()) {
      count += targets.size;
    }
  }
  return count;
}

export const ConversionLabPage: React.FC = () => {
  const setActivePage = useAutomataStore(s => s.setActivePage);
  const storeStates = useAutomataStore(s => s.states);
  const storeTransitions = useAutomataStore(s => s.transitions);
  const storeStartStateId = useAutomataStore(s => s.startStateId);
  const storeAcceptingStateIds = useAutomataStore(s => s.acceptingStateIds);

  const [sourceKind, setSourceKind] = useState<AutomatonKind>('REGEX');
  const [targetKind, setTargetKind] = useState<AutomatonKind>('ENFA');
  const [regexInput, setRegexInput] = useState(DEFAULT_REGEX);
  const [sourceMode, setSourceMode] = useState<'editor' | 'sample'>('sample');
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);

  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);

  const isRegexSource = sourceKind === 'REGEX';
  const isIdentical = sourceKind === targetKind;
  const trimmedRegex = regexInput.trim();

  const samples = useMemo(() => getSamplesForKind(sourceKind), [sourceKind]);
  const activeSample = samples.find(s => s.id === selectedSampleId) ?? samples[0] ?? null;

  const editorHasData = storeStates.length > 0;
  const sourceIsReady = isRegexSource
    ? trimmedRegex.length > 0
    : sourceMode === 'editor'
    ? editorHasData
    : !!activeSample;

  const canConvert = !isIdentical && sourceIsReady && !isConverting;

  const targetOptions = useMemo(() => getTargetKinds(sourceKind), [sourceKind]);

  const handleSourceKindChange = (kind: AutomatonKind) => {
    setSourceKind(kind);
    setSelectedSampleId(null);
    setResult(null);
    setError(null);
    const allowedTargets = getTargetKinds(kind);
    if (!allowedTargets.includes(targetKind)) {
      setTargetKind(allowedTargets[0]);
    }
  };

  const handleTargetKindChange = (kind: AutomatonKind) => {
    setTargetKind(kind);
    setResult(null);
    setError(null);
  };

  const buildSourceAutomaton = (): FormalAutomaton | null => {
    if (sourceMode === 'editor') {
      return uiAutomatonToFormal(
        storeStates,
        storeTransitions,
        storeStartStateId,
        storeAcceptingStateIds,
        sourceKind
      );
    }
    if (activeSample) {
      return uiAutomatonToFormal(
        activeSample.states,
        activeSample.transitions,
        activeSample.startStateId,
        activeSample.acceptingStateIds,
        sourceKind
      );
    }
    return null;
  };

  const handleConvert = () => {
    if (!canConvert) return;

    setError(null);
    setResult(null);
    setIsConverting(true);

    // Small delay purely so the loading state is visible; the conversions
    // themselves run synchronously and are effectively instant.
    window.setTimeout(() => {
      try {
        let conversionResult: ConversionResult;

        if (isRegexSource) {
          if (!trimmedRegex) {
            throw new Error('Please enter a regular expression.');
          }
          conversionResult = convert(trimmedRegex, 'REGEX', targetKind);
        } else {
          const formal = buildSourceAutomaton();
          if (!formal || formal.states.size === 0) {
            throw new Error(
              'The source automaton has no states. Add states in the Editor, or pick a sample.'
            );
          }
          if (!formal.startState) {
            throw new Error('The source automaton needs a start state set before it can be converted.');
          }
          conversionResult = convert(formal, sourceKind, targetKind);
        }

        if (!conversionResult.success) {
          setError(conversionResult.error || 'Conversion failed.');
        }
        setResult(conversionResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred during conversion.');
      } finally {
        setIsConverting(false);
      }
    }, 30);
  };

  const resultIsAutomaton = result && typeof result.result !== 'string';
  const resultAutomaton = resultIsAutomaton ? (result!.result as FormalAutomaton) : null;
  const resultUi = useMemo(() => {
    if (!resultAutomaton) return null;
    return formalAutomatonToUI(resultAutomaton);
  }, [resultAutomaton]);

  const resultStats = useMemo(() => {
    if (!result || !resultAutomaton) return null;
    return {
      states: resultAutomaton.states.size,
      transitions: countTransitions(resultAutomaton)
    };
  }, [result, resultAutomaton]);

  const handleLoadIntoEditor = () => {
    if (!resultUi || !resultAutomaton) return;
    useAutomataStore.getState().snapshotHistory();
    const kind = resultUi.kind === 'ENFA' ? 'ENFA' : resultUi.kind === 'NFA' ? 'NFA' : 'DFA';
    useAutomataStore.setState({
      states: resultUi.states,
      transitions: resultUi.transitions,
      startStateId: resultUi.startStateId,
      acceptingStateIds: resultUi.acceptingStateIds,
      automatonType: kind,
      selectedElement: null,
      simulationState: null,
      stateCounter: resultUi.states.length + 1,
    });
    autoSaveState(
      resultUi.states,
      resultUi.transitions,
      kind,
      resultUi.startStateId,
      resultUi.acceptingStateIds
    );
    useAutomataStore.getState().showToast('Converted automaton loaded into Editor', 'success');
    setActivePage('editor');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 p-8 flex flex-col items-center transition-colors duration-200">
      <div className="w-full max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Shuffle className="w-4 h-4" />
              <span>Equivalence &amp; Construction</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Conversion Lab</h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Convert between Regex, ε-NFA, NFA, and DFA representations using AutomataLab's conversion engine.
            </p>
          </div>

          <button
            onClick={() => setActivePage('editor')}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-zinc-300 font-medium text-xs text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 transition-colors cursor-pointer shadow-xs"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Open Editor</span>
          </button>
        </div>

        {/* Source / Target Selection */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-5 dark:border-zinc-800 dark:bg-zinc-900/60 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
                Source Type
              </label>
              <select
                value={sourceKind}
                onChange={e => handleSourceKindChange(e.target.value as AutomatonKind)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                {KIND_ORDER.map(kind => (
                  <option key={kind} value={kind}>
                    {KIND_LABELS[kind]}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden sm:flex items-center justify-center pb-2.5 text-zinc-400 dark:text-zinc-600">
              <ArrowRight className="w-5 h-5" />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
                Target Type
              </label>
              <select
                value={targetKind}
                onChange={e => handleTargetKindChange(e.target.value as AutomatonKind)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              >
                {targetOptions.map(kind => (
                  <option key={kind} value={kind}>
                    {KIND_LABELS[kind]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isIdentical && (
            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Source and target types must be different.</span>
            </div>
          )}

          <div className="flex justify-center pt-1">
            <button
              onClick={handleConvert}
              disabled={!canConvert}
              className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-lg cursor-pointer ${
                canConvert
                  ? 'bg-violet-600 text-white hover:bg-violet-500 shadow-violet-600/30'
                  : 'bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed shadow-none'
              }`}
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Converting…</span>
                </>
              ) : (
                <>
                  <Shuffle className="w-4 h-4" />
                  <span>Convert</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Source Automaton / Regex Input */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4 dark:border-zinc-800 dark:bg-zinc-900/60 shadow-xs">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Source Automaton</h2>

          {isRegexSource ? (
            <div className="space-y-2">
              <label className="block text-xs text-zinc-500">Regular expression</label>
              <input
                type="text"
                value={regexInput}
                onChange={e => {
                  setRegexInput(e.target.value);
                  setResult(null);
                  setError(null);
                }}
                placeholder="(a|b)*abb"
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-mono text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
              />
              <p className="text-[11px] text-zinc-500">
                Supports union (<code className="text-zinc-700 dark:text-zinc-400">|</code>), concatenation, Kleene star (
                <code className="text-zinc-700 dark:text-zinc-400">*</code>), and grouping with parentheses.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSourceMode('editor');
                    setResult(null);
                    setError(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    sourceMode === 'editor'
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:text-zinc-900 dark:bg-zinc-950 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  Use Current Editor Data
                </button>
                <button
                  onClick={() => {
                    setSourceMode('sample');
                    setResult(null);
                    setError(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                    sourceMode === 'sample'
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:text-zinc-900 dark:bg-zinc-950 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  Use a Sample
                </button>
              </div>

              {sourceMode === 'editor' ? (
                <div className="text-xs text-zinc-600 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2.5 dark:text-zinc-400 dark:bg-zinc-950 dark:border-zinc-800">
                  {editorHasData ? (
                    <span>
                      Using the current Editor automaton — treated as a <strong className="text-zinc-900 dark:text-zinc-200">{KIND_LABELS[sourceKind]}</strong>:{' '}
                      {storeStates.length} state{storeStates.length === 1 ? '' : 's'}, {storeTransitions.length} transition
                      {storeTransitions.length === 1 ? '' : 's'}.
                    </span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      The Editor canvas is currently empty. Add states there, or switch to a sample.
                    </span>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {samples.length === 0 ? (
                    <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      No built-in samples for {KIND_LABELS[sourceKind]} yet — use the Editor instead.
                    </p>
                  ) : (
                    <>
                      <select
                        value={activeSample?.id ?? ''}
                        onChange={e => {
                          setSelectedSampleId(e.target.value);
                          setResult(null);
                          setError(null);
                        }}
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                      >
                        {samples.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                      {activeSample && <p className="text-[11px] text-zinc-500">{activeSample.description}</p>}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Banner */}
        {error && (
          <div className="flex items-start gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3.5 text-sm text-rose-700 dark:text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Result */}
        {result && (
          <>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4 dark:border-zinc-800 dark:bg-zinc-900/60 shadow-xs">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Result</h2>
                {resultUi && (
                  <button
                    onClick={handleLoadIntoEditor}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Bring into Current Editor</span>
                  </button>
                )}
              </div>

              {typeof result.result === 'string' ? (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-6 flex items-center justify-center dark:border-zinc-800 dark:bg-zinc-950">
                  <span className="font-mono text-lg text-violet-700 dark:text-violet-300 break-all text-center">
                    {result.result || '(empty)'}
                  </span>
                </div>
              ) : resultUi ? (
                <div className="h-[420px]">
                  <ReadOnlyAutomatonView states={resultUi.states} transitions={resultUi.transitions} />
                </div>
              ) : null}
            </div>

            {/* Conversion Info */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60 shadow-xs">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-4">Conversion Info</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="text-[11px] text-zinc-500 mb-1">Source</div>
                  <Badge variant="outline">{KIND_LABELS[result.sourceKind]}</Badge>
                </div>
                <div>
                  <div className="text-[11px] text-zinc-500 mb-1">Target</div>
                  <Badge variant="accent">{KIND_LABELS[result.targetKind]}</Badge>
                </div>
                <div>
                  <div className="text-[11px] text-zinc-500 mb-1">Status</div>
                  {result.success ? (
                    <Badge variant="success">
                      <CheckCircle2 className="w-3 h-3" /> Success
                    </Badge>
                  ) : (
                    <Badge variant="error">
                      <AlertTriangle className="w-3 h-3" /> Failed
                    </Badge>
                  )}
                </div>
                {resultStats && (
                  <div>
                    <div className="text-[11px] text-zinc-500 mb-1">States / Transitions</div>
                    <span className="font-mono text-sm text-zinc-900 dark:text-zinc-200">
                      {resultStats.states} / {resultStats.transitions}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Step-by-step */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-3 dark:border-zinc-800 dark:bg-zinc-900/60 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                <ListChecks className="w-3.5 h-3.5" />
                <span>Conversion Steps</span>
              </div>

              {result.steps.length === 0 ? (
                <p className="text-xs text-zinc-500">No step-by-step data was recorded for this conversion.</p>
              ) : (
                <div className="space-y-2.5">
                  {result.steps.map((step, i) => (
                    <div key={step.id} className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[11px] font-bold text-violet-600 dark:text-violet-400">Step {i + 1}</span>
                        {step.ruleApplied && (
                          <Badge variant="outline" size="sm">
                            {step.ruleApplied}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-zinc-900 dark:text-zinc-200 font-medium">{step.title}</p>
                      {step.description && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed whitespace-pre-line">
                          {step.description}
                        </p>
                      )}
                    </div>
                  ))}

                  <div className="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-3">
                    <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">Final Result</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
