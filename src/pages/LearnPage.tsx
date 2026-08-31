import React from 'react';
import { useAutomataStore } from '../store/automataStore';
import { BookOpen, ArrowRight, CheckSquare } from 'lucide-react';
import { Badge } from '../components/common/Badge';

export const LearnPage: React.FC = () => {
  const setActivePage = useAutomataStore(s => s.setActivePage);

  const modules = [
    {
      id: 'dfa-basics',
      title: '1. Deterministic Finite Automata (DFA)',
      description: 'Understand the formal 5-tuple M = (Q, Σ, δ, q₀, F), state transitions, and how DFAs compute deterministic decision problems.',
      topics: ['Formal 5-Tuple Definition', 'Transition Functions (δ)', 'Language Recognition L(M)', 'Completeness Requirements']
    },
    {
      id: 'nfa-basics',
      title: '2. Non-Deterministic Automata (NFA)',
      description: 'Explore non-determinism, branching computational trees, ε-transitions, and the power of parallel state transitions.',
      topics: ['Non-deterministic Branches', 'Epsilon (ε) Transitions', 'Equivalence with DFAs', 'Power Sets of States']
    },
    {
      id: 'regular-expressions',
      title: '3. Regular Expressions & Kleene Theorem',
      description: 'The equivalence of regular expressions, DFAs, and NFAs. Thompson construction and subset construction algorithms.',
      topics: ['Kleene Algebra', 'Thompson Construction', 'Subset Construction Algorithm', 'State Minimization']
    },
    {
      id: 'pumping-lemma',
      title: '4. Non-Regular Languages & Pumping Lemma',
      description: 'Learn how to prove languages non-regular using the Pumping Lemma adversary game and the pigeonhole principle.',
      topics: ['Pigeonhole Principle in Automata', 'Pumping Lemma Formulation', 'Proof by Contradiction', 'Adversarial Strategy']
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 text-zinc-100 p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <BookOpen className="w-4 h-4" />
              <span>Theory Curriculum</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Theory of Computation Guide</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Comprehensive conceptual guides to master formal languages, finite state machines, and computational complexity.
            </p>
          </div>

          <button
            onClick={() => setActivePage('editor')}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 font-medium text-xs text-white hover:bg-violet-500 transition-colors shadow-lg shadow-violet-600/20"
          >
            <span>Open Automata Editor</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Modules List */}
        <div className="space-y-4">
          {modules.map(module => (
            <div
              key={module.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <h3 className="text-lg font-bold text-zinc-100">{module.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">{module.description}</p>
                </div>
                <Badge variant="accent" size="sm">Core Theory</Badge>
              </div>

              <div className="mt-5 pt-4 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {module.topics.map((topic, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-zinc-800/60"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                    <span className="truncate">{topic}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
