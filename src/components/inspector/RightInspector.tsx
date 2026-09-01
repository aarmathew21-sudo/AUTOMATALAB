import React from 'react';
import { useAutomataStore } from '../../store/automataStore';
import { AutomatonInspector } from './AutomatonInspector';
import { StateInspector } from './StateInspector';
import { TransitionInspector } from './TransitionInspector';

export const RightInspector: React.FC = () => {
  const selectedElement = useAutomataStore(s => s.selectedElement);

  return (
    <aside className="w-80 border-l border-zinc-200 bg-white/90 dark:border-zinc-800 dark:bg-zinc-900/90 backdrop-blur-md flex flex-col h-full overflow-y-auto select-none z-20 shrink-0 p-5 transition-colors duration-200">
      {selectedElement?.type === 'state' ? (
        <StateInspector stateId={selectedElement.id} />
      ) : selectedElement?.type === 'transition' ? (
        <TransitionInspector transitionId={selectedElement.id} />
      ) : (
        <AutomatonInspector />
      )}
    </aside>
  );
};
