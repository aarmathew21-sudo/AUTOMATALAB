import React from 'react';
import { LeftToolbar } from '../components/toolbar/LeftToolbar';
import { AutomataCanvas } from '../components/canvas/AutomataCanvas';
import { RightInspector } from '../components/inspector/RightInspector';

export const EditorPage: React.FC = () => {
  return (
    <div className="flex-1 flex overflow-hidden w-full h-[calc(100vh-3.5rem)] relative">
      {/* Left Toolbar */}
      <LeftToolbar />

      {/* Center Canvas */}
      <main className="flex-1 h-full relative overflow-hidden bg-slate-50 dark:bg-zinc-950">
        <AutomataCanvas />
      </main>

      {/* Right Inspector */}
      <RightInspector />
    </div>
  );
};
