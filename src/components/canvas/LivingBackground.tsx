import React from 'react';
import { useAutomataStore } from '../../store/automataStore';

export const LivingBackground: React.FC = () => {
  const canvasSettings = useAutomataStore(s => s.canvasSettings);
  const { backgroundTheme } = canvasSettings;

  // Clean, professional palettes for light and dark modes
  const themeStyles = {
    nebula: 'bg-violet-50/40 dark:bg-[#09090d]',
    midnight: 'bg-sky-50/40 dark:bg-[#060813]',
    graph: 'bg-slate-100/60 dark:bg-[#070b12]',
    minimal: 'bg-white dark:bg-[#09090b]'
  };

  return (
    <div className={`absolute inset-0 pointer-events-none transition-colors duration-300 ${themeStyles[backgroundTheme]}`} />
  );
};
