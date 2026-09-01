import React, { useState, useRef, useEffect } from 'react';
import { useAutomataStore } from '../../store/automataStore';
import { AUTOMATA_PRESETS } from '../../engine/presets';
import { Sparkles, ChevronDown } from 'lucide-react';
import { Badge } from '../common/Badge';

export const PresetsDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const loadPreset = useAutomataStore(s => s.loadPreset);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    loadPreset(id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:hover:border-zinc-700 transition-colors cursor-pointer shadow-xs"
      >
        <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
        <span>Presets</span>
        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 rounded-xl border border-zinc-200 bg-white/95 p-1.5 shadow-2xl backdrop-blur-md z-50 animate-in fade-in zoom-in-95 duration-150 dark:border-zinc-800 dark:bg-zinc-900/95">
          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Standard Automata Examples
          </div>
          <div className="space-y-1">
            {AUTOMATA_PRESETS.map(preset => (
              <button
                key={preset.id}
                onClick={() => handleSelect(preset.id)}
                className="w-full text-left p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex flex-col gap-1 group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
                    {preset.name}
                  </span>
                  <Badge variant={preset.type === 'DFA' ? 'accent' : 'default'} size="sm">
                    {preset.type}
                  </Badge>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">{preset.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
