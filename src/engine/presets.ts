import type { AutomatonState, AutomatonTransition, AutomatonType } from '../types/automata';

export interface AutomatonPreset {
  id: string;
  name: string;
  category: 'DFA' | 'NFA';
  description: string;
  type: AutomatonType;
  states: AutomatonState[];
  transitions: AutomatonTransition[];
  startStateId: string;
  acceptingStateIds: string[];
}

export const AUTOMATA_PRESETS: AutomatonPreset[] = [
  {
    id: 'ends-with-01',
    name: 'Strings Ending with "01"',
    category: 'DFA',
    description: 'Accepts all binary strings ending with the substring 01 over alphabet Σ = {0, 1}.',
    type: 'DFA',
    states: [
      { id: 'q0', name: 'q0', isStart: true, isAccepting: false, x: 150, y: 220 },
      { id: 'q1', name: 'q1', isStart: false, isAccepting: false, x: 380, y: 220 },
      { id: 'q2', name: 'q2', isStart: false, isAccepting: true, x: 610, y: 220 }
    ],
    transitions: [
      { id: 'e1', from: 'q0', to: 'q0', symbols: ['1'] },
      { id: 'e2', from: 'q0', to: 'q1', symbols: ['0'] },
      { id: 'e3', from: 'q1', to: 'q1', symbols: ['0'] },
      { id: 'e4', from: 'q1', to: 'q2', symbols: ['1'] },
      { id: 'e5', from: 'q2', to: 'q1', symbols: ['0'] },
      { id: 'e6', from: 'q2', to: 'q0', symbols: ['1'] }
    ],
    startStateId: 'q0',
    acceptingStateIds: ['q2']
  },
  {
    id: 'even-zeros',
    name: 'Even Number of 0s',
    category: 'DFA',
    description: 'Accepts any binary string that contains an even number of 0s.',
    type: 'DFA',
    states: [
      { id: 'q_even', name: 'q_even', isStart: true, isAccepting: true, x: 220, y: 220 },
      { id: 'q_odd', name: 'q_odd', isStart: false, isAccepting: false, x: 500, y: 220 }
    ],
    transitions: [
      { id: 'e1', from: 'q_even', to: 'q_even', symbols: ['1'] },
      { id: 'e2', from: 'q_even', to: 'q_odd', symbols: ['0'] },
      { id: 'e3', from: 'q_odd', to: 'q_odd', symbols: ['1'] },
      { id: 'e4', from: 'q_odd', to: 'q_even', symbols: ['0'] }
    ],
    startStateId: 'q_even',
    acceptingStateIds: ['q_even']
  },
  {
    id: 'divisible-by-3',
    name: 'Binary Divisible by 3',
    category: 'DFA',
    description: 'Accepts binary numbers whose value is divisible by 3 (q0: remainder 0, q1: remainder 1, q2: remainder 2).',
    type: 'DFA',
    states: [
      { id: 'r0', name: 'r0', isStart: true, isAccepting: true, x: 380, y: 120 },
      { id: 'r1', name: 'r1', isStart: false, isAccepting: false, x: 220, y: 340 },
      { id: 'r2', name: 'r2', isStart: false, isAccepting: false, x: 540, y: 340 }
    ],
    transitions: [
      { id: 'e1', from: 'r0', to: 'r0', symbols: ['0'] },
      { id: 'e2', from: 'r0', to: 'r1', symbols: ['1'] },
      { id: 'e3', from: 'r1', to: 'r2', symbols: ['0'] },
      { id: 'e4', from: 'r1', to: 'r0', symbols: ['1'] },
      { id: 'e5', from: 'r2', to: 'r1', symbols: ['0'] },
      { id: 'e6', from: 'r2', to: 'r2', symbols: ['1'] }
    ],
    startStateId: 'r0',
    acceptingStateIds: ['r0']
  },
  {
    id: 'nfa-contains-010',
    name: 'Contains Substring "010" (NFA)',
    category: 'NFA',
    description: 'Non-deterministic automaton accepting strings containing substring 010.',
    type: 'NFA',
    states: [
      { id: 's0', name: 's0', isStart: true, isAccepting: false, x: 140, y: 220 },
      { id: 's1', name: 's1', isStart: false, isAccepting: false, x: 330, y: 220 },
      { id: 's2', name: 's2', isStart: false, isAccepting: false, x: 520, y: 220 },
      { id: 's3', name: 's3', isStart: false, isAccepting: true, x: 710, y: 220 }
    ],
    transitions: [
      { id: 'e1', from: 's0', to: 's0', symbols: ['0', '1'] },
      { id: 'e2', from: 's0', to: 's1', symbols: ['0'] },
      { id: 'e3', from: 's1', to: 's2', symbols: ['1'] },
      { id: 'e4', from: 's2', to: 's3', symbols: ['0'] },
      { id: 'e5', from: 's3', to: 's3', symbols: ['0', '1'] }
    ],
    startStateId: 's0',
    acceptingStateIds: ['s3']
  }
];
