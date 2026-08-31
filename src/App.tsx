import { useEffect } from 'react';
import { useAutomataStore } from './store/automataStore';
import { TopNavbar } from './components/navbar/TopNavbar';
import { HomePage } from './pages/HomePage';
import { EditorPage } from './pages/EditorPage';
import { PracticePage } from './pages/PracticePage';
import { LearnPage } from './pages/LearnPage';
import { Toast } from './components/common/Toast';

export function App() {
  const activePage = useAutomataStore(s => s.activePage);
  const setActiveTool = useAutomataStore(s => s.setActiveTool);
  const undo = useAutomataStore(s => s.undo);
  const redo = useAutomataStore(s => s.redo);
  const saveToStorage = useAutomataStore(s => s.saveToStorage);
  const selectedElement = useAutomataStore(s => s.selectedElement);
  const deleteState = useAutomataStore(s => s.deleteState);
  const deleteTransition = useAutomataStore(s => s.deleteTransition);
  const toggleStartState = useAutomataStore(s => s.toggleStartState);
  const toggleAcceptingState = useAutomataStore(s => s.toggleAcceptingState);
  const setSelectedElement = useAutomataStore(s => s.setSelectedElement);
  const setTransitionSourceId = useAutomataStore(s => s.setTransitionSourceId);
  const showToast = useAutomataStore(s => s.showToast);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing inside input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Undo: Ctrl+Z or Cmd+Z (without Shift)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        e.preventDefault();
        redo();
        return;
      }

      // Save: Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveToStorage();
        return;
      }

      // Delete key: delete selected element
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElement) {
          e.preventDefault();
          if (selectedElement.type === 'state') {
            deleteState(selectedElement.id);
            showToast('State deleted', 'info');
          } else if (selectedElement.type === 'transition') {
            deleteTransition(selectedElement.id);
            showToast('Transition deleted', 'info');
          }
        }
        return;
      }

      // Escape: reset tool to select & clear draft
      if (e.key === 'Escape') {
        setActiveTool('select');
        setSelectedElement(null);
        setTransitionSourceId(null);
        return;
      }

      // Direct Tool Shortcuts (V, S, T, I, A, D)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'v':
            setActiveTool('select');
            setTransitionSourceId(null);
            showToast('Tool: Select & Move (V)', 'info');
            break;

          case 's':
            setActiveTool('add-state');
            setTransitionSourceId(null);
            showToast('Tool: Add State (S) — Click canvas to add state', 'info');
            break;

          case 't':
            setActiveTool('add-transition');
            if (selectedElement && selectedElement.type === 'state') {
              setTransitionSourceId(selectedElement.id);
              showToast('Tool: Add Transition (T) — Source selected, click target state', 'info');
            } else {
              setTransitionSourceId(null);
              showToast('Tool: Add Transition (T) — Click source then target state', 'info');
            }
            break;

          case 'i':
            if (selectedElement && selectedElement.type === 'state') {
              toggleStartState(selectedElement.id);
              showToast('Toggled Start State on selected state', 'success');
            } else {
              setActiveTool('set-start');
              setTransitionSourceId(null);
              showToast('Tool: Set Start State (I) — Click any state to toggle start (q0)', 'info');
            }
            break;

          case 'a':
            if (selectedElement && selectedElement.type === 'state') {
              toggleAcceptingState(selectedElement.id);
              showToast('Toggled Accepting State on selected state', 'success');
            } else {
              setActiveTool('toggle-accepting');
              setTransitionSourceId(null);
              showToast('Tool: Toggle Accepting (A) — Click any state to toggle double circle', 'info');
            }
            break;

          case 'd':
            if (selectedElement) {
              if (selectedElement.type === 'state') {
                deleteState(selectedElement.id);
                showToast('Deleted selected state', 'info');
              } else if (selectedElement.type === 'transition') {
                deleteTransition(selectedElement.id);
                showToast('Deleted selected transition', 'info');
              }
            } else {
              setActiveTool('delete');
              setTransitionSourceId(null);
              showToast('Tool: Delete (D) — Click any state or transition to delete', 'info');
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    undo,
    redo,
    saveToStorage,
    selectedElement,
    deleteState,
    deleteTransition,
    toggleStartState,
    toggleAcceptingState,
    setActiveTool,
    setSelectedElement,
    setTransitionSourceId,
    showToast
  ]);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-zinc-950 text-zinc-100 antialiased">
      {/* Top Navbar */}
      <TopNavbar />

      {/* Main Page Content */}
      <div className="flex-1 flex overflow-hidden">
        {activePage === 'home' && <HomePage />}
        {activePage === 'editor' && <EditorPage />}
        {activePage === 'practice' && <PracticePage />}
        {activePage === 'learn' && <LearnPage />}
      </div>

      {/* Global Toast Notification System */}
      <Toast />
    </div>
  );
}

export default App;
