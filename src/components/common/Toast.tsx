import React, { useEffect } from 'react';
import { useAutomataStore } from '../../store/automataStore';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const toast = useAutomataStore(s => s.toast);
  const dismissToast = useAutomataStore(s => s.dismissToast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      dismissToast();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, dismissToast]);

  if (!toast) return null;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-400 shrink-0" />
  };

  const borders = {
    success: 'border-emerald-500/30 bg-zinc-900/90 text-zinc-200',
    error: 'border-rose-500/30 bg-zinc-900/90 text-zinc-200',
    warning: 'border-amber-500/30 bg-zinc-900/90 text-zinc-200',
    info: 'border-blue-500/30 bg-zinc-900/90 text-zinc-200'
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-lg border px-4 py-3 shadow-2xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className={`flex items-center gap-2.5 ${borders[toast.type]}`}>
        {icons[toast.type]}
        <span className="text-sm font-medium pr-2">{toast.message}</span>
        <button
          onClick={dismissToast}
          className="ml-auto text-zinc-400 hover:text-zinc-100 transition-colors p-0.5 rounded"
          aria-label="Dismiss toast"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
