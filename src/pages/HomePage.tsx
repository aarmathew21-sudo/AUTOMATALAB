import React from 'react';
import { useAutomataStore } from '../store/automataStore';
import { 
  ArrowRight, 
  Sparkles, 
  Layers, 
  Play, 
  ShieldCheck, 
  Shuffle, 
  Minimize2, 
  GraduationCap, 
  Code2
} from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const HomePage: React.FC = () => {
  const setActivePage = useAutomataStore(s => s.setActivePage);
  const loadPreset = useAutomataStore(s => s.loadPreset);

  const featureCards = [
    {
      title: 'Visual Automata Designer',
      description: 'Create states, transitions, self-loops, and multi-symbol edges with fluid drag-and-drop mechanics.',
      icon: <Layers className="w-6 h-6 text-violet-400" />,
      badge: 'Interactive',
      buttonText: 'Open Editor',
      onClick: () => setActivePage('editor')
    },
    {
      title: 'Step-by-Step Simulation',
      description: 'Trace input strings step-by-step with live highlighted active state paths and instant acceptance results.',
      icon: <Play className="w-6 h-6 text-emerald-400" />,
      badge: 'Simulation',
      buttonText: 'Test Simulation',
      onClick: () => {
        loadPreset('ends-with-01');
        setActivePage('editor');
      }
    },
    {
      title: 'DFA / NFA Analysis',
      description: 'Automatic 5-tuple verification, determinism diagnostics, alphabet extraction, and dead-state detection.',
      icon: <ShieldCheck className="w-6 h-6 text-blue-400" />,
      badge: 'Formal Math',
      buttonText: 'Run Diagnostics',
      onClick: () => setActivePage('editor')
    },
    {
      title: 'Automata Conversion',
      description: 'Convert between Regex, ε-NFA, NFA, and DFA representations with step-by-step construction algorithms.',
      icon: <Shuffle className="w-6 h-6 text-amber-400" />,
      badge: 'Algorithms',
      buttonText: 'Open Conversion Lab',
      onClick: () => setActivePage('convert')
    },
    {
      title: 'DFA Minimization & Models',
      description: 'Explore canonical automata models, parity checkers, modulo binary counters, and minimal states.',
      icon: <Minimize2 className="w-6 h-6 text-rose-400" />,
      badge: 'Models',
      buttonText: 'Try Presets',
      onClick: () => {
        loadPreset('divisible-by-3');
        setActivePage('editor');
      }
    },
    {
      title: 'Interactive Challenges',
      description: 'Structured theory exercises and hands-on practice challenges tailored for computer scientists.',
      icon: <GraduationCap className="w-6 h-6 text-indigo-400" />,
      badge: 'Practice',
      buttonText: 'Start Challenges',
      onClick: () => setActivePage('practice')
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 flex flex-col items-center transition-colors duration-200">
      {/* Hero Section */}
      <section className="relative w-full max-w-6xl px-6 pt-20 pb-16 flex flex-col items-center text-center">
        {/* Background glow gradient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-violet-500/10 dark:bg-violet-600/15 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Announcement Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-xs font-medium text-violet-700 dark:text-violet-300 mb-8 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
          <span>Next-Generation Theory of Computation Tool</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 max-w-4xl leading-[1.1]">
          AutomataLab
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-xl sm:text-2xl font-medium text-violet-600 dark:text-violet-400 tracking-tight">
          Interactive Theory of Computation Visualizer
        </p>

        {/* Description */}
        <p className="mt-6 text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
          Design, simulate, analyze and transform finite automata visually. Built with mathematical rigor, designed for modern computer science.
        </p>

        {/* Primary Call to Action */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => setActivePage('editor')}
            className="group relative inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-violet-600 font-semibold text-sm text-white shadow-xl shadow-violet-600/30 hover:bg-violet-500 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span>Open Automata Lab</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => {
              loadPreset('ends-with-01');
              setActivePage('editor');
            }}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-zinc-300 bg-white font-medium text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white dark:hover:border-zinc-700 transition-colors cursor-pointer shadow-xs"
          >
            <Code2 className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span>Try Sample DFA</span>
          </button>
        </div>

        {/* Interactive Visual Preview Box */}
        <div className="mt-16 w-full max-w-4xl rounded-2xl border border-zinc-200 bg-white/80 dark:border-zinc-800/80 dark:bg-zinc-900/60 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4 mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 font-mono text-xs text-zinc-500 dark:text-zinc-400">DFA Model: M = (Q, Σ, δ, q₀, F)</span>
            </div>
            <Badge variant="success" size="sm">Deterministic & Complete</Badge>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-4">
            {/* Visual Mini Mock Node q0 */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative flex items-center justify-center w-14 h-14 rounded-full border-2 border-violet-500 bg-violet-50 text-violet-900 dark:border-violet-400 dark:bg-violet-950/60 dark:text-violet-200 font-mono font-bold shadow-sm">
                <span className="absolute -left-10 text-[10px] text-violet-600 dark:text-violet-400 font-mono flex items-center">Start →</span>
                q0
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">Initial State</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="font-mono text-xs font-bold text-zinc-700 bg-zinc-100 border-zinc-300 dark:text-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 px-3 py-1 rounded-full border shadow-xs">
                δ(q0, 0) → q1
              </div>
              <ArrowRight className="w-6 h-6 text-zinc-400 dark:text-zinc-600 my-1" />
            </div>

            {/* Visual Mini Mock Node q1 */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-center w-14 h-14 rounded-full border-2 border-zinc-400 bg-white text-zinc-900 dark:border-zinc-500 dark:bg-zinc-900 dark:text-zinc-200 font-mono font-bold shadow-sm">
                q1
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">Middle State</span>
            </div>

            <div className="flex flex-col items-center">
              <div className="font-mono text-xs font-bold text-zinc-700 bg-zinc-100 border-zinc-300 dark:text-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 px-3 py-1 rounded-full border shadow-xs">
                δ(q1, 1) → q2
              </div>
              <ArrowRight className="w-6 h-6 text-zinc-400 dark:text-zinc-600 my-1" />
            </div>

            {/* Visual Mini Mock Node q2 (Accepting) */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative flex items-center justify-center w-14 h-14 rounded-full border-2 border-emerald-500 bg-emerald-50 text-emerald-900 dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-200 font-mono font-bold shadow-sm">
                <div className="absolute w-11 h-11 rounded-full border-2 border-emerald-500 dark:border-emerald-400" />
                q2
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">Accepting State (F)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="w-full max-w-6xl px-6 py-16 border-t border-zinc-200 dark:border-zinc-800/80">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Comprehensive Theoretical Toolkit
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
            Engineered for educators, students, and computational researchers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureCards.map((card, index) => (
            <div
              key={index}
              onClick={card.onClick}
              className="group relative rounded-2xl border border-zinc-200 bg-white p-6 flex flex-col justify-between transition-all duration-200 hover:border-zinc-300 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80 cursor-pointer shadow-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 group-hover:scale-105 transition-transform">
                    {card.icon}
                  </div>
                  <Badge variant="outline" size="sm">
                    {card.badge}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-300 transition-colors">
                  {card.title}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{card.description}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs font-semibold text-violet-600 dark:text-violet-400 group-hover:text-violet-700 dark:group-hover:text-violet-300">
                <span>{card.buttonText}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-900 py-8 text-center text-xs text-zinc-500 dark:text-zinc-600">
        <p>AutomataLab &copy; {new Date().getFullYear()} &bull; Interactive Theory of Computation Visualizer</p>
      </footer>
    </div>
  );
};
