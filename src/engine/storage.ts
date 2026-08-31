import type { AutomatonState, AutomatonTransition, AutomatonType } from '../types/automata';
import { exportAutomatonToJSON, importAutomatonFromJSON, type ImportResult } from './serializer';

const STORAGE_KEY = 'automatalab_saved_automaton';
const AUTOSAVE_KEY = 'automatalab_autosave_state';

export interface SavedAutomatonState {
  states: AutomatonState[];
  transitions: AutomatonTransition[];
  type: AutomatonType;
  startStateId: string | null;
  acceptingStateIds: string[];
}

/**
 * Saves current automaton to localStorage under the persistent manual save slot
 */
export function saveAutomatonToStorage(
  states: AutomatonState[],
  transitions: AutomatonTransition[],
  type: AutomatonType,
  startStateId: string | null,
  acceptingStateIds: string[]
): boolean {
  try {
    const jsonStr = exportAutomatonToJSON(states, transitions, type, startStateId, acceptingStateIds);
    localStorage.setItem(STORAGE_KEY, jsonStr);
    return true;
  } catch (err) {
    console.error('Failed to save automaton to localStorage:', err);
    return false;
  }
}

/**
 * Loads automaton from localStorage persistent manual save slot
 */
export function loadAutomatonFromStorage(): ImportResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return importAutomatonFromJSON(raw);
  } catch (err) {
    console.error('Failed to load automaton from localStorage:', err);
    return null;
  }
}

/**
 * Saves autosave state to prevent data loss on page refresh
 */
export function autoSaveState(
  states: AutomatonState[],
  transitions: AutomatonTransition[],
  type: AutomatonType,
  startStateId: string | null,
  acceptingStateIds: string[]
): void {
  try {
    const jsonStr = exportAutomatonToJSON(states, transitions, type, startStateId, acceptingStateIds);
    localStorage.setItem(AUTOSAVE_KEY, jsonStr);
  } catch {
    // Silently ignore autosave quota errors
  }
}

/**
 * Loads the latest autosave state if available
 */
export function loadAutoSaveState(): ImportResult | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    return importAutomatonFromJSON(raw);
  } catch {
    return null;
  }
}

/**
 * Checks if a saved automaton exists in localStorage
 */
export function hasSavedAutomaton(): boolean {
  return Boolean(localStorage.getItem(STORAGE_KEY));
}
