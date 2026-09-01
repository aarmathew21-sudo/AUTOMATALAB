import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'accent' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}) => {
  const variantStyles = {
    default: 'bg-zinc-100 text-zinc-700 border-zinc-300/80 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700/60',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
    warning: 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
    error: 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30',
    accent: 'bg-violet-50 text-violet-700 border-violet-300 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30',
    outline: 'bg-transparent text-zinc-600 border-zinc-300 dark:text-zinc-400 dark:border-zinc-700/80'
  };

  const sizeStyles = {
    sm: 'text-[11px] px-1.5 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border tracking-tight ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
