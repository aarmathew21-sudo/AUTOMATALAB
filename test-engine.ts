import { createFormalAutomaton } from './src/engine/types';
import { validateAutomaton } from './src/engine/validation';
import { exportAutomatonToJSON, importAutomatonFromJSON } from './src/engine/serializer';
import { AUTOMATA_PRESETS } from './src/engine/presets';
import type { AutomatonState, AutomatonTransition } from './src/types/automata';

console.log('=== RUNNING AUTOMATALAB COMPREHENSIVE ENGINE TESTS ===\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`[FAIL] ${testName}`);
    throw new Error(`Test failed: ${testName}`);
  }
}

// 1. Test State Creation and Mathematical Definition
console.log('--- Test Suite 1: State & Transition Modeling ---');
const states: AutomatonState[] = [
  { id: 's0', name: 'q0', isStart: true, isAccepting: false, x: 100, y: 100 },
  { id: 's1', name: 'q1', isStart: false, isAccepting: true, x: 300, y: 100 }
];

const transitions: AutomatonTransition[] = [
  { id: 't0', from: 's0', to: 's0', symbols: ['0'] },
  { id: 't1', from: 's0', to: 's1', symbols: ['1'] },
  { id: 't2', from: 's1', to: 's0', symbols: ['0', '1'] }
];

const formal = createFormalAutomaton(states, transitions, 'DFA', 's0', ['s1']);
assert(formal.states.size === 2, 'Formal automaton has 2 states');
assert(formal.alphabet.has('0') && formal.alphabet.has('1') && formal.alphabet.size === 2, 'Alphabet is {0, 1}');
assert(formal.startState === 's0', 'Start state is s0');
assert(formal.acceptingStates.has('s1'), 'Accepting state is s1');

// 2. Test DFA Validation
console.log('\n--- Test Suite 2: DFA Mathematical Validation ---');
const validation = validateAutomaton(states, transitions, 'DFA', 's0', ['s1']);
assert(validation.isValid, 'Automaton is valid DFA');
assert(validation.isDeterministic, 'Automaton is deterministic');
assert(validation.alphabet.join('') === '01', 'Alphabet extracted correctly as 0, 1');
assert(validation.unreachableStates.length === 0, 'No unreachable states');

// Test non-deterministic condition (multiple transitions on same symbol in DFA)
const nfaTransitions: AutomatonTransition[] = [
  { id: 't0', from: 's0', to: 's0', symbols: ['0'] },
  { id: 't1', from: 's0', to: 's1', symbols: ['0'] } // 2 transitions from s0 on '0'
];
const nfaValidation = validateAutomaton(states, nfaTransitions, 'DFA', 's0', ['s1']);
assert(!nfaValidation.isDeterministic, 'Correctly detects non-determinism in DFA');

// 3. Test JSON Export and Import
console.log('\n--- Test Suite 3: JSON Import & Export Serialization ---');
const exportedJSON = exportAutomatonToJSON(states, transitions, 'DFA', 's0', ['s1'], 'Test Model');
const parsed = JSON.parse(exportedJSON);
assert(parsed.type === 'DFA', 'Exported JSON has type DFA');
assert(parsed.states.length === 2, 'Exported JSON contains 2 states');
assert(parsed.transitions.length === 3, 'Exported JSON contains 3 transitions');
assert(parsed.startState === 'q0', 'Exported JSON maps startState ID to name "q0"');
assert(parsed.acceptingStates[0] === 'q1', 'Exported JSON maps acceptingStates ID to name "q1"');

const importResult = importAutomatonFromJSON(exportedJSON);
assert(importResult.success, 'Import succeeded');
assert(importResult.states.length === 2, 'Imported 2 states');
assert(importResult.transitions.length === 3, 'Imported 3 transitions');
assert(importResult.startStateId !== null, 'Import restored start state');
assert(importResult.acceptingStateIds.length === 1, 'Import restored accepting states');

// 4. Test Presets
console.log('\n--- Test Suite 4: Built-in Presets ---');
assert(AUTOMATA_PRESETS.length === 4, '4 standard educational presets defined');
for (const preset of AUTOMATA_PRESETS) {
  const v = validateAutomaton(preset.states, preset.transitions, preset.type, preset.startStateId, preset.acceptingStateIds);
  assert(v.stateCount > 0, `Preset "${preset.name}" has states`);
  assert(v.transitionCount > 0, `Preset "${preset.name}" has transitions`);
  assert(v.startState !== null, `Preset "${preset.name}" has valid start state`);
  assert(v.acceptingStates.length > 0, `Preset "${preset.name}" has valid accept state(s)`);
}

console.log(`\n==============================================`);
console.log(`ALL ${passedTests}/${totalTests} TESTS PASSED PERFECTLY!`);
console.log(`==============================================`);
