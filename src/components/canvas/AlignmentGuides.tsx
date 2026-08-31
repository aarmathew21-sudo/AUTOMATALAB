import React from 'react';
import { useAutomataStore } from '../../store/automataStore';

export const AlignmentGuides: React.FC = () => {
  const guides = useAutomataStore(s => s.activeAlignmentGuides);

  if (guides.length === 0) return null;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
      {guides.map((guide, idx) => {
        if (guide.type === 'horizontal') {
          return (
            <line
              key={`h_${idx}`}
              x1={guide.start}
              y1={guide.coordinate + 28}
              x2={guide.end + 56}
              y2={guide.coordinate + 28}
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              className="opacity-75 drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]"
            />
          );
        } else {
          return (
            <line
              key={`v_${idx}`}
              x1={guide.coordinate + 28}
              y1={guide.start}
              x2={guide.coordinate + 28}
              y2={guide.end + 56}
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              className="opacity-75 drop-shadow-[0_0_6px_rgba(56,189,248,0.8)]"
            />
          );
        }
      })}
    </svg>
  );
};
