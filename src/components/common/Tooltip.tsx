import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  shortcut?: string;
  children: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  shortcut,
  children,
  side = 'right',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={`absolute ${sideClasses[side]} z-50 pointer-events-none whitespace-nowrap rounded-md bg-zinc-900/95 px-2.5 py-1 text-xs font-medium text-zinc-100 shadow-xl ring-1 ring-white/10 backdrop-blur-md transition-all duration-150 animate-in fade-in zoom-in-95`}
        >
          <div className="flex items-center gap-1.5">
            <span>{content}</span>
            {shortcut && (
              <kbd className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 border border-zinc-700">
                {shortcut}
              </kbd>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
