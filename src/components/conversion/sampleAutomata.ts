import type { AutomatonState, AutomatonTransition } from '../../types/automata';

export interface ConversionSample {
  id: string;
  name: string;
  description: string;
  states: AutomatonState[];
  transitions: AutomatonTransition[];
  startStateId: string;
  acceptingStateIds: string[];
}

/**
 * The existing AUTOMATA_PRESETS (src/engine/presets.ts) only cover DFA and
 * NFA categories. The Conversion Lab needs an ε-NFA sample too so ε-NFA can
 * be picked as a source and converted immediately without using the editor.
 * This is plain UI sample data — no engine/algorithm code.
 */
export const ENFA_SAMPLES: ConversionSample[] = [
  {
    id: 'enfa-a-star-b',
    name: 'a*b (ε-NFA)',
    description: 'Accepts zero or more "a"s followed by a single "b", built with an ε-transition.',
    states: [
      { id: 'p0', name: 'p0', isStart: true, isAccepting: false, x: 140, y: 200 },
      { id: 'p1', name: 'p1', isStart: false, isAccepting: false, x: 380, y: 200 },
      { id: 'p2', name: 'p2', isStart: false, isAccepting: true, x: 620, y: 200 }
    ],
    transitions: [
      { id: 'ee1', from: 'p0', to: 'p1', symbols: ['ε'] },
      { id: 'ee2', from: 'p1', to: 'p1', symbols: ['a'] },
      { id: 'ee3', from: 'p1', to: 'p2', symbols: ['b'] }
    ],
    startStateId: 'p0',
    acceptingStateIds: ['p2']
  }
];
