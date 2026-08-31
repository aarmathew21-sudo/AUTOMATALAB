import React from 'react';
import { useAutomataStore } from '../../store/automataStore';

export const LivingBackground: React.FC = () => {
  const canvasSettings = useAutomataStore(s => s.canvasSettings);
  const { backgroundTheme } = canvasSettings;

  // Clean, professional, static dark palettes
  const themeStyles = {
    nebula: 'bg-[#09090d]',
    midnight: 'bg-[#060813]',
    graph: 'bg-[#070b12]',
    minimal: 'bg-[#09090b]'
  };

  return (
    <div className={`absolute inset-0 pointer-events-none transition-colors duration-300 ${themeStyles[backgroundTheme]}`} />
  );
};
